import { useEffect, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { DateRange, PageHead, PortalLayout, Stat, defaultRange } from "../../components/Portal";
import { Bars, Button, Empty, ErrorState, Loading, Modal, SelectField, StatusBadge, TextArea, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { date, dateTime, inr, relative, titleCase } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi } from "../../lib/useApi";
import { OrderLines, OrderTimeline, ShipmentTracking, TrackLine, type OrderDetail } from "../account/Account";
import { formatAddress } from "../../components/AddressForm";
import { ReviewPhotos } from "../../components/ReviewForm";
import { AdminReports, CategoriesAdmin, CouponsAdmin, GiftCardsAdmin, MessagesAdmin, SettingsPages } from "./AdminExtras";
import { ProductEditor } from "../owner/Owner";

function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, msg: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      toast(msg, "success");
      after?.();
      return true;
    } catch (e) {
      toast(errorMessage(e), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

const ask = (q: string) => {
  const r = prompt(q);
  return r && r.trim().length >= 3 ? r.trim() : null;
};

function Dashboard() {
  const [range, setRange] = useState(defaultRange());
  const { data, error, loading, reload } = useApi<any>(`/admin/dashboard?from=${range.from}&to=${range.to}`);
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const m = data.metrics;
  const c = data.counts;
  const integ = data.integrations;
  return (
    <div className="stack" style={{ "--gap": "24px" } as React.CSSProperties}>
      <PageHead title="Platform overview" actions={<DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />} />
      {(!integ.razorpay || !integ.email) && (
        <div className="alert alert-warning">
          Not configured: {[!integ.razorpay && "online payments (Razorpay)", !integ.razorpayWebhook && "payment webhooks", !integ.email && "email delivery", !integ.google && "Google sign-in"].filter(Boolean).join(", ")}. See
          .env.example.
        </div>
      )}
      <div className="stats">
        <Stat label="Net sales" value={inr(m.netSalesPaise)} sub={`Gross ${inr(m.grossSalesPaise)}`} />
        <Stat label="Orders" value={m.orders} sub={`AOV ${inr(m.averageOrderValuePaise)}`} />
        <Stat label="Refunds" value={inr(m.refundsPaise)} sub={`${c.refundsPending} pending or failed`} />
        <Stat label="Users" value={c.users} sub={`${c.storeOwners} owners · ${c.deliveryPartners} partners`} />
        <Stat label="Stores" value={c.stores} sub={`${c.pendingStores} pending approval`} />
        <Stat label="Live products" value={c.products} sub={`${c.lowStock} low on stock`} />
        <Stat label="Deliveries" value={c.activeDeliveries} sub={`${c.awaitingAssignment} awaiting a partner · ${c.failedDeliveries} failed`} />
        <Stat label="Payments" value={c.pendingPayments} sub={`pending · ${c.failedPayments} failed in range`} />
      </div>
      <div className="grid" style={{ "--min": "300px", alignItems: "start" } as React.CSSProperties}>
        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <h2 className="h3" style={{ marginBottom: 12 }}>
            Net sales by day
          </h2>
          <Bars data={m.daily.map((d: any) => ({ label: d.day, value: d.netPaise }))} format={inr} />
        </section>
        <section className="card stack">
          <h2 className="h3">Needs attention</h2>
          {[
            [c.pendingPartners, "delivery partners awaiting approval", "/admin/delivery"],
            [c.awaitingAssignment, "shipments awaiting a partner", "/admin/delivery"],
            [c.pendingStores, "stores awaiting approval", "/admin/stores"],
            [c.returnsOpen, "open returns", "/admin/orders?status=return_requested"],
            [c.openTickets, "open support tickets", "/admin/support"],
          ].map(([n, l, to]) => (
            <Link key={l as string} to={to as string} className="spread small">
              <span>{l}</span>
              <span className={`badge ${n ? "badge-warning" : ""}`}>{n}</span>
            </Link>
          ))}
        </section>
        <section className="card stack">
          <h2 className="h3">Conversion funnel</h2>
          {data.funnel.map((f: any) => (
            <div key={f.step} className="spread small">
              <span>{titleCase(f.step)}</span>
              <span className="num">{f.count}</span>
            </div>
          ))}
        </section>
        <section className="card stack">
          <h2 className="h3">Top stores</h2>
          {data.topStores.map((s: any) => (
            <div key={s.id} className="spread small">
              <span>{s.name}</span>
              <span className="muted">
                {s.orders} orders · {inr(s.netPaise)}
              </span>
            </div>
          ))}
        </section>
        <section className="card stack">
          <h2 className="h3">Searches with no results</h2>
          {data.zeroResultSearches.length ? data.zeroResultSearches.map((s: any) => <div key={s.query} className="spread small"><span>“{s.query}”</span><span className="muted">{s.n}×</span></div>) : <p className="small muted">None yet.</p>}
        </section>
        <section className="card stack">
          <h2 className="h3">Recent admin activity</h2>
          {data.recentActivity.map((a: any) => (
            <div key={a.id} className="small">
              <strong>{a.action}</strong> <span className="muted">· {a.actor ?? "System"} · {relative(a.created_at)}</span>
            </div>
          ))}
          <Link to="/admin/audit" className="small">
            Full audit log →
          </Link>
        </section>
      </div>
    </div>
  );
}

function Users() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const { data, error, loading, reload } = useApi<{ users: any[] }>(`/admin/users?q=${encodeURIComponent(q)}&role=${role}`);
  const [invite, setInvite] = useState(false);
  return (
    <div className="stack">
      <PageHead title="Users & roles" actions={<button className="btn" onClick={() => setInvite(true)}>Invite staff</button>} />
      <div className="row">
        <input className="input" style={{ maxWidth: 280 }} placeholder="Search name or email" aria-label="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ width: "auto" }} aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="store_owner">Store owners</option>
          <option value="delivery_partner">Delivery partners</option>
          <option value="platform_admin">Admins</option>
        </select>
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data!.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin/users/${u.id}`}>{u.name}</Link>
                  </td>
                  <td>
                    {u.email} {!u.emailVerified && <span className="tiny muted">(unverified)</span>}
                  </td>
                  <td className="small">{u.roles.map((r: string) => titleCase(r)).join(", ")}</td>
                  <td>{u.orders}</td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td>{date(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {invite && <InviteModal onClose={() => setInvite(false)} />}
    </div>
  );
}

function InviteModal({ onClose, storeId }: { onClose: () => void; storeId?: number }) {
  const stores = useApi<{ stores: any[] }>("/admin/stores");
  const toast = useToast();
  const [f, setF] = useState({ email: "", role: storeId ? "store_owner" : "delivery_partner", storeIds: storeId ? [storeId] : ([] as number[]) });
  const [link, setLink] = useState<string | null>(null);
  return (
    <Modal title="Invite staff" onClose={onClose}>
      {link ? (
        <div className="stack">
          <div className="alert alert-warning">Email isn't set up, so the invitation wasn't emailed. Share this link with them securely:</div>
          <code className="panel small" style={{ wordBreak: "break-all" }}>
            {location.origin + link}
          </code>
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (f.role === "store_owner" && !f.storeIds.length) return toast("Choose at least one store.", "error");
            try {
              const r = await api.post<{ devInviteUrl?: string }>("/admin/invitations", { email: f.email, role: f.role, storeIds: f.role === "store_owner" ? f.storeIds : [] });
              if (r.devInviteUrl) setLink(r.devInviteUrl);
              else (toast("Invitation emailed.", "success"), onClose());
            } catch (err) {
              toast(errorMessage(err), "error");
            }
          }}
        >
          <TextField label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <SelectField label="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="delivery_partner">Delivery partner</option>
            <option value="store_owner">Store owner</option>
            <option value="platform_admin">Platform admin</option>
          </SelectField>
          {f.role === "store_owner" && (
            <fieldset className="stack" style={{ "--gap": "6px", border: 0, padding: 0, margin: 0 } as React.CSSProperties}>
              <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                Stores they will own <span className="tiny muted">(one or more)</span>
              </legend>
              {!stores.data ? (
                <Loading />
              ) : !stores.data.stores.length ? (
                <p className="tiny muted">No stores yet. Create one first.</p>
              ) : (
                <div className="stack" style={{ "--gap": "6px", maxHeight: 200, overflowY: "auto" } as React.CSSProperties}>
                  {stores.data.stores.map((s) => (
                    <label key={s.id} className="check">
                      <input
                        type="checkbox"
                        checked={f.storeIds.includes(s.id)}
                        onChange={(e) => setF({ ...f, storeIds: e.target.checked ? [...f.storeIds, s.id] : f.storeIds.filter((x) => x !== s.id) })}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}
          {f.role === "platform_admin" && <div className="alert alert-warning">Administrators can see and change everything on the platform. Invite only people you trust.</div>}
          <Button type="submit">Send invitation</Button>
        </form>
      )}
    </Modal>
  );
}

function UserView() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { data, error, loading, reload } = useApi<any>(`/admin/users/${id}`);
  const { busy, run } = useAction();
  const [role, setRole] = useState("store_owner");
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const u = data.user;
  const roles: string[] = data.roles.map((r: any) => r.key);
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <Link to="/admin/users" className="small">
        ← Users
      </Link>
      <PageHead title={u.name} eyebrow={u.email} actions={<StatusBadge status={u.status} />} />
      <div className="grid" style={{ "--min": "320px", alignItems: "start" } as React.CSSProperties}>
        <section className="card stack">
          <h2 className="h3">Account</h2>
          <div className="small">
            Joined {date(u.created_at)} · Email {u.email_verified_at ? "verified" : "not verified"} · {data.sessions} active session{data.sessions === 1 ? "" : "s"}
          </div>
          {u.id !== me?.id && (
            <div className="row">
              {u.status === "active" ? (
                <Button className="btn-outline btn-sm" loading={busy} onClick={() => { const reason = ask("Reason for suspending this account?"); if (reason) run(() => api.post(`/admin/users/${u.id}/status`, { status: "suspended", reason }), "Account suspended and signed out.", reload); }}>
                  Suspend
                </Button>
              ) : (
                <Button className="btn-sm" loading={busy} onClick={() => { const reason = ask("Reason for reactivating?"); if (reason) run(() => api.post(`/admin/users/${u.id}/status`, { status: "active", reason }), "Account reactivated.", reload); }}>
                  Reactivate
                </Button>
              )}
              <Button className="btn-outline btn-sm" loading={busy} onClick={() => run(() => api.post(`/admin/users/${u.id}/revoke-sessions`), "All sessions signed out.", reload)}>
                Sign out everywhere
              </Button>
              <Button className="btn-outline btn-sm" loading={busy} onClick={() => run(() => api.post(`/admin/users/${u.id}/password-reset`), "A password reset link was sent to the user's email.")}>
                Send password reset
              </Button>
            </div>
          )}
          <p className="tiny muted">Administrators never see passwords. Recovery links go only to the account's own email.</p>
        </section>
        <section className="card stack">
          <h2 className="h3">Roles</h2>
          {data.roles.map((r: any) => (
            <div key={r.key} className="spread small">
              <span>
                {titleCase(r.key)} <span className="muted">· since {date(r.created_at)}{r.granted_by ? ` by ${r.granted_by}` : ""}</span>
              </span>
              {r.key !== "customer" && (
                <button className="link small" onClick={() => { const reason = ask(`Reason for removing ${titleCase(r.key)}?`); if (reason) run(() => api.post(`/admin/users/${u.id}/roles`, { role: r.key, action: "revoke", reason }), "Role removed.", reload); }}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <div className="row">
            <select className="select" style={{ width: "auto" }} aria-label="Role to grant" value={role} onChange={(e) => setRole(e.target.value)}>
              {["store_owner", "delivery_partner", "platform_admin"].filter((r) => !roles.includes(r)).map((r) => (
                <option key={r} value={r}>
                  {titleCase(r)}
                </option>
              ))}
            </select>
            <Button className="btn-outline btn-sm" loading={busy} onClick={() => { const reason = ask(`Reason for granting ${titleCase(role)}?`); if (reason) run(() => api.post(`/admin/users/${u.id}/roles`, { role, action: "grant", reason }), "Role granted. The user must sign in again.", reload); }}>
              Grant
            </Button>
          </div>
          {data.stores.length > 0 && <div className="small">Stores: {data.stores.map((s: any) => `${s.name} (${titleCase(s.member_role)})`).join(", ")}</div>}
        </section>
        <section className="card stack">
          <h2 className="h3">Loyalty points</h2>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const delta = Number(fd.get("delta"));
              const reason = String(fd.get("reason") ?? "");
              run(() => api.post(`/admin/users/${u.id}/points`, { delta, reason }), "Points updated.", () => (e.target as HTMLFormElement).reset());
            }}
          >
            <input name="delta" className="input" style={{ width: 110 }} inputMode="numeric" placeholder="+100 / -50" aria-label="Points to add or remove" required />
            <input name="reason" className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Reason (shown to the customer)" aria-label="Reason" required minLength={3} />
            <Button type="submit" className="btn-outline btn-sm" loading={busy}>
              Adjust
            </Button>
          </form>
        </section>
        <section className="card stack">
          <h2 className="h3">Recent orders</h2>
          {data.orders.length ? data.orders.map((o: any) => <Link key={o.number} to={`/admin/orders/${o.number}`} className="spread small"><span>{o.number}</span><span><StatusBadge status={o.status} label={o.statusLabel} /> {inr(o.totalPaise)}</span></Link>) : <p className="small muted">No orders.</p>}
        </section>
        <section className="card stack">
          <h2 className="h3">Security events</h2>
          {data.security.map((s: any, i: number) => (
            <div key={i} className="small">
              {s.action} <span className="muted">· {s.ip} · {dateTime(s.created_at)}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Stores() {
  const { data, error, loading, reload } = useApi<{ stores: any[] }>("/admin/stores");
  const { busy, run } = useAction();
  const [create, setCreate] = useState(false);
  const [invite, setInvite] = useState<number | null>(null);
  const [f, setF] = useState({ name: "", description: "", pickupAddress: "", pickupPincode: "" });
  return (
    <div className="stack">
      <PageHead title="Stores" actions={<button className="btn" onClick={() => setCreate(true)}>+ New store</button>} />
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Store</th>
                <th>Owners</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data!.stores.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <div className="tiny muted">{s.slug}</div>
                  </td>
                  <td className="small">{s.owners ?? <span className="muted">None</span>}</td>
                  <td>{s.products}</td>
                  <td>
                    <Link to={`/admin/orders?storeId=${s.id}`}>{s.orders}</Link>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="row" style={{ "--gap": "6px" } as React.CSSProperties}>
                    {s.status !== "active" && (
                      <Button className="btn-sm" loading={busy} onClick={() => run(() => api.patch(`/admin/stores/${s.id}`, { status: "active", reason: "Approved" }), "Store activated.", reload)}>
                        Activate
                      </Button>
                    )}
                    {s.status === "active" && (
                      <Button className="btn-outline btn-sm" loading={busy} onClick={() => { const reason = ask("Reason for suspending this store?"); if (reason) run(() => api.patch(`/admin/stores/${s.id}`, { status: "suspended", reason }), "Store suspended.", reload); }}>
                        Suspend
                      </Button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setInvite(s.id)}>
                      Invite owner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {create && (
        <Modal title="New store" onClose={() => setCreate(false)}>
          <form className="stack" onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.post("/admin/stores", { ...f, pickupPincode: f.pickupPincode || null }), "Store created. Invite an owner, then activate it.", reload)) setCreate(false); }}>
            <TextField label="Store name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <TextArea label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <TextField label="Pickup address" value={f.pickupAddress} onChange={(e) => setF({ ...f, pickupAddress: e.target.value })} />
            <TextField label="Pickup PIN code" value={f.pickupPincode} onChange={(e) => setF({ ...f, pickupPincode: e.target.value })} />
            <Button type="submit" loading={busy}>
              Create store
            </Button>
          </form>
        </Modal>
      )}
      {invite && <InviteModal storeId={invite} onClose={() => (setInvite(null), reload())} />}
    </div>
  );
}

function Catalog() {
  const [q, setQ] = useState("");
  const { data, reload } = useApi<{ products: any[] }>(`/admin/products?q=${encodeURIComponent(q)}`);
  const { run } = useAction();
  return (
    <div className="stack" style={{ "--gap": "24px" } as React.CSSProperties}>
      <PageHead title="Catalog" eyebrow="Moderation & homepage merchandising" actions={<Link className="btn" to="/admin/catalog/new">+ New product</Link>} />
      <input className="input" style={{ maxWidth: 300 }} placeholder="Search products or stores" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Product</th>
              <th>Store</th>
              <th className="r">From</th>
              <th>Homepage slot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/admin/catalog/${p.store_id}/${p.id}`}>{p.name}</Link>{" "}
                  <Link to={`/product/${p.slug}`} target="_blank" className="tiny muted">
                    View ↗
                  </Link>
                </td>
                <td>{p.store}</td>
                <td className="r num">{inr(p.price_paise)}</td>
                <td>
                  <select className="select" style={{ width: 90, minHeight: 34 }} aria-label={`Homepage slot for ${p.name}`} value={p.showcase_order ?? ""} onChange={(e) => run(() => api.patch(`/admin/products/${p.id}`, { showcaseOrder: e.target.value ? Number(e.target.value) : null }), "Homepage updated.", reload)}>
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {String(n).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select className="select" style={{ width: 120, minHeight: 34 }} aria-label={`Status of ${p.name}`} value={p.status} onChange={(e) => { const reason = e.target.value === "archived" ? ask("Reason for removing this listing?") : "Status change"; if (reason) run(() => api.patch(`/admin/products/${p.id}`, { status: e.target.value, reason }), "Product updated.", reload); }}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tiny muted">The homepage shows the first four slotted products in the cinematic showcase. Their editorial artwork comes from each product's hero image.</p>
      <p className="small">
        <Link to="/admin/categories">Manage categories →</Link>
      </p>
    </div>
  );
}

function Orders() {
  const params = new URLSearchParams(location.search);
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [q, setQ] = useState("");
  const storeId = params.get("storeId") ?? "";
  const { data, error, loading, reload } = useApi<{ orders: any[]; statuses: Record<string, string> }>(`/admin/orders?status=${status}&q=${encodeURIComponent(q)}&storeId=${storeId}`);
  return (
    <div className="stack">
      <PageHead title="Orders" eyebrow={storeId ? "Filtered by store" : "All stores"} />
      <div className="row">
        <input className="input" style={{ maxWidth: 280 }} placeholder="Order number, email or name" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ width: "auto" }} aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {data && Object.entries(data.statuses).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
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
                <th>Store</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.number}>
                  <td>
                    <Link to={`/admin/orders/${o.number}`}>{o.number}</Link>
                  </td>
                  <td>{relative(o.placedAt)}</td>
                  <td>{o.customerName}</td>
                  <td>{o.storeName}</td>
                  <td>
                    <StatusBadge status={o.paymentStatus} />
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

function OrderView() {
  const { number = "" } = useParams();
  const { data, error, loading, reload } = useApi<{ order: OrderDetail; payments: any[]; audits: any[]; refundsAll: any[]; partners: any[] }>(`/admin/orders/${number}`);
  const { busy, run } = useAction();
  const [partner, setPartner] = useState("");
  const [refund, setRefund] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading && !data) return <Loading />;
  const o = data!.order;
  const assignable = ["ready_for_dispatch", "shipped", "out_for_delivery"].includes(o.status);
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <Link to="/admin/orders" className="small">
        ← Orders
      </Link>
      <PageHead
        title={`Order ${o.number}`}
        eyebrow={`${o.storeName} · placed ${dateTime(o.placedAt)}`}
        actions={
          <>
            <StatusBadge status={o.status} label={o.statusLabel} />
            <a className="btn btn-outline btn-sm" href={`/api/admin/orders/${o.number}/invoice`} target="_blank" rel="noopener">
              Invoice
            </a>
          </>
        }
      />
      <div className="card row">
        {["confirmed", "processing", "ready_for_dispatch", "cancellation_requested"].includes(o.status) && (
          <Button className="btn-outline" loading={busy} onClick={() => { const r = ask("Reason for cancelling (shared with the customer)?"); if (r) run(() => api.post(`/admin/orders/${o.number}/cancel`, { reason: r }), "Order cancelled.", reload); }}>
            Cancel order
          </Button>
        )}
        {o.status === "confirmed" && (
          <Button className="btn-outline" loading={busy} onClick={() => { const note = ask("Note for moving to processing?"); if (note) run(() => api.post(`/admin/orders/${o.number}/status`, { to: "processing", note }), "Order updated.", reload); }}>
            Mark processing
          </Button>
        )}
        {o.status === "processing" && (
          <Button className="btn-outline" loading={busy} onClick={() => { const note = ask("Note for marking ready for dispatch?"); if (note) run(() => api.post(`/admin/orders/${o.number}/status`, { to: "ready_for_dispatch", note }), "Order ready for dispatch.", reload); }}>
            Mark ready for dispatch
          </Button>
        )}
        {assignable && (
          <form className="row" onSubmit={(e) => (e.preventDefault(), run(() => api.post(`/admin/orders/${o.number}/assign`, { partnerId: Number(partner) }), "Delivery partner assigned.", reload))}>
            <select className="select" style={{ width: "auto" }} aria-label="Delivery partner" required value={partner} onChange={(e) => setPartner(e.target.value)}>
              <option value="">{o.shipments.some((s) => s.partner) ? "Reassign to…" : "Assign partner…"}</option>
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
        {o.status === "ready_for_dispatch" && !o.shipments.some((s) => s.carrier === "shiprocket") && (
          <Button className="btn-outline" loading={busy} onClick={() => run(() => api.post(`/admin/orders/${o.number}/courier`), "Courier booked.", reload)}>
            Book courier
          </Button>
        )}
        {o.shipments.some((s) => s.carrier === "shiprocket") && (
          <Button className="btn-ghost" loading={busy} onClick={() => run(() => api.post(`/admin/orders/${o.number}/courier/sync`), "Tracking refreshed.", reload)}>
            Refresh courier tracking
          </Button>
        )}
        <button className="btn btn-outline" onClick={() => setRefund(true)}>
          Issue refund
        </button>
      </div>
      <div className="two-col">
        <div className="stack">
          <section className="card stack">
            <h2 className="h3">Items</h2>
            <OrderLines o={o} />
          </section>
          <section className="card stack">
            <h2 className="h3">Delivery</h2>
            <ShipmentTracking o={o} />
          </section>
          <section className="card stack">
            <h2 className="h3">Payments & refunds</h2>
            {data!.payments.length === 0 && <p className="small muted">{o.paymentMethod === "cod" ? "Cash on delivery — no online payment." : "No payment attempts recorded."}</p>}
            {data!.payments.map((p) => (
              <div key={p.id} className="small">
                {p.provider} · {p.provider_payment_id ?? p.provider_order_id} · {inr(p.amount_paise)} <StatusBadge status={p.status} /> {p.failure_reason && <span className="muted">({p.failure_reason})</span>}
              </div>
            ))}
            {data!.refundsAll.map((r) => (
              <div key={r.id} className="spread small">
                <span>
                  Refund #{r.id} · {inr(r.amount_paise)} · {r.reason}
                </span>
                <span className="row">
                  <StatusBadge status={r.status} />
                  {r.status === "manual" && !r.provider_refund_id && (
                    <button className="link small" onClick={() => { const ref = ask("Bank transfer / UTR reference for this payout?"); if (ref) run(() => api.post(`/admin/refunds/${r.id}/settle`, { reference: ref }), "Refund recorded as settled.", reload); }}>
                      Record payout
                    </button>
                  )}
                </span>
              </div>
            ))}
          </section>
        </div>
        <aside className="stack">
          <section className="card stack small">
            <h2 className="h3">Customer</h2>
            <div>
              {o.customer?.name} · {o.customer?.email}
            </div>
            <div>
              {o.shippingAddress.name}, {formatAddress(o.shippingAddress)} · {o.shippingAddress.phone}
            </div>
          </section>
          <section className="card stack">
            <h2 className="h3">History</h2>
            <OrderTimeline o={o} />
          </section>
          {data!.audits.length > 0 && (
            <section className="card stack">
              <h2 className="h3">Audit</h2>
              {data!.audits.map((a, i) => (
                <div key={i} className="tiny">
                  <strong>{a.action}</strong> · {a.actor ?? "System"} · {dateTime(a.created_at)}
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>
      {refund && (
        <Modal title="Issue refund" onClose={() => setRefund(false)}>
          <form className="stack" onSubmit={async (e) => { e.preventDefault(); if (await run(() => api.post(`/admin/orders/${o.number}/refund`, { amountPaise: Math.round(Number(amount) * 100), reason }), "Refund started.", reload)) setRefund(false); }}>
            <p className="small muted">
              Paid {inr(o.totalPaise)} · already refunded {inr(o.refundedPaise)}. Online refunds are confirmed by Razorpay; cash-on-delivery refunds are paid out manually.
            </p>
            <TextField label="Amount (₹)" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <TextArea label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button className="btn-danger" type="submit" loading={busy} disabled={!amount || reason.trim().length < 3}>
              Refund {amount ? inr(Math.round(Number(amount) * 100)) : ""}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Delivery() {
  const partners = useApi<{ partners: any[] }>("/admin/delivery-partners");
  const shipments = useApi<{ shipments: any[] }>("/admin/shipments");
  const { busy, run } = useAction();
  const [tab, setTab] = useState<"partners" | "shipments">("partners");
  return (
    <div className="stack">
      <PageHead title="Delivery" />
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "partners"} onClick={() => setTab("partners")}>
          Partners
        </button>
        <button role="tab" aria-selected={tab === "shipments"} onClick={() => setTab("shipments")}>
          Shipments
        </button>
      </div>
      {tab === "partners" ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Service area</th>
                <th>Availability</th>
                <th>Open</th>
                <th>Delivered / failed</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {partners.data?.partners.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/admin/users/${p.id}`}>{p.name}</Link>
                    <div className="tiny muted">{p.email}</div>
                  </td>
                  <td>
                    {(p.city || p.state) && <div className="small" style={{ fontWeight: 600 }}>{[p.city, p.state].filter(Boolean).join(", ")}</div>}
                    <button className="link small" onClick={() => { const v = prompt("PIN code prefixes served (comma-separated):", p.service_pincodes); if (v != null) run(() => api.patch(`/admin/delivery-partners/${p.id}`, { servicePincodes: v }), "Service area updated.", partners.reload); }}>
                      {p.service_pincodes || "Set area"}
                    </button>
                  </td>
                  <td>
                    <StatusBadge status={p.availability} />
                  </td>
                  <td>{p.open_assignments}</td>
                  <td>
                    {p.delivered} / {p.failed}
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    {p.status !== "approved" ? (
                      <Button className="btn-sm" loading={busy} onClick={() => run(() => api.patch(`/admin/delivery-partners/${p.id}`, { status: "approved" }), "Partner approved.", partners.reload)}>
                        Approve
                      </Button>
                    ) : (
                      <Button className="btn-outline btn-sm" loading={busy} onClick={() => { const reason = ask("Reason for suspending?"); if (reason) run(() => api.patch(`/admin/delivery-partners/${p.id}`, { status: "suspended", reason }), "Partner suspended.", partners.reload); }}>
                        Suspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Order</th>
                <th>Store</th>
                <th>Destination</th>
                <th>Partner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.data?.shipments.map((s) => (
                <tr key={s.id}>
                  <td>{s.tracking_number}</td>
                  <td>
                    <Link to={`/admin/orders/${s.number}`}>{s.number}</Link>
                  </td>
                  <td>{s.store}</td>
                  <td>
                    {s.ship_city} {s.ship_pincode}
                  </td>
                  <td>{s.partner ?? <span className="muted">Unassigned</span>}</td>
                  <td>
                    <StatusBadge status={s.status} />
                    {s.failure_reason && <div className="tiny muted">{s.failure_reason}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Reviews() {
  const [status, setStatus] = useState("published");
  const { data, reload } = useApi<{ reviews: any[] }>(`/admin/reviews?status=${status}`);
  const { run } = useAction();
  return (
    <div className="stack">
      <PageHead title="Customer reviews" />
      <div className="row">
        {[["published", "Live"], ["rejected", "Removed"]].map(([s, label]) => (
          <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {label}
          </button>
        ))}
      </div>
      {!data?.reviews.length && <Empty title="Nothing here" />}
      {data?.reviews.map((r) => (
        <div key={r.id} className="card stack" style={{ "--gap": "6px" } as React.CSSProperties}>
          <div className="spread small">
            <span>
              <span className="stars">{"★".repeat(r.rating)}</span> on <Link to={`/product/${r.slug}`}>{r.product}</Link> by {r.author} {r.verified_purchase ? <span className="badge badge-success">Verified purchase</span> : null}
            </span>
            <span className="muted">{relative(r.created_at)}</span>
          </div>
          {r.title && <strong>{r.title}</strong>}
          {r.body && <p className="small">{r.body}</p>}
          <ReviewPhotos photos={r.photos} />
          <div className="row">
            {r.status !== "published" && (
              <button className="btn btn-sm" onClick={() => run(() => api.post(`/admin/reviews/${r.id}`, { status: "published" }), "Review restored.", reload)}>
                Restore
              </button>
            )}
            {r.status !== "rejected" && (
              <button className="btn btn-outline btn-sm" onClick={() => run(() => api.post(`/admin/reviews/${r.id}`, { status: "rejected" }), "Review removed.", reload)}>
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Support() {
  const { id } = useParams();
  const list = useApi<{ tickets: any[] }>(id ? null : "/admin/tickets");
  const one = useApi<{ ticket: any; messages: any[] }>(id ? `/admin/tickets/${id}` : null);
  const { busy, run } = useAction();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("pending");
  if (id) {
    if (!one.data) return one.error ? <ErrorState error={one.error} /> : <Loading />;
    const t = one.data.ticket;
    return (
      <div className="stack" style={{ maxWidth: 760 }}>
        <Link to="/admin/support" className="small">
          ← Support
        </Link>
        <PageHead title={t.subject} eyebrow={`#${t.id} · ${t.name} <${t.email}> · ${t.category}${t.order_number ? ` · order ${t.order_number}` : ""}`} actions={<StatusBadge status={t.status} />} />
        {one.data.messages.map((m) => (
          <div key={m.id} className="card card-flat" style={{ background: m.is_staff ? "var(--surface-2)" : undefined }}>
            <div className="tiny muted">
              {m.is_staff ? `${m.author} (staff)` : m.author ?? t.name} · {dateTime(m.created_at)}
            </div>
            <p className="small" style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
              {m.body}
            </p>
            {m.photo && (
              <a href={`/api/support/photos/${m.photo}`} target="_blank" rel="noopener">
                <img src={`/api/support/photos/${m.photo}`} alt="Photo from the customer" className="chat-photo" loading="lazy" />
              </a>
            )}
          </div>
        ))}
        <form className="card stack" onSubmit={(e) => (e.preventDefault(), run(() => api.post(`/admin/tickets/${id}/reply`, { body, status }), "Reply sent.", () => (setBody(""), one.reload())))}>
          <TextArea label="Reply" required value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="row">
            <SelectField label="Then set status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Waiting on customer</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </SelectField>
            <Button type="submit" loading={busy} style={{ marginTop: 20 }}>
              Send reply
            </Button>
          </div>
        </form>
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHead title="Support tickets" />
      {!list.data?.tickets.length ? (
        <Empty title="No tickets" />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>From</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {list.data.tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/admin/support/${t.id}`}>
                      #{t.id} {t.subject}
                    </Link>
                  </td>
                  <td>{t.name || t.email}</td>
                  <td>{t.category}</td>
                  <td>
                    <span className={`badge ${t.priority === "urgent" || t.priority === "high" ? "badge-danger" : ""}`}>{t.priority}</span>
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{relative(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Audit() {
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const { data, error } = useApi<{ events: any[] }>(`/admin/audit?action=${encodeURIComponent(action)}&actor=${encodeURIComponent(actor)}`);
  return (
    <div className="stack">
      <PageHead title="Audit log" actions={<a className="btn btn-outline btn-sm" href={`/api/admin/audit?format=csv&action=${encodeURIComponent(action)}&actor=${encodeURIComponent(actor)}`}>Export CSV</a>} />
      <div className="row">
        <input className="input" style={{ maxWidth: 220 }} placeholder="Action (e.g. role., order.)" aria-label="Filter by action" value={action} onChange={(e) => setAction(e.target.value)} />
        <input className="input" style={{ maxWidth: 220 }} placeholder="Actor name or email" aria-label="Filter by actor" value={actor} onChange={(e) => setActor(e.target.value)} />
      </div>
      {error ? (
        <ErrorState error={error} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {data?.events.map((e) => (
                <tr key={e.id}>
                  <td className="small">{dateTime(e.created_at)}</td>
                  <td className="small">{e.actor_name ?? "System"}</td>
                  <td>
                    <code className="small">{e.action}</code>
                  </td>
                  <td className="small">
                    {e.entity_type} {e.entity_id}
                  </td>
                  <td className="tiny muted" style={{ maxWidth: 320, wordBreak: "break-word" }}>
                    {Object.keys(e.details).length ? JSON.stringify(e.details) : ""}
                  </td>
                  <td className="tiny muted">{e.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DevEmails() {
  const { data, error } = useApi<{ emails: any[] }>("/admin/dev-emails");
  if (error) return <ErrorState error={error} />;
  return (
    <div className="stack">
      <PageHead title="Email outbox (development)" />
      <div className="alert alert-warning">Email delivery isn't configured. These messages were logged instead of sent. This page is disabled in production.</div>
      {data?.emails.map((m) => (
        <details key={m.id} className="card card-flat">
          <summary className="small" style={{ cursor: "pointer" }}>
            <StatusBadge status={m.status === "logged" ? "pending" : m.status} label={m.status} /> {m.subject} → {m.to_email} · {relative(m.created_at)}
          </summary>
          <pre className="small" style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
            {m.body}
          </pre>
        </details>
      ))}
    </div>
  );
}

/** Pick which store a new product belongs to, then open the shared product form. */
function NewProduct() {
  const { data, error } = useApi<{ stores: { id: number; name: string; status: string }[] }>("/admin/catalog/stores");
  const [storeId, setStoreId] = useState<number | null>(null);
  if (error) return <ErrorState error={error} />;
  if (!data) return <Loading />;
  if (!data.stores.length) return <Empty title="No stores yet" action={<Link className="btn" to="/admin/stores">Create a store</Link>}>Products belong to a store. Create one first.</Empty>;
  const chosen = storeId ?? (data.stores.length === 1 ? data.stores[0].id : null);
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <SelectField label="Store" required value={chosen ?? ""} onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : null)} hint="The store that sells and ships this product.">
        <option value="">Choose a store…</option>
        {data.stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.status !== "active" ? ` (${s.status})` : ""}
          </option>
        ))}
      </SelectField>
      {chosen && <ProductEditor key={chosen} storeId={chosen} productId="new" base={`/admin/catalog/${chosen}`} back="/admin/catalog" />}
    </div>
  );
}

function AdminProduct() {
  const { storeId } = useParams();
  return <ProductEditor storeId={Number(storeId)} base={`/admin/catalog/${storeId}`} back="/admin/catalog" />;
}

export default function Admin() {
  const { user } = useAuth();
  const has = (p: string) => user?.permissions.includes(p);
  const nav = [
    { to: "/admin", label: "Overview", end: true },
    has("admin.orders") && { to: "/admin/orders", label: "Orders" },
    has("admin.finance") && { to: "/admin/reports", label: "Reports" },
    has("admin.users") && { to: "/admin/users", label: "Users & roles" },
    has("admin.stores") && { to: "/admin/stores", label: "Stores" },
    has("admin.catalog") && { to: "/admin/catalog", label: "Catalog" },
    has("admin.catalog") && { to: "/admin/categories", label: "Categories" },
    has("admin.delivery") && { to: "/admin/delivery", label: "Delivery" },
    has("admin.support") && { to: "/admin/reviews", label: "Reviews" },
    has("admin.support") && { to: "/admin/support", label: "Support" },
    has("admin.settings") && { to: "/admin/coupons", label: "Coupons" },
    has("admin.finance") && { to: "/admin/gift-cards", label: "Gift cards" },
    has("admin.support") && { to: "/admin/messages", label: "SMS & WhatsApp" },
    has("admin.settings") && { to: "/admin/settings", label: "Settings" },
    has("admin.audit") && { to: "/admin/audit", label: "Audit log" },
    has("admin.settings") && { to: "/admin/emails", label: "Email outbox" },
  ].filter(Boolean) as { to: string; label: string; end?: boolean }[];
  return (
    <PortalLayout name="Admin" nav={nav}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserView />} />
        <Route path="stores" element={<Stores />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="catalog/new" element={<NewProduct />} />
        <Route path="catalog/:storeId/:id" element={<AdminProduct />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:number" element={<OrderView />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:id" element={<Support />} />
        <Route path="coupons" element={<CouponsAdmin />} />
        <Route path="settings" element={<SettingsPages />} />
        <Route path="settings/:section" element={<SettingsPages />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="categories" element={<CategoriesAdmin />} />
        <Route path="gift-cards" element={<GiftCardsAdmin />} />
        <Route path="messages" element={<MessagesAdmin />} />
        <Route path="audit" element={<Audit />} />
        <Route path="emails" element={<DevEmails />} />
        <Route path="*" element={<Empty title="Not found" />} />
      </Routes>
    </PortalLayout>
  );
}
