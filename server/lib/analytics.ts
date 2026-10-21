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

export const REPORT_DEFINITIONS = {
  categories: "Item revenue (before order-level discounts) by product category, counted orders only.",
  paymentMix: "Counted orders split by payment method.",
  statusBreakdown: "All orders placed in the period by their current status.",
  fulfilment: "Average hours from order placed to ready-for-dispatch, shipped and delivered, for orders that reached each step.",
  delivery: "Closed delivery assignments in the period: delivered vs failed or returned to sender.",
  returnReasons: "Return and exchange requests created in the period, by reason.",
};

/** Breakdown reports for the Reports pages. Same scope/range conventions as salesMetrics. */
export function reportData(db: Db, scope: string, params: (string | number)[], r: Range) {
  const inRange = "COALESCE(o.placed_at, o.created_at) BETWEEN ? AND ?";
  const base = [...params, r.from, r.to];
  const categories = db.all(
    `SELECT COALESCE(c.name, 'Uncategorised') AS label, SUM(oi.line_total_paise) AS value, SUM(oi.quantity) AS units
       FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${scope} AND ${COUNTED} AND ${inRange} GROUP BY label ORDER BY value DESC`,
    base,
  );
  const paymentMix = db.all(
    `SELECT CASE o.payment_method WHEN 'cod' THEN 'Cash on delivery' ELSE 'Online' END AS label, COUNT(*) AS value, SUM(o.total_paise) AS amount
       FROM orders o WHERE ${scope} AND ${COUNTED} AND ${inRange} GROUP BY label ORDER BY value DESC`,
    base,
  );
  const statusBreakdown = db.all(
    `SELECT o.status AS label, COUNT(*) AS value FROM orders o WHERE ${scope} AND ${inRange} GROUP BY o.status ORDER BY value DESC`,
    base,
  );
  const step = (to: string) =>
    db.get(
      `SELECT AVG((julianday(h.created_at) - julianday(o.placed_at)) * 24) AS hours, COUNT(*) AS n
         FROM orders o JOIN order_status_history h ON h.order_id = o.id AND h.to_status = ?
        WHERE ${scope} AND o.placed_at IS NOT NULL AND ${inRange}`,
      [to, ...base],
    )!;
  const fulfilment = ["ready_for_dispatch", "shipped", "delivered"].map((s) => {
    const x = step(s);
    return { step: s, hours: x.hours == null ? null : Math.round(x.hours * 10) / 10, orders: x.n };
  });
  const delivery = db.get(
    `SELECT SUM(a.status = 'delivered') AS delivered, SUM(a.status IN ('failed','returned')) AS failed, SUM(a.status = 'attempted') AS attempted
       FROM delivery_assignments a JOIN shipments s ON s.id = a.shipment_id JOIN orders o ON o.id = s.order_id
      WHERE ${scope} AND a.updated_at BETWEEN ? AND ?`,
    base,
  )!;
  const returnReasons = db.all(
    `SELECT rr.reason AS label, COUNT(*) AS value FROM return_requests rr JOIN orders o ON o.id = rr.order_id
      WHERE ${scope} AND rr.created_at BETWEEN ? AND ? GROUP BY rr.reason ORDER BY value DESC`,
    base,
  );
  const products = db.all(
    `SELECT p.id, p.name, p.view_count AS views,
            COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND ${COUNTED} AND ${inRange}), 0) AS units,
            COALESCE((SELECT SUM(oi.line_total_paise) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND ${COUNTED} AND ${inRange}), 0) AS revenue,
            COALESCE((SELECT SUM(ri.quantity) FROM return_items ri JOIN return_requests rr ON rr.id = ri.return_id JOIN order_items oi ON oi.id = ri.order_item_id WHERE oi.product_id = p.id AND rr.created_at BETWEEN ? AND ?), 0) AS returned
       FROM products p WHERE p.id IN (SELECT oi.product_id FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE ${scope}) OR ${scope.replace(/o\.store_id/g, "p.store_id")}
      ORDER BY revenue DESC LIMIT 100`,
    [r.from, r.to, r.from, r.to, r.from, r.to, ...params, ...params],
  );
  return {
    categories,
    paymentMix,
    statusBreakdown,
    fulfilment,
    delivery: { delivered: delivery.delivered ?? 0, failed: delivery.failed ?? 0, attempted: delivery.attempted ?? 0 },
    returnReasons,
    products: products.map((p) => ({ id: p.id as number, name: p.name as string, views: p.views as number, units: p.units as number, revenue: p.revenue as number, returned: p.returned as number, conversion: p.views ? Math.round((p.units / p.views) * 1000) / 10 : null })),
    definitions: REPORT_DEFINITIONS,
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
