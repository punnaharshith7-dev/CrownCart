// Builds the storefront for Vercel using its Build Output API. Routing is generated here, not kept
// in vercel.json, so two Vercel projects on this one repo can each point at their own API through
// the API_ORIGIN environment variable.
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const api = (process.env.API_ORIGIN ?? "").trim().replace(/\/$/, "");
if (!/^https:\/\/[^/]+$/.test(api)) {
  console.error("Set API_ORIGIN to the Render URL of this copy, for example https://crowncart-1.onrender.com");
  process.exit(1);
}

execSync("npx vite build", { stdio: "inherit" });

rmSync(".vercel/output", { recursive: true, force: true });
mkdirSync(".vercel/output", { recursive: true });
cpSync("dist", ".vercel/output/static", { recursive: true });

// The same policy as server/app.ts, because here the pages do not pass through the API.
const csp = [
  "default-src 'self'",
  "script-src 'self' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://rsms.me",
  "font-src 'self' https://fonts.gstatic.com https://rsms.me",
  "img-src 'self' data: blob: https://images.unsplash.com https:",
  "media-src 'self' https://res.cloudinary.com",
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://res.cloudinary.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const headers = {
  "Content-Security-Policy": csp,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
};

writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "^/api/(.*)$", dest: `${api}/api/$1` },
        { src: "^/(robots\\.txt|sitemap\\.xml)$", dest: `${api}/$1` },
        { src: "^/assets/(.*)$", headers: { "Cache-Control": "public, max-age=31536000, immutable" }, continue: true },
        { src: "^/(.*)$", headers, continue: true },
        { handle: "filesystem" },
        { src: "^/(.*)$", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);
console.log(`Vercel output ready. API requests go to ${api}`);
