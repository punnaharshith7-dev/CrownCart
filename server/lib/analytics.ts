import type { Db } from "../db.ts";

export const METRIC_DEFINITIONS = {
  orders: "Orders placed in the period, excluding unpaid, failed, expired and cancelled orders.",
  grossSales: "Sum of item prices (before discounts) on counted orders.",
  discounts: "Coupon and promotional discounts on counted orders.",
  refunds: "Refunds processed or settled manually on counted orders.",
  netSales: "Gross sales − discounts − refunds. Prices include GST, so net sales include tax.",
  shipping: "Shipping fees charged on counted orders (not part of net sales).",
  averageOrderValue: "Total paid by customers ÷ counted orders.",
  cancelled: "Orders cancelled in the period (any stage).",
};

export const COUNTED = "o.status NOT IN ('pending_payment','failed','expired','cancelled')";

export interface Range {
  from: string;
  to: string;
}

export function parseRange(from?: string, to?: string): Range {
  const end = to && !Number.isNaN(Date.parse(to)) ? new Date(to) : new Date();
  const start = from && !Number.isNaN(Date.parse(from)) ? new Date(from) : new Date(end.getTime() - 29 * 86_400_000);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

/** Sales metrics for orders matching `scope` (an SQL condition on alias o) in the range. */
export function salesMetrics(db: Db, scope: string, params: (string | number)[], r: Range) {
  const inRange = "COALESCE(o.placed_at, o.created_at) BETWEEN ? AND ?";
  const base = [...params, r.from, r.to];
  const totals = db.get(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(o.subtotal_paise),0) AS gross, COALESCE(SUM(o.discount_paise),0) AS discounts,
            COALESCE(SUM(o.shipping_paise),0) AS shipping, COALESCE(SUM(o.total_paise),0) AS paid,
            COALESCE(SUM(o.refunded_paise),0) AS refunds
       FROM orders o WHERE ${scope} AND ${COUNTED} AND ${inRange}`,
    base,
  )!;
  const cancelled = db.get<{ n: number }>(`SELECT COUNT(*) n FROM orders o WHERE ${scope} AND o.status = 'cancelled' AND ${inRange}`, base)!.n;
  const pending = db.get<{ n: number }>(
    `SELECT COUNT(*) n FROM orders o WHERE ${scope} AND o.status IN ('confirmed','processing','cancellation_requested','return_requested')`,
    params,
  )!.n;
  const daily = db.all(
    `SELECT substr(COALESCE(o.placed_at, o.created_at), 1, 10) AS day, COUNT(*) AS orders,
            SUM(o.subtotal_paise - o.discount_paise - o.refunded_paise) AS net
       FROM orders o WHERE ${scope} AND ${COUNTED} AND ${inRange} GROUP BY day ORDER BY day`,
    base,
  );
  const top = db.all(
    `SELECT oi.product_id, oi.product_name AS name, SUM(oi.quantity) AS units, SUM(oi.line_total_paise) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE ${scope} AND ${COUNTED} AND ${inRange}
      GROUP BY oi.product_id ORDER BY revenue DESC LIMIT 8`,
    base,
  );
  const returns = db.get(
    `SELECT COUNT(*) AS requested, SUM(rr.status IN ('approved','picked_up','received','refunded')) AS approved
       FROM return_requests rr JOIN orders o ON o.id = rr.order_id WHERE ${scope} AND rr.created_at BETWEEN ? AND ?`,
    base,
  )!;
  const coupons = db.all(
    `SELECT o.coupon_code AS code, COUNT(*) AS uses, SUM(o.discount_paise) AS discount
       FROM orders o WHERE ${scope} AND ${COUNTED} AND ${inRange} AND o.coupon_code IS NOT NULL GROUP BY o.coupon_code ORDER BY uses DESC`,
    base,
  );
  // Fill missing days so charts show gaps honestly.
  const days: { day: string; orders: number; netPaise: number }[] = [];
  for (let t = Date.parse(r.from); t <= Date.parse(r.to) && days.length < 400; t += 86_400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    const d = daily.find((x) => x.day === day);
    days.push({ day, orders: d?.orders ?? 0, netPaise: d?.net ?? 0 });
  }
  return {
    range: r,
    orders: totals.orders,
    grossSalesPaise: totals.gross,
    discountsPaise: totals.discounts,
    refundsPaise: totals.refunds,
    netSalesPaise: totals.gross - totals.discounts - totals.refunds,
    shippingPaise: totals.shipping,
    averageOrderValuePaise: totals.orders ? Math.round(totals.paid / totals.orders) : 0,
    cancelledOrders: cancelled,
    ordersNeedingAttention: pending,
    daily: days,
    topProducts: top.map((t) => ({ productId: t.product_id, name: t.name, units: t.units, revenuePaise: t.revenue })),
    returns: { requested: returns.requested ?? 0, approved: returns.approved ?? 0 },
    coupons: coupons.map((c) => ({ code: c.code, uses: c.uses, discountPaise: c.discount })),
    definitions: METRIC_DEFINITIONS,
  };
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    // Neutralise spreadsheet formula injection.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}
