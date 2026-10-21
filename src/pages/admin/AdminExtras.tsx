import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useParams } from "react-router-dom";
import { DateRange, PageHead, defaultRange } from "../../components/Portal";
import { ReportsView, type Metrics, type Report } from "../../components/ReportsView";
import { ChartCard, HBars } from "../../components/Charts";
import { Button, ErrorState, Loading, Modal, SelectField, StatusBadge, TextArea, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { date, inr, titleCase } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi } from "../../lib/useApi";

// ───────────────────────────────── Reports ─────────────────────────────────

export function AdminReports() {
  const [range, setRange] = useState(defaultRange());
  const [storeId, setStoreId] = useState("");
  const stores = useApi<{ stores: { id: number; name: string }[] }>("/admin/stores");
  const q = `from=${range.from}&to=${range.to}`;
  const { data, error, loading, reload } = useApi<{
    metrics: Metrics;
    report: Report;
    stores: { id: number; name: string; orders: number; grossPaise: number; discountsPaise: number; refundsPaise: number; netPaise: number }[];
    customers: { buyers: number; repeatBuyers: number; signups: number };
  }>(`/admin/reports?${q}${storeId ? `&storeId=${storeId}` : ""}`);
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <PageHead
        title="Reports"
        eyebrow={storeId ? "Filtered to one store" : "All stores"}
        actions={
          <>
            <select className="select" style={{ width: "auto", minHeight: 34 }} aria-label="Store" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">All stores</option>
              {stores.data?.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
          </>
        }
      />
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : (
        <ReportsView
          m={data!.metrics}
          r={data!.report}
          csv={
            <>
              <a className="btn btn-outline btn-sm" href={`/api/admin/reports/orders.csv?${q}`}>
                All orders CSV
              </a>
              <a className="btn btn-outline btn-sm" href={`/api/admin/reports/stores.csv?${q}`}>
                Sales by store CSV
              </a>
            </>
          }
        >
          <div className="grid" style={{ "--min": "420px", alignItems: "start" } as React.CSSProperties}>
            <ChartCard
              title="Net sales by store"
              table={{ head: ["Store", "Orders", "Gross", "Discounts", "Refunds", "Net"], rows: data!.stores.map((s) => [s.name, s.orders, inr(s.grossPaise), inr(s.discountsPaise), inr(s.refundsPaise), inr(s.netPaise)]) }}
            >
              <HBars data={data!.stores.map((s) => ({ label: s.name, value: s.netPaise, sub: `· ${s.orders} orders` }))} format={inr} />
            </ChartCard>
            <section className="card stack">
              <h2 className="h3">Customers</h2>
              <div className="spread small">
                <span>Customers who ordered in the period</span>
                <strong className="num">{data!.customers.buyers}</strong>
              </div>
              <div className="spread small">
                <span>Repeat customers (all time)</span>
                <strong className="num">{data!.customers.repeatBuyers}</strong>
              </div>
              <div className="spread small">
                <span>New accounts in the period</span>
                <strong className="num">{data!.customers.signups}</strong>
              </div>
            </section>
          </div>
        </ReportsView>
      )}
    </div>
  );
}

// ───────────────────────────────── Settings ─────────────────────────────────

type AnySettings = Record<string, any>;

const SECTIONS: { key: string; label: string; settingKeys: string[] }[] = [
  { key: "brand", label: "Brand", settingKeys: ["brand"] },
  { key: "homepage", label: "Homepage", settingKeys: ["homepage"] },
  { key: "shipping", label: "Shipping", settingKeys: ["shipping"] },
  { key: "payments", label: "Payments & checkout", settingKeys: ["cod", "checkout"] },
  { key: "tax", label: "Tax", settingKeys: ["tax"] },
  { key: "delivery", label: "Delivery", settingKeys: ["delivery"] },
  { key: "returns", label: "Returns & reviews", settingKeys: ["returns", "reviews"] },
  { key: "rewards", label: "Loyalty & referrals", settingKeys: ["loyalty", "referrals", "giftCards"] },
  { key: "messaging", label: "SMS & WhatsApp", settingKeys: ["messaging"] },
  { key: "courier", label: "Courier", settingKeys: ["courier"] },
  { key: "features", label: "Features", settingKeys: ["features"] },
  { key: "maintenance", label: "Maintenance", settingKeys: ["maintenance"] },
  { key: "integrations", label: "Integrations", settingKeys: [] },
];

function Section({ title, description, children, onSave, busy, dirty }: { title: string; description?: string; children: ReactNode; onSave?: () => void; busy?: boolean; dirty?: boolean }) {
  return (
    <section className="card stack" style={{ maxWidth: 760 }}>
      <div>
        <h2 className="h3">{title}</h2>
        {description && <p className="small muted" style={{ marginTop: 4 }}>{description}</p>}
      </div>
      {children}
      {onSave && (
        <div className="row" style={{ justifyContent: "flex-end" }}>
          {dirty && <span className="tiny muted">Unsaved changes</span>}
          <Button loading={busy} disabled={!dirty} onClick={onSave}>
            Save
          </Button>
        </div>
      )}
    </section>
  );
}

export function SettingsPages() {
  const { section = "brand" } = useParams();
  const { data, error, reload } = useApi<{ settings: AnySettings; integrations: Record<string, boolean>; environment: string }>("/admin/settings");
  const toast = useToast();
  const [draft, setDraft] = useState<AnySettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setDraft(structuredClone(data.settings));
  }, [data]);
  if (error) return <ErrorState error={error} retry={reload} />;
  if (!data || !draft) return <Loading />;
  const current = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];
  const dirty = current.settingKeys.some((k) => JSON.stringify(draft[k]) !== JSON.stringify(data.settings[k]));
  const save = async () => {
    setBusy(true);
    try {
      for (const k of current.settingKeys) {
        if (JSON.stringify(draft[k]) !== JSON.stringify(data.settings[k])) await api.put(`/admin/settings/${k}`, draft[k]);
      }
      toast("Settings saved. Changes are recorded in the audit log.", "success");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const setK = (k: string, patch: AnySettings) => setDraft({ ...draft, [k]: { ...draft[k], ...patch } });
  const text = (k: string, f: string) => ({ value: draft[k][f] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setK(k, { [f]: e.target.value }) });
  const num = (k: string, f: string) => ({ type: "number", value: draft[k][f], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setK(k, { [f]: Number(e.target.value) }) });
  const rupees = (k: string, f: string) => ({ type: "number", min: 0, value: draft[k][f] / 100, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setK(k, { [f]: Math.round(Number(e.target.value) * 100) }) });
  const flag = (k: string, f: string, label: string, hint?: string) => (
    <label className="check">
      <input type="checkbox" checked={Boolean(draft[k][f])} onChange={(e) => setK(k, { [f]: e.target.checked })} />
      <span>
        {label}
        {hint && <span className="tiny muted" style={{ display: "block" }}>{hint}</span>}
      </span>
    </label>
  );
  const common = { onSave: save, busy, dirty };

  let body: ReactNode;
  switch (current.key) {
    case "brand":
      body = (
        <Section title="Brand" description="Shown in the homepage, emails, invoices and the footer." {...common}>
          <TextField label="Store name" {...text("brand", "name")} />
          <TextField label="Tagline" {...text("brand", "tagline")} hint="Used as the Our Story headline." />
          <TextField label="Supporting line" {...text("brand", "supportingLine")} />
          <div className="grid" style={{ "--min": "220px" } as React.CSSProperties}>
            <TextField label="Support email" type="email" {...text("brand", "supportEmail")} />
            <TextField label="Support phone" {...text("brand", "supportPhone")} />
          </div>
          <p className="tiny muted">The logo and favicon are part of the site build; replacing them is a code change for now.</p>
        </Section>
      );
      break;
    case "homepage": {
      const sections: AnySettings[] = draft.homepage.sections;
      const setSections = (next: AnySettings[]) => setK("homepage", { sections: next });
      body = (
        <Section title="Homepage" description="The announcement bar and the sections listed in the homepage menu." {...common}>
          <TextArea label="Announcement bar" {...text("homepage", "announcement")} hint="Leave empty to hide. Shown above every page; visitors can dismiss it." />
          <div className="label">Menu sections</div>
          {sections.map((s, i) => (
            <div key={s.key} className="panel row" style={{ "--gap": "10px", alignItems: "flex-end" } as React.CSSProperties}>
              <span className="tiny muted" style={{ width: 70 }}>
                {titleCase(s.key)}
              </span>
              <input className="input" style={{ flex: 1, minWidth: 140 }} aria-label={`${s.key} label`} value={s.label} onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input" style={{ flex: 2, minWidth: 180 }} aria-label={`${s.key} description`} value={s.description} onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              <label className="check">
                <input type="checkbox" checked={s.visible} onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)))} />
                <span>Show</span>
              </label>
              <button type="button" className="icon-btn" aria-label={`Move ${s.label} up`} disabled={i === 0} onClick={() => { const n = [...sections]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setSections(n); }}>
                ↑
              </button>
              <button type="button" className="icon-btn" aria-label={`Move ${s.label} down`} disabled={i === sections.length - 1} onClick={() => { const n = [...sections]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setSections(n); }}>
                ↓
              </button>
            </div>
          ))}
          <p className="tiny muted">Which products appear in the cinematic showcase is set per product under Catalog → Homepage slot.</p>
        </Section>
      );
      break;
    }
    case "shipping":
      body = (
        <Section title="Shipping" description="Fees are charged per store in an order." {...common}>
          <div className="grid" style={{ "--min": "200px" } as React.CSSProperties}>
            <TextField label="Flat fee (₹)" {...rupees("shipping", "flatPaise")} />
            <TextField label="Free shipping from (₹)" {...rupees("shipping", "freeThresholdPaise")} />
            <TextField label="Delivery estimate: min days" {...num("shipping", "estimateDaysMin")} />
            <TextField label="Delivery estimate: max days" {...num("shipping", "estimateDaysMax")} />
          </div>
          <TextArea
            label="Serviceable PIN code prefixes"
            hint="Comma-separated, e.g. 560, 110, 400. Leave empty to deliver everywhere."
            value={draft.shipping.serviceablePincodePrefixes.join(", ")}
            onChange={(e) => setK("shipping", { serviceablePincodePrefixes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
        </Section>
      );
      break;
    case "payments":
      body = (
        <Section title="Payments & checkout" {...common}>
          {flag("cod", "enabled", "Offer cash on delivery")}
          <TextField label="Cash on delivery limit per order (₹)" {...rupees("cod", "maxOrderPaise")} />
          {flag("checkout", "requireVerifiedEmail", "Require a verified email address to place orders")}
          <TextField label="Online payment window (minutes)" {...num("checkout", "paymentWindowMinutes")} hint="Stock is held this long while a customer pays online, then released." />
          <div className="alert alert-info">
            Online payments: {data.integrations.razorpay ? "Razorpay is configured." : "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server."}
          </div>
        </Section>
      );
      break;
    case "tax":
      body = (
        <Section title="Tax" description="Prices are entered inclusive of GST." {...common}>
          <TextArea label="Tax note shown to customers" {...text("tax", "note")} hint="Appears in the bag, checkout, product pages and invoices." />
        </Section>
      );
      break;
    case "delivery":
      body = (
        <Section title="Delivery" {...common}>
          {flag("delivery", "requireOtp", "Require the customer's 6-digit delivery code to complete a delivery", "Recommended. Without it, partners can complete deliveries with just the recipient's name.")}
        </Section>
      );
      break;
    case "returns":
      body = (
        <Section title="Returns & reviews" description="Each product also has its own return window, set by the store." {...common}>
          {flag("returns", "enabled", "Allow customers to request returns and exchanges")}
          {flag("reviews", "requireModeration", "Hold new reviews for moderation before publishing")}
          {flag("reviews", "verifiedPurchaseOnly", "Only customers who received the product can review it")}
        </Section>
      );
      break;
    case "features":
      body = (
        <Section title="Features" description="Switch storefront features on or off. The server enforces these, not just the interface." {...common}>
          {flag("features", "wishlist", "Wishlist")}
          {flag("features", "reviews", "Customer reviews")}
          {flag("features", "coupons", "Coupons at checkout")}
          {flag("features", "assistant", "AI shopping assistant", data.integrations.assistant ? "Uses Claude through your Anthropic API key." : "Needs ANTHROPIC_API_KEY on the server.")}
          {flag("features", "viewer3d", "3D product viewer and AR")}
        </Section>
      );
      break;
    case "rewards":
      body = (
        <Section title="Loyalty, referrals & gift cards" description="Points are earned when an order is delivered and taken back for returned items." {...common}>
          {flag("loyalty", "enabled", "Loyalty points")}
          <div className="grid" style={{ "--min": "200px" } as React.CSSProperties}>
            <TextField label="Points per ₹100 spent" {...num("loyalty", "pointsPerHundredRupees")} />
            <TextField label="Value of 1 point (₹)" type="number" min={0.01} step={0.01} value={draft.loyalty.pointValuePaise / 100} onChange={(e) => setK("loyalty", { pointValuePaise: Math.round(Number(e.target.value) * 100) })} />
            <TextField label="Max % of an order payable with points" {...num("loyalty", "maxRedeemPercent")} />
          </div>
          <p className="tiny muted">
            Effective reward rate: {((draft.loyalty.pointsPerHundredRupees * draft.loyalty.pointValuePaise) / 100).toFixed(2)}% back.
          </p>
          {flag("referrals", "enabled", "Referral programme")}
          <div className="grid" style={{ "--min": "200px" } as React.CSSProperties}>
            <TextField label="Points for the referrer" {...num("referrals", "referrerPoints")} />
            <TextField label="Points for the new customer" {...num("referrals", "refereePoints")} />
          </div>
          <p className="tiny muted">Referral points are awarded when the new customer's first order is delivered, so cancelled or fake orders earn nothing.</p>
          {flag("giftCards", "enabled", "Accept gift cards at checkout")}
        </Section>
      );
      break;
    case "messaging":
      body = (
        <Section title="SMS & WhatsApp" description="Sent only to customers who opt in from their account settings." {...common}>
          {flag("messaging", "orderPlaced", "Order confirmed")}
          {flag("messaging", "outForDelivery", "Out for delivery (includes the delivery code)")}
          {flag("messaging", "delivered", "Delivered")}
          {flag("messaging", "preferWhatsApp", "Prefer WhatsApp when a customer allows both")}
          <div className="alert alert-info">
            SMS: {data.integrations.sms ? "configured" : "not configured"} · WhatsApp: {data.integrations.whatsapp ? "configured" : "not configured"} (Twilio). Indian SMS needs DLT-registered templates, and
            WhatsApp business messages need approved templates — see docs/INTEGRATIONS.md.
          </div>
        </Section>
      );
      break;
    case "courier":
      body = (
        <Section title="Courier (Shiprocket)" description="Used when a store books a courier for an order instead of a CrownCart delivery partner." {...common}>
          <TextField label="Pickup location name" {...text("courier", "pickupLocation")} hint="Must match a pickup address name in your Shiprocket account exactly." />
          <div className="grid" style={{ "--min": "160px" } as React.CSSProperties}>
            <TextField label="Default weight (kg)" type="number" step={0.05} value={draft.courier.defaultWeightKg} onChange={(e) => setK("courier", { defaultWeightKg: Number(e.target.value) })} />
            <TextField label="Length (cm)" {...num("courier", "lengthCm")} />
            <TextField label="Breadth (cm)" {...num("courier", "breadthCm")} />
            <TextField label="Height (cm)" {...num("courier", "heightCm")} />
          </div>
          <div className="alert alert-info">
            Shiprocket: {data.integrations.courier ? "configured" : "not configured"} · tracking webhook: {data.integrations.courierWebhook ? "configured" : "not configured"}.
          </div>
        </Section>
      );
      break;
    case "maintenance":
      body = (
        <Section title="Maintenance mode" description="Pauses checkout and other changes for customers. Browsing and the admin portal keep working." {...common}>
          {flag("maintenance", "enabled", "Maintenance mode on")}
          <TextArea label="Message shown to visitors" {...text("maintenance", "message")} />
          {draft.maintenance.enabled && <div className="alert alert-warning">Customers can't place orders while this is on.</div>}
        </Section>
      );
      break;
    default:
      body = (
        <Section title="Integrations" description="Credentials are read from the server environment and are never shown or edited here.">
          <div className="stack">
            {Object.entries(data.integrations).map(([k, v]) => (
              <div key={k} className="spread small">
                <span>{titleCase(k)}</span>
                <span className={`badge ${v ? "badge-success" : "badge-warning"}`}>{v ? "Configured" : "Not configured"}</span>
              </div>
            ))}
          </div>
          <p className="tiny muted">Environment: {data.environment}. See .env.example for the variables each integration needs.</p>
        </Section>
      );
  }

  return (
    <div className="stack">
      <PageHead title="Settings" />
      <nav className="tabs" aria-label="Settings sections">
        {SECTIONS.map((s) => (
          <NavLink key={s.key} to={`/admin/settings/${s.key}`} className={({ isActive }) => (isActive || (s.key === "brand" && !section) ? "active" : "")}>
            {s.label}
          </NavLink>
        ))}
      </nav>
      {body}
    </div>
  );
}

// ───────────────────────────────── Coupons ─────────────────────────────────

export function CouponsAdmin() {
  const { data, reload } = useApi<{ coupons: any[] }>("/admin/coupons");
  const toast = useToast();
  const blank = { code: "", kind: "percent", value: "", minOrder: "", maxDiscount: "", usageLimit: "", perUserLimit: "1", startsAt: "", endsAt: "", description: "", firstOrderOnly: false };
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  return (
    <div className="stack">
      <PageHead title="Coupons" eyebrow="Platform-wide coupons apply to every store" actions={<button className="btn" onClick={() => setOpen(true)}>+ New coupon</button>} />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Scope</th>
              <th>Discount</th>
              <th>Conditions</th>
              <th>Used</th>
              <th>Valid</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {data?.coupons.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.code}</strong>
                  <div className="tiny muted">{c.description}</div>
                </td>
                <td>{c.store ?? "All stores"}</td>
                <td>{c.kind === "percent" ? `${c.value}%${c.max_discount_paise ? ` up to ${inr(c.max_discount_paise)}` : ""}` : inr(c.value)}</td>
                <td className="tiny">
                  {[c.min_order_paise ? `min ${inr(c.min_order_paise)}` : "", c.first_order_only ? "first order" : "", `${c.per_user_limit}/customer`].filter(Boolean).join(" · ")}
                </td>
                <td>
                  {c.used}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="tiny">
                  {c.starts_at ? date(c.starts_at) : "now"} – {c.ends_at ? date(c.ends_at) : "no end"}
                </td>
                <td>
                  <input type="checkbox" aria-label={`${c.code} active`} checked={Boolean(c.is_active)} onChange={(e) => api.patch(`/admin/coupons/${c.id}`, { isActive: e.target.checked }).then(reload).catch((err) => toast(errorMessage(err), "error"))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal title="New platform coupon" onClose={() => setOpen(false)} wide>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api.post("/admin/coupons", {
                  code: f.code,
                  kind: f.kind,
                  value: f.kind === "percent" ? Number(f.value) : Math.round(Number(f.value) * 100),
                  minOrderPaise: Math.round(Number(f.minOrder || 0) * 100),
                  maxDiscountPaise: f.maxDiscount ? Math.round(Number(f.maxDiscount) * 100) : null,
                  usageLimit: f.usageLimit ? Number(f.usageLimit) : null,
                  perUserLimit: Number(f.perUserLimit || 1),
                  startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
                  endsAt: f.endsAt ? new Date(`${f.endsAt}T23:59:59`).toISOString() : null,
                  description: f.description,
                  firstOrderOnly: f.firstOrderOnly,
                });
                toast("Coupon created.", "success");
                setF(blank);
                setOpen(false);
                reload();
              } catch (err) {
                toast(errorMessage(err), "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="grid" style={{ "--min": "180px" } as React.CSSProperties}>
              <TextField label="Code" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
              <SelectField label="Type" value={f.kind} onChange={set("kind")}>
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount (₹)</option>
              </SelectField>
              <TextField label={f.kind === "percent" ? "Percent (max 90)" : "Amount (₹)"} required value={f.value} onChange={set("value")} />
              <TextField label="Max discount (₹)" value={f.maxDiscount} onChange={set("maxDiscount")} />
              <TextField label="Minimum order (₹)" value={f.minOrder} onChange={set("minOrder")} />
              <TextField label="Total uses" value={f.usageLimit} onChange={set("usageLimit")} hint="Empty = unlimited" />
              <TextField label="Uses per customer" value={f.perUserLimit} onChange={set("perUserLimit")} />
              <TextField label="Starts" type="date" value={f.startsAt} onChange={set("startsAt")} />
              <TextField label="Ends" type="date" value={f.endsAt} onChange={set("endsAt")} />
            </div>
            <TextField label="Description shown to customers" value={f.description} onChange={set("description")} />
            <label className="check">
              <input type="checkbox" checked={f.firstOrderOnly} onChange={set("firstOrderOnly")} />
              <span>First order only</span>
            </label>
            <Button type="submit" loading={busy}>
              Create coupon
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ───────────────────────────────── Categories ─────────────────────────────────

export function CategoriesAdmin() {
  const { data, reload } = useApi<{ categories: { id: number; name: string; slug: string; description: string; parent_id: number | null; sort_order: number; is_active: number; products: number }[] }>("/admin/categories");
  const toast = useToast();
  const [editing, setEditing] = useState<any | "new" | null>(null);
  const [f, setF] = useState({ name: "", description: "", parentId: "", sortOrder: "0" });
  const open = (c: any | "new") => {
    setEditing(c);
    setF(c === "new" ? { name: "", description: "", parentId: "", sortOrder: "0" } : { name: c.name, description: c.description, parentId: c.parent_id ? String(c.parent_id) : "", sortOrder: String(c.sort_order) });
  };
  const cats = data?.categories ?? [];
  const parentName = (id: number | null) => cats.find((c) => c.id === id)?.name;
  return (
    <div className="stack">
      <PageHead title="Categories" eyebrow="Platform-wide; stores choose from these" actions={<button className="btn" onClick={() => open("new")}>+ New category</button>} />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Category</th>
              <th>Parent</th>
              <th className="r">Order</th>
              <th className="r">Products</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <div className="tiny muted">/shop/{c.slug}</div>
                </td>
                <td>{parentName(c.parent_id) ?? "—"}</td>
                <td className="r num">{c.sort_order}</td>
                <td className="r num">{c.products}</td>
                <td>
                  <StatusBadge status={c.is_active ? "active" : "draft"} label={c.is_active ? "Active" : "Hidden"} />
                </td>
                <td className="row" style={{ "--gap": "8px" } as React.CSSProperties}>
                  <button className="link small" onClick={() => open(c)}>
                    Edit
                  </button>
                  <button className="link small" onClick={() => api.patch(`/admin/categories/${c.id}`, { isActive: !c.is_active }).then(reload).catch((e) => toast(errorMessage(e), "error"))}>
                    {c.is_active ? "Hide" : "Show"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <Modal title={editing === "new" ? "New category" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const body = { name: f.name, description: f.description, parentId: f.parentId ? Number(f.parentId) : null, sortOrder: Number(f.sortOrder) };
              try {
                if (editing === "new") await api.post("/admin/categories", body);
                else await api.patch(`/admin/categories/${editing.id}`, body);
                toast("Category saved.", "success");
                setEditing(null);
                reload();
              } catch (err) {
                toast(errorMessage(err), "error");
              }
            }}
          >
            <TextField label="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <TextArea label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} hint="Shown at the top of the category page." />
            <SelectField label="Parent category" value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })}>
              <option value="">None (top level)</option>
              {cats
                .filter((c) => editing === "new" || c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </SelectField>
            <TextField label="Sort order" type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} hint="Lower numbers appear first." />
            <Button type="submit">Save category</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────────────── Gift cards ────────────────────────────────

export function GiftCardsAdmin() {
  const { data, reload } = useApi<{ giftCards: any[] }>("/admin/gift-cards");
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [f, setF] = useState({ amount: "", email: "", expires: "", note: "" });
  return (
    <div className="stack">
      <PageHead title="Gift cards" actions={<button className="btn" onClick={() => (setIssued(null), setOpen(true))}>+ Issue gift card</button>} />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th className="r">Value</th>
              <th className="r">Balance</th>
              <th>Recipient</th>
              <th>Expires</th>
              <th>Issued</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {data?.giftCards.map((g) => (
              <tr key={g.id}>
                <td>
                  <code>{g.code}</code>
                  {g.note && <div className="tiny muted">{g.note}</div>}
                </td>
                <td className="r num">{inr(g.initial_paise)}</td>
                <td className="r num">{inr(g.balance_paise)}</td>
                <td className="small">{g.recipient_email ?? "—"}</td>
                <td className="small">{g.expires_at ? date(g.expires_at) : "Never"}</td>
                <td className="small">
                  {date(g.created_at)} · {g.issued_by_name ?? "—"}
                </td>
                <td>
                  <input type="checkbox" aria-label={`${g.code} active`} checked={Boolean(g.is_active)} onChange={(e) => api.patch(`/admin/gift-cards/${g.id}`, { isActive: e.target.checked }).then(reload).catch((err) => toast(errorMessage(err), "error"))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal title="Issue a gift card" onClose={() => setOpen(false)}>
          {issued ? (
            <div className="stack">
              <div className="alert alert-success">Gift card created{f.email ? " and emailed" : ""}.</div>
              <code className="panel" style={{ fontSize: 20, textAlign: "center" }}>
                {issued}
              </code>
              <button className="btn" onClick={() => (setOpen(false), setF({ amount: "", email: "", expires: "", note: "" }))}>
                Done
              </button>
            </div>
          ) : (
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const r = await api.post<{ code: string }>("/admin/gift-cards", {
                    amountPaise: Math.round(Number(f.amount) * 100),
                    recipientEmail: f.email || null,
                    expiresAt: f.expires ? new Date(`${f.expires}T23:59:59`).toISOString() : null,
                    note: f.note,
                  });
                  setIssued(r.code);
                  reload();
                } catch (err) {
                  toast(errorMessage(err), "error");
                }
              }}
            >
              <TextField label="Value (₹)" required inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
              <TextField label="Recipient email (optional)" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} hint="We'll email them the code." />
              <TextField label="Expires (optional)" type="date" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} />
              <TextField label="Internal note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
              <Button type="submit" disabled={!f.amount}>
                Issue gift card
              </Button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

export function MessagesAdmin() {
  const { data, error } = useApi<{ messages: any[] }>("/admin/messages");
  if (error) return <ErrorState error={error} />;
  return (
    <div className="stack">
      <PageHead title="SMS & WhatsApp outbox" />
      <p className="small muted">Messages to customers who opted in. "Logged" means no provider is configured, so nothing was actually sent.</p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>Channel</th>
              <th>To</th>
              <th>Message</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.messages.map((m) => (
              <tr key={m.id}>
                <td className="small">{date(m.created_at)}</td>
                <td>{m.channel === "whatsapp" ? "WhatsApp" : "SMS"}</td>
                <td className="small">{m.to_phone.replace(/\d(?=\d{4})/g, "•")}</td>
                <td className="small" style={{ maxWidth: 380 }}>
                  {m.body}
                  {m.error && <div className="tiny" style={{ color: "var(--danger)" }}>{m.error}</div>}
                </td>
                <td>
                  <StatusBadge status={m.status === "sent" ? "active" : m.status === "failed" ? "failed" : "pending"} label={m.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
