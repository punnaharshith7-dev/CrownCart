import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Ctx } from "../context.ts";
import type { Db } from "../db.ts";
import { config } from "../config.ts";
import { badRequest, conflict, notFound } from "../lib/errors.ts";
import { body, email, id } from "../lib/validate.ts";
import { requireStore, requireUser, storeRolesFor } from "../lib/auth.ts";
import { audit } from "../lib/audit.ts";
import { notify, sendEmail } from "../lib/notify.ts";
import { parseRange, salesMetrics, toCsv } from "../lib/analytics.ts";
import { ORDER_STATUS_LABELS, restockVariant, transitionOrder, type OrderStatus } from "../lib/orders.ts";
import { cancelAndRefund, startRefund } from "../lib/payments.ts";
import { approvedPartners, assignPartner, createShipment } from "../lib/fulfilment.ts";
import { saveUpload } from "../lib/uploads.ts";
import { randomToken, sha256 } from "../lib/crypto.ts";
import { MEMBER_ROLES } from "../lib/permissions.ts";
import { ORDER_LIST_SQL, invoiceHtml, orderDetail, orderSummary } from "./orders.ts";

const sid = (c: Ctx) => {
  const n = Number(c.req.param("storeId"));
  if (!Number.isInteger(n) || n <= 0) throw notFound("Store not found.");
  return n;
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

function uniqueSlug(db: Db, table: "products" | "brands" | "categories" | "stores" | "collections", base: string, exceptId?: number) {
  let slug = slugify(base) || "item";
  for (let i = 2; db.get(`SELECT 1 FROM ${table} WHERE slug = ? AND id != ?`, [slug, exceptId ?? 0]); i++) slug = `${slugify(base)}-${i}`;
  return slug;
}

export function brandIdFor(db: Db, name?: string | null) {
  if (!name?.trim()) return null;
  const existing = db.get("SELECT id FROM brands WHERE name = ? COLLATE NOCASE", [name.trim()]);
  if (existing) return existing.id as number;
  return db.run("INSERT INTO brands (name, slug) VALUES (?, ?)", [name.trim(), uniqueSlug(db, "brands", name)]).lastId;
}

/** Loads a product only if it belongs to this store (object-level check). */
function storeProduct(db: Db, storeId: number, productId: number) {
  const p = db.get("SELECT * FROM products WHERE id = ? AND store_id = ?", [productId, storeId]);
  if (!p) throw notFound("Product not found.");
  return p;
}

function storeVariant(db: Db, storeId: number, variantId: number) {
  const v = db.get("SELECT v.* FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = ? AND p.store_id = ?", [variantId, storeId]);
  if (!v) throw notFound("Variant not found.");
  return v;
}

function storeOrder(db: Db, storeId: number, number: string) {
  const o = db.get("SELECT * FROM orders WHERE number = ? AND store_id = ?", [number, storeId]);
  if (!o) throw notFound("Order not found.");
  return o;
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().max(60).optional().nullable(),
  categoryId: id.nullable().optional(),
  titleLine1: z.string().trim().max(40).default(""),
  titleLine2: z.string().trim().max(40).default(""),
  accent: z.string().trim().max(40).default(""),
  tagline: z.string().trim().max(160).default(""),
  badge: z.string().trim().max(30).default(""),
  description: z.string().trim().max(5000).default(""),
  care: z.string().trim().max(2000).default(""),
  warranty: z.string().trim().max(2000).default(""),
  returnDays: z.number().int().min(0).max(60).default(7),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(160).optional().nullable(),
  specs: z.array(z.object({ label: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(200) })).max(30).default([]),
});

const variantSchema = z.object({
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]{2,40}$/, "SKU may use letters, numbers, dot, dash and underscore."),
  name: z.string().trim().min(1).max(60).default("Standard"),
  color: z.string().trim().max(30).optional().nullable(),
  size: z.string().trim().max(20).optional().nullable(),
  pricePaise: z.number().int().positive().max(10_000_000_00),
  compareAtPaise: z.number().int().positive().optional().nullable(),
  maxPerOrder: z.number().int().min(1).max(50).default(5),
  isActive: z.boolean().default(true),
  lowStockThreshold: z.number().int().min(0).max(1000).default(3),
});

function writeSpecs(db: Db, productId: number, specs: { label: string; value: string }[]) {
  db.run("DELETE FROM product_specs WHERE product_id = ?", [productId]);
  specs.forEach((s, i) => db.run("INSERT INTO product_specs (product_id, label, value, sort_order) VALUES (?, ?, ?, ?)", [productId, s.label, s.value, i]));
}

function productAdminView(db: Db, productId: number) {
  const p = db.get(
    `SELECT p.*, b.name AS brand, c.name AS category FROM products p LEFT JOIN brands b ON b.id = p.brand_id LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
    [productId],
  )!;
  return {
    id: p.id,
    storeId: p.store_id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    categoryId: p.category_id,
    category: p.category,
    titleLine1: p.title_line1,
    titleLine2: p.title_line2,
    accent: p.accent,
    tagline: p.tagline,
    badge: p.badge,
    description: p.description,
    care: p.care,
    warranty: p.warranty,
    returnDays: p.return_days,
    status: p.status,
    isFeatured: Boolean(p.is_featured),
    showcaseOrder: p.showcase_order,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    specs: db.all("SELECT label, value FROM product_specs WHERE product_id = ? ORDER BY sort_order", [p.id]),
    variants: db
      .all(
        `SELECT v.*, COALESCE(i.on_hand,0) on_hand, COALESCE(i.reserved,0) reserved, COALESCE(i.low_stock_threshold,3) low
           FROM product_variants v LEFT JOIN inventory i ON i.variant_id = v.id WHERE v.product_id = ? ORDER BY v.sort_order, v.id`,
        [p.id],
      )
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        color: v.color,
        size: v.size,
        pricePaise: v.price_paise,
        compareAtPaise: v.compare_at_paise,
        maxPerOrder: v.max_per_order,
        isActive: Boolean(v.is_active),
        onHand: v.on_hand,
        reserved: v.reserved,
        lowStockThreshold: v.low,
      })),
    media: db.all("SELECT id, variant_id AS variantId, kind, url, alt, sort_order AS sortOrder FROM product_media WHERE product_id = ? ORDER BY sort_order, id", [p.id]),
  };
}

const STORE_ORDER_ACTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  confirmed: ["processing"],
  processing: ["ready_for_dispatch"],
  ready_for_dispatch: ["processing"],
  cancellation_requested: ["processing"],
};

export const ownerRoutes = new Hono<AppEnv>()
  .get("/stores", (c) => {
    const u = requireUser(c);
    return c.json({ stores: storeRolesFor(c.get("db"), u.id).map((s) => ({ id: s.store_id, name: s.name, slug: s.slug, status: s.status, role: s.member_role })) });
  })

  // ── Dashboard & reports ──
  .get("/stores/:storeId/dashboard", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.analytics");
    const db = c.get("db");
    const range = parseRange(c.req.query("from"), c.req.query("to"));
    const metrics = salesMetrics(db, "o.store_id = ?", [storeId], range);
    const today = salesMetrics(db, "o.store_id = ?", [storeId], parseRange(new Date().toISOString(), new Date().toISOString()));
    const lowStock = db.all(
      `SELECT p.id AS product_id, p.name, v.id AS variant_id, v.sku, v.name AS variant, i.on_hand - i.reserved AS available, i.low_stock_threshold
         FROM inventory i JOIN product_variants v ON v.id = i.variant_id JOIN products p ON p.id = v.product_id
        WHERE p.store_id = ? AND p.status = 'active' AND v.is_active = 1 AND i.on_hand - i.reserved <= i.low_stock_threshold
        ORDER BY available LIMIT 20`,
      [storeId],
    );
    const recent = db.all(`${ORDER_LIST_SQL} WHERE o.store_id = ? AND o.status != 'pending_payment' ORDER BY o.created_at DESC LIMIT 8`, [storeId]);
    const activity = db.all(
      `SELECT a.action, a.entity_type, a.entity_id, a.created_at, u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.store_id = ? ORDER BY a.id DESC LIMIT 10`,
      [storeId],
    );
    return c.json({
      metrics,
      today: { orders: today.orders, netSalesPaise: today.netSalesPaise },
      lowStock: lowStock.map((l) => ({ ...l, outOfStock: l.available <= 0 })),
      recentOrders: recent.map(orderSummary),
      activity,
    });
  })

  .get("/stores/:storeId/reports/orders.csv", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.finance");
    const range = parseRange(c.req.query("from"), c.req.query("to"));
    const rows = c.get("db").all(
      `SELECT o.number, COALESCE(o.placed_at, o.created_at) AS placed_at, o.status, o.payment_method, o.payment_status,
              o.subtotal_paise / 100.0 AS subtotal, o.discount_paise / 100.0 AS discount, o.shipping_paise / 100.0 AS shipping,
              o.total_paise / 100.0 AS total, o.refunded_paise / 100.0 AS refunded, o.coupon_code, o.ship_city, o.ship_pincode
         FROM orders o WHERE o.store_id = ? AND o.status != 'pending_payment' AND COALESCE(o.placed_at, o.created_at) BETWEEN ? AND ? ORDER BY placed_at`,
      [storeId, range.from, range.to],
    );
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="orders-${range.from.slice(0, 10)}-${range.to.slice(0, 10)}.csv"`);
    return c.body(toCsv(rows));
  })

  // ── Products ──
  .get("/stores/:storeId/products", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.products");
    const q = (c.req.query("q") ?? "").trim();
    const status = c.req.query("status");
    const rows = c.get("db").all(
      `SELECT p.id, p.slug, p.name, p.status, p.is_featured, p.updated_at, b.name AS brand, c.name AS category,
              (SELECT MIN(price_paise) FROM product_variants WHERE product_id = p.id) AS price_paise,
              (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) AS variants,
              (SELECT COALESCE(SUM(i.on_hand),0) FROM inventory i JOIN product_variants v ON v.id = i.variant_id WHERE v.product_id = p.id) AS on_hand,
              (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind IN ('image','hero') ORDER BY m.kind='image' DESC, m.sort_order LIMIT 1) AS image
         FROM products p LEFT JOIN brands b ON b.id = p.brand_id LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.store_id = ? ${q ? "AND (p.name LIKE ? OR EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.sku LIKE ?))" : ""}
              ${status ? "AND p.status = ?" : ""}
        ORDER BY p.updated_at DESC LIMIT 500`,
      [storeId, ...(q ? [`%${q}%`, `%${q}%`] : []), ...(status ? [status] : [])],
    );
    return c.json({
      products: rows.map((r) => ({
        id: r.id, slug: r.slug, name: r.name, status: r.status, isFeatured: Boolean(r.is_featured), updatedAt: r.updated_at,
        brand: r.brand, category: r.category, pricePaise: r.price_paise, variants: r.variants, onHand: r.on_hand, image: r.image,
      })),
    });
  })

  .get("/stores/:storeId/products/:productId", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.products");
    const db = c.get("db");
    const p = storeProduct(db, storeId, Number(c.req.param("productId")));
    return c.json({ product: productAdminView(db, p.id) });
  })

  .post("/stores/:storeId/products", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.products");
    const input = await body(c, productSchema.extend({ variants: z.array(variantSchema.extend({ stock: z.number().int().min(0).max(100000).default(0) })).min(1).max(50) }));
    const db = c.get("db");
    const productId = db.tx(() => {
      if (input.categoryId && !db.get("SELECT 1 FROM categories WHERE id = ? AND is_active = 1", [input.categoryId])) throw badRequest("Unknown category.");
      const pid = db.run(
        `INSERT INTO products (store_id, brand_id, category_id, slug, name, title_line1, title_line2, accent, tagline, badge, description, care, warranty,
                               return_days, status, is_featured, seo_title, seo_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          storeId, brandIdFor(db, input.brand), input.categoryId ?? null, uniqueSlug(db, "products", `${input.brand ?? ""} ${input.name}`), input.name,
          input.titleLine1, input.titleLine2, input.accent, input.tagline, input.badge, input.description, input.care, input.warranty,
          input.returnDays, input.status, input.isFeatured ? 1 : 0, input.seoTitle ?? null, input.seoDescription ?? null,
        ],
      ).lastId;
      writeSpecs(db, pid, input.specs);
      input.variants.forEach((v, i) => {
        if (db.get("SELECT 1 FROM product_variants WHERE sku = ?", [v.sku])) throw conflict(`SKU ${v.sku} is already in use.`);
        const vid = db.run(
          "INSERT INTO product_variants (product_id, sku, name, color, size, price_paise, compare_at_paise, max_per_order, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [pid, v.sku, v.name, v.color ?? null, v.size ?? null, v.pricePaise, v.compareAtPaise ?? null, v.maxPerOrder, v.isActive ? 1 : 0, i],
        ).lastId;
        db.run("INSERT INTO inventory (variant_id, on_hand, low_stock_threshold) VALUES (?, ?, ?)", [vid, v.stock, v.lowStockThreshold]);
        if (v.stock) db.run("INSERT INTO inventory_movements (variant_id, delta_on_hand, reason, actor_user_id) VALUES (?, ?, 'initial_stock', ?)", [vid, v.stock, u.id]);
      });
      audit(db, { actorId: u.id, action: "product.created", entityType: "product", entityId: pid, storeId, details: { name: input.name }, ip: c.get("ip") });
      return pid;
    });
    return c.json({ product: productAdminView(db, productId) }, 201);
  })

  .put("/stores/:storeId/products/:productId", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.products");
    const input = await body(c, productSchema);
    const db = c.get("db");
    const p = storeProduct(db, storeId, Number(c.req.param("productId")));
    db.tx(() => {
      if (input.categoryId && !db.get("SELECT 1 FROM categories WHERE id = ? AND is_active = 1", [input.categoryId])) throw badRequest("Unknown category.");
      if (input.status === "active" && !db.get("SELECT 1 FROM product_variants WHERE product_id = ? AND is_active = 1", [p.id])) {
        throw badRequest("Add at least one active variant before publishing.");
      }
      db.run(
        `UPDATE products SET brand_id = ?, category_id = ?, name = ?, title_line1 = ?, title_line2 = ?, accent = ?, tagline = ?, badge = ?, description = ?,
                care = ?, warranty = ?, return_days = ?, status = ?, is_featured = ?, seo_title = ?, seo_description = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
        [
          brandIdFor(db, input.brand), input.categoryId ?? null, input.name, input.titleLine1, input.titleLine2, input.accent, input.tagline, input.badge,
          input.description, input.care, input.warranty, input.returnDays, input.status, input.isFeatured ? 1 : 0, input.seoTitle ?? null,
          input.seoDescription ?? null, p.id,
        ],
      );
      writeSpecs(db, p.id, input.specs);
      const changed = Object.fromEntries(
        Object.entries({ name: [p.name, input.name], status: [p.status, input.status], returnDays: [p.return_days, input.returnDays] }).filter(([, [a, b]]) => a !== b),
      );
      audit(db, { actorId: u.id, action: "product.updated", entityType: "product", entityId: p.id, storeId, details: changed, ip: c.get("ip") });
    });
    return c.json({ product: productAdminView(db, p.id) });
  })

  .post("/stores/:storeId/products/:productId/variants", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.products");
    const v = await body(c, variantSchema.extend({ stock: z.number().int().min(0).max(100000).default(0) }));
    const db = c.get("db");
    const p = storeProduct(db, storeId, Number(c.req.param("productId")));
    db.tx(() => {
      if (db.get("SELECT 1 FROM product_variants WHERE sku = ?", [v.sku])) throw conflict(`SKU ${v.sku} is already in use.`);
      const vid = db.run(
        "INSERT INTO product_variants (product_id, sku, name, color, size, price_paise, compare_at_paise, max_per_order, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM product_variants WHERE product_id = ?))",
        [p.id, v.sku, v.name, v.color ?? null, v.size ?? null, v.pricePaise, v.compareAtPaise ?? null, v.maxPerOrder, v.isActive ? 1 : 0, p.id],
      ).lastId;
      db.run("INSERT INTO inventory (variant_id, on_hand, low_stock_threshold) VALUES (?, ?, ?)", [vid, v.stock, v.lowStockThreshold]);
      if (v.stock) db.run("INSERT INTO inventory_movements (variant_id, delta_on_hand, reason, actor_user_id) VALUES (?, ?, 'initial_stock', ?)", [vid, v.stock, u.id]);
      audit(db, { actorId: u.id, action: "variant.created", entityType: "variant", entityId: vid, storeId, details: { sku: v.sku, pricePaise: v.pricePaise } });
    });
    return c.json({ product: productAdminView(db, p.id) }, 201);
  })

  .put("/stores/:storeId/variants/:variantId", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.products");
    const input = await body(c, variantSchema);
    const db = c.get("db");
    const v = storeVariant(db, storeId, Number(c.req.param("variantId")));
    db.tx(() => {
      if (input.sku !== v.sku && db.get("SELECT 1 FROM product_variants WHERE sku = ?", [input.sku])) throw conflict(`SKU ${input.sku} is already in use.`);
      if (input.compareAtPaise != null && input.compareAtPaise <= input.pricePaise) throw badRequest("The compare-at price must be higher than the selling price.");
      db.run(
        "UPDATE product_variants SET sku = ?, name = ?, color = ?, size = ?, price_paise = ?, compare_at_paise = ?, max_per_order = ?, is_active = ? WHERE id = ?",
        [input.sku, input.name, input.color ?? null, input.size ?? null, input.pricePaise, input.compareAtPaise ?? null, input.maxPerOrder, input.isActive ? 1 : 0, v.id],
      );
      db.run("UPDATE inventory SET low_stock_threshold = ? WHERE variant_id = ?", [input.lowStockThreshold, v.id]);
      if (input.pricePaise !== v.price_paise) {
        audit(db, { actorId: u.id, action: "variant.price_changed", entityType: "variant", entityId: v.id, storeId, details: { from: v.price_paise, to: input.pricePaise } });
        if (input.pricePaise < v.price_paise) {
          // Price-drop alerts for shoppers who saved this product and opted in.
          const watchers = db.all(
            "SELECT w.user_id, u.preferences FROM wishlist_items w JOIN users u ON u.id = w.user_id WHERE w.product_id = ?",
            [v.product_id],
          );
          const p = db.get("SELECT name, slug FROM products WHERE id = ?", [v.product_id])!;
          for (const w of watchers) {
            if (JSON.parse(w.preferences).priceDropAlerts === false) continue;
            notify(db, w.user_id, { type: "wishlist.price_drop", title: `Price drop: ${p.name}`, body: `Now ₹${(input.pricePaise / 100).toLocaleString("en-IN")}`, link: `/product/${p.slug}` });
          }
        }
      }
    });
    return c.json({ product: productAdminView(db, v.product_id) });
  })

  .post("/stores/:storeId/products/:productId/media", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.products");
    const db = c.get("db");
    const p = storeProduct(db, storeId, Number(c.req.param("productId")));
    const form = await c.req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw badRequest("Attach a file.");
    const requestedKind = String(form!.get("kind") ?? "image");
    const alt = String(form!.get("alt") ?? "").slice(0, 200);
    const saved = await saveUpload(file, config.publicUploadDir, ["image", "video", "model"]);
    const kind = saved.kind === "image" ? (requestedKind === "hero" ? "hero" : requestedKind === "poster" ? "poster" : "image") : saved.kind;
    const mediaId = db.run(
      "INSERT INTO product_media (product_id, kind, url, alt, sort_order) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM product_media WHERE product_id = ?))",
      [p.id, kind, `/uploads/${saved.name}`, alt || p.name, p.id],
    ).lastId;
    audit(db, { actorId: u.id, action: "media.uploaded", entityType: "product_media", entityId: mediaId, storeId, details: { kind, productId: p.id } });
    return c.json({ product: productAdminView(db, p.id) }, 201);
  })

  .delete("/stores/:storeId/media/:mediaId", (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.products");
    const db = c.get("db");
    const m = db.get("SELECT m.* FROM product_media m JOIN products p ON p.id = m.product_id WHERE m.id = ? AND p.store_id = ?", [Number(c.req.param("mediaId")), storeId]);
    if (!m) throw notFound();
    db.run("DELETE FROM product_media WHERE id = ?", [m.id]);
    audit(db, { actorId: u.id, action: "media.removed", entityType: "product_media", entityId: m.id, storeId });
    return c.json({ product: productAdminView(db, m.product_id) });
  })

  // ── Inventory ──
  .get("/stores/:storeId/inventory", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.inventory");
    const rows = c.get("db").all(
      `SELECT v.id AS variant_id, v.sku, v.name AS variant, p.id AS product_id, p.name AS product, p.status,
              i.on_hand, i.reserved, i.on_hand - i.reserved AS available, i.low_stock_threshold
         FROM inventory i JOIN product_variants v ON v.id = i.variant_id JOIN products p ON p.id = v.product_id
        WHERE p.store_id = ? ORDER BY available, p.name`,
      [storeId],
    );
    return c.json({ inventory: rows });
  })

  .post("/stores/:storeId/inventory/adjust", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.inventory");
    const input = await body(
      c,
      z.object({
        variantId: id,
        delta: z.number().int().min(-100000).max(100000).refine((d) => d !== 0, "Enter a non-zero adjustment."),
        reason: z.enum(["restock", "damaged", "lost", "correction", "returned_to_supplier", "stock_count"]),
        note: z.string().trim().max(200).default(""),
      }),
    );
    const db = c.get("db");
    const v = storeVariant(db, storeId, input.variantId);
    const subscribers = db.tx(() => {
      const before = db.get("SELECT on_hand, reserved FROM inventory WHERE variant_id = ?", [v.id])!;
      if (before.on_hand + input.delta < before.reserved) {
        throw conflict(`Stock can't go below ${before.reserved}: that many units are reserved for open orders.`);
      }
      db.run("UPDATE inventory SET on_hand = on_hand + ? WHERE variant_id = ?", [input.delta, v.id]);
      db.run("INSERT INTO inventory_movements (variant_id, delta_on_hand, reason, ref_type, ref_id, actor_user_id) VALUES (?, ?, ?, 'note', ?, ?)", [
        v.id,
        input.delta,
        input.reason,
        input.note,
        u.id,
      ]);
      audit(db, { actorId: u.id, action: "inventory.adjusted", entityType: "variant", entityId: v.id, storeId, details: { delta: input.delta, reason: input.reason, note: input.note } });
      // Back-in-stock alerts fire when sellable stock goes from zero to positive.
      if (before.on_hand - before.reserved <= 0 && before.on_hand + input.delta - before.reserved > 0) {
        const p = db.get("SELECT name, slug FROM products WHERE id = ?", [v.product_id])!;
        const subs = db.all("SELECT user_id FROM stock_alerts WHERE variant_id = ? AND notified_at IS NULL", [v.id]);
        for (const s of subs) notify(db, s.user_id, { type: "stock.back", title: `Back in stock: ${p.name}`, link: `/product/${p.slug}` });
        db.run("UPDATE stock_alerts SET notified_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE variant_id = ? AND notified_at IS NULL", [v.id]);
        return subs.length;
      }
      return 0;
    });
    return c.json({ ok: true, notified: subscribers });
  })

  .get("/stores/:storeId/inventory/movements", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.inventory");
    const rows = c.get("db").all(
      `SELECT m.id, m.delta_on_hand, m.delta_reserved, m.reason, m.ref_type, m.ref_id, m.created_at, v.sku, p.name AS product, u.name AS actor
         FROM inventory_movements m JOIN product_variants v ON v.id = m.variant_id JOIN products p ON p.id = v.product_id
         LEFT JOIN users u ON u.id = m.actor_user_id
        WHERE p.store_id = ? ${c.req.query("variantId") ? "AND v.id = ?" : ""} ORDER BY m.id DESC LIMIT 300`,
      [storeId, ...(c.req.query("variantId") ? [Number(c.req.query("variantId"))] : [])],
    );
    return c.json({ movements: rows });
  })

  .get("/stores/:storeId/inventory.csv", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.inventory");
    const rows = c.get("db").all(
      `SELECT v.sku, p.name AS product, v.name AS variant, i.on_hand, i.reserved, i.on_hand - i.reserved AS available, i.low_stock_threshold
         FROM inventory i JOIN product_variants v ON v.id = i.variant_id JOIN products p ON p.id = v.product_id WHERE p.store_id = ? ORDER BY p.name`,
      [storeId],
    );
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", 'attachment; filename="inventory.csv"');
    return c.body(toCsv(rows));
  })

  // ── Orders ──
  .get("/stores/:storeId/orders", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.orders");
    const status = c.req.query("status");
    const q = (c.req.query("q") ?? "").trim();
    const rows = c.get("db").all(
      `${ORDER_LIST_SQL} WHERE o.store_id = ? AND o.status != 'pending_payment' ${status ? "AND o.status = ?" : ""} ${q ? "AND (o.number LIKE ? OR o.ship_name LIKE ?)" : ""}
        ORDER BY o.created_at DESC LIMIT 300`,
      [storeId, ...(status ? [status] : []), ...(q ? [`%${q}%`, `%${q}%`] : [])],
    );
    return c.json({ orders: rows.map(orderSummary), statuses: ORDER_STATUS_LABELS });
  })

  .get("/stores/:storeId/orders/:number", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.orders");
    const db = c.get("db");
    const o = storeOrder(db, storeId, c.req.param("number"));
    const allowed = STORE_ORDER_ACTIONS[o.status as OrderStatus] ?? [];
    return c.json({
      order: orderDetail(db, o, "store"),
      actions: {
        transitions: allowed.map((s) => ({ to: s, label: ORDER_STATUS_LABELS[s] })),
        cancel: ["confirmed", "processing", "ready_for_dispatch", "cancellation_requested"].includes(o.status),
        approveCancellation: o.status === "cancellation_requested",
        createShipment: o.status === "ready_for_dispatch",
      },
      partners: o.status === "ready_for_dispatch" || o.status === "shipped" ? approvedPartners(db).map((p) => ({ id: p.id, name: p.name, availability: p.availability, openAssignments: p.open_assignments })) : [],
    });
  })

  .get("/stores/:storeId/orders/:number/invoice", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.orders");
    const db = c.get("db");
    c.header("Cache-Control", "private, no-store");
    return c.html(invoiceHtml(db, storeOrder(db, storeId, c.req.param("number"))));
  })

  .post("/stores/:storeId/orders/:number/status", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.orders");
    const input = await body(c, z.object({ to: z.enum(["processing", "ready_for_dispatch"]), note: z.string().trim().max(300).default("") }));
    const db = c.get("db");
    const o = storeOrder(db, storeId, c.req.param("number"));
    if (!(STORE_ORDER_ACTIONS[o.status as OrderStatus] ?? []).includes(input.to)) throw conflict(`This order can't move to "${ORDER_STATUS_LABELS[input.to]}" now.`);
    db.tx(() => {
      transitionOrder(db, o.id, input.to, u.id, input.note || (input.to === "processing" && o.status === "cancellation_requested" ? "Cancellation request declined." : ""));
      if (input.to === "ready_for_dispatch") createShipment(db, o.id);
      audit(db, { actorId: u.id, action: "order.status", entityType: "order", entityId: o.id, storeId, details: { from: o.status, to: input.to } });
    });
    return c.json({ order: orderDetail(db, db.get("SELECT * FROM orders WHERE id = ?", [o.id])!, "store") });
  })

  .post("/stores/:storeId/orders/:number/cancel", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.orders");
    const { reason } = await body(c, z.object({ reason: z.string().trim().min(3).max(300) }));
    const db = c.get("db");
    const o = storeOrder(db, storeId, c.req.param("number"));
    if (!["confirmed", "processing", "ready_for_dispatch", "cancellation_requested"].includes(o.status)) throw conflict("This order can no longer be cancelled by the store.");
    // Cancelling triggers a refund, so the finance permission is required too.
    if (o.payment_status === "paid") requireStore(c, storeId, "store.finance");
    await cancelAndRefund(db, o.id, u.id, reason);
    audit(db, { actorId: u.id, action: "order.cancelled", entityType: "order", entityId: o.id, storeId, details: { reason } });
    return c.json({ order: orderDetail(db, db.get("SELECT * FROM orders WHERE id = ?", [o.id])!, "store") });
  })

  .post("/stores/:storeId/orders/:number/assign", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.orders");
    const { partnerId } = await body(c, z.object({ partnerId: id }));
    const db = c.get("db");
    const o = storeOrder(db, storeId, c.req.param("number"));
    db.tx(() => {
      const shipment = createShipment(db, o.id);
      assignPartner(db, shipment.id, partnerId, u.id);
    });
    return c.json({ order: orderDetail(db, db.get("SELECT * FROM orders WHERE id = ?", [o.id])!, "store") });
  })

  .post("/stores/:storeId/returns/:returnId", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.orders");
    const input = await body(c, z.object({ action: z.enum(["approve", "reject", "receive", "refund"]), note: z.string().trim().max(500).default(""), restock: z.boolean().default(true) }));
    const db = c.get("db");
    const r = db.get("SELECT rr.*, o.store_id, o.number, o.id AS oid FROM return_requests rr JOIN orders o ON o.id = rr.order_id WHERE rr.id = ? AND o.store_id = ?", [
      Number(c.req.param("returnId")),
      storeId,
    ]);
    if (!r) throw notFound("Return not found.");
    const next: Record<string, [string[], string]> = {
      approve: [["requested"], "approved"],
      reject: [["requested"], "rejected"],
      receive: [["approved", "picked_up"], "received"],
      refund: [["received"], "refunded"],
    };
    const [from, to] = next[input.action];
    if (!from.includes(r.status)) throw conflict(`A return that is "${r.status}" can't be ${input.action}d.`);
    if (input.action === "refund") requireStore(c, storeId, "store.finance");

    let refundAmount = 0;
    db.tx(() => {
      db.run("UPDATE return_requests SET status = ?, resolution_note = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [to, input.note, r.id]);
      const items = db.all("SELECT ri.quantity, oi.* FROM return_items ri JOIN order_items oi ON oi.id = ri.order_item_id WHERE ri.return_id = ?", [r.id]);
      if (input.action === "reject") transitionOrder(db, r.oid, "delivered", u.id, `Return declined. ${input.note}`.trim());
      if (input.action === "receive") {
        for (const it of items) {
          db.run("UPDATE order_items SET returned_qty = returned_qty + ? WHERE id = ?", [it.quantity, it.id]);
          if (input.restock) restockVariant(db, it.variant_id, it.quantity, "customer_return", String(r.oid), u.id);
        }
        transitionOrder(db, r.oid, "returned", u.id, "Returned items received.");
      }
      if (input.action === "approve") {
        notify(db, r.user_id, { type: "return.approved", title: `Return approved for ${r.number}`, body: input.note || "Please keep the items ready in their original packaging.", link: `/account/orders/${r.number}` });
      }
      if (input.action === "refund") {
        const o = db.get("SELECT * FROM orders WHERE id = ?", [r.oid])!;
        const itemsTotal = items.reduce((s, it) => s + it.unit_price_paise * it.quantity, 0);
        // Discounts are returned proportionally; shipping is not refunded on returns.
        refundAmount = itemsTotal - Math.round((o.discount_paise * itemsTotal) / Math.max(o.subtotal_paise, 1));
      }
      audit(db, { actorId: u.id, action: `return.${input.action}`, entityType: "return", entityId: r.id, storeId, details: { note: input.note } });
    });
    if (refundAmount > 0) await startRefund(db, r.oid, refundAmount, `Return ${r.id}: ${r.reason}`, u.id, r.id);
    return c.json({ order: orderDetail(db, db.get("SELECT * FROM orders WHERE id = ?", [r.oid])!, "store") });
  })

  // ── Promotions ──
  .get("/stores/:storeId/coupons", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.promotions");
    const rows = c.get("db").all(
      "SELECT c.*, (SELECT COUNT(*) FROM coupon_redemptions r WHERE r.coupon_id = c.id) AS used FROM coupons c WHERE c.store_id = ? ORDER BY c.created_at DESC",
      [storeId],
    );
    return c.json({ coupons: rows });
  })

  .post("/stores/:storeId/coupons", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.promotions");
    const input = await body(c, couponSchema);
    const db = c.get("db");
    if (db.get("SELECT 1 FROM coupons WHERE code = ?", [input.code])) throw conflict("That code is already in use.");
    const cid = db.run(
      `INSERT INTO coupons (code, store_id, kind, value, min_order_paise, max_discount_paise, starts_at, ends_at, usage_limit, per_user_limit, first_order_only, is_active, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.code, storeId, input.kind, input.value, input.minOrderPaise, input.maxDiscountPaise ?? null, input.startsAt ?? null, input.endsAt ?? null,
        input.usageLimit ?? null, input.perUserLimit, input.firstOrderOnly ? 1 : 0, input.isActive ? 1 : 0, input.description, u.id,
      ],
    ).lastId;
    audit(db, { actorId: u.id, action: "coupon.created", entityType: "coupon", entityId: cid, storeId, details: { code: input.code, kind: input.kind, value: input.value } });
    return c.json({ ok: true }, 201);
  })

  .patch("/stores/:storeId/coupons/:couponId", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.promotions");
    const { isActive } = await body(c, z.object({ isActive: z.boolean() }));
    const db = c.get("db");
    const r = db.run("UPDATE coupons SET is_active = ? WHERE id = ? AND store_id = ?", [isActive ? 1 : 0, Number(c.req.param("couponId")), storeId]);
    if (!r.changes) throw notFound();
    audit(db, { actorId: u.id, action: isActive ? "coupon.activated" : "coupon.deactivated", entityType: "coupon", entityId: c.req.param("couponId"), storeId });
    return c.json({ ok: true });
  })

  // ── Team ──
  .get("/stores/:storeId/team", (c) => {
    const storeId = sid(c);
    requireStore(c, storeId, "store.team");
    const db = c.get("db");
    return c.json({
      members: db.all("SELECT u.id, u.name, u.email, m.member_role AS role, m.created_at FROM store_members m JOIN users u ON u.id = m.user_id WHERE m.store_id = ? ORDER BY m.created_at", [storeId]),
      invitations: db.all(
        "SELECT id, email, member_role AS role, expires_at, created_at FROM invitations WHERE store_id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?",
        [storeId, new Date().toISOString()],
      ),
      roles: MEMBER_ROLES.filter((r) => r !== "owner"),
    });
  })

  .post("/stores/:storeId/team/invite", async (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.team");
    // Owners may add staff with restricted roles; only platform admins assign owners.
    const input = await body(c, z.object({ email, role: z.enum(["product_editor", "inventory_operator", "order_manager", "analyst"]) }));
    const db = c.get("db");
    const token = randomToken();
    db.tx(() => {
      db.run(
        "INSERT INTO invitations (email, role_key, store_id, member_role, token_hash, invited_by, expires_at) VALUES (?, 'customer', ?, ?, ?, ?, ?)",
        [input.email, storeId, input.role, sha256(token), u.id, new Date(Date.now() + 7 * 86_400_000).toISOString()],
      );
      const store = db.get("SELECT name FROM stores WHERE id = ?", [storeId])!;
      sendEmail(db, input.email, `You're invited to ${store.name} on CrownCart`, `${u.name} invited you to help run ${store.name} as ${input.role.replace(/_/g, " ")}.\n\nAccept: ${config.publicUrl}/invite/${token}\n\nThis link expires in 7 days.`);
      audit(db, { actorId: u.id, action: "team.invited", entityType: "store", entityId: storeId, storeId, details: { email: input.email, role: input.role } });
    });
    return c.json({ ok: true, ...(config.isProd ? {} : { devInviteUrl: `/invite/${token}` }) }, 201);
  })

  .delete("/stores/:storeId/team/:userId", (c) => {
    const storeId = sid(c);
    const u = requireStore(c, storeId, "store.team");
    const target = Number(c.req.param("userId"));
    const db = c.get("db");
    const m = db.get("SELECT member_role FROM store_members WHERE store_id = ? AND user_id = ?", [storeId, target]);
    if (!m) throw notFound();
    if (m.member_role === "owner") throw conflict("Owners can only be removed by a platform administrator.");
    db.run("DELETE FROM store_members WHERE store_id = ? AND user_id = ?", [storeId, target]);
    audit(db, { actorId: u.id, action: "team.removed", entityType: "store", entityId: storeId, storeId, details: { userId: target } });
    return c.json({ ok: true });
  })

  .get("/categories", (c) => {
    requireUser(c);
    return c.json({ categories: c.get("db").all("SELECT id, name, slug, parent_id AS parentId FROM categories WHERE is_active = 1 ORDER BY sort_order, name") });
  });

export const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,24}$/, "Use 3–24 letters, numbers, dashes or underscores."),
    kind: z.enum(["percent", "fixed"]),
    value: z.number().int().positive(),
    minOrderPaise: z.number().int().min(0).default(0),
    maxDiscountPaise: z.number().int().positive().optional().nullable(),
    startsAt: z.string().datetime().optional().nullable(),
    endsAt: z.string().datetime().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perUserLimit: z.number().int().min(1).max(100).default(1),
    firstOrderOnly: z.boolean().default(false),
    isActive: z.boolean().default(true),
    description: z.string().trim().max(200).default(""),
  })
  .refine((c) => c.kind === "fixed" || c.value <= 90, { message: "Percentage discounts can be at most 90%.", path: ["value"] })
  .refine((c) => !c.startsAt || !c.endsAt || c.startsAt < c.endsAt, { message: "The end date must be after the start date.", path: ["endsAt"] });
