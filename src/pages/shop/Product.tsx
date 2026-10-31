import { Fragment, lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StoreLayout } from "../../components/SiteHeader";
import { GENDER_LABELS, ProductCard, type Card } from "../../components/ProductCard";
import { FitImage } from "../../components/FitImage";
import { Button, ErrorState, Price, Qty, Stars } from "../../components/ui";
import { ReviewForm, ReviewPhotos } from "../../components/ReviewForm";
import { api, errorMessage } from "../../lib/api";
import { rememberInterest } from "../../lib/interests";
import { useAuth } from "../../lib/auth";
import { date, inr } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi, useTitle } from "../../lib/useApi";
import { BounceHeading } from "../../components/BounceHeading";
import { ZoomLens } from "../../components/ZoomLens";
import { flyToBag } from "../../lib/flyToBag";
import { RecentlyViewed, rememberViewed } from "../../components/RecentlyViewed";

// The 3D viewer (and its WebGL code) loads only when a shopper opens it.
const ProductViewer3D = lazy(() => import("../../components/ProductViewer3D"));

interface Variant {
  id: number;
  sku: string;
  name: string;
  color: string | null;
  size: string | null;
  pricePaise: number;
  compareAtPaise: number | null;
  maxPerOrder: number;
  available: number;
  lowStock: boolean;
}
interface ProductDetail extends Card {
  heroImage: string | null;
  titleLine1: string;
  titleLine2: string;
  accent: string;
  tagline: string;
  description: string;
  care: string;
  warranty: string;
  returnDays: number;
  store: { name: string; slug: string };
  seoTitle: string | null;
  seoDescription: string | null;
  variants: Variant[];
  media: { id: number; variantId: number | null; kind: string; url: string; alt: string }[];
  specs: { label: string; value: string }[];
  ratingSummary: { average: number | null; total: number; distribution: { star: number; count: number }[] };
  reviews: { id: number; rating: number; title: string; body: string; verifiedPurchase: boolean; helpfulCount: number; createdAt: string; author: string; photos: string[] }[];
  canReview: boolean;
  inWishlist: boolean;
  categorySlug: string | null;
}
interface Resp {
  product: ProductDetail;
  related: Card[];
  delivery: { estimateDaysMin: number; estimateDaysMax: number; freeThresholdPaise: number; flatPaise: number };
  tax: { note: string };
}

function JsonLd({ p }: { p: ProductDetail }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.media.filter((m) => m.kind === "image" || m.kind === "hero").map((m) => location.origin + m.url),
    description: p.description,
    sku: p.variants[0]?.sku,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      priceCurrency: "INR",
      price: (v.pricePaise / 100).toFixed(2),
      availability: v.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: location.href,
    })),
    aggregateRating: p.ratingSummary.total ? { "@type": "AggregateRating", ratingValue: p.ratingSummary.average, reviewCount: p.ratingSummary.total } : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

/** Full-screen viewer: the whole image fits the screen; zoom with buttons, wheel or double-click, drag to pan. */
function Lightbox({ images, index, onIndex, name, onClose }: { images: { url: string; alt?: string | null }[]; index: number; onIndex: (i: number) => void; name: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const img = images[index];
  const many = images.length > 1;

  const zoomTo = (z: number) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
    setZoom(next);
    if (next === 1) setPan({ x: 0, y: 0 });
  };
  const go = (d: number) => {
    onIndex((index + d + images.length) % images.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomTo(zoom + 0.5);
      else if (e.key === "-") zoomTo(zoom - 0.5);
      else if (many && e.key === "ArrowRight") go(1);
      else if (many && e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }); // re-bound each render so arrow keys see the current index

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Full-screen image" onClick={onClose}>
      <div
        className={`lightbox-stage${zoom > 1 ? " zoomed" : ""}${drag ? " dragging" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => zoomTo(zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2))}
        onDoubleClick={() => zoomTo(zoom > 1 ? 1 : 2.5)}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
        }}
        onPointerMove={(e) => drag && setPan({ x: drag.px + (e.clientX - drag.x) / zoom, y: drag.py + (e.clientY - drag.y) / zoom })}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <img src={img.url} alt={img.alt || name} draggable={false} style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }} />
      </div>

      <button type="button" className="icon-btn lightbox-close" aria-label="Close" autoFocus onClick={onClose}>
        ✕
      </button>
      {many && (
        <>
          <button type="button" className="icon-btn lightbox-prev" aria-label="Previous image" onClick={(e) => (e.stopPropagation(), go(-1))}>
            ‹
          </button>
          <button type="button" className="icon-btn lightbox-next" aria-label="Next image" onClick={(e) => (e.stopPropagation(), go(1))}>
            ›
          </button>
        </>
      )}
      <div className="lightbox-tools" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn" aria-label="Zoom out" disabled={zoom <= ZOOM_MIN} onClick={() => zoomTo(zoom - 0.5)}>
          −
        </button>
        <button type="button" className="lightbox-level" aria-label="Fit to screen" onClick={() => zoomTo(1)}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="icon-btn" aria-label="Zoom in" disabled={zoom >= ZOOM_MAX} onClick={() => zoomTo(zoom + 0.5)}>
          +
        </button>
        {many && (
          <span className="lightbox-count">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}

/** The page's shape while it loads: the gallery on one side, the buying details on the other. */
function ProductSkeleton() {
  return (
    <div className="container page" role="status" aria-label="Loading product">
      <div className="pdp" aria-hidden="true">
        <div className="skeleton gallery-skeleton" />
        <div className="shimmer-lines">
          <div className="skeleton" style={{ width: "28%", height: 11 }} />
          <div className="skeleton" style={{ width: "86%", height: 46 }} />
          <div className="skeleton" style={{ width: "40%", height: 24 }} />
          <div className="skeleton" style={{ width: "100%", height: 52, marginTop: 20 }} />
          <div className="skeleton" style={{ width: "100%", height: 96 }} />
        </div>
      </div>
    </div>
  );
}

export default function Product() {
  const { slug = "" } = useParams();
  const { data, error, loading, reload, setData } = useApi<Resp>(`/catalog/products/${slug}`);
  const { user, addToCart } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const p = data?.product;
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pincode, setPincode] = useState("");
  const [service, setService] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [view3d, setView3d] = useState(false);

  useTitle(p ? p.seoTitle || p.name : "Product", { description: p?.seoDescription || p?.tagline });

  useEffect(() => {
    if (!p) return;
    // Preselect the first in-stock variant; single-variant products need no choice.
    const first = p.variants.find((v) => v.available > 0) ?? p.variants[0];
    setVariantId(p.variants.length === 1 ? first?.id ?? null : null);
    setQty(1);
    setMediaIdx(0);
    api.post(`/catalog/products/${slug}/view`).catch(() => {});
    rememberInterest(slug);
    if (p) rememberViewed(p);
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const variant = p?.variants.find((v) => v.id === variantId) ?? null;
  // The product photo leads; the lifestyle hero follows it.
  const gallery = useMemo(() => (p ? p.media.filter((m) => m.kind === "image" || m.kind === "hero").sort((a, b) => Number(a.kind === "hero") - Number(b.kind === "hero")) : []), [p]);
  const videos = p?.media.filter((m) => m.kind === "video") ?? [];
  const model = p?.media.find((m) => m.kind === "model");
  const lifestyle = gallery.find((m) => m.kind === "hero") ?? gallery[0];
  const needsSize = Boolean(p && p.variants.length > 1);

  if (loading && !data) return <StoreLayout><ProductSkeleton /></StoreLayout>;
  if (error || !p) return <StoreLayout><ErrorState error={error} retry={reload} /></StoreLayout>;

  const priceVariant = variant ?? p.variants[0];
  const soldOut = p.variants.every((v) => v.available <= 0);
  const maxQty = variant ? Math.max(1, Math.min(variant.available, variant.maxPerOrder)) : 1;

  const add = async () => {
    if (!variant) return toast(`Choose a ${p.variants[0]?.size ? "size" : "option"} first.`, "error");
    setAdding(true);
    const added = await addToCart(variant.id, qty, { productName: `${p.name}${needsSize ? ` (${variant.name})` : ""}` });
    setAdding(false);
    if (added) flyToBag(document.querySelector(".gallery-main"));
  };
  const toggleWish = async () => {
    if (!user) return navigate(`/signin?returnTo=${encodeURIComponent(location.pathname)}`);
    try {
      if (p.inWishlist) await api.del(`/wishlist/${p.id}`);
      else await api.post("/wishlist", { productId: p.id });
      setData({ ...data!, product: { ...p, inWishlist: !p.inWishlist } });
      toast(p.inWishlist ? "Removed from your wishlist." : "Saved to your wishlist.", "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const notifyMe = async () => {
    if (!user) return navigate(`/signin?returnTo=${encodeURIComponent(location.pathname)}`);
    const target = variant ?? p.variants[0];
    try {
      await api.post("/account/stock-alerts", { variantId: target.id });
      toast("We'll let you know when it's back in stock.", "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        toast("Link copied.", "success");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <StoreLayout>
      <JsonLd p={p} />
      <div className="container page">
        <nav aria-label="Breadcrumb" className="tiny muted" style={{ marginBottom: 16 }}>
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
          {p.category && (
            <>
              {" "}
              / <Link to={`/shop/${p.categorySlug}`}>{p.category}</Link>
            </>
          )}{" "}
          / <span aria-current="page">{p.name}</span>
        </nav>

        <div className="pdp">
          <section className="pdp-gallery" aria-label="Product images">
            {model && (
              <div className="row" role="group" aria-label="Gallery view" style={{ marginBottom: 12 }}>
                <button type="button" className="chip" aria-pressed={!view3d} onClick={() => setView3d(false)}>
                  Photos
                </button>
                <button type="button" className="chip" aria-pressed={view3d} onClick={() => setView3d(true)}>
                  View in 3D
                </button>
              </div>
            )}
            {view3d && model ? (
              <Suspense fallback={<div className="gallery-main"><span className="small muted">Loading 3D viewer…</span></div>}>
                <ProductViewer3D url={model.url} title={p.name} />
              </Suspense>
            ) : gallery.length ? (
              <div className="pdp-gallery__rail">
                {gallery.map((m, i) => {
                  // The clean cutout stands in for the product photo here; full screen shows the original.
                  const src = m.kind === "image" && p.cutout ? p.cutout : m.url;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`gallery-main${m.kind === "hero" ? " hero" : ""}${src !== m.url ? " is-cutout" : ""}`}
                      onClick={() => (setMediaIdx(i), setLightbox(true))}
                      aria-label={`Open image ${i + 1} full screen`}
                    >
                      {m.kind === "hero" || src !== m.url ? <img src={src} alt={m.alt || p.name} /> : <FitImage src={src} alt={m.alt || p.name} />}
                      <ZoomLens src={src} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="gallery-main">No image available</div>
            )}
            {videos.map((v) => (
              <video key={v.id} src={v.url} controls muted playsInline preload="metadata" style={{ width: "100%", borderRadius: 16, marginTop: 12 }} aria-label={v.alt || `${p.name} video`} />
            ))}
          </section>

          <section className="stack pdp-info" style={{ "--gap": "18px" } as React.CSSProperties} aria-label="Product details">
            <div>
              {(p.brand || p.gender) && <div className="eyebrow">{[p.brand, p.gender && GENDER_LABELS[p.gender]].filter(Boolean).join(" · ")}</div>}
              <BounceHeading className="display" style={{ fontSize: "clamp(30px, 4vw, 46px)", marginTop: 4 }}>
                {p.name}
              </BounceHeading>
              {p.tagline && <p className="muted" style={{ marginTop: 6 }}>{p.tagline}</p>}
            </div>
            <div className="row">
              <Price paise={priceVariant.pricePaise} compareAt={priceVariant.compareAtPaise} className="h3" />
              <a href="#reviews" className="small">
                <Stars rating={p.ratingSummary.average} count={p.ratingSummary.total} />
              </a>
            </div>
            <p className="tiny muted">{data!.tax.note}</p>

            {(needsSize || p.variants[0]?.name !== "Standard") && (
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="label" style={{ marginBottom: 8 }}>
                  {p.variants[0].size ? "Size" : "Option"}
                  {variant ? `: ${variant.name}` : ""}
                </legend>
                <div className="variants">
                  {p.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="variant"
                      aria-pressed={v.id === variantId}
                      data-unavailable={v.available <= 0}
                      aria-label={`${v.name}${v.available <= 0 ? ", out of stock" : ""}`}
                      onClick={() => (setVariantId(v.id), setQty(1))}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {variant && (
              <div className="small" aria-live="polite">
                {variant.available <= 0 ? (
                  <span className="badge badge-danger">Out of stock</span>
                ) : variant.lowStock ? (
                  <span className="badge badge-warning">Only {variant.available} left</span>
                ) : (
                  <span className="badge badge-success">In stock</span>
                )}
                <span className="muted" style={{ marginLeft: 10 }}>SKU {variant.sku}</span>
              </div>
            )}

            {soldOut || (variant && variant.available <= 0) ? (
              <div className="row">
                <Button className="btn-outline btn-lg" onClick={notifyMe}>
                  Notify me when available
                </Button>
                <button type="button" className="icon-btn" aria-pressed={p.inWishlist} aria-label={p.inWishlist ? "Remove from wishlist" : "Save to wishlist"} onClick={toggleWish}>
                  {p.inWishlist ? "♥" : "♡"}
                </button>
              </div>
            ) : (
              <div className="row">
                {variant && <Qty value={qty} max={maxQty} onChange={setQty} />}
                <Button className="btn-lg" style={{ flex: 1 }} loading={adding} onClick={add} aria-disabled={!variant}>
                  {needsSize && !variant ? `Select a ${p.variants[0]?.size ? "size" : "option"}` : "Add to bag"}
                </Button>
                <button type="button" className="icon-btn" aria-pressed={p.inWishlist} aria-label={p.inWishlist ? "Remove from wishlist" : "Save to wishlist"} onClick={toggleWish}>
                  {p.inWishlist ? "♥" : "♡"}
                </button>
              </div>
            )}

            <div className="panel stack" style={{ "--gap": "10px" } as React.CSSProperties}>
              <form
                className="row"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const r = await api.post<{ serviceable: boolean; estimateDaysMin: number; estimateDaysMax: number }>("/checkout/serviceability", { pincode });
                    setService(r.serviceable ? `Delivers to ${pincode} in ${r.estimateDaysMin}–${r.estimateDaysMax} days.` : `Sorry, we don't deliver to ${pincode} yet.`);
                  } catch (err) {
                    setService(errorMessage(err));
                  }
                }}
              >
                <label className="sr-only" htmlFor="pin">
                  Delivery PIN code
                </label>
                <input id="pin" className="input" style={{ maxWidth: 160 }} inputMode="numeric" maxLength={6} placeholder="PIN code" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} />
                <button className="btn btn-outline btn-sm" type="submit" disabled={pincode.length !== 6}>
                  Check delivery
                </button>
              </form>
              <span className="small" aria-live="polite">
                {service ?? `Usually delivers in ${data!.delivery.estimateDaysMin}–${data!.delivery.estimateDaysMax} days. Free shipping over ${inr(data!.delivery.freeThresholdPaise)}.`}
              </span>
              <span className="small muted">
                {p.returnDays > 0 ? `${p.returnDays}-day returns.` : "This item can't be returned once delivered."} Sold by {p.store.name}.
              </span>
            </div>

            <div className="row small">
              <button type="button" className="link" onClick={share}>
                Share
              </button>
              <Link to={`/contact?subject=${encodeURIComponent(`Incorrect information: ${p.name}`)}`} className="muted">
                Report incorrect information
              </Link>
            </div>
          </section>
        </div>

        <div className="pdp-story">
          <section className="story-row" aria-labelledby="story-h">
            {lifestyle && (
              <div className="story-row__img">
                <img src={lifestyle.url} alt={lifestyle.alt || p.name} loading="lazy" />
              </div>
            )}
            <div className="story-row__text">
              <div className="eyebrow">The story</div>
              <h2 className="story-row__title" id="story-h">
                {p.tagline || p.name}
              </h2>
              <p className="story-row__body">{p.description}</p>
            </div>
          </section>

          {p.specs.length > 0 && (
            <section aria-labelledby="specs-h">
              <div className="eyebrow">In detail</div>
              <h2 className="story-row__title" id="specs-h">
                Specifications
              </h2>
              <dl className="spec-tiles">
                {p.specs.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="story-row story-row--flip" aria-labelledby="owning-h">
            {gallery[0] && (
              <div className={`story-row__img${p.cutout ? " is-cutout" : ""}`}>
                <img src={p.cutout ?? gallery[0].url} alt="" loading="lazy" />
              </div>
            )}
            <div className="story-row__text">
              <div className="eyebrow">Owning it</div>
              <h2 className="story-row__title" id="owning-h">
                Care & assurance
              </h2>
              <div>
                {p.care && (
                  <details className="acc" open>
                    <summary>Care</summary>
                    <div>{p.care}</div>
                  </details>
                )}
                <details className="acc" open={!p.care}>
                  <summary>Shipping & returns</summary>
                  <div>
                    Standard delivery in {data!.delivery.estimateDaysMin}–{data!.delivery.estimateDaysMax} days. Shipping is free on orders over {inr(data!.delivery.freeThresholdPaise)}, otherwise{" "}
                    {inr(data!.delivery.flatPaise)}. {p.returnDays > 0 ? `Returns accepted within ${p.returnDays} days of delivery.` : "Returns are not accepted for this item."}{" "}
                    <Link to="/policies/returns">Read the full policy</Link>.
                  </div>
                </details>
                {p.warranty && (
                  <details className="acc">
                    <summary>Warranty</summary>
                    <div>{p.warranty}</div>
                  </details>
                )}
              </div>
            </div>
          </section>
        </div>

        <section id="reviews" style={{ marginTop: 64 }} aria-labelledby="reviews-h">
          <div className="spread" style={{ marginBottom: 20 }}>
            <h2 className="h2" id="reviews-h">
              Reviews
            </h2>
            {!writing && p.canReview && p.ratingSummary.total > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => setWriting(true)}>
                Rate this product
              </button>
            )}
          </div>
          {p.ratingSummary.total === 0 && !writing && (
            <div className="reviews-empty">
              <span className="stars" aria-hidden="true">
                ☆☆☆☆☆
              </span>
              <p className="reviews-empty__line">Be the first to review this</p>
              {p.canReview ? (
                <button className="btn btn-outline btn-sm" onClick={() => setWriting(true)}>
                  Rate this product
                </button>
              ) : (
                <p className="small muted">Reviews come from customers who have received this product.</p>
              )}
            </div>
          )}
          {writing && p.ratingSummary.total === 0 && <ReviewForm slug={slug} onDone={() => (setWriting(false), reload())} />}
          {p.ratingSummary.total > 0 && (
          <div className="two-col" style={{ gridTemplateColumns: "280px 1fr" }}>
            <div className="stack">
              <div className="display" style={{ fontSize: 48 }}>
                {p.ratingSummary.average}
              </div>
              <Stars rating={p.ratingSummary.average} count={p.ratingSummary.total} />
              <div className="rating-bars">
                {p.ratingSummary.distribution.map((d) => (
                  <Fragment key={d.star}>
                    <span>{d.star}★</span>
                    <span className="bar">
                      <span style={{ width: `${(d.count / p.ratingSummary.total) * 100}%` }} />
                    </span>
                    <span className="muted">
                      {d.count}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="stack">
              {writing && <ReviewForm slug={slug} onDone={() => (setWriting(false), reload())} />}
              {p.reviews.map((r) => (
                <article key={r.id} className="card card-flat stack" style={{ "--gap": "6px" } as React.CSSProperties}>
                  <div className="spread">
                    <span className="stars" aria-label={`${r.rating} out of 5`}>
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </span>
                    <span className="tiny muted">{date(r.createdAt)}</span>
                  </div>
                  {r.title && <strong>{r.title}</strong>}
                  {r.body && <p className="small">{r.body}</p>}
                  <ReviewPhotos photos={r.photos} />
                  <div className="row tiny muted">
                    <span>{r.author}</span>
                    {r.verifiedPurchase && <span className="badge badge-success">Verified purchase</span>}
                    {user && (
                      <button
                        type="button"
                        className="link tiny"
                        onClick={() => api.post(`/catalog/reviews/${r.id}/helpful`).then(() => toast("Thanks for your feedback.", "success")).catch((e) => toast(errorMessage(e), "error"))}
                      >
                        Helpful ({r.helpfulCount})
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
          )}
        </section>

        {data!.related.length > 0 && (
          <section style={{ marginTop: 64 }} aria-labelledby="related-h">
            <h2 className="h2" id="related-h" style={{ marginBottom: 20 }}>
              You may also like
            </h2>
            <div className="product-grid">
              {data!.related.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}
        <RecentlyViewed exclude={p.slug} />
      </div>

      {lightbox && gallery[mediaIdx] && <Lightbox images={gallery} index={mediaIdx} onIndex={setMediaIdx} name={p.name} onClose={() => setLightbox(false)} />}
    </StoreLayout>
  );
}
