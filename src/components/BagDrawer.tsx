import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SidePanel } from "./SidePanel";
import { EmptyArt, Qty, RowSkeletons } from "./ui";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { inr } from "../lib/format";
import { useToast } from "../lib/toast";
import type { CartSummary, Line } from "../pages/shop/Cart";

/*
 * Bag drawer: the header bag opens this side panel instead of leaving the page. Item photos,
 * quantity and remove, totals, and a free-delivery progress bar. The full bag page (/cart) is
 * still one click away for coupons, saved-for-later and the rest.
 */

const EVENT = "crowncart-open-bag";
export const openBag = () => window.dispatchEvent(new Event(EVENT));

export function BagDrawer() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  return <BagPanel open={open} onClose={close} />;
}

function BagPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setError(null);
    api
      .get<CartSummary>("/cart")
      .then((c) => (setCart(c), setCartCount(c.itemCount)))
      .catch((e) => setError(errorMessage(e)));
  }, [open, user, setCartCount]);

  const act = async (line: Line, fn: () => Promise<CartSummary>) => {
    setBusy(line.itemId);
    try {
      const c = await fn();
      setCart(c);
      setCartCount(c.itemCount);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const lines = cart?.lines ?? [];
  const afterDiscount = cart ? cart.subtotalPaise - cart.discountPaise : 0;
  const threshold = cart?.freeShippingThresholdPaise ?? 0;
  const progress = threshold > 0 ? Math.min(1, afterDiscount / threshold) : 1;
  const freeUnlocked = cart ? cart.shippingPaise === 0 || afterDiscount >= threshold : false;

  const footer =
    user && cart && lines.length > 0 ? (
      <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
        <div className="sum-row small">
          <span>Subtotal</span>
          <span>{inr(cart.subtotalPaise)}</span>
        </div>
        {cart.discountPaise > 0 && (
          <div className="sum-row small">
            <span>Discount</span>
            <span>−{inr(cart.discountPaise)}</span>
          </div>
        )}
        <div className="sum-row small">
          <span>Delivery</span>
          <span>{cart.shippingPaise ? inr(cart.shippingPaise) : "Free"}</span>
        </div>
        <div className="sum-row total">
          <span>Total</span>
          <span>{inr(cart.totalPaise)}</span>
        </div>
        <button type="button" className="btn btn-lg btn-block" disabled={cart.checkoutBlocked} onClick={() => go("/checkout")}>
          Checkout
        </button>
        <button type="button" className="btn btn-outline btn-block" onClick={() => go("/cart")}>
          View full bag
        </button>
      </div>
    ) : null;

  return (
    <SidePanel open={open} onClose={onClose} title={cart ? `Your bag (${cart.itemCount})` : "Your bag"} footer={footer}>
      {!user ? (
        <div className="bag-empty">
          <EmptyArt art="bag" />
          <p>Sign in to see your bag and check out.</p>
          <button type="button" className="btn" onClick={() => go(`/signin?returnTo=${encodeURIComponent("/cart")}`)}>
            Sign in
          </button>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : !cart ? (
        <RowSkeletons />
      ) : lines.length === 0 ? (
        <div className="bag-empty">
          <EmptyArt art="bag" />
          <p>Your bag is empty.</p>
          <button type="button" className="btn" onClick={() => go("/shop")}>
            Start shopping
          </button>
        </div>
      ) : (
        <div className="stack" style={{ "--gap": "16px" } as React.CSSProperties}>
          <div className={`bag-ship${freeUnlocked ? " is-free" : ""}`}>
            <span className="small">{freeUnlocked ? "🎉 You've unlocked free delivery" : <>Add <strong>{inr(Math.max(0, threshold - afterDiscount))}</strong> more for free delivery</>}</span>
            <div className="bag-ship__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Progress to free delivery">
              <div style={{ transform: `scaleX(${freeUnlocked ? 1 : progress})` }} />
            </div>
          </div>
          <ul className="bag-lines">
            {lines.map((l) => (
              <li key={l.itemId} className={busy === l.itemId ? "is-busy" : ""}>
                <Link to={`/product/${l.productSlug}`} onClick={onClose} className="bag-lines__img">
                  {l.image ? <img src={l.image} alt="" /> : null}
                </Link>
                <div className="bag-lines__info">
                  <Link to={`/product/${l.productSlug}`} onClick={onClose} className="bag-lines__name">
                    {l.productName}
                  </Link>
                  {l.variantName !== "Standard" && <span className="tiny muted">{l.variantName}</span>}
                  {l.issue && <span className="tiny" style={{ color: "var(--danger)" }}>{l.issue}</span>}
                  <div className="row" style={{ "--gap": "10px", marginTop: 6 } as React.CSSProperties}>
                    <Qty
                      value={l.quantity}
                      max={Math.max(l.quantity, Math.min(l.available, l.maxPerOrder))}
                      onChange={(n) => act(l, () => api.patch(`/cart/items/${l.itemId}`, { quantity: n }))}
                      label={`Quantity of ${l.productName}`}
                    />
                    <button type="button" className="link tiny" disabled={busy === l.itemId} onClick={() => act(l, () => api.del(`/cart/items/${l.itemId}`))}>
                      Remove
                    </button>
                  </div>
                </div>
                <span className="bag-lines__price num small">{inr(l.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SidePanel>
  );
}
