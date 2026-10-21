import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Ctx } from "../context.ts";
import { forbidden, notFound } from "../lib/errors.ts";
import { body } from "../lib/validate.ts";
import { requireRole } from "../lib/auth.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUSES, FAILURE_REASONS, PARTNER_TRANSITIONS, type DeliveryStatus } from "../lib/orders.ts";
import { partnerTransition } from "../lib/fulfilment.ts";
import { cancelAndRefund, startRefund } from "../lib/payments.ts";
import { getSetting } from "../lib/settings.ts";
import { audit } from "../lib/audit.ts";

/** Only approved partners reach assignment data. */
function requirePartner(c: Ctx) {
  const u = requireRole(c, "delivery_partner");
  const p = c.get("db").get("SELECT status FROM delivery_partners WHERE user_id = ?", [u.id]);
  if (!p) throw forbidden();
  return { user: u, status: p.status as string };
}

function requireApproved(c: Ctx) {
  const r = requirePartner(c);
  if (r.status !== "approved") throw forbidden(r.status === "pending" ? "Your account is awaiting approval." : "Your delivery account is suspended.");
  return r.user;
}

const mask = (phone: string | null) => (phone ? phone.replace(/\d(?=\d{4})/g, "•") : null);

/**
 * The partner's view of an assignment: the minimum needed to deliver it.
 * Customer contact details are shown only while the parcel is with them, and
 * disappear once the assignment closes.
 */
function assignmentView(c: Ctx, a: any) {
  const db = c.get("db");
  const open = !a.closed_at;
  const withPartner = ["picked_up", "in_transit", "out_for_delivery", "attempted"].includes(a.status);
  const items = db.all("SELECT product_name, variant_name, quantity FROM order_items WHERE order_id = ?", [a.order_id]);
  const destination = [a.ship_line1, a.ship_line2, a.ship_city, a.ship_state, a.ship_pincode].filter(Boolean).join(", ");
  return {
    id: a.id,
    status: a.status,
    statusLabel: DELIVERY_STATUS_LABELS[a.status as DeliveryStatus],
    nextSteps: open
      ? PARTNER_TRANSITIONS[a.status as DeliveryStatus].map((s) => ({ to: s, label: DELIVERY_STATUS_LABELS[s] }))
      : [],
    trackingNumber: a.tracking_number,
    orderNumber: a.number,
    orderReady: a.order_status === "ready_for_dispatch",
    assignedAt: a.created_at,
    updatedAt: a.updated_at,
    closedAt: a.closed_at,
    failureReason: a.failure_reason,
    pickup: { store: a.store_name, address: a.pickup_address, pincode: a.pickup_pincode },
    destination: open
      ? {
          name: a.ship_name,
          address: destination,
          pincode: a.ship_pincode,
          phone: withPartner ? a.ship_phone : mask(a.ship_phone),
          mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
        }
      : { name: a.ship_name.split(" ")[0], address: `${a.ship_city} ${a.ship_pincode}`, pincode: a.ship_pincode, phone: null, mapsUrl: null },
    package: { items: items.map((i) => ({ name: i.product_name, variant: i.variant_name, quantity: i.quantity })) },
    // Partners see the amount only when they must collect it.
    collect: a.payment_method === "cod" && a.payment_status === "cod_pending" ? a.total_paise : 0,
    history: db.all("SELECT from_status, to_status, reason, created_at FROM delivery_status_history WHERE assignment_id = ? ORDER BY id", [a.id]),
  };
}

const ASSIGNMENT_SQL = `
  SELECT a.*, s.tracking_number, s.order_id, o.number, o.status AS order_status, o.payment_method, o.payment_status, o.total_paise,
         o.ship_name, o.ship_phone, o.ship_line1, o.ship_line2, o.ship_city, o.ship_state, o.ship_pincode,
         st.name AS store_name, st.pickup_address, st.pickup_pincode
    FROM delivery_assignments a JOIN shipments s ON s.id = a.shipment_id JOIN orders o ON o.id = s.order_id JOIN stores st ON st.id = o.store_id`;

export const deliveryRoutes = new Hono<AppEnv>()
  .get("/me", (c) => {
    const { user, status } = requirePartner(c);
    const db = c.get("db");
    const p = db.get("SELECT * FROM delivery_partners WHERE user_id = ?", [user.id])!;
    const stats = db.get(
      `SELECT SUM(status = 'delivered') AS delivered, SUM(status IN ('failed','returned')) AS failed,
              SUM(closed_at IS NULL AND status != 'cancelled') AS open,
              SUM(status = 'delivered' AND substr(closed_at,1,10) = substr(strftime('%Y-%m-%dT%H:%M:%fZ','now'),1,10)) AS delivered_today
         FROM delivery_assignments WHERE partner_user_id = ?`,
      [user.id],
    )!;
    return c.json({
      status,
      availability: p.availability,
      servicePincodes: p.service_pincodes,
      vehicle: p.vehicle,
      stats: { delivered: stats.delivered ?? 0, failed: stats.failed ?? 0, open: stats.open ?? 0, deliveredToday: stats.delivered_today ?? 0 },
      failureReasons: FAILURE_REASONS,
      requireOtp: getSetting(db, "delivery").requireOtp,
      supportEmail: getSetting(db, "brand").supportEmail,
    });
  })

  .post("/availability", async (c) => {
    const u = requireApproved(c);
    const { availability } = await body(c, z.object({ availability: z.enum(["available", "busy", "offline"]) }));
    c.get("db").run("UPDATE delivery_partners SET availability = ? WHERE user_id = ?", [availability, u.id]);
    return c.json({ ok: true });
  })

  .get("/assignments", (c) => {
    const u = requireApproved(c);
    const scope = c.req.query("scope") ?? "open";
    const rows = c.get("db").all(
      `${ASSIGNMENT_SQL} WHERE a.partner_user_id = ? ${scope === "open" ? "AND a.closed_at IS NULL" : "AND a.closed_at IS NOT NULL"}
        ORDER BY ${scope === "open" ? "a.created_at" : "a.closed_at DESC"} LIMIT 200`,
      [u.id],
    );
    return c.json({ assignments: rows.map((a) => assignmentView(c, a)), statuses: DELIVERY_STATUSES });
  })

  .get("/assignments/:id", (c) => {
    const u = requireApproved(c);
    const a = c.get("db").get(`${ASSIGNMENT_SQL} WHERE a.id = ? AND a.partner_user_id = ?`, [Number(c.req.param("id")), u.id]);
    if (!a) throw notFound("Assignment not found.");
    return c.json({ assignment: assignmentView(c, a) });
  })

  .post("/assignments/:id/status", async (c) => {
    const u = requireApproved(c);
    rateLimit(`delivery-status:${u.id}`, 60, 600_000);
    const input = await body(
      c,
      z.object({
        to: z.enum(DELIVERY_STATUSES),
        reason: z.string().trim().max(300).optional(),
        otp: z.string().regex(/^\d{6}$/, "The delivery code has 6 digits.").optional(),
        recipientName: z.string().trim().max(80).optional(),
        notes: z.string().trim().max(500).optional(),
      }),
    );
    const db = c.get("db");
    const assignmentId = Number(c.req.param("id"));
    const { refundOrderId } = partnerTransition(db, assignmentId, u.id, input);
    audit(db, { actorId: u.id, action: `delivery.${input.to}`, entityType: "assignment", entityId: assignmentId, details: { reason: input.reason }, ip: c.get("ip") });
    if (refundOrderId) {
      const o = db.get("SELECT total_paise, refunded_paise FROM orders WHERE id = ?", [refundOrderId])!;
      if (o.total_paise > o.refunded_paise) await startRefund(db, refundOrderId, o.total_paise - o.refunded_paise, "Parcel returned to sender", null);
    }
    const a = db.get(`${ASSIGNMENT_SQL} WHERE a.id = ?`, [assignmentId]);
    return c.json({ assignment: assignmentView(c, a) });
  })

  .post("/assignments/:id/issue", async (c) => {
    const u = requireApproved(c);
    rateLimit(`delivery-issue:${u.id}`, 10, 3_600_000);
    const { message } = await body(c, z.object({ message: z.string().trim().min(5).max(1000) }));
    const db = c.get("db");
    const a = db.get(`${ASSIGNMENT_SQL} WHERE a.id = ? AND a.partner_user_id = ?`, [Number(c.req.param("id")), u.id]);
    if (!a) throw notFound("Assignment not found.");
    const tid = db.run("INSERT INTO support_tickets (user_id, email, name, order_id, subject, category, priority) VALUES (?, ?, ?, ?, ?, 'delivery', 'high')", [
      u.id,
      u.email,
      u.name,
      a.order_id,
      `Delivery issue: ${a.tracking_number}`,
    ]).lastId;
    db.run("INSERT INTO ticket_messages (ticket_id, author_user_id, body) VALUES (?, ?, ?)", [tid, u.id, message]);
    return c.json({ ok: true, ticketId: tid }, 201);
  });

// Kept for symmetry with other portals; partners never cancel orders.
void cancelAndRefund;
