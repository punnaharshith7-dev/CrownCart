import type { Db, Row } from "../db.ts";
import { badRequest, conflict, forbidden, notFound } from "./errors.ts";
import { numericCode, sha256 } from "./crypto.ts";
import {
  DELIVERY_STATUS_LABELS,
  PARTNER_TRANSITIONS,
  generateTrackingNumber,
  restockOrder,
  transitionOrder,
  type DeliveryStatus,
} from "./orders.ts";
import { notify, notifyMany, sendEmail } from "./notify.ts";
import { getSetting } from "./settings.ts";
import { audit } from "./audit.ts";

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
    `SELECT u.id, u.name, dp.availability, dp.service_pincodes,
            (SELECT COUNT(*) FROM delivery_assignments a WHERE a.partner_user_id = u.id AND a.closed_at IS NULL) AS open_assignments
       FROM delivery_partners dp JOIN users u ON u.id = dp.user_id
      WHERE dp.status = 'approved' AND u.status = 'active' ORDER BY dp.availability = 'available' DESC, open_assignments, u.name`,
  );
}

/** Assigns (or reassigns) a shipment to an approved partner. Call inside db.tx(). */
export function assignPartner(db: Db, shipmentId: number, partnerId: number, actorId: number) {
  const shipment = db.get(
    "SELECT s.*, o.number, o.status AS order_status, o.store_id FROM shipments s JOIN orders o ON o.id = s.order_id WHERE s.id = ?",
    [shipmentId],
  );
  if (!shipment) throw notFound("Shipment not found.");
  if (!["ready_for_dispatch", "shipped", "out_for_delivery"].includes(shipment.order_status)) {
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
    title: `New delivery: ${shipment.tracking_number}`,
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
      `SELECT a.*, s.order_id, s.tracking_number, o.number, o.status AS order_status, o.user_id AS customer_id, o.store_id, o.payment_method
         FROM delivery_assignments a JOIN shipments s ON s.id = a.shipment_id JOIN orders o ON o.id = s.order_id
        WHERE a.id = ?`,
      [assignmentId],
    );
    // Partners can only see their own open assignments; anything else looks absent.
    if (!a || a.partner_user_id !== partnerId) throw notFound("Assignment not found.");
    if (a.closed_at) throw conflict("This assignment is closed.");
    const from = a.status as DeliveryStatus;
    if (!PARTNER_TRANSITIONS[from].includes(input.to)) {
      throw conflict(`You can't go from "${DELIVERY_STATUS_LABELS[from]}" to "${DELIVERY_STATUS_LABELS[input.to]}".`);
    }

    let refundOrderId: number | null = null;
    const policy = getSetting(db, "delivery");

    switch (input.to) {
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
        break;
      }
      case "delivered": {
        const name = (input.recipientName ?? "").trim();
        if (name.length < 2) throw badRequest("Enter the name of the person who received the parcel.");
        if (policy.requireOtp && !otpOk) throw badRequest("Enter the delivery code from the customer.");
        db.run("INSERT INTO proof_of_delivery (assignment_id, recipient_name, otp_verified, notes) VALUES (?, ?, ?, ?)", [
          assignmentId,
          name.slice(0, 80),
          otpOk ? 1 : 0,
          (input.notes ?? "").slice(0, 500),
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

    const closed = ["delivered", "returned"].includes(input.to);
    db.run(
      `UPDATE delivery_assignments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')${closed ? ", closed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')" : ""} WHERE id = ?`,
      [input.to, assignmentId],
    );
    db.run("UPDATE shipments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [input.to, a.shipment_id]);
    db.run("INSERT INTO delivery_status_history (assignment_id, from_status, to_status, actor_user_id, reason) VALUES (?, ?, ?, ?, ?)", [
      assignmentId,
      from,
      input.to,
      partnerId,
      (input.reason ?? "").slice(0, 300),
    ]);
    return { refundOrderId };
  });
}
