import { useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ThemeSwitch } from "../../components/SiteHeader";
import { Button, Empty, ErrorState, Loading, SelectField, StatusBadge, TextArea, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { dateTime, inr, relative } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi, useTitle } from "../../lib/useApi";
import { ServiceAreaFields, serviceAreaError, serviceAreaFrom, type ServiceArea } from "../../components/ServiceAreaFields";

interface Assignment {
  id: number;
  /** "return" = a return pickup: collect from the customer, bring to the store. */
  kind?: "delivery" | "return";
  returnReason?: string | null;
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
  pickup: { store: string; address: string; pincode: string | null; phone?: string | null; mapsUrl?: string | null };
  destination: { name: string; address: string; pincode: string; phone: string | null; mapsUrl: string | null };
  package: { items: { name: string; variant: string; quantity: number }[] };
  collect: number;
  history: { from_status: string | null; to_status: string; reason: string; location: string; photo?: string | null; created_at: string }[];
}

interface Available {
  shipmentId: number;
  kind?: "delivery" | "return";
  trackingNumber: string;
  orderNumber: string;
  readyAt: string;
  items: number;
  pickup: { store: string; address: string | null; pincode: string | null };
  destination: { city: string; state: string; pincode: string };
  collect: number;
  inMyArea: boolean;
}

/** The delivery journey as a checklist. in_transit may be ticked repeatedly to log each place passed. */
const CHECKPOINTS: { to: string; label: string; hint: string }[] = [
  { to: "accepted", label: "Accepted", hint: "You've taken this delivery." },
  { to: "picked_up", label: "Picked up from store", hint: "Parcel collected from the store." },
  { to: "in_transit", label: "In transit", hint: "Log each place the parcel passes through." },
  { to: "out_for_delivery", label: "Out for delivery", hint: "On the way to the customer. They get their delivery code now." },
  { to: "delivered", label: "Delivered", hint: "Handed to the customer." },
];
/** A return pickup: collect from the customer (photo of the items), then hand over at the store. */
const RETURN_CHECKPOINTS: { to: string; label: string; hint: string }[] = [
  { to: "accepted", label: "Accepted", hint: "You've taken this pickup." },
  { to: "picked_up", label: "Picked up from customer", hint: "Collect the items and photograph them as received." },
  { to: "in_transit", label: "On the way to the store", hint: "Log each place the parcel passes through." },
  { to: "delivered", label: "Handed to the store", hint: "Give the items to the store and note who received them." },
];

/** Camera-first photo picker with a preview. Photos only (JPG, PNG or WebP). */
function PhotoField({ label, required, value, onChange }: { label: string; required?: boolean; value: File | null; onChange: (f: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
      <span className="small" style={{ fontWeight: 600 }}>
        {label}
        {required ? " *" : " (optional)"}
      </span>
      {preview && <img src={preview} alt="Photo to upload" className="delivery-photo-preview" />}
      <label className="btn btn-outline btn-block" style={{ cursor: "pointer" }}>
        📷 {value ? "Retake photo" : "Take photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (preview) URL.revokeObjectURL(preview);
            setPreview(f ? URL.createObjectURL(f) : null);
            onChange(f);
          }}
        />
      </label>
    </div>
  );
}

interface Me {
  status: string;
  availability: string;
  servicePincodes: string;
  city: string;
  state: string;
  vehicle: string;
  stats: { delivered: number; failed: number; open: number; deliveredToday: number };
  failureReasons: string[];
  requireOtp: boolean;
  requirePhoto?: boolean;
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
          <NavLink to="/delivery/available">
            <span aria-hidden="true">＋</span>Available
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
        <strong>
          {a.trackingNumber} {a.kind === "return" && <span className="badge badge-warning">↩ Return pickup</span>}
        </strong>
        <StatusBadge status={a.status} label={a.statusLabel} />
      </div>
      <div className="small">
        {a.kind === "return" ? `Collect from ${a.pickup.store} · ${a.pickup.address}` : `${a.destination.name} · ${a.destination.address}`}
      </div>
      <div className="tiny muted">
        {a.kind === "return" ? `Bring to: ${a.destination.name}` : `Pickup: ${a.pickup.store}`} · assigned {relative(a.assignedAt)}
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

function AvailableOrders() {
  const { data, error, loading, reload } = useApi<{ orders: Available[] }>("/delivery/available");
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const list = data!.orders;
  const claim = async (o: Available) => {
    setBusy(o.shipmentId);
    try {
      const r = await api.post<{ assignmentId: number }>(`/delivery/available/${o.shipmentId}/claim`);
      toast(`Order ${o.orderNumber} is yours.`, "success");
      navigate(`/delivery/assignments/${r.assignmentId}`);
    } catch (e) {
      toast(errorMessage(e), "error");
      reload();
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="stack">
      <div className="spread">
        <h1 className="h3">Waiting for a partner</h1>
        <button className="btn btn-ghost btn-sm" onClick={reload}>
          Refresh
        </button>
      </div>
      <p className="small muted">Orders ready at the store, and approved returns to collect from customers, with nobody assigned yet.</p>
      {list.length === 0 ? (
        <Empty title="No orders waiting">Check back soon.</Empty>
      ) : (
        list.map((o) => (
          <section key={o.shipmentId} className="card stack" style={{ "--gap": "6px" } as React.CSSProperties}>
            <div className="spread">
              <strong>
                {o.orderNumber} {o.kind === "return" && <span className="badge badge-warning">↩ Return pickup</span>}
              </strong>
              {o.inMyArea ? <span className="badge badge-success">In your area</span> : <span className="badge">Outside your area</span>}
            </div>
            <div className="small">
              {o.kind === "return" ? "Collect in" : "To"} <strong>{[o.destination.city, o.destination.state].filter(Boolean).join(", ")}</strong> · PIN {o.destination.pincode}
            </div>
            <div className="tiny muted">
              {o.kind === "return" ? "Bring to" : "Pickup"}: {o.pickup.store}
              {o.pickup.pincode ? ` (${o.pickup.pincode})` : ""} · {o.items} item{o.items === 1 ? "" : "s"} · ready {relative(o.readyAt)}
              {o.collect > 0 && ` · collect ${inr(o.collect)}`}
            </div>
            <Button className="btn-block" loading={busy === o.shipmentId} disabled={busy !== null} onClick={() => claim(o)}>
              {o.kind === "return" ? "Pick up this return" : "Deliver this order"}
            </Button>
          </section>
        ))
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
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const a = data!.assignment;

  const go = async (to: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setErr(null);
    try {
      let r: { assignment: Assignment };
      if (photo) {
        // With a photo the step goes up as a form upload.
        const form = new FormData();
        form.append("to", to);
        for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "") form.append(k, String(v));
        form.append("photo", photo);
        r = await api.upload(`/delivery/assignments/${a.id}/status`, form);
      } else {
        r = await api.post(`/delivery/assignments/${a.id}/status`, { to, ...extra });
      }
      setData(r);
      setStep(null);
      setOtp("");
      setLocation("");
      setPhoto(null);
      toast(`Marked ${r.assignment.statusLabel.toLowerCase()}.`, "success");
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const isReturn = a.kind === "return";
  const checkpoints = isReturn ? RETURN_CHECKPOINTS : CHECKPOINTS;
  const photoRequired = Boolean(me.requirePhoto);

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

      {isReturn && (
        <section className="card stack" style={{ "--gap": "8px" } as React.CSSProperties}>
          <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
            ↩ Return pickup
          </span>
          <div className="eyebrow">Collect from customer</div>
          <strong>{a.pickup.store}</strong>
          <span className="small">{a.pickup.address}</span>
          {a.returnReason && <span className="tiny muted">Reason for return: {a.returnReason}</span>}
          <div className="row">
            {a.pickup.mapsUrl && (
              <a className="btn btn-outline btn-sm" href={a.pickup.mapsUrl} target="_blank" rel="noopener">
                Navigate
              </a>
            )}
            {a.pickup.phone && !a.pickup.phone.includes("•") ? (
              <a className="btn btn-outline btn-sm" href={`tel:${a.pickup.phone}`}>
                Call {a.pickup.phone}
              </a>
            ) : (
              a.pickup.phone && <span className="tiny muted">Phone {a.pickup.phone} — visible once accepted</span>
            )}
          </div>
          <div className="eyebrow" style={{ marginTop: 8 }}>
            Items to collect
          </div>
          {a.package.items.map((i, n) => (
            <span key={n} className="small">
              {i.quantity} × {i.name} {i.variant !== "Standard" && `(${i.variant})`}
            </span>
          ))}
        </section>
      )}

      <section className="card stack" style={{ "--gap": "8px" } as React.CSSProperties}>
        <div className="eyebrow">{isReturn ? "Bring to store" : "Deliver to"}</div>
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

      {!isReturn && (
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
      )}

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      <section className="card stack" style={{ "--gap": "4px" } as React.CSSProperties}>
        <div className="eyebrow">{isReturn ? "Pickup progress" : "Delivery progress"}</div>
        <ul className="checkpoints">
          {checkpoints.map((cp) => {
            const done = a.history.filter((h) => h.to_status === cp.to);
            const allowed = !a.closedAt && a.nextSteps.some((n) => n.to === cp.to);
            const blocked = !isReturn && cp.to === "picked_up" && !a.orderReady;
            // A return pickup's "picked up" step needs an item photo.
            const needsPhoto = isReturn && cp.to === "picked_up";
            const open = step === cp.to;
            return (
              <li key={cp.to} className={done.length ? "done" : allowed ? "next" : ""}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={done.length > 0 || open}
                    disabled={!allowed || blocked || busy || (done.length > 0 && cp.to !== "in_transit")}
                    onChange={(e) => {
                      if (!e.target.checked) return setStep(null);
                      if (cp.to === "accepted") return go("accepted");
                      setErr(null);
                      setStep(cp.to);
                    }}
                  />
                  <span>
                    <strong className="small">{cp.label}</strong>
                    <span className="tiny muted" style={{ display: "block" }}>
                      {blocked && allowed ? "Waiting for the store to mark it ready." : cp.hint}
                    </span>
                  </span>
                </label>
                {done.map((h, i) => (
                  <div key={i} className="tiny checkpoint-log">
                    {h.location ? <>📍 {h.location} · </> : null}
                    <span className="muted">{dateTime(h.created_at)}</span>
                    {h.photo && (
                      <a href={h.photo} target="_blank" rel="noopener">
                        <img src={h.photo} alt="" className="delivery-photo-thumb" />
                      </a>
                    )}
                  </div>
                ))}
                {cp.to === "in_transit" && a.status === "in_transit" && !open && (
                  <button type="button" className="link small checkpoint-log" onClick={() => setStep("in_transit")}>
                    + Add another location
                  </button>
                )}
                {open && cp.to !== "delivered" && (
                  <form className="checkpoint-log stack" style={{ marginTop: 6, "--gap": "8px" } as React.CSSProperties} onSubmit={(e) => (e.preventDefault(), go(cp.to, { location }))}>
                    {needsPhoto && <PhotoField label="Photo of the items you collected" required value={photo} onChange={setPhoto} />}
                    <div className="row">
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      autoFocus
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Location, e.g. Ameerpet, Hyderabad"
                      aria-label={`Location for ${cp.label}`}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <Button type="submit" className="btn-sm" loading={busy} disabled={location.trim().length < 2 || (needsPhoto && !photo)}>
                      Mark done
                    </Button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => (setStep(null), setPhoto(null))}>
                      Cancel
                    </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
        {!a.closedAt && !step && (
          <div className="row" style={{ marginTop: 8 }}>
            {a.nextSteps
              .filter((n) => ["attempted", "failed", "returned"].includes(n.to))
              .map((n) => (
                <button key={n.to} type="button" className="btn btn-outline btn-sm" onClick={() => setStep(n.to)}>
                  {n.to === "attempted" ? "Couldn't deliver" : n.to === "failed" ? (isReturn ? "Couldn't pick up" : "Mark delivery failed") : "Returned to store"}
                </button>
              ))}
          </div>
        )}
      </section>

      {step === "returned" && (
        <form className="card stack" onSubmit={(e) => (e.preventDefault(), go("returned", { location }))}>
          <h2 className="h3">Returned to store</h2>
          <TextField label="Location" required value={location} onChange={(e) => setLocation(e.target.value)} />
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(null)}>
              Back
            </button>
            <Button type="submit" className="big-btn" style={{ flex: 1 }} loading={busy} disabled={location.trim().length < 2}>
              Save
            </Button>
          </div>
        </form>
      )}

      {step === "delivered" && (
        <form className="card stack" onSubmit={(e) => (e.preventDefault(), go("delivered", { otp: (!isReturn && otp) || undefined, recipientName: recipient, notes, location }))}>
          <h2 className="h3">{isReturn ? "Hand over at the store" : "Proof of delivery"}</h2>
          <TextField
            label={isReturn ? "Store location" : "Delivery location"}
            required
            placeholder="e.g. Banjara Hills, Hyderabad"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {!isReturn && (
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
          )}
          <TextField label={isReturn ? "Received at the store by" : "Received by"} required value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          <PhotoField label={isReturn ? "Photo of the handover" : "Photo of the parcel at the door"} required={photoRequired} value={photo} onChange={setPhoto} />
          <TextArea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => (setStep(null), setPhoto(null))}>
              Back
            </button>
            <Button
              type="submit"
              className="big-btn"
              style={{ flex: 1 }}
              loading={busy}
              disabled={(!isReturn && me.requireOtp && otp.length !== 6) || recipient.trim().length < 2 || location.trim().length < 2 || (photoRequired && !photo)}
            >
              {isReturn ? "Confirm handover" : "Confirm delivery"}
            </Button>
          </div>
        </form>
      )}

      {(step === "attempted" || step === "failed") && (
        <form className="card stack" onSubmit={(e) => (e.preventDefault(), go(step, { reason: reason === "Other" ? other : reason, location }))}>
          <h2 className="h3">{step === "attempted" ? "Delivery attempt" : isReturn ? "Couldn't pick up the return" : "Mark delivery failed"}</h2>
          <TextField label="Location" required value={location} onChange={(e) => setLocation(e.target.value)} />
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
              <div className="tiny muted">
                {h.location ? `📍 ${h.location} · ` : ""}
                {dateTime(h.created_at)}
              </div>
              {h.reason && <div className="small">{h.reason}</div>}
              {h.photo && (
                <a href={h.photo} target="_blank" rel="noopener">
                  <img src={h.photo} alt="" className="delivery-photo-thumb" />
                </a>
              )}
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
      <section className="card stack">
        <div className="eyebrow">Where you deliver</div>
        <AreaForm me={me} onSaved={reload} submitLabel="Save area" />
      </section>
      <section className="card stack small">
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

/** Edits the partner's city, state and PIN codes. */
function AreaForm({ me, onSaved, submitLabel }: { me: Me; onSaved: () => void; submitLabel: string }) {
  const toast = useToast();
  const [area, setArea] = useState<ServiceArea>(() => serviceAreaFrom(me.city, me.state, me.servicePincodes));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const problem = serviceAreaError(area);
        if (problem) return setErr(problem);
        setBusy(true);
        setErr(null);
        try {
          const r = await api.put<{ assigned: number }>("/delivery/service-area", { city: area.city.trim(), state: area.state, pincodes: area.pincodes });
          toast(r.assigned ? `Saved. ${r.assigned} waiting order${r.assigned > 1 ? "s were" : " was"} assigned to you.` : "Delivery area saved.", "success");
          onSaved();
        } catch (e2) {
          setErr(errorMessage(e2));
        } finally {
          setBusy(false);
        }
      }}
    >
      <ServiceAreaFields value={area} onChange={setArea} />
      {err && <div className="alert alert-danger">{err}</div>}
      <Button type="submit" loading={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}

export default function Delivery() {
  const me = useApi<Me>("/delivery/me");
  if (me.error) return <Shell me={null}><ErrorState error={me.error} retry={me.reload} /></Shell>;
  if (!me.data) return <Loading />;
  // Every partner must say where they deliver before anything else (covers partners added by an admin).
  if (!me.data.city || !me.data.state || !me.data.servicePincodes)
    return (
      <Shell me={me.data}>
        <div className="stack">
          <h1 className="h3">Set up your delivery area</h1>
          <p className="small muted">Tell us your city, state and the PIN codes you can deliver to. Orders for these PIN codes are sent to you automatically.</p>
          <section className="card stack">
            <AreaForm me={me.data} onSaved={me.reload} submitLabel="Save and continue" />
          </section>
        </div>
      </Shell>
    );
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
        <Route path="available" element={<AvailableOrders />} />
        <Route path="history" element={<History />} />
        <Route path="profile" element={<Profile me={me.data} reload={me.reload} />} />
        <Route path="*" element={<Empty title="Not found" />} />
      </Routes>
    </Shell>
  );
}
