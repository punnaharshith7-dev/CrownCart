import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { homeFor, useAuth } from "../lib/auth";
import { useTheme, type ThemePref } from "../lib/theme";
import { inr } from "../lib/format";
import { Announcement } from "./Announcement";

interface Suggest {
  products: { slug: string; name: string; brand: string; image: string; pricePaise: number }[];
  brands: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
  popular: string[];
}

export function Highlight({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const terms = q.trim().split(/\s+/).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${terms.join("|")})`, "ig"));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}</>;
}

const RECENT_KEY = "cc-recent-searches";
export const recentSearches = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
};
export const rememberSearch = (q: string) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...recentSearches().filter((s) => s !== q)].slice(0, 6)));
  } catch {
    /* ignore */
  }
};

function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Suggest | null>(null);
  const navigate = useNavigate();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) return setS(null);
    const t = setTimeout(() => api.get<Suggest>(`/catalog/suggest?q=${encodeURIComponent(q)}`).then(setS).catch(() => {}), 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (term: string) => {
    if (!term.trim()) return;
    rememberSearch(term.trim());
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(term.trim())}`);
  };

  const recent = recentSearches();
  return (
    <div className="header-search" ref={box} role="search">
      <form onSubmit={(e) => (e.preventDefault(), go(q))}>
        <label className="sr-only" htmlFor="site-search">
          Search CrownCart
        </label>
        <input
          id="site-search"
          className="input"
          type="search"
          placeholder="Search products, brands, categories"
          value={q}
          autoComplete="off"
          onChange={(e) => (setQ(e.target.value), setOpen(true))}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          aria-expanded={open}
          aria-controls="search-suggest"
        />
      </form>
      {open && (s || (!q && recent.length > 0)) && (
        <div className="suggest" id="search-suggest">
          {!q && (
            <>
              <div className="eyebrow" style={{ padding: "6px 10px" }}>
                Recent searches
              </div>
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => go(r)}>
                  ↺ {r}
                </button>
              ))}
            </>
          )}
          {s && s.products.length + s.brands.length + s.categories.length === 0 && <div className="small muted" style={{ padding: 10 }}>No matches. Press Enter to search everything.</div>}
          {s?.products.map((p) => (
            <Link key={p.slug} to={`/product/${p.slug}`} onClick={() => setOpen(false)}>
              <img src={p.image} alt="" />
              <span style={{ flex: 1 }}>
                <span className="tiny muted">{p.brand}</span>
                <br />
                <Highlight text={p.name} q={q} />
              </span>
              <span className="small">{inr(p.pricePaise)}</span>
            </Link>
          ))}
          {s?.categories.map((c) => (
            <Link key={c.slug} to={`/shop/${c.slug}`} onClick={() => setOpen(false)}>
              In category: <Highlight text={c.name} q={q} />
            </Link>
          ))}
          {s?.brands.map((b) => (
            <Link key={b.slug} to={`/shop?brand=${b.slug}`} onClick={() => setOpen(false)}>
              Brand: <Highlight text={b.name} q={q} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switch" role="group" aria-label="Colour theme">
      {(["light", "dark", "system"] as ThemePref[]).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)} className="btn-ghost" style={{ cursor: "pointer", background: undefined }}>
          {t === "light" ? "☀ Light" : t === "dark" ? "☾ Dark" : "◐ Auto"}
        </button>
      ))}
    </div>
  );
}

export function AccountMenu({ dark }: { dark?: boolean }) {
  const { user, signOut, unread } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => (document.removeEventListener("mousedown", close), document.removeEventListener("keydown", esc));
  }, []);
  return (
    <div className="menu" ref={ref}>
      <button type="button" className="icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((o) => !o)} style={dark ? { color: "#111", borderColor: "#111" } : undefined}>
        ◉{unread > 0 && <span className="count-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="menu-list" role="menu" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {user ? (
            <>
              <div className="menu-head">
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div className="tiny muted">{user.email}</div>
              </div>
              <Link to="/account" role="menuitem">My account</Link>
              <Link to="/account/orders" role="menuitem">Orders</Link>
              <Link to="/account/wishlist" role="menuitem">Wishlist</Link>
              <Link to="/account/notifications" role="menuitem">Notifications{unread ? ` (${unread})` : ""}</Link>
              {user.stores.length > 0 && <Link to="/owner" role="menuitem">Store portal</Link>}
              {user.roles.includes("platform_admin") && <Link to="/admin" role="menuitem">Admin portal</Link>}
              {user.roles.includes("delivery_partner") && <Link to="/delivery" role="menuitem">Delivery portal</Link>}
            </>
          ) : (
            <>
              <Link to="/signin" role="menuitem">Sign in</Link>
              <Link to="/register" role="menuitem">Create account</Link>
            </>
          )}
          <hr className="divider" />
          <ThemeSwitch />
          {user && (
            <button type="button" role="menuitem" onClick={signOut}>
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { cartCount } = useAuth();
  return (
    <header className="site-header">
      <div className="container bar">
        <Link to="/" className="wordmark" aria-label="CrownCart home">
          CrownCart
        </Link>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/collections">Collections</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <SearchBox />
        <div className="header-actions">
          <Link to="/cart" className="icon-btn" aria-label={`Bag, ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
            ⊞{cartCount > 0 && <span className="count-dot">{cartCount}</span>}
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container spread">
        <span>© {new Date().getFullYear()} CrownCart · Beyond Ordinary.</span>
        <nav aria-label="Footer">
          <Link to="/policies/shipping">Shipping</Link>
          <Link to="/policies/returns">Returns & refunds</Link>
          <Link to="/policies/privacy">Privacy</Link>
          <Link to="/policies/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Announcement />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}

export { homeFor };
