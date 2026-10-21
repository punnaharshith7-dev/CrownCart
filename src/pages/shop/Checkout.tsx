import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StoreLayout } from "../../components/SiteHeader";
import { AddressForm, formatAddress, type Address } from "../../components/AddressForm";
import { Button, Empty, ErrorState, Loading, Modal } from "../../components/ui";
import { ApiError, api, errorMessage, newRequestId } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { inr } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useTitle } from "../../lib/useApi";
import { Summary, savedCoupon, type CartSummary } from "./Cart";

interface Options {
  summary: CartSummary;
  addresses: Address[];
  payments: { method: "cod" | "razorpay"; label: string; available: boolean; reason: string | null }[];
  delivery: { estimateDaysMin: number; estimateDaysMax: number };
  requireVerifiedEmail: boolean;
}
interface RazorpayInit {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  prefill: { name: string; email: string; contact: string };
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: any) => void) => void };
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout. Success here is only a claim — the server verifies it with Razorpay. */
export async function payWithRazorpay(checkoutId: number, init: RazorpayInit): Promise<"paid" | "pending" | "dismissed"> {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: init.keyId,
      order_id: init.orderId,
      amount: init.amount,
      currency: init.currency,
      name: init.name,
      prefill: init.prefill,
      theme: { color: "#111111" },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const v = await api.post<{ status: "paid" | "pending" }>("/payments/razorpay/verify", { checkoutId, ...r });
          resolve(v.status);
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve("dismissed") },
    });
    rz.on("payment.failed", (r: any) => {
      api.post("/payments/razorpay/failed", { checkoutId, reason: r?.error?.description ?? "Payment failed." }).catch(() => {});
    });
    rz.open();
  });
}

export default function Checkout() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [opts, setOpts] = useState<Options | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [method, setMethod] = useState<"cod" | "razorpay" | null>(null);
  const [adding, setAdding] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  // One key per checkout attempt: a double click or retry can never create two orders.
  const idempotencyKey = useRef(newRequestId());
  const coupon = savedCoupon();
  useTitle("Checkout", { noindex: true });

  const load = async () => {
    try {
      const o = await api.get<Options>(`/checkout/options${coupon ? `?coupon=${encodeURIComponent(coupon)}` : ""}`);
      setOpts(o);
      setAddressId((cur) => cur ?? o.addresses.find((a) => a.isDefault && a.serviceable)?.id ?? o.addresses.find((a) => a.serviceable)?.id ?? null);
      setMethod((cur) => cur ?? o.payments.find((p) => p.available)?.method ?? null);
    } catch (e) {
      setError(e);
    }
  };
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <StoreLayout><ErrorState error={error} retry={load} /></StoreLayout>;
  if (!opts) return <StoreLayout><Loading /></StoreLayout>;
  if (opts.summary.lines.length === 0)
    return (
      <StoreLayout>
        <Empty title="Your bag is empty" action={<Link className="btn" to="/shop">Shop now</Link>} />
      </StoreLayout>
    );

  const address = opts.addresses.find((a) => a.id === addressId);
  const canPlace = Boolean(address?.serviceable && method && !opts.summary.checkoutBlocked && !opts.requireVerifiedEmail);

  const place = async () => {
    if (!canPlace || placing) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const r = await api.post<{ checkoutId: number; status: string; orders: string[]; razorpay: RazorpayInit | null }>("/checkout/place", {
        addressId,
        paymentMethod: method,
        couponCode: opts.summary.coupon?.code ?? null,
        idempotencyKey: idempotencyKey.current,
        expectedTotalPaise: opts.summary.totalPaise,
      });
      if (r.razorpay) {
        const result = await payWithRazorpay(r.checkoutId, r.razorpay);
        if (result === "dismissed") {
          toast("Payment was not completed. You can retry from your orders before the reservation expires.", "info");
          navigate(`/account/orders/${r.orders[0]}`);
          return;
        }
      }
      await refresh();
      navigate(`/order-placed/${r.checkoutId}`, { replace: true });
    } catch (e) {
      setPlaceError(errorMessage(e));
      if (e instanceof ApiError && e.details?.reason === "total_changed") load();
      setPlacing(false);
    }
  };

  return (
    <StoreLayout>
      <div className="container page">
        <div className="steps" aria-label="Checkout steps">
          <span>Bag</span>›<span className="on">Delivery & payment</span>›<span>Confirmation</span>
        </div>
        <h1 className="display" style={{ marginBottom: 24 }}>
          Checkout
        </h1>
        {opts.requireVerifiedEmail && (
          <div className="alert alert-warning" style={{ marginBottom: 20 }}>
            <span>
              Please verify your email ({user?.email}) before placing an order.{" "}
              <button className="link" onClick={() => api.post("/auth/resend-verification").then(() => toast("Verification email sent.", "success")).catch((e) => toast(errorMessage(e), "error"))}>
                Resend verification email
              </button>
            </span>
          </div>
        )}
        <div className="two-col">
          <div className="stack" style={{ "--gap": "28px" } as React.CSSProperties}>
            <section aria-labelledby="addr-h" className="stack">
              <div className="spread">
                <h2 className="h3" id="addr-h">
                  1. Delivery address
                </h2>
                <button className="btn btn-outline btn-sm" onClick={() => setAdding(true)}>
                  + Add address
                </button>
              </div>
              {opts.addresses.length === 0 && <p className="muted small">Add a delivery address to continue.</p>}
              <div className="stack" role="radiogroup" aria-labelledby="addr-h" style={{ "--gap": "10px" } as React.CSSProperties}>
                {opts.addresses.map((a) => (
                  <label key={a.id} className="choice" aria-disabled={!a.serviceable}>
                    <input type="radio" name="address" checked={addressId === a.id} disabled={!a.serviceable} onChange={() => setAddressId(a.id)} />
                    <span className="stack" style={{ "--gap": "2px" } as React.CSSProperties}>
                      <strong>
                        {a.name} <span className="badge badge-plain">{a.label}</span>
                      </strong>
                      <span className="small muted">{formatAddress(a)}</span>
                      <span className="small muted">{a.phone}</span>
                      {!a.serviceable && <span className="small" style={{ color: "var(--danger)" }}>We don't deliver to this PIN code yet.</span>}
                    </span>
                  </label>
                ))}
              </div>
              <p className="small muted">
                Estimated delivery in {opts.delivery.estimateDaysMin}–{opts.delivery.estimateDaysMax} days after dispatch.
              </p>
            </section>

            <section aria-labelledby="pay-h" className="stack">
              <h2 className="h3" id="pay-h">
                2. Payment
              </h2>
              <div className="stack" role="radiogroup" aria-labelledby="pay-h" style={{ "--gap": "10px" } as React.CSSProperties}>
                {opts.payments.map((p) => (
                  <label key={p.method} className="choice" aria-disabled={!p.available}>
                    <input type="radio" name="payment" checked={method === p.method} disabled={!p.available} onChange={() => setMethod(p.method)} />
                    <span className="stack" style={{ "--gap": "2px" } as React.CSSProperties}>
                      <strong>{p.label}</strong>
                      {p.reason && <span className="small muted">{p.reason}</span>}
                    </span>
                  </label>
                ))}
              </div>
              <p className="tiny muted">Card and UPI details are entered with the payment provider. CrownCart never sees or stores them.</p>
            </section>

            <section aria-labelledby="review-h" className="stack">
              <h2 className="h3" id="review-h">
                3. Review items
              </h2>
              {opts.summary.lines.map((l) => (
                <div key={l.itemId} className="row" style={{ "--gap": "14px" } as React.CSSProperties}>
                  {l.image && <img src={l.image} alt="" style={{ width: 56, height: 56, objectFit: "contain", background: "var(--surface-2)", borderRadius: 8 }} />}
                  <span style={{ flex: 1 }} className="small">
                    <strong>{l.productName}</strong>
                    <br />
                    <span className="muted">
                      {l.variantName !== "Standard" && `${l.variantName} · `}Qty {l.quantity}
                    </span>
                  </span>
                  <span className="num small">{inr(l.lineTotalPaise)}</span>
                </div>
              ))}
            </section>
          </div>

          <aside className="sticky-summary">
            <Summary cart={opts.summary}>
              {placeError && (
                <div className="alert alert-danger" role="alert" style={{ marginTop: 10 }}>
                  {placeError}
                </div>
              )}
              <Button className="btn-lg btn-block" style={{ marginTop: 14 }} loading={placing} disabled={!canPlace} onClick={place}>
                {method === "cod" ? `Place order · ${inr(opts.summary.totalPaise)}` : `Pay ${inr(opts.summary.totalPaise)}`}
              </Button>
              <p className="tiny muted" style={{ marginTop: 8 }}>
                By placing your order you agree to our <Link to="/policies/terms">terms</Link> and <Link to="/policies/returns">return policy</Link>.
              </p>
            </Summary>
          </aside>
        </div>
      </div>
      {adding && (
        <Modal title="New address" onClose={() => setAdding(false)} wide>
          <AddressForm
            onCancel={() => setAdding(false)}
            onSaved={(a) => {
              setAdding(false);
              setAddressId(a.id);
              load();
            }}
          />
        </Modal>
      )}
    </StoreLayout>
  );
}
