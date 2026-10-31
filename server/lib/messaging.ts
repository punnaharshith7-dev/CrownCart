import type { Db } from "../db.ts";
import { config, integrations } from "../config.ts";
import { getSetting } from "./settings.ts";

export type MessageEvent = "orderPlaced" | "outForDelivery" | "delivered";

/** Normalises an Indian mobile number to E.164 (+91XXXXXXXXXX). */
export function toE164(phone: string | null | undefined): string | null {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

/** Sends one SMS through the configured gateway and returns the provider's message id. */
async function deliverSms(to: string, text: string): Promise<string | null> {
  if (config.smsProvider === "textbee") {
    const res = await fetch("https://api.textbee.dev/api/v1/gateway/send-sms", {
      method: "POST",
      headers: { "x-api-key": config.textbee.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: [to], message: text, ...(config.textbee.deviceId ? { deviceId: config.textbee.deviceId } : {}) }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { data?: { smsBatchId?: string; _id?: string }; message?: string; error?: string };
    if (!res.ok) throw new Error(data.message ?? data.error ?? `textbee responded ${res.status}`);
    return data.data?.smsBatchId ?? data.data?._id ?? null;
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: config.twilio.smsFrom, To: to, Body: text }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!res.ok) throw new Error(data.message ?? `Twilio responded ${res.status}`);
  return data.sid ?? null;
}

/**
 * Sends a transactional SMS or WhatsApp message to a customer who opted in.
 * Messages are only sent when the customer enabled the channel in their
 * account settings. Without a configured provider they are recorded as
 * 'logged' — never reported as sent. Dispatch runs after the current tick so
 * callers can stay inside a synchronous transaction.
 */
export function messageCustomer(db: Db, userId: number, phone: string | null | undefined, event: MessageEvent, body: string) {
  const policy = getSetting(db, "messaging");
  if (!policy[event]) return;
  const to = toE164(phone);
  if (!to) return;
  const prefs = JSON.parse(db.get<{ preferences: string }>("SELECT preferences FROM users WHERE id = ?", [userId])?.preferences ?? "{}");
  const wantsWhatsApp = prefs.whatsappAlerts === true;
  const wantsSms = prefs.smsAlerts === true;
  if (!wantsSms && !wantsWhatsApp) return;
  const channel: "sms" | "whatsapp" = wantsWhatsApp && (policy.preferWhatsApp || !wantsSms) ? "whatsapp" : "sms";
  const live = channel === "sms" ? integrations().sms : integrations().whatsapp;
  const text = `CrownCart: ${body}`;
  const { lastId } = db.run("INSERT INTO message_outbox (channel, to_phone, body, status, user_id) VALUES (?, ?, ?, ?, ?)", [channel, to, text, live ? "queued" : "logged", userId]);
  if (!live) {
    if (!config.isTest) console.log(`[${channel}:not-configured] to=${to} ${text}`);
    return;
  }
  setImmediate(async () => {
    if (!db.get("SELECT id FROM message_outbox WHERE id = ?", [lastId])) return; // transaction rolled back
    try {
      if (channel === "sms") {
        const providerId = await deliverSms(to, text);
        db.run("UPDATE message_outbox SET status = 'sent', provider_id = ? WHERE id = ?", [providerId, lastId]);
        return;
      }
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: `whatsapp:${config.twilio.whatsappFrom.replace(/^whatsapp:/, "")}`, To: `whatsapp:${to}`, Body: text }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? `Twilio responded ${res.status}`);
      db.run("UPDATE message_outbox SET status = 'sent', provider_id = ? WHERE id = ?", [data.sid ?? null, lastId]);
    } catch (err) {
      db.run("UPDATE message_outbox SET status = 'failed', error = ? WHERE id = ?", [String(err), lastId]);
    }
  });
}

/**
 * Sends a sign-in code by SMS. Unlike order alerts this ignores the
 * customer's alert preferences, because they asked for it. Without a
 * configured provider the message is only logged (dev), never reported as sent.
 */
export function sendLoginSms(db: Db, userId: number, to: string, body: string) {
  const live = integrations().sms;
  const text = `CrownCart: ${body}`;
  const { lastId } = db.run("INSERT INTO message_outbox (channel, to_phone, body, status, user_id) VALUES ('sms', ?, ?, ?, ?)", [to, text, live ? "queued" : "logged", userId]);
  if (!live) {
    if (!config.isTest) console.log(`[sms:not-configured] to=${to} ${text}`);
    return;
  }
  setImmediate(async () => {
    if (!db.get("SELECT id FROM message_outbox WHERE id = ?", [lastId])) return; // transaction rolled back
    try {
      const providerId = await deliverSms(to, text);
      db.run("UPDATE message_outbox SET status = 'sent', provider_id = ? WHERE id = ?", [providerId, lastId]);
    } catch (err) {
      db.run("UPDATE message_outbox SET status = 'failed', error = ? WHERE id = ?", [String(err), lastId]);
    }
  });
}
