import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { StoreLayout } from "../components/SiteHeader";
import { inr } from "../lib/format";
import { useTheme } from "../lib/theme";
import { useApi, useTitle } from "../lib/useApi";
import "../styles/explore.css";

/*
 * Explore — the brand directory, printed like a risograph zine: warm paper, fluorescent pink /
 * blue / yellow inks, halftone dots and slightly mis-registered headlines. Its own look; it
 * deliberately shares nothing with the rest of the site. Night mode prints the same inks on black.
 */

interface BrandProduct {
  slug: string;
  name: string;
  image: string | null;
}

interface Brand {
  name: string;
  slug: string;
  count: number;
  fromPaise: number | null;
  categories: string[];
  products: BrandProduct[];
}

type View = "index" | "gallery";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
/** Each house gets one of the three inks, in alphabetical rotation. */
const INKS = ["pink", "blue", "yellow"] as const;

const letterOf = (name: string) => {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
};

const monogram = (name: string) =>
  name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const shopUrl = (b: Brand) => `/shop?brand=${encodeURIComponent(b.slug)}`;
const imagesOf = (b: Brand) => b.products.map((p) => p.image).filter((src): src is string => Boolean(src));
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/** A headline printed twice: ink on top, a pink plate slightly off-register underneath. */
function Riso({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`rx-riso ${className}`} data-text={text}>
      {text}
    </span>
  );
}

export default function Explore() {
  useTitle("Explore the houses", { description: "Every brand at CrownCart, from heritage watchmakers to modern streetwear, in one directory." });
  const { data, error, loading } = useApi<{ brands: Brand[] }>("/catalog/brands");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("index");
  const { resolved, setTheme } = useTheme();
  const dark = resolved === "dark";

  // Flip the site theme; the shared venom transition plays from the theme provider.
  const toggleTheme = () => setTheme(dark ? "light" : "dark");

  const brands = data?.brands ?? [];
  const categories = useMemo(() => [...new Set(brands.flatMap((b) => b.categories))].sort(), [brands]);
  const totalPieces = brands.reduce((sum, b) => sum + b.count, 0);
  const ink = useMemo(() => new Map(brands.map((b, i) => [b.slug, INKS[i % INKS.length]])), [brands]);

  // A different house is in the spotlight each day.
  const spotlight = useMemo(() => {
    const withImages = brands.filter((b) => imagesOf(b).length > 0);
    if (!withImages.length) return null;
    const day = Math.floor(Date.now() / 86_400_000);
    return withImages[day % withImages.length];
  }, [brands]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = brands.filter((b) => (category === "all" || b.categories.includes(category)) && (!q || b.name.toLowerCase().includes(q)));
    const map = new Map<string, Brand[]>();
    for (const b of shown) map.set(letterOf(b.name), [...(map.get(letterOf(b.name)) ?? []), b]);
    return [...map.entries()].sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));
  }, [brands, category, query]);

  const present = new Set(groups.map(([letter]) => letter));
  const shownCount = groups.reduce((sum, [, list]) => sum + list.length, 0);
  const issue = new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }).toUpperCase();

  return (
    <StoreLayout>
      <div className={`rx${dark ? " rx--night" : ""}`}>
        <div className="rx-grain" aria-hidden="true" />

        {/* ── Masthead ── */}
        <header className="rx-mast">
          <div className="rx-mast__strip">
            <span>CrownCart Directory</span>
            <span className="rx-mast__dot" aria-hidden="true" />
            <span>Issue {issue}</span>
            <span className="rx-mast__dot" aria-hidden="true" />
            <span>Printed in 3 inks</span>
            <button type="button" className="rx-ink-switch" onClick={toggleTheme} aria-pressed={dark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
              <span className={`rx-ink-switch__opt${!dark ? " is-on" : ""}`}>Day print</span>
              <span className={`rx-ink-switch__opt${dark ? " is-on" : ""}`}>Night print</span>
            </button>
          </div>

          <div className="rx-mast__body">
            <div className="rx-halftone" aria-hidden="true" />
            <p className="rx-kicker">Every brand we carry · A to Z</p>
            <h1 className="rx-title">
              <Riso text="The" className="rx-title__small" />
              <Riso text="Houses" />
            </h1>
            <p className="rx-lede">
              Heritage watchmakers, Parisian ateliers, Milanese tailors and the makers of tomorrow's tech — gathered in one directory, each one click from its pieces.
            </p>

            {brands.length > 0 && (
              <dl className="rx-stamps">
                <div className="rx-stamp rx-stamp--pink">
                  <dd>{brands.length}</dd>
                  <dt>Houses</dt>
                </div>
                <div className="rx-stamp rx-stamp--blue">
                  <dd>{totalPieces}</dd>
                  <dt>Pieces</dt>
                </div>
                <div className="rx-stamp rx-stamp--yellow">
                  <dd>{categories.length}</dd>
                  <dt>Worlds</dt>
                </div>
              </dl>
            )}
          </div>
        </header>

        {brands.length > 0 && (
          <div className="rx-tape" aria-hidden="true">
            <div className="rx-tape__track">
              {[0, 1].map((r) => (
                <span key={r} className="rx-tape__set">
                  {brands.map((b) => (
                    <span key={b.slug}>
                      {b.name} <i>✺</i>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        )}

        {spotlight && <Spotlight brand={spotlight} />}

        {/* ── Toolbar ── */}
        <div className="rx-bar">
          <div className="rx-bar__row">
            <label className="rx-search">
              <span className="sr-only">Find a house</span>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input type="search" placeholder="Find a house…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="rx-tags" role="group" aria-label="Filter by category">
              {["all", ...categories].map((c) => (
                <button key={c} type="button" className="rx-tag" aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {c === "all" ? "All worlds" : c}
                </button>
              ))}
            </div>
            <div className="rx-view" role="group" aria-label="Layout">
              <button type="button" aria-pressed={view === "index"} onClick={() => setView("index")}>
                List
              </button>
              <button type="button" aria-pressed={view === "gallery"} onClick={() => setView("gallery")}>
                Prints
              </button>
            </div>
          </div>
          <nav className="rx-letters" aria-label="Jump to letter">
            {LETTERS.map((l) =>
              present.has(l) ? (
                <a key={l} href={`#rx-${l}`} onClick={(e) => (e.preventDefault(), document.getElementById(`rx-${l}`)?.scrollIntoView({ behavior: "smooth", block: "start" }))}>
                  {l}
                </a>
              ) : (
                <span key={l} aria-hidden="true">
                  {l}
                </span>
              ),
            )}
          </nav>
        </div>

        {/* ── Directory ── */}
        <div className="rx-wrap">
          {loading && !data ? (
            <div className="rx-loading" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="rx-skeleton" style={{ "--i": i } as CSSProperties} />
              ))}
            </div>
          ) : error ? (
            <p className="rx-empty">We couldn't load the houses right now. Please refresh to try again.</p>
          ) : shownCount === 0 ? (
            <p className="rx-empty">
              Nothing printed under that search.{" "}
              <button type="button" className="rx-textlink" onClick={() => (setQuery(""), setCategory("all"))}>
                Show every house
              </button>
            </p>
          ) : view === "index" ? (
            <IndexView groups={groups} ink={ink} />
          ) : (
            <GalleryView groups={groups} ink={ink} />
          )}
        </div>

        {/* ── Back cover ── */}
        <section className="rx-outro">
          <div className="rx-halftone rx-halftone--outro" aria-hidden="true" />
          <p className="rx-kicker">Can't decide?</p>
          <h2 className="rx-outro__title">
            <Riso text="Wander the" />
            <Riso text="whole store." className="rx-outro__accent" />
          </h2>
          <Link to="/shop" className="rx-btn rx-btn--big">
            Shop everything <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </StoreLayout>
  );
}

function Spotlight({ brand: b }: { brand: Brand }) {
  const [main, ...rest] = imagesOf(b);
  return (
    <section className="rx-spot" aria-labelledby="rx-spot-title">
      <Link to={shopUrl(b)} className="rx-spot__print" tabIndex={-1} aria-hidden="true">
        <img src={main} alt="" decoding="async" />
        <span className="rx-spot__mono">{monogram(b.name)}</span>
        <span className="rx-spot__sticker">House of the day</span>
      </Link>
      <div className="rx-spot__copy">
        <p className="rx-kicker">Today's pick · no. {new Date().getDate()}</p>
        <h2 id="rx-spot-title" className="rx-spot__name">
          <Riso text={b.name} />
        </h2>
        <p className="rx-spot__cats">{b.categories.join(" / ")}</p>
        <dl className="rx-spot__facts">
          <div>
            <dt>Pieces</dt>
            <dd>{b.count}</dd>
          </div>
          {b.fromPaise != null && (
            <div>
              <dt>From</dt>
              <dd>{inr(b.fromPaise)}</dd>
            </div>
          )}
        </dl>
        {rest.length > 0 && (
          <div className="rx-spot__thumbs" aria-hidden="true">
            {rest.slice(0, 3).map((src) => (
              <img key={src} src={src} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        )}
        <Link to={shopUrl(b)} className="rx-btn">
          Enter the house <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

/** The list. On a mouse, prints of the hovered house's pieces trail the cursor. */
function IndexView({ groups, ink }: { groups: [string, Brand[]][]; ink: Map<string, string> }) {
  const [hovered, setHovered] = useState<Brand | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const [canPreview] = useState(() => matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const animate = () => {
    pos.current.x += (target.current.x - pos.current.x) * 0.18;
    pos.current.y += (target.current.y - pos.current.y) * 0.18;
    if (previewRef.current) previewRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    const settled = Math.abs(target.current.x - pos.current.x) < 0.3 && Math.abs(target.current.y - pos.current.y) < 0.3;
    frame.current = settled ? 0 : requestAnimationFrame(animate);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!canPreview) return;
    // Keep the prints on screen: flip to the left of the cursor near the right edge.
    const flip = e.clientX > window.innerWidth - 360;
    target.current = { x: flip ? e.clientX - 300 : e.clientX + 36, y: Math.min(e.clientY - 130, window.innerHeight - 340) };
    if (!frame.current) frame.current = requestAnimationFrame(animate);
  };

  const enter = (b: Brand, e: React.PointerEvent) => {
    if (!canPreview) return;
    if (!hovered) pos.current = { x: e.clientX + 36, y: e.clientY - 130 };
    setHovered(b);
  };

  const hoveredImages = hovered ? imagesOf(hovered).slice(0, 3) : [];

  return (
    <div className="rx-list" onPointerMove={onMove} onPointerLeave={() => setHovered(null)}>
      {groups.map(([letter, list]) => (
        <section key={letter} id={`rx-${letter}`} className="rx-group" aria-labelledby={`rx-h-${letter}`}>
          <h2 id={`rx-h-${letter}`} className="rx-group__head">
            <Riso text={letter} className="rx-group__letter" />
            <span className="rx-group__count">{plural(list.length, "house")}</span>
          </h2>
          <ul className="rx-rows">
            {list.map((b, i) => {
              const thumb = imagesOf(b)[0];
              return (
                <li key={b.slug} style={{ "--i": i } as CSSProperties}>
                  <Link to={shopUrl(b)} className={`rx-row rx-ink--${ink.get(b.slug)}`} onPointerEnter={(e) => enter(b, e)} aria-label={`Shop ${b.name}, ${b.count} pieces`}>
                    <span className="rx-row__no" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {thumb ? <img className="rx-row__thumb" src={thumb} alt="" loading="lazy" decoding="async" /> : <span className="rx-row__thumb rx-row__thumb--mono">{monogram(b.name)}</span>}
                    <span className="rx-row__name">{b.name}</span>
                    <span className="rx-row__cats">{b.categories.join(" / ")}</span>
                    <span className="rx-row__count">{plural(b.count, "piece")}</span>
                    <span className="rx-row__price">{b.fromPaise != null ? `from ${inr(b.fromPaise)}` : ""}</span>
                    <span className="rx-row__go" aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {canPreview && (
        <div ref={previewRef} className={`rx-preview${hovered && hoveredImages.length ? " is-on" : ""}`} aria-hidden="true">
          {hovered && (
            <>
              {hoveredImages.map((src, i) => (
                <span key={hovered.slug + src} className={`rx-preview__card rx-preview__card--${i} rx-ink--${ink.get(hovered.slug)}`}>
                  <img src={src} alt="" decoding="async" />
                </span>
              ))}
              <span className="rx-preview__label">
                {hovered.name} · {plural(hovered.count, "piece")}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function GalleryView({ groups, ink }: { groups: [string, Brand[]][]; ink: Map<string, string> }) {
  return (
    <div className="rx-gallery">
      {groups.map(([letter, list]) => (
        <section key={letter} id={`rx-${letter}`} className="rx-group" aria-labelledby={`rx-g-${letter}`}>
          <h2 id={`rx-g-${letter}`} className="rx-group__head">
            <Riso text={letter} className="rx-group__letter" />
            <span className="rx-group__count">{plural(list.length, "house")}</span>
          </h2>
          <div className="rx-cards">
            {list.map((b, i) => {
              const images = imagesOf(b).slice(0, 3);
              return (
                <article key={b.slug} className={`rx-card rx-ink--${ink.get(b.slug)}`} style={{ "--i": i } as CSSProperties}>
                  <Link to={shopUrl(b)} className={`rx-card__print rx-card__print--${images.length}`} tabIndex={-1} aria-hidden="true">
                    {images.map((src) => (
                      <img key={src} src={src} alt="" loading="lazy" decoding="async" />
                    ))}
                    <span className="rx-card__mono">{monogram(b.name)}</span>
                  </Link>
                  <div className="rx-card__body">
                    <h3 className="rx-card__name">{b.name}</h3>
                    <p className="rx-card__cats">{b.categories.join(" / ")}</p>
                    <div className="rx-card__meta">
                      <span>{plural(b.count, "piece")}</span>
                      {b.fromPaise != null && <span>from {inr(b.fromPaise)}</span>}
                    </div>
                    <Link to={shopUrl(b)} className="rx-btn rx-btn--small">
                      Shop {b.name} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
