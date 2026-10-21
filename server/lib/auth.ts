import type { MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv, Ctx, SessionUser } from "../context.ts";
import type { Db } from "../db.ts";
import { config } from "../config.ts";
import { randomToken, sha256 } from "./crypto.ts";
import { forbidden, notFound, unauthorized } from "./errors.ts";
import {
  MEMBER_ROLE_PERMISSIONS,
  type AdminPermission,
  type MemberRole,
  type RoleKey,
  type StorePermission,
} from "./permissions.ts";

export const SESSION_COOKIE = config.isProd ? "__Host-cc_session" : "cc_session";

export function createSession(c: Ctx, userId: number): string {
  const db = c.get("db");
  const token = randomToken();
  const expires = new Date(Date.now() + config.sessionTtlDays * 86_400_000);
  db.run("INSERT INTO sessions (id, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)", [
    sha256(token),
    userId,
    expires.toISOString(),
    c.get("ip"),
    (c.req.header("user-agent") ?? "").slice(0, 300),
  ]);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "Lax",
    path: "/",
    expires,
  });
  return sha256(token);
}

export function destroySession(c: Ctx) {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    c.get("db").run("UPDATE sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [sha256(token)]);
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: config.isProd });
}

export function revokeUserSessions(db: Db, userId: number, exceptSessionId?: string) {
  db.run(
    "UPDATE sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ? AND revoked_at IS NULL AND id != ?",
    [userId, exceptSessionId ?? ""],
  );
}

export function loadRoles(db: Db, userId: number): { roles: RoleKey[]; permissions: Set<AdminPermission> } {
  const roles = db
    .all<{ key: RoleKey }>("SELECT r.key FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?", [userId])
    .map((r) => r.key);
  const permissions = new Set(
    db
      .all<{ key: AdminPermission }>(
        `SELECT DISTINCT p.key FROM user_roles ur
           JOIN role_permissions rp ON rp.role_id = ur.role_id
           JOIN permissions p ON p.id = rp.permission_id
          WHERE ur.user_id = ?`,
        [userId],
      )
      .map((p) => p.key),
  );
  return { roles, permissions };
}

/** Resolves the session cookie into c.var.user (or null). Never throws. */
export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("user", null);
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    const db = c.get("db");
    const id = sha256(token);
    const row = db.get(
      `SELECT s.id AS sid, s.expires_at, s.last_seen_at, u.id, u.email, u.name, u.email_verified_at, u.status
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.revoked_at IS NULL`,
      [id],
    );
    if (row && row.status === "active" && row.expires_at > new Date().toISOString()) {
      const { roles, permissions } = loadRoles(db, row.id);
      const user: SessionUser = {
        id: row.id,
        email: row.email,
        name: row.name,
        emailVerified: Boolean(row.email_verified_at),
        roles,
        permissions,
        sessionId: row.sid,
      };
      c.set("user", user);
      // Sliding expiry, written at most every five minutes.
      if (Date.now() - Date.parse(row.last_seen_at) > 300_000) {
        db.run("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?", [
          new Date().toISOString(),
          new Date(Date.now() + config.sessionTtlDays * 86_400_000).toISOString(),
          id,
        ]);
      }
    }
  }
  await next();
};

export function requireUser(c: Ctx): SessionUser {
  const u = c.get("user");
  if (!u) throw unauthorized();
  return u;
}

export function requireRole(c: Ctx, role: RoleKey): SessionUser {
  const u = requireUser(c);
  if (!u.roles.includes(role)) throw forbidden();
  return u;
}

export function requireAdmin(c: Ctx, permission: AdminPermission): SessionUser {
  const u = requireUser(c);
  if (!u.permissions.has(permission)) throw forbidden();
  return u;
}

export function storeRolesFor(db: Db, userId: number) {
  return db.all<{ store_id: number; member_role: MemberRole; name: string; slug: string; status: string }>(
    `SELECT m.store_id, m.member_role, s.name, s.slug, s.status
       FROM store_members m JOIN stores s ON s.id = m.store_id
      WHERE m.user_id = ? ORDER BY s.name`,
    [userId],
  );
}

/**
 * Object-level check for store operations: the user must be a member of this
 * store with a role that grants `permission`, and the store must not be
 * suspended. Unknown stores and stores the user does not belong to are
 * indistinguishable (404) so store ids cannot be probed.
 */
export function requireStore(c: Ctx, storeId: number, permission: StorePermission): SessionUser {
  const u = requireUser(c);
  const db = c.get("db");
  const m = db.get<{ member_role: MemberRole; status: string }>(
    "SELECT m.member_role, s.status FROM store_members m JOIN stores s ON s.id = m.store_id WHERE m.store_id = ? AND m.user_id = ?",
    [storeId, u.id],
  );
  if (!m) throw notFound("Store not found.");
  if (m.status === "suspended") throw forbidden("This store is suspended. Contact CrownCart support.");
  if (!MEMBER_ROLE_PERMISSIONS[m.member_role].includes(permission)) throw forbidden();
  return u;
}

export function publicUser(u: SessionUser | null, db: Db) {
  if (!u) return null;
  const partner = u.roles.includes("delivery_partner")
    ? db.get("SELECT status, availability FROM delivery_partners WHERE user_id = ?", [u.id])
    : null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: u.emailVerified,
    roles: u.roles,
    permissions: [...u.permissions],
    stores: storeRolesFor(db, u.id).map((s) => ({ id: s.store_id, name: s.name, slug: s.slug, status: s.status, role: s.member_role })),
    deliveryPartner: partner ? { status: partner.status, availability: partner.availability } : null,
  };
}
