import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { config } from "./config.ts";
import { Db } from "./db.ts";
import { createApp } from "./app.ts";
import { ensureReferenceData, seedCatalog } from "./seed.ts";
import { expireStaleCheckouts } from "./lib/orders.ts";

const db = new Db(config.databasePath);
const ran = db.migrate();
if (ran.length) console.log(`[db] applied migrations: ${ran.join(", ")}`);
ensureReferenceData(db);
seedCatalog(db);

const app = createApp(db);

// In production the API also serves the built storefront (dist/) with SPA fallback.
const dist = join(config.rootDir, "dist");
if (config.isProd && existsSync(dist)) {
  const root = relative(process.cwd(), dist);
  app.use("/*", serveStatic({ root }));
  app.use("/uploads/*", serveStatic({ root: relative(process.cwd(), join(config.rootDir, "public")) }));
  const index = readFileSync(join(dist, "index.html"), "utf8");
  app.get("*", (c) => c.html(index));
}

setInterval(() => {
  try {
    const n = expireStaleCheckouts(db);
    if (n) console.log(`[jobs] expired ${n} unpaid checkout(s)`);
  } catch (err) {
    console.error("[jobs] checkout expiry failed", err);
  }
}, 60_000).unref();

serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`[api] CrownCart API on http://localhost:${info.port} (${config.isProd ? "production" : "development"})`);
});
