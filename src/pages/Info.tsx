import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { StoreLayout } from "../components/SiteHeader";
import { Button, Empty, SelectField, TextArea, TextField } from "../components/ui";
import { ApiError, api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { inr } from "../lib/format";
import { useApi, useTitle } from "../lib/useApi";

interface Policies {
  shipping: { flatPaise: number; freeThresholdPaise: number; estimateDaysMin: number; estimateDaysMax: number };
  cod: { enabled: boolean; maxOrderPaise: number };
  tax: { note: string };
  returns: { enabled: boolean };
  brand: { supportEmail: string; supportPhone: string };
}

function Contact() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [f, setF] = useState({ name: user?.name ?? "", email: user?.email ?? "", subject: params.get("subject") ?? "", category: "general", message: "", orderNumber: params.get("order") ?? "", website: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const pol = useApi<Policies>("/catalog/policies");
  useTitle("Contact", { description: "Contact CrownCart customer support." });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="container container-narrow page stack" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div>
        <div className="eyebrow">05 · Contact</div>
        <h1 className="display">We're here to help</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Questions about an order, a product or your account? Send us a message and we'll reply by email.
          {pol.data?.brand.supportEmail && (
            <>
              {" "}
              You can also write to <a href={`mailto:${pol.data.brand.supportEmail}`}>{pol.data.brand.supportEmail}</a>.
            </>
          )}
        </p>
      </div>
      {sent ? (
        <div className="alert alert-success" role="status">
          Thanks — your request #{sent} has been received. {user ? <Link to={`/account/support/${sent}`}>Follow it in your account.</Link> : "We'll reply to your email."}
        </div>
      ) : (
        <form
          className="card stack"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            setFields({});
            try {
              const r = await api.post<{ ticketId: number }>("/support/tickets", { ...f, orderNumber: f.orderNumber || null });
              setSent(r.ticketId);
            } catch (err) {
              setError(errorMessage(err));
              if (err instanceof ApiError) setFields(err.fields);
            } finally {
              setBusy(false);
            }
          }}
        >
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="grid" style={{ "--min": "220px" } as React.CSSProperties}>
            <TextField label="Name" required autoComplete="name" value={f.name} onChange={set("name")} error={fields.name} />
            <TextField label="Email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} error={fields.email} disabled={Boolean(user)} />
          </div>
          <div className="grid" style={{ "--min": "220px" } as React.CSSProperties}>
            <SelectField label="Topic" value={f.category} onChange={set("category")}>
              <option value="general">General question</option>
              <option value="order">An order</option>
              <option value="delivery">Delivery</option>
              <option value="payment">Payment</option>
              <option value="returns">Returns & refunds</option>
              <option value="product">A product</option>
              <option value="account">My account</option>
            </SelectField>
            {user && <TextField label="Order number (optional)" value={f.orderNumber} onChange={set("orderNumber")} error={fields.orderNumber} />}
          </div>
          <TextField label="Subject" required value={f.subject} onChange={set("subject")} error={fields.subject} />
          <TextArea label="Message" required rows={6} value={f.message} onChange={set("message")} error={fields.message} />
          {/* Spam trap: hidden from people and assistive tech. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} style={{ position: "absolute", left: -9999 }} aria-hidden="true" />
          <Button loading={busy} type="submit">
            Send message
          </Button>
        </form>
      )}
    </div>
  );
}

function Policy() {
  const { policy = "" } = useParams();
  const { data } = useApi<Policies>("/catalog/policies");
  const titles: Record<string, string> = { shipping: "Shipping policy", returns: "Returns, refunds & cancellations", privacy: "Privacy policy", terms: "Terms and conditions" };
  useTitle(titles[policy] ?? "Policy");
  if (!titles[policy]) return <Empty title="Policy not found" />;
  const s = data?.shipping;
  return (
    <article className="container container-narrow page stack" style={{ "--gap": "16px", lineHeight: 1.7 } as React.CSSProperties}>
      <div className="eyebrow">Policies</div>
      <h1 className="display">{titles[policy]}</h1>
      <div className="alert alert-warning">
        Draft for review. This page describes how the store is configured today and must be reviewed by a qualified professional before launch. It is not legal advice and makes no claims of regulatory compliance.
      </div>
      {policy === "shipping" && s && (
        <>
          <p>Orders are usually dispatched within 1–2 business days and delivered in {s.estimateDaysMin}–{s.estimateDaysMax} days after dispatch, depending on your location.</p>
          <p>
            Shipping is free on orders of {inr(s.freeThresholdPaise)} or more from a single seller. Below that, a flat fee of {inr(s.flatPaise)} applies per seller. The exact fee is shown before you pay.
          </p>
          <p>{data!.cod.enabled ? `Cash on delivery is available for orders up to ${inr(data!.cod.maxOrderPaise)}.` : "Cash on delivery is currently unavailable."}</p>
          <p>You can track every order from your account. Delivery partners ask for a one-time code that we send you when your parcel is out for delivery.</p>
        </>
      )}
      {policy === "returns" && (
        <>
          <p>
            Each product page shows its return window. Where returns are accepted, you can request one from your order page within that window after delivery. Some items, such as high-value timepieces, can't be
            returned once delivered — this is stated on the product page before you buy.
          </p>
          <p>
            You can cancel an order before it is prepared for dispatch. Once processing has started, cancellation needs the seller's approval. Orders that have shipped can't be cancelled, but you can request a return
            after delivery.
          </p>
          <p>
            Refunds for online payments go back to the original payment method once the payment provider processes them. For cash-on-delivery orders, our team arranges the refund with you directly. Shipping fees are not
            refunded on returns; discounts are deducted proportionally.
          </p>
        </>
      )}
      {policy === "privacy" && (
        <>
          <p>
            We collect the information needed to run your account and deliver your orders: your name, email, phone number, delivery addresses and order history. Payment details are entered with our payment provider and
            are never stored by CrownCart.
          </p>
          <p>
            Delivery partners see only what they need to deliver an order — the recipient's name, address and, while the parcel is with them, phone number. That access ends when the delivery is complete.
          </p>
          <p>Marketing emails are sent only if you opt in, and you can opt out at any time from your account. You can delete your account from your account settings.</p>
        </>
      )}
      {policy === "terms" && (
        <>
          <p>
            By using CrownCart you agree to these terms. Products are sold by the store named on each product page. Prices are in Indian rupees and {data?.tax.note.toLowerCase() ?? "include applicable taxes."}
          </p>
          <p>An order is confirmed only when you receive an order confirmation. We may cancel and fully refund an order if an item becomes unavailable or a pricing error is found.</p>
        </>
      )}
      <p className="small muted">
        Questions? <Link to="/contact">Contact us</Link>.
      </p>
    </article>
  );
}

export default function Info({ page }: { page: "contact" | "policy" }) {
  return <StoreLayout>{page === "contact" ? <Contact /> : <Policy />}</StoreLayout>;
}
