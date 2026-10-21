import type { ReactNode } from "react";
import { ChartCard, HBars, Meter, TimeBars } from "./Charts";
import { Stat } from "./Portal";
import { inr, titleCase } from "../lib/format";

export interface Metrics {
  orders: number;
  grossSalesPaise: number;
  discountsPaise: number;
  refundsPaise: number;
  netSalesPaise: number;
  shippingPaise: number;
  averageOrderValuePaise: number;
  cancelledOrders: number;
  daily: { day: string; orders: number; netPaise: number }[];
  topProducts: { productId: number; name: string; units: number; revenuePaise: number }[];
  returns: { requested: number; approved: number };
  coupons: { code: string; uses: number; discountPaise: number }[];
  definitions: Record<string, string>;
}
export interface Report {
  categories: { label: string; value: number; units: number }[];
  paymentMix: { label: string; value: number; amount: number }[];
  statusBreakdown: { label: string; value: number }[];
  fulfilment: { step: string; hours: number | null; orders: number }[];
  delivery: { delivered: number; failed: number; attempted: number };
  returnReasons: { label: string; value: number }[];
  products: { id: number; name: string; views: number; units: number; revenue: number; returned: number; conversion: number | null }[];
  definitions: Record<string, string>;
}

const count = (n: number) => n.toLocaleString("en-IN");
const hours = (h: number | null) => (h == null ? "—" : h < 48 ? `${h} h` : `${Math.round((h / 24) * 10) / 10} days`);

export function ReportsView({ m, r, csv, children }: { m: Metrics; r: Report; csv?: ReactNode; children?: ReactNode }) {
  const deliveryTotal = r.delivery.delivered + r.delivery.failed;
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <div className="stats">
        <Stat label="Net sales" value={inr(m.netSalesPaise)} sub="Gross − discounts − refunds" />
        <Stat label="Gross sales" value={inr(m.grossSalesPaise)} />
        <Stat label="Discounts" value={inr(m.discountsPaise)} />
        <Stat label="Refunds" value={inr(m.refundsPaise)} />
        <Stat label="Shipping charged" value={inr(m.shippingPaise)} sub="Not part of net sales" />
        <Stat label="Orders" value={count(m.orders)} sub={`${m.cancelledOrders} cancelled`} />
        <Stat label="Avg. order value" value={inr(m.averageOrderValuePaise)} />
        <Stat label="Return requests" value={m.returns.requested} sub={`${m.returns.approved} approved`} />
      </div>
      {csv && <div className="row">{csv}</div>}
      <div className="grid" style={{ "--min": "420px", alignItems: "start" } as React.CSSProperties}>
        <ChartCard title="Net sales by day" subtitle="Counted orders only" table={{ head: ["Day", "Net sales", "Orders"], rows: m.daily.map((d) => [d.day, inr(d.netPaise), d.orders]) }}>
          <TimeBars label="Net sales by day" data={m.daily.map((d) => ({ label: d.day, value: d.netPaise }))} format={inr} />
        </ChartCard>
        <ChartCard title="Orders by day" table={{ head: ["Day", "Orders"], rows: m.daily.map((d) => [d.day, d.orders]) }}>
          <TimeBars label="Orders by day" data={m.daily.map((d) => ({ label: d.day, value: d.orders }))} format={count} />
        </ChartCard>
        <ChartCard title="Revenue by category" subtitle="Item revenue before order discounts" table={{ head: ["Category", "Revenue", "Units"], rows: r.categories.map((c) => [c.label, inr(c.value), c.units]) }}>
          <HBars data={r.categories.map((c) => ({ label: c.label, value: c.value, sub: `· ${c.units} units` }))} format={inr} />
        </ChartCard>
        <ChartCard title="Top products" table={{ head: ["Product", "Revenue", "Units"], rows: m.topProducts.map((p) => [p.name, inr(p.revenuePaise), p.units]) }}>
          <HBars data={m.topProducts.map((p) => ({ label: p.name, value: p.revenuePaise, sub: `· ${p.units} sold` }))} format={inr} />
        </ChartCard>
        <ChartCard title="Payment methods" table={{ head: ["Method", "Orders", "Amount"], rows: r.paymentMix.map((p) => [p.label, p.value, inr(p.amount)]) }}>
          <HBars data={r.paymentMix.map((p) => ({ label: p.label, value: p.value, sub: `· ${inr(p.amount)}` }))} format={count} />
        </ChartCard>
        <ChartCard title="Orders by current status" subtitle="All orders placed in the period" table={{ head: ["Status", "Orders"], rows: r.statusBreakdown.map((s) => [titleCase(s.label), s.value]) }}>
          <HBars data={r.statusBreakdown.map((s) => ({ label: titleCase(s.label), value: s.value }))} format={count} />
        </ChartCard>
        <ChartCard title="Fulfilment speed" subtitle="Average time from order placed" table={{ head: ["Step", "Average", "Orders"], rows: r.fulfilment.map((f) => [titleCase(f.step), hours(f.hours), f.orders]) }}>
          <HBars data={r.fulfilment.filter((f) => f.hours != null).map((f) => ({ label: titleCase(f.step), value: f.hours!, sub: `· ${f.orders} orders` }))} format={hours} empty="No orders reached these steps in this period." />
        </ChartCard>
        <section className="card stack">
          <h2 className="h3">Delivery & returns</h2>
          <Meter label="Delivery success rate" value={r.delivery.delivered} total={deliveryTotal} />
          <div className="tiny muted">{r.delivery.attempted} delivery attempt{r.delivery.attempted === 1 ? "" : "s"} still being retried.</div>
          <h3 className="small" style={{ fontWeight: 700, marginTop: 8 }}>
            Return reasons
          </h3>
          <HBars data={r.returnReasons} format={count} empty="No return requests in this period." />
        </section>
        <ChartCard title="Coupon performance" table={{ head: ["Code", "Uses", "Discount given"], rows: m.coupons.map((c) => [c.code, c.uses, inr(c.discountPaise)]) }}>
          <HBars data={m.coupons.map((c) => ({ label: c.code, value: c.uses, sub: `· ${inr(c.discountPaise)} off` }))} format={count} empty="No coupons used in this period." />
        </ChartCard>
      </div>
      {children}
      <section className="stack">
        <h2 className="h3">Product performance</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Product</th>
                <th className="r">Views (all time)</th>
                <th className="r">Units sold</th>
                <th className="r">Revenue</th>
                <th className="r">Units returned</th>
                <th className="r">Units per 100 views</th>
              </tr>
            </thead>
            <tbody>
              {r.products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="r num">{count(p.views)}</td>
                  <td className="r num">{p.units}</td>
                  <td className="r num">{inr(p.revenue)}</td>
                  <td className="r num">{p.returned}</td>
                  <td className="r num">{p.conversion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <details className="acc">
        <summary>How these numbers are calculated</summary>
        <div>
          <ul>
            {Object.entries({ ...m.definitions, ...r.definitions }).map(([k, v]) => (
              <li key={k}>
                <strong>{titleCase(k)}</strong>: {v}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
