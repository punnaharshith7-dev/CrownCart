import { Fragment, lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StoreLayout } from "../../components/SiteHeader";
import { ProductCard, type Card } from "../../components/ProductCard";
import { Button, ErrorState, Loading, Price, Qty, Stars, TextArea, TextField } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { date, inr } from "../../lib/format";
import { useToast } from "../../lib/toast";
import { useApi, useTitle } from "../../lib/useApi";

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
  reviews: { id: number; rating: number; title: string; body: string; verifiedPurchase: boolean; helpfulCount: number; createdAt: string; author: string }[];
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

function ReviewForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  return (
    <form
      className="stack card card-flat"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) return setError("Choose a star rating.");
        setBusy(true);
        setError(null);
        try {
          const r = await api.post<{ moderated: boolean }>(`/catalog/products/${slug}/reviews`, { rating, title, body });
          toast(r.moderated ? "Thanks! Your review will appear once it's approved." : "Thanks for your review!", "success");
          onDone();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Your rating</legend>
        <div className="row" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="link stars" style={{ fontSize: 26, textDecoration: "none" }} onClick={() => setRating(n)}>
              {n <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </fieldset>
      <TextField label="Headline" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Review" required value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} hint="What did you like or dislike? How did you use it?" />
      {error && <div className="alert alert-danger">{error}</div>}
      <Button loading={busy} type="submit">
        Submit review
      </Button>
    </form>
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
  }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const variant = p?.variants.find((v) => v.id === variantId) ?? null;
  const gallery = useMemo(() => (p ? p.media.filter((m) => m.kind === "image" || m.kind === "hero") : []), [p]);
  const videos = p?.media.filter((m) => m.kind === "video") ?? [];
  const model = p?.media.find((m) => m.kind === "model");
  const shown = gallery[mediaIdx];
  const needsSize = Boolean(p && p.variants.length > 1);

  if (loading && !data) return <StoreLayout><Loading /></StoreLayout>;
  if (error || !p) return <StoreLayout><ErrorState error={error} retry={reload} /></StoreLayout>;

  const priceVariant = variant ?? p.variants[0];
  const soldOut = p.variants.every((v) => v.available <= 0);
  const maxQty = variant ? Math.max(1, Math.min(variant.available, variant.maxPerOrder)) : 1;

  const add = async () => {
    if (!variant) return toast(`Choose a ${p.variants[0]?.size ? "size" : "option"} first.`, "error");
    setAdding(true);
    await addToCart(variant.id, qty, { productName: `${p.name}${needsSize ? ` (${variant.name})` : ""}` });
    setAdding(false);
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
          <section aria-label="Product images">
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
            ) : shown ? (
              <button type="button" className={`gallery-main${shown.kind === "hero" ? " hero" : ""}`} onClick={() => setLightbox(true)} aria-label="Open full-screen image" style={{ width: "100%", padding: 0 }}>
                <img src={shown.url} alt={shown.alt || p.name} />
              </button>
            ) : (
              <div className="gallery-main">No image available</div>
            )}
            {!view3d && gallery.length > 1 && (
              <div className="thumbs" role="group" aria-label="Choose image">
                {gallery.map((m, i) => (
                  <button key={m.id} type="button" aria-pressed={i === mediaIdx} aria-label={`Image ${i + 1}`} onClick={() => setMediaIdx(i)}>
                    <img src={m.url} alt="" />
                  </button>
                ))}
              </div>
            )}
            {videos.map((v) => (
              <video key={v.id} src={v.url} controls muted playsInline preload="metadata" style={{ width: "100%", borderRadius: 16, marginTop: 12 }} aria-label={v.alt || `${p.name} video`} />
            ))}
          </section>

          <section className="stack" style={{ "--gap": "18px" } as React.CSSProperties} aria-label="Product details">
            <div>
              {p.brand && <div className="eyebrow">{p.brand}</div>}
              <h1 className="display" style={{ fontSize: "clamp(30px, 4vw, 46px)", marginTop: 4 }}>
                {p.name}
              </h1>
              {p.tagline && <p className="muted" style={{ marginTop: 6 }}>{p.tagline}</p>}
            </div>
            <div className="row">
              <Price paise={priceVariant.pricePaise} compareAt={priceVariant.compareAtPaise} className="h3" />
              <a href="#reviews" className="small">
                <Stars rating={p.ratingSummary.average} count={p.ratingSummary.total} />
              </a>
            </div>
            <p className="tiny muted">{data!.tax.note}</p>

            {needsSize && (
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

            <div>
              <details className="acc" open>
                <summary>Description</summary>
                <div>{p.description}</div>
              </details>
              {p.specs.length > 0 && (
                <details className="acc" open>
                  <summary>Specifications</summary>
                  <div className="spec-grid">
                    {p.specs.map((s) => (
                      <div key={s.label}>
                        <div className="tiny muted">{s.label}</div>
                        <div className="small" style={{ fontWeight: 600, color: "var(--text)" }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {p.care && (
                <details className="acc">
                  <summary>Care</summary>
                  <div>{p.care}</div>
                </details>
              )}
              <details className="acc">
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

        <section id="reviews" style={{ marginTop: 64 }} aria-labelledby="reviews-h">
          <div className="spread" style={{ marginBottom: 20 }}>
            <h2 className="h2" id="reviews-h">
              Reviews
            </h2>
            {!writing && (
              <button className="btn btn-outline btn-sm" onClick={() => (user ? setWriting(true) : navigate(`/signin?returnTo=${encodeURIComponent(location.pathname + "#reviews")}`))}>
                Write a review
              </button>
            )}
          </div>
          <div className="two-col" style={{ gridTemplateColumns: "280px 1fr" }}>
            <div className="stack">
              <div className="display" style={{ fontSize: 48 }}>
                {p.ratingSummary.average ?? "–"}
              </div>
              <Stars rating={p.ratingSummary.average} count={p.ratingSummary.total} />
              <div className="rating-bars">
                {p.ratingSummary.distribution.map((d) => (
                  <Fragment key={d.star}>
                    <span>{d.star}★</span>
                    <span className="bar">
                      <span style={{ width: `${p.ratingSummary.total ? (d.count / p.ratingSummary.total) * 100 : 0}%` }} />
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
              {p.reviews.length === 0 && !writing && <p className="muted">No reviews yet. Customers who buy this product can share their experience here.</p>}
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
                  <p className="small">{r.body}</p>
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
      </div>

      {lightbox && shown && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Full-screen image" onClick={() => setLightbox(false)} onKeyDown={(e) => e.key === "Escape" && setLightbox(false)}>
          <button type="button" className="icon-btn" aria-label="Close" autoFocus onClick={() => setLightbox(false)}>
            ✕
          </button>
          <img src={shown.url} alt={shown.alt || p.name} />
        </div>
      )}
    </StoreLayout>
  );
}
