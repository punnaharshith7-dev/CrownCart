import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Hono } from "hono";
import { z } from "zod";
import { config } from "../config.ts";
import type { AppEnv } from "../context.ts";
import type { Db, Row } from "../db.ts";
import { notFound, badRequest, forbidden } from "../lib/errors.ts";
import { hasReceivedProduct, MAX_REVIEW_PHOTOS, reviewPhotos } from "../lib/reviews.ts";
import { savePublicUpload } from "../lib/uploads.ts";
import { body, query } from "../lib/validate.ts";
import { requireUser } from "../lib/auth.ts";
import { getSetting } from "../lib/settings.ts";
import { rateLimit } from "../lib/rate-limit.ts";

/** Columns every product card needs. Only active products in active stores are public. */
const CARD_SQL = `
  SELECT p.id, p.slug, p.name, p.badge, p.tagline, p.gender, p.is_featured, p.created_at, p.view_count,
         b.name AS brand, b.slug AS brand_slug, c.name AS category, c.slug AS category_slug,
         (SELECT MIN(v.price_paise) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1) AS price_paise,
         (SELECT v.compare_at_paise FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1 ORDER BY v.price_paise LIMIT 1) AS compare_at_paise,
         (SELECT COALESCE(SUM(MAX(i.on_hand - i.reserved, 0)), 0) FROM product_variants v JOIN inventory i ON i.variant_id = v.id
           WHERE v.product_id = p.id AND v.is_active = 1) AS available,
         (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind = 'image' ORDER BY m.sort_order LIMIT 1) AS image,
         (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind = 'hero' ORDER BY m.sort_order LIMIT 1) AS hero_image,
         (SELECT json_group_array(json_object('id', v.id, 'name', v.name, 'available', (SELECT COALESCE(SUM(MAX(i.on_hand - i.reserved, 0)), 0) FROM inventory i WHERE i.variant_id = v.id)))
            FROM (SELECT id, name FROM product_variants WHERE product_id = p.id AND is_active = 1 ORDER BY id) v) AS card_variants,
         (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.status = 'published') AS rating,
         (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'published') AS review_count,
         (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE oi.product_id = p.id AND o.status NOT IN ('pending_payment','failed','expired','cancelled')) AS sold
    FROM products p
    JOIN stores s ON s.id = p.store_id AND s.status = 'active'
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
   WHERE p.status = 'active'`;

/** Transparent product cutouts generated ahead of time (public/cutouts/index.json). Not every product has one. */
let cutouts: Record<string, { src: string; ok: boolean }> | null = null;
function cutoutFor(slug: string): string | null {
  if (!cutouts) {
    try {
      cutouts = JSON.parse(readFileSync(join(config.rootDir, "public", "cutouts", "index.json"), "utf8")) as Record<string, { src: string; ok: boolean }>;
    } catch {
      cutouts = {};
    }
  }
  const c = cutouts[slug];
  return c?.ok ? c.src : null;
}

export function toCard(r: Row) {
  const discount =
    r.compare_at_paise && r.compare_at_paise > r.price_paise
      ? Math.round(((r.compare_at_paise - r.price_paise) / r.compare_at_paise) * 100)
      : 0;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    brandSlug: r.brand_slug,
    category: r.category,
    categorySlug: r.category_slug,
    badge: r.badge,
    tagline: r.tagline,
    gender: r.gender ?? null,
    image: r.image ?? r.hero_image,
    // The hover view on cards: the product's other photo, when it has one.
    altImage: r.image && r.hero_image && r.hero_image !== r.image ? r.hero_image : null,
    cutout: cutoutFor(r.slug),
    variants: r.card_variants ? (JSON.parse(r.card_variants) as { id: number; name: string; available: number }[]) : [],
    pricePaise: r.price_paise,
    compareAtPaise: discount ? r.compare_at_paise : null,
    discountPercent: discount,
    inStock: r.available > 0,
    rating: r.rating == null ? null : Math.round(r.rating * 10) / 10,
    reviewCount: r.review_count,
    createdAt: r.created_at,
  };
}

const SORTS: Record<string, string> = {
  relevance: "relevance DESC, p.is_featured DESC, sold DESC",
  price_asc: "price_paise ASC",
  price_desc: "price_paise DESC",
  newest: "p.created_at DESC",
  rating: "COALESCE(rating, 0) DESC, review_count DESC",
  popular: "sold DESC, p.view_count DESC",
  discount: "CASE WHEN compare_at_paise > price_paise THEN (compare_at_paise - price_paise) * 1.0 / compare_at_paise ELSE 0 END DESC",
};

const listParams = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(80).optional(),
  brand: z.string().max(2000).optional(), // comma-separated slugs
  gender: z.enum(["men", "women", "unisex"]).optional(),
  minPrice: z.coerce.number().int().min(0).optional(), // rupees
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z.enum(["1", "0"]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  onSale: z.enum(["1", "0"]).optional(),
  sort: z.enum(Object.keys(SORTS) as [string, ...string[]]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

function categoryAndDescendants(db: Db, slug: string): number[] {
  const root = db.get("SELECT id FROM categories WHERE slug = ? AND is_active = 1", [slug]);
  if (!root) return [];
  return db
    .all(
      `WITH RECURSIVE t(id) AS (SELECT ? UNION ALL SELECT c.id FROM categories c JOIN t ON c.parent_id = t.id WHERE c.is_active = 1)
       SELECT id FROM t`,
      [root.id],
    )
    .map((r) => r.id);
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Suggests a correction for a query with no results, using catalog vocabulary. */
function didYouMean(db: Db, q: string): string | null {
  const vocab = new Set<string>();
  for (const r of db.all(
    `SELECT p.name, b.name AS brand, c.name AS category FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id LEFT JOIN categories c ON c.id = p.category_id WHERE p.status = 'active'`,
  )) {
    for (const s of [r.name, r.brand, r.category]) {
      for (const w of String(s ?? "").toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 2) vocab.add(w);
    }
  }
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  let changed = false;
  const fixed = words.map((w) => {
    if (vocab.has(w)) return w;
    let best = w;
    let bestD = Math.max(1, Math.floor(w.length / 4));
    for (const v of vocab) {
      const d = levenshtein(w, v);
      if (d <= bestD) {
        best = v;
        bestD = d;
      }
    }
    if (best !== w) changed = true;
    return best;
  });
  return changed ? fixed.join(" ") : null;
}

const SYNONYMS: Record<string, string[]> = {
  sneaker: ["shoe", "footwear", "trainer"],
  shoe: ["sneaker", "footwear"],
  watch: ["timepiece", "horology", "chronograph"],
  laptop: ["notebook", "computer"],
  jacket: ["bomber", "outerwear", "coat"],
};

export function searchProducts(db: Db, p: z.infer<typeof listParams>) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  const scoreParams: string[] = [];
  let relevance = "0";

  if (p.q) {
    const terms = p.q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
    const scoreParts: string[] = [];
    for (const term of terms) {
      const variants = [term, ...(SYNONYMS[term.replace(/s$/, "")] ?? [])];
      const ors: string[] = [];
      for (const v of variants) {
        const like = `%${v.replace(/[%_]/g, "")}%`;
        ors.push(
          `(lower(p.name) LIKE ? OR lower(COALESCE(b.name,'')) LIKE ? OR lower(COALESCE(c.name,'')) LIKE ? OR lower(p.tagline) LIKE ?
            OR lower(p.description) LIKE ?
            OR EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND lower(v.sku) LIKE ?)
            OR EXISTS (SELECT 1 FROM product_specs ps WHERE ps.product_id = p.id AND lower(ps.value) LIKE ?))`,
        );
        params.push(like, like, like, like, like, like, like);
      }
      where.push(`(${ors.join(" OR ")})`);
      const like = `%${term.replace(/[%_]/g, "")}%`;
      scoreParts.push("(CASE WHEN lower(x.name) LIKE ? THEN 3 ELSE 0 END + CASE WHEN lower(COALESCE(x.brand,'')) LIKE ? THEN 2 ELSE 0 END)");
      scoreParams.push(like, like);
    }
    relevance = scoreParts.join(" + ") || "0";
  }
  if (p.category) {
    const ids = categoryAndDescendants(db, p.category);
    if (!ids.length) where.push("0");
    else where.push(`p.category_id IN (${ids.map(() => "?").join(",")})`), params.push(...ids);
  }
  if (p.brand) {
    const brands = p.brand.split(",").filter(Boolean).slice(0, 100);
    where.push(`b.slug IN (${brands.map(() => "?").join(",")})`);
    params.push(...brands);
  }
  // Unisex products are for everyone, so they also show under Men and Women.
  if (p.gender) {
    where.push(p.gender === "unisex" ? "p.gender = 'unisex'" : "p.gender IN (?, 'unisex')");
    if (p.gender !== "unisex") params.push(p.gender);
  }

  const having: string[] = [];
  if (p.minPrice != null) having.push(`price_paise >= ${p.minPrice * 100}`);
  if (p.maxPrice != null) having.push(`price_paise <= ${p.maxPrice * 100}`);
  if (p.inStock === "1") having.push("available > 0");
  if (p.minRating != null) having.push(`COALESCE(rating, 0) >= ${p.minRating}`);
  if (p.onSale === "1") having.push("compare_at_paise > price_paise");

  // User input only reaches SQL as bound parameters; the HAVING clauses above use validated numbers.
  const base = `SELECT * FROM (SELECT x.*, ${relevance} AS relevance FROM (${CARD_SQL}${where.length ? " AND " + where.join(" AND ") : ""}) x) p
                ${having.length ? "WHERE " + having.join(" AND ") : ""}`;
  const allParams = [...scoreParams, ...params];
  const total = db.get<{ n: number }>(`SELECT COUNT(*) n FROM (${base})`, allParams)!.n;
  const rows = db.all(`${base} ORDER BY ${SORTS[p.sort]}, p.id LIMIT ? OFFSET ?`, [...allParams, p.pageSize, (p.page - 1) * p.pageSize]);
  return { total, items: rows.map(toCard) };
}

function facets(db: Db) {
  const categories = db.all(
    `SELECT c.id, c.name, c.slug, c.parent_id, c.description,
            (SELECT COUNT(*) FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
              WHERE p.category_id = c.id AND p.status = 'active') AS count
       FROM categories c WHERE c.is_active = 1 ORDER BY c.sort_order, c.name`,
  );
  const brands = db.all(
    `SELECT b.name, b.slug, COUNT(p.id) AS count FROM brands b
       JOIN products p ON p.brand_id = b.id AND p.status = 'active'
       JOIN stores s ON s.id = p.store_id AND s.status = 'active'
      GROUP BY b.id ORDER BY b.name COLLATE NOCASE`,
  );
  const price = db.get(
    `SELECT MIN(v.price_paise) AS min, MAX(v.price_paise) AS max FROM product_variants v
       JOIN products p ON p.id = v.product_id AND p.status = 'active' WHERE v.is_active = 1`,
  );
  const gender = db.get(
    `SELECT COALESCE(SUM(p.gender IN ('men', 'unisex')), 0) AS men, COALESCE(SUM(p.gender IN ('women', 'unisex')), 0) AS women, COALESCE(SUM(p.gender = 'unisex'), 0) AS unisex
       FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active' WHERE p.status = 'active'`,
  )!;
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parent_id, description: c.description, count: c.count })),
    brands,
    genders: { men: gender.men, women: gender.women, unisex: gender.unisex },
    priceRange: { min: Math.floor((price?.min ?? 0) / 100), max: Math.ceil((price?.max ?? 0) / 100) },
  };
}

export function ratingSummary(db: Db, productId: number) {
  const dist = db.all("SELECT rating, COUNT(*) n FROM reviews WHERE product_id = ? AND status = 'published' GROUP BY rating", [productId]);
  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, count: dist.find((d) => d.rating === star)?.n ?? 0 }));
  const total = counts.reduce((s, d) => s + d.count, 0);
  const avg = total ? counts.reduce((s, d) => s + d.star * d.count, 0) / total : null;
  return { average: avg == null ? null : Math.round(avg * 10) / 10, total, distribution: counts };
}

export const catalogRoutes = new Hono<AppEnv>()
  .get("/home", (c) => {
    const db = c.get("db");
    const showcase = db.all(`${CARD_SQL} AND p.showcase_order IS NOT NULL ORDER BY p.showcase_order`);
    const detail = showcase.map((r) => {
      const p = db.get("SELECT title_line1, title_line2, accent, description FROM products WHERE id = ?", [r.id])!;
      const specs = db.all("SELECT label, value FROM product_specs WHERE product_id = ? ORDER BY sort_order LIMIT 4", [r.id]);
      const variant = db.get(
        "SELECT v.id FROM product_variants v JOIN inventory i ON i.variant_id = v.id WHERE v.product_id = ? AND v.is_active = 1 ORDER BY (i.on_hand - i.reserved > 0) DESC, v.sort_order LIMIT 1",
        [r.id],
      );
      return {
        ...toCard(r),
        heroImage: r.hero_image ?? r.image,
        titleLine1: p.title_line1,
        titleLine2: p.title_line2,
        accent: p.accent,
        description: p.description,
        specs,
        defaultVariantId: variant?.id ?? null,
        variantCount: db.get<{ n: number }>("SELECT COUNT(*) n FROM product_variants WHERE product_id = ? AND is_active = 1", [r.id])!.n,
      };
    });
    const f = facets(db);
    return c.json({
      brand: getSetting(db, "brand"),
      homepage: getSetting(db, "homepage"),
      showcase: detail,
      categories: f.categories.filter((cat) => !cat.parentId),
      productCount: f.categories.reduce((s, cat) => s + cat.count, 0),
      features: getSetting(db, "features"),
      maintenance: getSetting(db, "maintenance"),
    });
  })

  .get("/facets", (c) => c.json(facets(c.get("db"))))

  // Brand directory: every brand with live products, its categories, starting price and a few pieces.
  .get("/brands", (c) => {
    const db = c.get("db");
    const cards = db.all(`${CARD_SQL} AND b.id IS NOT NULL ORDER BY p.is_featured DESC, p.view_count DESC`).map(toCard);
    type BrandEntry = { name: string; slug: string; count: number; fromPaise: number | null; categories: string[]; products: ReturnType<typeof toCard>[] };
    const byBrand = new Map<string, BrandEntry>();
    for (const card of cards) {
      const entry: BrandEntry = byBrand.get(card.brandSlug) ?? { name: card.brand, slug: card.brandSlug, count: 0, fromPaise: null, categories: [], products: [] };
      entry.count++;
      if (card.pricePaise != null && (entry.fromPaise == null || card.pricePaise < entry.fromPaise)) entry.fromPaise = card.pricePaise;
      if (card.category && !entry.categories.includes(card.category)) entry.categories.push(card.category);
      if (entry.products.length < 3) entry.products.push(card);
      byBrand.set(card.brandSlug, entry);
    }
    const brands = [...byBrand.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return c.json({ brands });
  })

  .get("/products", (c) => {
    const db = c.get("db");
    const p = query(c, listParams);
    const result = searchProducts(db, p);
    let suggestion: string | null = null;
    if (p.q) {
      if (result.total === 0) suggestion = didYouMean(db, p.q);
      if (p.page === 1) {
        db.run("INSERT INTO search_queries (query, results, user_id) VALUES (?, ?, ?)", [p.q.slice(0, 100), result.total, c.get("user")?.id ?? null]);
      }
    }
    return c.json({ ...result, page: p.page, pageSize: p.pageSize, suggestion });
  })

  .get("/suggest", (c) => {
    const q = (c.req.query("q") ?? "").trim().toLowerCase().slice(0, 60);
    if (q.length < 2) return c.json({ products: [], brands: [], categories: [] });
    const db = c.get("db");
    const like = `%${q.replace(/[%_]/g, "")}%`;
    const products = db.all(
      `${CARD_SQL} AND (lower(p.name) LIKE ? OR lower(COALESCE(b.name,'')) LIKE ?) ORDER BY p.is_featured DESC LIMIT 6`,
      [like, like],
    );
    const brands = db.all("SELECT name, slug FROM brands WHERE lower(name) LIKE ? LIMIT 4", [like]);
    const categories = db.all("SELECT name, slug FROM categories WHERE is_active = 1 AND lower(name) LIKE ? LIMIT 4", [like]);
    const popular = db.all(
      "SELECT query, COUNT(*) n FROM search_queries WHERE results > 0 AND lower(query) LIKE ? GROUP BY lower(query) ORDER BY n DESC LIMIT 4",
      [`${q.replace(/[%_]/g, "")}%`],
    );
    return c.json({ products: products.map(toCard), brands, categories, popular: popular.map((p) => p.query) });
  })

  .get("/popular-searches", (c) => {
    const rows = c.get("db").all(
      "SELECT lower(query) AS q, COUNT(*) n FROM search_queries WHERE results > 0 AND created_at > datetime('now','-30 days') GROUP BY lower(query) ORDER BY n DESC LIMIT 8",
    );
    return c.json({ searches: rows.map((r) => r.q) });
  })

  .get("/products/:slug", (c) => {
    const db = c.get("db");
    const row = db.get(`${CARD_SQL} AND p.slug = ?`, [c.req.param("slug")]);
    if (!row) throw notFound("This product is not available.");
    const p = db.get(
      `SELECT p.*, s.name AS store_name, s.slug AS store_slug FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = ?`,
      [row.id],
    )!;
    const variants = db.all(
      `SELECT v.id, v.sku, v.name, v.color, v.size, v.price_paise, v.compare_at_paise, v.max_per_order,
              MAX(COALESCE(i.on_hand - i.reserved, 0), 0) AS available, COALESCE(i.low_stock_threshold, 0) AS low
         FROM product_variants v LEFT JOIN inventory i ON i.variant_id = v.id
        WHERE v.product_id = ? AND v.is_active = 1 ORDER BY v.sort_order, v.id`,
      [p.id],
    );
    const show3d = getSetting(db, "features").viewer3d;
    const media = db
      .all("SELECT id, variant_id, kind, url, alt FROM product_media WHERE product_id = ? ORDER BY sort_order, id", [p.id])
      .filter((m) => show3d || m.kind !== "model");
    const specs = db.all("SELECT label, value FROM product_specs WHERE product_id = ? ORDER BY sort_order, id", [p.id]);
    const reviews = db.all(
      `SELECT r.id, r.rating, r.title, r.body, r.verified_purchase, r.helpful_count, r.created_at, u.name
         FROM reviews r JOIN users u ON u.id = r.user_id
        WHERE r.product_id = ? AND r.status = 'published' ORDER BY r.helpful_count DESC, r.created_at DESC LIMIT 20`,
      [p.id],
    );
    const related = db.all(`${CARD_SQL} AND p.id != ? AND (p.category_id = ? OR p.brand_id = ?) ORDER BY p.is_featured DESC LIMIT 4`, [
      p.id,
      p.category_id,
      p.brand_id,
    ]);
    const fill = related.length < 4 ? db.all(`${CARD_SQL} AND p.id != ? ORDER BY sold DESC LIMIT ?`, [p.id, 8]) : [];
    const relatedIds = new Set(related.map((r) => r.id));
    const relatedAll = [...related, ...fill.filter((r) => !relatedIds.has(r.id))].slice(0, 4);
    const u = c.get("user");
    const shipping = getSetting(db, "shipping");
    return c.json({
      product: {
        ...toCard(row),
        heroImage: row.hero_image,
        titleLine1: p.title_line1,
        titleLine2: p.title_line2,
        accent: p.accent,
        description: p.description,
        care: p.care,
        warranty: p.warranty,
        returnDays: p.return_days,
        store: { name: p.store_name, slug: p.store_slug },
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          color: v.color,
          size: v.size,
          pricePaise: v.price_paise,
          compareAtPaise: v.compare_at_paise && v.compare_at_paise > v.price_paise ? v.compare_at_paise : null,
          maxPerOrder: v.max_per_order,
          available: v.available,
          // Low-stock messaging only when it is true.
          lowStock: v.available > 0 && v.available <= v.low,
        })),
        media: media.map((m) => ({ id: m.id, variantId: m.variant_id, kind: m.kind, url: m.url, alt: m.alt })),
        specs,
        ratingSummary: ratingSummary(db, p.id),
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          verifiedPurchase: Boolean(r.verified_purchase),
          helpfulCount: r.helpful_count,
          createdAt: r.created_at,
          author: r.name.split(" ")[0],
          photos: reviewPhotos(db, r.id),
        })),
        canReview:
          Boolean(u) && getSetting(db, "features").reviews && hasReceivedProduct(db, u!.id, p.id) && !db.get("SELECT 1 FROM reviews WHERE product_id = ? AND user_id = ?", [p.id, u!.id]),
        inWishlist: u ? Boolean(db.get("SELECT 1 FROM wishlist_items WHERE user_id = ? AND product_id = ?", [u.id, p.id])) : false,
      },
      related: relatedAll.map(toCard),
      delivery: { estimateDaysMin: shipping.estimateDaysMin, estimateDaysMax: shipping.estimateDaysMax, freeThresholdPaise: shipping.freeThresholdPaise, flatPaise: shipping.flatPaise },
      tax: getSetting(db, "tax"),
    });
  })

  .post("/products/:slug/view", (c) => {
    const db = c.get("db");
    rateLimit(`view:${c.get("ip")}:${c.req.param("slug")}`, 3, 600_000);
    const p = db.get("SELECT id FROM products WHERE slug = ? AND status = 'active'", [c.req.param("slug")]);
    if (!p) throw notFound();
    const u = c.get("user");
    db.tx(() => {
      db.run("UPDATE products SET view_count = view_count + 1 WHERE id = ?", [p.id]);
      db.run("INSERT INTO analytics_events (name, user_id, product_id) VALUES ('product_view', ?, ?)", [u?.id ?? null, p.id]);
      if (u) {
        db.run(
          "INSERT INTO recently_viewed (user_id, product_id) VALUES (?, ?) ON CONFLICT DO UPDATE SET viewed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')",
          [u.id, p.id],
        );
      }
    });
    return c.json({ ok: true });
  })

  .post("/products/:slug/reviews", async (c) => {
    const u = requireUser(c);
    if (!getSetting(c.get("db"), "features").reviews) throw forbidden("Reviews are turned off right now.");
    rateLimit(`review:${u.id}`, 10, 3_600_000);
    const db = c.get("db");
    const p = db.get("SELECT id FROM products WHERE slug = ? AND status = 'active'", [c.req.param("slug")]);
    if (!p) throw notFound();
    const form = await c.req.formData().catch(() => null);
    if (!form) throw badRequest("Couldn't read the upload. Try again.");
    const input = z
      .object({
        rating: z.coerce.number({ message: "Choose a star rating." }).int().min(1, "Choose a star rating.").max(5),
        title: z.string().trim().max(120).default(""),
        body: z.string().trim().max(4000).default(""),
      })
      .safeParse({ rating: form.get("rating"), title: form.get("title") ?? undefined, body: form.get("body") ?? undefined });
    if (!input.success) throw badRequest(input.error.issues[0]?.message ?? "Check the details and try again.");
    if (!hasReceivedProduct(db, u.id, p.id)) throw forbidden("Only customers who received this product can rate it.");
    if (db.get("SELECT 1 FROM reviews WHERE product_id = ? AND user_id = ?", [p.id, u.id])) throw badRequest("You have already reviewed this product.");
    const files: File[] = [];
    for (const f of form.getAll("photos")) if (f instanceof File && f.size > 0) files.push(f);
    if (files.length > MAX_REVIEW_PHOTOS) throw badRequest(`You can add up to ${MAX_REVIEW_PHOTOS} photos.`);
    // Photos only (JPG, PNG, WebP), checked by their bytes.
    const photos: string[] = [];
    for (const f of files) photos.push((await savePublicUpload(f, "reviews", ["image"])).url);
    db.tx(() => {
      const reviewId = db.run("INSERT INTO reviews (product_id, user_id, rating, title, body, verified_purchase, status) VALUES (?, ?, ?, ?, ?, 1, 'published')", [
        p.id,
        u.id,
        input.data.rating,
        input.data.title,
        input.data.body,
      ]).lastId;
      photos.forEach((url, i) => db.run("INSERT INTO review_photos (review_id, url, sort_order) VALUES (?, ?, ?)", [reviewId, url, i]));
    });
    return c.json({ ok: true }, 201);
  })

  .post("/reviews/:id/helpful", (c) => {
    const u = requireUser(c);
    rateLimit(`helpful:${u.id}:${c.req.param("id")}`, 1, 86_400_000);
    const r = c.get("db").run("UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ? AND status = 'published' AND user_id != ?", [
      Number(c.req.param("id")),
      u.id,
    ]);
    if (!r.changes) throw notFound();
    return c.json({ ok: true });
  })

  /** Real, published reviews for the homepage gallery. Nothing is invented. */
  .get("/reviews/featured", (c) => {
    const db = c.get("db");
    const rows = db.all(
      `SELECT r.id, r.rating, r.title, r.body, r.verified_purchase, r.created_at, u.name, p.name AS product, p.slug,
              (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind IN ('hero','image') ORDER BY m.kind = 'hero' DESC, m.sort_order LIMIT 1) AS image
         FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
        WHERE r.status = 'published' AND p.status = 'active' AND (r.body != '' OR r.title != '')
        ORDER BY r.verified_purchase DESC, r.helpful_count DESC, r.created_at DESC LIMIT 9`,
    );
    const agg = db.get("SELECT AVG(rating) avg, COUNT(*) n FROM reviews WHERE status = 'published'")!;
    return c.json({
      average: agg.avg == null ? null : Math.round(agg.avg * 10) / 10,
      total: agg.n,
      reviews: rows.map((r) => ({
        id: String(r.id),
        name: r.name.split(" ")[0],
        product: r.product,
        productSlug: r.slug,
        rating: r.rating,
        title: r.title,
        review: r.body || r.title,
        verifiedPurchase: Boolean(r.verified_purchase),
        createdAt: r.created_at,
        image: r.image,
      })),
    });
  })

  .get("/collections", (c) => {
    const db = c.get("db");
    const cols = db.all("SELECT id, name, slug, description FROM collections WHERE is_active = 1 ORDER BY sort_order, name");
    return c.json({
      collections: cols.map((col) => ({
        ...col,
        products: db
          .all(`${CARD_SQL} AND p.id IN (SELECT product_id FROM collection_products WHERE collection_id = ?) LIMIT 12`, [col.id])
          .map(toCard),
      })),
    });
  })

  .get("/policies", (c) => {
    const db = c.get("db");
    return c.json({ shipping: getSetting(db, "shipping"), cod: getSetting(db, "cod"), tax: getSetting(db, "tax"), returns: getSetting(db, "returns"), brand: getSetting(db, "brand") });
  });
