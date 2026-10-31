import { useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { DateRange, PageHead, PortalLayout, Stat, defaultRange } from "../../components/Portal";
import { Bars, Button, Empty, ErrorState, Loading, Modal, Price, SelectField, StatusBadge, TextArea, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { date, dateTime, inr, relative } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi } from "../../lib/useApi";
import { OrderLines, OrderTimeline, ShipmentTracking, TrackLine, type OrderDetail } from "../account/Account";
import { formatAddress } from "../../components/AddressForm";
import { BulkUpdate, MediaEditor, OwnerReports, ProductHistory, VariantsEditor } from "./OwnerExtras";

const STORE_KEY = "cc-owner-store";

/** The store being managed. Persisted per browser; the server checks membership on every call. */
function useStoreId() {
  const { user } = useAuth();
  const stores = user?.stores ?? [];
  const [id, setId] = useState<number>(() => {
    const saved = Number((() => { try { return localStorage.getItem(STORE_KEY); } catch { return null; } })());
    return stores.find((s) => s.id === saved)?.id ?? stores[0]?.id;
  });
  const choose = (n: number) => {
    setId(n);
    try {
      localStorage.setItem(STORE_KEY, String(n));
    } catch {
      /* ignore */
    }
  };
  return { storeId: id, store: stores.find((s) => s.id === id), stores, choose };
}

const can = (role: string | undefined, area: "products" | "inventory" | "orders" | "promotions" | "analytics" | "team") =>
  role === "owner" ||
  (area === "products" && role === "product_editor") ||
  (area === "inventory" && role === "inventory_operator") ||
  (area === "orders" && role === "order_manager") ||
  (area === "analytics" && role === "analyst");

function Dashboard({ storeId }: { storeId: number }) {
  const [range, setRange] = useState(defaultRange());
  const { data, error, loading, reload } = useApi<any>(`/owner/stores/${storeId}/dashboard?from=${range.from}&to=${range.to}`);
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const m = data.metrics;
  return (
    <div className="stack" style={{ "--gap": "24px" } as React.CSSProperties}>
      <PageHead
        title="Dashboard"
        eyebrow="Store performance"
        actions={
          <>
            <DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
            <a className="btn btn-outline btn-sm" href={`/api/owner/stores/${storeId}/reports/orders.csv?from=${range.from}&to=${range.to}`}>
              Export CSV
            </a>
          </>
        }
      />
      <div className="stats">
        <Stat label="Today" value={inr(data.today.netSalesPaise)} sub={`${data.today.orders} order${data.today.orders === 1 ? "" : "s"}`} />
        <Stat label="Net sales" value={inr(m.netSalesPaise)} sub="Gross − discounts − refunds" />
        <Stat label="Gross sales" value={inr(m.grossSalesPaise)} />
        <Stat label="Orders" value={m.orders} sub={`${m.cancelledOrders} cancelled`} />
        <Stat label="Avg. order value" value={inr(m.averageOrderValuePaise)} />
        <Stat label="Needs attention" value={m.ordersNeedingAttention} sub="Confirmed, processing or requests" />
        <Stat label="Discounts" value={inr(m.discountsPaise)} />
        <Stat label="Refunds" value={inr(m.refundsPaise)} sub={`${m.returns.requested} return request${m.returns.requested === 1 ? "" : "s"}`} />
      </div>
      <section className="card">
        <h2 className="h3" style={{ marginBottom: 12 }}>
          Net sales by day
        </h2>
        <Bars data={m.daily.map((d: any) => ({ label: d.day, value: d.netPaise }))} format={inr} />
      </section>
      <div className="grid" style={{ "--min": "340px", alignItems: "start" } as React.CSSProperties}>
        <section className="card stack">
          <h2 className="h3">Bestsellers</h2>
          {m.topProducts.length ? (
            m.topProducts.map((p: any) => (
              <div key={p.productId} className="spread small">
                <span>{p.name}</span>
                <span className="muted">
                  {p.units} sold · {inr(p.revenuePaise)}
                </span>
              </div>
            ))
          ) : (
            <p className="small muted">No sales in this period.</p>
          )}
        </section>
        <section className="card stack">
          <h2 className="h3">Low & out of stock</h2>
          {data.lowStock.length ? (
            data.lowStock.map((l: any) => (
              <div key={l.variant_id} className="spread small">
                <span>
                  {l.name} <span className="muted">({l.variant})</span>
                </span>
                {l.outOfStock ? <span className="badge badge-danger">Out of stock</span> : <span className="badge badge-warning">{l.available} left</span>}
              </div>
            ))
          ) : (
            <p className="small muted">Stock levels look healthy.</p>
          )}
          <Link to="/owner/inventory" className="small">
            Manage inventory →
          </Link>
        </section>
        <section className="card stack">
          <h2 className="h3">Recent orders</h2>
          {data.recentOrders.length ? (
            data.recentOrders.map((o: any) => (
              <Link key={o.number} to={`/owner/orders/${o.number}`} className="spread small">
                <span>
                  {o.number} · {o.customerName}
                </span>
                <StatusBadge status={o.status} label={o.statusLabel} />
              </Link>
            ))
          ) : (
            <p className="small muted">No orders yet.</p>
          )}
        </section>
      </div>
      <details className="acc">
        <summary>How these numbers are calculated</summary>
        <div>
          <ul>
            {Object.entries(m.definitions).map(([k, v]) => (
              <li key={k}>
                <strong>{k}</strong>: {v as string}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}

function OrdersList({ storeId }: { storeId: number }) {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useApi<{ orders: any[]; statuses: Record<string, string> }>(`/owner/stores/${storeId}/orders?status=${status}&q=${encodeURIComponent(q)}`);
  return (
    <div className="stack">
      <PageHead title="Orders" />
      <div className="row">
        <input className="input" style={{ maxWidth: 260 }} placeholder="Search order or customer" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ width: "auto" }} aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {data && Object.entries(data.statuses).filter(([k]) => k !== "pending_payment").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : !data?.orders.length ? (
        <Empty title="No orders" />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.number}>
                  <td>
                    <Link to={`/owner/orders/${o.number}`}>{o.number}</Link>
                  </td>
                  <td>{relative(o.placedAt)}</td>
                  <td>{o.customerName}</td>
                  <td>{o.itemCount}</td>
                  <td>
                    {o.paymentMethod === "cod" ? "COD" : "Online"} <StatusBadge status={o.paymentStatus} />
                  </td>
                  <td>
                    <StatusBadge status={o.status} label={o.statusLabel} />
                    <TrackLine t={o.tracking} />
                  </td>
                  <td className="r num">{inr(o.totalPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderView({ storeId }: { storeId: number }) {
  const { number = "" } = useParams();
  const { data, error, loading, reload } = useApi<{ order: OrderDetail; actions: any; partners: any[] }>(`/owner/stores/${storeId}/orders/${number}`);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [partner, setPartner] = useState("");
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const { order: o, actions } = data!;
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast(msg, "success");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <Link to="/owner/orders" className="small">
        ← Orders
      </Link>
      <PageHead
        title={`Order ${o.number}`}
        eyebrow={`Placed ${dateTime(o.placedAt)}`}
        actions={
          <>
            <StatusBadge status={o.status} label={o.statusLabel} />
            <a className="btn btn-outline btn-sm" href={`/api/owner/stores/${storeId}/orders/${o.number}/invoice`} target="_blank" rel="noopener">
              Invoice
            </a>
          </>
        }
      />
      <div className="card row">
        {actions.transitions.map((t: any) => (
          <Button key={t.to} loading={busy} onClick={() => run(() => api.post(`/owner/stores/${storeId}/orders/${o.number}/status`, { to: t.to }), `Order marked ${t.label.toLowerCase()}.`)}>
            {t.to === "processing" && o.status === "cancellation_requested" ? "Decline cancellation" : `Mark ${t.label.toLowerCase()}`}
          </Button>
        ))}
        {actions.cancel && (
          <button className="btn btn-outline" onClick={() => setCancel(true)}>
            {actions.approveCancellation ? "Approve cancellation" : "Cancel order"}
          </button>
        )}
        {data!.partners.length > 0 && (
          <form className="row" onSubmit={(e) => (e.preventDefault(), run(() => api.post(`/owner/stores/${storeId}/orders/${o.number}/assign`, { partnerId: Number(partner) }), "Delivery partner assigned."))}>
            <select className="select" style={{ width: "auto" }} aria-label="Delivery partner" value={partner} onChange={(e) => setPartner(e.target.value)} required>
              <option value="">Assign delivery partner…</option>
              {data!.partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.availability}, {p.openAssignments} open)
                </option>
              ))}
            </select>
            <Button type="submit" className="btn-outline" disabled={!partner} loading={busy}>
              Assign
            </Button>
          </form>
        )}
        {actions.courier && (
          <Button className="btn-outline" loading={busy} onClick={() => run(() => api.post(`/owner/stores/${storeId}/orders/${o.number}/courier`), "Courier booked and pickup scheduled.")}>
            Book courier
          </Button>
        )}
        {o.shipments.some((s) => s.carrier === "shiprocket") && (
          <Button className="btn-ghost" loading={busy} onClick={() => run(() => api.post(`/owner/stores/${storeId}/orders/${o.number}/courier/sync`), "Tracking refreshed.")}>
            Refresh courier tracking
          </Button>
        )}
        {o.status === "ready_for_dispatch" && !actions.courierConfigured && <span className="tiny muted">Courier booking appears once Shiprocket is configured.</span>}
        {!actions.transitions.length && !actions.cancel && !data!.partners.length && !actions.courier && <span className="small muted">No actions needed from the store right now.</span>}
      </div>
      <div className="two-col">
        <div className="stack">
          <section className="card stack">
            <h2 className="h3">Items</h2>
            <OrderLines o={o} />
          </section>
          <section className="card stack">
            <h2 className="h3">Shipment</h2>
            <ShipmentTracking o={o} />
          </section>
          {o.returns.length > 0 && (
            <section className="card stack">
              <h2 className="h3">Returns</h2>
              {o.returns.map((r) => (
                <div key={r.id} className="stack panel" style={{ "--gap": "8px" } as React.CSSProperties}>
                  <div className="spread small">
                    <span>
                      {r.kind === "exchange" ? "Exchange" : "Return"} #{r.id} · {r.reason} · {date(r.createdAt)}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.details && <p className="small">{r.details}</p>}
                  <div className="row">
                    {r.status === "requested" && (
                      <>
                        <button className="btn btn-sm" onClick={() => run(() => api.post(`/owner/stores/${storeId}/returns/${r.id}`, { action: "approve" }), "Return approved.")}>
                          Approve & arrange pickup
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => run(() => api.post(`/owner/stores/${storeId}/returns/${r.id}`, { action: "reject", note: prompt("Reason for declining?") ?? "" }), "Return declined.")}>
                          Decline
                        </button>
                      </>
                    )}
                    {/* After a failed pickup (or none active), the store can send a partner again. */}
                    {r.status === "approved" && !o.shipments.some((s) => s.kind === "return" && !["failed", "cancelled", "delivered"].includes(s.status)) && (
                      <button className="btn btn-outline btn-sm" onClick={() => run(() => api.post(`/owner/stores/${storeId}/returns/${r.id}`, { action: "pickup" }), "Pickup arranged.")}>
                        Arrange pickup
                      </button>
                    )}
                    {(r.status === "approved" || r.status === "picked_up") && (
                      <button className="btn btn-sm" onClick={() => run(() => api.post(`/owner/stores/${storeId}/returns/${r.id}`, { action: "receive", restock: true }), "Items received and restocked.")}>
                        Mark items received
                      </button>
                    )}
                    {r.status === "received" && (
                      <button className="btn btn-sm" onClick={() => run(() => api.post(`/owner/stores/${storeId}/returns/${r.id}`, { action: "refund" }), "Refund started.")}>
                        Issue refund
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="stack">
          <section className="card stack small">
            <h2 className="h3">Customer</h2>
            <div>
              {o.customer?.name} · {o.customer?.email}
            </div>
            <div>
              Ship to {o.shippingAddress.name}, {formatAddress(o.shippingAddress)} · {o.shippingAddress.phone}
            </div>
            <div>
              Payment: {o.paymentMethod === "cod" ? "Cash on delivery" : "Online"} <StatusBadge status={o.paymentStatus} />
            </div>
          </section>
          <section className="card stack">
            <h2 className="h3">History</h2>
            <OrderTimeline o={o} />
          </section>
        </aside>
      </div>
      {cancel && (
        <Modal title="Cancel order" onClose={() => setCancel(false)}>
          <div className="stack">
            <p className="small muted">Stock returns to sale. If the customer paid online, a refund is started automatically.</p>
            <TextArea label="Reason (shared with the customer)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button className="btn-danger" loading={busy} disabled={reason.trim().length < 3} onClick={() => run(() => api.post(`/owner/stores/${storeId}/orders/${o.number}/cancel`, { reason }), "Order cancelled.").then(() => setCancel(false))}>
              Cancel order
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const emptyProduct = { name: "", brand: "", categoryId: null as number | null, gender: null as string | null, tagline: "", badge: "", description: "", care: "", warranty: "", returnDays: 7, status: "draft", isFeatured: false, titleLine1: "", titleLine2: "", accent: "", seoTitle: "", seoDescription: "", specs: [] as { label: string; value: string }[] };

function Products({ storeId }: { storeId: number }) {
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useApi<{ products: any[] }>(`/owner/stores/${storeId}/products?q=${encodeURIComponent(q)}`);
  return (
    <div className="stack">
      <PageHead title="Products" actions={<Link className="btn" to="/owner/products/new">+ New product</Link>} />
      <input className="input" style={{ maxWidth: 300 }} placeholder="Search name or SKU" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : !data?.products.length ? (
        <Empty title="No products yet" action={<Link className="btn" to="/owner/products/new">Add your first product</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Variants</th>
                <th>On hand</th>
                <th className="r">From</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/owner/products/${p.id}`} className="row" style={{ "--gap": "10px" } as React.CSSProperties}>
                      {p.image && <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: "contain", background: "var(--surface-2)", borderRadius: 6 }} />}
                      <span>
                        {p.name}
                        <br />
                        <span className="tiny muted">
                          {p.brand} · {p.category ?? "Uncategorised"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{p.variants}</td>
                  <td>{p.onHand}</td>
                  <td className="r num">{inr(p.pricePaise)}</td>
                  <td>{relative(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** The size as it appears in a SKU: "UK 7" becomes "UK7". */
const sizeCode = (size: string) => size.trim().toUpperCase().replace(/[^A-Z0-9._-]/g, "") || encodeURIComponent(size.trim()).replace(/[^A-Za-z0-9]/g, "").slice(0, 20);

/** Product create/edit form. Shared by the store portal and the admin catalog; `base` is the list URL. */
export function ProductEditor({ storeId, base = "/owner/products", back = base, productId }: { storeId: number; base?: string; back?: string; productId?: string }) {
  const params = useParams();
  const id = productId ?? params.id;
  const isNew = id === "new";
  const navigate = useNavigate();
  const toast = useToast();
  const cats = useApi<{ categories: { id: number; name: string }[] }>("/owner/categories");
  const existing = useApi<{ product: any }>(isNew ? null : `/owner/stores/${storeId}/products/${id}`);
  const [f, setF] = useState(emptyProduct);
  const [variant, setVariant] = useState({ sku: "", price: "", original: "" });
  const nextSize = useRef(1);
  const focusSize = useRef(0);
  const [sizes, setSizes] = useState([{ key: 0, size: "", stock: "" }]);
  const addSize = () => {
    focusSize.current = nextSize.current++;
    setSizes((list) => [...list, { key: focusSize.current, size: "", stock: "" }]);
  };
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const p = existing.data?.product;
    if (p) setF({ ...emptyProduct, ...p, brand: p.brand ?? "", seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "" });
  }, [existing.data]);

  if (!isNew && !existing.data) return existing.error ? <ErrorState error={existing.error} /> : <Loading />;
  const p = existing.data?.product;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : k === "returnDays" ? Number(e.target.value) : k === "categoryId" ? (e.target.value ? Number(e.target.value) : null) : k === "gender" ? e.target.value || null : e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const filled = sizes.filter((s) => s.size.trim());
    const codes = filled.map((s) => sizeCode(s.size));
    if (new Set(codes).size < codes.length) return setErr("Each size can only be added once.");
    if (isNew && variant.original && Number(variant.original) <= Number(variant.price)) return setErr("The original price must be higher than the current price.");
    setBusy(true);
    setErr(null);
    const payload = { ...f, brand: f.brand || null, seoTitle: f.seoTitle || null, seoDescription: f.seoDescription || null, specs: f.specs.filter((s) => s.label && s.value) };
    try {
      if (isNew) {
        const sku = variant.sku.trim();
        const pricePaise = Math.round(Number(variant.price) * 100);
        const compareAtPaise = variant.original ? Math.round(Number(variant.original) * 100) : null;
        const r = await api.post<{ product: { id: number } }>(`/owner/stores/${storeId}/products`, {
          ...payload,
          variants: filled.length
            ? filled.map((s, i) => ({ sku: `${sku}-${codes[i]}`, name: s.size.trim(), size: s.size.trim(), pricePaise, compareAtPaise, stock: Number(s.stock) }))
            : [{ sku, name: "Standard", size: null, pricePaise, compareAtPaise, stock: Number(sizes[0].stock) }],
        });
        // Upload chosen images one by one; the product exists even if an image fails.
        let failed = 0;
        for (const img of images) {
          const form = new FormData();
          form.append("file", img.file);
          form.append("kind", "image");
          form.append("alt", f.name);
          await api.upload(`/owner/stores/${storeId}/products/${r.product.id}/media`, form).catch(() => failed++);
        }
        toast(failed ? `Product created, but ${failed} image${failed > 1 ? "s" : ""} failed to upload. Add them again below.` : "Product created.", failed ? "error" : "success");
        navigate(`${base}/${r.product.id}`, { replace: true });
      } else {
        await api.put(`/owner/stores/${storeId}/products/${id}`, payload);
        toast("Product saved.", "success");
        existing.reload();
      }
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <Link to={back} className="small">
        ← Products
      </Link>
      <PageHead
        title={isNew ? "New product" : f.name || "Product"}
        actions={
          p && (
            <>
              {p.status === "active" ? (
                <Link className="btn btn-outline btn-sm" to={`/product/${p.slug}`} target="_blank">
                  View in store
                </Link>
              ) : (
                <span className="tiny muted">Not visible to customers until Active</span>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  try {
                    const r = await api.post<{ product: { id: number } }>(`/owner/stores/${storeId}/products/${p.id}/duplicate`);
                    toast("Duplicated as a draft with zero stock.", "success");
                    navigate(`${base}/${r.product.id}`);
                  } catch (e) {
                    toast(errorMessage(e), "error");
                  }
                }}
              >
                Duplicate
              </button>
            </>
          )
        }
      />
      <form className="two-col" onSubmit={save}>
        <div className="stack">
          <section className="card stack">
            <TextField label="Product name" required value={f.name} onChange={set("name")} />
            <div className="grid" style={{ "--min": "200px" } as React.CSSProperties}>
              <TextField label="Brand" value={f.brand} onChange={set("brand")} />
              <SelectField label="Category" value={f.categoryId ?? ""} onChange={set("categoryId")}>
                <option value="">Uncategorised</option>
                {cats.data?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Made for" value={f.gender ?? ""} onChange={set("gender")} hint="Sets where it appears in the shop's Men, Women and Unisex filter.">
                <option value="">Doesn't apply</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Both (unisex)</option>
              </SelectField>
            </div>
            <TextField label="Tagline" value={f.tagline} onChange={set("tagline")} />
            <TextArea label="Description" rows={6} value={f.description} onChange={set("description")} />
            <TextArea label="Care instructions" value={f.care} onChange={set("care")} />
            <TextArea label="Warranty" value={f.warranty} onChange={set("warranty")} hint="Only state warranty terms you can substantiate." />
          </section>
          <section className="card stack">
            <div className="spread">
              <h2 className="h3">Specifications</h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setF({ ...f, specs: [...f.specs, { label: "", value: "" }] })}>
                + Add
              </button>
            </div>
            {f.specs.map((s, i) => (
              <div key={i} className="row">
                <input className="input" style={{ flex: 1 }} aria-label="Specification name" placeholder="Name" value={s.label} onChange={(e) => setF({ ...f, specs: f.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <input className="input" style={{ flex: 2 }} aria-label="Specification value" placeholder="Value" value={s.value} onChange={(e) => setF({ ...f, specs: f.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                <button type="button" className="icon-btn" aria-label="Remove specification" onClick={() => setF({ ...f, specs: f.specs.filter((_, j) => j !== i) })}>
                  ✕
                </button>
              </div>
            ))}
          </section>
          {isNew ? (
            <section className="card stack">
              <h2 className="h3">Price & SKU</h2>
              <div className="grid" style={{ "--min": "150px" } as React.CSSProperties}>
                <TextField label="SKU" required maxLength={19} value={variant.sku} onChange={(e) => setVariant({ ...variant, sku: e.target.value })} hint="Each size gets its own code from this, like JORDAN1-UK7." />
                <TextField label="Current price (₹)" required inputMode="decimal" value={variant.price} onChange={(e) => setVariant({ ...variant, price: e.target.value })} hint="What customers pay." />
                <TextField label="Original price (₹)" inputMode="decimal" value={variant.original} onChange={(e) => setVariant({ ...variant, original: e.target.value })} hint="Optional. Add it to show a discount." />
              </div>
              {Number(variant.price) > 0 && Number(variant.original) > Number(variant.price) && (
                <div className="small">
                  <span className="muted">Customers will see: </span>
                  <Price paise={Math.round(Number(variant.price) * 100)} compareAt={Math.round(Number(variant.original) * 100)} />
                </div>
              )}
              <div className="spread" style={{ marginTop: 8 }}>
                <h2 className="h3">Add sizes to this product</h2>
                <button type="button" className="btn btn-outline btn-sm" onClick={addSize}>
                  + Add size
                </button>
              </div>
              {sizes.map((s, i) => (
                <div key={s.key} className="row">
                  <input
                    className="input"
                    style={{ flex: 2, minWidth: 120 }}
                    aria-label={`Size ${i + 1}`}
                    placeholder="Size, like UK 7 or M"
                    maxLength={20}
                    autoFocus={s.key === focusSize.current}
                    value={s.size}
                    onChange={(e) => setSizes(sizes.map((x) => (x.key === s.key ? { ...x, size: e.target.value } : x)))}
                    onKeyDown={(e) => {
                      // Enter moves on to the next size rather than submitting the form.
                      if (e.key === "Enter") (e.preventDefault(), addSize());
                    }}
                  />
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 80 }}
                    aria-label={`Stock for size ${i + 1}`}
                    placeholder="Stock"
                    inputMode="numeric"
                    value={s.stock}
                    onChange={(e) => setSizes(sizes.map((x) => (x.key === s.key ? { ...x, stock: e.target.value.replace(/\D/g, "") } : x)))}
                  />
                  <button type="button" className="icon-btn" aria-label={`Remove size ${i + 1}`} disabled={sizes.length === 1} onClick={() => setSizes(sizes.filter((x) => x.key !== s.key))}>
                    ✕
                  </button>
                </div>
              ))}
              <p className="tiny muted">Customers choose from these sizes. All sizes start at this price, and you can change any of them after saving. No sizes? Leave the size blank and just enter the stock.</p>
            </section>
          ) : null}
          {isNew ? (
            <section className="card stack">
              <div className="spread">
                <h2 className="h3">Images</h2>
                <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                  + Add images
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = [...(e.target.files ?? [])].map((file) => ({ file, url: URL.createObjectURL(file) }));
                      setImages((prev) => [...prev, ...files].slice(0, 12));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {images.length ? (
                <div className="row" style={{ flexWrap: "wrap", "--gap": "10px" } as React.CSSProperties}>
                  {images.map((img, i) => (
                    <div key={img.url} style={{ position: "relative" }}>
                      <img src={img.url} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10, display: "block" }} />
                      {i === 0 && (
                        <span className="tiny" style={{ position: "absolute", left: 4, bottom: 4, background: "var(--surface)", borderRadius: 6, padding: "1px 6px" }}>
                          Main
                        </span>
                      )}
                      <button type="button" className="icon-btn" aria-label="Remove image" style={{ position: "absolute", top: 2, right: 2 }} onClick={() => setImages(images.filter((_, j) => j !== i))}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tiny muted">PNG, JPG or WebP. The first image is the main product photo. Up to 12.</p>
              )}
            </section>
          ) : (
            <>
              <VariantsEditor storeId={storeId} product={p} onChange={existing.reload} />
              <MediaEditor storeId={storeId} product={p} onChange={existing.reload} />
              <ProductHistory key={p.updatedAt + p.variants.length + p.media.length} storeId={storeId} productId={p.id} />
            </>
          )}
        </div>
        <aside className="stack sticky-summary">
          <section className="card stack">
            <SelectField label="Status" value={f.status} onChange={set("status")}>
              <option value="draft">Draft (hidden)</option>
              <option value="active">Active (visible in store)</option>
              <option value="archived">Archived</option>
            </SelectField>
            <TextField label="Return window (days)" type="number" min={0} max={60} value={f.returnDays} onChange={set("returnDays")} hint="0 means not returnable." />
            <TextField label="Badge" value={f.badge} onChange={set("badge")} hint="e.g. NEW ARRIVAL" />
            <label className="check">
              <input type="checkbox" checked={f.isFeatured} onChange={set("isFeatured")} />
              <span>Featured product</span>
            </label>
            <TextField label="SEO title" maxLength={70} value={f.seoTitle} onChange={set("seoTitle")} />
            <TextArea label="SEO description" maxLength={160} value={f.seoDescription} onChange={set("seoDescription")} />
            {err && <div className="alert alert-danger">{err}</div>}
            <Button loading={busy} type="submit">
              {isNew ? "Create product" : "Save changes"}
            </Button>
          </section>
        </aside>
      </form>
    </div>
  );
}

function Inventory({ storeId }: { storeId: number }) {
  const { data, error, loading, reload } = useApi<{ inventory: any[] }>(`/owner/stores/${storeId}/inventory`);
  const moves = useApi<{ movements: any[] }>(`/owner/stores/${storeId}/inventory/movements`);
  const [adj, setAdj] = useState<any | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const toast = useToast();
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <PageHead title="Inventory" actions={<a className="btn btn-outline btn-sm" href={`/api/owner/stores/${storeId}/inventory.csv`}>Export CSV</a>} />
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th className="r">On hand</th>
                <th className="r">Reserved</th>
                <th className="r">Available</th>
                <th>Alert at</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data!.inventory.map((i) => (
                <tr key={i.variant_id}>
                  <td>{i.sku}</td>
                  <td>
                    {i.product} <span className="muted">({i.variant})</span>
                  </td>
                  <td className="r num">{i.on_hand}</td>
                  <td className="r num">{i.reserved}</td>
                  <td className="r num">{i.available <= 0 ? <span className="badge badge-danger">0</span> : i.available <= i.low_stock_threshold ? <span className="badge badge-warning">{i.available}</span> : i.available}</td>
                  <td>{i.low_stock_threshold}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => (setAdj(i), setDelta(""), setNote(""))}>
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="stack">
        <h2 className="h3">Stock movements</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>SKU</th>
                <th className="r">Change</th>
                <th className="r">Reserved</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {moves.data?.movements.slice(0, 50).map((m) => (
                <tr key={m.id}>
                  <td>{dateTime(m.created_at)}</td>
                  <td>{m.sku}</td>
                  <td className="r num">{m.delta_on_hand > 0 ? `+${m.delta_on_hand}` : m.delta_on_hand || "—"}</td>
                  <td className="r num">{m.delta_reserved || "—"}</td>
                  <td>
                    {m.reason.replace(/_/g, " ")}
                    {m.ref_type === "order" ? ` · order #${m.ref_id}` : m.ref_id ? ` · ${m.ref_id}` : ""}
                  </td>
                  <td>{m.actor ?? "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {adj && (
        <Modal title={`Adjust ${adj.sku}`} onClose={() => setAdj(null)}>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const r = await api.post<{ notified: number }>(`/owner/stores/${storeId}/inventory/adjust`, { variantId: adj.variant_id, delta: Number(delta), reason, note });
                toast(`Stock updated${r.notified ? `; ${r.notified} customer${r.notified === 1 ? "" : "s"} notified it's back` : ""}.`, "success");
                setAdj(null);
                reload();
                moves.reload();
              } catch (err) {
                toast(errorMessage(err), "error");
              }
            }}
          >
            <p className="small muted">
              On hand {adj.on_hand}, reserved {adj.reserved}. Use a negative number to remove stock.
            </p>
            <TextField label="Change" required inputMode="numeric" value={delta} onChange={(e) => setDelta(e.target.value.replace(/[^\d-]/g, ""))} />
            <SelectField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="restock">Restock</option>
              <option value="stock_count">Stock count</option>
              <option value="correction">Correction</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
              <option value="returned_to_supplier">Returned to supplier</option>
            </SelectField>
            <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" disabled={!delta || delta === "-"}>
              Save adjustment
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Coupons({ storeId }: { storeId: number }) {
  const { data, reload } = useApi<{ coupons: any[] }>(`/owner/stores/${storeId}/coupons`);
  const toast = useToast();
  const [f, setF] = useState({ code: "", kind: "percent", value: "", minOrder: "", maxDiscount: "", usageLimit: "", endsAt: "", description: "", firstOrderOnly: false });
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <PageHead title="Promotions" eyebrow="Store coupons" />
      <form
        className="card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.post(`/owner/stores/${storeId}/coupons`, {
              code: f.code,
              kind: f.kind,
              value: f.kind === "percent" ? Number(f.value) : Math.round(Number(f.value) * 100),
              minOrderPaise: Math.round(Number(f.minOrder || 0) * 100),
              maxDiscountPaise: f.maxDiscount ? Math.round(Number(f.maxDiscount) * 100) : null,
              usageLimit: f.usageLimit ? Number(f.usageLimit) : null,
              // Valid through the end of the chosen day, not just until it starts.
              endsAt: f.endsAt ? new Date(`${f.endsAt}T23:59:59`).toISOString() : null,
              description: f.description,
              firstOrderOnly: f.firstOrderOnly,
            });
            toast("Coupon created.", "success");
            setF({ ...f, code: "", value: "", description: "" });
            reload();
          } catch (err) {
            toast(errorMessage(err), "error");
          }
        }}
      >
        <div className="grid" style={{ "--min": "160px" } as React.CSSProperties}>
          <TextField label="Code" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
          <SelectField label="Type" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount (₹)</option>
          </SelectField>
          <TextField label={f.kind === "percent" ? "Percent" : "Amount (₹)"} required value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
          <TextField label="Minimum order (₹)" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} />
          <TextField label="Max discount (₹)" value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} />
          <TextField label="Total uses" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} />
          <TextField label="Expires" type="date" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} />
        </div>
        <TextField label="Description shown to customers" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <label className="check">
          <input type="checkbox" checked={f.firstOrderOnly} onChange={(e) => setF({ ...f, firstOrderOnly: e.target.checked })} />
          <span>First order only</span>
        </label>
        <Button type="submit">Create coupon</Button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Used</th>
              <th>Expires</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {data?.coupons.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.kind === "percent" ? `${c.value}%` : inr(c.value)}</td>
                <td>
                  {c.used}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td>{c.ends_at ? date(c.ends_at) : "—"}</td>
                <td>
                  <input type="checkbox" aria-label={`${c.code} active`} checked={Boolean(c.is_active)} onChange={(e) => api.patch(`/owner/stores/${storeId}/coupons/${c.id}`, { isActive: e.target.checked }).then(reload)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Team({ storeId }: { storeId: number }) {
  const { data, reload } = useApi<{ members: any[]; invitations: any[]; roles: string[] }>(`/owner/stores/${storeId}/team`);
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("order_manager");
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <PageHead title="Team" />
      <form
        className="card row"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const r = await api.post<{ devInviteUrl?: string }>(`/owner/stores/${storeId}/team/invite`, { email, role });
            toast(r.devInviteUrl ? `Invitation created (email not configured — dev link: ${r.devInviteUrl})` : "Invitation sent.", "success");
            setEmail("");
            reload();
          } catch (err) {
            toast(errorMessage(err), "error");
          }
        }}
      >
        <input className="input" style={{ flex: 1, minWidth: 200 }} type="email" required placeholder="Email address" aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="select" style={{ width: "auto" }} aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          {data?.roles.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <Button type="submit">Invite</Button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.role.replace(/_/g, " ")}</td>
                <td>
                  {m.role !== "owner" && (
                    <button className="link small" onClick={() => confirm(`Remove ${m.name}?`) && api.del(`/owner/stores/${storeId}/team/${m.id}`).then(reload)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data?.invitations.map((i) => (
              <tr key={`i${i.id}`}>
                <td className="muted">Invited</td>
                <td>{i.email}</td>
                <td>{i.role.replace(/_/g, " ")}</td>
                <td className="tiny muted">expires {date(i.expires_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Owner() {
  const { storeId, store, stores, choose } = useStoreId();
  if (!store) return <Empty title="No store assigned">Ask a CrownCart administrator to assign you to a store.</Empty>;
  const r = store.role;
  const nav = [
    can(r, "analytics") && { to: "/owner", label: "Dashboard", end: true },
    can(r, "orders") && { to: "/owner/orders", label: "Orders" },
    can(r, "products") && { to: "/owner/products", label: "Products" },
    can(r, "inventory") && { to: "/owner/inventory", label: "Inventory" },
    (can(r, "products") || can(r, "inventory")) && { to: "/owner/bulk", label: "Bulk update" },
    can(r, "analytics") && { to: "/owner/reports", label: "Reports" },
    can(r, "promotions") && { to: "/owner/promotions", label: "Promotions" },
    can(r, "team") && { to: "/owner/team", label: "Team" },
  ].filter(Boolean) as { to: string; label: string; end?: boolean }[];
  const home = nav[0]?.to ?? "/owner";
  return (
    <PortalLayout
      name="Store portal"
      nav={nav}
      header={
        stores.length > 1 ? (
          <select className="select" style={{ margin: "0 0 14px" }} aria-label="Store" value={storeId} onChange={(e) => choose(Number(e.target.value))}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="small" style={{ padding: "0 10px 14px", fontWeight: 600 }}>
            {store.name} {store.status !== "active" && <StatusBadge status={store.status} />}
          </div>
        )
      }
    >
      {store.status === "suspended" ? (
        <Empty title="Store suspended">This store has been suspended by CrownCart. Contact support for details.</Empty>
      ) : (
        <Routes>
          <Route index element={can(r, "analytics") ? <Dashboard storeId={storeId} /> : <Link to={home}>Continue</Link>} />
          <Route path="orders" element={<OrdersList storeId={storeId} />} />
          <Route path="orders/:number" element={<OrderView storeId={storeId} />} />
          <Route path="products" element={<Products storeId={storeId} />} />
          <Route path="products/:id" element={<ProductEditor storeId={storeId} />} />
          <Route path="inventory" element={<Inventory storeId={storeId} />} />
          <Route path="bulk" element={<BulkUpdate storeId={storeId} />} />
          <Route path="reports" element={<OwnerReports storeId={storeId} />} />
          <Route path="promotions" element={<Coupons storeId={storeId} />} />
          <Route path="team" element={<Team storeId={storeId} />} />
          <Route path="*" element={<Empty title="Not found" />} />
        </Routes>
      )}
    </PortalLayout>
  );
}
