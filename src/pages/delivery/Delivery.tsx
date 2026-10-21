import { useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import { ThemeSwitch } from "../../components/SiteHeader";
import { Button, Empty, ErrorState, Loading, SelectField, StatusBadge, TextArea, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { dateTime, inr, relative } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi, useTitle } from "../../lib/useApi";

interface Assignment {
  id: number;
  status: string;
  statusLabel: string;
  nextSteps: { to: string; label: string }[];
  trackingNumber: string;
  orderNumber: string;
  orderReady: boolean;
  assignedAt: string;
  updatedAt: string;
  closedAt: string | null;
  failureReason: string | null;
  pickup: { store: string; address: string; pincode: string | null };
  destination: { name: string; address: string; pincode: string; phone: string | null; mapsUrl: string | null };
  package: { items: { name: string; variant: string; quantity: number }[] };
  collect: number;
  history: { from_status: string | null; to_status: string; reason: string; created_at: string }[];
}
interface Me {
  status: string;
  availability: string;
  servicePincodes: string;
  vehicle: string;
  stats: { delivered: number; failed: number; open: number; deliveredToday: number };
  failureReasons: string[];
  requireOtp: boolean;
  supportEmail: string;
}

function Shell({ children, me }: { children: React.ReactNode; me: Me | null }) {
  const { user } = useAuth();
  useTitle("Delivery", { noindex: true });
  return (
    <div className="app">
      <div className="rider">
        <header className="rider-top spread">
          <div>
            <div className="wordmark" style={{ fontSize: 22 }}>
              CrownCart
            </div>
            <div className="tiny muted">Delivery · {user?.name}</div>
          </div>
          {me && <StatusBadge status={me.availability} />}
        </header>
        <main id="main" style={{ padding: 16 }}>
          {children}
        </main>
        <nav className="rider-nav" aria-label="Delivery">
          <NavLink to="/delivery" end>
            <span aria-hidden="true">▤</span>Today
          </NavLink>
          <NavLink to="/delivery/history">
            <span aria-hidden="true">↺</span>History
          </NavLink>
          <NavLink to="/delivery/profile">
            <span aria-hidden="true">◉</span>Profile
          </NavLink>
          <a href={`mailto:${me?.supportEmail ?? ""}`}>
            <span aria-hidden="true">?</span>Support
          </a>
        </nav>
      </div>
    </div>
  );
}

function Card({ a }: { a: Assignment }) {
  return (
    <Link to={`/delivery/assignments/${a.id}`} className="card stack" style={{ textDecoration: "none", "--gap": "6px" } as React.CSSProperties}>
      <div className="spread">
        <strong>{a.trackingNumber}</strong>
        <StatusBadge status={a.status} label={a.statusLabel} />
      </div>
      <div className="small">
        {a.destination.name} · {a.destination.address}
      </div>
      <div className="tiny muted">
        Pickup: {a.pickup.store} · assigned {relative(a.assignedAt)}
        {a.collect > 0 && ` · collect ${inr(a.collect)}`}
      </div>
    </Link>
  );
}

function Today({ me }: { me: Me }) {
  const { data, error, loading, reload } = useApi<{ assignments: Assignment[] }>("/delivery/assignments?scope=open");
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const list = data!.assignments;
  return (
    <div className="stack">
      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat">
          <div className="eyebrow">Open</div>
          <div className="value">{me.stats.open}</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Delivered today</div>
          <div className="value">{me.stats.deliveredToday}</div>
        </div>
        <div className="stat">
          <div className="eyebrow">All time</div>
          <div className="value">{me.stats.delivered}</div>
        </div>
      </div>
      <div className="spread">
        <h1 className="h3">Assigned to you</h1>
        <button className="btn btn-ghost btn-sm" onClick={reload}>
          Refresh
        </button>
      </div>
      {list.length === 0 ? (
        <Empty title="Nothing assigned">New deliveries will appear here and in your notifications.</Empty>
      ) : (
        ["assigned", "accepted", "picked_up", "in_transit", "out_for_delivery", "attempted", "failed"].map((s) => {
          const group = list.filter((a) => a.status === s);
          return group.length ? (
            <section key={s} className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
              <div className="eyebrow">{group[0].statusLabel}</div>
              {group.map((a) => (
                <Card key={a.id} a={a} />
              ))}
            </section>
          ) : null;
        })
      )}
    </div>
  );
}

function AssignmentView({ me }: { me: Me }) {
  const { id } = useParams();
  const { data, error, loading, reload, setData } = useApi<{ assignment: Assignment }>(`/delivery/assignments/${id}`);
  const toast = useToast();
  const [step, setStep] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [recipient, setRecipient] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState(me.failureReasons[0]);
  const [other, setOther] = useState("");
  const [issue, setIssue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const a = data!.assignment;

  const go = async (to: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post<{ assignment: Assignment }>(`/delivery/assignments/${a.id}/status`, { to, ...extra });
      setData(r);
      setStep(null);
      setOtp("");
      toast(`Marked ${r.assignment.statusLabel.toLowerCase()}.`, "success");
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const needsForm = (to: string) => ["delivered", "attempted", "failed"].includes(to);

  return (
    <div className="stack" style={{ "--gap": "16px" } as React.CSSProperties}>
      <Link to="/delivery" className="small">
        ← Back
      </Link>
      <div className="spread">
        <h1 className="h2">{a.trackingNumber}</h1>
        <StatusBadge status={a.status} label={a.statusLabel} />
      </div>
      <div className="tiny muted">Order {a.orderNumber}</div>

      <section className="card stack" style={{ "--gap": "8px" } as React.CSSProperties}>
        <div className="eyebrow">Deliver to</div>
        <strong>{a.destination.name}</strong>
        <span className="small">{a.destination.address}</span>
        <div className="row">
          {a.destination.mapsUrl && (
            <a className="btn btn-outline btn-sm" href={a.destination.mapsUrl} target="_blank" rel="noopener">
              Navigate
            </a>
          )}
          {a.destination.phone && !a.destination.phone.includes("•") ? (
            <a className="btn btn-outline btn-sm" href={`tel:${a.destination.phone}`}>
              Call {a.destination.phone}
            </a>
          ) : (
            a.destination.phone && <span className="tiny muted">Phone {a.destination.phone} — visible after pickup</span>
          )}
        </div>
        {a.collect > 0 && (
          <div className="alert alert-warning">
            Collect <strong>{inr(a.collect)}</strong> in cash on delivery.
          </div>
        )}
      </section>

      <section className="card stack" style={{ "--gap": "6px" } as React.CSSProperties}>
        <div className="eyebrow">Pick up from</div>
        <strong>{a.pickup.store}</strong>
        <span className="small">{a.pickup.address || "Address on file with the store"}</span>
        {!a.orderReady && a.status === "accepted" && <span className="badge badge-warning">Store hasn't marked it ready yet</span>}
        <div className="eyebrow" style={{ marginTop: 8 }}>
          Package
        </div>
        {a.package.items.map((i, n) => (
          <span key={n} className="small">
            {i.quantity} × {i.name} {i.variant !== "Standard" && `(${i.variant})`}
          </span>
        ))}
      </section>

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      {!a.closedAt && !step && (
        <div className="stack">
          {a.nextSteps.map((s) => (
            <Button
              key={s.to}
              className={`big-btn btn-block ${["attempted", "failed"].includes(s.to) ? "btn-outline" : ""}`}
              loading={busy}
              disabled={s.to === "picked_up" && !a.orderReady}
              onClick={() => (needsForm(s.to) ? setStep(s.to) : go(s.to))}
            >
              {s.to === "delivered" ? "Complete delivery" : s.to === "attempted" ? "Couldn't deliver" : s.label}
            </Button>
          ))}
        </div>
      )}

      {step === "delivered" && (
        <form className="card stack" onSubmit={(e) => (e.preventDefault(), go("delivered", { otp: otp || undefined, recipientName: recipient, notes }))}>
          <h2 className="h3">Proof of delivery</h2>
          <TextField
            label="Customer's delivery code"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            required={me.requireOtp}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            hint="The customer received a 6-digit code when the parcel went out for delivery."
          />
          <TextField label="Received by" required value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          <TextArea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(null)}>
              Back
            </button>
            <Button type="submit" className="big-btn" style={{ flex: 1 }} loading={busy} disabled={(me.requireOtp && otp.length !== 6) || recipient.trim().length < 2}>
              Confirm delivery
            </Button>
          </div>
        </form>
      )}

      {(step === "attempted" || step === "failed") && (
        <form className="card stack" onSubmit={(e) => (e.preventDefault(), go(step, { reason: reason === "Other" ? other : reason }))}>
          <h2 className="h3">{step === "attempted" ? "Delivery attempt" : "Mark delivery failed"}</h2>
          <SelectField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {me.failureReasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectField>
          {reason === "Other" && <TextField label="Describe" required value={other} onChange={(e) => setOther(e.target.value)} />}
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(null)}>
              Back
            </button>
            <Button type="submit" className="big-btn" style={{ flex: 1 }} loading={busy}>
              Save
            </Button>
          </div>
        </form>
      )}

      <section className="card stack">
        <div className="eyebrow">Timeline</div>
        <ol className="timeline">
          {a.history.map((h, i) => (
            <li key={i} className="done">
              <strong className="small">{h.to_status.replace(/_/g, " ")}</strong>
              <div className="tiny muted">{dateTime(h.created_at)}</div>
              {h.reason && <div className="small">{h.reason}</div>}
            </li>
          ))}
        </ol>
      </section>

      {!a.closedAt && (
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.post(`/delivery/assignments/${a.id}/issue`, { message: issue });
              setIssue("");
              toast("Support has been notified.", "success");
            } catch (e2) {
              toast(errorMessage(e2), "error");
            }
          }}
        >
          <TextArea label="Report a problem" value={issue} onChange={(e) => setIssue(e.target.value)} hint="Damaged package, wrong address, store closed…" />
          <Button type="submit" className="btn-outline" disabled={issue.trim().length < 5}>
            Send to support
          </Button>
        </form>
      )}
    </div>
  );
}

function History() {
  const { data, error, loading } = useApi<{ assignments: Assignment[] }>("/delivery/assignments?scope=closed");
  if (error) return <ErrorState error={error} />;
  if (loading && !data) return <Loading />;
  return (
    <div className="stack">
      <h1 className="h3">Completed</h1>
      {data!.assignments.length === 0 ? <Empty title="No completed deliveries yet" /> : data!.assignments.map((a) => <Card key={a.id} a={a} />)}
    </div>
  );
}

function Profile({ me, reload }: { me: Me; reload: () => void }) {
  const toast = useToast();
  const { signOut } = useAuth();
  return (
    <div className="stack">
      <h1 className="h3">Profile</h1>
      <section className="card stack">
        <div className="eyebrow">Availability</div>
        <div className="row">
          {["available", "busy", "offline"].map((s) => (
            <button
              key={s}
              className="chip"
              aria-pressed={me.availability === s}
              onClick={() =>
                api
                  .post("/delivery/availability", { availability: s })
                  .then(reload)
                  .catch((e) => toast(errorMessage(e), "error"))
              }
            >
              {s}
            </button>
          ))}
        </div>
      </section>
      <section className="card stack small">
        <div>Service area: {me.servicePincodes || "Not set — ask an administrator"}</div>
        <div>Vehicle: {me.vehicle || "—"}</div>
        <div>
          Delivered {me.stats.delivered} · failed or returned {me.stats.failed}
        </div>
      </section>
      <section className="card stack">
        <ThemeSwitch />
      </section>
      <button className="btn btn-outline" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}

export default function Delivery() {
  const me = useApi<Me>("/delivery/me");
  if (me.error) return <Shell me={null}><ErrorState error={me.error} retry={me.reload} /></Shell>;
  if (!me.data) return <Loading />;
  if (me.data.status !== "approved")
    return (
      <Shell me={me.data}>
        <Empty title={me.data.status === "pending" ? "Awaiting approval" : "Account suspended"}>
          {me.data.status === "pending" ? "A CrownCart administrator needs to approve your delivery account before assignments appear here." : "Contact CrownCart support for details."}
        </Empty>
      </Shell>
    );
  return (
    <Shell me={me.data}>
      <Routes>
        <Route index element={<Today me={me.data} />} />
        <Route path="assignments/:id" element={<AssignmentView me={me.data} />} />
        <Route path="history" element={<History />} />
        <Route path="profile" element={<Profile me={me.data} reload={me.reload} />} />
        <Route path="*" element={<Empty title="Not found" />} />
      </Routes>
    </Shell>
  );
}
