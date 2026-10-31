import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context.ts";
import type { Db } from "../db.ts";
import { config, integrations } from "../config.ts";
import { hashPassword, randomToken, sha256, verifyPassword } from "../lib/crypto.ts";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { body, email, newPassword } from "../lib/validate.ts";
import { saveServiceArea, serviceAreaSchema } from "../lib/fulfilment.ts";
import { audit } from "../lib/audit.ts";
import { notify, sendEmail } from "../lib/notify.ts";
import {
  createSession,
  destroySession,
  loadRoles,
  publicUser,
  requireUser,
  revokeUserSessions,
} from "../lib/auth.ts";
import type { RoleKey } from "../lib/permissions.ts";
import { attachReferral } from "../lib/credits.ts";

const LOCK_AFTER = 8;
const LOCK_MINUTES = 15;

export function grantRole(db: Db, userId: number, role: RoleKey, grantedBy: number | null) {
  db.run(
    "INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_by) SELECT ?, id, ? FROM roles WHERE key = ?",
    [userId, grantedBy, role],
  );
}

function issueToken(db: Db, userId: number, purpose: "email_verify" | "password_reset", ttlMinutes: number) {
  const token = randomToken();
  db.run("UPDATE verification_tokens SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ? AND purpose = ? AND used_at IS NULL", [
    userId,
    purpose,
  ]);
  db.run("INSERT INTO verification_tokens (user_id, purpose, token_hash, expires_at) VALUES (?, ?, ?, ?)", [
    userId,
    purpose,
    sha256(token),
    new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
  ]);
  return token;
}

function consumeToken(db: Db, token: string, purpose: "email_verify" | "password_reset") {
  const row = db.get(
    "SELECT * FROM verification_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL",
    [sha256(token), purpose],
  );
  if (!row || row.expires_at < new Date().toISOString()) {
    throw badRequest("This link is invalid or has expired. Please request a new one.");
  }
  db.run("UPDATE verification_tokens SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [row.id]);
  return row.user_id as number;
}

export function sendVerification(db: Db, userId: number, to: string) {
  const token = issueToken(db, userId, "email_verify", 60 * 48);
  sendEmail(
    db,
    to,
    "Verify your CrownCart email",
    `Welcome to CrownCart.\n\nConfirm your email address to place orders:\n${config.publicUrl}/verify-email?token=${token}\n\nThis link expires in 48 hours.`,
  );
}

export const authRoutes = new Hono<AppEnv>()
  .get("/me", (c) => {
    const db = c.get("db");
    const u = c.get("user");
    const cartCount = u
      ? db.get<{ n: number }>("SELECT COALESCE(SUM(quantity),0) n FROM cart_items WHERE user_id = ? AND saved_for_later = 0", [u.id])!.n
      : 0;
    const unread = u ? db.get<{ n: number }>("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NULL", [u.id])!.n : 0;
    const prefs = u ? JSON.parse(db.get<{ preferences: string }>("SELECT preferences FROM users WHERE id = ?", [u.id])!.preferences) : null;
    return c.json({ user: publicUser(u, db), cartCount, unreadNotifications: unread, preferences: prefs, integrations: { google: integrations().google, microsoft: integrations().microsoft } });
  })

  .post("/register", async (c) => {
    rateLimit(`register:${c.get("ip")}`, 10, 3_600_000);
    const input = await body(
      c,
      z.object({
        name: z.string().trim().min(2, "Enter your full name.").max(80),
        email,
        password: newPassword,
        acceptTerms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms to continue." }) }),
        marketingOptIn: z.boolean().default(false),
        referralCode: z.string().trim().max(20).optional().nullable(),
      }),
    );
    if (input.password.toLowerCase().includes(input.email.split("@")[0])) throw badRequest("Your password must not contain your email name.");
    const db = c.get("db");
    if (db.get("SELECT 1 FROM users WHERE email = ?", [input.email])) {
      throw conflict("An account with this email already exists. Sign in instead.", { fields: { email: "Already registered." } });
    }
    const hash = await hashPassword(input.password);
    const userId = db.tx(() => {
      const { lastId } = db.run("INSERT INTO users (email, password_hash, name, preferences) VALUES (?, ?, ?, ?)", [
        input.email,
        hash,
        input.name,
        JSON.stringify({ marketingEmails: input.marketingOptIn, theme: "system" }),
      ]);
      // Public registration only ever creates customers.
      grantRole(db, lastId, "customer", null);
      attachReferral(db, lastId, input.referralCode);
      sendVerification(db, lastId, input.email);
      audit(db, { actorId: lastId, action: "auth.register", entityType: "user", entityId: lastId, ip: c.get("ip") });
      return lastId;
    });
    createSession(c, userId);
    const fresh = loadRoles(db, userId);
    return c.json(
      { user: publicUser({ id: userId, email: input.email, name: input.name, emailVerified: false, ...fresh, sessionId: "" }, db) },
      201,
    );
  })

  .post("/login", async (c) => {
    rateLimit(`login:${c.get("ip")}`, 20, 900_000);
    const input = await body(c, z.object({ email, password: z.string().min(1, "Enter your password.").max(200) }));
    rateLimit(`login-account:${input.email}`, 10, 900_000);
    const db = c.get("db");
    const user = db.get("SELECT * FROM users WHERE email = ?", [input.email]);
    if (user?.locked_until && user.locked_until > new Date().toISOString()) {
      throw unauthorized(`Too many failed attempts. Try again after ${new Date(user.locked_until).toLocaleTimeString("en-IN")}, or reset your password.`);
    }
    const ok = await verifyPassword(input.password, user?.password_hash);
    if (!user || !ok) {
      if (user) {
        const fails = user.failed_login_count + 1;
        db.run("UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?", [
          fails >= LOCK_AFTER ? 0 : fails,
          fails >= LOCK_AFTER ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
          user.id,
        ]);
        audit(db, { actorId: user.id, action: "auth.login_failed", entityType: "user", entityId: user.id, ip: c.get("ip") });
        if (fails >= LOCK_AFTER) {
          notify(db, user.id, { type: "security.locked", title: "Your account was temporarily locked", body: "Several failed sign-in attempts were made. If this wasn't you, reset your password." });
        }
      }
      throw unauthorized("Incorrect email or password.");
    }
    if (user.status !== "active") throw forbidden("This account is suspended. Contact CrownCart support.");

    const seenBefore = db.get(
      "SELECT 1 FROM sessions WHERE user_id = ? AND (ip = ? OR user_agent = ?) LIMIT 1",
      [user.id, c.get("ip"), (c.req.header("user-agent") ?? "").slice(0, 300)],
    );
    db.tx(() => {
      db.run("UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?", [user.id]);
      audit(db, { actorId: user.id, action: "auth.login", entityType: "user", entityId: user.id, ip: c.get("ip") });
      const hadSessions = db.get("SELECT 1 FROM sessions WHERE user_id = ? LIMIT 1", [user.id]);
      if (hadSessions && !seenBefore) {
        notify(db, user.id, {
          type: "security.new_login",
          title: "New sign-in to your account",
          body: `A sign-in from a new device or network (${c.get("ip")}). If this wasn't you, change your password and sign out other sessions.`,
          link: "/account/security",
        });
      }
    });
    const sessionId = createSession(c, user.id);
    const { roles, permissions } = loadRoles(db, user.id);
    return c.json({
      user: publicUser({ id: user.id, email: user.email, name: user.name, emailVerified: Boolean(user.email_verified_at), roles, permissions, sessionId }, db),
    });
  })

  .post("/logout", (c) => {
    destroySession(c);
    return c.json({ ok: true });
  })

  .post("/verify-email", async (c) => {
    const { token } = await body(c, z.object({ token: z.string().min(10).max(200) }));
    const db = c.get("db");
    db.tx(() => {
      const userId = consumeToken(db, token, "email_verify");
      db.run("UPDATE users SET email_verified_at = COALESCE(email_verified_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id = ?", [userId]);
      audit(db, { actorId: userId, action: "auth.email_verified", entityType: "user", entityId: userId, ip: c.get("ip") });
    });
    return c.json({ ok: true });
  })

  .post("/resend-verification", (c) => {
    const u = requireUser(c);
    rateLimit(`verify:${u.id}`, 3, 3_600_000);
    if (u.emailVerified) return c.json({ ok: true, alreadyVerified: true });
    const db = c.get("db");
    db.tx(() => sendVerification(db, u.id, u.email));
    return c.json({ ok: true });
  })

  .post("/forgot-password", async (c) => {
    rateLimit(`forgot:${c.get("ip")}`, 5, 3_600_000);
    const input = await body(c, z.object({ email }));
    const db = c.get("db");
    const user = db.get("SELECT id, email, status FROM users WHERE email = ?", [input.email]);
    if (user && user.status === "active") {
      db.tx(() => {
        const token = issueToken(db, user.id, "password_reset", 30);
        sendEmail(
          db,
          user.email,
          "Reset your CrownCart password",
          `We received a request to reset your password.\n\n${config.publicUrl}/reset-password?token=${token}\n\nThis link expires in 30 minutes. If you didn't ask for this, you can ignore this email.`,
        );
        audit(db, { actorId: user.id, action: "auth.password_reset_requested", entityType: "user", entityId: user.id, ip: c.get("ip") });
      });
    }
    // Same answer whether or not the account exists.
    return c.json({ ok: true });
  })

  .post("/reset-password", async (c) => {
    rateLimit(`reset:${c.get("ip")}`, 10, 3_600_000);
    const input = await body(c, z.object({ token: z.string().min(10).max(200), password: newPassword }));
    const db = c.get("db");
    const hash = await hashPassword(input.password);
    db.tx(() => {
      const userId = consumeToken(db, input.token, "password_reset");
      db.run(
        "UPDATE users SET password_hash = ?, failed_login_count = 0, locked_until = NULL, email_verified_at = COALESCE(email_verified_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id = ?",
        [hash, userId],
      );
      revokeUserSessions(db, userId);
      notify(db, userId, { type: "security.password_changed", title: "Your password was reset", body: "All other sessions were signed out." });
      audit(db, { actorId: userId, action: "auth.password_reset", entityType: "user", entityId: userId, ip: c.get("ip") });
    });
    return c.json({ ok: true });
  })

  .post("/change-password", async (c) => {
    const u = requireUser(c);
    rateLimit(`change-pw:${u.id}`, 5, 900_000);
    const input = await body(c, z.object({ currentPassword: z.string().min(1).max(200), newPassword }));
    const db = c.get("db");
    const row = db.get("SELECT password_hash FROM users WHERE id = ?", [u.id]);
    if (!(await verifyPassword(input.currentPassword, row?.password_hash))) {
      throw badRequest("Your current password is incorrect.", { fields: { currentPassword: "Incorrect password." } });
    }
    const hash = await hashPassword(input.newPassword);
    db.tx(() => {
      db.run("UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [hash, u.id]);
      revokeUserSessions(db, u.id, u.sessionId);
      notify(db, u.id, { type: "security.password_changed", title: "Your password was changed", body: "Other sessions were signed out." });
      audit(db, { actorId: u.id, action: "auth.password_changed", entityType: "user", entityId: u.id, ip: c.get("ip") });
    });
    return c.json({ ok: true });
  })

  .get("/sessions", (c) => {
    const u = requireUser(c);
    const rows = c.get("db").all(
      "SELECT id, created_at, last_seen_at, ip, user_agent FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC",
      [u.id, new Date().toISOString()],
    );
    return c.json({
      sessions: rows.map((s) => ({
        id: s.id.slice(0, 16),
        current: s.id === u.sessionId,
        createdAt: s.created_at,
        lastSeenAt: s.last_seen_at,
        ip: s.ip,
        userAgent: s.user_agent,
      })),
    });
  })

  .delete("/sessions/:id", (c) => {
    const u = requireUser(c);
    const prefix = c.req.param("id");
    if (!/^[0-9a-f]{16}$/.test(prefix)) throw notFound();
    const r = c.get("db").run(
      "UPDATE sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ? AND substr(id, 1, 16) = ? AND id != ?",
      [u.id, prefix, u.sessionId],
    );
    if (!r.changes) throw notFound("Session not found.");
    return c.json({ ok: true });
  })

  .post("/sessions/revoke-others", (c) => {
    const u = requireUser(c);
    revokeUserSessions(c.get("db"), u.id, u.sessionId);
    return c.json({ ok: true });
  })

  // ── Invitations for privileged roles ──
  .get("/invitations/:token", (c) => {
    const db = c.get("db");
    const inv = db.get(
      `SELECT i.*, COALESCE((SELECT group_concat(x.name, ', ') FROM invitation_stores m JOIN stores x ON x.id = m.store_id WHERE m.invitation_id = i.id), s.name) AS store_name
         FROM invitations i LEFT JOIN stores s ON s.id = i.store_id
        WHERE i.token_hash = ? AND i.accepted_at IS NULL AND i.revoked_at IS NULL`,
      [sha256(c.req.param("token"))],
    );
    if (!inv || inv.expires_at < new Date().toISOString()) throw notFound("This invitation is invalid or has expired.");
    const existing = Boolean(db.get("SELECT 1 FROM users WHERE email = ?", [inv.email]));
    return c.json({ email: inv.email, role: inv.role_key, memberRole: inv.member_role, storeName: inv.store_name, existingAccount: existing });
  })

  .post("/invitations/:token/accept", async (c) => {
    rateLimit(`invite:${c.get("ip")}`, 10, 3_600_000);
    const db = c.get("db");
    const inv = db.get(
      "SELECT * FROM invitations WHERE token_hash = ? AND accepted_at IS NULL AND revoked_at IS NULL",
      [sha256(c.req.param("token"))],
    );
    if (!inv || inv.expires_at < new Date().toISOString()) throw notFound("This invitation is invalid or has expired.");

    const existing = db.get("SELECT * FROM users WHERE email = ?", [inv.email]);
    if (existing) {
      // An existing account must prove ownership by being signed in as it.
      const u = c.get("user");
      if (!u || u.id !== existing.id) throw unauthorized(`Sign in as ${inv.email} to accept this invitation.`);
    }
    const isPartner = inv.role_key === "delivery_partner";
    const input = await body(
      c,
      z.object({
        name: existing ? z.string().optional() : z.string().trim().min(2).max(80),
        password: existing ? z.string().optional() : newPassword,
        // Delivery partners say where they work (city, state, PIN codes) when they join.
        serviceArea: isPartner ? serviceAreaSchema : serviceAreaSchema.optional(),
      }),
    );
    const newAccount = existing ? null : { name: input.name!, hash: await hashPassword(input.password!) };

    const userId = db.tx(() => {
      // Re-check inside the transaction so two concurrent accepts cannot both win.
      if (!db.run("UPDATE invitations SET accepted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND accepted_at IS NULL", [inv.id]).changes) {
        throw conflict("This invitation has already been used.");
      }
      let userId: number = existing?.id;
      if (newAccount) {
        // The invitation link was delivered to this address, which verifies it.
        userId = db.run(
          "INSERT INTO users (email, password_hash, name, email_verified_at) VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))",
          [inv.email, newAccount.hash, newAccount.name],
        ).lastId;
        grantRole(db, userId, "customer", null);
      }
      grantRole(db, userId, inv.role_key, inv.invited_by);
      // Admin invites may cover several stores (invitation_stores); store team invites carry just store_id.
      const storeIds = db.all<{ store_id: number }>(
        "SELECT store_id FROM invitation_stores WHERE invitation_id = ? UNION SELECT store_id FROM invitations WHERE id = ? AND store_id IS NOT NULL",
        [inv.id, inv.id],
      );
      for (const { store_id } of storeIds) {
        db.run(
          "INSERT INTO store_members (store_id, user_id, member_role) VALUES (?, ?, ?) ON CONFLICT(store_id, user_id) DO UPDATE SET member_role = excluded.member_role",
          [store_id, userId, inv.member_role ?? "owner"],
        );
      }
      if (isPartner) {
        // Partners still need admin approval after accepting.
        db.run("INSERT OR IGNORE INTO delivery_partners (user_id, status) VALUES (?, 'pending')", [userId]);
        saveServiceArea(db, userId, input.serviceArea!);
      }
      audit(db, {
        actorId: userId,
        action: "role.invitation_accepted",
        entityType: "user",
        entityId: userId,
        storeId: inv.store_id,
        details: { role: inv.role_key, memberRole: inv.member_role, invitedBy: inv.invited_by },
        ip: c.get("ip"),
      });
      return userId;
    });
    if (!c.get("user")) createSession(c, userId);
    return c.json({ ok: true, role: inv.role_key });
  });
