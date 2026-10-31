import { z } from "zod";
import { pincodeStateError } from "../../src/lib/pincodes.ts";
import type { Db, Row } from "../db.ts";
import { badRequest, conflict, forbidden, notFound } from "./errors.ts";
import { numericCode, sha256 } from "./crypto.ts";
import {
  DELIVERY_STATUS_LABELS,
  PARTNER_TRANSITIONS,
  RETURN_STATUS_LABELS,
  RETURN_TRANSITIONS,
  generateTrackingNumber,
  restockOrder,
  transitionOrder,
  type DeliveryStatus,
} from "./orders.ts";
import { notify, notifyMany, sendEmail } from "./notify.ts";
import { getSetting } from "./settings.ts";
import { audit } from "./audit.ts";
import { messageCustomer } from "./messaging.ts";

export function createShipment(db: Db, orderId: number): Row {
  const existing = db.get("SELECT * FROM shipments WHERE order_id = ? AND kind = 'forward' AND status NOT IN ('cancelled')", [orderId]);
  if (existing) return existing;
  const id = db.run("INSERT INTO shipments (order_id, kind, tracking_number, status) VALUES (?, 'forward', ?, 'awaiting_assignment')", [
    orderId,
    generateTrackingNumber(db),
  ]).lastId;
  return db.get("SELECT * FROM shipments WHERE id = ?", [id])!;
}

export function approvedPartners(db: Db) {
  return db.all(
    `SELECT u.id, u.name, dp.availability, dp.service_pincodes, dp.state,
            (SELECT COUNT(*) FROM delivery_assignments a WHERE a.partner_user_id = u.id AND a.closed_at IS NULL) AS open_assignments
       FROM delivery_partners dp JOIN users u ON u.id = dp.user_id
      WHERE dp.status = 'approved' AND u.status = 'active' ORDER BY dp.availability = 'available' DESC, open_assignments, u.name`,
  );
}

/** What a delivery partner provides about where they work. PIN codes are 6 digits, de-duplicated. */
export const serviceAreaSchema = z.object({
  city: z.string().trim().min(2, "Enter your city.").max(60),
  state: z.string().trim().min(2, "Choose your state.").max(60),
  pincodes: z
    .array(z.string().trim().regex(/^[1-9]\d{5}$/, "PIN codes must be 6 digits."))
    .min(1, "Add at least one PIN code you can deliver to.")
    .max(100)
    .transform((a) => [...new Set(a)]),
}).superRefine((a, ctx) => {
  const wrong = a.pincodes.map((p) => pincodeStateError(p, a.state)).find(Boolean);
  if (wrong) ctx.addIssue({ code: "custom", path: ["pincodes"], message: wrong });
});
export type ServiceArea = z.infer<typeof serviceAreaSchema>;

/** Saves a partner's service area (creating the partner row if needed). Call inside db.tx(). */
export function saveServiceArea(db: Db, userId: number, area: ServiceArea) {
  db.run(
    `INSERT INTO delivery_partners (user_id, status, city, state, service_pincodes) VALUES (?, 'pending', ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET city = excluded.city, state = excluded.state, service_pincodes = excluded.service_pincodes`,
    [userId, area.city, area.state, area.pincodes.join(", ")],
  );
}

/** How closely a partner's service area covers a PIN code: length of the longest matching prefix, 0 if none. */
export function areaMatch(servicePincodes: string, pincode: string) {
  return servicePincodes
    .split(/[\s,]+/)
    .filter((p) => p && pincode.startsWith(p))
    .reduce((best, p) => Math.max(best, p.length), 0);
}

/** The available partner whose area covers a PIN code most specifically, then the least busy one. */
function nearestPartner(db: Db, pincode: string, state: string | null): { id: number } | null {
  const sameState = (s: string | null) => !s || !state || s.trim().toLowerCase() === String(state).trim().toLowerCase();
  return (
    approvedPartners(db)
      .filter((p) => p.availability === "available" && sameState(p.state))
      .map((p) => ({ id: p.id as number, open: p.open_assignments as number, score: areaMatch(p.service_pincodes ?? "", pincode) }))
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score || a.open - b.open)[0] ?? null
  );
}

/**
 * Arranges a courier pickup for an approved return: a 'return' shipment from the customer's
 * address back to the store, handed to the nearest available partner by the customer's PIN code.
 * If nobody covers the area it waits in the partners' "Available" list and the store and admins
 * are told. Returns the shipment. Call inside db.tx().
 */
export function createReturnPickup(db: Db, returnId: number, actorId: number | null): Row {
  const r = db.get(
    "SELECT rr.id, rr.status, rr.user_id, o.id AS order_id, o.number, o.store_id, o.ship_pincode, o.ship_state FROM return_requests rr JOIN orders o ON o.id = rr.order_id WHERE rr.id = ?",
    [returnId],
  );
  if (!r) throw notFound("Return not found.");
  if (r.status !== "approved") throw conflict("Pickups can only be arranged for approved returns.");
  const open = db.get(
    "SELECT s.* FROM shipments s WHERE s.return_id = ? AND s.status NOT IN ('failed', 'cancelled', 'delivered')",
    [returnId],
  );
  if (open) return open;

  const shipmentId = db.run("INSERT INTO shipments (order_id, kind, return_id, tracking_number, status) VALUES (?, 'return', ?, ?, 'awaiting_assignment')", [
    r.order_id,
    returnId,
    generateTrackingNumber(db),
  ]).lastId;

  const best = getSetting(db, "delivery").autoAssign ? nearestPartner(db, String(r.ship_pincode ?? ""), r.ship_state) : null;
  if (best) {
    assignPartner(db, shipmentId, best.id, actorId);
    audit(db, { actorId, action: "return.pickup_assigned", entityType: "shipment", entityId: shipmentId, storeId: r.store_id, details: { partnerId: best.id, returnId } });
  } else {
    const staff = db.all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role IN ('owner', 'order_manager')", [r.store_id]).map((x) => x.user_id);
    const admins = db.all("SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'platform_admin'").map((x) => x.user_id);
    notifyMany(db, [...staff, ...admins], {
      type: "return.no_partner",
      title: `No delivery partner near ${r.ship_pincode} for the return on ${r.number}`,
      body: "The pickup is waiting in the partners' Available list. Assign one from the admin delivery page if needed.",
      link: `/owner/orders/${r.number}`,
    });
  }
  notify(db, r.user_id, {
    type: "return.pickup_scheduled",
    title: `Pickup arranged for your return on ${r.number}`,
    body: "A delivery partner will collect the items from your delivery address. Keep them packed and ready.",
    link: `/account/orders/${r.number}`,
  });
  return db.get("SELECT * FROM shipments WHERE id = ?", [shipmentId])!;
}

/**
 * Auto-assigns an unassigned forward shipment to the nearest available partner: the one whose
 * service area matches the delivery PIN code most specifically, then the one with the fewest open
 * deliveries. Leaves it for manual assignment (and tells the store) if nobody covers the area.
 * Returns the partner id, or null. Call inside db.tx().
 */
export function autoAssignShipment(db: Db, orderId: number, actorId: number | null): number | null {
  if (!getSetting(db, "delivery").autoAssign) return null;
  const order = db.get("SELECT id, number, store_id, ship_pincode, ship_state, status FROM orders WHERE id = ?", [orderId]);
  if (!order || order.status !== "ready_for_dispatch") return null;
  const shipment = db.get("SELECT * FROM shipments WHERE order_id = ? AND kind = 'forward' AND status = 'awaiting_assignment'", [orderId]);
  if (!shipment || shipment.carrier !== "crowncart_fleet") return null;
  if (db.get("SELECT 1 FROM delivery_assignments WHERE shipment_id = ? AND closed_at IS NULL", [shipment.id])) return null;

  const best = nearestPartner(db, String(order.ship_pincode ?? ""), order.ship_state);

  if (!best) {
    const owners = db.all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role IN ('owner', 'order_manager')", [order.store_id]).map((r) => r.user_id);
    notifyMany(db, owners, {
      type: "delivery.no_partner",
      title: `No delivery partner near ${order.ship_pincode} for order ${order.number}`,
      body: "Assign one manually or book a courier.",
      link: `/owner/orders/${order.number}`,
    });
    return null;
  }
  assignPartner(db, shipment.id, best.id, actorId);
  audit(db, { actorId, action: "delivery.auto_assigned", entityType: "shipment", entityId: shipment.id, storeId: order.store_id, details: { partnerId: best.id, pincode: order.ship_pincode } });
  return best.id;
}

/** When a partner becomes available, hand them waiting shipments in their area (oldest first). */
export function autoAssignWaitingFor(db: Db, partnerId: number) {
  if (!getSetting(db, "delivery").autoAssign) return 0;
  const partner = db.get("SELECT service_pincodes, state FROM delivery_partners WHERE user_id = ? AND status = 'approved' AND availability = 'available'", [partnerId]);
  if (!partner?.service_pincodes) return 0;
  const waiting = db.all(
    `SELECT o.id, o.ship_pincode, o.ship_state FROM shipments s JOIN orders o ON o.id = s.order_id
      WHERE s.kind = 'forward' AND s.status = 'awaiting_assignment' AND s.carrier = 'crowncart_fleet' AND o.status = 'ready_for_dispatch'
        AND NOT EXISTS (SELECT 1 FROM delivery_assignments a WHERE a.shipment_id = s.id AND a.closed_at IS NULL)
      ORDER BY s.created_at`,
  );
  let n = 0;
  const stateOk = (s: string | null) => !partner.state || !s || partner.state.trim().toLowerCase() === s.trim().toLowerCase();
  for (const w of waiting) if (stateOk(w.ship_state) && areaMatch(partner.service_pincodes, String(w.ship_pincode ?? "")) && autoAssignShipment(db, w.id, null)) n++;
  return n;
}

/** Assigns (or reassigns) a shipment to an approved partner. Call inside db.tx(). */
export function assignPartner(db: Db, shipmentId: number, partnerId: number, actorId: number | null) {
  const shipment = db.get(
    `SELECT s.*, o.number, o.status AS order_status, o.store_id, rr.status AS return_status
       FROM shipments s JOIN orders o ON o.id = s.order_id LEFT JOIN return_requests rr ON rr.id = s.return_id WHERE s.id = ?`,
    [shipmentId],
  );
  if (!shipment) throw notFound("Shipment not found.");
  if (shipment.kind === "return") {
    if (!["approved", "picked_up"].includes(shipment.return_status)) throw conflict("This return pickup is no longer active.");
  } else if (!["ready_for_dispatch", "shipped", "out_for_delivery"].includes(shipment.order_status)) {
    throw conflict("Only orders that are ready for dispatch or in transit can be assigned.");
  }
  const partner = db.get(
    "SELECT dp.status, u.status AS user_status FROM delivery_partners dp JOIN users u ON u.id = dp.user_id WHERE dp.user_id = ?",
    [partnerId],
  );
  if (!partner || partner.status !== "approved" || partner.user_status !== "active") throw badRequest("Choose an approved, active delivery partner.");

  const open = db.get("SELECT * FROM delivery_assignments WHERE shipment_id = ? AND closed_at IS NULL", [shipmentId]);
  let initial: DeliveryStatus = "assigned";
  if (open) {
    if (open.partner_user_id === partnerId) throw conflict("This partner already has the shipment.");
    if (open.status === "delivered") throw conflict("This shipment has already been delivered.");
    // A reassigned parcel that was already collected stays collected.
    if (["picked_up", "in_transit", "out_for_delivery", "attempted"].includes(open.status)) initial = "picked_up";
    db.run("UPDATE delivery_assignments SET status = 'cancelled', closed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [open.id]);
    db.run("INSERT INTO delivery_status_history (assignment_id, from_status, to_status, actor_user_id, reason) VALUES (?, ?, 'cancelled', ?, 'Reassigned')", [
      open.id,
      open.status,
      actorId,
    ]);
    notify(db, open.partner_user_id, { type: "delivery.unassigned", title: `Shipment ${shipment.tracking_number} was reassigned`, link: "/delivery" });
  }
  const id = db.run("INSERT INTO delivery_assignments (shipment_id, partner_user_id, status, assigned_by) VALUES (?, ?, ?, ?)", [
    shipmentId,
    partnerId,
    initial,
    actorId,
  ]).lastId;
  db.run("INSERT INTO delivery_status_history (assignment_id, from_status, to_status, actor_user_id, reason) VALUES (?, NULL, ?, ?, ?)", [
    id,
    initial,
    actorId,
    open ? "Reassigned" : "Assigned",
  ]);
  db.run("UPDATE shipments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [initial, shipmentId]);
  notify(db, partnerId, {
    type: "delivery.assigned",
    title: shipment.kind === "return" ? `New return pickup: ${shipment.tracking_number}` : `New delivery: ${shipment.tracking_number}`,
    body: `Order ${shipment.number}`,
    link: `/delivery/assignments/${id}`,
  });
  audit(db, { actorId, action: "delivery.assigned", entityType: "shipment", entityId: shipmentId, storeId: shipment.store_id, details: { partnerId, reassigned: Boolean(open) } });
  return id;
}

export interface TransitionInput {
  to: DeliveryStatus;
  reason?: string;
  otp?: string;
  recipientName?: string;
  notes?: string;
  /** Where this step happened, e.g. "Ameerpet, Hyderabad". Required for every step after accepting. */
  location?: string;
  /** Stored photo file name (doorstep photo on delivery, item photo on a return pickup). */
  photo?: string;
}

/**
 * A delivery partner moves their own assignment forward. The server owns the
 * workflow: a parcel cannot be delivered before it is picked up, and delivery
 * needs the customer's one-time code when the policy requires it.
 * Returns whether a refund should follow (returned-to-sender prepaid orders).
 */
export function partnerTransition(db: Db, assignmentId: number, partnerId: number, input: TransitionInput) {
  // Check the delivery code first, outside the transaction, so a wrong guess
  // is always counted — otherwise the rollback would erase the attempt.
  let otpOk = false;
  if (input.to === "delivered" && input.otp) {
    const a = db.get("SELECT partner_user_id, otp_hash, otp_attempts, closed_at FROM delivery_assignments WHERE id = ?", [assignmentId]);
    if (!a || a.partner_user_id !== partnerId) throw notFound("Assignment not found.");
    if (a.otp_attempts >= 5) throw forbidden("Too many incorrect codes. Contact support to continue.");
    otpOk = Boolean(a.otp_hash) && sha256(`${assignmentId}:${input.otp}`) === a.otp_hash;
    if (!otpOk) {
      db.run("UPDATE delivery_assignments SET otp_attempts = otp_attempts + 1 WHERE id = ?", [assignmentId]);
      throw badRequest(`That delivery code is incorrect. ${4 - a.otp_attempts} attempt(s) left.`);
    }
  }

  return db.tx(() => {
    const a = db.get(
      `SELECT a.*, s.order_id, s.tracking_number, s.kind, s.return_id, o.number, o.status AS order_status, o.user_id AS customer_id, o.store_id, o.payment_method
         FROM delivery_assignments a JOIN shipments s ON s.id = a.shipment_id JOIN orders o ON o.id = s.order_id
        WHERE a.id = ?`,
      [assignmentId],
    );
    // Partners can only see their own open assignments; anything else looks absent.
    if (!a || a.partner_user_id !== partnerId) throw notFound("Assignment not found.");
    if (a.closed_at) throw conflict("This assignment is closed.");
    const isReturn = a.kind === "return";
    const steps = isReturn ? RETURN_TRANSITIONS : PARTNER_TRANSITIONS;
    const labels = isReturn ? RETURN_STATUS_LABELS : DELIVERY_STATUS_LABELS;
    const from = a.status as DeliveryStatus;
    if (!steps[from].includes(input.to)) {
      throw conflict(`You can't go from "${labels[from]}" to "${labels[input.to]}".`);
    }

    const location = (input.location ?? "").trim().slice(0, 120);
    if (input.to !== "accepted" && location.length < 2) throw badRequest("Enter the location for this step.");

    let refundOrderId: number | null = null;
    const policy = getSetting(db, "delivery");

    if (isReturn) returnPickupStep(db, a, input, policy.requirePhoto);
    else switch (input.to) {
      case "picked_up":
        if (a.order_status !== "ready_for_dispatch") throw conflict("The store hasn't marked this order ready for dispatch yet.");
        transitionOrder(db, a.order_id, "shipped", partnerId, `Picked up by delivery partner. Tracking ${a.tracking_number}.`);
        break;
      case "out_for_delivery": {
        const code = numericCode(6);
        db.run("UPDATE delivery_assignments SET otp_hash = ?, otp_attempts = 0 WHERE id = ?", [sha256(`${assignmentId}:${code}`), assignmentId]);
        if (a.order_status === "shipped") transitionOrder(db, a.order_id, "out_for_delivery", partnerId, "", { notifyCustomer: false });
        notify(db, a.customer_id, {
          type: "order.out_for_delivery",
          title: `Order ${a.number} is out for delivery`,
          body: `Share delivery code ${code} with the delivery partner only when you receive your parcel.`,
          link: `/account/orders/${a.number}`,
        });
        const customer = db.get("SELECT email FROM users WHERE id = ?", [a.customer_id]);
        if (customer) sendEmail(db, customer.email, `Order ${a.number} is out for delivery`, `Your delivery code is ${code}. Share it only when you receive your parcel.`);
        const o = db.get("SELECT ship_phone FROM orders WHERE id = ?", [a.order_id]);
        messageCustomer(db, a.customer_id, o?.ship_phone, "outForDelivery", `Order ${a.number} is out for delivery. Your delivery code is ${code}. Share it only when you receive the parcel.`);
        break;
      }
      case "delivered": {
        const name = (input.recipientName ?? "").trim();
        if (name.length < 2) throw badRequest("Enter the name of the person who received the parcel.");
        if (policy.requireOtp && !otpOk) throw badRequest("Enter the delivery code from the customer.");
        if (policy.requirePhoto && !input.photo) throw badRequest("Take a photo of the parcel at the door to complete the delivery.");
        db.run("INSERT INTO proof_of_delivery (assignment_id, recipient_name, otp_verified, notes, photo_path) VALUES (?, ?, ?, ?, ?)", [
          assignmentId,
          name.slice(0, 80),
          otpOk ? 1 : 0,
          (input.notes ?? "").slice(0, 500),
          input.photo ?? null,
        ]);
        if (a.order_status === "shipped") transitionOrder(db, a.order_id, "out_for_delivery", partnerId, "", { notifyCustomer: false });
        transitionOrder(db, a.order_id, "delivered", partnerId, `Received by ${name}.`);
        if (a.payment_method === "cod") db.run("UPDATE orders SET payment_status = 'cod_collected' WHERE id = ?", [a.order_id]);
        break;
      }
      case "attempted":
      case "failed": {
        const reason = (input.reason ?? "").trim();
        if (reason.length < 3) throw badRequest("Choose or describe the reason.");
        db.run("UPDATE delivery_assignments SET failure_reason = ? WHERE id = ?", [reason.slice(0, 300), assignmentId]);
        if (input.to === "attempted") {
          if (a.order_status === "out_for_delivery") transitionOrder(db, a.order_id, "shipped", partnerId, `Delivery attempted: ${reason}`);
        } else {
          const admins = db.all("SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'platform_admin'").map((r) => r.user_id);
          const staff = db.all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role IN ('owner','order_manager')", [a.store_id]).map((r) => r.user_id);
          notifyMany(db, [...admins, ...staff], { type: "delivery.failed", title: `Delivery failed: ${a.number}`, body: reason, link: `/admin/orders/${a.number}` });
          notify(db, a.customer_id, { type: "delivery.failed", title: `We couldn't deliver ${a.number}`, body: `${reason}. Our team will contact you.`, link: `/account/orders/${a.number}` });
        }
        break;
      }
      case "returned":
        if (a.order_status === "out_for_delivery") transitionOrder(db, a.order_id, "shipped", partnerId, "", { notifyCustomer: false });
        transitionOrder(db, a.order_id, "returned_to_sender", partnerId, "Parcel returned to the store.");
        restockOrder(db, a.order_id, partnerId, "returned_to_sender");
        refundOrderId = a.order_id;
        break;
    }

    // A failed return pickup closes too; the store can arrange a new one.
    const closed = ["delivered", "returned"].includes(input.to) || (isReturn && input.to === "failed");
    db.run(
      `UPDATE delivery_assignments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')${closed ? ", closed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')" : ""} WHERE id = ?`,
      [input.to, assignmentId],
    );
    db.run("UPDATE shipments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [input.to, a.shipment_id]);
    db.run("INSERT INTO delivery_status_history (assignment_id, from_status, to_status, actor_user_id, reason, location, photo) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      assignmentId,
      from,
      input.to,
      partnerId,
      (input.reason ?? "").slice(0, 300),
      location,
      input.photo ?? null,
    ]);
    return { refundOrderId };
  });
}

/**
 * One step of a return pickup (customer → store). Picking up needs a photo of the items as
 * collected; handing over at the store needs the receiver's name. The store still inspects the
 * items and marks the return "received" itself, which is what restocks and leads to the refund.
 */
function returnPickupStep(db: Db, a: Row, input: TransitionInput, requirePhoto: boolean) {
  const staff = db.all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role IN ('owner','order_manager')", [a.store_id]).map((r) => r.user_id);
  const link = `/account/orders/${a.number}`;
  switch (input.to) {
    case "accepted": {
      const partner = db.get("SELECT name FROM users WHERE id = ?", [a.partner_user_id]);
      notify(db, a.customer_id, {
        type: "return.pickup_accepted",
        title: `${String(partner?.name ?? "A delivery partner").split(" ")[0]} will pick up your return`,
        body: `Return for order ${a.number}. Keep the items packed and ready.`,
        link,
      });
      break;
    }
    case "picked_up":
      if (!input.photo) throw badRequest("Take a photo of the items you collected.");
      db.run("UPDATE return_requests SET status = 'picked_up', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status = 'approved'", [a.return_id]);
      notify(db, a.customer_id, { type: "return.picked_up", title: `Your return for ${a.number} was picked up`, body: "It's on its way to the store. Your refund follows once they've checked it.", link });
      notifyMany(db, staff, { type: "store.return_picked_up", title: `Return picked up: ${a.number}`, body: "The partner is bringing it to your store.", link: `/owner/orders/${a.number}` });
      break;
    case "delivered": {
      const name = (input.recipientName ?? "").trim();
      if (name.length < 2) throw badRequest("Enter the name of the store person who received the parcel.");
      if (requirePhoto && !input.photo) throw badRequest("Take a photo of the handover at the store.");
      db.run("INSERT INTO proof_of_delivery (assignment_id, recipient_name, otp_verified, notes, photo_path) VALUES (?, ?, 0, ?, ?)", [
        a.id,
        name.slice(0, 80),
        (input.notes ?? "").slice(0, 500),
        input.photo ?? null,
      ]);
      notifyMany(db, staff, {
        type: "store.return_arrived",
        title: `Returned items arrived: ${a.number}`,
        body: "Check the items, then mark the return received to restock and refund.",
        link: `/owner/orders/${a.number}`,
      });
      notify(db, a.customer_id, { type: "return.at_store", title: `Your return for ${a.number} reached the store`, body: "Your refund starts once the store has checked the items.", link });
      break;
    }
    case "failed": {
      const reason = (input.reason ?? "").trim();
      if (reason.length < 3) throw badRequest("Choose or describe why the pickup couldn't happen.");
      db.run("UPDATE delivery_assignments SET failure_reason = ? WHERE id = ?", [reason.slice(0, 300), a.id]);
      const admins = db.all("SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'platform_admin'").map((r) => r.user_id);
      notifyMany(db, [...staff, ...admins], { type: "return.pickup_failed", title: `Return pickup failed: ${a.number}`, body: `${reason}. Arrange another pickup from the order page.`, link: `/owner/orders/${a.number}` });
      notify(db, a.customer_id, { type: "return.pickup_failed", title: `We couldn't pick up your return for ${a.number}`, body: `${reason}. We'll arrange another pickup.`, link });
      break;
    }
  }
}
