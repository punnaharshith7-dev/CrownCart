import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context.ts";
import type { Db, Row } from "../db.ts";
import { badRequest, conflict, notFound } from "../lib/errors.ts";
import { body } from "../lib/validate.ts";
import { requireUser } from "../lib/auth.ts";
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, transitionOrder, type DeliveryStatus, type OrderStatus } from "../lib/orders.ts";
import { cancelAndRefund } from "../lib/payments.ts";
import { notifyMany } from "../lib/notify.ts";
import { getSetting } from "../lib/settings.ts";
import { rateLimit } from "../lib/rate-limit.ts";

const ACTIVE = ["confirmed", "processing", "ready_for_dispatch", "shipped", "out_for_delivery", "cancellation_requested", "return_requested"];

export function orderSummary(o: Row) {
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    statusLabel: ORDER_STATUS_LABELS[o.status as OrderStatus],
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    totalPaise: o.total_paise,
    placedAt: o.placed_at ?? o.created_at,
    itemCount: o.item_count,
    preview: o.preview,
    storeName: o.store_name,
    customerName: o.customer_name,
  };
}

export const ORDER_LIST_SQL = `
  SELECT o.*, s.name AS store_name, u.name AS customer_name,
         (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS item_count,
         (SELECT image FROM order_items WHERE order_id = o.id LIMIT 1) AS preview
    FROM orders o JOIN stores s ON s.id = o.store_id JOIN users u ON u.id = o.user_id`;

/**
 * Full order view. `audience` controls how much is revealed: customers never
 * see internal notes' actors, partners never use this (they get a minimal view).
 */
export function orderDetail(db: Db, order: Row, audience: "customer" | "store" | "admin") {
  const items = db.all("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
  const history = db.all(
    `SELECT h.from_status, h.to_status, h.note, h.created_at, u.name AS actor
       FROM order_status_history h LEFT JOIN users u ON u.id = h.actor_user_id
      WHERE h.order_id = ? ORDER BY h.id`,
    [order.id],
  );
  const shipments = db.all("SELECT * FROM shipments WHERE order_id = ? ORDER BY id", [order.id]).map((s) => {
    const assignment = db.get(
      "SELECT a.*, u.name AS partner_name, u.phone AS partner_phone FROM delivery_assignments a JOIN users u ON u.id = a.partner_user_id WHERE a.shipment_id = ? ORDER BY a.id DESC LIMIT 1",
      [s.id],
    );
    const events = assignment
      ? db.all("SELECT to_status, reason, created_at FROM delivery_status_history WHERE assignment_id IN (SELECT id FROM delivery_assignments WHERE shipment_id = ?) ORDER BY id", [s.id])
      : [];
    const pod = assignment ? db.get("SELECT recipient_name, otp_verified, delivered_at, notes FROM proof_of_delivery WHERE assignment_id = ?", [assignment.id]) : null;
    return {
      id: s.id,
      kind: s.kind,
      trackingNumber: s.tracking_number,
      carrier: s.carrier,
      status: s.status,
      partner: assignment
        ? {
            name: audience === "customer" ? assignment.partner_name.split(" ")[0] : assignment.partner_name,
            phone: audience === "customer" && !["out_for_delivery", "attempted"].includes(assignment.status) ? null : assignment.partner_phone,
            status: assignment.status,
            statusLabel: DELIVERY_STATUS_LABELS[assignment.status as DeliveryStatus],
            failureReason: assignment.failure_reason,
          }
        : null,
      events: events.map((e) => ({ status: e.to_status, label: DELIVERY_STATUS_LABELS[e.to_status as DeliveryStatus], reason: e.reason, at: e.created_at })),
      proof: pod ? { recipientName: pod.recipient_name, otpVerified: Boolean(pod.otp_verified), deliveredAt: pod.delivered_at, notes: audience === "customer" ? "" : pod.notes } : null,
    };
  });
  const returns = db.all("SELECT * FROM return_requests WHERE order_id = ? ORDER BY id", [order.id]).map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    reason: r.reason,
    details: r.details,
    resolutionNote: r.resolution_note,
    createdAt: r.created_at,
    items: db.all("SELECT order_item_id, quantity FROM return_items WHERE return_id = ?", [r.id]).map((i) => ({ orderItemId: i.order_item_id, quantity: i.quantity })),
  }));
  const refunds = db.all("SELECT id, amount_paise, status, reason, created_at FROM refunds WHERE order_id = ? ORDER BY id", [order.id]).map((r) => ({
    id: r.id,
    amountPaise: r.amount_paise,
    status: r.status,
    reason: r.reason,
    createdAt: r.created_at,
  }));
  const store = db.get("SELECT name, slug FROM stores WHERE id = ?", [order.store_id])!;
  const customer = audience === "customer" ? null : db.get("SELECT name, email FROM users WHERE id = ?", [order.user_id]);

  // Eligibility is computed here so the UI never offers an action the server would refuse.
  const returnDays = Math.min(...items.map((i) => db.get("SELECT return_days FROM products WHERE id = ?", [i.product_id])?.return_days ?? 0));
  const returnDeadline = order.delivered_at ? new Date(Date.parse(order.delivered_at) + returnDays * 86_400_000).toISOString() : null;
  const canReturn =
    getSetting(db, "returns").enabled &&
    order.status === "delivered" &&
    returnDays > 0 &&
    returnDeadline != null &&
    returnDeadline > new Date().toISOString() &&
    items.some((i) => i.quantity > i.returned_qty);

  return {
    ...orderSummary({ ...order, store_name: store.name, item_count: items.reduce((s, i) => s + i.quantity, 0), preview: items[0]?.image }),
    storeId: order.store_id,
    subtotalPaise: order.subtotal_paise,
    discountPaise: order.discount_paise,
    shippingPaise: order.shipping_paise,
    taxPaise: order.tax_paise,
    refundedPaise: order.refunded_paise,
    couponCode: order.coupon_code,
    deliveredAt: order.delivered_at,
    shippingAddress: {
      name: order.ship_name,
      phone: order.ship_phone,
      line1: order.ship_line1,
      line2: order.ship_line2,
      city: order.ship_city,
      state: order.ship_state,
      pincode: order.ship_pincode,
    },
    customer: customer ? { name: customer.name, email: audience === "admin" ? customer.email : customer.email.replace(/^(.).*(@.*)$/, "$1•••$2") } : null,
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id,
      productName: i.product_name,
      variantName: i.variant_name,
      sku: i.sku,
      image: i.image,
      unitPricePaise: i.unit_price_paise,
      quantity: i.quantity,
      returnedQty: i.returned_qty,
      lineTotalPaise: i.line_total_paise,
      productSlug: db.get("SELECT slug FROM products WHERE id = ?", [i.product_id])?.slug,
    })),
    history: history.map((h) => ({
      from: h.from_status,
      to: h.to_status,
      label: ORDER_STATUS_LABELS[h.to_status as OrderStatus] ?? h.to_status,
      note: h.note,
      at: h.created_at,
      actor: audience === "customer" ? null : h.actor,
    })),
    shipments,
    returns,
    refunds,
    taxNote: getSetting(db, "tax").note,
    eligibility: {
      cancel: ["confirmed", "processing"].includes(order.status),
      cancelNeedsApproval: order.status === "processing",
      return: canReturn,
      returnDeadline,
      retryPayment: order.status === "pending_payment" && order.payment_method === "razorpay",
    },
    checkoutId: order.checkout_id,
  };
}

function ownOrder(db: Db, userId: number, number: string) {
  const o = db.get("SELECT * FROM orders WHERE number = ? AND user_id = ?", [number, userId]);
  if (!o) throw notFound("Order not found.");
  return o;
}

export function invoiceHtml(db: Db, o: Row) {
  const items = db.all("SELECT * FROM order_items WHERE order_id = ?", [o.id]);
  const store = db.get("SELECT name, pickup_address FROM stores WHERE id = ?", [o.store_id])!;
  const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const inr = (p: number) => `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const tax = getSetting(db, "tax");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Invoice ${esc(o.number)}</title>
<meta name="robots" content="noindex">
<style>body{font:14px/1.5 system-ui,sans-serif;color:#111;max-width:760px;margin:40px auto;padding:0 20px}h1{font-size:28px;margin:0}
table{width:100%;border-collapse:collapse;margin:24px 0}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}td.r,th.r{text-align:right}
.muted{color:#666}.tot td{border:none}.grand td{font-weight:700;border-top:2px solid #111}@media print{button{display:none}}</style></head><body>
<button onclick="print()">Print / Save as PDF</button>
<h1>CrownCart</h1><p class="muted">Tax invoice / bill of supply · Sold by ${esc(store.name)}${store.pickup_address ? ` · ${esc(store.pickup_address)}` : ""}</p>
<p><b>Order</b> ${esc(o.number)}<br><b>Date</b> ${esc(new Date(o.placed_at ?? o.created_at).toLocaleDateString("en-IN"))}<br>
<b>Payment</b> ${o.payment_method === "cod" ? "Cash on delivery" : "Online"} (${esc(o.payment_status)})</p>
<p><b>Ship to</b><br>${esc(o.ship_name)}<br>${esc(o.ship_line1)}${o.ship_line2 ? "<br>" + esc(o.ship_line2) : ""}<br>${esc(o.ship_city)}, ${esc(o.ship_state)} ${esc(o.ship_pincode)}</p>
<table><thead><tr><th>Item</th><th>SKU</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Amount</th></tr></thead><tbody>
${items.map((i) => `<tr><td>${esc(i.product_name)}<br><span class="muted">${esc(i.variant_name)}</span></td><td>${esc(i.sku)}</td><td class="r">${i.quantity}</td><td class="r">${inr(i.unit_price_paise)}</td><td class="r">${inr(i.line_total_paise)}</td></tr>`).join("")}
</tbody><tbody class="tot">
<tr><td colspan="4" class="r">Subtotal</td><td class="r">${inr(o.subtotal_paise)}</td></tr>
${o.discount_paise ? `<tr><td colspan="4" class="r">Discount${o.coupon_code ? ` (${esc(o.coupon_code)})` : ""}</td><td class="r">−${inr(o.discount_paise)}</td></tr>` : ""}
<tr><td colspan="4" class="r">Shipping</td><td class="r">${o.shipping_paise ? inr(o.shipping_paise) : "Free"}</td></tr>
<tr class="grand"><td colspan="4" class="r">Total</td><td class="r">${inr(o.total_paise)}</td></tr>
${o.refunded_paise ? `<tr><td colspan="4" class="r">Refunded</td><td class="r">−${inr(o.refunded_paise)}</td></tr>` : ""}
</tbody></table><p class="muted">${esc(tax.note)} GSTIN and HSN details are added once the seller's tax registration is configured.</p></body></html>`;
}

export const orderRoutes = new Hono<AppEnv>()
  .get("/", (c) => {
    const u = requireUser(c);
    const status = c.req.query("status");
    const db = c.get("db");
    const filter =
      status === "active" ? `AND o.status IN (${ACTIVE.map(() => "?").join(",")})`
      : status === "delivered" ? "AND o.status = 'delivered'"
      : status === "cancelled" ? "AND o.status IN ('cancelled','failed','expired')"
      : status === "returns" ? "AND o.status IN ('return_requested','returned')"
      : "";
    const rows = db.all(`${ORDER_LIST_SQL} WHERE o.user_id = ? ${filter} ORDER BY o.created_at DESC LIMIT 200`, [u.id, ...(status === "active" ? ACTIVE : [])]);
    return c.json({ orders: rows.map(orderSummary) });
  })

  .get("/:number", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    return c.json({ order: orderDetail(db, ownOrder(db, u.id, c.req.param("number")), "customer") });
  })

  .get("/:number/invoice", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const o = ownOrder(db, u.id, c.req.param("number"));
    if (["pending_payment", "failed", "expired"].includes(o.status)) throw conflict("An invoice is available once the order is confirmed.");
    c.header("Cache-Control", "private, no-store");
    return c.html(invoiceHtml(db, o));
  })

  .post("/:number/cancel", async (c) => {
    const u = requireUser(c);
    rateLimit(`cancel:${u.id}`, 10, 600_000);
    const { reason } = await body(c, z.object({ reason: z.string().trim().min(3, "Tell us why you're cancelling.").max(300) }));
    const db = c.get("db");
    const o = ownOrder(db, u.id, c.req.param("number"));
    if (o.status === "confirmed") {
      await cancelAndRefund(db, o.id, u.id, `Cancelled by customer: ${reason}`);
    } else if (o.status === "processing") {
      db.tx(() => {
        transitionOrder(db, o.id, "cancellation_requested", u.id, `Customer asked to cancel: ${reason}`);
        const staff = db.all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role IN ('owner','order_manager')", [o.store_id]).map((r) => r.user_id);
        notifyMany(db, staff, { type: "store.cancellation_requested", title: `Cancellation requested for ${o.number}`, body: reason, link: `/owner/orders/${o.number}` });
      });
    } else {
      throw conflict("This order can no longer be cancelled. You can request a return after delivery.");
    }
    return c.json({ order: orderDetail(db, db.get("SELECT * FROM orders WHERE id = ?", [o.id])!, "customer") });
  })

  .post("/:number/returns", async (c) => {
    const u = requireUser(c);
    const input = await body(
      c,
      z.object({
        kind: z.enum(["return", "exchange"]).default("return"),
        reason: z.enum(["Damaged or defective", "Wrong item received", "Not as described", "Size or fit issue", "Changed my mind", "Other"]),
        details: z.string().trim().max(1000).default(""),
        items: z.array(z.object({ orderItemId: z.number().int().positive(), quantity: z.number().int().min(1) })).min(1),
      }),
    );
    const db = c.get("db");
    const o = ownOrder(db, u.id, c.req.param("number"));
    const detail = orderDetail(db, o, "customer");
    if (!detail.eligibility.return) throw conflict("This order is not eligible for a return.");
    db.tx(() => {
      for (const it of input.items) {
        const item = db.get("SELECT * FROM order_items WHERE id = ? AND order_id = ?", [it.orderItemId, o.id]);
        if (!item) throw badRequest("One of the items is not part of this order.");
        if (it.quantity > item.quantity - item.returned_qty) throw badRequest(`You can return at most ${item.quantity - item.returned_qty} of ${item.product_name}.`);
      }
      const returnId = db.run("INSERT INTO return_requests (order_id, user_id, kind, reason, details) VALUES (?, ?, ?, ?, ?)", [
        o.id,
        u.id,
        input.kind,
        input.reason,
        input.details,
      ]).lastId;
      for (const it of input.items) db.run("INSERT INTO return_items (return_id, order_item_id, quantity) VALUES (?, ?, ?)", [returnId, it.orderItemId, it.quantity]);
      transitionOrder(db, o.id, "return_requested", u.id, `${input.kind === "exchange" ? "Exchange" : "Return"} requested: ${input.reason}`);
      const staff = db.all("SELECT user_id FROM store_members WHERE store_id = ? AND member_role IN ('owner','order_manager')", [o.store_id]).map((r) => r.user_id);
      notifyMany(db, staff, { type: "store.return_requested", title: `Return requested for ${o.number}`, body: input.reason, link: `/owner/orders/${o.number}` });
    });
    return c.json({ order: orderDetail(db, db.get("SELECT * FROM orders WHERE id = ?", [o.id])!, "customer") }, 201);
  });
