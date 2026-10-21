import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context.ts";
import type { Db } from "../db.ts";
import { badRequest, conflict, notFound } from "../lib/errors.ts";
import { body, id, phone, pincode } from "../lib/validate.ts";
import { requireUser, destroySession } from "../lib/auth.ts";
import { summarizeCart } from "../lib/pricing.ts";
import { audit } from "../lib/audit.ts";
import { verifyPassword } from "../lib/crypto.ts";
import { toCard } from "./catalog.ts";
import { getSetting } from "../lib/settings.ts";

interface VariantCheck {
  id: number;
  product_id: number;
  max_per_order: number;
  available: number;
  ok: number;
  product_name: string;
}

function loadVariantForCart(db: Db, variantId: number): VariantCheck {
  const v = db.get<VariantCheck>(
    `SELECT v.id, v.product_id, v.max_per_order, p.name AS product_name,
            MAX(COALESCE(i.on_hand - i.reserved, 0), 0) AS available,
            (v.is_active = 1 AND p.status = 'active' AND s.status = 'active') AS ok
       FROM product_variants v JOIN products p ON p.id = v.product_id JOIN stores s ON s.id = p.store_id
       LEFT JOIN inventory i ON i.variant_id = v.id
      WHERE v.id = ?`,
    [variantId],
  );
  if (!v || !v.ok) throw notFound("This product is no longer available.");
  return v;
}

/**
 * Adds to the cart, validating availability on the server. `requestId` makes
 * retries (e.g. the post-sign-in replay of a pending add) safe: the same id is
 * only ever applied once.
 */
export function addToCart(db: Db, userId: number, variantId: number, quantity: number, requestId?: string) {
  return db.tx(() => {
    if (requestId) {
      const fresh = db.run("INSERT OR IGNORE INTO cart_requests (user_id, request_id) VALUES (?, ?)", [userId, requestId]);
      if (!fresh.changes) return { duplicate: true };
    }
    const v = loadVariantForCart(db, variantId);
    const existing = db.get("SELECT id, quantity, saved_for_later FROM cart_items WHERE user_id = ? AND variant_id = ?", [userId, variantId]);
    const current = existing && !existing.saved_for_later ? existing.quantity : 0;
    const next = current + quantity;
    if (v.available <= 0) throw conflict(`${v.product_name} is out of stock right now.`, { reason: "out_of_stock" });
    if (next > v.available) throw conflict(`Only ${v.available} of ${v.product_name} available${current ? ` (you already have ${current} in your bag)` : ""}.`, { reason: "insufficient_stock" });
    if (next > v.max_per_order) throw conflict(`You can buy up to ${v.max_per_order} of ${v.product_name} per order.`, { reason: "limit" });
    if (existing) {
      db.run("UPDATE cart_items SET quantity = ?, saved_for_later = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [next, existing.id]);
    } else {
      db.run("INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)", [userId, variantId, quantity]);
    }
    db.run("INSERT INTO analytics_events (name, user_id, product_id, props) VALUES ('add_to_cart', ?, ?, ?)", [
      userId,
      v.product_id,
      JSON.stringify({ variantId, quantity }),
    ]);
    return { duplicate: false, productName: v.product_name };
  });
}

function ownItem(db: Db, userId: number, itemId: number) {
  const item = db.get("SELECT * FROM cart_items WHERE id = ? AND user_id = ?", [itemId, userId]);
  if (!item) throw notFound("That item is not in your bag.");
  return item;
}

const addressSchema = z.object({
  label: z.string().trim().max(30).default("Home"),
  name: z.string().trim().min(2, "Enter the recipient's name.").max(80),
  phone,
  line1: z.string().trim().min(3, "Enter the street address.").max(120),
  line2: z.string().trim().max(120).default(""),
  city: z.string().trim().min(2, "Enter the city.").max(60),
  state: z.string().trim().min(2, "Enter the state.").max(60),
  pincode,
  isDefault: z.boolean().default(false),
});

const mapAddress = (a: any) => ({
  id: a.id,
  label: a.label,
  name: a.name,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2,
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  isDefault: Boolean(a.is_default),
});

export const cartRoutes = new Hono<AppEnv>()
  .get("/", (c) => {
    const u = requireUser(c);
    return c.json(summarizeCart(c.get("db"), u.id, c.req.query("coupon") || null));
  })

  .post("/items", async (c) => {
    const u = requireUser(c);
    const input = await body(
      c,
      z.object({
        variantId: id,
        quantity: z.number().int().min(1).max(20).default(1),
        requestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
      }),
    );
    const db = c.get("db");
    const result = addToCart(db, u.id, input.variantId, input.quantity, input.requestId);
    return c.json({ ...result, cart: summarizeCart(db, u.id) }, result.duplicate ? 200 : 201);
  })

  .patch("/items/:id", async (c) => {
    const u = requireUser(c);
    const input = await body(c, z.object({ quantity: z.number().int().min(1).max(20).optional(), savedForLater: z.boolean().optional() }));
    const db = c.get("db");
    db.tx(() => {
      const item = ownItem(db, u.id, Number(c.req.param("id")));
      if (input.quantity != null) {
        const v = loadVariantForCart(db, item.variant_id);
        if (input.quantity > v.available) throw conflict(`Only ${v.available} available.`);
        if (input.quantity > v.max_per_order) throw conflict(`You can buy up to ${v.max_per_order} per order.`);
        db.run("UPDATE cart_items SET quantity = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [input.quantity, item.id]);
      }
      if (input.savedForLater != null) {
        db.run("UPDATE cart_items SET saved_for_later = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [
          input.savedForLater ? 1 : 0,
          item.id,
        ]);
      }
    });
    return c.json(summarizeCart(db, u.id));
  })

  .delete("/items/:id", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const item = ownItem(db, u.id, Number(c.req.param("id")));
    db.tx(() => {
      db.run("DELETE FROM cart_items WHERE id = ?", [item.id]);
      db.run("INSERT INTO analytics_events (name, user_id, props) VALUES ('remove_from_cart', ?, ?)", [u.id, JSON.stringify({ variantId: item.variant_id })]);
    });
    return c.json(summarizeCart(db, u.id));
  })

  .post("/items/:id/move-to-wishlist", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    db.tx(() => {
      const item = ownItem(db, u.id, Number(c.req.param("id")));
      const v = db.get("SELECT product_id FROM product_variants WHERE id = ?", [item.variant_id])!;
      db.run("INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)", [u.id, v.product_id]);
      db.run("DELETE FROM cart_items WHERE id = ?", [item.id]);
    });
    return c.json(summarizeCart(db, u.id));
  })

  .delete("/", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    db.run("DELETE FROM cart_items WHERE user_id = ? AND saved_for_later = 0", [u.id]);
    return c.json(summarizeCart(db, u.id));
  });

export const wishlistRoutes = new Hono<AppEnv>()
  .get("/", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const rows = db.all(
      `SELECT w.created_at AS saved_at, p.id, p.slug, p.name, p.badge, p.tagline, p.status, p.created_at, p.is_featured, p.view_count,
              b.name AS brand, b.slug AS brand_slug, c.name AS category, c.slug AS category_slug,
              (SELECT MIN(v.price_paise) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1) AS price_paise,
              (SELECT v.compare_at_paise FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1 ORDER BY v.price_paise LIMIT 1) AS compare_at_paise,
              (SELECT COALESCE(SUM(MAX(i.on_hand - i.reserved, 0)), 0) FROM product_variants v JOIN inventory i ON i.variant_id = v.id WHERE v.product_id = p.id AND v.is_active = 1) AS available,
              (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind IN ('image','hero') ORDER BY m.kind = 'image' DESC, m.sort_order LIMIT 1) AS image,
              NULL AS hero_image, NULL AS rating, 0 AS review_count
         FROM wishlist_items w JOIN products p ON p.id = w.product_id
         LEFT JOIN brands b ON b.id = p.brand_id LEFT JOIN categories c ON c.id = p.category_id
        WHERE w.user_id = ? ORDER BY w.created_at DESC`,
      [u.id],
    );
    return c.json({ items: rows.map((r) => ({ ...toCard(r), savedAt: r.saved_at, unavailable: r.status !== "active" })) });
  })

  .post("/", async (c) => {
    const u = requireUser(c);
    const { productId } = await body(c, z.object({ productId: id }));
    const db = c.get("db");
    if (!getSetting(db, "features").wishlist) throw conflict("The wishlist is turned off right now.");
    if (!db.get("SELECT 1 FROM products WHERE id = ? AND status = 'active'", [productId])) throw notFound();
    db.run("INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)", [u.id, productId]);
    return c.json({ ok: true }, 201);
  })

  .delete("/:productId", (c) => {
    const u = requireUser(c);
    c.get("db").run("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?", [u.id, Number(c.req.param("productId"))]);
    return c.json({ ok: true });
  })

  .post("/:productId/move-to-cart", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const productId = Number(c.req.param("productId"));
    const v = db.get(
      `SELECT v.id FROM product_variants v JOIN inventory i ON i.variant_id = v.id
        WHERE v.product_id = ? AND v.is_active = 1 AND i.on_hand - i.reserved > 0 ORDER BY v.sort_order LIMIT 1`,
      [productId],
    );
    if (!v) throw conflict("This product is out of stock. We can let you know when it's back.");
    addToCart(db, u.id, v.id, 1);
    db.run("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?", [u.id, productId]);
    return c.json({ ok: true, cart: summarizeCart(db, u.id) });
  });

export const accountRoutes = new Hono<AppEnv>()
  .get("/profile", (c) => {
    const u = requireUser(c);
    const row = c.get("db").get("SELECT email, name, phone, email_verified_at, preferences, created_at FROM users WHERE id = ?", [u.id])!;
    return c.json({
      email: row.email,
      name: row.name,
      phone: row.phone,
      emailVerified: Boolean(row.email_verified_at),
      preferences: JSON.parse(row.preferences),
      memberSince: row.created_at,
    });
  })

  .patch("/profile", async (c) => {
    const u = requireUser(c);
    const input = await body(c, z.object({ name: z.string().trim().min(2).max(80).optional(), phone: phone.or(z.literal("")).optional() }));
    const db = c.get("db");
    db.run(
      "UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
      [input.name ?? null, input.phone === undefined ? null : input.phone || null, u.id],
    );
    return c.json({ ok: true });
  })

  .patch("/preferences", async (c) => {
    const u = requireUser(c);
    const input = await body(
      c,
      z
        .object({
          theme: z.enum(["light", "dark", "system"]),
          reducedMotion: z.boolean(),
          animationIntensity: z.enum(["full", "reduced", "off"]),
          sound: z.boolean(),
          marketingEmails: z.boolean(),
          orderEmails: z.boolean(),
          priceDropAlerts: z.boolean(),
          backInStockAlerts: z.boolean(),
          language: z.enum(["en-IN"]),
          currency: z.enum(["INR"]),
        })
        .partial()
        .strict(),
    );
    const db = c.get("db");
    const cur = JSON.parse(db.get<{ preferences: string }>("SELECT preferences FROM users WHERE id = ?", [u.id])!.preferences);
    const next = { ...cur, ...input };
    db.run("UPDATE users SET preferences = ? WHERE id = ?", [JSON.stringify(next), u.id]);
    return c.json({ preferences: next });
  })

  .get("/addresses", (c) => {
    const u = requireUser(c);
    return c.json({
      addresses: c.get("db").all("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC", [u.id]).map(mapAddress),
    });
  })

  .post("/addresses", async (c) => {
    const u = requireUser(c);
    const a = await body(c, addressSchema);
    const db = c.get("db");
    const id = db.tx(() => {
      const count = db.get<{ n: number }>("SELECT COUNT(*) n FROM addresses WHERE user_id = ?", [u.id])!.n;
      if (count >= 20) throw badRequest("You can save up to 20 addresses.");
      const makeDefault = a.isDefault || count === 0;
      if (makeDefault) db.run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [u.id]);
      return db.run(
        "INSERT INTO addresses (user_id, label, name, phone, line1, line2, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [u.id, a.label, a.name, a.phone, a.line1, a.line2, a.city, a.state, a.pincode, makeDefault ? 1 : 0],
      ).lastId;
    });
    return c.json({ address: mapAddress(db.get("SELECT * FROM addresses WHERE id = ?", [id])) }, 201);
  })

  .put("/addresses/:id", async (c) => {
    const u = requireUser(c);
    const a = await body(c, addressSchema);
    const db = c.get("db");
    const addrId = Number(c.req.param("id"));
    db.tx(() => {
      if (!db.get("SELECT 1 FROM addresses WHERE id = ? AND user_id = ?", [addrId, u.id])) throw notFound();
      if (a.isDefault) db.run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [u.id]);
      db.run(
        "UPDATE addresses SET label=?, name=?, phone=?, line1=?, line2=?, city=?, state=?, pincode=?, is_default = CASE WHEN ? THEN 1 ELSE is_default END WHERE id = ?",
        [a.label, a.name, a.phone, a.line1, a.line2, a.city, a.state, a.pincode, a.isDefault ? 1 : 0, addrId],
      );
    });
    return c.json({ address: mapAddress(db.get("SELECT * FROM addresses WHERE id = ?", [addrId])) });
  })

  .delete("/addresses/:id", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    db.tx(() => {
      const a = db.get("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [Number(c.req.param("id")), u.id]);
      if (!a) throw notFound();
      db.run("DELETE FROM addresses WHERE id = ?", [a.id]);
      if (a.is_default) {
        db.run("UPDATE addresses SET is_default = 1 WHERE id = (SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1)", [u.id]);
      }
    });
    return c.json({ ok: true });
  })

  .get("/notifications", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const rows = db.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100", [u.id]);
    return c.json({
      notifications: rows.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: Boolean(n.read_at), createdAt: n.created_at })),
      unread: rows.filter((n) => !n.read_at).length,
    });
  })

  .post("/notifications/:id/read", (c) => {
    const u = requireUser(c);
    c.get("db").run("UPDATE notifications SET read_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ? AND read_at IS NULL", [
      Number(c.req.param("id")),
      u.id,
    ]);
    return c.json({ ok: true });
  })

  .post("/notifications/read-all", (c) => {
    const u = requireUser(c);
    c.get("db").run("UPDATE notifications SET read_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ? AND read_at IS NULL", [u.id]);
    return c.json({ ok: true });
  })

  .get("/recently-viewed", (c) => {
    const u = requireUser(c);
    const rows = c.get("db").all(
      `SELECT p.slug, p.name, (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind IN ('image','hero') ORDER BY m.kind = 'image' DESC, m.sort_order LIMIT 1) AS image,
              (SELECT MIN(price_paise) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1) AS price_paise
         FROM recently_viewed r JOIN products p ON p.id = r.product_id
        WHERE r.user_id = ? AND p.status = 'active' ORDER BY r.viewed_at DESC LIMIT 12`,
      [u.id],
    );
    return c.json({ items: rows.map((r) => ({ slug: r.slug, name: r.name, image: r.image, pricePaise: r.price_paise })) });
  })

  .post("/stock-alerts", async (c) => {
    const u = requireUser(c);
    const { variantId } = await body(c, z.object({ variantId: id }));
    const db = c.get("db");
    if (!db.get("SELECT 1 FROM product_variants WHERE id = ?", [variantId])) throw notFound();
    db.run("INSERT INTO stock_alerts (user_id, variant_id) VALUES (?, ?) ON CONFLICT DO UPDATE SET notified_at = NULL", [u.id, variantId]);
    return c.json({ ok: true }, 201);
  })

  /**
   * Deletes the account by anonymising it. Order records are kept (they are
   * financial records) but no longer identify the person.
   */
  .post("/delete", async (c) => {
    const u = requireUser(c);
    const { password } = await body(c, z.object({ password: z.string().min(1).max(200) }));
    const db = c.get("db");
    const row = db.get("SELECT password_hash FROM users WHERE id = ?", [u.id]);
    if (!(await verifyPassword(password, row?.password_hash))) throw badRequest("Incorrect password.", { fields: { password: "Incorrect password." } });
    const open = db.get<{ n: number }>(
      "SELECT COUNT(*) n FROM orders WHERE user_id = ? AND status IN ('confirmed','processing','ready_for_dispatch','shipped','out_for_delivery','cancellation_requested','return_requested')",
      [u.id],
    )!.n;
    if (open > 0) throw conflict("You have orders in progress. Your account can be deleted once they are complete.");
    if (u.roles.some((r) => r !== "customer")) throw conflict("Staff accounts must be removed by a platform administrator.");
    db.tx(() => {
      db.run(
        `UPDATE users SET email = 'deleted-' || id || '@deleted.invalid', name = 'Deleted user', phone = NULL, password_hash = NULL,
                status = 'deleted', preferences = '{}', deletion_requested_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [u.id],
      );
      for (const t of ["addresses", "cart_items", "wishlist_items", "recently_viewed", "stock_alerts", "notifications", "sessions"]) {
        db.run(`DELETE FROM ${t} WHERE user_id = ?`, [u.id]);
      }
      audit(db, { actorId: u.id, action: "account.deleted", entityType: "user", entityId: u.id, ip: c.get("ip") });
    });
    destroySession(c);
    return c.json({ ok: true });
  });
