import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { inr } from "./lib/format";
import { HomeDataContext, type HomeData, type LiveProduct } from "./lib/homeData";
import { ExploreMoreSection } from "./HomeSections";


function ratingText(live: LiveProduct | undefined) {
  if (!live) return "";
  if (live.rating == null) return "No reviews yet";
  return `${live.rating} ★ (${live.reviewCount} review${live.reviewCount === 1 ? "" : "s"})`;
}

/** The showcase button: adds single-variant products to the bag, otherwise opens the product page to pick a size. */
function AcquireButton({ live, name, style, hover }: { live?: LiveProduct; name: string; style: React.CSSProperties; hover: [React.CSSProperties, React.CSSProperties] }) {
  const { addToCart } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const needsChoice = !live || live.variantCount > 1 || !live.inStock || !live.defaultVariantId;
  const label = !live ? "ACQUIRE NOW" : !live.inStock ? "VIEW DETAILS" : live.variantCount > 1 ? "SELECT SIZE" : added ? "ADDED TO CROWN BAG ✓" : "ACQUIRE NOW";
  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy || undefined}
      onClick={async () => {
        if (!live) return;
        if (needsChoice) return navigate(`/product/${live.slug}`);
        setBusy(true);
        const ok = await addToCart(live.defaultVariantId!, 1, { productName: name, returnTo: `/#product-${live.slug}` });
        setBusy(false);
        if (ok) {
          setAdded(true);
          setTimeout(() => setAdded(false), 2500);
        }
      }}
      style={style}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover[0])}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, hover[1])}
    >
      <span>{busy ? "ADDING…" : label}</span>
      <span style={{ fontSize: "14px" }}>→</span>
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
}

export const PRODUCTS: ProductItem[] = [
  {
    id: "shoe",
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

/* Floating Right-Edge Specimen Telemetry Rail */
export function SpecimenScrollRail() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById("hero");
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight - 100 : 500;
      const explore = document.getElementById("explore-more");
      const exploreTop = explore ? explore.offsetTop - 40 : 99999;
      const curY = window.scrollY;

      setVisible(curY > heroBottom && curY < exploreTop);

      // Calculate progress through product sections
      const secElements = PRODUCTS.map((p) => document.getElementById(`product-${p.id}`));
      let current = 0;
      secElements.forEach((el, idx) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.55 && rect.bottom >= window.innerHeight * 0.2) {
            current = idx;
          }
        }
      });
      setActiveIdx(current);

      setVisible(curY > heroBottom && curY < exploreTop);

      const first = secElements[0];
      const last = secElements[secElements.length - 1];
      if (first && last) {
        const start = first.offsetTop;
        const totalHeight = last.offsetTop - start + last.offsetHeight;
        const p = Math.max(0, Math.min(1, (curY - start) / totalHeight));
        setProgress(p);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Specimen directory"
      style={{
        position: "fixed",
        right: "26px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 99,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        padding: "16px 8px",
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "28px",
        border: "1px solid rgba(255, 255, 255, 0.35)",
        boxShadow: "0 14px 38px rgba(0, 0, 0, 0.25)",
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        style={{
          fontSize: "8.5px",
          fontWeight: 700,
          letterSpacing: "1.2px",
          color: "rgba(0, 0, 0, 0.75)",
          textTransform: "uppercase",
        }}
      >
        SPECIMENS
      </div>

      {/* Progress track */}
      <div
        style={{
          width: "2px",
          height: "64px",
          background: "rgba(0, 0, 0, 0.15)",
          position: "relative",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${progress * 100}%`,
            background: "#000000",
            transition: "height 0.15s ease-out",
          }}
        />
      </div>

      {PRODUCTS.map((prod, idx) => {
        const isActive = activeIdx === idx;
        return (
          <button
            type="button"
            key={prod.id}
            onClick={() => {
              const el = document.getElementById(`product-${prod.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              cursor: "pointer",
              border: "none",
              background: isActive ? "#000000" : "transparent",
              color: isActive ? "#ffffff" : "rgba(0, 0, 0, 0.4)",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10.5px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: isActive ? 700 : 500,
              boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.4)" : "none",
              transition: "all 0.2s ease",
            }}
            title={prod.title1}
          >
            {prod.num}
          </button>
        );
      })}
    </aside>
  );
}

/* Luxury Hero Product Section (Real Photographic Backdrop + Full Native React/HTML UI) */
interface LuxuryProductSectionProps {
  product: ProductItem;
  index: number;
}

export function LuxuryProductShowcaseSection({ product, index }: LuxuryProductSectionProps) {
  const home = useContext(HomeDataContext);
  const live = home?.showcase[index];

  const openReviews = () => {
    window.dispatchEvent(new CustomEvent("crowncart-open-reviews"));
  };

  const isShoe = product.id === "shoe";
  const isWatch = product.id === "watch";
  const isBomber = product.id === "bomber";
  const isLaptop = product.id === "laptop";

  // Calibrated high-clarity background scaling and position matching target reference compositions
  let bgStyle: React.CSSProperties = {
    backgroundImage: `url("${product.image}")`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
  };
  let badgePosition = { top: "20%", left: "70%" };

  if (isShoe) {
    bgStyle = {
      backgroundImage: `url("${product.image}")`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(0.98) contrast(1.05) saturate(1.05)",
    };
    badgePosition = { top: "23%", left: "69%" };
  } else if (isWatch) {
    bgStyle = {
      backgroundImage: `url("${product.image}")`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(0.98) contrast(1.08) saturate(1.08)",
    };
    badgePosition = { top: "21%", left: "70%" };
  } else if (isBomber) {
    bgStyle = {
      backgroundImage: `url("${product.image}")`,
      backgroundSize: "cover",
      backgroundPosition: "right 2% center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(0.98) contrast(1.06) saturate(1.08)",
    };
    badgePosition = { top: "18%", left: "72%" };
  } else if (isLaptop) {
    bgStyle = {
      backgroundImage: `url("${product.image}")`,
      backgroundSize: "cover",
      backgroundPosition: "right 2% center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(0.98) contrast(1.1) saturate(1.12)",
    };
    badgePosition = { top: "14%", left: "72%" };
  }

  let gradientBackground = `
    linear-gradient(90deg, 
      #070709 0%, 
      #070709 18%, 
      rgba(7, 7, 9, 0.94) 28%, 
      rgba(7, 7, 9, 0.78) 40%, 
      rgba(7, 7, 9, 0.25) 52%, 
      transparent 64%
    ),
    linear-gradient(180deg, 
      rgba(7, 7, 9, 0.45) 0%, 
      transparent 16%, 
      transparent 84%, 
      rgba(7, 7, 9, 0.65) 100%
    )
  `;

  if (isShoe) {
    gradientBackground = `
      linear-gradient(90deg, 
        rgba(7, 7, 9, 0.6) 0%, 
        rgba(7, 7, 9, 0.45) 25%, 
        rgba(7, 7, 9, 0.15) 40%, 
        transparent 52%
      ),
      linear-gradient(180deg, 
        rgba(7, 7, 9, 0.3) 0%, 
        transparent 15%, 
        transparent 85%, 
        rgba(7, 7, 9, 0.45) 100%
      )
    `;
  } else if (isWatch) {
    gradientBackground = `
      linear-gradient(90deg, 
        #070709 0%, 
        #070709 18%, 
        rgba(7, 7, 9, 0.95) 28%, 
        rgba(7, 7, 9, 0.8) 40%, 
        rgba(7, 7, 9, 0.28) 52%, 
        transparent 65%
      ),
      linear-gradient(180deg, 
        rgba(7, 7, 9, 0.4) 0%, 
        transparent 16%, 
        transparent 84%, 
        rgba(7, 7, 9, 0.6) 100%
      )
    `;
  }

  return (
    <section
      id={`product-${product.id}`}
      style={{
        position: "relative",
        width: "100vw",
        minHeight: "100vh",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#070709",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "0 clamp(24px, 4vw, 60px)",
      }}
    >
      {/* Real High-Resolution Photographic Backdrop with Precise Positioning & Grading */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          ...bgStyle,
          zIndex: 1,
        }}
      />

      {/* Cinematic Multi-Stop Dark Gradient Fade & Vignette Overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: gradientBackground,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Floating Pill Badge over Product (ICONIC GRAIL / HAUTE HORLOGERIE) */}
      <div
        style={{
          position: "absolute",
          top: badgePosition.top,
          left: badgePosition.left,
          transform: "translateX(-50%)",
          zIndex: 4,
          padding: "5px 14px",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "6px",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          userSelect: "none",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
        }}
      >
        {product.badge}
      </div>

      {/* Main Left Content Container */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "clamp(20px, 3.2vw, 40px)",
          maxWidth: "100%",
          paddingTop: "20px",
        }}
      >
        {/* Giant Subtle Background Watermark Numeral ("01" / "02") */}
        <div
          aria-hidden="true"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(120px, 14vw, 195px)",
            fontWeight: 800,
            color: "rgba(255, 255, 255, 0.12)",
            lineHeight: 0.85,
            letterSpacing: "-6px",
            userSelect: "none",
            pointerEvents: "none",
            flexShrink: 0,
          }}
        >
          {product.num}
        </div>

        {/* Specifications & Info Column with Vertical Divider */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            maxWidth: "480px",
          }}
        >
          {/* Top Numeral "0 1" / "0 2" above the vertical line */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              letterSpacing: "4px",
              color: "rgba(255, 255, 255, 0.85)",
              marginBottom: "8px",
              paddingLeft: "2px",
            }}
          >
            {product.num.split("").join(" ")}
          </div>

          {/* Bordered Block */}
          <div
            style={{
              borderLeft: "1px solid rgba(255, 255, 255, 0.35)",
              paddingLeft: "26px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Title Block */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(26px, 3.2vw, 40px)",
                  letterSpacing: "-1.5px",
                  lineHeight: "1.02em",
                  margin: 0,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                {product.title1}
              </h2>

              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(26px, 3.2vw, 40px)",
                  letterSpacing: "-1.5px",
                  lineHeight: "1.02em",
                  margin: 0,
                  color: "#ffffff",
                }}
              >
                {product.title2}
              </h2>

              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(26px, 3.2vw, 40px)",
                  letterSpacing: "-1.5px",
                  lineHeight: "1.02em",
                  margin: 0,
                }}
              >
                <span
                  style={{
                    WebkitTextStroke: "1.5px rgba(255, 255, 255, 0.65)",
                    color: "transparent",
                  }}
                >
                  {product.accent}
                </span>
              </h2>
            </div>

            {/* Category / Sub-heading */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: "13.5px",
                letterSpacing: "0.2px",
                margin: "10px 0 14px 0",
                color: "rgba(255, 255, 255, 0.75)",
              }}
            >
              {product.category}
            </p>

            {/* Price & Rating */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono', monospace, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#ffffff",
                  padding: "4px 12px",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(6px)",
                  letterSpacing: "0.5px",
                }}
              >
                {live ? inr(live.pricePaise) : product.price}
              </div>

              {live?.compareAtPaise && (
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", textDecoration: "line-through" }}>{inr(live.compareAtPaise)}</span>
              )}

              {product.priceSub && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: "rgba(255, 255, 255, 0.65)",
                    padding: "4px 8px",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  {product.priceSub}
                </span>
              )}

              <span
                onClick={openReviews}
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                title="View customer reviews"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openReviews()}
              >
                {ratingText(live)}
              </span>
              {live && !live.inStock && (
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "#ffb4ab", textTransform: "uppercase" }}>Out of stock</span>
              )}
            </div>

            {/* Description Paragraph */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12.5px",
                lineHeight: "1.65em",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "18px",
                maxWidth: "440px",
              }}
            >
              {product.description}
            </p>

            {/* Specs Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 20px",
                padding: "10px 0",
                borderTop: "1px solid rgba(255, 255, 255, 0.18)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
                marginBottom: "20px",
                maxWidth: "440px",
              }}
            >
              {product.specs.map((s, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      fontSize: "9.5px",
                      textTransform: "uppercase",
                      letterSpacing: "1.2px",
                      color: "rgba(255, 255, 255, 0.45)",
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: "rgba(255, 255, 255, 0.95)",
                      marginTop: "2px",
                    }}
                  >
                    {s.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button: ACQUIRE NOW */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <AcquireButton
                live={live}
                name={`${product.title1} ${product.title2}`.replace(/[“”"]/g, "")}
                style={{
                  cursor: "pointer",
                  padding: "9px 20px",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.55)",
                  borderRadius: "6px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                }}
                hover={[
                  { backgroundColor: "#161616", borderColor: "#ffffff" },
                  { backgroundColor: "#000000", borderColor: "rgba(255, 255, 255, 0.55)" },
                ]}
              />
              {live && (
                <Link to={`/product/${live.slug}`} style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", textDecoration: "underline", textUnderlineOffset: "4px" }}>
                  Details
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Master stacked showcase: products, closing sections and the telemetry rail */
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
        <SpecimenScrollRail />
        {PRODUCTS.map((product, idx) => (
          <LuxuryProductShowcaseSection key={product.id} product={product} index={idx} />
        ))}
        <ExploreMoreSection />
      </div>
    </HomeDataContext.Provider>
  );
}
