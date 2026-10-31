import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { inr } from "../lib/format";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function Button({ loading, children, className = "", disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button className={`btn ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
}

export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId();
  const describedBy = [error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && !error && (
        <span className="hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={`${id}-err`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode }) {
  return (
    <Field label={label} error={error} hint={hint} required={input.required}>
      {(a) => <input className="input" {...a} {...input} />}
    </Field>
  );
}

export function TextArea({ label, error, hint, ...input }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: ReactNode }) {
  return (
    <Field label={label} error={error} hint={hint} required={input.required}>
      {(a) => <textarea className="textarea" {...a} {...input} />}
    </Field>
  );
}

export function SelectField({ label, error, hint, children, ...input }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: ReactNode }) {
  return (
    <Field label={label} error={error} hint={hint} required={input.required}>
      {(a) => (
        <select className="select" {...a} {...input}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function PasswordField({ label, error, hint, showStrength, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; showStrength?: boolean }) {
  const [show, setShow] = useState(false);
  const value = String(input.value ?? "");
  const score = !value ? 0 : Math.min(4, [value.length >= 10, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value) || value.length >= 16].filter(Boolean).length);
  return (
    <Field label={label} error={error} hint={hint} required={input.required}>
      {(a) => (
        <>
          <div className="input-wrap">
            <input className="input" type={show ? "text" : "password"} {...a} {...input} />
            <button type="button" className="btn btn-ghost btn-sm input-addon" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {showStrength && value && (
            <div className="row" style={{ "--gap": "10px" } as React.CSSProperties}>
              <div className="strength" data-score={score} style={{ flex: 1 }} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <span className="tiny muted">{["Too short", "Weak", "Fair", "Good", "Strong"][score]}</span>
            </div>
          )}
        </>
      )}
    </Field>
  );
}

export function Price({ paise, compareAt, className = "" }: { paise: number; compareAt?: number | null; className?: string }) {
  const off = compareAt && compareAt > paise ? Math.round(((compareAt - paise) / compareAt) * 100) : 0;
  return (
    <span className={`price ${className}`}>
      <span className="now">{inr(paise)}</span>
      {off > 0 && (
        <>
          <span className="was">
            <span className="sr-only">was </span>
            {inr(compareAt)}
          </span>
          <span className="off">{off}% off</span>
        </>
      )}
    </span>
  );
}

export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating == null) return <span className="tiny muted">No reviews yet</span>;
  return (
    <span className="small" aria-label={`Rated ${rating} out of 5${count != null ? ` from ${count} reviews` : ""}`}>
      <span className="stars" aria-hidden="true">
        {"★".repeat(Math.round(rating))}
        {"☆".repeat(5 - Math.round(rating))}
      </span>{" "}
      <span className="muted">
        {rating}
        {count != null && ` (${count})`}
      </span>
    </span>
  );
}

const TONES: Record<string, string> = {
  confirmed: "gold",
  processing: "gold",
  ready_for_dispatch: "gold",
  shipped: "gold",
  out_for_delivery: "gold",
  delivered: "success",
  paid: "success",
  cod_collected: "success",
  active: "success",
  approved: "success",
  published: "success",
  refunded: "success",
  processed: "success",
  available: "success",
  cancelled: "danger",
  failed: "danger",
  expired: "danger",
  suspended: "danger",
  rejected: "danger",
  returned_to_sender: "danger",
  pending_payment: "warning",
  pending: "warning",
  cod_pending: "warning",
  cancellation_requested: "warning",
  return_requested: "warning",
  refund_pending: "warning",
  requested: "warning",
  attempted: "warning",
  draft: "warning",
  awaiting_assignment: "warning",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status];
  return <span className={`badge${tone ? ` badge-${tone}` : ""}`}>{label ?? status.replace(/_/g, " ")}</span>;
}

const ART: Record<string, ReactNode> = {
  bag: (
    <>
      <path d="M16 24h32l3 28H13z" />
      <path d="M24 30v-9a8 8 0 0 1 16 0v9" />
    </>
  ),
  wish: <path d="M32 52S12 40 12 25.5A10.5 10.5 0 0 1 32 21a10.5 10.5 0 0 1 20 4.5C52 40 32 52 32 52z" />,
  search: (
    <>
      <circle cx="28" cy="28" r="15" />
      <path d="m39 39 13 13" />
      <path d="M21 28a7 7 0 0 1 7-7" />
    </>
  ),
  orders: (
    <>
      <path d="m32 11 20 10v22L32 53 12 43V21z" />
      <path d="m12 21 20 10 20-10M32 31v22M22 16l20 10" />
    </>
  ),
  bell: (
    <>
      <path d="M18 44V28a14 14 0 0 1 28 0v16l4 4H14z" />
      <path d="M27 53a5 5 0 0 0 10 0" />
    </>
  ),
};

/** A small line drawing in the accent colour, with a soft glow, for empty pages. */
export function EmptyArt({ art }: { art: string }) {
  return (
    <span className="empty-art" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {ART[art]}
      </svg>
    </span>
  );
}

export function Empty({ title, children, action, art }: { title: string; children?: ReactNode; action?: ReactNode; art?: keyof typeof ART }) {
  return (
    <div className="empty">
      {art && <EmptyArt art={art} />}
      <div className="h2">{title}</div>
      {children && <p className="muted" style={{ maxWidth: 440, margin: "0 auto" }}>{children}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Something went wrong.";
  const status = (error as any)?.status;
  if (status === 401)
    return (
      <Empty title="Please sign in" action={<Link className="btn" to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`}>Sign in</Link>}>
        Your session may have expired.
      </Empty>
    );
  if (status === 403) return <Empty title="Access denied">You don't have permission to view this page.</Empty>;
  if (status === 404) return <Empty title="Not found" action={<Link className="btn btn-outline" to="/">Go home</Link>}>{msg}</Empty>;
  return (
    <Empty title="Something went wrong" action={retry && <button className="btn btn-outline" onClick={retry}>Try again</button>}>
      {msg}
    </Empty>
  );
}

export function Loading() {
  return (
    <div className="center-load" role="status" aria-label="Loading">
      <div className="shimmer-lines" aria-hidden="true">
        <div className="skeleton" style={{ width: "42%", height: 34 }} />
        <div className="skeleton" style={{ width: "88%" }} />
        <div className="skeleton" style={{ width: "72%" }} />
        <div className="skeleton" style={{ width: "80%" }} />
      </div>
    </div>
  );
}

/** Shimmering rows shaped like a list of items with a thumbnail (bag lines, orders). */
export function RowSkeletons({ n = 3 }: { n?: number }) {
  return (
    <div className="stack" role="status" aria-label="Loading">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton-row" aria-hidden="true">
          <div className="skeleton" />
          <div className="shimmer-lines">
            <div className="skeleton" style={{ width: "60%" }} />
            <div className="skeleton" style={{ width: "38%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Accessible dialog: traps focus, closes on Escape, restores focus on close, locks background scroll. */
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Callers pass inline onClose handlers; keep the latest in a ref so the setup below runs once
  // per open. Re-running it on every render stole focus from the field being typed in.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first =
      ref.current?.querySelector<HTMLElement>(".modal-body input, .modal-body select, .modal-body textarea") ??
      ref.current?.querySelector<HTMLElement>("input, select, textarea, button, a[href]");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && ref.current) {
        const els = [...ref.current.querySelectorAll<HTMLElement>("input, select, textarea, button, a[href], [tabindex]:not([tabindex='-1'])")].filter((el) => !el.hasAttribute("disabled"));
        if (!els.length) return;
        const [a, z] = [els[0], els[els.length - 1]];
        if (e.shiftKey && document.activeElement === a) (e.preventDefault(), z.focus());
        else if (!e.shiftKey && document.activeElement === z) (e.preventDefault(), a.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref} style={wide ? { width: "min(760px, 100%)" } : undefined}>
        <div className="spread" style={{ marginBottom: 18 }}>
          <h2 className="h2" id="modal-title">
            {title}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Qty({ value, onChange, max, min = 1, label = "Quantity" }: { value: number; onChange: (n: number) => void; max: number; min?: number; label?: string }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

export function Bars({ data, format }: { data: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="bars" role="img" aria-label={`Chart of ${data.length} values`}>
        {data.map((d) => (
          <div key={d.label} className="b" style={{ height: `${(d.value / max) * 100}%` }} title={`${d.label}: ${format(d.value)}`} />
        ))}
      </div>
      <div className="spread tiny muted" style={{ marginTop: 6 }}>
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
