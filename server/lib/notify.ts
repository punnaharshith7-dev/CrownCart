import type { Db } from "../db.ts";
import { config, integrations } from "../config.ts";

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
export function sendEmail(db: Db, to: string, subject: string, body: string) {
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
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.email.resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: config.email.from, to, subject, text: body }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
      db.run("UPDATE email_outbox SET status = 'sent' WHERE id = ?", [lastId]);
    } catch (err) {
      db.run("UPDATE email_outbox SET status = 'failed', error = ? WHERE id = ?", [String(err), lastId]);
    }
  });
}
