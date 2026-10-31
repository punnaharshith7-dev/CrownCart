import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { StoreLayout } from "../../components/SiteHeader";
import { CardSkeletons, ProductCard, type Card } from "../../components/ProductCard";
import { Empty, ErrorState } from "../../components/ui";
import { useApi, useTitle } from "../../lib/useApi";
import { BounceHeading } from "../../components/BounceHeading";

interface Facets {
  categories: { name: string; slug: string; parentId: number | null; description: string; count: number }[];
  brands: { name: string; slug: string; count: number }[];
  genders: { men: number; women: number; unisex: number };
  priceRange: { min: number; max: number };
}
interface Results {
  total: number;
  items: Card[];
  page: number;
  pageSize: number;
  suggestion: string | null;
}

const GENDERS = [
  ["men", "Men"],
  ["women", "Women"],
  ["unisex", "Unisex"],
] as const;

const SORTS = [
  ["relevance", "Relevance"],
  ["popular", "Most popular"],
  ["newest", "Newest first"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["rating", "Best rated"],
  ["discount", "Biggest discount"],
];

export default function Shop() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = params.get("q") ?? "";
  const brands = (params.get("brand") ?? "").split(",").filter(Boolean);

  const facets = useApi<Facets>("/catalog/facets");
  const query = new URLSearchParams(params);
  if (category) query.set("category", category);
  const results = useApi<Results>(`/catalog/products?${query.toString()}`);
  const cat = facets.data?.categories.find((c) => c.slug === category);

  useTitle(q ? `Search: ${q}` : cat?.name ?? "Shop", { description: cat?.description, noindex: Boolean(q) });

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: false });
  };
  const toggleBrand = (slug: string) => {
    const next = brands.includes(slug) ? brands.filter((b) => b !== slug) : [...brands, slug];
    update({ brand: next.join(",") || null });
  };

  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  useEffect(() => {
    setMinPrice(params.get("minPrice") ?? "");
    setMaxPrice(params.get("maxPrice") ?? "");
  }, [params]);

  const chips: [string, string, () => void][] = [];
  if (q) chips.push(["q", `“${q}”`, () => update({ q: null })]);
  const gender = GENDERS.find(([g]) => g === params.get("gender"));
  if (gender) chips.push(["gender", gender[1], () => update({ gender: null })]);
  brands.forEach((b) => chips.push([`b-${b}`, facets.data?.brands.find((x) => x.slug === b)?.name ?? b, () => toggleBrand(b)]));
  if (params.get("minPrice") || params.get("maxPrice")) chips.push(["price", `₹${params.get("minPrice") || 0} – ₹${params.get("maxPrice") || "any"}`, () => update({ minPrice: null, maxPrice: null })]);
  if (params.get("inStock")) chips.push(["stock", "In stock", () => update({ inStock: null })]);
  if (params.get("onSale")) chips.push(["sale", "On sale", () => update({ onSale: null })]);
  if (params.get("minRating")) chips.push(["rating", `${params.get("minRating")}★ & up`, () => update({ minRating: null })]);

  // Keep the filter column at the same scroll position across category changes (each is a new route).
  const filtersRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = filtersRef.current;
    if (!el || !facets.data) return;
    try {
      el.scrollTop = Number(sessionStorage.getItem("cc-filters-scroll") ?? 0);
    } catch {
      /* storage unavailable */
    }
    const save = () => {
      try {
        sessionStorage.setItem("cc-filters-scroll", String(el.scrollTop));
      } catch {
        /* storage unavailable */
      }
    };
    el.addEventListener("scroll", save, { passive: true });
    return () => el.removeEventListener("scroll", save);
  }, [facets.data]);

  const page = Number(params.get("page") ?? 1);
  const pages = results.data ? Math.ceil(results.data.total / results.data.pageSize) : 1;

  return (
    <StoreLayout>
      <div className="container page">
        <nav aria-label="Breadcrumb" className="tiny muted" style={{ marginBottom: 12 }}>
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
          {cat && <> / {cat.name}</>}
        </nav>
        <div className="page-head">
          <div>
            <div className="eyebrow">{q ? "Search results" : "Collections"}</div>
            <BounceHeading className="display">{q ? `“${q}”` : cat?.name ?? "Shop all"}</BounceHeading>
            {cat?.description && <p className="muted" style={{ marginTop: 6 }}>{cat.description}</p>}
          </div>
          <div className="row">
            <button type="button" className="btn btn-outline btn-sm filter-toggle" aria-expanded={filtersOpen} aria-controls="filters" onClick={() => setFiltersOpen((o) => !o)}>
              Filters {chips.length ? `(${chips.length})` : ""}
            </button>
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <select id="sort" className="select" style={{ width: "auto" }} value={params.get("sort") ?? "relevance"} onChange={(e) => update({ sort: e.target.value === "relevance" ? null : e.target.value })}>
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="shop-layout">
          <aside ref={filtersRef} id="filters" className={`filters${filtersOpen ? " open" : ""}`} aria-label="Filters">
            <fieldset>
              <legend>Category</legend>
              <Link className={`chip${!category ? " active" : ""}`} to={`/shop${params.toString() ? `?${params}` : ""}`}>
                All
              </Link>
              {facets.data?.categories
                .filter((c) => c.count > 0)
                .map((c) => (
                  <Link key={c.slug} className={`chip${c.slug === category ? " active" : ""}`} to={`/shop/${c.slug}${params.toString() ? `?${params}` : ""}`}>
                    {c.name} <span className="muted">({c.count})</span>
                  </Link>
                ))}
            </fieldset>
            <fieldset>
              <legend>Shop for</legend>
              {GENDERS.map(([g, label]) => (
                <label key={g} className="check">
                  <input type="radio" name="gender" checked={params.get("gender") === g} onChange={() => update({ gender: g })} />
                  <span>
                    {label} {facets.data && <span className="muted">({facets.data.genders[g]})</span>}
                  </span>
                </label>
              ))}
            </fieldset>
            {facets.data && facets.data.brands.length > 0 && (
              <fieldset>
                <legend>Brand</legend>
                <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
                  {[...facets.data.brands].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })).map((b) => (
                    <label key={b.slug} className="check">
                      <input type="checkbox" checked={brands.includes(b.slug)} onChange={() => toggleBrand(b.slug)} />
                      <span>
                        {b.name} <span className="muted">({b.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset>
              <legend>Price (₹)</legend>
              <form className="row" style={{ "--gap": "6px" } as React.CSSProperties} onSubmit={(e) => (e.preventDefault(), update({ minPrice: minPrice || null, maxPrice: maxPrice || null }))}>
                <input className="input" style={{ width: 90 }} inputMode="numeric" aria-label="Minimum price" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))} />
                <input className="input" style={{ width: 90 }} inputMode="numeric" aria-label="Maximum price" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))} />
                <button className="btn btn-sm btn-outline" type="submit">
                  Go
                </button>
              </form>
            </fieldset>
            <fieldset>
              <legend>Availability & offers</legend>
              <label className="check">
                <input type="checkbox" checked={params.get("inStock") === "1"} onChange={(e) => update({ inStock: e.target.checked ? "1" : null })} />
                <span>In stock only</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={params.get("onSale") === "1"} onChange={(e) => update({ onSale: e.target.checked ? "1" : null })} />
                <span>On sale</span>
              </label>
            </fieldset>
            <fieldset>
              <legend>Rating</legend>
              {[4, 3].map((r) => (
                <label key={r} className="check">
                  <input type="radio" name="rating" checked={params.get("minRating") === String(r)} onChange={() => update({ minRating: String(r) })} />
                  <span>{r}★ & up</span>
                </label>
              ))}
            </fieldset>
          </aside>

          <section aria-label="Products" aria-busy={results.loading}>
            <div className="spread" style={{ marginBottom: 14 }}>
              <span className="small muted" aria-live="polite">
                {results.data ? `${results.data.total} product${results.data.total === 1 ? "" : "s"}` : "Loading…"}
              </span>
              {chips.length > 0 && (
                <div className="row" style={{ "--gap": "6px" } as React.CSSProperties}>
                  {chips.map(([k, label, remove]) => (
                    <button key={k} type="button" className="chip" onClick={remove} aria-label={`Remove filter ${label}`}>
                      {label} ✕
                    </button>
                  ))}
                  <Link className="link small" to={category ? `/shop/${category}` : "/shop"}>
                    Clear all
                  </Link>
                </div>
              )}
            </div>

            {results.error ? (
              <ErrorState error={results.error} retry={results.reload} />
            ) : !results.data ? (
              <CardSkeletons />
            ) : results.data.items.length === 0 ? (
              <Empty
                title="No products found"
                art="search"
                action={
                  <Link className="btn btn-outline" to="/shop">
                    Browse everything
                  </Link>
                }
              >
                {results.data.suggestion ? (
                  <>
                    Did you mean <Link to={`/shop?q=${encodeURIComponent(results.data.suggestion)}`}>“{results.data.suggestion}”</Link>?
                  </>
                ) : (
                  "Try a different search term or remove some filters."
                )}
              </Empty>
            ) : (
              <>
                <div className="product-grid">
                  {results.data.items.map((p) => (
                    <ProductCard key={p.id} p={p} q={q} />
                  ))}
                </div>
                {pages > 1 && (
                  <nav className="row" aria-label="Pagination" style={{ justifyContent: "center", marginTop: 32 }}>
                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
                      ← Previous
                    </button>
                    <span className="small muted">
                      Page {page} of {pages}
                    </span>
                    <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => update({ page: String(page + 1) })}>
                      Next →
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </StoreLayout>
  );
}
