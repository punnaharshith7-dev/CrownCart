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
    provider: (env.EMAIL_PROVIDER ?? "none") as "none" | "resend" | "smtp",
    resendApiKey: env.RESEND_API_KEY ?? "",
    // SMTP, e.g. a Gmail account with an app password (smtp.gmail.com:465).
    smtpHost: env.SMTP_HOST ?? "smtp.gmail.com",
    smtpPort: Number(env.SMTP_PORT ?? 465),
    smtpUser: env.SMTP_USER ?? "",
    smtpPass: (env.SMTP_PASS ?? "").replace(/\s+/g, ""),
    from: env.EMAIL_FROM ?? "CrownCart <crowncart.admin@gmail.com>",
    // Where support requests and contact messages are emailed. Only this inbox receives them.
    adminInbox: (env.ADMIN_EMAIL || env.INITIAL_ADMIN_EMAIL || "").trim(),
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
  },
  microsoft: {
    clientId: env.MICROSOFT_CLIENT_ID ?? "",
    clientSecret: env.MICROSOFT_CLIENT_SECRET ?? "",
  },
  // Which SMS gateway sends texts: Twilio, or textbee (your own Android phone + SIM).
  smsProvider: (env.SMS_PROVIDER ?? "twilio") as "twilio" | "textbee",
  textbee: {
    apiKey: env.TEXTBEE_API_KEY ?? "",
    deviceId: env.TEXTBEE_DEVICE_ID ?? "",
  },
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID ?? "",
    authToken: env.TWILIO_AUTH_TOKEN ?? "",
    smsFrom: env.TWILIO_SMS_FROM ?? "",
    whatsappFrom: env.TWILIO_WHATSAPP_FROM ?? "",
  },
  shiprocket: {
    email: env.SHIPROCKET_EMAIL ?? "",
    password: env.SHIPROCKET_PASSWORD ?? "",
    webhookToken: env.SHIPROCKET_WEBHOOK_TOKEN ?? "",
  },
  // The Anthropic SDK reads ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) itself.
  assistantModel: env.ASSISTANT_MODEL ?? "claude-opus-5-5",
  // Google Gemini (free tier from aistudio.google.com). Used for the assistant when set.
  gemini: {
    apiKey: env.GEMINI_API_KEY ?? "",
    model: env.GEMINI_MODEL ?? "gemini-flash-latest",
    // Tried in order when a model is overloaded or rate-limited (common on the free tier). Comma-separated.
    fallbackModels: (env.GEMINI_FALLBACK_MODELS ?? "gemini-3.5-flash,gemini-flash-lite-latest")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  },
  publicUrl: env.PUBLIC_URL ?? "http://localhost:5173",
};

export const integrations = () => ({
  razorpay: Boolean(config.razorpay.keyId && config.razorpay.keySecret),
  razorpayWebhook: Boolean(config.razorpay.webhookSecret),
  email:
    (config.email.provider === "resend" && Boolean(config.email.resendApiKey)) ||
    (config.email.provider === "smtp" && Boolean(config.email.smtpUser && config.email.smtpPass)),
  google: Boolean(config.google.clientId && config.google.clientSecret),
  microsoft: Boolean(config.microsoft.clientId && config.microsoft.clientSecret),
  sms:
    config.smsProvider === "textbee"
      ? Boolean(config.textbee.apiKey)
      : Boolean(config.twilio.accountSid && config.twilio.authToken && config.twilio.smsFrom),
  whatsapp: Boolean(config.twilio.accountSid && config.twilio.authToken && config.twilio.whatsappFrom),
  courier: Boolean(config.shiprocket.email && config.shiprocket.password),
  courierWebhook: Boolean(config.shiprocket.webhookToken),
  assistant: Boolean(config.gemini.apiKey || env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN),
});
