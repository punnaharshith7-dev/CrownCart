import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StoreLayout } from "../../components/SiteHeader";
import { Button, Empty, ErrorState, Loading, Modal, Qty, RowSkeletons } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { inr } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useTitle } from "../../lib/useApi";
import { BounceHeading } from "../../components/BounceHeading";

export interface Line {
  itemId: number;
  variantId: number;
  productSlug: string;
  productName: string;
  variantName: string;
  image: string | null;
  storeName: string;
  quantity: number;
  unitPricePaise: number;
  compareAtPaise: number | null;
  lineTotalPaise: number;
  available: number;
  maxPerOrder: number;
  issue: string | null;
}
export interface CartSummary {
  lines: Line[];
  saved: Line[];
  groups: { storeId: number; storeName: string; subtotalPaise: number; discountPaise: number; shippingPaise: number; totalPaise: number }[];
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
  payablePaise: number;
  loyalty: { enabled: boolean; balance: number; maxUsable: number; pointValuePaise: number; applied: number; appliedPaise: number };
  giftCard: { code: string; balancePaise: number; appliedPaise: number } | null;
  giftCardError: string | null;
}

const COUPON_KEY = "cc-coupon";
export const savedCoupon = () => {
  try {
    return sessionStorage.getItem(COUPON_KEY) ?? "";
  } catch {
    return "";
  }
};
export const storeCoupon = (c: string) => {
  try {
    c ? sessionStorage.setItem(COUPON_KEY, c) : sessionStorage.removeItem(COUPON_KEY);
  } catch {
    /* ignore */
  }
};

export function Summary({ cart, children }: { cart: CartSummary; children?: React.ReactNode }) {
  const remaining = cart.freeShippingThresholdPaise - (cart.subtotalPaise - cart.discountPaise);
  return (
    <div className="card stack" style={{ "--gap": "4px" } as React.CSSProperties}>
      <h2 className="h3" style={{ marginBottom: 8 }}>
        Order summary
      </h2>
      <div className="sum-row">
        <span>Subtotal ({cart.itemCount} item{cart.itemCount === 1 ? "" : "s"})</span>
        <span className="num">{inr(cart.subtotalPaise)}</span>
      </div>
      {cart.discountPaise > 0 && (
        <div className="sum-row" style={{ color: "var(--success)" }}>
          <span>Discount{cart.coupon ? ` (${cart.coupon.code})` : ""}</span>
          <span className="num">−{inr(cart.discountPaise)}</span>
        </div>
      )}
      <div className="sum-row">
        <span>Shipping{cart.groups.length > 1 ? ` (${cart.groups.length} shipments)` : ""}</span>
        <span className="num">{cart.shippingPaise ? inr(cart.shippingPaise) : "Free"}</span>
      </div>
      <div className="sum-row total">
        <span>Total</span>
        <span className="num">{inr(cart.totalPaise)}</span>
      </div>
      {cart.loyalty?.appliedPaise > 0 && (
        <div className="sum-row" style={{ color: "var(--success)" }}>
          <span>Points ({cart.loyalty.applied})</span>
          <span className="num">−{inr(cart.loyalty.appliedPaise)}</span>
        </div>
      )}
      {cart.giftCard && cart.giftCard.appliedPaise > 0 && (
        <div className="sum-row" style={{ color: "var(--success)" }}>
          <span>Gift card {cart.giftCard.code.slice(-4)}</span>
          <span className="num">−{inr(cart.giftCard.appliedPaise)}</span>
        </div>
      )}
      {cart.payablePaise !== cart.totalPaise && (
        <div className="sum-row total">
          <span>To pay</span>
          <span className="num">{inr(cart.payablePaise)}</span>
        </div>
      )}
      <p className="tiny muted">{cart.taxNote}</p>
      {remaining > 0 && cart.subtotalPaise > 0 && (
        <div className="stack" style={{ "--gap": "6px", marginTop: 10 } as React.CSSProperties}>
          <span className="small">Add {inr(remaining)} more for free shipping.</span>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${Math.min(100, ((cart.subtotalPaise - cart.discountPaise) / cart.freeShippingThresholdPaise) * 100)}%` }} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function LineRow({ l, onChange, saved }: { l: Line; onChange: (c: CartSummary) => void; saved?: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<CartSummary>, msg?: string) => {
    setBusy(true);
    try {
      onChange(await fn());
      if (msg) toast(msg, "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="line" aria-busy={busy}>
      <Link to={`/product/${l.productSlug}`}>{l.image ? <img src={l.image} alt="" /> : <div className="skeleton" style={{ width: 96, height: 96 }} />}</Link>
      <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
        <Link to={`/product/${l.productSlug}`} style={{ fontWeight: 600, textDecoration: "none" }}>
          {l.productName}
        </Link>
        <span className="small muted">
          {l.variantName !== "Standard" && <>{l.variantName} · </>}Sold by {l.storeName}
        </span>
        {l.issue && (
          <span className="badge badge-danger" role="alert">
            {l.issue}
          </span>
        )}
        <div className="row small">
          {!saved && l.available > 0 && (
            <Qty value={l.quantity} max={Math.max(l.quantity, Math.min(l.available, l.maxPerOrder))} onChange={(n) => act(() => api.patch(`/cart/items/${l.itemId}`, { quantity: n }))} label={`Quantity of ${l.productName}`} />
          )}
          <button type="button" className="link small" disabled={busy} onClick={() => act(() => api.patch(`/cart/items/${l.itemId}`, { savedForLater: !saved }), saved ? "Moved to your bag." : "Saved for later.")}>
            {saved ? "Move to bag" : "Save for later"}
          </button>
          <button type="button" className="link small" disabled={busy} onClick={() => act(() => api.post(`/cart/items/${l.itemId}/move-to-wishlist`), "Moved to your wishlist.")}>
            Move to wishlist
          </button>
          <button type="button" className="link small" disabled={busy} onClick={() => act(() => api.del(`/cart/items/${l.itemId}`), "Removed from your bag.")}>
            Remove
          </button>
        </div>
      </div>
      <div style={{ textAlign: "right" }} className="num">
        <div style={{ fontWeight: 700 }}>{inr(l.lineTotalPaise)}</div>
        {l.quantity > 1 && <div className="tiny muted">{inr(l.unitPricePaise)} each</div>}
      </div>
    </div>
  );
}

export default function Cart() {
  const { user, loading: authLoading, setCartCount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [coupon, setCoupon] = useState(savedCoupon());
  const [couponInput, setCouponInput] = useState(savedCoupon());
  const [confirmClear, setConfirmClear] = useState(false);
  useTitle("Your bag", { noindex: true });

  const load = async (code = coupon) => {
    try {
      setCart(await api.get<CartSummary>(`/cart${code ? `?coupon=${encodeURIComponent(code)}` : ""}`));
      setError(null);
    } catch (e) {
      setError(e);
    }
  };
  useEffect(() => {
    if (user) load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cart) setCartCount(cart.itemCount);
  }, [cart?.itemCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Applying a coupon re-fetches totals with it; the server decides whether it's valid.
  const update = (c: CartSummary) => (coupon ? load(coupon) : setCart(c));

  if (authLoading) return <StoreLayout><Loading /></StoreLayout>;
  if (!user)
    return (
      <StoreLayout>
        <div className="container page">
          <Empty title="Your bag" art="bag" action={<Link className="btn" to="/signin?returnTo=%2Fcart">Sign in to see your bag</Link>}>
            Your bag is saved to your account so it follows you across devices.
          </Empty>
        </div>
      </StoreLayout>
    );
  if (error) return <StoreLayout><ErrorState error={error} retry={() => load()} /></StoreLayout>;
  if (!cart) return <StoreLayout><div className="container page"><RowSkeletons /></div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="container page">
        <div className="page-head">
          <BounceHeading className="display">Your bag</BounceHeading>
          {cart.lines.length > 0 && (
            <button type="button" className="link small" onClick={() => setConfirmClear(true)}>
              Clear bag
            </button>
          )}
        </div>
        {cart.lines.length === 0 ? (
          <Empty title="Your bag is empty" art="bag" action={<Link className="btn" to="/shop">Continue shopping</Link>}>
            {cart.saved.length ? "You have items saved for later below." : "Discover something extraordinary."}
          </Empty>
        ) : (
          <div className="two-col">
            <section aria-label="Items in your bag">
              {cart.lines.map((l) => (
                <LineRow key={l.itemId} l={l} onChange={update} />
              ))}
              <Link to="/shop" className="small" style={{ display: "inline-block", marginTop: 16 }}>
                ← Continue shopping
              </Link>
            </section>
            <aside className="sticky-summary stack">
              <Summary cart={cart}>
                <form
                  className="row"
                  style={{ marginTop: 14, "--gap": "6px" } as React.CSSProperties}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const code = couponInput.trim().toUpperCase();
                    const next = await api.get<CartSummary>(`/cart${code ? `?coupon=${encodeURIComponent(code)}` : ""}`).catch(() => null);
                    if (!next) return;
                    setCart(next);
                    if (code && next.coupon) {
                      setCoupon(code);
                      storeCoupon(code);
                      toast(`Coupon ${code} applied.`, "success");
                    } else if (code) toast(next.couponError ?? "This coupon can't be used.", "error");
                  }}
                >
                  <label className="sr-only" htmlFor="coupon">
                    Coupon code
                  </label>
                  <input id="coupon" className="input" style={{ flex: 1 }} placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                  {coupon ? (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => (setCoupon(""), setCouponInput(""), storeCoupon(""), load(""))}>
                      Remove
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-outline btn-sm" disabled={!couponInput.trim()}>
                      Apply
                    </button>
                  )}
                </form>
                {cart.couponError && coupon && <span className="field-error">{cart.couponError}</span>}
                {cart.checkoutBlocked && <div className="alert alert-warning" style={{ marginTop: 10 }}>Some items need attention before you can check out.</div>}
                <Button className="btn-lg btn-block" style={{ marginTop: 14 }} disabled={cart.checkoutBlocked} onClick={() => navigate("/checkout")}>
                  Checkout
                </Button>
              </Summary>
            </aside>
          </div>
        )}
        {cart.saved.length > 0 && (
          <section style={{ marginTop: 48 }} aria-labelledby="saved-h">
            <h2 className="h2" id="saved-h">
              Saved for later
            </h2>
            {cart.saved.map((l) => (
              <LineRow key={l.itemId} l={l} saved onChange={update} />
            ))}
          </section>
        )}
      </div>
      {confirmClear && (
        <Modal title="Clear your bag?" onClose={() => setConfirmClear(false)}>
          <p className="muted" style={{ marginBottom: 20 }}>
            All items will be removed. Items saved for later stay saved.
          </p>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>
              Keep items
            </button>
            <button className="btn btn-danger" onClick={async () => (setCart(await api.del<CartSummary>("/cart")), setConfirmClear(false))}>
              Clear bag
            </button>
          </div>
        </Modal>
      )}
    </StoreLayout>
  );
}
