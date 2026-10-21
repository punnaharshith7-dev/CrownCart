import type { Db, Row } from "../db.ts";
import { getSetting } from "./settings.ts";
import { findGiftCard, pointsBalance } from "./credits.ts";

export interface CartLine {
  itemId: number;
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  variantName: string;
  sku: string;
  image: string | null;
  storeId: number;
  storeName: string;
  quantity: number;
  unitPricePaise: number;
  compareAtPaise: number | null;
  lineTotalPaise: number;
  available: number;
  maxPerOrder: number;
  savedForLater: boolean;
  addedAt: string;
  /** Why this line cannot be checked out, if it cannot. */
  issue: string | null;
}

export interface StoreGroup {
  storeId: number;
  storeName: string;
  lines: CartLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  /** Store credit applied to this store order, and the money left to pay. */
  pointsUsed: number;
  pointsPaise: number;
  giftCardPaise: number;
  payablePaise: number;
}

export interface CartSummary {
  lines: CartLine[];
  saved: CartLine[];
  groups: StoreGroup[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  itemCount: number;
  coupon: { code: string; description: string } | null;
  couponError: string | null;
  freeShippingThresholdPaise: number;
  checkoutBlocked: boolean;
  taxNote: string;
  /** Money to pay after points and gift card (totalPaise is before them). */
  payablePaise: number;
  loyalty: { enabled: boolean; balance: number; maxUsable: number; pointValuePaise: number; applied: number; appliedPaise: number };
  giftCard: { code: string; balancePaise: number; appliedPaise: number } | null;
  giftCardError: string | null;
}

export function loadCartLines(db: Db, userId: number): CartLine[] {
  const rows = db.all(
    `SELECT ci.id AS item_id, ci.quantity, ci.saved_for_later, ci.added_at,
            v.id AS variant_id, v.name AS variant_name, v.sku, v.price_paise, v.compare_at_paise,
            v.max_per_order, v.is_active AS variant_active,
            p.id AS product_id, p.slug, p.name AS product_name, p.status AS product_status,
            s.id AS store_id, s.name AS store_name, s.status AS store_status,
            COALESCE(i.on_hand - i.reserved, 0) AS available,
            -- A variant-specific image wins; otherwise the product's first image. (SQLite can't
            -- reference the outer row inside a subquery's ORDER BY, hence two lookups.)
            COALESCE(
              (SELECT url FROM product_media m WHERE m.variant_id = v.id AND m.kind = 'image' ORDER BY m.sort_order LIMIT 1),
              (SELECT url FROM product_media m WHERE m.product_id = p.id AND m.kind IN ('image','hero') ORDER BY m.kind = 'image' DESC, m.sort_order LIMIT 1)
            ) AS image
       FROM cart_items ci
       JOIN product_variants v ON v.id = ci.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN stores s ON s.id = p.store_id
       LEFT JOIN inventory i ON i.variant_id = v.id
      WHERE ci.user_id = ?
      ORDER BY ci.added_at`,
    [userId],
  );
  return rows.map((r: Row) => {
    let issue: string | null = null;
    if (r.product_status !== "active" || !r.variant_active) issue = "This item is no longer available.";
    else if (r.store_status !== "active") issue = "This store is not accepting orders right now.";
    else if (r.available <= 0) issue = "Out of stock.";
    else if (r.quantity > r.available) issue = `Only ${r.available} left in stock.`;
    else if (r.quantity > r.max_per_order) issue = `Limit ${r.max_per_order} per order.`;
    return {
      itemId: r.item_id,
      variantId: r.variant_id,
      productId: r.product_id,
      productSlug: r.slug,
      productName: r.product_name,
      variantName: r.variant_name,
      sku: r.sku,
      image: r.image,
      storeId: r.store_id,
      storeName: r.store_name,
      quantity: r.quantity,
      unitPricePaise: r.price_paise,
      compareAtPaise: r.compare_at_paise,
      lineTotalPaise: r.price_paise * r.quantity,
      available: Math.max(0, r.available),
      maxPerOrder: r.max_per_order,
      savedForLater: Boolean(r.saved_for_later),
      addedAt: r.added_at,
      issue,
    };
  });
}

export interface CouponRow {
  id: number;
  code: string;
  store_id: number | null;
  kind: "percent" | "fixed";
  value: number;
  min_order_paise: number;
  max_discount_paise: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  per_user_limit: number;
  first_order_only: number;
  is_active: number;
  description: string;
}

/** Returns the coupon or a customer-readable reason it cannot be used. */
export function checkCoupon(db: Db, code: string, userId: number): { coupon: CouponRow } | { error: string } {
  const coupon = db.get<CouponRow>("SELECT * FROM coupons WHERE code = ?", [code.trim()]);
  if (!coupon || !coupon.is_active) return { error: "This coupon code is not valid." };
  const t = new Date().toISOString();
  if (coupon.starts_at && t < coupon.starts_at) return { error: "This coupon is not active yet." };
  if (coupon.ends_at && t > coupon.ends_at) return { error: "This coupon has expired." };
  if (coupon.usage_limit != null) {
    const used = db.get<{ n: number }>("SELECT COUNT(*) n FROM coupon_redemptions WHERE coupon_id = ?", [coupon.id])!.n;
    if (used >= coupon.usage_limit) return { error: "This coupon has reached its usage limit." };
  }
  const mine = db.get<{ n: number }>(
    "SELECT COUNT(*) n FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?",
    [coupon.id, userId],
  )!.n;
  if (mine >= coupon.per_user_limit) return { error: "You have already used this coupon." };
  if (coupon.first_order_only) {
    const orders = db.get<{ n: number }>(
      "SELECT COUNT(*) n FROM orders WHERE user_id = ? AND status NOT IN ('failed','expired','pending_payment')",
      [userId],
    )!.n;
    if (orders > 0) return { error: "This coupon is only valid on your first order." };
  }
  return { coupon };
}

export function discountFor(coupon: CouponRow, eligibleSubtotal: number): number {
  if (eligibleSubtotal < coupon.min_order_paise) return 0;
  let d = coupon.kind === "percent" ? Math.floor((eligibleSubtotal * coupon.value) / 100) : coupon.value;
  if (coupon.max_discount_paise != null) d = Math.min(d, coupon.max_discount_paise);
  return Math.min(d, eligibleSubtotal);
}

export function shippingFor(db: Db, subtotalAfterDiscount: number): number {
  const s = getSetting(db, "shipping");
  return subtotalAfterDiscount >= s.freeThresholdPaise ? 0 : s.flatPaise;
}

/** Authoritative cart totals. The browser's numbers are never used. */
export function summarizeCart(db: Db, userId: number, couponCode?: string | null, credit: { points?: number; giftCardCode?: string | null } = {}): CartSummary {
  const all = loadCartLines(db, userId);
  const lines = all.filter((l) => !l.savedForLater);
  const saved = all.filter((l) => l.savedForLater);

  let coupon: CouponRow | null = null;
  let couponError: string | null = null;
  if (couponCode && !getSetting(db, "features").coupons) {
    couponError = "Coupons are not available right now.";
  } else if (couponCode) {
    const res = checkCoupon(db, couponCode, userId);
    if ("error" in res) couponError = res.error;
    else coupon = res.coupon;
  }

  const byStore = new Map<number, StoreGroup>();
  for (const l of lines) {
    let g = byStore.get(l.storeId);
    if (!g) {
      g = { storeId: l.storeId, storeName: l.storeName, lines: [], subtotalPaise: 0, discountPaise: 0, shippingPaise: 0, taxPaise: 0, totalPaise: 0, pointsUsed: 0, pointsPaise: 0, giftCardPaise: 0, payablePaise: 0 };
      byStore.set(l.storeId, g);
    }
    g.lines.push(l);
    g.subtotalPaise += l.lineTotalPaise;
  }
  const groups = [...byStore.values()];

  if (coupon) {
    const eligible = groups.filter((g) => coupon!.store_id == null || g.storeId === coupon!.store_id);
    const eligibleSubtotal = eligible.reduce((s, g) => s + g.subtotalPaise, 0);
    const total = discountFor(coupon, eligibleSubtotal);
    if (eligibleSubtotal === 0) couponError = "This coupon does not apply to the items in your cart.";
    else if (total === 0) couponError = `Add items worth ₹${(coupon.min_order_paise / 100).toLocaleString("en-IN")} or more to use this coupon.`;
    else {
      // Split the discount across store orders in proportion to their subtotal.
      let remaining = total;
      eligible.forEach((g, i) => {
        const share = i === eligible.length - 1 ? remaining : Math.floor((total * g.subtotalPaise) / eligibleSubtotal);
        g.discountPaise = share;
        remaining -= share;
      });
    }
    if (couponError) coupon = null;
  }

  for (const g of groups) {
    g.shippingPaise = g.subtotalPaise > 0 ? shippingFor(db, g.subtotalPaise - g.discountPaise) : 0;
    g.totalPaise = g.subtotalPaise - g.discountPaise + g.shippingPaise + g.taxPaise;
  }

  const sum = (k: keyof Pick<StoreGroup, "subtotalPaise" | "discountPaise" | "shippingPaise" | "taxPaise" | "totalPaise" | "pointsPaise" | "giftCardPaise" | "payablePaise">) =>
    groups.reduce((s, g) => s + g[k], 0);
  const grandTotal = sum("totalPaise");

  // ── Store credit: points first (capped by the redemption limit), then a gift card. ──
  const lp = getSetting(db, "loyalty");
  const balance = lp.enabled ? Math.max(0, pointsBalance(db, userId)) : 0;
  const maxUsable = lp.enabled ? Math.min(balance, Math.floor((grandTotal * lp.maxRedeemPercent) / 100 / lp.pointValuePaise)) : 0;
  const pointsApplied = Math.max(0, Math.min(Math.floor(credit.points ?? 0), maxUsable));
  const pointsPaise = pointsApplied * lp.pointValuePaise;
  let giftCard: CartSummary["giftCard"] = null;
  let giftCardError: string | null = null;
  let gcPaise = 0;
  if (credit.giftCardCode) {
    const found = findGiftCard(db, credit.giftCardCode);
    if ("error" in found) giftCardError = found.error;
    else {
      gcPaise = Math.min(found.card.balance_paise, grandTotal - pointsPaise);
      giftCard = { code: found.card.code, balancePaise: found.card.balance_paise, appliedPaise: gcPaise };
    }
  }
  // Spread both across store orders in proportion to their totals (last group takes the remainder).
  const spread = (amount: number, key: "pointsPaise" | "giftCardPaise") => {
    let left = amount;
    groups.forEach((g, i) => {
      const share = i === groups.length - 1 ? left : Math.floor((amount * g.totalPaise) / Math.max(grandTotal, 1));
      g[key] = Math.min(share, g.totalPaise - (key === "giftCardPaise" ? g.pointsPaise : 0));
      left -= g[key];
    });
  };
  spread(pointsPaise, "pointsPaise");
  spread(gcPaise, "giftCardPaise");
  let ptsLeft = pointsApplied;
  groups.forEach((g, i) => {
    g.pointsUsed = i === groups.length - 1 ? ptsLeft : Math.round(g.pointsPaise / lp.pointValuePaise);
    ptsLeft -= g.pointsUsed;
    g.payablePaise = g.totalPaise - g.pointsPaise - g.giftCardPaise;
  });
  if (giftCard) giftCard.appliedPaise = sum("giftCardPaise");

  return {
    lines,
    saved,
    groups,
    subtotalPaise: sum("subtotalPaise"),
    discountPaise: sum("discountPaise"),
    shippingPaise: sum("shippingPaise"),
    taxPaise: sum("taxPaise"),
    totalPaise: sum("totalPaise"),
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    coupon: coupon ? { code: coupon.code, description: coupon.description } : null,
    couponError,
    freeShippingThresholdPaise: getSetting(db, "shipping").freeThresholdPaise,
    checkoutBlocked: lines.length === 0 || lines.some((l) => l.issue !== null),
    taxNote: getSetting(db, "tax").note,
    payablePaise: sum("payablePaise"),
    loyalty: { enabled: lp.enabled, balance, maxUsable, pointValuePaise: lp.pointValuePaise, applied: pointsApplied, appliedPaise: pointsPaise },
    giftCard,
    giftCardError,
  };
}
