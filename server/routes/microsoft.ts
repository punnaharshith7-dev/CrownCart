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
import { origin } from "./google.ts";

const STATE_COOKIE = "cc_microsoft_oauth";
const AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";

/** Same-site paths only, so the OAuth round trip can't be used as an open redirect. */
function safePath(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

const redirectUri = (c: Ctx) => `${origin(c)}/api/auth/microsoft/callback`;
const fail = (c: Ctx, reason: string) => c.redirect(`${origin(c)}/signin?error=${encodeURIComponent(reason)}`);

function decodeJwtPayload(jwt: string): Record<string, any> {
  const part = jwt.split(".")[1];
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

/**
 * Microsoft sign-in (personal and work/school accounts) with the OAuth 2.0
 * authorization-code flow + PKCE against the multi-tenant "common" endpoint.
 * The ID token comes straight from Microsoft's token endpoint over TLS in
 * exchange for our client secret, so its claims are trusted after checking
 * issuer (per tenant), audience, expiry and our nonce.
 * Identity is keyed on tid + oid. Microsoft doesn't guarantee the email claim
 * is verified, so a Microsoft login never links itself to an existing
 * password/Google account by email; it only creates or signs in to its own
 * customer account and never grants privileged roles.
 */
export const microsoftRoutes = new Hono<AppEnv>()
  .get("/start", (c) => {
    if (!integrations().microsoft) return fail(c, "Microsoft sign-in is not configured.");
    rateLimit(`microsoft:${c.get("ip")}`, 20, 600_000);
    const state = randomToken(24);
    const nonce = randomToken(24);
    const verifier = randomToken(48);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    setCookie(c, STATE_COOKIE, JSON.stringify({ state, nonce, verifier, returnTo: safePath(c.req.query("returnTo")) }), {
      httpOnly: true,
      secure: config.isProd,
      sameSite: "Lax",
      path: "/api/auth/microsoft",
      maxAge: 600,
    });
    const url = new URL(`${AUTHORITY}/authorize`);
    url.search = new URLSearchParams({
      client_id: config.microsoft.clientId,
      redirect_uri: redirectUri(c),
      response_type: "code",
      response_mode: "query",
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
    deleteCookie(c, STATE_COOKIE, { path: "/api/auth/microsoft" });
    if (c.req.query("error")) return fail(c, "Microsoft sign-in was cancelled.");
    let saved: { state: string; nonce: string; verifier: string; returnTo: string };
    try {
      saved = JSON.parse(raw ?? "");
    } catch {
      return fail(c, "Your Microsoft sign-in session expired. Please try again.");
    }
    if (!saved.state || c.req.query("state") !== saved.state) return fail(c, "Microsoft sign-in could not be verified. Please try again.");

    let claims: Record<string, any>;
    try {
      const res = await fetch(`${AUTHORITY}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: c.req.query("code") ?? "",
          client_id: config.microsoft.clientId,
          client_secret: config.microsoft.clientSecret,
          redirect_uri: redirectUri(c),
          grant_type: "authorization_code",
          code_verifier: saved.verifier,
          scope: "openid email profile",
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const tokens = (await res.json()) as { id_token?: string; error?: string };
      if (!res.ok || !tokens.id_token) throw new Error(tokens.error ?? `token endpoint ${res.status}`);
      claims = decodeJwtPayload(tokens.id_token);
    } catch (err) {
      console.error("[microsoft] token exchange failed", err);
      return fail(c, "We couldn't complete Microsoft sign-in. Please try again.");
    }

    const now = Math.floor(Date.now() / 1000);
    if (
      typeof claims.tid !== "string" ||
      typeof claims.oid !== "string" ||
      claims.iss !== `https://login.microsoftonline.com/${claims.tid}/v2.0` ||
      claims.aud !== config.microsoft.clientId ||
      typeof claims.exp !== "number" ||
      claims.exp < now ||
      claims.nonce !== saved.nonce
    ) {
      return fail(c, "Microsoft sign-in could not be verified. Please try again.");
    }
    const rawEmail = typeof claims.email === "string" ? claims.email : typeof claims.preferred_username === "string" ? claims.preferred_username : "";
    if (!/^\S+@\S+\.\S+$/.test(rawEmail)) return fail(c, "Your Microsoft account didn't share an email address.");

    const sub = `${claims.tid}:${claims.oid}`;
    const db = c.get("db");
    const email = rawEmail.toLowerCase();
    const result = db.tx(() => {
      let user = db.get("SELECT * FROM users WHERE microsoft_sub = ?", [sub]);
      let created = false;
      if (!user) {
        if (db.get("SELECT 1 FROM users WHERE email = ?", [email])) {
          return { error: "An account with this email already exists. Sign in with your password or Google instead." };
        }
        const id = db.run(
          "INSERT INTO users (email, name, microsoft_sub, preferences) VALUES (?, ?, ?, ?)",
          [email, String(claims.name ?? email.split("@")[0]).slice(0, 80), sub, JSON.stringify({ theme: "system", marketingEmails: false })],
        ).lastId;
        grantRole(db, id, "customer", null);
        audit(db, { actorId: id, action: "auth.register", entityType: "user", entityId: id, details: { via: "microsoft" }, ip: c.get("ip") });
        user = db.get("SELECT * FROM users WHERE id = ?", [id]);
        created = true;
      }
      if (user!.status !== "active") return { error: "This account is suspended. Contact CrownCart support." };
      audit(db, { actorId: user!.id, action: "auth.login", entityType: "user", entityId: user!.id, details: { via: "microsoft" }, ip: c.get("ip") });
      return { userId: user!.id as number, created };
    });
    if ("error" in result) return fail(c, result.error!);

    createSession(c, result.userId);
    // New accounts get the welcome page; everyone else goes through /signin, which opens their role's first page.
    const dest = result.created && saved.returnTo === "/" ? "/account?welcome=1" : `/signin?returnTo=${encodeURIComponent(saved.returnTo)}`;
    return c.redirect(`${origin(c)}${dest}`);
  });
