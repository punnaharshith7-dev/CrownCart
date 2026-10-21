import { Link } from "react-router-dom";
import { Highlight } from "./SiteHeader";
import { Price, Stars } from "./ui";

export interface Card {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  badge: string;
  image: string | null;
  pricePaise: number;
  compareAtPaise: number | null;
  discountPercent: number;
  inStock: boolean;
  rating: number | null;
  reviewCount: number;
}

export function ProductCard({ p, q = "" }: { p: Card; q?: string }) {
  return (
    <Link to={`/product/${p.slug}`} className="product-card">
      <div className="media">{p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <span className="muted small">No image</span>}</div>
      {!p.inStock ? (
        <span className="badge badge-danger tag">Out of stock</span>
      ) : p.badge ? (
        <span className="badge badge-plain tag">{p.badge}</span>
      ) : null}
      <div className="body">
        {p.brand && <span className="brand">{p.brand}</span>}
        <span className="name">
          <Highlight text={p.name} q={q} />
        </span>
        <Price paise={p.pricePaise} compareAt={p.compareAtPaise} />
        <Stars rating={p.rating} count={p.reviewCount} />
      </div>
    </Link>
  );
}

export function CardSkeletons({ n = 8 }: { n?: number }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton" style={{ aspectRatio: "0.78" }} />
      ))}
    </div>
  );
}
