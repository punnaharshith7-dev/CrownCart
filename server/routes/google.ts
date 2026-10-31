import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createHash } from "node:crypto";
import type { AppEnv, Ctx } from "../context.ts";
import { config, integrations } from "../config.ts";
import { randomToken } from "../lib/crypto.ts";
import { createSession } from "../lib/auth.ts";
import { audit } from "../lib/audit.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { grantRole } from "./auth.ts";

const STATE_COOKIE = "cc_google_oauth";

/** Same-site paths only, so the OAuth round trip can't be used as an open redirect. */
function safePath(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

/** The origin the browser is using. In production this is fixed by PUBLIC_URL. */
export function origin(c: Ctx) {
  if (config.isProd) return config.publicUrl.replace(/\/$/, "");
  const host = c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "localhost:5173";
  const proto = c.req.header("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

const redirectUri = (c: Ctx) => `${origin(c)}/api/auth/google/callback`;
const fail = (c: Ctx, reason: string) => c.redirect(`${origin(c)}/signin?error=${encodeURIComponent(reason)}`);

function decodeJwtPayload(jwt: string): Record<string, any> {
  const part = jwt.split(".")[1];
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

/**
 * Google sign-in with the OAuth 2.0 authorization-code flow + PKCE.
 * The ID token is received directly from Google's token endpoint over TLS in
 * exchange for our client secret, so (per Google's guidance) its claims can be
 * trusted after checking issuer, audience, expiry and our nonce.
 * Google sign-in can only ever create or sign in to a customer account; it
 * never grants privileged roles.
 */
export const googleRoutes = new Hono<AppEnv>()
  .get("/start", (c) => {
    if (!integrations().google) return fail(c, "Google sign-in is not configured.");
    rateLimit(`google:${c.get("ip")}`, 20, 600_000);
    const state = randomToken(24);
    const nonce = randomToken(24);
    const verifier = randomToken(48);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    setCookie(c, STATE_COOKIE, JSON.stringify({ state, nonce, verifier, returnTo: safePath(c.req.query("returnTo")) }), {
      httpOnly: true,
      secure: config.isProd,
      sameSite: "Lax",
      path: "/api/auth/google",
      maxAge: 600,
    });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: redirectUri(c),
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    }).toString();
    return c.redirect(url.toString());
  })

  .get("/callback", async (c) => {
    const raw = getCookie(c, STATE_COOKIE);
    deleteCookie(c, STATE_COOKIE, { path: "/api/auth/google" });
    if (c.req.query("error")) return fail(c, "Google sign-in was cancelled.");
    let saved: { state: string; nonce: string; verifier: string; returnTo: string };
    try {
      saved = JSON.parse(raw ?? "");
    } catch {
      return fail(c, "Your Google sign-in session expired. Please try again.");
    }
    if (!saved.state || c.req.query("state") !== saved.state) return fail(c, "Google sign-in could not be verified. Please try again.");

    let claims: Record<string, any>;
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: c.req.query("code") ?? "",
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          redirect_uri: redirectUri(c),
          grant_type: "authorization_code",
          code_verifier: saved.verifier,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const tokens = (await res.json()) as { id_token?: string; error?: string };
      if (!res.ok || !tokens.id_token) throw new Error(tokens.error ?? `token endpoint ${res.status}`);
      claims = decodeJwtPayload(tokens.id_token);
    } catch (err) {
      console.error("[google] token exchange failed", err);
      return fail(c, "We couldn't complete Google sign-in. Please try again.");
    }

    const now = Math.floor(Date.now() / 1000);
    if (
      !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) ||
      claims.aud !== config.google.clientId ||
      typeof claims.exp !== "number" ||
      claims.exp < now ||
      claims.nonce !== saved.nonce ||
      typeof claims.sub !== "string"
    ) {
      return fail(c, "Google sign-in could not be verified. Please try again.");
    }
    if (claims.email_verified !== true || typeof claims.email !== "string") {
      return fail(c, "Your Google account's email address isn't verified.");
    }

    const db = c.get("db");
    const email = claims.email.toLowerCase();
    const result = db.tx(() => {
      let user = db.get("SELECT * FROM users WHERE google_sub = ?", [claims.sub]);
      let created = false;
      if (!user) {
        user = db.get("SELECT * FROM users WHERE email = ?", [email]);
        if (user) {
          // Google has verified ownership of this address, so the existing account can be linked.
          if (user.google_sub && user.google_sub !== claims.sub) return { error: "This email is already linked to a different Google account." };
          db.run("UPDATE users SET google_sub = ?, email_verified_at = COALESCE(email_verified_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id = ?", [claims.sub, user.id]);
          audit(db, { actorId: user.id, action: "auth.google_linked", entityType: "user", entityId: user.id, ip: c.get("ip") });
        } else {
          const id = db.run(
            "INSERT INTO users (email, name, google_sub, email_verified_at, preferences) VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?)",
            [email, String(claims.name ?? email.split("@")[0]).slice(0, 80), claims.sub, JSON.stringify({ theme: "system", marketingEmails: false })],
          ).lastId;
          grantRole(db, id, "customer", null);
          audit(db, { actorId: id, action: "auth.register", entityType: "user", entityId: id, details: { via: "google" }, ip: c.get("ip") });
          user = db.get("SELECT * FROM users WHERE id = ?", [id]);
          created = true;
        }
      }
      if (user!.status !== "active") return { error: "This account is suspended. Contact CrownCart support." };
      audit(db, { actorId: user!.id, action: "auth.login", entityType: "user", entityId: user!.id, details: { via: "google" }, ip: c.get("ip") });
      return { userId: user!.id as number, created };
    });
    if ("error" in result) return fail(c, result.error!);

    createSession(c, result.userId);
    // New accounts get the welcome page; everyone else goes through /signin, which opens their role's first page.
    const dest = result.created && saved.returnTo === "/" ? "/account?welcome=1" : `/signin?returnTo=${encodeURIComponent(saved.returnTo)}`;
    return c.redirect(`${origin(c)}${dest}`);
  });
