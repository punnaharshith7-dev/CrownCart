import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Ctx } from "../context.ts";
import type { Db } from "../db.ts";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.ts";
import { body } from "../lib/validate.ts";
import { requireRole } from "../lib/auth.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUSES, FAILURE_REASONS, PARTNER_TRANSITIONS, RETURN_STATUS_LABELS, RETURN_TRANSITIONS, type DeliveryStatus } from "../lib/orders.ts";
import { areaMatch, assignPartner, autoAssignWaitingFor, partnerTransition, saveServiceArea, serviceAreaSchema } from "../lib/fulfilment.ts";
import { cancelAndRefund, startRefund } from "../lib/payments.ts";
import { getSetting } from "../lib/settings.ts";
import { audit } from "../lib/audit.ts";
import { saveUpload } from "../lib/uploads.ts";
import { config } from "../config.ts";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

/** Private folder for delivery photos (doorstep and return-pickup photos). Never served publicly. */
export const deliveryPhotoDir = () => join(config.privateStorageDir, "delivery-photos");
export const deliveryPhotoUrl = (name: string | null | undefined) => (name ? `/api/delivery/photos/${name}` : null);

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
  const isReturn = a.kind === "return";
  const labels = isReturn ? RETURN_STATUS_LABELS : DELIVERY_STATUS_LABELS;
  const steps = isReturn ? RETURN_TRANSITIONS : PARTNER_TRANSITIONS;
  const withPartner = ["picked_up", "in_transit", "out_for_delivery", "attempted"].includes(a.status);
  // A return pickup carries only the items being returned.
  const items = isReturn
    ? db.all("SELECT oi.product_name, oi.variant_name, ri.quantity FROM return_items ri JOIN order_items oi ON oi.id = ri.order_item_id WHERE ri.return_id = ?", [a.return_id])
    : db.all("SELECT product_name, variant_name, quantity FROM order_items WHERE order_id = ?", [a.order_id]);
  const customerAddress = [a.ship_line1, a.ship_line2, a.ship_city, a.ship_state, a.ship_pincode].filter(Boolean).join(", ");
  if (isReturn) {
    // Customer → store. The customer's phone is shown once the pickup is accepted, until it's collected.
    const atCustomer = open && ["accepted"].includes(a.status);
    const storeAddress = [a.pickup_address, a.pickup_pincode].filter(Boolean).join(", ");
    return {
      id: a.id,
      kind: "return" as const,
      status: a.status,
      statusLabel: labels[a.status as DeliveryStatus],
      nextSteps: open ? steps[a.status as DeliveryStatus].map((s) => ({ to: s, label: labels[s] })) : [],
      trackingNumber: a.tracking_number,
      orderNumber: a.number,
      orderReady: true,
      assignedAt: a.created_at,
      updatedAt: a.updated_at,
      closedAt: a.closed_at,
      failureReason: a.failure_reason,
      returnReason: db.get("SELECT reason FROM return_requests WHERE id = ?", [a.return_id])?.reason ?? null,
      pickup: open
        ? {
            store: a.ship_name,
            address: customerAddress,
            pincode: a.ship_pincode,
            phone: atCustomer ? a.ship_phone : mask(a.ship_phone),
            mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress)}`,
          }
        : { store: a.ship_name.split(" ")[0], address: `${a.ship_city} ${a.ship_pincode}`, pincode: a.ship_pincode, phone: null, mapsUrl: null },
      destination: {
        name: a.store_name,
        address: storeAddress || "Store address on file",
        pincode: a.pickup_pincode,
        phone: null,
        mapsUrl: storeAddress ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeAddress)}` : null,
      },
      package: { items: items.map((i) => ({ name: i.product_name, variant: i.variant_name, quantity: i.quantity })) },
      collect: 0,
      history: historyOf(db, a.id),
    };
  }
  const destination = customerAddress;
  return {
    id: a.id,
    kind: "delivery" as const,
    status: a.status,
    statusLabel: labels[a.status as DeliveryStatus],
    nextSteps: open
      ? steps[a.status as DeliveryStatus].map((s) => ({ to: s, label: labels[s] }))
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
    history: historyOf(db, a.id),
  };
}

const historyOf = (db: Db, assignmentId: number) =>
  db
    .all("SELECT from_status, to_status, reason, location, photo, created_at FROM delivery_status_history WHERE assignment_id = ? ORDER BY id", [assignmentId])
    .map((h) => ({ ...h, photo: deliveryPhotoUrl(h.photo) }));

const ASSIGNMENT_SQL = `
  SELECT a.*, s.tracking_number, s.order_id, s.kind, s.return_id, o.number, o.status AS order_status, o.payment_method, o.payment_status, o.total_paise,
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
      city: p.city,
      state: p.state,
      vehicle: p.vehicle,
      stats: { delivered: stats.delivered ?? 0, failed: stats.failed ?? 0, open: stats.open ?? 0, deliveredToday: stats.delivered_today ?? 0 },
      failureReasons: FAILURE_REASONS,
      requireOtp: getSetting(db, "delivery").requireOtp,
      requirePhoto: getSetting(db, "delivery").requirePhoto,
      supportEmail: getSetting(db, "brand").supportEmail,
    });
  })

  // Orders ready for dispatch that no partner has yet. Only area-level details are shown until claimed.
  .get("/available", (c) => {
    const u = requireApproved(c);
    const db = c.get("db");
    const me = db.get("SELECT service_pincodes, state FROM delivery_partners WHERE user_id = ?", [u.id])!;
    const rows = db.all(
      `SELECT s.id AS shipment_id, s.kind, s.tracking_number, s.created_at AS ready_at, o.number, o.ship_city, o.ship_state, o.ship_pincode, o.payment_method, o.payment_status, o.total_paise,
              st.name AS store_name, st.pickup_address, st.pickup_pincode,
              CASE WHEN s.kind = 'return' THEN (SELECT SUM(quantity) FROM return_items WHERE return_id = s.return_id)
                   ELSE (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) END AS items
         FROM shipments s JOIN orders o ON o.id = s.order_id JOIN stores st ON st.id = o.store_id
         LEFT JOIN return_requests rr ON rr.id = s.return_id
        WHERE s.status = 'awaiting_assignment' AND s.carrier = 'crowncart_fleet'
          AND ((s.kind = 'forward' AND o.status = 'ready_for_dispatch') OR (s.kind = 'return' AND rr.status = 'approved'))
          AND NOT EXISTS (SELECT 1 FROM delivery_assignments a WHERE a.shipment_id = s.id AND a.closed_at IS NULL)
        ORDER BY s.created_at`,
    );
    const orders = rows
      .map((r) => ({
        shipmentId: r.shipment_id,
        kind: r.kind === "return" ? ("return" as const) : ("delivery" as const),
        trackingNumber: r.tracking_number,
        orderNumber: r.number,
        readyAt: r.ready_at,
        items: r.items ?? 0,
        pickup: { store: r.store_name, address: r.pickup_address, pincode: r.pickup_pincode },
        destination: { city: r.ship_city, state: r.ship_state, pincode: r.ship_pincode },
        collect: r.kind !== "return" && r.payment_method === "cod" && r.payment_status === "cod_pending" ? r.total_paise : 0,
        inMyArea:
          areaMatch(me.service_pincodes ?? "", String(r.ship_pincode ?? "")) > 0 &&
          (!me.state || !r.ship_state || me.state.toLowerCase() === String(r.ship_state).toLowerCase()),
      }))
      .sort((a, b) => Number(b.inMyArea) - Number(a.inMyArea));
    return c.json({ orders });
  })

  // A partner takes a waiting order for themselves; it is accepted straight away.
  .post("/available/:shipmentId/claim", (c) => {
    const u = requireApproved(c);
    rateLimit(`delivery-claim:${u.id}`, 30, 600_000);
    const db = c.get("db");
    const shipmentId = Number(c.req.param("shipmentId"));
    const assignmentId = db.tx(() => {
      const s = db.get(
        `SELECT s.id FROM shipments s JOIN orders o ON o.id = s.order_id LEFT JOIN return_requests rr ON rr.id = s.return_id
          WHERE s.id = ? AND s.status = 'awaiting_assignment' AND s.carrier = 'crowncart_fleet'
            AND ((s.kind = 'forward' AND o.status = 'ready_for_dispatch') OR (s.kind = 'return' AND rr.status = 'approved'))
            AND NOT EXISTS (SELECT 1 FROM delivery_assignments a WHERE a.shipment_id = s.id AND a.closed_at IS NULL)`,
        [shipmentId],
      );
      if (!s) throw conflict("Someone else has already taken this order.");
      const id = assignPartner(db, shipmentId, u.id, u.id);
      partnerTransition(db, id, u.id, { to: "accepted" });
      return id;
    });
    audit(db, { actorId: u.id, action: "delivery.claimed", entityType: "shipment", entityId: shipmentId, ip: c.get("ip") });
    return c.json({ assignmentId }, 201);
  })

  // Partners keep their own city, state and PIN codes up to date (also allowed while pending approval).
  .put("/service-area", async (c) => {
    const { user, status } = requirePartner(c);
    const area = await body(c, serviceAreaSchema);
    const db = c.get("db");
    const assigned = db.tx(() => {
      saveServiceArea(db, user.id, area);
      audit(db, { actorId: user.id, action: "delivery_partner.service_area", entityType: "user", entityId: user.id, details: { city: area.city, state: area.state, pincodes: area.pincodes.length } });
      return status === "approved" ? autoAssignWaitingFor(db, user.id) : 0;
    });
    return c.json({ ok: true, assigned });
  })

  .post("/availability", async (c) => {
    const u = requireApproved(c);
    const { availability } = await body(c, z.object({ availability: z.enum(["available", "busy", "offline"]) }));
    const db = c.get("db");
    // Going available picks up any ready orders in this partner's area that nobody nearby could take.
    const assigned = db.tx(() => {
      db.run("UPDATE delivery_partners SET availability = ? WHERE user_id = ?", [availability, u.id]);
      return availability === "available" ? autoAssignWaitingFor(db, u.id) : 0;
    });
    return c.json({ ok: true, assigned });
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
    const schema = z.object({
      to: z.enum(DELIVERY_STATUSES),
      reason: z.string().trim().max(300).optional(),
      otp: z.string().regex(/^\d{6}$/, "The delivery code has 6 digits.").optional(),
      recipientName: z.string().trim().max(80).optional(),
      notes: z.string().trim().max(500).optional(),
      location: z.string().trim().max(120).optional(),
    });
    // With a photo the app sends multipart form data; otherwise JSON.
    let input: z.infer<typeof schema>;
    let photoFile: File | null = null;
    if ((c.req.header("content-type") ?? "").startsWith("multipart/form-data")) {
      const form = await c.req.formData().catch(() => null);
      if (!form) throw badRequest("Couldn't read the upload. Try again.");
      const fields: Record<string, string> = {};
      for (const [k, v] of form.entries()) if (typeof v === "string" && v !== "") fields[k] = v;
      const parsed = schema.safeParse(fields);
      if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Check the details and try again.");
      input = parsed.data;
      const f = form.get("photo");
      if (f instanceof File && f.size > 0) photoFile = f;
    } else {
      input = await body(c, schema);
    }
    const db = c.get("db");
    const assignmentId = Number(c.req.param("id"));
    // Photos only (JPG, PNG, WebP), checked by their bytes; removed again if the step is refused.
    const photo = photoFile ? (await saveUpload(photoFile, deliveryPhotoDir(), ["image"])).name : undefined;
    let refundOrderId: number | null;
    try {
      ({ refundOrderId } = partnerTransition(db, assignmentId, u.id, { ...input, photo }));
    } catch (err) {
      if (photo) {
        try {
          unlinkSync(join(deliveryPhotoDir(), photo));
        } catch {
          /* already gone */
        }
      }
      throw err;
    }
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

/**
 * Serves a delivery photo to the people involved: the partner who took it, the customer whose
 * order it is, that store's staff, and platform admins. Everyone else gets "not found".
 */
export const deliveryPhotoRoutes = new Hono<AppEnv>().get("/:name", (c) => {
  const u = c.get("user");
  if (!u) throw notFound();
  const name = c.req.param("name");
  if (!/^[a-z0-9]+-[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(name)) throw notFound();
  const db = c.get("db");
  const row = db.get(
    `SELECT h.actor_user_id, o.user_id AS customer_id, o.store_id FROM delivery_status_history h
       JOIN delivery_assignments a ON a.id = h.assignment_id JOIN shipments s ON s.id = a.shipment_id JOIN orders o ON o.id = s.order_id
      WHERE h.photo = ? LIMIT 1`,
    [name],
  );
  if (!row) throw notFound();
  const allowed =
    u.id === row.actor_user_id ||
    u.id === row.customer_id ||
    u.roles.includes("platform_admin") ||
    Boolean(db.get("SELECT 1 FROM store_members WHERE store_id = ? AND user_id = ?", [row.store_id, u.id]));
  if (!allowed) throw notFound();
  const path = join(deliveryPhotoDir(), name);
  if (!existsSync(path)) throw notFound();
  const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return c.body(readFileSync(path), 200, { "Content-Type": type, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" });
});

// Kept for symmetry with other portals; partners never cancel orders.
void cancelAndRefund;
