import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context.ts";
import type { Db } from "../db.ts";
import { config, integrations } from "../config.ts";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.ts";
import { body, id } from "../lib/validate.ts";
import { requireUser } from "../lib/auth.ts";
import { summarizeCart } from "../lib/pricing.ts";
import { getSetting } from "../lib/settings.ts";
import { generateOrderNumber, reserveStock } from "../lib/orders.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { audit } from "../lib/audit.ts";
import {
  confirmCheckout,
  createRazorpayOrder,
  failCheckout,
  fetchRazorpayPayment,
  markRefundProcessed,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "../lib/payments.ts";

export function isServiceable(db: Db, pincode: string) {
  const prefixes = getSetting(db, "shipping").serviceablePincodePrefixes;
  return prefixes.length === 0 || prefixes.some((p) => pincode.startsWith(p));
}

function paymentOptions(db: Db, totalPaise: number) {
  const cod = getSetting(db, "cod");
  return [
    {
      method: "razorpay",
      label: "Pay online — UPI, cards, net banking, wallets",
      available: integrations().razorpay,
      reason: integrations().razorpay ? null : "Online payments are not configured on this store yet.",
    },
    {
      method: "cod",
      label: "Cash on delivery",
      available: cod.enabled && totalPaise <= cod.maxOrderPaise,
      reason: !cod.enabled
        ? "Cash on delivery is currently unavailable."
        : totalPaise > cod.maxOrderPaise
          ? `Cash on delivery is available for orders up to ₹${(cod.maxOrderPaise / 100).toLocaleString("en-IN")}.`
          : null,
    },
  ];
}

async function attachRazorpayOrder(db: Db, checkoutId: number) {
  const checkout = db.get("SELECT * FROM checkouts WHERE id = ?", [checkoutId])!;
  const user = db.get("SELECT name, email, phone FROM users WHERE id = ?", [checkout.user_id])!;
  let payment = db.get("SELECT * FROM payments WHERE checkout_id = ? AND status = 'created' ORDER BY id DESC LIMIT 1", [checkoutId]);
  if (!payment) {
    try {
      const rp = await createRazorpayOrder(checkout.total_paise, `checkout_${checkoutId}`);
      db.run("INSERT INTO payments (checkout_id, provider, provider_order_id, amount_paise) VALUES (?, 'razorpay', ?, ?)", [
        checkoutId,
        rp.id,
        checkout.total_paise,
      ]);
      payment = db.get("SELECT * FROM payments WHERE provider_order_id = ?", [rp.id]);
    } catch (err) {
      db.tx(() => failCheckout(db, checkoutId, "We couldn't reach the payment provider."));
      console.error("[razorpay] order creation failed", err);
      throw conflict("We couldn't start the payment. No money was taken — please try again.");
    }
  }
  return {
    keyId: config.razorpay.keyId,
    orderId: payment!.provider_order_id,
    amount: checkout.total_paise,
    currency: "INR",
    name: "CrownCart",
    prefill: { name: user.name, email: user.email, contact: user.phone ?? "" },
  };
}

export const checkoutRoutes = new Hono<AppEnv>()
  .get("/options", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const summary = summarizeCart(db, u.id, c.req.query("coupon") || null);
    const addresses = db.all("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC", [u.id]).map((a) => ({
      id: a.id,
      label: a.label,
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: Boolean(a.is_default),
      serviceable: isServiceable(db, a.pincode),
    }));
    const shipping = getSetting(db, "shipping");
    return c.json({
      summary,
      addresses,
      payments: paymentOptions(db, summary.totalPaise),
      delivery: { estimateDaysMin: shipping.estimateDaysMin, estimateDaysMax: shipping.estimateDaysMax },
      requireVerifiedEmail: getSetting(db, "checkout").requireVerifiedEmail && !u.emailVerified,
    });
  })

  .post("/serviceability", async (c) => {
    const { pincode } = await body(c, z.object({ pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code.") }));
    const db = c.get("db");
    const s = getSetting(db, "shipping");
    const ok = isServiceable(db, pincode);
    return c.json({ serviceable: ok, estimateDaysMin: s.estimateDaysMin, estimateDaysMax: s.estimateDaysMax });
  })

  .post("/place", async (c) => {
    const u = requireUser(c);
    rateLimit(`checkout:${u.id}`, 10, 600_000);
    const input = await body(
      c,
      z.object({
        addressId: id,
        paymentMethod: z.enum(["cod", "razorpay"]),
        couponCode: z.string().trim().max(40).optional().nullable(),
        idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
        expectedTotalPaise: z.number().int().nonnegative(),
      }),
    );
    const db = c.get("db");
    if (getSetting(db, "maintenance").enabled) throw conflict("Checkout is paused for maintenance. Your bag is saved.");
    if (getSetting(db, "checkout").requireVerifiedEmail && !u.emailVerified) {
      throw forbidden("Please verify your email address before placing an order.");
    }

    const result = db.tx(() => {
      // Retried submissions return the original checkout instead of creating another.
      const prior = db.get("SELECT * FROM checkouts WHERE user_id = ? AND idempotency_key = ?", [u.id, input.idempotencyKey]);
      if (prior) return { checkoutId: prior.id as number, duplicate: true };

      const summary = summarizeCart(db, u.id, input.couponCode);
      if (summary.lines.length === 0) throw conflict("Your bag is empty.");
      if (summary.checkoutBlocked) {
        throw conflict("Some items in your bag need attention before checkout.", { issues: summary.lines.filter((l) => l.issue).map((l) => ({ itemId: l.itemId, issue: l.issue })) });
      }
      if (input.couponCode && !summary.coupon) throw conflict(summary.couponError ?? "This coupon cannot be applied.");
      if (summary.totalPaise !== input.expectedTotalPaise) {
        throw conflict("Prices or availability changed since you reviewed your order. Please check the updated total.", { reason: "total_changed", totalPaise: summary.totalPaise });
      }
      const option = paymentOptions(db, summary.totalPaise).find((p) => p.method === input.paymentMethod)!;
      if (!option.available) throw conflict(option.reason ?? "That payment method is unavailable.");

      const addr = db.get("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [input.addressId, u.id]);
      if (!addr) throw notFound("Address not found.");
      if (!isServiceable(db, addr.pincode)) throw conflict(`We don't deliver to ${addr.pincode} yet.`);

      const payWindow = getSetting(db, "checkout").paymentWindowMinutes;
      const checkoutId = db.run(
        "INSERT INTO checkouts (user_id, idempotency_key, payment_method, total_paise, expires_at) VALUES (?, ?, ?, ?, ?)",
        [u.id, input.idempotencyKey, input.paymentMethod, summary.totalPaise, input.paymentMethod === "razorpay" ? new Date(Date.now() + payWindow * 60_000).toISOString() : null],
      ).lastId;

      for (const g of summary.groups) {
        const number = generateOrderNumber(db);
        const orderId = db.run(
          `INSERT INTO orders (number, checkout_id, user_id, store_id, status, payment_method, payment_status, subtotal_paise, discount_paise,
                               shipping_paise, tax_paise, total_paise, coupon_code, ship_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode)
           VALUES (?, ?, ?, ?, 'pending_payment', ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            number, checkoutId, u.id, g.storeId, input.paymentMethod, g.subtotalPaise, g.discountPaise, g.shippingPaise, g.taxPaise, g.totalPaise,
            g.discountPaise ? summary.coupon?.code ?? null : null, addr.name, addr.phone, addr.line1, addr.line2, addr.city, addr.state, addr.pincode,
          ],
        ).lastId;
        db.run("INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note) VALUES (?, NULL, 'pending_payment', ?, 'Order created')", [orderId, u.id]);
        for (const l of g.lines) {
          db.run(
            `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, sku, image, unit_price_paise, quantity, line_total_paise)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderId, l.productId, l.variantId, l.productName, l.variantName, l.sku, l.image, l.unitPricePaise, l.quantity, l.lineTotalPaise],
          );
          reserveStock(db, l.variantId, l.quantity, String(orderId), u.id);
        }
      }
      if (summary.coupon) {
        const coupon = db.get("SELECT id FROM coupons WHERE code = ?", [summary.coupon.code])!;
        db.run("INSERT INTO coupon_redemptions (coupon_id, user_id, checkout_id) VALUES (?, ?, ?)", [coupon.id, u.id, checkoutId]);
      }
      if (input.paymentMethod === "cod") confirmCheckout(db, checkoutId, { cod: true });
      db.run("INSERT INTO analytics_events (name, user_id, props) VALUES ('checkout_submitted', ?, ?)", [u.id, JSON.stringify({ checkoutId, method: input.paymentMethod })]);
      return { checkoutId, duplicate: false };
    });

    const checkout = db.get("SELECT * FROM checkouts WHERE id = ?", [result.checkoutId])!;
    const orders = db.all("SELECT number FROM orders WHERE checkout_id = ?", [result.checkoutId]).map((o) => o.number);
    let razorpay = null;
    if (checkout.payment_method === "razorpay" && checkout.status === "pending") razorpay = await attachRazorpayOrder(db, checkout.id);
    return c.json({ checkoutId: checkout.id, status: checkout.status, orders, razorpay }, result.duplicate ? 200 : 201);
  })

  .get("/:id", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const checkout = db.get("SELECT * FROM checkouts WHERE id = ? AND user_id = ?", [Number(c.req.param("id")), u.id]);
    if (!checkout) throw notFound();
    const orders = db.all("SELECT number, status, total_paise FROM orders WHERE checkout_id = ?", [checkout.id]);
    return c.json({ id: checkout.id, status: checkout.status, paymentMethod: checkout.payment_method, totalPaise: checkout.total_paise, orders });
  })

  .post("/:id/retry-payment", async (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const checkout = db.get("SELECT * FROM checkouts WHERE id = ? AND user_id = ?", [Number(c.req.param("id")), u.id]);
    if (!checkout) throw notFound();
    if (checkout.status !== "pending" || checkout.payment_method !== "razorpay") {
      throw conflict("This payment can no longer be retried. Your bag still has your items — please check out again.");
    }
    return c.json({ razorpay: await attachRazorpayOrder(db, checkout.id) });
  });

export const paymentRoutes = new Hono<AppEnv>()
  /**
   * Called by the browser after Razorpay Checkout succeeds. The signature
   * proves the payment id belongs to our order, and we re-check the amount and
   * status with Razorpay itself before confirming anything.
   */
  .post("/razorpay/verify", async (c) => {
    const u = requireUser(c);
    const input = await body(
      c,
      z.object({
        checkoutId: id,
        razorpay_order_id: z.string().max(64),
        razorpay_payment_id: z.string().max(64),
        razorpay_signature: z.string().regex(/^[0-9a-f]{64}$/),
      }),
    );
    const db = c.get("db");
    const payment = db.get(
      "SELECT p.*, ch.user_id FROM payments p JOIN checkouts ch ON ch.id = p.checkout_id WHERE p.provider_order_id = ? AND p.checkout_id = ?",
      [input.razorpay_order_id, input.checkoutId],
    );
    if (!payment || payment.user_id !== u.id) throw notFound("Payment not found.");
    if (!verifyCheckoutSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
      audit(db, { actorId: u.id, action: "payment.signature_invalid", entityType: "checkout", entityId: input.checkoutId, ip: c.get("ip") });
      throw badRequest("Payment verification failed.");
    }
    const remote = await fetchRazorpayPayment(input.razorpay_payment_id);
    if (remote.order_id !== input.razorpay_order_id || remote.amount !== payment.amount_paise) {
      audit(db, { actorId: u.id, action: "payment.mismatch", entityType: "checkout", entityId: input.checkoutId, details: { remote } });
      throw badRequest("Payment details did not match the order.");
    }
    if (remote.status !== "captured" && remote.status !== "authorized") {
      return c.json({ status: "pending", message: "Your payment is still processing. We'll confirm your order as soon as it completes." }, 202);
    }
    db.tx(() => {
      db.run("UPDATE payments SET provider_payment_id = ?, status = 'captured', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND status = 'created'", [
        input.razorpay_payment_id,
        payment.id,
      ]);
      confirmCheckout(db, payment.checkout_id, { paymentId: payment.id });
    });
    return c.json({ status: "paid", orders: db.all("SELECT number FROM orders WHERE checkout_id = ?", [payment.checkout_id]).map((o) => o.number) });
  })

  .post("/razorpay/failed", async (c) => {
    const u = requireUser(c);
    const input = await body(c, z.object({ checkoutId: id, reason: z.string().max(300).default("Payment was cancelled.") }));
    const db = c.get("db");
    const ch = db.get("SELECT * FROM checkouts WHERE id = ? AND user_id = ?", [input.checkoutId, u.id]);
    if (!ch) throw notFound();
    // The customer can retry until the payment window closes; we only note the attempt.
    db.run("INSERT INTO analytics_events (name, user_id, props) VALUES ('payment_failed', ?, ?)", [u.id, JSON.stringify(input)]);
    return c.json({ ok: true, status: ch.status, expiresAt: ch.expires_at });
  })

  /** Razorpay → server. Authenticated by HMAC signature, deduplicated by event id. */
  .post("/razorpay/webhook", async (c) => {
    const db = c.get("db");
    const raw = await c.req.text();
    const signature = c.req.header("x-razorpay-signature") ?? "";
    if (!verifyWebhookSignature(raw, signature)) return c.json({ error: "invalid signature" }, 400);
    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return c.json({ error: "invalid body" }, 400);
    }
    const eventId = c.req.header("x-razorpay-event-id") ?? `${event.event}:${event.payload?.payment?.entity?.id ?? event.payload?.refund?.entity?.id ?? event.created_at}`;
    const fresh = db.run("INSERT OR IGNORE INTO payment_events (provider, event_id, type, payload) VALUES ('razorpay', ?, ?, ?)", [eventId, event.event, raw]);
    if (!fresh.changes) return c.json({ ok: true, duplicate: true });

    const p = event.payload?.payment?.entity;
    if (event.event === "payment.captured" && p) {
      const payment = db.get("SELECT * FROM payments WHERE provider_order_id = ?", [p.order_id]);
      if (payment && p.amount === payment.amount_paise) {
        db.tx(() => {
          db.run("UPDATE payments SET provider_payment_id = ?, status = 'captured', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [p.id, payment.id]);
          const ch = db.get("SELECT status FROM checkouts WHERE id = ?", [payment.checkout_id])!;
          if (ch.status === "pending") confirmCheckout(db, payment.checkout_id, { paymentId: payment.id });
          else if (ch.status !== "paid") {
            // Paid after the checkout expired: money was taken but stock was released. Flag for a refund.
            audit(db, { actorId: null, action: "payment.captured_after_expiry", entityType: "checkout", entityId: payment.checkout_id, details: { paymentId: p.id } });
          }
        });
      }
    } else if (event.event === "payment.failed" && p) {
      const payment = db.get("SELECT * FROM payments WHERE provider_order_id = ?", [p.order_id]);
      if (payment) db.run("UPDATE payments SET failure_reason = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [p.error_description ?? "failed", payment.id]);
    } else if (event.event === "refund.processed") {
      const r = event.payload?.refund?.entity;
      const refund = r && db.get("SELECT id FROM refunds WHERE provider_refund_id = ?", [r.id]);
      if (refund) markRefundProcessed(db, refund.id);
    } else if (event.event === "refund.failed") {
      const r = event.payload?.refund?.entity;
      if (r) db.run("UPDATE refunds SET status = 'failed' WHERE provider_refund_id = ?", [r.id]);
    }
    return c.json({ ok: true });
  });
