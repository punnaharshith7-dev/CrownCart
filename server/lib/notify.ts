import type { Db } from "../db.ts";
import nodemailer, { type Transporter } from "nodemailer";
import { config, integrations } from "../config.ts";

let smtp: Transporter | null = null;
function smtpTransport() {
  smtp ??= nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpPort === 465,
    auth: { user: config.email.smtpUser, pass: config.email.smtpPass },
  });
  return smtp;
}

/** Gmail and most SMTP hosts only send "from" the signed-in mailbox, so fall back to it. */
function smtpFrom() {
  const from = config.email.from;
  return from.toLowerCase().includes(config.email.smtpUser.toLowerCase()) ? from : `CrownCart <${config.email.smtpUser}>`;
}

export interface NotificationInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

/** In-app notification. Always stored; channels below respect preferences. */
export function notify(db: Db, userId: number, n: NotificationInput) {
  db.run("INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)", [
    userId,
    n.type,
    n.title,
    n.body ?? "",
    n.link ?? null,
  ]);
}

export function notifyMany(db: Db, userIds: number[], n: NotificationInput) {
  for (const id of new Set(userIds)) notify(db, id, n);
}

/**
 * Queues an email. With no provider configured the message is stored as
 * 'logged' (and printed in development) — it is never reported as sent.
 * Dispatch happens after the current tick so callers can stay inside a
 * synchronous transaction.
 */
export function sendEmail(db: Db, to: string, subject: string, body: string, opts: { replyTo?: string } = {}) {
  const live = integrations().email;
  const { lastId } = db.run("INSERT INTO email_outbox (to_email, subject, body, status) VALUES (?, ?, ?, ?)", [
    to,
    subject,
    body,
    live ? "queued" : "logged",
  ]);
  if (!live) {
    if (!config.isTest) console.log(`\n[email:not-configured] to=${to}\nsubject: ${subject}\n${body}\n`);
    return;
  }
  setImmediate(async () => {
    const row = db.get("SELECT id FROM email_outbox WHERE id = ?", [lastId]);
    if (!row) return; // the enclosing transaction rolled back
    try {
      if (config.email.provider === "smtp") {
        await smtpTransport().sendMail({ from: smtpFrom(), to, subject, text: body, replyTo: opts.replyTo });
        db.run("UPDATE email_outbox SET status = 'sent' WHERE id = ?", [lastId]);
        return;
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.email.resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: config.email.from, to, subject, text: body, reply_to: opts.replyTo }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
      db.run("UPDATE email_outbox SET status = 'sent' WHERE id = ?", [lastId]);
    } catch (err) {
      db.run("UPDATE email_outbox SET status = 'failed', error = ? WHERE id = ?", [String(err), lastId]);
    }
  });
}

/**
 * The admin inbox for support and contact mail: ADMIN_EMAIL (or INITIAL_ADMIN_EMAIL) from .env,
 * otherwise the platform admins' own addresses. Nobody else — not store owners — receives these.
 */
export function adminInbox(db: Db): string[] {
  if (config.email.adminInbox) return [config.email.adminInbox];
  return db
    .all("SELECT u.email FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.key = 'platform_admin' AND u.status = 'active'")
    .map((r) => r.email as string)
    .filter((e) => !e.endsWith(".local"));
}

/** Emails a support/contact message to the admin inbox; replying to it goes straight to the customer. */
export function emailAdmins(db: Db, subject: string, body: string, replyTo?: string) {
  const to = adminInbox(db);
  if (!to.length) {
    console.warn("[support] no admin inbox configured — set ADMIN_EMAIL in .env to receive support emails");
    return;
  }
  for (const addr of to) sendEmail(db, addr, subject, body, { replyTo });
}
