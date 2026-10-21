import { useState, type ReactNode } from "react";

/* Single-series charts for the portals. Text uses text tokens; only marks use the series colour.
   Every chart has a hover tooltip and a table view so values never depend on colour or hover alone. */

export function ChartCard({ title, subtitle, table, children, actions }: { title: string; subtitle?: ReactNode; table: { head: string[]; rows: ReactNode[][] }; children: ReactNode; actions?: ReactNode }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="card stack viz" style={{ "--gap": "12px" } as React.CSSProperties}>
      <div className="spread">
        <div>
          <h2 className="h3">{title}</h2>
          {subtitle && <div className="tiny muted">{subtitle}</div>}
        </div>
        <div className="row" style={{ "--gap": "6px" } as React.CSSProperties}>
          {actions}
          <button type="button" className="btn btn-ghost btn-sm" aria-pressed={asTable} onClick={() => setAsTable((t) => !t)}>
            {asTable ? "Chart" : "Table"}
          </button>
        </div>
      </div>
      {asTable ? (
        <div className="table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
          <table className="data">
            <thead>
              <tr>
                {table.head.map((h, i) => (
                  <th key={h} className={i > 0 ? "r" : undefined}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={j > 0 ? "r num" : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v)!;
}

/** Vertical bars over time with a y-axis, recessive gridlines and a hover tooltip. */
export function TimeBars({ data, format, label }: { data: { label: string; value: number }[]; format: (n: number) => string; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [max, max / 2, 0];
  const shortDate = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const h = hover != null ? data[hover] : null;
  return (
    <div className="tb" role="img" aria-label={`${label}: ${data.length} days. Use the Table view for exact values.`}>
      <div className="tb-y" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t}>{format(t)}</span>
        ))}
      </div>
      <div className="tb-plot" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <div key={t} className="tb-grid" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden="true" />
        ))}
        <div className="tb-bars">
          {data.map((d, i) => (
            <div key={d.label} className="tb-hit" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1}>
              <div className={`tb-bar${hover === i ? " on" : ""}`} style={{ height: d.value > 0 ? `max(2px, ${(d.value / max) * 100}%)` : 0 }} />
            </div>
          ))}
        </div>
        {h && (
          <div className="tb-tip" style={{ left: `${((hover! + 0.5) / data.length) * 100}%` }} role="status">
            <div className="tiny muted">{shortDate(h.label)}</div>
            <strong className="num">{format(h.value)}</strong>
          </div>
        )}
      </div>
      <div className="tb-x tiny muted" aria-hidden="true">
        <span>{data[0] && shortDate(data[0].label)}</span>
        {data.length > 2 && <span>{shortDate(data[Math.floor(data.length / 2)].label)}</span>}
        <span>{data.length > 1 && shortDate(data[data.length - 1].label)}</span>
      </div>
    </div>
  );
}

/** Horizontal bars for ranked categories. Values are always printed, so colour carries no meaning. */
export function HBars({ data, format, empty = "No data in this period." }: { data: { label: string; value: number; sub?: string }[]; format: (n: number) => string; empty?: string }) {
  if (!data.length) return <p className="small muted">{empty}</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="hb">
      {data.map((d) => (
        <div key={d.label} className="hb-row" title={`${d.label}: ${format(d.value)}${total ? ` (${Math.round((d.value / total) * 100)}%)` : ""}`}>
          <span className="hb-label small">{d.label}</span>
          <span className="hb-track" aria-hidden="true">
            <span className="hb-bar" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="hb-value small num">
            {format(d.value)}
            {d.sub && <span className="tiny muted"> {d.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A single proportion, e.g. delivery success rate. */
export function Meter({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total ? Math.round((value / total) * 100) : null;
  return (
    <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
      <div className="spread">
        <span className="small">{label}</span>
        <strong className="num">{pct == null ? "—" : `${pct}%`}</strong>
      </div>
      <div className="hb-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? 0} aria-label={label}>
        <span className="hb-bar" style={{ width: `${pct ?? 0}%` }} />
      </div>
      <span className="tiny muted">
        {value} of {total}
      </span>
    </div>
  );
}
