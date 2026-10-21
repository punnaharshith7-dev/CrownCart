import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ThemeSwitch } from "./SiteHeader";
import { useTitle } from "../lib/useApi";

export interface PortalNavItem {
  to: string;
  label: string;
  end?: boolean;
  count?: number;
}

/** Shared shell for the Store Owner and Admin portals. Each portal supplies its own navigation. */
export function PortalLayout({ name, nav, header, children }: { name: string; nav: PortalNavItem[]; header?: ReactNode; children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useTitle(name, { noindex: true });
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="portal-top">
        <button className="icon-btn" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
          ☰
        </button>
        <span className="wordmark" style={{ fontSize: 22 }}>
          CrownCart
        </span>
        <span className="badge badge-gold badge-plain">{name}</span>
      </div>
      <div className="portal">
        <aside className={`portal-side${open ? " open" : ""}`} aria-label={`${name} navigation`}>
          <Link to="/" className="wordmark">
            CrownCart
          </Link>
          <span className="badge badge-gold badge-plain portal-tag">{name}</span>
          {header}
          <nav>
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
                {n.count ? <span className="badge badge-warning badge-plain">{n.count}</span> : null}
              </NavLink>
            ))}
          </nav>
          <div className="side-foot">
            <ThemeSwitch />
            <div className="tiny muted" style={{ padding: "0 10px" }}>
              {user?.name} · {user?.email}
            </div>
            <Link to="/account" className="btn btn-ghost btn-sm">
              My account
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
        {open && <div className="modal-backdrop" style={{ zIndex: 350 }} onClick={() => setOpen(false)} aria-hidden="true" />}
        <main id="main" className="portal-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHead({ title, eyebrow, actions }: { title: string; eyebrow?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="h2" style={{ fontSize: 32 }}>
          {title}
        </h1>
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="stat">
      <div className="eyebrow">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const preset = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    onChange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  };
  return (
    <div className="row" style={{ "--gap": "6px" } as React.CSSProperties}>
      {[
        [1, "Today"],
        [7, "7 days"],
        [30, "30 days"],
        [90, "90 days"],
      ].map(([d, l]) => (
        <button key={d} className="chip" onClick={() => preset(d as number)}>
          {l}
        </button>
      ))}
      <label className="sr-only" htmlFor="from">
        From
      </label>
      <input id="from" type="date" className="input" style={{ width: "auto", minHeight: 34 }} value={from} onChange={(e) => onChange(e.target.value, to)} />
      <label className="sr-only" htmlFor="to">
        To
      </label>
      <input id="to" type="date" className="input" style={{ width: "auto", minHeight: 34 }} value={to} onChange={(e) => onChange(from, e.target.value)} />
    </div>
  );
}

export const defaultRange = () => {
  const end = new Date();
  return { from: new Date(end.getTime() - 29 * 86_400_000).toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
};
