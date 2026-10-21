import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env");
if (existsSync(envFile) && !process.env.CROWNCART_SKIP_ENV_FILE) process.loadEnvFile(envFile);

const env = process.env;
const isProd = env.NODE_ENV === "production";
const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export const config = {
  isProd,
  isTest: env.NODE_ENV === "test",
  port: Number(env.PORT ?? 8787),
  rootDir: root,
  databasePath: env.DATABASE_PATH ?? join(root, "server", "data", "crowncart.db"),
  privateStorageDir: env.PRIVATE_STORAGE_DIR ?? join(root, "server", "storage", "private"),
  publicUploadDir: env.PUBLIC_UPLOAD_DIR ?? join(root, "public", "uploads"),
  // Origins allowed to make state-changing requests (CSRF defence).
  appOrigins: list(env.APP_ORIGIN).length
    ? list(env.APP_ORIGIN)
    : ["http://localhost:5173", "http://127.0.0.1:5173"],
  allowLanOrigins: !isProd,
  sessionTtlDays: Number(env.SESSION_TTL_DAYS ?? 30),
  razorpay: {
    keyId: env.RAZORPAY_KEY_ID ?? "",
    keySecret: env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET ?? "",
  },
  email: {
    provider: (env.EMAIL_PROVIDER ?? "none") as "none" | "resend",
    resendApiKey: env.RESEND_API_KEY ?? "",
    from: env.EMAIL_FROM ?? "CrownCart <no-reply@crowncart.local>",
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
  },
  publicUrl: env.PUBLIC_URL ?? "http://localhost:5173",
};

export const integrations = () => ({
  razorpay: Boolean(config.razorpay.keyId && config.razorpay.keySecret),
  razorpayWebhook: Boolean(config.razorpay.webhookSecret),
  email: config.email.provider === "resend" && Boolean(config.email.resendApiKey),
  google: Boolean(config.google.clientId && config.google.clientSecret),
});
