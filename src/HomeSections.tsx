import { useContext, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HomeDataContext } from "./lib/homeData";
import { pageScrollBehavior } from "./lib/scroll";
import { useTheme } from "./lib/theme";
import "./styles/afterdrop.css";

/* Closing sections of the homepage, in the same midnight-neon world as the drop stage:
   Collections (bento arena), Why CrownCart (stacking cards), Our Story (scroll-lit manifesto). */

const NEON = ["#ff2e4d", "#ffae5c", "#8b5cff", "#00e5ff"];

/** Photos for the Why CrownCart promises. */
const PILLARS = [
  { title: "Curated discovery", text: "A focused catalog across fashion, footwear, timepieces and technology — chosen, not crowded.", image: "/products/pillar-curated.webp", tag: "No filler" },
  { title: "Transparent pricing", text: "Prices include GST. Shipping and any discounts are shown before you pay, never after.", image: "/products/pillar-pricing.webp", tag: "No surprises" },
  { title: "Secure checkout", text: "Payments are confirmed with the payment provider before an order is marked paid. We never store card details.", image: "/products/pillar-security.webp", tag: "No card storage" },
  { title: "Real service", text: "Track every order step by step, request returns online, and reach a person when you need one.", image: "/products/pillar-service.webp", tag: "No bots-only" },
];

/** Picks a photo for a shop category by its slug, cycling through the set otherwise. */
const COLLECTION_IMAGES = [
  { match: /watch|time|access/, src: "/products/collection-watch.webp" },
  { match: /sneaker|shoe|foot/, src: "/products/collection-sneakers.webp" },
  { match: /electr|gadget|tech|laptop/, src: "/products/collection-electronics.webp" },
  { match: /fashion|apparel|cloth|wear/, src: "/products/collection-fashion.webp" },
];
function collectionImage(slug: string, index: number) {
  return COLLECTION_IMAGES.find((c) => c.match.test(slug)) ?? COLLECTION_IMAGES[index % COLLECTION_IMAGES.length];
}

const STORY =
  "CrownCart began with a simple idea: shopping for exceptional things should feel exceptional too. We pair a small, carefully chosen catalog with a cinematic way of discovering it, and back it with the essentials that matter most: honest prices, secure payments and dependable delivery.";

/**
 * Runs `onFrame` in one rAF per scroll/resize while the element is on screen.
 * Callers should only write transform/opacity/attributes in it.
 */
function useScrollFrame(ref: RefObject<HTMLElement | null>, onFrame: (rect: DOMRect, vh: number) => void) {
  const { motion } = useTheme();
  const cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let visible = true;
    const frame = () => {
      raf = 0;
      cb.current(el.getBoundingClientRect(), window.innerHeight);
    };
    const kick = () => {
      if (visible && !raf) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(el);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });
    kick();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, [ref, motion]);
  return motion === "reduced";
}

/** Pointer-driven 3D tilt and spotlight for a card; writes CSS variables only. */
function tilt(e: ReactPointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
  el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
  el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
}
function untilt(e: ReactPointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

function Collections() {
  const home = useContext(HomeDataContext);
  const navigate = useNavigate();
  const categories = (home?.categories ?? []).filter((c) => c.count > 0);
  const words = [...categories.map((c) => c.name), "Beyond Ordinary"];
  const ref = useRef<HTMLElement>(null);
  const rowA = useRef<HTMLDivElement>(null);
  const rowB = useRef<HTMLDivElement>(null);

  // The two ticker rows slide against each other as the section scrolls past.
  const reduced = useScrollFrame(ref, (rect, vh) => {
    if (reduced) return;
    const t = (vh - rect.top) / (rect.height + vh);
    if (rowA.current) rowA.current.style.transform = `translate3d(${-10 - t * 30}%, 0, 0)`;
    if (rowB.current) rowB.current.style.transform = `translate3d(${-40 + t * 30}%, 0, 0)`;
  });

  const ticker = (outlined: boolean) =>
    Array.from({ length: 3 }, (_, r) =>
      words.map((w, i) => (
        <span key={`${r}-${i}`} className={outlined ? "ad-ticker__word ad-ticker__word--line" : "ad-ticker__word"}>
          {w}
          <i style={{ color: NEON[i % NEON.length] }}>✦</i>
        </span>
      )),
    );

  return (
    <section ref={ref} id="explore-more" className="ad ad-arena">
      <div className="ad-ticker" aria-hidden="true">
        <div ref={rowA} className="ad-ticker__row">
          {ticker(false)}
        </div>
        <div ref={rowB} className="ad-ticker__row ad-ticker__row--b">
          {ticker(true)}
        </div>
      </div>

      <div className="ad-wrap">
        <header className="ad-arena__head" data-scroll-reveal="item">
          <p className="ad-kicker">
            <i /> 02 — The Collections
          </p>
          <h2 className="ad-mega">
            Choose your <span className="ad-gradient">arena.</span>
          </h2>
          <p className="ad-lede">
            {home?.brand.supportingLine ?? "Discover a world of extraordinary choices."} Browse every collection, search by brand, and filter by what matters to you.
          </p>
        </header>

        {categories.length > 0 && (
          <div className="ad-bento">
            {categories.map((cat, i) => {
              const image = collectionImage(cat.slug, i);
              return (
                <div key={cat.slug} className="ad-bento__cell" data-scroll-reveal="item" style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}>
                  <Link to={`/shop/${cat.slug}`} className="ad-tile" style={{ "--glow": NEON[i % NEON.length] } as CSSProperties} onPointerMove={tilt} onPointerLeave={untilt}>
                    <span className="ad-tile__ring" aria-hidden="true" />
                    <span className="ad-tile__inner">
                      <img src={image.src} alt="" loading="lazy" decoding="async" />
                      <span className="ad-tile__shade" />
                      <span className="ad-tile__spot" />
                      <span className="ad-tile__index">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ad-tile__body">
                        <span className="ad-tile__name">{cat.name}</span>
                        <span className="ad-tile__count">
                          {cat.count} piece{cat.count === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="ad-tile__go" aria-hidden="true">
                        ↗
                      </span>
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="ad-arena__foot" data-scroll-reveal="item">
          <button type="button" className="ad-cta" onClick={() => navigate("/shop")}>
            <span className="ad-cta__label">Enter the shop</span>
            <span className="ad-cta__orb" aria-hidden="true">
              →
            </span>
          </button>
          <div className="ad-arena__links">
            <button type="button" className="ad-chip" onClick={() => window.dispatchEvent(new CustomEvent("crowncart-open-reviews"))}>
              ★ 3D client reviews
            </button>
            <button type="button" className="ad-chip" onClick={() => window.dispatchEvent(new CustomEvent("crowncart-open-directory"))}>
              ☰ All sections
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyCrownCart() {
  const ref = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  // Each card shrinks back and dims as the next one slides up over it.
  const reduced = useScrollFrame(ref, (_rect, vh) => {
    if (reduced) return;
    const els = cards.current;
    els.forEach((el, i) => {
      const next = els[i + 1];
      if (!el) return;
      let t = 0;
      if (next) {
        const top = next.parentElement!.getBoundingClientRect().top;
        const stick = el.parentElement!.getBoundingClientRect().top;
        t = Math.min(1, Math.max(0, 1 - (top - stick) / (vh * 0.8)));
      }
      el.style.transform = `scale(${1 - t * 0.08}) rotateX(${t * 6}deg)`;
      el.style.setProperty("--dim", String(t * 0.65));
    });
  });

  return (
    <section ref={ref} id="why-crowncart" className="ad ad-code">
      <div className="ad-wrap ad-code__grid">
        <header className="ad-code__head">
          <div className="ad-code__sticky" data-scroll-reveal="item">
            <p className="ad-kicker">
              <i /> 03 — Why CrownCart
            </p>
            <h2 className="ad-mega">
              The crown <span className="ad-gradient">code.</span>
            </h2>
            <p className="ad-lede">Four promises behind every order: the quiet details that make shopping here feel as considered as what you buy.</p>
            <div className="ad-code__seal" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="ad-seal-path" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
                </defs>
                <text>
                  <textPath href="#ad-seal-path" textLength="289">
                    CURATED ✦ SECURE ✦ HONEST ✦ HUMAN ✦
                  </textPath>
                </text>
              </svg>
              <span>♛</span>
            </div>
          </div>
        </header>

        <ol className="ad-stack">
          {PILLARS.map((p, i) => (
            <li key={p.title} className="ad-stack__slot" style={{ "--i": i, "--glow": NEON[i] } as CSSProperties}>
              <div
                className="ad-stack__card"
                ref={(el) => {
                  cards.current[i] = el;
                }}
              >
                <div className="ad-stack__copy">
                  <span className="ad-stack__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ad-stack__tag">{p.tag}</span>
                  <h3 className="ad-stack__title">{p.title}</h3>
                  <p className="ad-stack__text">{p.text}</p>
                </div>
                <div className="ad-stack__media">
                  <img src={p.image} alt="" loading="lazy" decoding="async" />
                </div>
                <span className="ad-stack__dim" aria-hidden="true" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function OurStory() {
  const home = useContext(HomeDataContext);
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const photoA = useRef<HTMLElement>(null);
  const photoB = useRef<HTMLElement>(null);
  const words = STORY.split(" ");
  const lit = useRef(-1);

  // Words light up one by one as the manifesto passes the middle of the screen; photos drift at different depths.
  const reduced = useScrollFrame(ref, (rect, vh) => {
    const text = textRef.current;
    if (text) {
      const tr = text.getBoundingClientRect();
      const t = reduced ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - tr.top) / (tr.height + vh * 0.35)));
      const n = Math.round(t * words.length);
      if (n !== lit.current) {
        const spans = text.children;
        const from = Math.max(0, Math.min(n, lit.current));
        const to = Math.max(n, lit.current);
        for (let i = from; i < to && i < spans.length; i++) spans[i].classList.toggle("is-lit", i < n);
        lit.current = n;
      }
    }
    if (reduced) return;
    const t = (vh - rect.top) / (rect.height + vh) - 0.5;
    if (photoA.current) photoA.current.style.transform = `translate3d(0, ${t * -120}px, 0) rotate(-4deg)`;
    if (photoB.current) photoB.current.style.transform = `translate3d(0, ${t * 160}px, 0) rotate(6deg)`;
  });

  return (
    <section ref={ref} id="our-story" className="ad ad-story">
      <div className="ad-wrap ad-story__grid">
        <div className="ad-story__gallery" aria-hidden="true">
          <figure ref={photoA} className="ad-story__photo ad-story__photo--a">
            <img src="/products/story-watch.webp" alt="" loading="lazy" decoding="async" />
          </figure>
          <figure ref={photoB} className="ad-story__photo ad-story__photo--b">
            <img src="/products/story-sneakers.webp" alt="" loading="lazy" decoding="async" />
          </figure>
          <div className="ad-story__seal">
            <span>Est.</span>
            <strong>MMXXVI</strong>
          </div>
        </div>

        <div className="ad-story__copy">
          <p className="ad-kicker">
            <i /> 04 — Our Story
          </p>
          <h2 className="ad-mega ad-story__tagline">{home?.brand.tagline ?? "Beyond Ordinary."}</h2>
          <p ref={textRef} className="ad-story__text">
            {words.map((w, i) => (
              <span key={i}>{w} </span>
            ))}
          </p>
          <p className="ad-story__sign">— The CrownCart Maison, established 2026</p>
          <div className="ad-story__actions">
            <Link to="/contact" className="ad-cta ad-cta--small">
              <span className="ad-cta__label">Contact us</span>
              <span className="ad-cta__orb" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="ad-foot">
        <div className="ad-foot__mark" aria-hidden="true">
          {"CROWNCART".split("").map((c, i) => (
            <span key={i} style={{ "--d": `${i * 40}ms` } as CSSProperties}>
              {c}
            </span>
          ))}
        </div>
        <div className="ad-foot__bar">
          <nav aria-label="Policies">
            {[
              ["/policies/shipping", "Shipping"],
              ["/policies/returns", "Returns"],
              ["/policies/privacy", "Privacy"],
              ["/policies/terms", "Terms"],
            ].map(([to, l]) => (
              <Link key={to} to={to}>
                {l}
              </Link>
            ))}
          </nav>
          <div>© {new Date().getFullYear()} CrownCart · All rights reserved</div>
          <button type="button" className="ad-chip" onClick={() => window.scrollTo({ top: 0, behavior: pageScrollBehavior() })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </section>
  );
}

export function ExploreMoreSection() {
  return (
    <div className="ad-world">
      <Collections />
      <WhyCrownCart />
      <OurStory />
    </div>
  );
}
