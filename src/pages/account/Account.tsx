import { useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { StoreLayout, ThemeSwitch } from "../../components/SiteHeader";
import { AddressForm, formatAddress, type Address } from "../../components/AddressForm";
import { Button, Empty, ErrorState, Loading, Modal, PasswordField, Price, SelectField, StatusBadge, TextArea, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { date, dateTime, inr, relative } from "../../lib/format";
import { useTheme } from "../../lib/theme";
import { useToast } from "../../lib/toast";
import { useApi, useTitle } from "../../lib/useApi";
import { payWithRazorpay } from "../shop/Checkout";
import type { Card } from "../../components/ProductCard";

interface OrderSummary {
  number: string;
  status: string;
  statusLabel: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPaise: number;
  placedAt: string;
  itemCount: number;
  preview: string | null;
  storeName: string;
}
export interface OrderDetail extends OrderSummary {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  refundedPaise: number;
  pointsUsed: number;
  pointsPaise: number;
  giftCardPaise: number;
  couponCode: string | null;
  deliveredAt: string | null;
  checkoutId: number;
  shippingAddress: { name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string };
  customer: { name: string; email: string } | null;
  items: { id: number; productName: string; variantName: string; sku: string; image: string | null; unitPricePaise: number; quantity: number; returnedQty: number; lineTotalPaise: number; productSlug: string }[];
  history: { from: string | null; to: string; label: string; note: string; at: string; actor: string | null }[];
  shipments: {
    id: number;
    trackingNumber: string;
    carrier: string;
    courierName: string | null;
    labelUrl: string | null;
    trackingUrl: string | null;
    status: string;
    partner: { name: string; phone: string | null; status: string; statusLabel: string; failureReason: string | null } | null;
    events: { status: string; label: string; reason: string; at: string }[];
    proof: { recipientName: string; otpVerified: boolean; deliveredAt: string; notes: string } | null;
  }[];
  returns: { id: number; kind: string; status: string; reason: string; details: string; resolutionNote: string; createdAt: string; items: { orderItemId: number; quantity: number }[] }[];
  refunds: { id: number; amountPaise: number; status: string; reason: string; createdAt: string }[];
  taxNote: string;
  eligibility: { cancel: boolean; cancelNeedsApproval: boolean; return: boolean; returnDeadline: string | null; retryPayment: boolean };
}

const NAV = [
  ["", "Overview"],
  ["orders", "Orders"],
  ["wishlist", "Wishlist"],
  ["rewards", "Rewards"],
  ["addresses", "Addresses"],
  ["notifications", "Notifications"],
  ["support", "Support"],
  ["settings", "Settings & security"],
];

function Shell({ children }: { children: React.ReactNode }) {
  const { user, unread } = useAuth();
  return (
    <StoreLayout>
      <div className="container page">
        <div className="page-head">
          <div>
            <div className="eyebrow">My account</div>
            <h1 className="display">Hello, {user?.name.split(" ")[0]}</h1>
          </div>
        </div>
        <nav className="tabs" aria-label="Account">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={`/account${to ? `/${to}` : ""}`} end={!to}>
              {label}
              {to === "notifications" && unread > 0 ? ` (${unread})` : ""}
            </NavLink>
          ))}
        </nav>
        {children}
      </div>
    </StoreLayout>
  );
}

function VerifyBanner() {
  const { user } = useAuth();
  const toast = useToast();
  if (!user || user.emailVerified) return null;
  return (
    <div className="alert alert-warning" style={{ marginBottom: 20 }}>
      <span>
        Verify your email ({user.email}) to place orders.{" "}
        <button className="link" onClick={() => api.post("/auth/resend-verification").then(() => toast("Verification email sent.", "success")).catch((e) => toast(errorMessage(e), "error"))}>
          Resend link
        </button>
      </span>
    </div>
  );
}

function OrderRow({ o }: { o: OrderSummary }) {
  return (
    <Link to={`/account/orders/${o.number}`} className="card card-flat row" style={{ textDecoration: "none", "--gap": "16px" } as React.CSSProperties}>
      {o.preview && <img src={o.preview} alt="" style={{ width: 64, height: 64, objectFit: "contain", background: "var(--surface-2)", borderRadius: 8 }} />}
      <div style={{ flex: 1, minWidth: 180 }}>
        <strong>{o.number}</strong>
        <div className="small muted">
          {date(o.placedAt)} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · {o.storeName}
        </div>
      </div>
      <StatusBadge status={o.status} label={o.statusLabel} />
      <span className="num" style={{ fontWeight: 600 }}>
        {inr(o.totalPaise)}
      </span>
    </Link>
  );
}

function Overview() {
  const [params] = useSearchParams();
  const orders = useApi<{ orders: OrderSummary[] }>("/orders?status=active");
  const recent = useApi<{ items: { slug: string; name: string; image: string | null; pricePaise: number }[] }>("/account/recently-viewed");
  useTitle("My account", { noindex: true });
  return (
    <div className="stack" style={{ "--gap": "28px" } as React.CSSProperties}>
      {params.get("welcome") && <div className="alert alert-success">Welcome to CrownCart! Check your email to verify your address.</div>}
      <VerifyBanner />
      <section className="stack">
        <div className="spread">
          <h2 className="h3">Orders in progress</h2>
          <Link to="/account/orders" className="small">
            All orders →
          </Link>
        </div>
        {orders.data?.orders.length ? orders.data.orders.slice(0, 5).map((o) => <OrderRow key={o.number} o={o} />) : <p className="muted small">No orders in progress.</p>}
      </section>
      {recent.data && recent.data.items.length > 0 && (
        <section className="stack">
          <h2 className="h3">Recently viewed</h2>
          <div className="row" style={{ "--gap": "12px", overflowX: "auto", flexWrap: "nowrap" } as React.CSSProperties}>
            {recent.data.items.map((r) => (
              <Link key={r.slug} to={`/product/${r.slug}`} className="card card-flat" style={{ minWidth: 160, textDecoration: "none", "--pad": "12px" } as React.CSSProperties}>
                {r.image && <img src={r.image} alt="" style={{ width: "100%", height: 110, objectFit: "contain" }} />}
                <div className="small" style={{ fontWeight: 600 }}>
                  {r.name}
                </div>
                <div className="small muted">{inr(r.pricePaise)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Orders() {
  const [filter, setFilter] = useState("");
  const { data, error, loading, reload } = useApi<{ orders: OrderSummary[] }>(`/orders${filter ? `?status=${filter}` : ""}`);
  useTitle("Orders", { noindex: true });
  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Filter orders">
        {[
          ["", "All"],
          ["active", "In progress"],
          ["delivered", "Delivered"],
          ["returns", "Returns"],
          ["cancelled", "Cancelled"],
        ].map(([v, l]) => (
          <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>
            {l}
          </button>
        ))}
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : !data?.orders.length ? (
        <Empty title="No orders here" action={<Link className="btn" to="/shop">Start shopping</Link>} />
      ) : (
        data.orders.map((o) => <OrderRow key={o.number} o={o} />)
      )}
    </div>
  );
}

export function OrderTimeline({ o }: { o: OrderDetail }) {
  return (
    <ol className="timeline">
      {o.history.map((h, i) => (
        <li key={i} className="done">
          <strong className="small">{h.label}</strong>
          <div className="tiny muted">
            {dateTime(h.at)}
            {h.actor ? ` · ${h.actor}` : ""}
          </div>
          {h.note && <div className="small">{h.note}</div>}
        </li>
      ))}
    </ol>
  );
}

export function OrderLines({ o }: { o: OrderDetail }) {
  return (
    <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
      {o.items.map((i) => (
        <div key={i.id} className="row" style={{ "--gap": "14px", padding: "8px 0", borderBottom: "1px solid var(--border)" } as React.CSSProperties}>
          {i.image && <img src={i.image} alt="" style={{ width: 56, height: 56, objectFit: "contain", background: "var(--surface-2)", borderRadius: 8 }} />}
          <span style={{ flex: 1 }} className="small">
            <Link to={`/product/${i.productSlug}`} style={{ fontWeight: 600 }}>
              {i.productName}
            </Link>
            <br />
            <span className="muted">
              {i.variantName !== "Standard" && `${i.variantName} · `}SKU {i.sku} · Qty {i.quantity}
              {i.returnedQty > 0 && ` · ${i.returnedQty} returned`}
            </span>
          </span>
          <span className="num small">{inr(i.lineTotalPaise)}</span>
        </div>
      ))}
      <div className="sum-row small">
        <span>Subtotal</span>
        <span>{inr(o.subtotalPaise)}</span>
      </div>
      {o.discountPaise > 0 && (
        <div className="sum-row small">
          <span>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</span>
          <span>−{inr(o.discountPaise)}</span>
        </div>
      )}
      <div className="sum-row small">
        <span>Shipping</span>
        <span>{o.shippingPaise ? inr(o.shippingPaise) : "Free"}</span>
      </div>
      <div className="sum-row total">
        <span>Total</span>
        <span>{inr(o.totalPaise)}</span>
      </div>
      {o.pointsPaise > 0 && (
        <div className="sum-row small">
          <span>Paid with points ({o.pointsUsed})</span>
          <span>−{inr(o.pointsPaise)}</span>
        </div>
      )}
      {o.giftCardPaise > 0 && (
        <div className="sum-row small">
          <span>Paid with gift card</span>
          <span>−{inr(o.giftCardPaise)}</span>
        </div>
      )}
      {(o.pointsPaise > 0 || o.giftCardPaise > 0) && (
        <div className="sum-row small" style={{ fontWeight: 700 }}>
          <span>Paid by card / cash</span>
          <span>{inr(o.totalPaise)}</span>
        </div>
      )}
      {o.refundedPaise > 0 && (
        <div className="sum-row small" style={{ color: "var(--success)" }}>
          <span>Refunded</span>
          <span>{inr(o.refundedPaise)}</span>
        </div>
      )}
      <p className="tiny muted">{o.taxNote}</p>
    </div>
  );
}

export function ShipmentTracking({ o }: { o: OrderDetail }) {
  if (!o.shipments.length) return <p className="small muted">Tracking appears here once your order is ready for dispatch.</p>;
  return (
    <>
      {o.shipments.map((s) => (
        <div key={s.id} className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
          <div className="small">
            {s.courierName ? `${s.courierName} · ` : ""}Tracking <strong>{s.trackingNumber}</strong> <StatusBadge status={s.status} />
            {s.trackingUrl && (
              <>
                {" "}
                <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer">
                  Track with courier
                </a>
              </>
            )}
            {s.labelUrl && (
              <>
                {" · "}
                <a href={s.labelUrl} target="_blank" rel="noopener noreferrer">
                  Shipping label
                </a>
              </>
            )}
          </div>
          {s.partner && (
            <div className="small muted">
              Delivery partner: {s.partner.name}
              {s.partner.phone && <> · <a href={`tel:${s.partner.phone}`}>{s.partner.phone}</a></>}
              {s.partner.failureReason && <> · {s.partner.failureReason}</>}
            </div>
          )}
          {s.events.length > 0 && (
            <ol className="timeline">
              {s.events.map((e, i) => (
                <li key={i} className="done">
                  <strong className="small">{e.label}</strong>
                  <div className="tiny muted">{dateTime(e.at)}</div>
                  {e.reason && <div className="small">{e.reason}</div>}
                </li>
              ))}
            </ol>
          )}
          {s.proof && (
            <div className="small">
              Delivered to {s.proof.recipientName} on {dateTime(s.proof.deliveredAt)}
              {s.proof.otpVerified ? " · confirmed with your delivery code" : ""}.
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function OrderPage() {
  const { number = "" } = useParams();
  const { data, error, loading, reload, setData } = useApi<{ order: OrderDetail }>(`/orders/${number}`);
  const [modal, setModal] = useState<"cancel" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const [retSel, setRetSel] = useState<Record<number, number>>({});
  const [retReason, setRetReason] = useState("Damaged or defective");
  const [retKind, setRetKind] = useState<"return" | "exchange">("return");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  useTitle(`Order ${number}`, { noindex: true });
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorState error={error} retry={reload} />;
  const o = data.order;

  const submit = async (fn: () => Promise<{ order: OrderDetail }>, msg: string) => {
    setBusy(true);
    setErr(null);
    try {
      setData(await fn());
      setModal(null);
      toast(msg, "success");
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="spread">
        <div>
          <Link to="/account/orders" className="small">
            ← Orders
          </Link>
          <h2 className="h2" style={{ marginTop: 6 }}>
            Order {o.number}
          </h2>
          <div className="small muted">
            Placed {dateTime(o.placedAt)} · Sold by {o.storeName}
          </div>
        </div>
        <div className="row">
          <StatusBadge status={o.status} label={o.statusLabel} />
          {!["pending_payment", "failed", "expired"].includes(o.status) && (
            <a className="btn btn-outline btn-sm" href={`/api/orders/${o.number}/invoice`} target="_blank" rel="noopener">
              Invoice
            </a>
          )}
          <Link className="btn btn-ghost btn-sm" to={`/contact?order=${o.number}&subject=${encodeURIComponent(`Help with order ${o.number}`)}`}>
            Get help
          </Link>
        </div>
      </div>

      {o.eligibility.retryPayment && (
        <div className="alert alert-warning">
          <span>
            Payment for this order hasn't been completed. Items are reserved for a limited time.{" "}
            <button
              className="link"
              onClick={async () => {
                try {
                  const r = await api.post<{ razorpay: any }>(`/checkout/${o.checkoutId}/retry-payment`);
                  const res = await payWithRazorpay(o.checkoutId, r.razorpay);
                  if (res !== "dismissed") navigate(`/order-placed/${o.checkoutId}`);
                } catch (e) {
                  toast(errorMessage(e), "error");
                }
              }}
            >
              Pay now
            </button>
          </span>
        </div>
      )}

      <div className="two-col">
        <div className="stack" style={{ "--gap": "24px" } as React.CSSProperties}>
          <section className="card stack">
            <h3 className="h3">Items</h3>
            <OrderLines o={o} />
          </section>
          <section className="card stack">
            <h3 className="h3">Delivery tracking</h3>
            <ShipmentTracking o={o} />
          </section>
          {(o.returns.length > 0 || o.refunds.length > 0) && (
            <section className="card stack">
              <h3 className="h3">Returns & refunds</h3>
              {o.returns.map((r) => (
                <div key={r.id} className="small">
                  {r.kind === "exchange" ? "Exchange" : "Return"} #{r.id}: <StatusBadge status={r.status} /> — {r.reason}
                  {r.resolutionNote && <div className="muted">{r.resolutionNote}</div>}
                </div>
              ))}
              {o.refunds.map((r) => (
                <div key={r.id} className="small">
                  Refund of {inr(r.amountPaise)}: <StatusBadge status={r.status === "manual" ? "pending" : r.status} label={r.status === "manual" ? "Being arranged by our team" : undefined} />
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="stack">
          <section className="card stack" style={{ "--gap": "8px" } as React.CSSProperties}>
            <h3 className="h3">Delivery address</h3>
            <div className="small">
              {o.shippingAddress.name}
              <br />
              {formatAddress(o.shippingAddress)}
              <br />
              {o.shippingAddress.phone}
            </div>
            <h3 className="h3" style={{ marginTop: 10 }}>
              Payment
            </h3>
            <div className="small">
              {o.paymentMethod === "cod" ? "Cash on delivery" : "Online"} · <StatusBadge status={o.paymentStatus} />
            </div>
          </section>
          <section className="card stack">
            <h3 className="h3">Status history</h3>
            <OrderTimeline o={o} />
          </section>
          {(o.eligibility.cancel || o.eligibility.return) && (
            <section className="card stack">
              {o.eligibility.cancel && (
                <button className="btn btn-outline" onClick={() => (setErr(null), setModal("cancel"))}>
                  {o.eligibility.cancelNeedsApproval ? "Request cancellation" : "Cancel order"}
                </button>
              )}
              {o.eligibility.return && (
                <>
                  <button className="btn btn-outline" onClick={() => (setErr(null), setModal("return"))}>
                    Return or exchange
                  </button>
                  <span className="tiny muted">Eligible until {date(o.eligibility.returnDeadline)}</span>
                </>
              )}
            </section>
          )}
        </aside>
      </div>

      {modal === "cancel" && (
        <Modal title={o.eligibility.cancelNeedsApproval ? "Request cancellation" : "Cancel order"} onClose={() => setModal(null)}>
          <div className="stack">
            <p className="small muted">
              {o.eligibility.cancelNeedsApproval
                ? "Your order is being prepared, so the seller needs to approve the cancellation."
                : o.paymentStatus === "paid"
                  ? "Your payment will be refunded to the original payment method."
                  : "Your order will be cancelled right away."}
            </p>
            <TextArea label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
            {err && <div className="alert alert-danger">{err}</div>}
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>
                Keep order
              </button>
              <Button className="btn-danger" loading={busy} onClick={() => submit(() => api.post(`/orders/${o.number}/cancel`, { reason }), o.eligibility.cancelNeedsApproval ? "Cancellation requested." : "Order cancelled.")}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {modal === "return" && (
        <Modal title="Return or exchange" onClose={() => setModal(null)} wide>
          <div className="stack">
            <div className="row" role="radiogroup" aria-label="Request type">
              {(["return", "exchange"] as const).map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={retKind === k} onClick={() => setRetKind(k)}>
                  {k === "return" ? "Return for refund" : "Exchange"}
                </button>
              ))}
            </div>
            {o.items
              .filter((i) => i.quantity > i.returnedQty)
              .map((i) => (
                <label key={i.id} className="check">
                  <input type="checkbox" checked={Boolean(retSel[i.id])} onChange={(e) => setRetSel({ ...retSel, [i.id]: e.target.checked ? i.quantity - i.returnedQty : 0 })} />
                  <span>
                    {i.productName} {i.variantName !== "Standard" && `(${i.variantName})`} × {i.quantity - i.returnedQty}
                  </span>
                </label>
              ))}
            <SelectField label="Reason" value={retReason} onChange={(e) => setRetReason(e.target.value)}>
              {["Damaged or defective", "Wrong item received", "Not as described", "Size or fit issue", "Changed my mind", "Other"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </SelectField>
            <TextArea label="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} />
            {err && <div className="alert alert-danger">{err}</div>}
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <Button
                loading={busy}
                disabled={!Object.values(retSel).some(Boolean)}
                onClick={() =>
                  submit(
                    () =>
                      api.post(`/orders/${o.number}/returns`, {
                        kind: retKind,
                        reason: retReason,
                        details,
                        items: Object.entries(retSel)
                          .filter(([, q]) => q > 0)
                          .map(([id, quantity]) => ({ orderItemId: Number(id), quantity })),
                      }),
                    "Request submitted. We'll email you the next steps.",
                  )
                }
              >
                Submit request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Wishlist() {
  const { data, error, loading, reload } = useApi<{ items: (Card & { savedAt: string; unavailable: boolean })[] }>("/wishlist");
  const { setCartCount } = useAuth();
  const toast = useToast();
  useTitle("Wishlist", { noindex: true });
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  if (!data?.items.length) return <Empty title="Your wishlist is empty" action={<Link className="btn" to="/shop">Discover products</Link>}>Tap the heart on any product to save it here.</Empty>;
  return (
    <div className="product-grid">
      {data.items.map((p) => (
        <div key={p.id} className="product-card" style={{ cursor: "default" }}>
          <Link to={`/product/${p.slug}`} className="media">
            {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
          </Link>
          <div className="body stack" style={{ "--gap": "8px" } as React.CSSProperties}>
            <span className="brand">{p.brand}</span>
            <Link to={`/product/${p.slug}`} className="name" style={{ textDecoration: "none" }}>
              {p.name}
            </Link>
            <Price paise={p.pricePaise} compareAt={p.compareAtPaise} />
            {p.unavailable ? <span className="badge badge-danger">No longer available</span> : !p.inStock && <span className="badge badge-warning">Out of stock</span>}
            <div className="row">
              {!p.unavailable && p.inStock && (
                <button
                  className="btn btn-sm"
                  onClick={async () => {
                    try {
                      const r = await api.post<{ cart: { itemCount: number } }>(`/wishlist/${p.id}/move-to-cart`);
                      setCartCount(r.cart.itemCount);
                      toast("Moved to your bag.", "success", { label: "View bag", href: "/cart" });
                      reload();
                    } catch (e) {
                      toast(errorMessage(e), "error");
                    }
                  }}
                >
                  Move to bag
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => api.del(`/wishlist/${p.id}`).then(reload)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Addresses() {
  const { data, error, loading, reload } = useApi<{ addresses: Address[] }>("/account/addresses");
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const toast = useToast();
  useTitle("Addresses", { noindex: true });
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  return (
    <div className="stack">
      <div>
        <button className="btn" onClick={() => setEditing("new")}>
          + Add address
        </button>
      </div>
      {!data?.addresses.length && <p className="muted">No saved addresses yet.</p>}
      <div className="grid" style={{ "--min": "280px" } as React.CSSProperties}>
        {data?.addresses.map((a) => (
          <div key={a.id} className="card stack" style={{ "--gap": "6px" } as React.CSSProperties}>
            <div className="row">
              <strong>{a.name}</strong>
              <span className="badge badge-plain">{a.label}</span>
              {a.isDefault && <span className="badge badge-gold">Default</span>}
            </div>
            <span className="small muted">{formatAddress(a)}</span>
            <span className="small muted">{a.phone}</span>
            <div className="row" style={{ marginTop: 6 }}>
              <button className="link small" onClick={() => setEditing(a)}>
                Edit
              </button>
              <button
                className="link small"
                onClick={() =>
                  confirm("Delete this address?") &&
                  api
                    .del(`/account/addresses/${a.id}`)
                    .then(reload)
                    .catch((e) => toast(errorMessage(e), "error"))
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title={editing === "new" ? "New address" : "Edit address"} onClose={() => setEditing(null)} wide>
          <AddressForm initial={editing === "new" ? undefined : editing} onCancel={() => setEditing(null)} onSaved={() => (setEditing(null), reload(), toast("Address saved.", "success"))} />
        </Modal>
      )}
    </div>
  );
}

function Notifications() {
  const { data, error, loading, reload } = useApi<{ notifications: { id: number; title: string; body: string; link: string | null; read: boolean; createdAt: string }[]; unread: number }>("/account/notifications");
  const { refresh } = useAuth();
  const navigate = useNavigate();
  useTitle("Notifications", { noindex: true });
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  if (!data?.notifications.length) return <Empty title="No notifications yet">Order updates, price drops and security alerts will appear here.</Empty>;
  return (
    <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
      {data.unread > 0 && (
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => api.post("/account/notifications/read-all").then(() => (reload(), refresh()))}>
            Mark all as read
          </button>
        </div>
      )}
      {data.notifications.map((n) => (
        <button
          key={n.id}
          type="button"
          className="card card-flat"
          style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit", borderLeft: n.read ? undefined : "3px solid var(--gold)" }}
          onClick={async () => {
            if (!n.read) await api.post(`/account/notifications/${n.id}/read`).catch(() => {});
            refresh();
            if (n.link) navigate(n.link);
            else reload();
          }}
        >
          <div className="spread">
            <strong className="small">
              {!n.read && <span className="sr-only">Unread: </span>}
              {n.title}
            </strong>
            <span className="tiny muted">{relative(n.createdAt)}</span>
          </div>
          {n.body && <p className="small muted" style={{ marginTop: 4 }}>{n.body}</p>}
        </button>
      ))}
    </div>
  );
}

function Support() {
  const { id } = useParams();
  const list = useApi<{ tickets: { id: number; subject: string; status: string; updated_at: string; order_number: string | null }[] }>(id ? null : "/support/tickets");
  const one = useApi<{ ticket: { id: number; subject: string; status: string }; messages: { body: string; is_staff: number; author: string; created_at: string }[] }>(id ? `/support/tickets/${id}` : null);
  const [reply, setReply] = useState("");
  useTitle("Support", { noindex: true });
  if (id) {
    if (one.error) return <ErrorState error={one.error} />;
    if (!one.data) return <Loading />;
    return (
      <div className="stack container-narrow" style={{ padding: 0 }}>
        <Link to="/account/support" className="small">
          ← All requests
        </Link>
        <div className="spread">
          <h2 className="h2">{one.data.ticket.subject}</h2>
          <StatusBadge status={one.data.ticket.status} />
        </div>
        {one.data.messages.map((m, i) => (
          <div key={i} className="card card-flat" style={{ background: m.is_staff ? "var(--surface-2)" : undefined }}>
            <div className="tiny muted">
              {m.author} · {dateTime(m.created_at)}
            </div>
            <p className="small" style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
              {m.body}
            </p>
          </div>
        ))}
        <form className="stack" onSubmit={(e) => (e.preventDefault(), api.post(`/support/tickets/${id}/reply`, { message: reply }).then(() => (setReply(""), one.reload())))}>
          <TextArea label="Reply" value={reply} onChange={(e) => setReply(e.target.value)} />
          <Button type="submit" disabled={reply.trim().length < 2}>
            Send
          </Button>
        </form>
      </div>
    );
  }
  return (
    <div className="stack">
      <div>
        <Link className="btn" to="/contact">
          New request
        </Link>
      </div>
      {list.data?.tickets.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Request</th>
                <th>Order</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {list.data.tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/account/support/${t.id}`}>
                      #{t.id} {t.subject}
                    </Link>
                  </td>
                  <td>{t.order_number ?? "—"}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{relative(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">You haven't contacted support yet.</p>
      )}
    </div>
  );
}

interface RewardsData {
  balance: number;
  loyalty: { enabled: boolean; pointsPerHundredRupees: number; pointValuePaise: number; maxRedeemPercent: number };
  ledger: { delta: number; reason: string; ref_type: string | null; ref_id: string | null; created_at: string }[];
  referral: { enabled: boolean; code: string; referrerPoints: number; refereePoints: number; invited: number; rewarded: number };
}

const REASONS: Record<string, string> = {
  order_earned: "Earned on an order",
  redeemed: "Used at checkout",
  order_credit_restored: "Returned from a cancelled order",
  return_reversed: "Reversed for returned items",
  refund: "Returned with a refund",
  referral_referrer: "Friend referral bonus",
  referral_referee: "Welcome referral bonus",
  admin_adjustment: "Adjustment by CrownCart",
};

function Rewards() {
  const { data, error } = useApi<RewardsData>("/account/rewards");
  const toast = useToast();
  const [code, setCode] = useState("");
  const [card, setCard] = useState<{ code: string; balancePaise: number; expiresAt: string | null } | null>(null);
  useTitle("Rewards", { noindex: true });
  if (error) return <ErrorState error={error} />;
  if (!data) return <Loading />;
  const link = `${location.origin}/?ref=${data.referral.code}`;
  return (
    <div className="grid" style={{ "--min": "320px", alignItems: "start" } as React.CSSProperties}>
      <section className="card stack">
        <div className="eyebrow">CrownCart points</div>
        <div className="display" style={{ fontSize: 48 }}>
          {data.balance}
        </div>
        <p className="small muted">
          Worth {inr(data.balance * data.loyalty.pointValuePaise)}.{" "}
          {data.loyalty.enabled
            ? `Earn ${data.loyalty.pointsPerHundredRupees} point${data.loyalty.pointsPerHundredRupees === 1 ? "" : "s"} for every ₹100 you spend once your order is delivered, and use them for up to ${data.loyalty.maxRedeemPercent}% of an order at checkout.`
            : "Points are paused right now."}
        </p>
      </section>

      {data.referral.enabled && (
        <section className="card stack">
          <div className="eyebrow">Invite friends</div>
          <p className="small">
            Share your link. When a friend signs up with it and receives their first order, you get <strong>{data.referral.referrerPoints}</strong> points and they get{" "}
            <strong>{data.referral.refereePoints}</strong>.
          </p>
          <div className="row">
            <input className="input" style={{ flex: 1 }} readOnly value={link} aria-label="Your referral link" onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                navigator.clipboard
                  .writeText(link)
                  .then(() => toast("Link copied.", "success"))
                  .catch(() => toast("Copy the link from the box.", "info"))
              }
            >
              Copy
            </button>
          </div>
          <span className="tiny muted">
            Code {data.referral.code} · {data.referral.invited} joined · {data.referral.rewarded} rewarded
          </span>
        </section>
      )}

      <section className="card stack">
        <div className="eyebrow">Gift card balance</div>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setCard(await api.get(`/account/gift-cards/${encodeURIComponent(code.trim())}`));
            } catch (err) {
              setCard(null);
              toast(errorMessage(err), "error");
            }
          }}
        >
          <input className="input" style={{ flex: 1 }} placeholder="CC-XXXX-XXXX-XXXX" aria-label="Gift card code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-outline btn-sm" type="submit" disabled={!code.trim()}>
            Check
          </button>
        </form>
        {card && (
          <p className="small">
            {card.code}: <strong>{inr(card.balancePaise)}</strong> available{card.expiresAt ? `, valid until ${date(card.expiresAt)}` : ""}. Enter the code at checkout to use it.
          </p>
        )}
      </section>

      <section className="card stack" style={{ gridColumn: "1 / -1" }}>
        <h2 className="h3">Points history</h2>
        {data.ledger.length === 0 ? (
          <p className="small muted">No points yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th className="r">Points</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((l, i) => (
                  <tr key={i}>
                    <td>{date(l.created_at)}</td>
                    <td>{REASONS[l.reason] ?? l.reason}</td>
                    <td className="r num" style={{ color: l.delta > 0 ? "var(--success)" : undefined }}>
                      {l.delta > 0 ? `+${l.delta}` : l.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Settings() {
  const { user, refresh, signOut } = useAuth();
  const profile = useApi<{ name: string; phone: string | null; email: string; preferences: Record<string, any>; hasPassword: boolean; googleLinked: boolean }>("/account/profile");
  const sessions = useApi<{ sessions: { id: string; current: boolean; lastSeenAt: string; ip: string; userAgent: string }[] }>("/auth/sessions");
  const { motion, setMotion } = useTheme();
  const toast = useToast();
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delErr, setDelErr] = useState<string | null>(null);
  useTitle("Settings", { noindex: true });
  if (!profile.data) return profile.error ? <ErrorState error={profile.error} /> : <Loading />;
  const prefs = profile.data.preferences;
  const setPref = (k: string, v: unknown) =>
    api
      .patch("/account/preferences", { [k]: v })
      .then(() => (profile.reload(), toast("Preference saved.", "success")))
      .catch((e) => toast(errorMessage(e), "error"));

  return (
    <div className="grid" style={{ "--min": "340px", alignItems: "start" } as React.CSSProperties}>
      <form
        className="card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          try {
            await api.patch("/account/profile", { name: fd.get("name"), phone: fd.get("phone") });
            await refresh();
            toast("Profile updated.", "success");
          } catch (err) {
            toast(errorMessage(err), "error");
          }
        }}
      >
        <h2 className="h3">Profile</h2>
        <TextField label="Name" name="name" defaultValue={profile.data.name} required />
        <TextField label="Email" value={profile.data.email} disabled hint={user?.emailVerified ? "Verified" : "Not verified yet"} />
        <TextField label="Mobile" name="phone" type="tel" defaultValue={profile.data.phone ?? ""} />
        <Button type="submit">Save profile</Button>
      </form>

      <form
        className="card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setPwErr(null);
          try {
            await api.post("/auth/change-password", pw);
            setPw({ currentPassword: "", newPassword: "" });
            toast("Password changed. Other sessions were signed out.", "success");
            sessions.reload();
          } catch (err) {
            setPwErr(errorMessage(err));
          }
        }}
      >
        <h2 className="h3">Password</h2>
        {profile.data.googleLinked && <p className="small muted">Your account is linked to Google sign-in.</p>}
        {profile.data.hasPassword ? (
          <>
            <PasswordField label="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <PasswordField label="New password" autoComplete="new-password" showStrength value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            {pwErr && <div className="alert alert-danger">{pwErr}</div>}
            <Button type="submit">Change password</Button>
          </>
        ) : (
          <>
            <p className="small">You sign in with Google and haven't set a password. We can email you a link to add one.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => api.post("/auth/forgot-password", { email: profile.data!.email }).then(() => toast("Check your email for a link to set a password.", "success"))}
            >
              Email me a link
            </button>
          </>
        )}
      </form>

      <section className="card stack">
        <h2 className="h3">Appearance</h2>
        <ThemeSwitch />
        <label className="check">
          <input type="checkbox" checked={motion === "reduced"} onChange={(e) => setMotion(e.target.checked ? "reduced" : "full")} />
          <span>Reduce motion (also turns off the 3D homepage scene)</span>
        </label>
      </section>

      <section className="card stack">
        <h2 className="h3">Notifications</h2>
        {[
          ["marketingEmails", "News, new arrivals and offers by email"],
          ["priceDropAlerts", "Price drops on wishlist items"],
          ["backInStockAlerts", "Back-in-stock alerts"],
        ].map(([k, l]) => (
          <label key={k} className="check">
            <input type="checkbox" checked={prefs[k] !== false && (k !== "marketingEmails" || prefs[k] === true)} onChange={(e) => setPref(k, e.target.checked)} />
            <span>{l}</span>
          </label>
        ))}
        <div className="label" style={{ marginTop: 8 }}>
          Text messages
        </div>
        {[
          ["smsAlerts", "SMS updates about my orders"],
          ["whatsappAlerts", "WhatsApp updates about my orders"],
        ].map(([k, l]) => (
          <label key={k} className="check">
            <input type="checkbox" checked={prefs[k] === true} onChange={(e) => setPref(k, e.target.checked)} />
            <span>{l}</span>
          </label>
        ))}
        <p className="tiny muted">
          Sent to the phone number on each order: order confirmation, out-for-delivery (with your delivery code) and delivered. Off unless you turn it on. Order and security emails are always sent.
        </p>
      </section>

      <section className="card stack">
        <div className="spread">
          <h2 className="h3">Active sessions</h2>
          <button className="link small" onClick={() => api.post("/auth/sessions/revoke-others").then(() => (sessions.reload(), toast("Signed out of other sessions.", "success")))}>
            Sign out others
          </button>
        </div>
        {sessions.data?.sessions.map((s) => (
          <div key={s.id} className="spread small">
            <span>
              {/Mobile/.test(s.userAgent) ? "Phone" : "Computer"} · {s.ip}
              <br />
              <span className="tiny muted">{s.current ? "This device" : `Last active ${relative(s.lastSeenAt)}`}</span>
            </span>
            {!s.current && (
              <button className="link small" onClick={() => api.del(`/auth/sessions/${s.id}`).then(sessions.reload)}>
                Sign out
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="card stack">
        <h2 className="h3">Delete account</h2>
        <p className="small muted">Your personal details are removed. Order records are kept anonymously because they are financial records.</p>
        <button className="btn btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => setDel(true)}>
          Delete my account
        </button>
      </section>

      {del && (
        <Modal title="Delete your account?" onClose={() => setDel(false)}>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setDelErr(null);
              try {
                await api.post("/account/delete", { password: delPw });
                await signOut();
              } catch (err) {
                setDelErr(errorMessage(err));
              }
            }}
          >
            <p className="small">This can't be undone.{profile.data.hasPassword ? " Enter your password to confirm." : ""}</p>
            {profile.data.hasPassword && <PasswordField label="Password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} />}
            {delErr && <div className="alert alert-danger">{delErr}</div>}
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDel(false)}>
                Cancel
              </button>
              <Button className="btn-danger" type="submit">
                Delete account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function Account() {
  return (
    <Shell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:number" element={<OrderPage />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:id" element={<Support />} />
        <Route path="settings" element={<Settings />} />
        <Route path="security" element={<Settings />} />
        <Route path="*" element={<Empty title="Not found" />} />
      </Routes>
    </Shell>
  );
}
