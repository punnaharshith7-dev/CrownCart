import { useState } from "react";
import { Link } from "react-router-dom";
import { Highlight } from "./SiteHeader";
import { Price, Stars } from "./ui";
import { FitImage } from "./FitImage";
import { openQuickView } from "./QuickView";
import { useAuth } from "../lib/auth";
import { flyToBag } from "../lib/flyToBag";

export interface Card {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  gender?: "men" | "women" | "unisex" | null;
  badge: string;
  image: string | null;
  altImage?: string | null;
  cutout?: string | null;
  variants?: { id: number; name: string; available: number }[];
  pricePaise: number;
  compareAtPaise: number | null;
  discountPercent: number;
  inStock: boolean;
  rating: number | null;
  reviewCount: number;
}

/** Shown over the photo on hover: one tap adds to the bag, or pick a size if there are several. */
function QuickAdd({ p, card }: { p: Card; card: () => Element | null | undefined }) {
  const { addToCart } = useAuth();
  const [busy, setBusy] = useState<number | null>(null);
  const variants = p.variants ?? [];
  if (!p.inStock || !variants.length) return null;
  const add = async (v: { id: number; name: string }) => {
    setBusy(v.id);
    const added = await addToCart(v.id, 1, { productName: `${p.name}${variants.length > 1 ? ` (${v.name})` : ""}` });
    setBusy(null);
    if (added) flyToBag(card());
  };
  return (
    <div className="quick-add">
      <div className="quick-add__panel">
        {variants.length === 1 ? (
          <button type="button" className="quick-add__one" disabled={busy !== null} onClick={() => add(variants[0])} aria-label={`Add ${p.name} to bag`}>
            {busy !== null ? "Adding…" : "Add to bag"}
          </button>
        ) : (
          <>
            <span className="quick-add__label">Add to bag</span>
            <div className="quick-add__sizes">
              {variants.map((v) => (
                <button key={v.id} type="button" disabled={v.available <= 0 || busy !== null} aria-busy={busy === v.id} onClick={() => add(v)} aria-label={`Add ${p.name}, ${v.name}${v.available <= 0 ? ", out of stock" : ""}`}>
                  {v.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const GENDER_LABELS = { men: "Men", women: "Women", unisex: "Unisex" };

export function ProductCard({ p, q = "" }: { p: Card; q?: string }) {
  const [wrap, setWrap] = useState<HTMLDivElement | null>(null);
  return (
    <div className="product-card-wrap" ref={setWrap}>
    <Link to={`/product/${p.slug}`} className="product-card">
      <div className={`media${p.cutout ? " media--cutout" : ""}`}>
        {p.cutout ? (
          <img className="media__cutout" src={p.cutout} alt={p.name} loading="lazy" />
        ) : p.image ? (
          <FitImage
            src={p.image}
            alt={p.name}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = "1";
                target.src = "/products/jordan1.png";
              }
            }}
          />
        ) : (
          <span className="muted small">No image</span>
        )}
        {p.altImage && <img className="media__alt" src={p.altImage} alt="" loading="lazy" />}
      </div>
      {!p.inStock ? (
        <span className="badge badge-danger tag">Out of stock</span>
      ) : p.badge ? (
        <span className="badge badge-plain tag">{p.badge}</span>
      ) : null}
      <div className="body">
        {(p.brand || p.gender) && <span className="brand">{[p.brand, p.gender && GENDER_LABELS[p.gender]].filter(Boolean).join(" · ")}</span>}
        <span className="name">
          <Highlight text={p.name} q={q} />
        </span>
        <Price paise={p.pricePaise} compareAt={p.compareAtPaise} />
        <Stars rating={p.rating} count={p.reviewCount} />
      </div>
    </Link>
    <button type="button" className="qv-btn" onClick={() => openQuickView(p.slug)} aria-label={`Quick view: ${p.name}`}>
      Quick view
    </button>
    <QuickAdd p={p} card={() => wrap?.querySelector(".media")} />
    </div>
  );
}

export function CardSkeletons({ n = 8 }: { n?: number }) {
  return (
    <div className="product-grid" role="status" aria-label="Loading products">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card-skeleton" aria-hidden="true">
          <div className="skeleton card-skeleton__media" />
          <div className="shimmer-lines card-skeleton__body">
            <div className="skeleton" style={{ width: "34%", height: 10 }} />
            <div className="skeleton" style={{ width: "82%" }} />
            <div className="skeleton" style={{ width: "48%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
