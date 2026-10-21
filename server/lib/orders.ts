import type { Db, Row } from "../db.ts";
import { conflict } from "./errors.ts";
import { notify } from "./notify.ts";

// ───────────────────────────── Order lifecycle ─────────────────────────────

export const ORDER_STATUSES = [
  "pending_payment",
  "confirmed",
  "processing",
  "ready_for_dispatch",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancellation_requested",
  "cancelled",
  "return_requested",
  "returned",
  "returned_to_sender",
  "failed",
  "expired",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["confirmed", "failed", "expired", "cancelled"],
  confirmed: ["processing", "cancelled", "cancellation_requested"],
  processing: ["ready_for_dispatch", "cancelled", "cancellation_requested"],
  cancellation_requested: ["cancelled", "processing", "confirmed"],
  ready_for_dispatch: ["shipped", "cancelled", "processing"],
  shipped: ["out_for_delivery", "returned_to_sender"],
  out_for_delivery: ["delivered", "shipped", "returned_to_sender"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  returned: [],
  returned_to_sender: [],
  cancelled: [],
  failed: [],
  expired: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_dispatch: "Ready for dispatch",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancellation_requested: "Cancellation requested",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  returned: "Returned",
  returned_to_sender: "Returned to sender",
  failed: "Payment failed",
  expired: "Expired",
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * The only way an order's status changes. Validates the transition, records
 * history, and tells the customer. Must be called inside db.tx().
 */
export function transitionOrder(
  db: Db,
  orderId: number,
  to: OrderStatus,
  actorId: number | null,
  note = "",
  opts: { notifyCustomer?: boolean } = {},
): Row {
  const order = db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!order) throw conflict("Order not found.");
  const from = order.status as OrderStatus;
  if (!canTransition(from, to)) {
    throw conflict(`An order that is "${ORDER_STATUS_LABELS[from]}" cannot become "${ORDER_STATUS_LABELS[to]}".`);
  }
  const extra = to === "delivered" ? ", delivered_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')" : "";
  db.run(`UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')${extra} WHERE id = ?`, [to, orderId]);
  db.run("INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note) VALUES (?, ?, ?, ?, ?)", [
    orderId,
    from,
    to,
    actorId,
    note,
  ]);

  // Stock returns to sale when an order is cancelled before it leaves the store.
  if (to === "cancelled" && from !== "pending_payment") restockOrder(db, orderId, actorId, "order_cancelled");

  if (opts.notifyCustomer !== false && to !== "pending_payment") {
    notify(db, order.user_id, {
      type: `order.${to}`,
      title: `Order ${order.number}: ${ORDER_STATUS_LABELS[to]}`,
      body: note,
      link: `/account/orders/${order.number}`,
    });
  }
  return { ...order, status: to };
}

// ──────────────────────────────── Inventory ────────────────────────────────

/** Reserves stock for a pending order line. Throws if not enough is free. */
export function reserveStock(db: Db, variantId: number, qty: number, refId: string, actorId: number | null) {
  const r = db.run(
    "UPDATE inventory SET reserved = reserved + ? WHERE variant_id = ? AND on_hand - reserved >= ?",
    [qty, variantId, qty],
  );
  if (r.changes !== 1) throw conflict("Some items in your cart just sold out. Please review your cart.");
  db.run(
    "INSERT INTO inventory_movements (variant_id, delta_reserved, reason, ref_type, ref_id, actor_user_id) VALUES (?, ?, 'reserve', 'order', ?, ?)",
    [variantId, qty, refId, actorId],
  );
}

/** Converts a reservation into a sale once the order is confirmed. */
export function commitReservedStock(db: Db, orderId: number, actorId: number | null) {
  for (const item of db.all("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [orderId])) {
    db.run("UPDATE inventory SET on_hand = on_hand - ?, reserved = reserved - ? WHERE variant_id = ?", [
      item.quantity,
      item.quantity,
      item.variant_id,
    ]);
    db.run(
      "INSERT INTO inventory_movements (variant_id, delta_on_hand, delta_reserved, reason, ref_type, ref_id, actor_user_id) VALUES (?, ?, ?, 'sale', 'order', ?, ?)",
      [item.variant_id, -item.quantity, -item.quantity, String(orderId), actorId],
    );
  }
}

/** Frees a reservation for an order that will never be paid. */
export function releaseReservedStock(db: Db, orderId: number, actorId: number | null, reason: string) {
  for (const item of db.all("SELECT variant_id, quantity FROM order_items WHERE order_id = ?", [orderId])) {
    db.run("UPDATE inventory SET reserved = MAX(0, reserved - ?) WHERE variant_id = ?", [item.quantity, item.variant_id]);
    db.run(
      "INSERT INTO inventory_movements (variant_id, delta_reserved, reason, ref_type, ref_id, actor_user_id) VALUES (?, ?, ?, 'order', ?, ?)",
      [item.variant_id, -item.quantity, reason, String(orderId), actorId],
    );
  }
}

export function restockOrder(db: Db, orderId: number, actorId: number | null, reason: string) {
  for (const item of db.all("SELECT variant_id, quantity, returned_qty FROM order_items WHERE order_id = ?", [orderId])) {
    const qty = item.quantity - item.returned_qty;
    if (qty <= 0) continue;
    restockVariant(db, item.variant_id, qty, reason, String(orderId), actorId);
  }
}

export function restockVariant(db: Db, variantId: number, qty: number, reason: string, refId: string, actorId: number | null) {
  db.run("UPDATE inventory SET on_hand = on_hand + ? WHERE variant_id = ?", [qty, variantId]);
  db.run(
    "INSERT INTO inventory_movements (variant_id, delta_on_hand, reason, ref_type, ref_id, actor_user_id) VALUES (?, ?, ?, 'order', ?, ?)",
    [variantId, qty, reason, refId, actorId],
  );
}

/** Releases reservations for online-payment checkouts that were never paid. */
export function expireStaleCheckouts(db: Db) {
  const stale = db.all(
    "SELECT id FROM checkouts WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')",
  );
  for (const c of stale) {
    db.tx(() => {
      const fresh = db.get("SELECT status FROM checkouts WHERE id = ?", [c.id]);
      if (fresh?.status !== "pending") return;
      db.run("UPDATE checkouts SET status = 'expired' WHERE id = ?", [c.id]);
      for (const o of db.all("SELECT id FROM orders WHERE checkout_id = ? AND status = 'pending_payment'", [c.id])) {
        releaseReservedStock(db, o.id, null, "checkout_expired");
        transitionOrder(db, o.id, "expired", null, "Payment was not completed in time.", { notifyCustomer: false });
      }
      db.run("DELETE FROM coupon_redemptions WHERE checkout_id = ?", [c.id]);
    });
  }
  return stale.length;
}

// ───────────────────────────── Delivery lifecycle ─────────────────────────────

export const DELIVERY_STATUSES = [
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "attempted",
  "delivered",
  "failed",
  "returned",
  "cancelled",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/** Transitions a delivery partner may make themselves. */
export const PARTNER_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  assigned: ["accepted"],
  accepted: ["picked_up"],
  picked_up: ["in_transit", "out_for_delivery"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivered", "attempted"],
  attempted: ["out_for_delivery", "failed"],
  failed: ["returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  picked_up: "Picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  attempted: "Delivery attempted",
  delivered: "Delivered",
  failed: "Delivery failed",
  returned: "Returned to sender",
  cancelled: "Assignment cancelled",
};

export const FAILURE_REASONS = [
  "Customer unavailable",
  "Address issue",
  "Recipient refused delivery",
  "Unable to reach customer by phone",
  "Area inaccessible",
  "Other",
];

export function generateOrderNumber(db: Db): string {
  for (;;) {
    const n = `CC${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${Math.floor(100000 + Math.random() * 900000)}`;
    if (!db.get("SELECT 1 FROM orders WHERE number = ?", [n])) return n;
  }
}

export function generateTrackingNumber(db: Db): string {
  for (;;) {
    const n = `CCX${Math.floor(1e9 + Math.random() * 9e9)}`;
    if (!db.get("SELECT 1 FROM shipments WHERE tracking_number = ?", [n])) return n;
  }
}
