import type { Db } from "./db.ts";
import { ADMIN_PERMISSIONS, ROLE_PERMISSIONS, ROLES, type RoleKey } from "./lib/permissions.ts";
import { EXTENDED_PRODUCTS } from "./catalog-data.ts";

/** Roles and permissions. Idempotent; runs on every start so code and DB agree. */
export function ensureReferenceData(db: Db) {
  db.tx(() => {
    for (const [key, r] of Object.entries(ROLES)) {
      db.run("INSERT INTO roles (key, name, description) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET name = excluded.name, description = excluded.description", [
        key,
        r.name,
        r.description,
      ]);
    }
    for (const [key, description] of Object.entries(ADMIN_PERMISSIONS)) {
      db.run("INSERT INTO permissions (key, description) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET description = excluded.description", [key, description]);
    }
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS) as [RoleKey, string[]][]) {
      db.run("DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE key = ?)", [role]);
      for (const p of perms) {
        db.run("INSERT INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.key = ? AND p.key = ?", [role, p]);
      }
    }
  });
}

const CATEGORIES = [
  { slug: "fashion", name: "Fashion", description: "Designer apparel and outerwear." },
  { slug: "sneakers-footwear", name: "Sneakers & Footwear", description: "Heritage silhouettes and modern performance." },
  { slug: "watches-accessories", name: "Watches & Accessories", description: "Timepieces and finishing touches." },
  { slug: "electronics-gadgets", name: "Electronics & Gadgets", description: "Performance computing and technology." },
  { slug: "home-living", name: "Home & Living", description: "Objects for considered spaces." },
  { slug: "furniture-decor", name: "Furniture & Decor", description: "Statement pieces and decor." },
  { slug: "beauty-care", name: "Beauty & Personal Care", description: "Skincare, fragrance and grooming." },
  { slug: "lifestyle", name: "Lifestyle", description: "Everyday essentials, elevated." },
];

/** The four products from the original homepage, now as real catalog records. */
const PRODUCTS = [
  {
    slug: "air-jordan-1-retro-high-og-patent",
    name: "Air Jordan 1 Retro High OG “Patent”",
    brand: "Jordan",
    category: "sneakers-footwear",
    titleLine1: "AIR JORDAN 1",
    titleLine2: "“PATENT”",
    accent: "HIGH OG",
    tagline: "Heritage Basketball & Luxury Sneaker Culture",
    badge: "ICONIC GRAIL",
    description:
      "A high-voltage tribute to hardwood royalty. Cloaked in high-gloss Patent University Red leather with pristine white full-grain paneling, encapsulated Air-Sole cushioning, and an exclusive Metallic Silver Wings emblem debossed on the collar.",
    care: "Wipe patent leather with a soft, damp cloth. Keep away from prolonged direct heat.",
    warranty: "Covered by the manufacturer's warranty against manufacturing defects.",
    returnDays: 7,
    hero: "/products/jordan_bg_hd.png",
    image: "/products/jordan1.png",
    model: "/models/shoe.glb",
    specs: [
      ["Silhouette", "High-Top Retro OG Profile"],
      ["Upper", "Patent University Red & White Leather"],
      ["Cushioning", "Encapsulated Nike Air-Sole"],
      ["Insignia", "Metallic Silver Wings Medallion"],
    ],
    variants: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"].map((size, i) => ({
      sku: `AJ1-PAT-${size.replace(" ", "")}`,
      name: size,
      size,
      price: 1699500,
      compareAt: 1999500,
      stock: [3, 6, 6, 4, 2][i],
      max: 2,
    })),
  },
  {
    slug: "patek-philippe-nautilus-5980-1r-rose-gold",
    name: "Patek Philippe Nautilus 5980/1R Rose Gold",
    brand: "Patek Philippe",
    category: "watches-accessories",
    titleLine1: "NAUTILUS",
    titleLine2: "“ROSE GOLD”",
    accent: "5980/1R",
    tagline: "Haute Horlogerie & Self-Winding Flyback Chronograph",
    badge: "HAUTE HORLOGERIE",
    description:
      "The quintessential pinnacle of sporting elegance. Forged from solid 18-karat rose gold featuring the legendary octagonal bezel, horizontally embossed black-brown gradient dial, sapphire crystal exhibition caseback, and manufacture Calibre CH 28-520 C.",
    care: "Have the movement serviced by an authorised service centre. Avoid strong magnetic fields.",
    warranty: "Warranty terms are provided with the watch's documentation.",
    returnDays: 0,
    hero: "/products/nautilus_bg_hd.png",
    image: "/products/nautilus.png",
    model: "/models/watch.glb",
    specs: [
      ["Calibre", "CH 28-520 C Self-Winding Flyback"],
      ["Case & Bracelet", "40.5mm Solid 18K Rose Gold"],
      ["Dial", "Horizontally Embossed Black-Brown"],
      ["Water Resistance", "120m / 400ft"],
    ],
    variants: [{ sku: "PP-5980-1R", name: "Standard", size: null, price: 1850000000, stock: 1, max: 1 }],
  },
  {
    slug: "armani-exchange-signature-bomber",
    name: "Armani Exchange Signature Bomber",
    brand: "Armani Exchange",
    category: "fashion",
    titleLine1: "ARMANI EX.",
    titleLine2: "“SIGNATURE”",
    accent: "BOMBER",
    tagline: "Milanese Designer Outerwear & Street Tailoring",
    badge: "NEW ARRIVAL",
    description:
      "Sleek Italian street architecture redefined. Tailored from premium high-density technical stretch nylon with a satin luster finish, contrasting white A|X chest branding, ribbed aerodynamic collar and cuffs, and custom gunmetal dual-way zipper hardware.",
    care: "Machine wash cold on a gentle cycle. Do not tumble dry. Do not iron the print.",
    warranty: "",
    returnDays: 14,
    hero: "/products/ax_bomber_bg_hd.png",
    image: "/products/ax_bomber.png",
    model: "/models/apparel.glb",
    specs: [
      ["Composition", "Technical Stretch High-Density Nylon"],
      ["Hardware", "Matte Black Dual-Way Front Zip"],
      ["Fit", "Ergonomic Modern Bomber Silhouette"],
      ["Branding", "Screened A|X Contrast Chest Monogram"],
    ],
    variants: ["S", "M", "L", "XL"].map((size, i) => ({ sku: `AX-BMB-${size}`, name: size, size, price: 2499900, compareAt: 2899900, stock: [4, 8, 8, 0][i], max: 3 })),
  },
  {
    slug: "asus-tuf-gaming-a15-mecha",
    name: "ASUS TUF Gaming A15",
    brand: "ASUS",
    category: "electronics-gadgets",
    titleLine1: "ASUS TUF",
    titleLine2: "“MECHA”",
    accent: "A15 PRO",
    tagline: "High-Performance Military-Grade Gaming Workstation",
    badge: "TOP RATED",
    description:
      "Battlefield-tested endurance meets next-generation computing firepower. Powered by AMD Ryzen™ 7 7735HS and NVIDIA® GeForce RTX™ 4060 graphics, featuring a 144Hz Adaptive-Sync display, MIL-STD-810H durability, and an RGB keyboard.",
    care: "Use the supplied charger. Keep vents clear during use.",
    warranty: "1-year manufacturer warranty.",
    returnDays: 7,
    hero: "/products/asus_tuf_bg_hd.png",
    image: "/products/asus_tuf.png",
    model: "/models/laptop.glb",
    specs: [
      ["Processor", "AMD Ryzen™ 7 7735HS (8C/16T, 4.75GHz)"],
      ["Graphics", "NVIDIA® GeForce RTX™ 4060 8GB GDDR6"],
      ["Display", "15.6\" 144Hz FHD IPS Adaptive-Sync"],
      ["Durability", "MIL-STD-810H Military Standard"],
    ],
    variants: [{ sku: "ASUS-TUF-A15-R7-4060", name: "16GB / 1TB SSD", size: null, price: 8999000, compareAt: 9999000, stock: 10, max: 2 }],
  },
];

/** Catalog data the homepage depends on. Safe to run repeatedly. */
export function seedCatalog(db: Db) {
  db.tx(() => {
    // 3D models shipped with the original site, attached once to their products.
    for (const p of PRODUCTS) {
      const row = db.get<{ id: number }>("SELECT id FROM products WHERE slug = ?", [p.slug]);
      if (row && p.model && !db.get("SELECT 1 FROM product_media WHERE product_id = ? AND kind = 'model'", [row.id])) {
        db.run("INSERT INTO product_media (product_id, kind, url, alt, sort_order) VALUES (?, 'model', ?, ?, 50)", [row.id, p.model, `${p.name} — 3D model`]);
      }
    }
    CATEGORIES.forEach((c, i) =>
      db.run("INSERT OR IGNORE INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)", [c.name, c.slug, c.description, i]),
    );
    let store = db.get<{ id: number }>("SELECT id FROM stores WHERE slug = 'crowncart-flagship'");
    if (!store) {
      const id = db.run(
        "INSERT INTO stores (name, slug, description, status, pickup_address, pickup_pincode) VALUES ('CrownCart Flagship', 'crowncart-flagship', 'The original CrownCart collection.', 'active', 'CrownCart Flagship Store', '560001')",
      ).lastId;
      store = { id };
    }
    const allProducts = [...PRODUCTS, ...EXTENDED_PRODUCTS];
    allProducts.forEach((p, i) => {
      let prodRow = db.get<{ id: number }>("SELECT id FROM products WHERE slug = ?", [p.slug]);
      let pid: number;
      if (!prodRow) {
        let brand = db.get<{ id: number }>("SELECT id FROM brands WHERE name = ?", [p.brand]);
        if (!brand) {
          const brandSlug = p.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          brand = { id: db.run("INSERT INTO brands (name, slug) VALUES (?, ?)", [p.brand, brandSlug]).lastId };
        }
        const cat = db.get<{ id: number }>("SELECT id FROM categories WHERE slug = ?", [p.category])!;
        pid = db.run(
          `INSERT INTO products (store_id, brand_id, category_id, slug, name, title_line1, title_line2, accent, tagline, badge, description, care, warranty,
                                 return_days, status, is_featured, showcase_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)`,
          [store.id, brand.id, cat.id, p.slug, p.name, p.titleLine1, p.titleLine2, p.accent, p.tagline, p.badge, p.description, p.care, p.warranty, p.returnDays, i < 4 ? i + 1 : null],
        ).lastId;
        p.specs.forEach(([label, value], j) => db.run("INSERT INTO product_specs (product_id, label, value, sort_order) VALUES (?, ?, ?, ?)", [pid, label, value, j]));
        db.run("INSERT INTO product_media (product_id, kind, url, alt, sort_order) VALUES (?, 'image', ?, ?, 0)", [pid, p.image, p.name]);
        db.run("INSERT INTO product_media (product_id, kind, url, alt, sort_order) VALUES (?, 'hero', ?, ?, 1)", [pid, p.hero, `${p.name} — editorial photograph`]);
        if (p.model) {
          db.run("INSERT INTO product_media (product_id, kind, url, alt, sort_order) VALUES (?, 'model', ?, ?, 50)", [pid, p.model, `${p.name} — 3D model`]);
        }
        p.variants.forEach((v: any, j: number) => {
          const vid = db.run(
            "INSERT INTO product_variants (product_id, sku, name, size, price_paise, compare_at_paise, max_per_order, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [pid, v.sku, v.name, v.size ?? null, v.price, v.compareAt ?? null, v.max, j],
          ).lastId;
          db.run("INSERT INTO inventory (variant_id, on_hand, low_stock_threshold) VALUES (?, ?, 2)", [vid, v.stock]);
          if (v.stock) db.run("INSERT INTO inventory_movements (variant_id, delta_on_hand, reason) VALUES (?, ?, 'initial_stock')", [vid, v.stock]);
        });
      } else {
        pid = prodRow.id;
        p.variants.forEach((v: any) => {
          if (v.compareAt) {
            db.run("UPDATE product_variants SET compare_at_paise = ? WHERE product_id = ? AND sku = ? AND (compare_at_paise IS NULL OR compare_at_paise = 0)", [v.compareAt, pid, v.sku]);
          }
        });
      }
    });
  });
}
