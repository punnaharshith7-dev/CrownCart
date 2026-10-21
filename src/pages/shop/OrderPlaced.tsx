import { Link, useParams } from "react-router-dom";
import { StoreLayout } from "../../components/SiteHeader";
import { ErrorState, Loading, StatusBadge } from "../../components/ui";
import { inr } from "../../lib/format";
import { useApi, useTitle } from "../../lib/useApi";

interface CheckoutStatus {
  id: number;
  status: "pending" | "paid" | "failed" | "expired" | "cod";
  paymentMethod: string;
  totalPaise: number;
  orders: { number: string; status: string; total_paise: number }[];
}

/** Confirmation reflects what the server recorded, never what the browser assumed. */
export default function OrderPlaced() {
  const { checkoutId } = useParams();
  const { data, error, loading, reload } = useApi<CheckoutStatus>(`/checkout/${checkoutId}`);
  useTitle("Order confirmation", { noindex: true });
  if (loading && !data) return <StoreLayout><Loading /></StoreLayout>;
  if (error || !data) return <StoreLayout><ErrorState error={error} retry={reload} /></StoreLayout>;
  const ok = data.status === "paid" || data.status === "cod";
  return (
    <StoreLayout>
      <div className="container container-narrow page stack" style={{ textAlign: "center", "--gap": "18px" } as React.CSSProperties}>
        <div className="eyebrow">{ok ? "Thank you" : "Payment status"}</div>
        <h1 className="display">{ok ? "Order confirmed" : data.status === "pending" ? "Awaiting payment" : "Payment not completed"}</h1>
        <p className="muted">
          {ok
            ? data.status === "cod"
              ? `Pay ${inr(data.totalPaise)} in cash when your order arrives. We've sent a confirmation to your email.`
              : `We've received your payment of ${inr(data.totalPaise)}. A confirmation is on its way to your email.`
            : data.status === "pending"
              ? "We're waiting for the payment provider to confirm your payment. This page updates when you refresh it."
              : "Your bag has been kept so you can try again."}
        </p>
        <div className="card stack" style={{ textAlign: "left" }}>
          {data.orders.map((o) => (
            <div key={o.number} className="spread">
              <span>
                Order <strong>{o.number}</strong>
              </span>
              <span className="row">
                <StatusBadge status={o.status} />
                <span className="num">{inr(o.total_paise)}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: "center" }}>
          {ok ? (
            <Link className="btn" to={`/account/orders/${data.orders[0]?.number}`}>
              Track order
            </Link>
          ) : data.status === "pending" ? (
            <button className="btn" onClick={reload}>
              Refresh status
            </button>
          ) : (
            <Link className="btn" to="/cart">
              Back to bag
            </Link>
          )}
          <Link className="btn btn-outline" to="/shop">
            Continue shopping
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
