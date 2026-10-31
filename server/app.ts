import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { getConnInfo } from "@hono/node-server/conninfo";
import type { AppEnv } from "./context.ts";
import type { Db } from "./db.ts";
import { config, integrations } from "./config.ts";
import { HttpError, forbidden } from "./lib/errors.ts";
import { sessionMiddleware } from "./lib/auth.ts";
import { getSetting } from "./lib/settings.ts";
import { authRoutes } from "./routes/auth.ts";
import { catalogRoutes } from "./routes/catalog.ts";
import { accountRoutes, cartRoutes, wishlistRoutes } from "./routes/customer.ts";
import { checkoutRoutes, paymentRoutes } from "./routes/checkout.ts";
import { orderRoutes } from "./routes/orders.ts";
import { ownerRoutes } from "./routes/owner.ts";
import { adminRoutes } from "./routes/admin.ts";
import { deliveryPhotoRoutes, deliveryRoutes } from "./routes/delivery.ts";
import { supportRoutes } from "./routes/support.ts";
import { seoRoutes } from "./routes/seo.ts";
import { googleRoutes } from "./routes/google.ts";
import { microsoftRoutes } from "./routes/microsoft.ts";
import { passwordlessRoutes } from "./routes/passwordless.ts";
import { shippingRoutes } from "./routes/shipping.ts";
import { assistantRoutes } from "./routes/assistant.ts";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
const LAN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

export function originAllowed(origin: string) {
  return config.appOrigins.includes(origin) || (config.allowLanOrigins && LAN.test(origin));
}

export function createApp(db: Db) {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    c.set("db", db);
    let ip = "unknown";
    try {
      ip = getConnInfo(c).remote.address ?? "unknown";
    } catch {
      /* not running under node-server (tests) */
    }
    // Only trust X-Forwarded-For when deployed behind a proxy we control.
    if (process.env.TRUST_PROXY === "1") ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() || ip;
    c.set("ip", ip);
    await next();
  });

  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://rsms.me"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://rsms.me"],
        imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https:"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com", "https://res.cloudinary.com"],
        frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
      strictTransportSecurity: config.isProd ? "max-age=31536000; includeSubDomains" : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CSRF: state-changing requests must come from our own origin. Session
  // cookies are SameSite=Lax as a second layer. The payment webhook is
  // exempt because it is authenticated by its HMAC signature instead.
  app.use("/api/*", async (c, next) => {
    if (!SAFE.has(c.req.method) && !["/api/payments/razorpay/webhook", "/api/shipping/courier-webhook"].includes(c.req.path)) {
      const origin = c.req.header("origin") ?? c.req.header("referer")?.replace(/^(https?:\/\/[^/]+).*$/, "$1");
      if (!origin || !originAllowed(origin)) throw forbidden("Cross-site request blocked.");
    }
    c.header("Cache-Control", "no-store");
    await next();
  });

  app.use("/api/*", sessionMiddleware);

  // Maintenance mode blocks shopping APIs for everyone except administrators.
  app.use("/api/*", async (c, next) => {
    const m = getSetting(db, "maintenance");
    const exempt = /^\/api\/(auth|admin|health|catalog\/home)/.test(c.req.path);
    if (m.enabled && !exempt && !c.get("user")?.permissions.size && !SAFE.has(c.req.method)) {
      return c.json({ error: { code: "maintenance", message: m.message } }, 503);
    }
    await next();
  });

  app.get("/api/health", (c) => {
    let dbOk = true;
    try {
      db.get("SELECT 1");
    } catch {
      dbOk = false;
    }
    return c.json({ ok: dbOk, db: dbOk, integrations: integrations(), time: new Date().toISOString() }, dbOk ? 200 : 503);
  });

  app.route("/api/auth/google", googleRoutes);
  app.route("/api/auth/microsoft", microsoftRoutes);
  app.route("/api/auth", passwordlessRoutes);
  app.route("/api/auth", authRoutes);
  app.route("/api/catalog", catalogRoutes);
  app.route("/api/cart", cartRoutes);
  app.route("/api/wishlist", wishlistRoutes);
  app.route("/api/account", accountRoutes);
  app.route("/api/checkout", checkoutRoutes);
  app.route("/api/payments", paymentRoutes);
  app.route("/api/orders", orderRoutes);
  app.route("/api/owner", ownerRoutes);
  app.route("/api/admin", adminRoutes);
  app.route("/api/delivery/photos", deliveryPhotoRoutes);
  app.route("/api/delivery", deliveryRoutes);
  app.route("/api/support", supportRoutes);
  app.route("/api/shipping", shippingRoutes);
  app.route("/api/assistant", assistantRoutes);
  app.route("/", seoRoutes);

  app.notFound((c) => c.json({ error: { code: "not_found", message: "Not found." } }, 404));

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status as 400);
    }
    if (String(err?.message).includes("UNIQUE constraint failed")) {
      return c.json({ error: { code: "conflict", message: "That already exists." } }, 409);
    }
    console.error(`[error] ${c.req.method} ${c.req.path}`, err);
    return c.json({ error: { code: "server_error", message: "Something went wrong on our side. Please try again." } }, 500);
  });

  return app;
}
