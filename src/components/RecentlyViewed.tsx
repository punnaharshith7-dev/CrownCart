import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Card } from "./ProductCard";
import { inr } from "../lib/format";

/*
 * "Recently viewed": the products this visitor looked at, kept on this device (works signed out
 * too). Shown at the bottom of product pages as a row of small floating cards.
 */

const KEY = "cc-recently-viewed";
const MAX = 12;
type Seen = Pick<Card, "slug" | "name" | "brand" | "image" | "pricePaise" | "compareAtPaise">;

function read(): Seen[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((x) => x && typeof x.slug === "string") : [];
  } catch {
    return [];
  }
}

/** Remembers a product view (most recent first, de-duplicated). */
export function rememberViewed(p: Seen) {
  try {
    const next = [{ slug: p.slug, name: p.name, brand: p.brand, image: p.image, pricePaise: p.pricePaise, compareAtPaise: p.compareAtPaise }, ...read().filter((x) => x.slug !== p.slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const [items, setItems] = useState<Seen[]>([]);
  useEffect(() => setItems(read().filter((x) => x.slug !== exclude).slice(0, 10)), [exclude]);
  if (!items.length) return null;
  return (
    <section className="recent" aria-labelledby="recent-title">
      <div className="spread">
        <h2 id="recent-title" className="h3">
          Recently viewed
        </h2>
        <span className="tiny muted">On this device</span>
      </div>
      <div className="recent__row">
        {items.map((p, i) => (
          <Link key={p.slug} to={`/product/${p.slug}`} className="recent__card" style={{ "--i": i } as CSSProperties} data-cursor="view">
            <span className="recent__img">{p.image ? <img src={p.image} alt="" loading="lazy" decoding="async" /> : null}</span>
            <span className="recent__body">
              {p.brand && <span className="recent__brand">{p.brand}</span>}
              <span className="recent__name">{p.name}</span>
              <span className="recent__price">
                {inr(p.pricePaise)}
                {p.compareAtPaise && p.compareAtPaise > p.pricePaise ? <s>{inr(p.compareAtPaise)}</s> : null}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
