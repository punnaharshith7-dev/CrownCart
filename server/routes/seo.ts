import { Hono } from "hono";
import type { AppEnv } from "../context.ts";
import { config } from "../config.ts";

export const seoRoutes = new Hono<AppEnv>()
  .get("/robots.txt", (c) =>
    c.text(
      [
        "User-agent: *",
        "Disallow: /account",
        "Disallow: /cart",
        "Disallow: /checkout",
        "Disallow: /owner",
        "Disallow: /admin",
        "Disallow: /delivery",
        "Disallow: /api/",
        "Disallow: /*?*q=",
        `Sitemap: ${config.publicUrl}/sitemap.xml`,
        "",
      ].join("\n"),
    ),
  )
  .get("/sitemap.xml", (c) => {
    const db = c.get("db");
    const products = db.all(
      "SELECT p.slug, p.updated_at FROM products p JOIN stores s ON s.id = p.store_id WHERE p.status = 'active' AND s.status = 'active'",
    );
    const categories = db.all("SELECT slug FROM categories WHERE is_active = 1");
    const url = (loc: string, lastmod?: string) =>
      `<url><loc>${config.publicUrl}${loc}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}</url>`;
    const body = [
      url("/"),
      url("/shop"),
      ...["/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms", "/contact"].map((p) => url(p)),
      ...categories.map((cat) => url(`/shop/${cat.slug}`)),
      ...products.map((p) => url(`/product/${p.slug}`, p.updated_at)),
    ].join("");
    c.header("Content-Type", "application/xml");
    return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  });
