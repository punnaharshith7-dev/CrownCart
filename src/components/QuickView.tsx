import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SidePanel } from "./SidePanel";
import { ErrorState, Loading, Price, Qty, Stars } from "./ui";
import { useAuth } from "../lib/auth";
import { flyToBag } from "../lib/flyToBag";
import { useApi } from "../lib/useApi";

/*
 * Quick view: a product card's "Quick view" button opens this slide-in panel with the product's
 * photos, options and Add to bag, without leaving the page. Mounted once; opened by an event so
 * any card anywhere can trigger it.
 */

const EVENT = "crowncart-quickview";
export const openQuickView = (slug: string) => window.dispatchEvent(new CustomEvent(EVENT, { detail: slug }));

interface QVVariant {
  id: number;
  name: string;
  size: string | null;
  pricePaise: number;
  compareAtPaise: number | null;
  maxPerOrder: number;
  available: number;
}
interface QVProduct {
  slug: string;
  name: string;
  brand: string | null;
  tagline: string;
  description: string;
  pricePaise: number;
  compareAtPaise: number | null;
  rating: number | null;
  reviewCount: number;
  cutout: string | null;
  variants: QVVariant[];
  media: { id: number; kind: string; url: string; alt: string }[];
}

export function QuickView() {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    const open = (e: Event) => setSlug((e as CustomEvent<string>).detail);
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);
  const close = useCallback(() => setSlug(null), []);
  return (
    <SidePanel open={slug != null} onClose={close} title="Quick view" wide>
      {slug && <QuickViewBody key={slug} slug={slug} onClose={close} />}
    </SidePanel>
  );
}

function QuickViewBody({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data, error, loading, reload } = useApi<{ product: QVProduct }>(`/catalog/products/${slug}`);
  const { addToCart } = useAuth();
  const [idx, setIdx] = useState(0);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const mainImg = useRef<HTMLImageElement>(null);

  const p = data?.product;
  const photos = useMemo(() => (p ? p.media.filter((m) => m.kind === "image" || m.kind === "hero") : []), [p]);
  // A single option is chosen for you; with several, the shopper picks.
  useEffect(() => {
    if (p && p.variants.length === 1) setVariantId(p.variants[0].id);
  }, [p]);

  if (error) return <ErrorState error={error} retry={reload} />;
  if (loading || !p) return <Loading />;
  const variant = p.variants.find((v) => v.id === variantId) ?? null;
  const soldOut = p.variants.every((v) => v.available <= 0);
  const maxQty = variant ? Math.max(1, Math.min(variant.available, variant.maxPerOrder)) : 1;
  const photo = photos[idx] ?? photos[0];
  const cutout = photo?.kind === "image" && p.cutout ? p.cutout : null;

  const add = async () => {
    if (!variant) return;
    setAdding(true);
    const ok = await addToCart(variant.id, qty, { productName: `${p.name}${p.variants.length > 1 ? ` (${variant.name})` : ""}` });
    setAdding(false);
    if (ok) flyToBag(mainImg.current);
  };

  return (
    <div className="qv">
      <div className="qv__gallery">
        <div className={`qv__main${cutout ? " is-cutout" : ""}`}>{photo ? <img ref={mainImg} src={cutout ?? photo.url} alt={photo.alt || p.name} /> : <span className="small muted">No image</span>}</div>
        {photos.length > 1 && (
          <div className="qv__thumbs" role="group" aria-label="Choose image">
            {photos.slice(0, 6).map((m, i) => (
              <button key={m.id} type="button" aria-pressed={i === idx} aria-label={`Image ${i + 1}`} onClick={() => setIdx(i)}>
                <img src={m.url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="qv__info stack" style={{ "--gap": "14px" } as React.CSSProperties}>
        {p.brand && <div className="eyebrow">{p.brand}</div>}
        <h2 className="qv__name">{p.name}</h2>
        <Price paise={variant?.pricePaise ?? p.pricePaise} compareAt={variant ? variant.compareAtPaise : p.compareAtPaise} />
        <Stars rating={p.rating} count={p.reviewCount} />
        {p.tagline && <p className="small muted">{p.tagline}</p>}

        {p.variants.length > 1 && (
          <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
            <span className="small" style={{ fontWeight: 600 }}>
              {p.variants[0]?.size ? "Size" : "Option"}
            </span>
            <div className="row" style={{ "--gap": "6px", flexWrap: "wrap" } as React.CSSProperties}>
              {p.variants.map((v) => (
                <button key={v.id} type="button" className="chip" aria-pressed={v.id === variantId} disabled={v.available <= 0} onClick={() => (setVariantId(v.id), setQty(1))}>
                  {v.name}
                  {v.available <= 0 && " · sold out"}
                </button>
              ))}
            </div>
          </div>
        )}

        {soldOut ? (
          <div className="alert alert-warning">Sold out right now.</div>
        ) : (
          <div className="row">
            {variant && <Qty value={qty} max={maxQty} onChange={setQty} />}
            <button type="button" className="btn btn-lg" style={{ flex: 1 }} disabled={!variant || adding} onClick={add}>
              {adding ? "Adding…" : !variant ? `Choose a ${p.variants[0]?.size ? "size" : "option"}` : "Add to bag"}
            </button>
          </div>
        )}
        {variant && variant.available > 0 && variant.available <= 5 && <span className="tiny" style={{ color: "var(--warning)" }}>Only {variant.available} left</span>}
        <Link to={`/product/${p.slug}`} className="link small" onClick={onClose}>
          View full details →
        </Link>
      </div>
    </div>
  );
}
