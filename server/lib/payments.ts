import type { Db } from "../db.ts";
import { config, integrations } from "../config.ts";
import { hmacSha256, safeEqualHex } from "./crypto.ts";
import { conflict, unavailable } from "./errors.ts";
import { commitReservedStock, releaseReservedStock, transitionOrder } from "./orders.ts";
import { notify, notifyMany, sendEmail } from "./notify.ts";
import { audit } from "./audit.ts";
import { messageCustomer } from "./messaging.ts";

// ───────────────────────────── Razorpay client ─────────────────────────────

async function razorpay<T>(method: string, path: string, payload?: unknown): Promise<T> {
  if (!integrations().razorpay) throw unavailable("Online payments are not configured on this server.");
  const auth = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(`Razorpay ${path} failed (${res.status}): ${data?.error?.description ?? "unknown error"}`);
  return data as T;
}

export const createRazorpayOrder = (amountPaise: number, receipt: string) =>
  razorpay<{ id: string; amount: number; currency: string; status: string }>("POST", "/orders", {
    amount: amountPaise,
    currency: "INR",
    receipt,
    payment_capture: 1,
  });

export const fetchRazorpayPayment = (paymentId: string) =>
  razorpay<{ id: string; order_id: string; amount: number; status: string; method: string }>("GET", `/payments/${paymentId}`);

export const createRazorpayRefund = (paymentId: string, amountPaise: number, notes: Record<string, string>) =>
  razorpay<{ id: string; status: string }>("POST", `/payments/${paymentId}/refund`, { amount: amountPaise, notes });

/** Checkout-handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!config.razorpay.keySecret) return false;
  return safeEqualHex(hmacSha256(config.razorpay.keySecret, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!config.razorpay.webhookSecret) return false;
  return safeEqualHex(hmacSha256(config.razorpay.webhookSecret, rawBody), signature);
}

// ─────────────────────────── Checkout confirmation ───────────────────────────

function storeStaff(db: Db, storeId: number): number[] {
  return db
    .all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role IN ('owner','order_manager')", [storeId])
    .map((r) => r.user_id);
}

/**
 * Marks a checkout's orders as confirmed. Idempotent: a second call for the
 * same checkout (duplicate webhook, verify + webhook race) changes nothing.
 * Must run inside db.tx().
 */
export function confirmCheckout(db: Db, checkoutId: number, how: { paymentId?: number; cod?: boolean; prepaidByCredit?: boolean }) {
  const checkout = db.get("SELECT * FROM checkouts WHERE id = ?", [checkoutId]);
  if (!checkout) throw conflict("Checkout not found.");
  if (checkout.status === "paid" || checkout.status === "cod") return false;
  if (checkout.status !== "pending") throw conflict(`Checkout is ${checkout.status}.`);

  // Fully paid with points/gift card: stored on the cod rail but settled as paid.
  if (how.prepaidByCredit) how = { cod: false };
  db.run("UPDATE checkouts SET status = ? WHERE id = ?", [how.cod ? "cod" : "paid", checkoutId]);
  const orders = db.all("SELECT * FROM orders WHERE checkout_id = ?", [checkoutId]);
  const user = db.get("SELECT email, name FROM users WHERE id = ?", [checkout.user_id])!;
  for (const o of orders) {
    commitReservedStock(db, o.id, null);
    db.run(
      "UPDATE orders SET payment_status = ?, placed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
      [how.cod ? "cod_pending" : "paid", o.id],
    );
    transitionOrder(db, o.id, "confirmed", null, how.cod ? "Order placed — pay on delivery." : "Payment received.", { notifyCustomer: false });
    notifyMany(db, storeStaff(db, o.store_id), {
      type: "store.new_order",
      title: `New order ${o.number}`,
      body: `₹${(o.total_paise / 100).toLocaleString("en-IN")} · ${how.cod ? "Cash on delivery" : "Paid online"}`,
      link: `/owner/orders/${o.number}`,
    });
  }
  // Purchased items leave the bag; anything added since stays.
  db.run(
    `DELETE FROM cart_items WHERE user_id = ? AND saved_for_later = 0 AND variant_id IN
       (SELECT oi.variant_id FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.checkout_id = ?)`,
    [checkout.user_id, checkoutId],
  );
  const numbers = orders.map((o) => o.number).join(", ");
  messageCustomer(db, checkout.user_id, orders[0].ship_phone, "orderPlaced", `Order ${numbers} is confirmed. Track it at ${config.publicUrl}/account/orders/${orders[0].number}`);
  notify(db, checkout.user_id, {
    type: "order.placed",
    title: orders.length > 1 ? `Orders ${numbers} placed` : `Order ${numbers} placed`,
    body: how.cod ? "Pay when your order arrives." : "Payment received. We'll let you know when it ships.",
    link: `/account/orders/${orders[0].number}`,
  });
  sendEmail(
    db,
    user.email,
    `Your CrownCart order ${numbers}`,
    `Hi ${user.name},\n\nThank you for your order (${numbers}).\nTotal: ₹${(checkout.total_paise / 100).toLocaleString("en-IN")}\nPayment: ${how.cod ? "Cash on delivery" : "Paid online"}\n\nTrack it any time at ${config.publicUrl}/account/orders/${orders[0].number}`,
  );
  db.run("INSERT INTO analytics_events (name, user_id, props) VALUES ('purchase', ?, ?)", [
    checkout.user_id,
    JSON.stringify({ checkoutId, total: checkout.total_paise, method: how.cod ? "cod" : "razorpay" }),
  ]);
  return true;
}

/** Records a failed online payment and releases the reserved stock. Idempotent. */
export function failCheckout(db: Db, checkoutId: number, reason: string) {
  const checkout = db.get("SELECT * FROM checkouts WHERE id = ?", [checkoutId]);
  if (!checkout || checkout.status !== "pending") return false;
  db.run("UPDATE checkouts SET status = 'failed' WHERE id = ?", [checkoutId]);
  for (const o of db.all("SELECT id FROM orders WHERE checkout_id = ? AND status = 'pending_payment'", [checkoutId])) {
    releaseReservedStock(db, o.id, null, "payment_failed");
    db.run("UPDATE orders SET payment_status = 'failed' WHERE id = ?", [o.id]);
    transitionOrder(db, o.id, "failed", null, reason, { notifyCustomer: false });
  }
  db.run("DELETE FROM coupon_redemptions WHERE checkout_id = ?", [checkoutId]);
  notify(db, checkout.user_id, {
    type: "payment.failed",
    title: "Payment was not completed",
    body: `${reason} Your bag has been kept so you can try again.`,
    link: "/cart",
  });
  return true;
}

// ─────────────────────────────────── Refunds ───────────────────────────────────

/**
 * Starts a refund for an order. Online payments are refunded through
 * Razorpay; the refund is only marked processed once Razorpay confirms it.
 * Cash-on-delivery orders get a 'manual' refund that finance settles offline.
 * Call outside a transaction (it may contact Razorpay).
 */
export async function startRefund(db: Db, orderId: number, amountPaise: number, reason: string, actorId: number | null, returnId?: number) {
  const plan = db.tx(() => {
    const o = db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
    if (!o) throw conflict("Order not found.");
    const pendingOrDone = db.get<{ n: number }>(
      "SELECT COALESCE(SUM(amount_paise),0) n FROM refunds WHERE order_id = ? AND status IN ('pending','processed','manual')",
      [orderId],
    )!.n;
    const refundable = o.total_paise - pendingOrDone;
    if (amountPaise > refundable) throw conflict(`At most ₹${(refundable / 100).toLocaleString("en-IN")} can be refunded on this order.`);
    const paidOnline = o.payment_method === "razorpay" && ["paid", "refund_pending", "partially_refunded"].includes(o.payment_status);
    const codCollected = o.payment_method === "cod" && o.payment_status === "cod_collected";
    if (!paidOnline && !codCollected) return null; // nothing was collected, nothing to refund
    const payment = paidOnline
      ? db.get("SELECT * FROM payments WHERE checkout_id = ? AND status IN ('captured','partially_refunded')", [o.checkout_id])
      : null;
    const refundId = db.run(
      "INSERT INTO refunds (order_id, payment_id, return_id, amount_paise, status, reason, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [orderId, payment?.id ?? null, returnId ?? null, amountPaise, paidOnline ? "pending" : "manual", reason, actorId],
    ).lastId;
    db.run("UPDATE orders SET payment_status = 'refund_pending', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [orderId]);
    audit(db, { actorId, action: "refund.created", entityType: "order", entityId: orderId, storeId: o.store_id, details: { amountPaise, reason, refundId } });
    notify(db, o.user_id, {
      type: "refund.started",
      title: `Refund started for ${o.number}`,
      body: paidOnline
        ? `₹${(amountPaise / 100).toLocaleString("en-IN")} will be returned to your original payment method.`
        : `₹${(amountPaise / 100).toLocaleString("en-IN")} will be refunded by our team. We'll contact you for bank details.`,
      link: `/account/orders/${o.number}`,
    });
    return { refundId, paymentProviderId: payment?.provider_payment_id as string | undefined, orderNumber: o.number };
  });
  if (!plan || !plan.paymentProviderId) return plan;
  try {
    const r = await createRazorpayRefund(plan.paymentProviderId, amountPaise, { order: plan.orderNumber, refund: String(plan.refundId) });
    db.run("UPDATE refunds SET provider_refund_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [r.id, plan.refundId]);
    if (r.status === "processed") markRefundProcessed(db, plan.refundId);
  } catch (err) {
    db.run("UPDATE refunds SET status = 'failed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [plan.refundId]);
    audit(db, { actorId, action: "refund.failed", entityType: "refund", entityId: plan.refundId, details: { error: String(err) } });
    throw conflict("The payment provider rejected the refund. It has been marked failed for review.");
  }
  return plan;
}

/** Idempotent. Updates the order's payment status from the sum of processed refunds. */
export function markRefundProcessed(db: Db, refundId: number) {
  db.tx(() => {
    const r = db.get("SELECT * FROM refunds WHERE id = ?", [refundId]);
    if (!r || r.status === "processed") return;
    db.run("UPDATE refunds SET status = 'processed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [refundId]);
    syncRefundedTotal(db, r.order_id);
  });
}

export function syncRefundedTotal(db: Db, orderId: number) {
  const o = db.get("SELECT * FROM orders WHERE id = ?", [orderId])!;
  const done = db.get<{ n: number }>("SELECT COALESCE(SUM(amount_paise),0) n FROM refunds WHERE order_id = ? AND status IN ('processed','manual')", [orderId])!.n;
  const pending = db.get<{ n: number }>("SELECT COUNT(*) n FROM refunds WHERE order_id = ? AND status = 'pending'", [orderId])!.n;
  const status = pending ? "refund_pending" : done >= o.total_paise ? "refunded" : done > 0 ? "partially_refunded" : o.payment_status;
  db.run("UPDATE orders SET refunded_paise = ?, payment_status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [done, status, orderId]);
  if (!pending && done > 0) {
    notify(db, o.user_id, {
      type: "refund.processed",
      title: `Refund processed for ${o.number}`,
      body: `₹${(done / 100).toLocaleString("en-IN")} refunded in total.`,
      link: `/account/orders/${o.number}`,
    });
  }
}

/** Cancels an order and refunds whatever was collected. */
export async function cancelAndRefund(db: Db, orderId: number, actorId: number | null, note: string) {
  db.tx(() => transitionOrder(db, orderId, "cancelled", actorId, note));
  const o = db.get("SELECT total_paise, refunded_paise FROM orders WHERE id = ?", [orderId])!;
  const owed = o.total_paise - o.refunded_paise;
  if (owed > 0) await startRefund(db, orderId, owed, `Order cancelled: ${note}`, actorId);
}
