import { useState, useEffect, useContext, useRef, type CSSProperties } from "react";
import "./styles/drop.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { inr } from "./lib/format";
import { HomeDataContext, type HomeData, type LiveProduct } from "./lib/homeData";
import { ExploreMoreSection } from "./HomeSections";
import { pageScrollBehavior } from "./lib/scroll";
import { useTheme } from "./lib/theme";
import { flyToBag } from "./lib/flyToBag";


function ratingText(live: LiveProduct | undefined) {
  if (!live) return "";
  if (live.rating == null) return "No reviews yet";
  return `${live.rating} ★ (${live.reviewCount} review${live.reviewCount === 1 ? "" : "s"})`;
}

/** The showcase button: adds single-variant products to the bag, otherwise opens the product page to pick a size. */
function AcquireButton({ live, name, className }: { live?: LiveProduct; name: string; className?: string }) {
  const { addToCart } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const needsChoice = !live || live.variantCount > 1 || !live.inStock || !live.defaultVariantId;
  const label = !live ? "ACQUIRE NOW" : !live.inStock ? "VIEW DETAILS" : live.variantCount > 1 ? "SELECT SIZE" : added ? "ADDED TO CROWN BAG ✓" : "ACQUIRE NOW";
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      aria-busy={busy || undefined}
      onClick={async () => {
        if (!live) return;
        if (needsChoice) return navigate(`/product/${live.slug}`);
        setBusy(true);
        const ok = await addToCart(live.defaultVariantId!, 1, { productName: name, returnTo: `/#product-${live.slug}` });
        setBusy(false);
        if (ok) {
          flyToBag(document.querySelector(".drop-card.is-active .drop-card__img"));
          setAdded(true);
          setTimeout(() => setAdded(false), 2500);
        }
      }}
    >
      <span>{busy ? "ADDING…" : label}</span>
      <span className="ex-btn__arrow" aria-hidden="true">→</span>
    </button>
  );
}

export interface ProductItem {
  id: string;
  num: string;
  frameLabel: string;
  title1: string;
  title2: string;
  accent: string;
  category: string;
  price: string;
  priceSub?: string;
  badge: string;
  image: string;
  description: string;
  specs: { label: string; val: string }[];
  /** Transparent cutout used on the drop stage. */
  cutout: string;
  /** Neon accent the stage glows with while this piece is up front. */
  glow: string;
}

export const PRODUCTS: ProductItem[] = [
  {
    id: "shoe",
    cutout: "/cutouts/air-jordan-1-retro-high-og-patent.webp",
    glow: "#ff2e4d",
    num: "01",
    frameLabel: "FRAME 01 // AIR JORDAN 1 RETRO HIGH SPECIMEN",
    title1: "AIR JORDAN 1",
    title2: '"PATENT"',
    accent: "HIGH OG",
    category: "Heritage Basketball & Luxury Sneaker Culture",
    price: "₹16,995",
    badge: "ICONIC GRAIL",
    image: "/products/jordan_bg_hd.png",
    description:
      "A high-voltage tribute to hardwood royalty. Cloaked in high-gloss Patent University Red leather with pristine white full-grain paneling, encapsulated Air-Sole cushioning, and an exclusive Metallic Silver Wings emblem debossed on the collar.",
    specs: [
      { label: "Silhouette", val: "High-Top Retro OG Profile" },
      { label: "Upper", val: "Patent University Red & White Leather" },
      { label: "Cushioning", val: "Encapsulated Nike Air-Sole" },
      { label: "Insignia", val: "Metallic Silver Wings Medallion" },
    ],
  },
  {
    id: "watch",
    cutout: "/cutouts/patek-philippe-nautilus-5980-1r-rose-gold.webp",
    glow: "#ffae5c",
    num: "02",
    frameLabel: "FRAME 02 // PATEK PHILIPPE GENÈVE",
    title1: "NAUTILUS",
    title2: '"ROSE GOLD"',
    accent: "5980/1R",
    category: "Haute Horlogerie & Self-Winding Flyback Chronograph",
    price: "₹1,85,00,000",
    priceSub: "MARKET VALUATION: ₹1.85 CR",
    badge: "HAUTE HORLOGERIE",
    image: "/products/nautilus_bg_hd.png",
    description:
      "The quintessential pinnacle of sporting elegance. Forged from solid 18-karat rose gold featuring the legendary octagonal bezel, horizontally embossed black-brown gradient dial, sapphire crystal exhibition caseback, and manufacture Calibre CH 28-520 C.",
    specs: [
      { label: "Calibre", val: "CH 28-520 C Self-Winding Flyback" },
      { label: "Case & Bracelet", val: "40.5mm Solid 18K Rose Gold" },
      { label: "Dial", val: "Horizontally Embossed Black-Brown" },
      { label: "Water Resistance", val: "120m / 400ft Certified" },
    ],
  },
  {
    id: "bomber",
    cutout: "/cutouts/armani-exchange-signature-bomber.webp",
    glow: "#8b5cff",
    num: "03",
    frameLabel: "FRAME 03 // ARMANI EXCHANGE MILANO",
    title1: "ARMANI EX.",
    title2: "“SIGNATURE”",
    accent: "BOMBER",
    category: "Milanese Designer Outerwear & Street Tailoring",
    price: "₹24,999",
    badge: "NEW ARRIVAL",
    image: "/products/ax_bomber_bg_hd.png",
    description:
      "Sleek Italian street architecture redefined. Tailored from premium high-density technical stretch nylon with a satin luster finish, contrasting white A|X chest branding, ribbed aerodynamic collar and cuffs, and custom gunmetal dual-way zipper hardware.",
    specs: [
      { label: "Composition", val: "Technical Stretch High-Density Nylon" },
      { label: "Hardware", val: "Matte Black Dual-Way Front Zip" },
      { label: "Fit", val: "Ergonomic Modern Bomber Silhouette" },
      { label: "Branding", val: "Screened A|X Contrast Chest Monogram" },
    ],
  },
  {
    id: "laptop",
    cutout: "/cutouts/asus-tuf-gaming-a15-mecha.webp",
    glow: "#00e5ff",
    num: "04",
    frameLabel: "FRAME 04 // ASUS TUF GAMING MECHA",
    title1: "ASUS TUF",
    title2: "“MECHA”",
    accent: "A15 PRO",
    category: "High-Performance Military-Grade Gaming Workstation",
    price: "₹89,990",
    badge: "TOP RATED",
    image: "/products/asus_tuf_bg_hd.png",
    description:
      "Battlefield-tested endurance meets next-generation computing firepower. Powered by AMD Ryzen™ 7 7735HS and NVIDIA® GeForce RTX™ 4060 graphics, featuring a blisteringly fast 144Hz Adaptive-Sync display, MIL-STD-810H durability, and RGB desktop keyboard.",
    specs: [
      { label: "Processor", val: "AMD Ryzen™ 7 7735HS (8C/16T, 4.75GHz)" },
      { label: "Graphics", val: "NVIDIA® GeForce RTX™ 4060 8GB GDDR6" },
      { label: "Display", val: "15.6\" 144Hz FHD IPS Adaptive-Sync" },
      { label: "Durability", val: "MIL-STD-810H Military Standard" },
    ],
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Eases each step so a product settles and holds before the next one swings in. */
const settle = (p: number) => {
  const i = Math.floor(p);
  const f = p - i;
  return i + f * f * f * (f * (f * 6 - 15) + 10);
};

/* The drop stage: a pinned, dark 3D stage. Scrolling swings each piece through a
   coverflow in depth. Everything per-frame is transform/opacity written straight to
   the DOM from one rAF loop that only runs while the stage is on screen and moving. */
export function ProductDrop() {
  const home = useContext(HomeDataContext);
  const { motion } = useTheme();
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const typeRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const last = PRODUCTS.length - 1;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduced = motion === "reduced";
    let raf = 0;
    let visible = false;
    let shown = 0;
    let current = -1;
    const pointer = { x: 0, y: 0, cx: 0, cy: 0 };

    const frame = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const raw = span > 0 ? clamp(-rect.top / span, 0, 1) : 0;
      const target = settle(raw * last * 0.9999);
      shown = reduced || current < 0 ? target : shown + (target - shown) * 0.14;
      pointer.cx += (pointer.x - pointer.cx) * 0.08;
      pointer.cy += (pointer.y - pointer.cy) * 0.08;

      const wide = window.innerWidth > 820;
      const step = Math.min(window.innerWidth * (wide ? 0.3 : 0.62), 460);
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const d = i - shown;
        const a = Math.abs(d);
        if (a > 2.2) {
          card.style.visibility = "hidden";
          return;
        }
        card.style.visibility = "visible";
        const z = -a * 380 + (a < 1 ? (1 - a) * 80 : 0);
        const ry = clamp(-d * 48, -70, 70);
        card.style.transform = `translate3d(${d * step}px, ${a * 26}px, ${z}px) rotateY(${ry}deg)`;
        card.style.opacity = String(clamp(1.15 - a * 0.55, 0, 1));
        card.style.zIndex = String(100 - Math.round(a * 10));
      });
      glowRefs.current.forEach((g, i) => {
        if (g) g.style.opacity = String(clamp(1 - Math.abs(i - shown), 0, 1));
      });
      if (sceneRef.current) sceneRef.current.style.transform = `rotateX(${4 - pointer.cy * 7}deg) rotateY(${pointer.cx * 9}deg)`;
      if (typeRef.current) typeRef.current.style.transform = `translate3d(${-shown * 100}vw, 0, 0)`;
      if (floorRef.current) floorRef.current.style.transform = `rotateX(76deg) translate3d(0, ${(shown * 240) % 80}px, 0)`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${last ? shown / last : 1})`;

      const idx = Math.round(shown);
      if (idx !== current) {
        current = idx;
        setActive(idx);
      }
      const moving = Math.abs(target - shown) > 0.0005 || Math.abs(pointer.x - pointer.cx) > 0.001 || Math.abs(pointer.y - pointer.cy) > 0.001;
      if (visible && moving) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (visible && !raf) raf = requestAnimationFrame(frame);
    };
    const onPointer = (e: PointerEvent) => {
      if (reduced || e.pointerType !== "mouse") return;
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
      kick();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(track);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    visible = true;
    kick();
    return () => {
      visible = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [motion, last]);

  const jump = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const span = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: track.offsetTop + (span * i) / last + 2, behavior: pageScrollBehavior() });
  };

  const product = PRODUCTS[active];
  const live = home?.showcase[active];
  const subtitle = product.title2.replace(/[“”"]/g, "");
  const openReviews = () => window.dispatchEvent(new CustomEvent("crowncart-open-reviews"));

  return (
    <section ref={trackRef} className="drop" aria-label="The CrownCart drop" style={{ "--drop-count": PRODUCTS.length, "--drop-glow": product.glow } as CSSProperties}>
      {/* Scroll targets so /#product-… links land on the right piece. */}
      {PRODUCTS.map((p, i) => (
        <span key={p.id} id={`product-${p.id}`} className="drop-anchor" style={{ top: `${(i / PRODUCTS.length) * 100}%` }} />
      ))}

      <div className="drop-stage">
        {PRODUCTS.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              glowRefs.current[i] = el;
            }}
            className="drop-aura"
            style={{ "--glow": p.glow, opacity: i === 0 ? 1 : 0 } as CSSProperties}
            aria-hidden="true"
          />
        ))}
        <div className="drop-floor-wrap" aria-hidden="true">
          <div ref={floorRef} className="drop-floor" />
        </div>
        <div className="drop-type" aria-hidden="true">
          <div ref={typeRef} className="drop-type__strip">
            {PRODUCTS.map((p) => (
              <span key={p.id}>{p.title1}</span>
            ))}
          </div>
        </div>

        <header className="drop-head">
          <span className="drop-head__tag">
            <i /> LIVE DROP
          </span>
          <span className="drop-head__title">THE CROWN ROSTER</span>
          <span className="drop-head__count">
            {String(active + 1).padStart(2, "0")}
            <em>/{String(PRODUCTS.length).padStart(2, "0")}</em>
          </span>
        </header>

        <div className="drop-viewport">
          <div ref={sceneRef} className="drop-scene">
            {PRODUCTS.map((p, i) => (
              <article
                key={p.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`drop-card${i === active ? " is-active" : ""}`}
                style={{ "--glow": p.glow } as CSSProperties}
                onClick={() => i !== active && jump(i)}
              >
                <div className="drop-card__face">
                  <span className="drop-card__num">{p.num}</span>
                  <span className="drop-card__badge">{p.badge}</span>
                  <div className="drop-card__halo" />
                  <img className="drop-card__img" src={p.cutout} alt={`${p.title1} ${p.title2.replace(/[“”"]/g, "")}`} loading={i < 2 ? "eager" : "lazy"} decoding="async" draggable={false} />
                  <div className="drop-card__shine" />
                  <span className="drop-card__label">{p.frameLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="drop-info" key={product.id}>
          <p className="drop-info__kicker">{product.category}</p>
          <h2 className="drop-info__title">
            {product.title1} <span>{subtitle}</span>
          </h2>
          <div className="drop-info__price">
            <strong>{live ? inr(live.pricePaise) : product.price}</strong>
            {live?.compareAtPaise && <s>{inr(live.compareAtPaise)}</s>}
            {live && !live.inStock && <b>SOLD OUT</b>}
            {live && (
              <button type="button" className="drop-info__rating" onClick={openReviews} title="View customer reviews">
                {ratingText(live)}
              </button>
            )}
          </div>
          <ul className="drop-info__specs">
            {product.specs.slice(0, 3).map((s) => (
              <li key={s.label}>
                <span>{s.label}</span>
                {s.val}
              </li>
            ))}
          </ul>
          <div className="drop-info__actions">
            <AcquireButton className="drop-btn drop-btn--hot" live={live} name={`${product.title1} ${subtitle}`} />
            {live && (
              <Link className="drop-btn" to={`/product/${live.slug}`}>
                <span>DETAILS</span>
                <span className="ex-btn__arrow" aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
        </div>

        <nav className="drop-dots" aria-label="Jump to a product">
          {PRODUCTS.map((p, i) => (
            <button key={p.id} type="button" className={i === active ? "is-active" : ""} onClick={() => jump(i)} aria-current={i === active || undefined} title={p.title1}>
              {p.num}
            </button>
          ))}
          <div className="drop-dots__bar">
            <div ref={barRef} />
          </div>
        </nav>
      </div>
    </section>
  );
}

/* Master showcase: the drop stage followed by the closing sections. */
export function StackedProductsShowcase() {
  const [home, setHome] = useState<HomeData | null>(null);
  useEffect(() => {
    fetch("/api/catalog/home")
      .then((r) => (r.ok ? r.json() : null))
      .then(setHome)
      .catch(() => {});
  }, []);
  return (
    <HomeDataContext.Provider value={home}>
      <div style={{ width: "100%", overflow: "visible", position: "relative" }}>
        <ProductDrop />
        <ExploreMoreSection />
      </div>
    </HomeDataContext.Provider>
  );
}

