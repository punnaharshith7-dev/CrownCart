import { useState } from "react";
import { DateRange, PageHead, defaultRange } from "../../components/Portal";
import { ReportsView, type Metrics, type Report } from "../../components/ReportsView";
import { Button, Empty, ErrorState, Loading, Modal, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { dateTime, inr, titleCase } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi } from "../../lib/useApi";

export function OwnerReports({ storeId }: { storeId: number }) {
  const [range, setRange] = useState(defaultRange());
  const q = `from=${range.from}&to=${range.to}`;
  const { data, error, loading, reload } = useApi<{ metrics: Metrics; report: Report }>(`/owner/stores/${storeId}/reports?${q}`);
  return (
    <div className="stack" style={{ "--gap": "20px" } as React.CSSProperties}>
      <PageHead title="Reports" eyebrow="Sales, products, fulfilment and returns" actions={<DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />} />
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
              <a className="btn btn-outline btn-sm" href={`/api/owner/stores/${storeId}/reports/orders.csv?${q}`}>
                Orders CSV
              </a>
              <a className="btn btn-outline btn-sm" href={`/api/owner/stores/${storeId}/reports/products.csv?${q}`}>
                Product performance CSV
              </a>
              <a className="btn btn-outline btn-sm" href={`/api/owner/stores/${storeId}/inventory.csv`}>
                Inventory CSV
              </a>
            </>
          }
        />
      )}
    </div>
  );
}

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"', i++);
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") (row.push(cell), (cell = ""));
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

interface BulkResult {
  ok: boolean;
  applied: boolean;
  errors: { row: number; sku: string; error: string }[];
  changes: { sku: string; changes: string[] }[];
}

export function BulkUpdate({ storeId }: { storeId: number }) {
  const toast = useToast();
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    setResult(null);
    setParseError(null);
    const grid = parseCsv(await file.text());
    if (grid.length < 2) return setParseError("The file has no data rows.");
    const head = grid[0].map((h) => h.trim().toLowerCase().replace(/^'/, ""));
    if (!head.includes("sku")) return setParseError("The first row must be a header that includes a 'sku' column.");
    const col = (r: string[], name: string) => {
      const i = head.indexOf(name);
      const v = i < 0 ? undefined : r[i]?.trim().replace(/^'/, "");
      return v === "" ? undefined : v;
    };
    const money = (v?: string) => (v == null ? undefined : Math.round(Number(v.replace(/[₹,]/g, "")) * 100));
    const parsed = grid.slice(1).map((r) => {
      const out: Record<string, unknown> = { sku: col(r, "sku") };
      const price = money(col(r, "price"));
      if (price != null) out.pricePaise = price;
      if (head.includes("compare_at_price")) out.compareAtPaise = money(col(r, "compare_at_price")) ?? null;
      const onHand = col(r, "on_hand");
      if (onHand != null) out.onHand = Number(onHand);
      const low = col(r, "low_stock_threshold");
      if (low != null) out.lowStockThreshold = Number(low);
      const active = col(r, "active");
      if (active != null) out.isActive = ["1", "true", "yes"].includes(active.toLowerCase());
      return out;
    });
    const bad = parsed.findIndex((p) => Object.values(p).some((v) => typeof v === "number" && !Number.isFinite(v)));
    if (bad >= 0) return setParseError(`Row ${bad + 2} has a value that isn't a number.`);
    setRows(parsed);
    await send(parsed, true);
  };

  const send = async (data: Record<string, unknown>[], dryRun: boolean) => {
    setBusy(true);
    try {
      const r = await api.post<BulkResult>(`/owner/stores/${storeId}/bulk-update`, { rows: data, dryRun });
      setResult(r);
      if (r.applied) {
        toast(`${r.changes.length} SKU${r.changes.length === 1 ? "" : "s"} updated.`, "success");
        setRows(null);
      }
    } catch (e) {
      setParseError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ "--gap": "20px", maxWidth: 900 } as React.CSSProperties}>
      <PageHead title="Bulk price & stock update" actions={<a className="btn btn-outline btn-sm" href={`/api/owner/stores/${storeId}/catalog.csv`}>Download current catalog</a>} />
      <ol className="small muted" style={{ paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Download the current catalog as CSV and edit it in a spreadsheet.</li>
        <li>Keep the <code>sku</code> column. Change <code>price</code>, <code>compare_at_price</code>, <code>on_hand</code>, <code>low_stock_threshold</code> or <code>active</code> (1 or 0). Other columns are ignored.</li>
        <li>Upload it here. You'll see every change before anything is saved; if any row has a problem, nothing is saved.</li>
      </ol>
      <label className="card stack" style={{ cursor: "pointer" }}>
        <span className="label">CSV file</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>
      {parseError && <div className="alert alert-danger">{parseError}</div>}
      {busy && <Loading />}
      {result && !result.applied && (
        <section className="card stack">
          {result.errors.length > 0 ? (
            <>
              <div className="alert alert-danger">Fix these rows and upload again. Nothing was saved.</div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>SKU</th>
                      <th>Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td>{e.row}</td>
                        <td>{e.sku}</td>
                        <td>{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : result.changes.length === 0 ? (
            <Empty title="No changes">Every row matches what's already saved.</Empty>
          ) : (
            <>
              <h2 className="h3">
                {result.changes.length} SKU{result.changes.length === 1 ? "" : "s"} will change
              </h2>
              <div className="table-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.changes.map((c) => (
                      <tr key={c.sku}>
                        <td>{c.sku}</td>
                        <td className="small">{c.changes.join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button loading={busy} onClick={() => rows && send(rows, false)}>
                Apply {result.changes.length} change{result.changes.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export interface AdminVariant {
  id: number;
  sku: string;
  name: string;
  color: string | null;
  size: string | null;
  pricePaise: number;
  compareAtPaise: number | null;
  maxPerOrder: number;
  isActive: boolean;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
}

function VariantModal({ storeId, productId, v, onClose, onSaved }: { storeId: number; productId: number; v: AdminVariant | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    sku: v?.sku ?? "",
    name: v?.name ?? "",
    color: v?.color ?? "",
    size: v?.size ?? "",
    price: v ? String(v.pricePaise / 100) : "",
    compareAt: v?.compareAtPaise ? String(v.compareAtPaise / 100) : "",
    maxPerOrder: String(v?.maxPerOrder ?? 5),
    lowStockThreshold: String(v?.lowStockThreshold ?? 3),
    isActive: v?.isActive ?? true,
    stock: "0",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const payload = {
      sku: f.sku,
      name: f.name || f.size || f.color || "Standard",
      color: f.color || null,
      size: f.size || null,
      pricePaise: Math.round(Number(f.price) * 100),
      compareAtPaise: f.compareAt ? Math.round(Number(f.compareAt) * 100) : null,
      maxPerOrder: Number(f.maxPerOrder),
      lowStockThreshold: Number(f.lowStockThreshold),
      isActive: f.isActive,
    };
    try {
      if (v) await api.put(`/owner/stores/${storeId}/variants/${v.id}`, payload);
      else await api.post(`/owner/stores/${storeId}/products/${productId}/variants`, { ...payload, stock: Number(f.stock) });
      onSaved();
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={v ? `Edit ${v.sku}` : "New variant"} onClose={onClose} wide>
      <form className="stack" onSubmit={save}>
        <div className="grid" style={{ "--min": "180px" } as React.CSSProperties}>
          <TextField label="SKU" required value={f.sku} onChange={set("sku")} />
          <TextField label="Display name" value={f.name} onChange={set("name")} hint="Defaults to size or colour" />
          <TextField label="Size" value={f.size} onChange={set("size")} />
          <TextField label="Colour" value={f.color} onChange={set("color")} />
          <TextField label="Price (₹)" required inputMode="decimal" value={f.price} onChange={set("price")} />
          <TextField label="Original price (₹)" inputMode="decimal" value={f.compareAt} onChange={set("compareAt")} hint="Optional. Customers see it crossed out with the % off. Must be higher than the price." />
          <TextField label="Max per order" type="number" min={1} max={50} value={f.maxPerOrder} onChange={set("maxPerOrder")} />
          <TextField label="Low-stock alert at" type="number" min={0} value={f.lowStockThreshold} onChange={set("lowStockThreshold")} />
          {!v && <TextField label="Opening stock" type="number" min={0} value={f.stock} onChange={set("stock")} />}
        </div>
        <label className="check">
          <input type="checkbox" checked={f.isActive} onChange={set("isActive")} />
          <span>Available for sale</span>
        </label>
        {v && <p className="tiny muted">Stock ({v.onHand} on hand, {v.reserved} reserved) is changed from Inventory so every movement is recorded.</p>}
        {err && <div className="alert alert-danger">{err}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <Button type="submit" loading={busy}>
            Save variant
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function VariantsEditor({ storeId, product, onChange }: { storeId: number; product: { id: number; variants: AdminVariant[] }; onChange: () => void }) {
  const [editing, setEditing] = useState<AdminVariant | "new" | null>(null);
  return (
    <section className="card stack">
      <div className="spread">
        <h2 className="h3">Variants & pricing</h2>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing("new")}>
          + Variant
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Variant</th>
              <th className="r">Price</th>
              <th className="r">Available</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {product.variants.map((x) => (
              <tr key={x.id}>
                <td>{x.sku}</td>
                <td>
                  {x.name}
                  <div className="tiny muted">{[x.size && `Size ${x.size}`, x.color, `max ${x.maxPerOrder}/order`].filter(Boolean).join(" · ")}</div>
                </td>
                <td className="r num">
                  {inr(x.pricePaise)}
                  {x.compareAtPaise && <div className="tiny muted" style={{ textDecoration: "line-through" }}>{inr(x.compareAtPaise)}</div>}
                </td>
                <td className="r num">
                  {x.onHand - x.reserved}
                  {x.onHand - x.reserved <= x.lowStockThreshold && <div className="tiny" style={{ color: "var(--warning)" }}>low</div>}
                </td>
                <td>{x.isActive ? <span className="badge badge-success">On sale</span> : <span className="badge">Hidden</span>}</td>
                <td>
                  <button type="button" className="link small" onClick={() => setEditing(x)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <VariantModal storeId={storeId} productId={product.id} v={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), onChange())} />}
    </section>
  );
}

interface Media {
  id: number;
  variantId: number | null;
  kind: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export function MediaEditor({ storeId, product, onChange }: { storeId: number; product: { id: number; media: Media[]; variants: AdminVariant[] }; onChange: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const patch = (m: Media, body: Record<string, unknown>) =>
    api
      .patch(`/owner/stores/${storeId}/media/${m.id}`, body)
      .then(onChange)
      .catch((e) => toast(errorMessage(e), "error"));
  const sorted = [...product.media].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const move = (i: number, dir: -1 | 1) => {
    if (!sorted[i + dir]) return;
    // Give every item a distinct position, then swap the two being moved.
    Promise.all(sorted.map((m, j) => api.patch(`/owner/stores/${storeId}/media/${m.id}`, { sortOrder: j === i ? i + dir : j === i + dir ? i : j })))
      .then(onChange)
      .catch((e) => toast(errorMessage(e), "error"));
  };
  return (
    <section className="card stack">
      <h2 className="h3">Images & media</h2>
      <p className="tiny muted">The first product image is used on cards and in search. The editorial (hero) image is the full-bleed photo used in the homepage showcase.</p>
      {sorted.length === 0 && <p className="small muted">No media yet.</p>}
      {sorted.map((m, i) => (
        <div key={m.id} className="row panel" style={{ "--gap": "12px", alignItems: "flex-start" } as React.CSSProperties}>
          {m.kind === "video" ? (
            <video src={m.url} muted style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
          ) : m.kind === "model" ? (
            <div className="badge" style={{ width: 96, justifyContent: "center" }}>
              3D model
            </div>
          ) : (
            <img src={m.url} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
          )}
          <div className="stack" style={{ flex: 1, minWidth: 220, "--gap": "8px" } as React.CSSProperties}>
            <input className="input" aria-label="Alt text" placeholder="Describe the image for screen readers" defaultValue={m.alt} onBlur={(e) => e.target.value !== m.alt && patch(m, { alt: e.target.value })} />
            <div className="row" style={{ "--gap": "8px" } as React.CSSProperties}>
              {["image", "hero", "poster"].includes(m.kind) && (
                <select className="select" style={{ width: "auto", minHeight: 34 }} aria-label="Media type" value={m.kind} onChange={(e) => patch(m, { kind: e.target.value })}>
                  <option value="image">Product image</option>
                  <option value="hero">Editorial (hero)</option>
                  <option value="poster">Video poster</option>
                </select>
              )}
              {product.variants.length > 1 && (
                <select className="select" style={{ width: "auto", minHeight: 34 }} aria-label="Show for variant" value={m.variantId ?? ""} onChange={(e) => patch(m, { variantId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">All variants</option>
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="row" style={{ "--gap": "4px" } as React.CSSProperties}>
            <button type="button" className="icon-btn" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" className="icon-btn" aria-label="Move later" disabled={i === sorted.length - 1} onClick={() => move(i, 1)}>
              ↓
            </button>
            <button type="button" className="icon-btn" aria-label="Remove" onClick={() => confirm("Remove this media?") && api.del(`/owner/stores/${storeId}/media/${m.id}`).then(onChange)}>
              ✕
            </button>
          </div>
        </div>
      ))}
      <form
        className="row"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          try {
            await api.upload(`/owner/stores/${storeId}/products/${product.id}/media`, new FormData(form));
            form.reset();
            onChange();
          } catch (err) {
            toast(errorMessage(err), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input type="file" name="file" accept="image/png,image/jpeg,image/webp,video/mp4,.glb" required aria-label="Media file" />
        <select name="kind" className="select" style={{ width: "auto" }} aria-label="Media type">
          <option value="image">Product image</option>
          <option value="hero">Editorial (hero) image</option>
          <option value="poster">Video poster</option>
        </select>
        <input name="alt" className="input" style={{ maxWidth: 220 }} placeholder="Alt text" aria-label="Alt text" />
        <Button type="submit" loading={busy} className="btn-outline btn-sm">
          Upload
        </Button>
      </form>
      <p className="tiny muted">JPG, PNG or WebP up to 8 MB · MP4 up to 60 MB · GLB 3D models up to 40 MB. Files are checked by content, not by name.</p>
    </section>
  );
}

export function ProductHistory({ storeId, productId }: { storeId: number; productId: number }) {
  const { data, error } = useApi<{ events: { action: string; details: Record<string, unknown>; created_at: string; actor: string | null }[] }>(`/owner/stores/${storeId}/products/${productId}/history`);
  if (error) return <ErrorState error={error} />;
  if (!data) return <Loading />;
  const describe = (d: Record<string, unknown>) =>
    Object.entries(d)
      .filter(([k]) => k !== "productId")
      .map(([k, v]) => (Array.isArray(v) && v.length === 2 ? `${titleCase(k)}: ${String(v[0] ?? "—")} → ${String(v[1] ?? "—")}` : k === "from" || k === "to" ? `${k} ${typeof v === "number" ? inr(v) : String(v)}` : `${titleCase(k)}: ${String(v)}`))
      .join(" · ");
  return (
    <section className="card stack">
      <h2 className="h3">Change history</h2>
      {data.events.length === 0 && <p className="small muted">No changes recorded yet.</p>}
      <ol className="timeline">
        {data.events.map((e, i) => (
          <li key={i} className="done">
            <strong className="small">{titleCase(e.action.replace(".", " "))}</strong>
            <div className="tiny muted">
              {dateTime(e.created_at)} · {e.actor ?? "System"}
            </div>
            {Object.keys(e.details).length > 0 && <div className="small">{describe(e.details)}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
}

