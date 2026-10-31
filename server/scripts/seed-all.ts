import { config } from "../config.ts";
import { Db } from "../db.ts";
import { ensureReferenceData, seedCatalog } from "../seed.ts";

const db = new Db(config.databasePath, config.turso);
db.migrate();
ensureReferenceData(db);
seedCatalog(db);

const prods = db.get<{ n: number }>("SELECT COUNT(*) n FROM products")!.n;
const brands = db.get<{ n: number }>("SELECT COUNT(*) n FROM brands")!.n;
const categories = db.all<{ name: string; count: number }>(
  `SELECT c.name, COUNT(p.id) AS count FROM categories c
   LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
   GROUP BY c.id ORDER BY c.sort_order`
);
const brandCounts = db.all<{ name: string; count: number }>(
  `SELECT b.name, COUNT(p.id) AS count FROM brands b
   JOIN products p ON p.brand_id = b.id
   GROUP BY b.id ORDER BY b.name COLLATE NOCASE`
);
const reviews = db.get<{ n: number }>("SELECT COUNT(*) n FROM reviews")!.n;

console.log("=== SEEDING SUMMARY ===");
console.log(`Total Products: ${prods}`);
console.log(`Total Brands: ${brands}`);
console.log(`Total Reviews: ${reviews}`);
console.log("\nBrands & Product Counts:");
brandCounts.forEach((b) => console.log(`  - ${b.name}: ${b.count} items`));
console.log("\nCategories & Product Counts:");
categories.forEach((c) => console.log(`  - ${c.name}: ${c.count} items`));
