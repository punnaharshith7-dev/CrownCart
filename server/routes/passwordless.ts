import { Hono } from "hono";
import { z } from "zod";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AppEnv, Ctx } from "../context.ts";
import { config, integrations } from "../config.ts";
import { hmacSha256, numericCode, randomToken, safeEqualHex, sha256 } from "../lib/crypto.ts";
import { badRequest, forbidden, notFound, unauthorized, unavailable } from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { body, email, id, phone } from "../lib/validate.ts";
import { audit } from "../lib/audit.ts";
import { sendEmail } from "../lib/notify.ts";
import { sendLoginSms, toE164 } from "../lib/messaging.ts";
import { createSession, loadRoles, publicUser, requireUser } from "../lib/auth.ts";
import { origin } from "./google.ts";

const CODE_TTL_MINUTES = 10;
const CODE_MAX_ATTEMPTS = 5;
const CHALLENGE_COOKIE = "cc_webauthn";
const CHALLENGE_TTL_MS = 5 * 60_000;
const now = () => new Date().toISOString();

/** Signs the user in and returns the same payload as password login. */
function finishLogin(c: Ctx, user: Record<string, any>, via: string) {
  const db = c.get("db");
  db.run("UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?", [user.id]);
  audit(db, { actorId: user.id, action: "auth.login", entityType: "user", entityId: user.id, details: { via }, ip: c.get("ip") });
  const sessionId = createSession(c, user.id);
  const { roles, permissions } = loadRoles(db, user.id);
  return {
    user: publicUser({ id: user.id, email: user.email, name: user.name, emailVerified: Boolean(user.email_verified_at), roles, permissions, sessionId }, db),
  };
}

const codeHash = (codeId: number, code: string) => hmacSha256(`login-code:${codeId}`, code);

/** Finds the single active account a phone number belongs to, if any. */
function userByPhone(c: Ctx, e164: string) {
  const last10 = e164.slice(-10);
  const rows = c
    .get("db")
    .all("SELECT * FROM users WHERE status = 'active' AND phone LIKE ?", [`%${last10}`])
    .filter((u) => toE164(u.phone) === e164);
  return rows.length === 1 ? rows[0] : null;
}

/** Phone codes are for shoppers only: staff accounts must use a stronger sign-in. */
function customerOnly(c: Ctx, userId: number) {
  return loadRoles(c.get("db"), userId).roles.every((r) => r === "customer");
}

const target = z.discriminatedUnion("channel", [z.object({ channel: z.literal("email"), email }), z.object({ channel: z.literal("sms"), phone })]);

const rpId = (c: Ctx) => new URL(origin(c)).hostname;

function saveChallenge(c: Ctx, purpose: "register" | "login", challenge: string, userId: number | null) {
  const db = c.get("db");
  const token = randomToken(24);
  db.run("DELETE FROM webauthn_challenges WHERE expires_at < ?", [now()]);
  db.run("INSERT INTO webauthn_challenges (id, user_id, purpose, challenge, expires_at) VALUES (?, ?, ?, ?, ?)", [
    sha256(token),
    userId,
    purpose,
    challenge,
    new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
  ]);
  setCookie(c, CHALLENGE_COOKIE, token, { httpOnly: true, secure: config.isProd, sameSite: "Strict", path: "/api/auth/passkeys", maxAge: CHALLENGE_TTL_MS / 1000 });
}

/** Single-use: the challenge is deleted as soon as it's read. */
function takeChallenge(c: Ctx, purpose: "register" | "login") {
  const token = getCookie(c, CHALLENGE_COOKIE);
  deleteCookie(c, CHALLENGE_COOKIE, { path: "/api/auth/passkeys" });
  if (!token) return null;
  const db = c.get("db");
  const row = db.get("SELECT * FROM webauthn_challenges WHERE id = ? AND purpose = ?", [sha256(token), purpose]);
  if (!row) return null;
  db.run("DELETE FROM webauthn_challenges WHERE id = ?", [row.id]);
  return row.expires_at < now() ? null : (row as { challenge: string; user_id: number | null });
}

function deviceName(ua: string) {
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return browser ? `${os} · ${browser}` : os;
}

/**
 * Passwordless sign-in: one-time codes by email or SMS, and passkeys.
 * Code requests answer the same way whether or not an account exists, so they
 * can't be used to discover who shops here.
 */
export const passwordlessRoutes = new Hono<AppEnv>()
  .post("/code/start", async (c) => {
    rateLimit(`code-ip:${c.get("ip")}`, 10, 900_000);
    const input = await body(c, target);
    const db = c.get("db");
    if (input.channel === "sms" && !integrations().sms && config.isProd) throw unavailable("Phone sign-in isn't available right now. Use your email instead.");
    const dest = input.channel === "email" ? input.email : toE164(input.phone)!;
    rateLimit(`code-target:${dest}`, 4, 900_000);

    const user = input.channel === "email" ? db.get("SELECT * FROM users WHERE email = ? AND status = 'active'", [dest]) : userByPhone(c, dest);
    if (user && (input.channel === "email" || customerOnly(c, user.id))) {
      const code = numericCode(6);
      db.tx(() => {
        db.run("UPDATE login_codes SET used_at = ? WHERE channel = ? AND target = ? AND used_at IS NULL", [now(), input.channel, dest]);
        const codeId = db.run("INSERT INTO login_codes (user_id, channel, target, code_hash, expires_at) VALUES (?, ?, ?, '', ?)", [
          user.id,
          input.channel,
          dest,
          new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
        ]).lastId;
        db.run("UPDATE login_codes SET code_hash = ? WHERE id = ?", [codeHash(codeId, code), codeId]);
        if (input.channel === "email") {
          sendEmail(db, dest, `${code} is your CrownCart sign-in code`, `Your CrownCart sign-in code is ${code}.\n\nIt expires in ${CODE_TTL_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`);
        } else {
          sendLoginSms(db, user.id, dest, `${code} is your CrownCart sign-in code. It expires in ${CODE_TTL_MINUTES} minutes. Never share it.`);
        }
      });
    }
    return c.json({ sent: true, expiresInMinutes: CODE_TTL_MINUTES });
  })

  .post("/code/verify", async (c) => {
    rateLimit(`code-verify-ip:${c.get("ip")}`, 30, 900_000);
    const input = await body(c, z.intersection(target, z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") })));
    const db = c.get("db");
    const dest = input.channel === "email" ? input.email : toE164(input.phone)!;
    const wrong = () => unauthorized("That code is incorrect or has expired.");
    const row = db.get("SELECT * FROM login_codes WHERE channel = ? AND target = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1", [input.channel, dest]);
    if (!row || row.expires_at < now()) throw wrong();
    if (row.attempts >= CODE_MAX_ATTEMPTS) {
      db.run("UPDATE login_codes SET used_at = ? WHERE id = ?", [now(), row.id]);
      throw unauthorized("Too many wrong codes. Request a new one.");
    }
    if (!safeEqualHex(codeHash(row.id, input.code), row.code_hash)) {
      db.run("UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?", [row.id]);
      throw wrong();
    }
    db.run("UPDATE login_codes SET used_at = ? WHERE id = ?", [now(), row.id]);
    const user = db.get("SELECT * FROM users WHERE id = ? AND status = 'active'", [row.user_id]);
    if (!user) throw forbidden("This account is suspended. Contact CrownCart support.");
    // Receiving the email code proves the inbox belongs to them.
    if (input.channel === "email" && !user.email_verified_at) {
      db.run("UPDATE users SET email_verified_at = ? WHERE id = ?", [now(), user.id]);
      user.email_verified_at = now();
    }
    return c.json(finishLogin(c, user, `code:${input.channel}`));
  })

  // ── Passkeys ──
  .post("/passkeys/login/options", async (c) => {
    rateLimit(`passkey-ip:${c.get("ip")}`, 30, 900_000);
    const options = await generateAuthenticationOptions({ rpID: rpId(c), userVerification: "preferred" });
    saveChallenge(c, "login", options.challenge, null);
    return c.json(options);
  })

  .post("/passkeys/login/verify", async (c) => {
    rateLimit(`passkey-verify-ip:${c.get("ip")}`, 30, 900_000);
    const { response } = await body(c, z.object({ response: z.object({ id: z.string().min(1).max(1024) }).passthrough() }));
    const saved = takeChallenge(c, "login");
    if (!saved) throw badRequest("Your passkey request expired. Please try again.");
    const db = c.get("db");
    const key = db.get("SELECT * FROM passkeys WHERE credential_id = ?", [response.id]);
    if (!key) throw unauthorized("This passkey isn't registered with CrownCart. Sign in another way and add it in your account.");
    let result;
    try {
      result = await verifyAuthenticationResponse({
        response: response as any,
        expectedChallenge: saved.challenge,
        expectedOrigin: origin(c),
        expectedRPID: rpId(c),
        credential: { id: key.credential_id, publicKey: Buffer.from(key.public_key, "base64url"), counter: key.counter, transports: JSON.parse(key.transports) },
      });
    } catch (err) {
      console.error("[passkey] authentication failed", err);
      throw unauthorized("We couldn't verify that passkey.");
    }
    if (!result.verified) throw unauthorized("We couldn't verify that passkey.");
    db.run("UPDATE passkeys SET counter = ?, last_used_at = ? WHERE id = ?", [result.authenticationInfo.newCounter, now(), key.id]);
    const user = db.get("SELECT * FROM users WHERE id = ?", [key.user_id]);
    if (!user || user.status !== "active") throw forbidden("This account is suspended. Contact CrownCart support.");
    return c.json(finishLogin(c, user, "passkey"));
  })

  .get("/passkeys", (c) => {
    const u = requireUser(c);
    const rows = c.get("db").all("SELECT id, name, created_at, last_used_at FROM passkeys WHERE user_id = ? ORDER BY id DESC", [u.id]);
    return c.json({ passkeys: rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at, lastUsedAt: r.last_used_at })) });
  })

  .post("/passkeys/register/options", async (c) => {
    const u = requireUser(c);
    rateLimit(`passkey-reg:${u.id}`, 10, 900_000);
    const existing = c.get("db").all("SELECT credential_id, transports FROM passkeys WHERE user_id = ?", [u.id]);
    const options = await generateRegistrationOptions({
      rpName: "CrownCart",
      rpID: rpId(c),
      userName: u.email,
      userDisplayName: u.name,
      userID: new TextEncoder().encode(`crowncart-user-${u.id}`),
      attestationType: "none",
      excludeCredentials: existing.map((k) => ({ id: k.credential_id, transports: JSON.parse(k.transports) })),
      authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    });
    saveChallenge(c, "register", options.challenge, u.id);
    return c.json(options);
  })

  .post("/passkeys/register/verify", async (c) => {
    const u = requireUser(c);
    const { response } = await body(c, z.object({ response: z.object({ id: z.string().min(1).max(1024) }).passthrough() }));
    const saved = takeChallenge(c, "register");
    if (!saved || saved.user_id !== u.id) throw badRequest("Your passkey request expired. Please try again.");
    let result;
    try {
      result = await verifyRegistrationResponse({ response: response as any, expectedChallenge: saved.challenge, expectedOrigin: origin(c), expectedRPID: rpId(c) });
    } catch (err) {
      console.error("[passkey] registration failed", err);
      throw badRequest("We couldn't save that passkey. Please try again.");
    }
    if (!result.verified) throw badRequest("We couldn't save that passkey. Please try again.");
    const cred = result.registrationInfo.credential;
    const db = c.get("db");
    db.run("INSERT INTO passkeys (user_id, credential_id, public_key, counter, transports, name) VALUES (?, ?, ?, ?, ?, ?)", [
      u.id,
      cred.id,
      Buffer.from(cred.publicKey).toString("base64url"),
      cred.counter,
      JSON.stringify(cred.transports ?? []),
      deviceName(c.req.header("user-agent") ?? ""),
    ]);
    audit(db, { actorId: u.id, action: "auth.passkey_added", entityType: "user", entityId: u.id, ip: c.get("ip") });
    return c.json({ ok: true });
  })

  .delete("/passkeys/:id", (c) => {
    const u = requireUser(c);
    const keyId = id.parse(c.req.param("id"));
    const db = c.get("db");
    const { changes } = db.run("DELETE FROM passkeys WHERE id = ? AND user_id = ?", [keyId, u.id]);
    if (!changes) throw notFound("Passkey not found.");
    audit(db, { actorId: u.id, action: "auth.passkey_removed", entityType: "user", entityId: u.id, ip: c.get("ip") });
    return c.json({ ok: true });
  });
