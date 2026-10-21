import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Ctx } from "../context.ts";
import { config, integrations } from "../config.ts";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.ts";
import { body, email, id, pincode } from "../lib/validate.ts";
import { requireAdmin, requireUser, revokeUserSessions } from "../lib/auth.ts";
import { audit } from "../lib/audit.ts";
import { notify, sendEmail } from "../lib/notify.ts";
import { parseRange, salesMetrics, toCsv } from "../lib/analytics.ts";
import { ORDER_STATUS_LABELS, DELIVERY_STATUS_LABELS, transitionOrder } from "../lib/orders.ts";
import { cancelAndRefund, markRefundProcessed, startRefund } from "../lib/payments.ts";
import { approvedPartners, assignPartner, createShipment } from "../lib/fulfilment.ts";
import { allSettings, setSetting, SETTING_DEFAULTS, type SettingKey } from "../lib/settings.ts";
import { randomToken, sha256 } from "../lib/crypto.ts";
import { ROLES, type RoleKey } from "../lib/permissions.ts";
import { grantRole } from "./auth.ts";
import { ORDER_LIST_SQL, invoiceHtml, orderDetail, orderSummary } from "./orders.ts";
import { couponSchema, slugify } from "./owner.ts";

const isAdminAny = (c: Ctx) => {
  const u = requireUser(c);
  if (u.permissions.size === 0) throw forbidden();
  return u;
};

const settingSchemas: Record<SettingKey, z.ZodTypeAny> = {
  brand: z.object({
    name: z.string().trim().min(1).max(40),
    tagline: z.string().trim().max(80),
    supportingLine: z.string().trim().max(160),
    supportEmail: z.string().trim().email(),
    supportPhone: z.string().trim().max(20),
  }),
  homepage: z.object({
    announcement: z.string().trim().max(200),
    sections: z
      .array(z.object({ key: z.string().max(30), number: z.string().max(4), label: z.string().trim().min(1).max(40), description: z.string().trim().max(120), visible: z.boolean() }))
      .max(12),
  }),
  shipping: z.object({
    flatPaise: z.number().int().min(0).max(1_000_000),
    freeThresholdPaise: z.number().int().min(0),
    estimateDaysMin: z.number().int().min(0).max(60),
    estimateDaysMax: z.number().int().min(0).max(90),
    serviceablePincodePrefixes: z.array(z.string().regex(/^[1-9][0-9]{0,5}$/)).max(500),
  }),
  cod: z.object({ enabled: z.boolean(), maxOrderPaise: z.number().int().min(0) }),
  checkout: z.object({ requireVerifiedEmail: z.boolean(), paymentWindowMinutes: z.number().int().min(5).max(240) }),
  tax: z.object({ mode: z.literal("inclusive"), note: z.string().trim().max(200) }),
  delivery: z.object({ requireOtp: z.boolean() }),
  returns: z.object({ enabled: z.boolean() }),
  reviews: z.object({ requireModeration: z.boolean(), verifiedPurchaseOnly: z.boolean() }),
  maintenance: z.object({ enabled: z.boolean(), message: z.string().trim().max(300) }),
  features: z.object({ wishlist: z.boolean(), reviews: z.boolean(), coupons: z.boolean() }),
};

function adminCount(c: Ctx) {
  return c.get("db").get<{ n: number }>(
    "SELECT COUNT(*) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id WHERE r.key = 'platform_admin' AND u.status = 'active'",
  )!.n;
}

export const adminRoutes = new Hono<AppEnv>()
  .get("/dashboard", (c) => {
    isAdminAny(c);
    const db = c.get("db");
    const range = parseRange(c.req.query("from"), c.req.query("to"));
    const storeId = c.req.query("storeId") ? Number(c.req.query("storeId")) : null;
    const metrics = salesMetrics(db, storeId ? "o.store_id = ?" : "1", storeId ? [storeId] : [], range);
    const n = (sql: string, p: any[] = []) => db.get<{ n: number }>(sql, p)!.n;
    const roleCount = (k: RoleKey) => n("SELECT COUNT(*) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ?", [k]);
    const funnel = ["product_view", "add_to_cart", "checkout_submitted", "purchase"].map((name) => ({
      step: name,
      count: n("SELECT COUNT(*) n FROM analytics_events WHERE name = ? AND created_at BETWEEN ? AND ?", [name, range.from, range.to]),
    }));
    const topStores = db.all(
      `SELECT s.id, s.name, COUNT(o.id) AS orders, COALESCE(SUM(o.subtotal_paise - o.discount_paise - o.refunded_paise),0) AS net
         FROM stores s LEFT JOIN orders o ON o.store_id = s.id AND o.status NOT IN ('pending_payment','failed','expired','cancelled')
              AND COALESCE(o.placed_at, o.created_at) BETWEEN ? AND ?
        GROUP BY s.id ORDER BY net DESC LIMIT 6`,
      [range.from, range.to],
    );
    return c.json({
      metrics,
      counts: {
        users: n("SELECT COUNT(*) n FROM users WHERE status != 'deleted'"),
        customers: roleCount("customer"),
        storeOwners: roleCount("store_owner"),
        deliveryPartners: roleCount("delivery_partner"),
        stores: n("SELECT COUNT(*) n FROM stores"),
        pendingStores: n("SELECT COUNT(*) n FROM stores WHERE status = 'pending'"),
        products: n("SELECT COUNT(*) n FROM products WHERE status = 'active'"),
        pendingPayments: n("SELECT COUNT(*) n FROM checkouts WHERE status = 'pending'"),
        failedPayments: n("SELECT COUNT(*) n FROM checkouts WHERE status = 'failed' AND created_at BETWEEN ? AND ?", [range.from, range.to]),
        refundsPending: n("SELECT COUNT(*) n FROM refunds WHERE status IN ('pending','failed')"),
        returnsOpen: n("SELECT COUNT(*) n FROM return_requests WHERE status IN ('requested','approved','picked_up','received')"),
        activeDeliveries: n("SELECT COUNT(*) n FROM delivery_assignments WHERE closed_at IS NULL"),
        failedDeliveries: n("SELECT COUNT(*) n FROM delivery_assignments WHERE status = 'failed' AND closed_at IS NULL"),
        awaitingAssignment: n("SELECT COUNT(*) n FROM shipments WHERE status = 'awaiting_assignment'"),
        pendingPartners: n("SELECT COUNT(*) n FROM delivery_partners WHERE status = 'pending'"),
        lowStock: n("SELECT COUNT(*) n FROM inventory i JOIN product_variants v ON v.id = i.variant_id JOIN products p ON p.id = v.product_id WHERE p.status = 'active' AND i.on_hand - i.reserved <= i.low_stock_threshold"),
        pendingReviews: n("SELECT COUNT(*) n FROM reviews WHERE status = 'pending'"),
        openTickets: n("SELECT COUNT(*) n FROM support_tickets WHERE status IN ('open','pending')"),
      },
      funnel,
      topStores: topStores.map((s) => ({ id: s.id, name: s.name, orders: s.orders, netPaise: s.net })),
      zeroResultSearches: db.all("SELECT lower(query) AS query, COUNT(*) n FROM search_queries WHERE results = 0 GROUP BY lower(query) ORDER BY n DESC LIMIT 10"),
      recentActivity: db.all(
        "SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ORDER BY a.id DESC LIMIT 12",
      ),
      integrations: integrations(),
    });
  })

  // ── Users & roles ──
  .get("/users", (c) => {
    requireAdmin(c, "admin.users");
    const q = (c.req.query("q") ?? "").trim();
    const role = c.req.query("role");
    const status = c.req.query("status");
    const rows = c.get("db").all(
      `SELECT u.id, u.name, u.email, u.status, u.email_verified_at, u.created_at,
              (SELECT GROUP_CONCAT(r.key) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) AS roles,
              (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status NOT IN ('pending_payment','failed','expired')) AS orders
         FROM users u
        WHERE u.status != 'deleted' ${q ? "AND (u.name LIKE ? OR u.email LIKE ?)" : ""} ${status ? "AND u.status = ?" : ""}
              ${role ? "AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.key = ?)" : ""}
        ORDER BY u.created_at DESC LIMIT 300`,
      [...(q ? [`%${q}%`, `%${q}%`] : []), ...(status ? [status] : []), ...(role ? [role] : [])],
    );
    return c.json({ users: rows.map((r) => ({ ...r, roles: (r.roles ?? "").split(",").filter(Boolean), emailVerified: Boolean(r.email_verified_at) })) });
  })

  .get("/users/:id", (c) => {
    requireAdmin(c, "admin.users");
    const db = c.get("db");
    const u = db.get("SELECT id, name, email, phone, status, email_verified_at, created_at, failed_login_count, locked_until FROM users WHERE id = ?", [Number(c.req.param("id"))]);
    if (!u) throw notFound();
    return c.json({
      user: u,
      roles: db.all("SELECT r.key, ur.created_at, g.name AS granted_by FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN users g ON g.id = ur.granted_by WHERE ur.user_id = ?", [u.id]),
      stores: db.all("SELECT s.id, s.name, m.member_role FROM store_members m JOIN stores s ON s.id = m.store_id WHERE m.user_id = ?", [u.id]),
      partner: db.get("SELECT * FROM delivery_partners WHERE user_id = ?", [u.id]) ?? null,
      orders: db.all(`${ORDER_LIST_SQL} WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 20`, [u.id]).map(orderSummary),
      sessions: db.get<{ n: number }>("SELECT COUNT(*) n FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?", [u.id, new Date().toISOString()])!.n,
      security: db.all("SELECT action, ip, created_at FROM audit_logs WHERE actor_user_id = ? AND action LIKE 'auth.%' ORDER BY id DESC LIMIT 20", [u.id]),
    });
  })

  .post("/users/:id/status", async (c) => {
    const admin = requireAdmin(c, "admin.users");
    const { status, reason } = await body(c, z.object({ status: z.enum(["active", "suspended"]), reason: z.string().trim().min(3).max(300) }));
    const db = c.get("db");
    const target = Number(c.req.param("id"));
    if (target === admin.id) throw conflict("You can't change your own account status.");
    const u = db.get("SELECT id, status FROM users WHERE id = ? AND status != 'deleted'", [target]);
    if (!u) throw notFound();
    const isAdmin = db.get("SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.key = 'platform_admin'", [target]);
    if (status === "suspended" && isAdmin && adminCount(c) <= 1) throw conflict("You can't suspend the last active administrator.");
    db.tx(() => {
      db.run("UPDATE users SET status = ? WHERE id = ?", [status, target]);
      if (status === "suspended") revokeUserSessions(db, target);
      audit(db, { actorId: admin.id, action: `user.${status === "active" ? "reactivated" : "suspended"}`, entityType: "user", entityId: target, details: { reason }, ip: c.get("ip") });
    });
    return c.json({ ok: true });
  })

  .post("/users/:id/roles", async (c) => {
    const admin = requireAdmin(c, "admin.roles");
    const input = await body(c, z.object({ role: z.enum(Object.keys(ROLES) as [RoleKey, ...RoleKey[]]), action: z.enum(["grant", "revoke"]), reason: z.string().trim().min(3).max(300) }));
    const db = c.get("db");
    const target = Number(c.req.param("id"));
    if (!db.get("SELECT 1 FROM users WHERE id = ? AND status != 'deleted'", [target])) throw notFound();
    if (input.action === "revoke" && input.role === "platform_admin") {
      if (target === admin.id) throw conflict("You can't remove your own administrator role.");
      if (adminCount(c) <= 1) throw conflict("You can't remove the last administrator.");
    }
    if (input.role === "customer" && input.action === "revoke") throw conflict("The customer role can't be removed.");
    db.tx(() => {
      if (input.action === "grant") {
        grantRole(db, target, input.role, admin.id);
        if (input.role === "delivery_partner") db.run("INSERT OR IGNORE INTO delivery_partners (user_id, status) VALUES (?, 'pending')", [target]);
      } else {
        db.run("DELETE FROM user_roles WHERE user_id = ? AND role_id = (SELECT id FROM roles WHERE key = ?)", [target, input.role]);
        if (input.role === "store_owner") db.run("DELETE FROM store_members WHERE user_id = ? AND member_role = 'owner'", [target]);
      }
      // Privilege changes take effect immediately: force a fresh sign-in.
      revokeUserSessions(db, target);
      audit(db, { actorId: admin.id, action: `role.${input.action}`, entityType: "user", entityId: target, details: { role: input.role, reason: input.reason }, ip: c.get("ip") });
      notify(db, target, { type: "security.role_changed", title: `Your account role changed`, body: `${input.action === "grant" ? "Granted" : "Removed"}: ${ROLES[input.role].name}` });
    });
    return c.json({ ok: true });
  })

  .post("/users/:id/revoke-sessions", (c) => {
    const admin = requireAdmin(c, "admin.users");
    const target = Number(c.req.param("id"));
    const db = c.get("db");
    revokeUserSessions(db, target);
    audit(db, { actorId: admin.id, action: "user.sessions_revoked", entityType: "user", entityId: target, ip: c.get("ip") });
    return c.json({ ok: true });
  })

  .post("/users/:id/password-reset", (c) => {
    const admin = requireAdmin(c, "admin.users");
    const db = c.get("db");
    const u = db.get("SELECT id, email FROM users WHERE id = ? AND status = 'active'", [Number(c.req.param("id"))]);
    if (!u) throw notFound();
    const token = randomToken();
    db.tx(() => {
      db.run("INSERT INTO verification_tokens (user_id, purpose, token_hash, expires_at) VALUES (?, 'password_reset', ?, ?)", [
        u.id,
        sha256(token),
        new Date(Date.now() + 30 * 60_000).toISOString(),
      ]);
      // The link goes to the account's own email; administrators never see it or the password.
      sendEmail(db, u.email, "Reset your CrownCart password", `An administrator started account recovery for you.\n\n${config.publicUrl}/reset-password?token=${token}\n\nThis link expires in 30 minutes.`);
      audit(db, { actorId: admin.id, action: "user.recovery_started", entityType: "user", entityId: u.id, ip: c.get("ip") });
    });
    return c.json({ ok: true });
  })

  // ── Invitations ──
  .get("/invitations", (c) => {
    requireAdmin(c, "admin.roles");
    return c.json({
      invitations: c.get("db").all(
        `SELECT i.id, i.email, i.role_key, i.member_role, i.expires_at, i.accepted_at, i.revoked_at, i.created_at, s.name AS store_name, u.name AS invited_by
           FROM invitations i LEFT JOIN stores s ON s.id = i.store_id JOIN users u ON u.id = i.invited_by ORDER BY i.id DESC LIMIT 100`,
      ),
    });
  })

  .post("/invitations", async (c) => {
    const admin = requireAdmin(c, "admin.roles");
    const input = await body(c, z.object({ email, role: z.enum(["platform_admin", "store_owner", "delivery_partner"]), storeId: id.optional().nullable() }));
    const db = c.get("db");
    if (input.role === "store_owner") {
      if (!input.storeId) throw badRequest("Choose the store this owner will manage.");
      if (!db.get("SELECT 1 FROM stores WHERE id = ?", [input.storeId])) throw notFound("Store not found.");
    }
    const token = randomToken();
    db.tx(() => {
      db.run("INSERT INTO invitations (email, role_key, store_id, member_role, token_hash, invited_by, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
        input.email,
        input.role,
        input.role === "store_owner" ? (input.storeId ?? null) : null,
        input.role === "store_owner" ? "owner" : null,
        sha256(token),
        admin.id,
        new Date(Date.now() + 3 * 86_400_000).toISOString(),
      ]);
      sendEmail(db, input.email, "You're invited to CrownCart", `You've been invited to join CrownCart as ${ROLES[input.role].name}.\n\nAccept: ${config.publicUrl}/invite/${token}\n\nThis link expires in 3 days.`);
      audit(db, { actorId: admin.id, action: "role.invited", entityType: "invitation", entityId: input.email, storeId: input.storeId ?? null, details: { role: input.role }, ip: c.get("ip") });
    });
    return c.json({ ok: true, ...(config.isProd ? {} : { devInviteUrl: `/invite/${token}` }) }, 201);
  })

  .delete("/invitations/:id", (c) => {
    const admin = requireAdmin(c, "admin.roles");
    const db = c.get("db");
    const r = db.run("UPDATE invitations SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL", [Number(c.req.param("id"))]);
    if (!r.changes) throw notFound();
    audit(db, { actorId: admin.id, action: "role.invitation_revoked", entityType: "invitation", entityId: c.req.param("id") });
    return c.json({ ok: true });
  })

  // ── Stores ──
  .get("/stores", (c) => {
    requireAdmin(c, "admin.stores");
    return c.json({
      stores: c.get("db").all(
        `SELECT s.*, (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id) AS products,
                (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id AND o.status NOT IN ('pending_payment','failed','expired')) AS orders,
                (SELECT GROUP_CONCAT(u.name, ', ') FROM store_members m JOIN users u ON u.id = m.user_id WHERE m.store_id = s.id AND m.member_role = 'owner') AS owners
           FROM stores s ORDER BY s.created_at DESC`,
      ),
    });
  })

  .post("/stores", async (c) => {
    const admin = requireAdmin(c, "admin.stores");
    const input = await body(c, z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).default(""), contactEmail: email.optional().nullable(), pickupAddress: z.string().trim().max(300).default(""), pickupPincode: pincode.optional().nullable() }));
    const db = c.get("db");
    let slug = slugify(input.name);
    for (let i = 2; db.get("SELECT 1 FROM stores WHERE slug = ?", [slug]); i++) slug = `${slugify(input.name)}-${i}`;
    const sid = db.run("INSERT INTO stores (name, slug, description, contact_email, pickup_address, pickup_pincode, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')", [
      input.name,
      slug,
      input.description,
      input.contactEmail ?? null,
      input.pickupAddress,
      input.pickupPincode ?? null,
    ]).lastId;
    audit(db, { actorId: admin.id, action: "store.created", entityType: "store", entityId: sid, storeId: sid, details: { name: input.name }, ip: c.get("ip") });
    return c.json({ id: sid }, 201);
  })

  .patch("/stores/:id", async (c) => {
    const admin = requireAdmin(c, "admin.stores");
    const input = await body(c, z.object({ status: z.enum(["pending", "active", "suspended"]).optional(), name: z.string().trim().min(2).max(80).optional(), description: z.string().trim().max(500).optional(), pickupAddress: z.string().trim().max(300).optional(), reason: z.string().trim().max(300).default("") }));
    const db = c.get("db");
    const s = db.get("SELECT * FROM stores WHERE id = ?", [Number(c.req.param("id"))]);
    if (!s) throw notFound();
    if (input.status === "suspended" && input.reason.length < 3) throw badRequest("Give a reason for suspending the store.");
    db.tx(() => {
      db.run(
        "UPDATE stores SET status = COALESCE(?, status), name = COALESCE(?, name), description = COALESCE(?, description), pickup_address = COALESCE(?, pickup_address), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
        [input.status ?? null, input.name ?? null, input.description ?? null, input.pickupAddress ?? null, s.id],
      );
      audit(db, { actorId: admin.id, action: input.status && input.status !== s.status ? `store.${input.status}` : "store.updated", entityType: "store", entityId: s.id, storeId: s.id, details: { from: s.status, ...input }, ip: c.get("ip") });
      if (input.status && input.status !== s.status) {
        const owners = db.all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role = 'owner'", [s.id]).map((r) => r.user_id);
        for (const o of owners) notify(db, o, { type: "store.status", title: `${s.name} is now ${input.status}`, body: input.reason, link: "/owner" });
      }
    });
    return c.json({ ok: true });
  })

  .post("/stores/:id/owners", async (c) => {
    const admin = requireAdmin(c, "admin.stores");
    const { userId } = await body(c, z.object({ userId: id }));
    const db = c.get("db");
    const storeId = Number(c.req.param("id"));
    if (!db.get("SELECT 1 FROM stores WHERE id = ?", [storeId])) throw notFound();
    if (!db.get("SELECT 1 FROM users WHERE id = ? AND status = 'active'", [userId])) throw notFound("User not found.");
    db.tx(() => {
      grantRole(db, userId, "store_owner", admin.id);
      db.run("INSERT INTO store_members (store_id, user_id, member_role) VALUES (?, ?, 'owner') ON CONFLICT(store_id, user_id) DO UPDATE SET member_role = 'owner'", [storeId, userId]);
      audit(db, { actorId: admin.id, action: "store.owner_assigned", entityType: "store", entityId: storeId, storeId, details: { userId }, ip: c.get("ip") });
      notify(db, userId, { type: "store.assigned", title: "You've been made a store owner", link: "/owner" });
    });
    return c.json({ ok: true });
  })

  // ── Catalog moderation ──
  .get("/products", (c) => {
    requireAdmin(c, "admin.catalog");
    const q = (c.req.query("q") ?? "").trim();
    const rows = c.get("db").all(
      `SELECT p.id, p.slug, p.name, p.status, p.is_featured, p.showcase_order, p.updated_at, s.name AS store, b.name AS brand,
              (SELECT MIN(price_paise) FROM product_variants WHERE product_id = p.id) AS price_paise,
              (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind IN ('image','hero') ORDER BY m.kind='image' DESC, m.sort_order LIMIT 1) AS image
         FROM products p JOIN stores s ON s.id = p.store_id LEFT JOIN brands b ON b.id = p.brand_id
        ${q ? "WHERE p.name LIKE ? OR s.name LIKE ?" : ""} ORDER BY p.showcase_order IS NULL, p.showcase_order, p.updated_at DESC LIMIT 500`,
      q ? [`%${q}%`, `%${q}%`] : [],
    );
    return c.json({ products: rows });
  })

  .patch("/products/:id", async (c) => {
    const admin = requireAdmin(c, "admin.catalog");
    const input = await body(c, z.object({ status: z.enum(["draft", "active", "archived"]).optional(), showcaseOrder: z.number().int().min(1).max(20).nullable().optional(), isFeatured: z.boolean().optional(), reason: z.string().trim().max(300).default("") }));
    const db = c.get("db");
    const p = db.get("SELECT * FROM products WHERE id = ?", [Number(c.req.param("id"))]);
    if (!p) throw notFound();
    db.tx(() => {
      db.run(
        `UPDATE products SET status = COALESCE(?, status), is_featured = COALESCE(?, is_featured),
                showcase_order = CASE WHEN ? THEN ? ELSE showcase_order END, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [input.status ?? null, input.isFeatured == null ? null : input.isFeatured ? 1 : 0, input.showcaseOrder !== undefined ? 1 : 0, input.showcaseOrder ?? null, p.id],
      );
      audit(db, { actorId: admin.id, action: "product.moderated", entityType: "product", entityId: p.id, storeId: p.store_id, details: input, ip: c.get("ip") });
    });
    return c.json({ ok: true });
  })

  .get("/categories", (c) => {
    requireAdmin(c, "admin.catalog");
    return c.json({
      categories: c.get("db").all(
        "SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products FROM categories c ORDER BY c.sort_order, c.name",
      ),
    });
  })

  .post("/categories", async (c) => {
    const admin = requireAdmin(c, "admin.catalog");
    const input = await body(c, z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(300).default(""), parentId: id.nullable().optional(), sortOrder: z.number().int().default(0) }));
    const db = c.get("db");
    let slug = slugify(input.name);
    for (let i = 2; db.get("SELECT 1 FROM categories WHERE slug = ?", [slug]); i++) slug = `${slugify(input.name)}-${i}`;
    const cid = db.run("INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)", [input.name, slug, input.description, input.parentId ?? null, input.sortOrder]).lastId;
    audit(db, { actorId: admin.id, action: "category.created", entityType: "category", entityId: cid, details: { name: input.name } });
    return c.json({ id: cid }, 201);
  })

  .patch("/categories/:id", async (c) => {
    const admin = requireAdmin(c, "admin.catalog");
    const input = await body(c, z.object({ name: z.string().trim().min(2).max(60).optional(), description: z.string().trim().max(300).optional(), isActive: z.boolean().optional(), sortOrder: z.number().int().optional() }));
    const db = c.get("db");
    const r = db.run(
      "UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), is_active = COALESCE(?, is_active), sort_order = COALESCE(?, sort_order) WHERE id = ?",
      [input.name ?? null, input.description ?? null, input.isActive == null ? null : input.isActive ? 1 : 0, input.sortOrder ?? null, Number(c.req.param("id"))],
    );
    if (!r.changes) throw notFound();
    audit(db, { actorId: admin.id, action: "category.updated", entityType: "category", entityId: c.req.param("id"), details: input });
    return c.json({ ok: true });
  })

  // ── Orders ──
  .get("/orders", (c) => {
    requireAdmin(c, "admin.orders");
    const status = c.req.query("status");
    const q = (c.req.query("q") ?? "").trim();
    const storeId = c.req.query("storeId");
    const rows = c.get("db").all(
      `${ORDER_LIST_SQL} WHERE 1 ${status ? "AND o.status = ?" : ""} ${storeId ? "AND o.store_id = ?" : ""} ${q ? "AND (o.number LIKE ? OR u.email LIKE ? OR o.ship_name LIKE ?)" : ""}
        ORDER BY o.created_at DESC LIMIT 300`,
      [...(status ? [status] : []), ...(storeId ? [Number(storeId)] : []), ...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [])],
    );
    return c.json({ orders: rows.map(orderSummary), statuses: ORDER_STATUS_LABELS });
  })

  .get("/orders/:number", (c) => {
    requireAdmin(c, "admin.orders");
    const db = c.get("db");
    const o = db.get("SELECT * FROM orders WHERE number = ?", [c.req.param("number")]);
    if (!o) throw notFound();
    const payments = db.all("SELECT id, provider, provider_order_id, provider_payment_id, amount_paise, status, failure_reason, created_at FROM payments WHERE checkout_id = ?", [o.checkout_id]);
    const audits = db.all(
      "SELECT a.action, a.details, a.created_at, u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id WHERE a.entity_type = 'order' AND a.entity_id = ? ORDER BY a.id DESC",
      [String(o.id)],
    );
    return c.json({
      order: orderDetail(db, o, "admin"),
      payments,
      audits,
      refundsAll: db.all("SELECT * FROM refunds WHERE order_id = ?", [o.id]),
      partners: approvedPartners(db).map((p) => ({ id: p.id, name: p.name, availability: p.availability, openAssignments: p.open_assignments })),
    });
  })

  .get("/orders/:number/invoice", (c) => {
    requireAdmin(c, "admin.orders");
    const db = c.get("db");
    const o = db.get("SELECT * FROM orders WHERE number = ?", [c.req.param("number")]);
    if (!o) throw notFound();
    c.header("Cache-Control", "private, no-store");
    return c.html(invoiceHtml(db, o));
  })

  .post("/orders/:number/cancel", async (c) => {
    const admin = requireAdmin(c, "admin.orders");
    const { reason } = await body(c, z.object({ reason: z.string().trim().min(3).max(300) }));
    const db = c.get("db");
    const o = db.get("SELECT * FROM orders WHERE number = ?", [c.req.param("number")]);
    if (!o) throw notFound();
    if (o.payment_status === "paid") requireAdmin(c, "admin.finance");
    await cancelAndRefund(db, o.id, admin.id, `Cancelled by CrownCart: ${reason}`);
    audit(db, { actorId: admin.id, action: "order.admin_cancelled", entityType: "order", entityId: o.id, storeId: o.store_id, details: { reason }, ip: c.get("ip") });
    return c.json({ ok: true });
  })

  .post("/orders/:number/refund", async (c) => {
    const admin = requireAdmin(c, "admin.finance");
    const input = await body(c, z.object({ amountPaise: z.number().int().positive(), reason: z.string().trim().min(3).max(300) }));
    const db = c.get("db");
    const o = db.get("SELECT * FROM orders WHERE number = ?", [c.req.param("number")]);
    if (!o) throw notFound();
    const plan = await startRefund(db, o.id, input.amountPaise, input.reason, admin.id);
    if (!plan) throw conflict("No payment has been collected on this order, so there is nothing to refund.");
    return c.json({ ok: true });
  })

  .post("/refunds/:id/settle", async (c) => {
    const admin = requireAdmin(c, "admin.finance");
    const { reference } = await body(c, z.object({ reference: z.string().trim().min(3).max(100) }));
    const db = c.get("db");
    const r = db.get("SELECT * FROM refunds WHERE id = ?", [Number(c.req.param("id"))]);
    if (!r) throw notFound();
    if (r.status !== "manual") throw conflict("Only manual (cash-on-delivery) refunds are settled here; online refunds are confirmed by the payment provider.");
    // Manual refunds already count toward the refunded total; this records the payout reference.
    audit(db, { actorId: admin.id, action: "refund.settled", entityType: "refund", entityId: r.id, details: { reference }, ip: c.get("ip") });
    db.run("UPDATE refunds SET provider_refund_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [`manual:${reference}`, r.id]);
    db.tx(() => {
      const o = db.get("SELECT id FROM orders WHERE id = ?", [r.order_id])!;
      markRefundProcessed(db, r.id);
      void o;
    });
    return c.json({ ok: true });
  })

  .post("/orders/:number/assign", async (c) => {
    const admin = requireAdmin(c, "admin.delivery");
    const { partnerId } = await body(c, z.object({ partnerId: id }));
    const db = c.get("db");
    const o = db.get("SELECT * FROM orders WHERE number = ?", [c.req.param("number")]);
    if (!o) throw notFound();
    db.tx(() => assignPartner(db, createShipment(db, o.id).id, partnerId, admin.id));
    return c.json({ ok: true });
  })

  .post("/orders/:number/status", async (c) => {
    const admin = requireAdmin(c, "admin.orders");
    const input = await body(c, z.object({ to: z.enum(["processing", "ready_for_dispatch", "confirmed"]), note: z.string().trim().min(3).max(300) }));
    const db = c.get("db");
    const o = db.get("SELECT * FROM orders WHERE number = ?", [c.req.param("number")]);
    if (!o) throw notFound();
    db.tx(() => {
      transitionOrder(db, o.id, input.to, admin.id, input.note);
      if (input.to === "ready_for_dispatch") createShipment(db, o.id);
      audit(db, { actorId: admin.id, action: "order.admin_status", entityType: "order", entityId: o.id, storeId: o.store_id, details: { from: o.status, ...input }, ip: c.get("ip") });
    });
    return c.json({ ok: true });
  })

  // ── Delivery partners ──
  .get("/delivery-partners", (c) => {
    requireAdmin(c, "admin.delivery");
    const rows = c.get("db").all(
      `SELECT u.id, u.name, u.email, u.phone, u.status AS account_status, dp.status, dp.availability, dp.service_pincodes, dp.vehicle, dp.approved_at, dp.created_at,
              (SELECT COUNT(*) FROM delivery_assignments a WHERE a.partner_user_id = u.id AND a.closed_at IS NULL) AS open_assignments,
              (SELECT COUNT(*) FROM delivery_assignments a WHERE a.partner_user_id = u.id AND a.status = 'delivered') AS delivered,
              (SELECT COUNT(*) FROM delivery_assignments a WHERE a.partner_user_id = u.id AND a.status IN ('failed','returned')) AS failed
         FROM delivery_partners dp JOIN users u ON u.id = dp.user_id ORDER BY dp.status = 'pending' DESC, u.name`,
    );
    return c.json({ partners: rows, statusLabels: DELIVERY_STATUS_LABELS });
  })

  .patch("/delivery-partners/:userId", async (c) => {
    const admin = requireAdmin(c, "admin.delivery");
    const input = await body(c, z.object({ status: z.enum(["pending", "approved", "suspended"]).optional(), servicePincodes: z.string().trim().max(2000).optional(), vehicle: z.string().trim().max(60).optional(), reason: z.string().trim().max(300).default("") }));
    const db = c.get("db");
    const target = Number(c.req.param("userId"));
    const p = db.get("SELECT * FROM delivery_partners WHERE user_id = ?", [target]);
    if (!p) throw notFound();
    db.tx(() => {
      db.run(
        `UPDATE delivery_partners SET status = COALESCE(?, status), service_pincodes = COALESCE(?, service_pincodes), vehicle = COALESCE(?, vehicle),
                approved_by = CASE WHEN ? = 'approved' THEN ? ELSE approved_by END,
                approved_at = CASE WHEN ? = 'approved' THEN strftime('%Y-%m-%dT%H:%M:%fZ','now') ELSE approved_at END,
                availability = CASE WHEN ? = 'suspended' THEN 'offline' ELSE availability END
          WHERE user_id = ?`,
        [input.status ?? null, input.servicePincodes ?? null, input.vehicle ?? null, input.status ?? "", admin.id, input.status ?? "", input.status ?? "", target],
      );
      audit(db, { actorId: admin.id, action: `delivery_partner.${input.status ?? "updated"}`, entityType: "user", entityId: target, details: { from: p.status, ...input }, ip: c.get("ip") });
      if (input.status && input.status !== p.status) {
        notify(db, target, { type: "delivery.partner_status", title: input.status === "approved" ? "You're approved to deliver with CrownCart" : `Your delivery account is ${input.status}`, body: input.reason, link: "/delivery" });
      }
    });
    return c.json({ ok: true });
  })

  .get("/shipments", (c) => {
    requireAdmin(c, "admin.delivery");
    const rows = c.get("db").all(
      `SELECT sh.id, sh.tracking_number, sh.status, sh.created_at, o.number, o.ship_city, o.ship_pincode, s.name AS store,
              a.status AS assignment_status, u.name AS partner, a.failure_reason
         FROM shipments sh JOIN orders o ON o.id = sh.order_id JOIN stores s ON s.id = o.store_id
         LEFT JOIN delivery_assignments a ON a.id = (SELECT MAX(id) FROM delivery_assignments WHERE shipment_id = sh.id)
         LEFT JOIN users u ON u.id = a.partner_user_id
        ORDER BY sh.status = 'awaiting_assignment' DESC, sh.updated_at DESC LIMIT 300`,
    );
    return c.json({ shipments: rows });
  })

  // ── Reviews & support ──
  .get("/reviews", (c) => {
    requireAdmin(c, "admin.support");
    const status = c.req.query("status") ?? "pending";
    return c.json({
      reviews: c.get("db").all(
        `SELECT r.id, r.rating, r.title, r.body, r.status, r.verified_purchase, r.created_at, p.name AS product, p.slug, u.name AS author
           FROM reviews r JOIN products p ON p.id = r.product_id JOIN users u ON u.id = r.user_id WHERE r.status = ? ORDER BY r.created_at DESC LIMIT 200`,
        [status],
      ),
    });
  })

  .post("/reviews/:id", async (c) => {
    const admin = requireAdmin(c, "admin.support");
    const { status } = await body(c, z.object({ status: z.enum(["published", "rejected"]) }));
    const db = c.get("db");
    const r = db.run("UPDATE reviews SET status = ? WHERE id = ?", [status, Number(c.req.param("id"))]);
    if (!r.changes) throw notFound();
    audit(db, { actorId: admin.id, action: `review.${status}`, entityType: "review", entityId: c.req.param("id") });
    return c.json({ ok: true });
  })

  .get("/tickets", (c) => {
    requireAdmin(c, "admin.support");
    const status = c.req.query("status");
    return c.json({
      tickets: c.get("db").all(
        `SELECT t.*, o.number AS order_number, (SELECT COUNT(*) FROM ticket_messages m WHERE m.ticket_id = t.id) AS messages
           FROM support_tickets t LEFT JOIN orders o ON o.id = t.order_id ${status ? "WHERE t.status = ?" : ""}
          ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.updated_at DESC LIMIT 300`,
        status ? [status] : [],
      ),
    });
  })

  .get("/tickets/:id", (c) => {
    requireAdmin(c, "admin.support");
    const db = c.get("db");
    const t = db.get("SELECT t.*, o.number AS order_number FROM support_tickets t LEFT JOIN orders o ON o.id = t.order_id WHERE t.id = ?", [Number(c.req.param("id"))]);
    if (!t) throw notFound();
    return c.json({ ticket: t, messages: db.all("SELECT m.*, u.name AS author FROM ticket_messages m LEFT JOIN users u ON u.id = m.author_user_id WHERE m.ticket_id = ? ORDER BY m.id", [t.id]) });
  })

  .post("/tickets/:id/reply", async (c) => {
    const admin = requireAdmin(c, "admin.support");
    const input = await body(c, z.object({ body: z.string().trim().min(2).max(4000), status: z.enum(["open", "pending", "resolved", "closed"]).default("pending"), priority: z.enum(["low", "normal", "high", "urgent"]).optional() }));
    const db = c.get("db");
    const t = db.get("SELECT * FROM support_tickets WHERE id = ?", [Number(c.req.param("id"))]);
    if (!t) throw notFound();
    db.tx(() => {
      db.run("INSERT INTO ticket_messages (ticket_id, author_user_id, is_staff, body) VALUES (?, ?, 1, ?)", [t.id, admin.id, input.body]);
      db.run("UPDATE support_tickets SET status = ?, priority = COALESCE(?, priority), assigned_to = COALESCE(assigned_to, ?), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [
        input.status,
        input.priority ?? null,
        admin.id,
        t.id,
      ]);
      if (t.user_id) notify(db, t.user_id, { type: "support.reply", title: `Reply to: ${t.subject}`, body: input.body.slice(0, 140), link: `/account/support/${t.id}` });
      else sendEmail(db, t.email, `Re: ${t.subject}`, input.body);
    });
    return c.json({ ok: true });
  })

  // ── Promotions ──
  .get("/coupons", (c) => {
    requireAdmin(c, "admin.settings");
    return c.json({
      coupons: c.get("db").all(
        "SELECT c.*, s.name AS store, (SELECT COUNT(*) FROM coupon_redemptions r WHERE r.coupon_id = c.id) AS used FROM coupons c LEFT JOIN stores s ON s.id = c.store_id ORDER BY c.created_at DESC",
      ),
    });
  })

  .post("/coupons", async (c) => {
    const admin = requireAdmin(c, "admin.settings");
    const input = await body(c, couponSchema);
    const db = c.get("db");
    if (db.get("SELECT 1 FROM coupons WHERE code = ?", [input.code])) throw conflict("That code is already in use.");
    const cid = db.run(
      `INSERT INTO coupons (code, store_id, kind, value, min_order_paise, max_discount_paise, starts_at, ends_at, usage_limit, per_user_limit, first_order_only, is_active, description, created_by)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.code, input.kind, input.value, input.minOrderPaise, input.maxDiscountPaise ?? null, input.startsAt ?? null, input.endsAt ?? null, input.usageLimit ?? null, input.perUserLimit, input.firstOrderOnly ? 1 : 0, input.isActive ? 1 : 0, input.description, admin.id],
    ).lastId;
    audit(db, { actorId: admin.id, action: "coupon.created", entityType: "coupon", entityId: cid, details: { code: input.code } });
    return c.json({ ok: true }, 201);
  })

  .patch("/coupons/:id", async (c) => {
    const admin = requireAdmin(c, "admin.settings");
    const { isActive } = await body(c, z.object({ isActive: z.boolean() }));
    const db = c.get("db");
    if (!db.run("UPDATE coupons SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, Number(c.req.param("id"))]).changes) throw notFound();
    audit(db, { actorId: admin.id, action: isActive ? "coupon.activated" : "coupon.deactivated", entityType: "coupon", entityId: c.req.param("id") });
    return c.json({ ok: true });
  })

  // ── Configuration ──
  .get("/settings", (c) => {
    requireAdmin(c, "admin.settings");
    // Integration status is reported as configured/not configured only; secrets never leave the server.
    return c.json({ settings: allSettings(c.get("db")), integrations: integrations(), environment: config.isProd ? "production" : "development" });
  })

  .put("/settings/:key", async (c) => {
    const admin = requireAdmin(c, "admin.settings");
    const key = c.req.param("key") as SettingKey;
    if (!(key in SETTING_DEFAULTS)) throw notFound();
    const value = await body(c, settingSchemas[key]);
    const db = c.get("db");
    db.tx(() => {
      setSetting(db, key, value, admin.id);
      audit(db, { actorId: admin.id, action: "settings.updated", entityType: "setting", entityId: key, details: value, ip: c.get("ip") });
    });
    return c.json({ settings: allSettings(db) });
  })

  // ── Audit & operations ──
  .get("/audit", (c) => {
    requireAdmin(c, "admin.audit");
    const action = c.req.query("action");
    const actor = c.req.query("actor");
    const range = c.req.query("from") || c.req.query("to") ? parseRange(c.req.query("from"), c.req.query("to")) : null;
    const rows = c.get("db").all(
      `SELECT a.*, u.name AS actor_name, u.email AS actor_email FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE 1 ${action ? "AND a.action LIKE ?" : ""} ${actor ? "AND (u.email LIKE ? OR u.name LIKE ?)" : ""} ${range ? "AND a.created_at BETWEEN ? AND ?" : ""}
        ORDER BY a.id DESC LIMIT 500`,
      [...(action ? [`${action}%`] : []), ...(actor ? [`%${actor}%`, `%${actor}%`] : []), ...(range ? [range.from, range.to] : [])],
    );
    if (c.req.query("format") === "csv") {
      c.header("Content-Type", "text/csv; charset=utf-8");
      c.header("Content-Disposition", 'attachment; filename="audit-log.csv"');
      return c.body(toCsv(rows.map((r) => ({ id: r.id, at: r.created_at, actor: r.actor_email, action: r.action, entity: r.entity_type, entity_id: r.entity_id, store_id: r.store_id, ip: r.ip, details: r.details }))));
    }
    return c.json({ events: rows.map((r) => ({ ...r, details: JSON.parse(r.details) })) });
  })

  /** Development-only view of emails that would have been sent. Contains live links, so never in production. */
  .get("/dev-emails", (c) => {
    requireAdmin(c, "admin.settings");
    if (config.isProd) throw notFound();
    return c.json({ emails: c.get("db").all("SELECT * FROM email_outbox ORDER BY id DESC LIMIT 50") });
  });
