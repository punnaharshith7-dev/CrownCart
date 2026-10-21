import { Hono } from "hono";
import type { AppEnv } from "../context.ts";
import { config } from "../config.ts";
import { safeEqualHex, sha256 } from "../lib/crypto.ts";
import { applyCourierEvents } from "../lib/courier.ts";

/**
 * Courier tracking webhook. Shiprocket sends the token you configured in its
 * dashboard as the x-api-key header. (Shiprocket rejects webhook URLs that
 * contain words like "shiprocket", hence the neutral path.)
 */
export const shippingRoutes = new Hono<AppEnv>().post("/courier-webhook", async (c) => {
  const expected = config.shiprocket.webhookToken;
  const got = c.req.header("x-api-key") ?? "";
  if (!expected || !safeEqualHex(sha256(got), sha256(expected))) return c.json({ error: "unauthorized" }, 401);
  let p: any;
  try {
    p = await c.req.json();
  } catch {
    return c.json({ error: "invalid body" }, 400);
  }
  const awb = String(p.awb ?? "");
  const db = c.get("db");
  const sh = awb && db.get("SELECT id FROM shipments WHERE carrier = 'shiprocket' AND tracking_number = ?", [awb]);
  // Always 200 for unknown AWBs so the courier doesn't retry forever.
  if (!sh) return c.json({ ok: true, ignored: true });
  const scans = Array.isArray(p.scans)
    ? p.scans.map((s: any) => ({ date: s.date, status: s["sr-status-label"] ?? s.status ?? "", activity: s.activity ?? "", location: s.location ?? "" }))
    : [];
  applyCourierEvents(db, sh.id, String(p.current_status ?? p.shipment_status ?? ""), scans);
  return c.json({ ok: true });
});
