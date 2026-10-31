import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import gsap from "gsap";
import { inr } from "../lib/format";
import { useTheme } from "../lib/theme";
import { useApi, useTitle } from "../lib/useApi";

/*
 * Brand showcase: the "Soda" hero adapted to a CrownCart house. Two of the brand's pieces sit in the
 * flavour carousel; choosing one morphs the background to colours sampled from that piece's photo,
 * spins the centre piece 720° (swapping at the peak) and implodes/explodes the floating orbs.
 */

interface Item {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  tagline?: string | null;
  image: string | null;
  pricePaise: number;
}

/** Transparent product cutouts generated ahead of time (public/cutouts/index.json). */
type CutoutIndex = Record<string, { src: string; ok: boolean }>;
let cutoutIndex: Promise<CutoutIndex> | null = null;
const loadCutouts = () =>
  (cutoutIndex ??= fetch("/cutouts/index.json", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<CutoutIndex>) : {}))
    .catch(() => ({})));

interface Palette {
  inner: string;
  mid: string;
  outer: string;
  accent: string;
  onAccent: string;
}

/** Headlines and copy for the five houses on the Collections ring; other brands fall back to their name. */
const HOUSE_COPY: Record<string, { main: [string, string]; side: [string, string]; line: string }> = {
  "patek-philippe": { main: ["Patek", "Philippe"], side: ["Timelessly", "Yours"], line: "Geneva's grandest complications, kept for the next generation." },
  "louis-vuitton": { main: ["Louis", "Vuitton"], side: ["Endlessly", "Travelled"], line: "Parisian trunk-making heritage, carried into every journey." },
  rolex: { main: ["Pure", "Rolex"], side: ["Perpetually", "Precise"], line: "The crown of watchmaking, built to outlast every adventure." },
  dior: { main: ["Pure", "Dior"], side: ["Effortlessly", "Couture"], line: "Avenue Montaigne elegance, tailored for today." },
  apple: { main: ["Think", "Apple"], side: ["Beautifully", "Simple"], line: "Precision engineering that disappears into the way you live." },
};

const FALLBACK_PALETTES: Palette[] = [
  { inner: "#0b8a78", mid: "#044e3b", outer: "#011411", accent: "#fbcfe8", onAccent: "#011d17" },
  { inner: "#0b4f8a", mid: "#04294e", outer: "#010c14", accent: "#fbcfe8", onAccent: "#011d17" },
];

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;

/** Samples a photo and returns a gradient palette built from its most saturated colour. */
function samplePalette(src: string): Promise<Palette | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0, weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i] / 255, G = data[i + 1] / 255, B = data[i + 2] / 255;
          const max = Math.max(R, G, B), min = Math.min(R, G, B);
          const l = (max + min) / 2;
          const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
          // Favour vivid mid-tones; near-white studio backdrops and black shadows barely count.
          // Transparent pixels (the removed background of a cutout) carry no weight.
          const w = (s * s * (l > 0.08 && l < 0.92 ? 1 : 0.05) + 0.002) * (data[i + 3] / 255);
          r += R * w; g += G * w; b += B * w; weight += w;
        }
        r /= weight; g /= weight; b /= weight;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d > 0) {
          if (max === r) h = ((g - b) / d) % 6;
          else if (max === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h *= 60;
          if (h < 0) h += 360;
        }
        const l = (max + min) / 2;
        const sat = d === 0 ? 0 : (d / (1 - Math.abs(2 * l - 1))) * 100;
        const s = Math.min(85, Math.max(sat, 18));
        resolve({ inner: hsl(h, s, 30), mid: hsl(h, s, 15), outer: hsl(h, s * 0.8, 5), accent: hsl(h, Math.min(90, s + 20), 86), onAccent: hsl(h, s, 9) });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const BUBBLE_INTERVAL = 400;
const ORB_FG = ["b1", "b2", "b3", "b4", "b5", "b6"];
const ORB_BG = ["b7", "b8", "b9"];

export default function BrandShowcase() {
  const { brand: brandSlug = "" } = useParams();
  const { data } = useApi<{ items: Item[] }>(`/catalog/products?brand=${encodeURIComponent(brandSlug)}&sort=popular&pageSize=2`);
  const items = (data?.items ?? []).filter((p) => p.image).slice(0, 2);
  const [cutouts, setCutouts] = useState<CutoutIndex | null>(null);
  useEffect(() => {
    loadCutouts().then(setCutouts);
  }, []);
  /** The product itself, background removed, when a clean cutout exists. */
  // Cutouts that failed to load fall back to the product photo instead of showing a broken image.
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const cutoutOf = (p: Item) => (cutouts?.[p.slug]?.ok && !failed.has(p.slug) ? cutouts[p.slug].src : null);
  const onImageError = (p: Item) => () => {
    if (cutoutOf(p)) setFailed((prev) => new Set(prev).add(p.slug));
  };
  const brandName = items[0]?.brand ?? brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const copy = HOUSE_COPY[brandSlug] ?? {
    main: [brandName.split(" ")[0], brandName.split(" ").slice(1).join(" ") || "House"] as [string, string],
    side: ["Beyond", "Ordinary"] as [string, string],
    line: `The finest of ${brandName}, chosen by CrownCart.`,
  };
  useTitle(`${brandName} · Collections`, { description: `${brandName} at CrownCart. ${copy.line}` });

  const { motion } = useTheme();
  const reduced = motion === "reduced";
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0); // the piece in the centre; swaps at the peak of the spin
  const [palettes, setPalettes] = useState<Palette[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const switching = useRef(false);
  const spin = useRef({ val: 0, blur: 0 });

  // Sample a palette from each piece's photo once the pieces are known.
  const itemKey = items.map((p) => p.slug).join(",");
  useEffect(() => {
    let alive = true;
    setActive(0);
    setShown(0);
    if (!cutouts) return;
    const paletteFor = async (p: Item) => {
      const cut = cutoutOf(p);
      return (cut ? await samplePalette(cut) : null) ?? samplePalette(p.image!);
    };
    Promise.all(items.map(paletteFor)).then((found) => {
      if (alive) setPalettes(found.map((pal, i) => pal ?? FALLBACK_PALETTES[i % FALLBACK_PALETTES.length]));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey, cutouts]);

  // Apply the first palette as soon as it is known.
  useEffect(() => {
    const root = rootRef.current;
    const p = palettes[0];
    if (!root || !p) return;
    gsap.set(root, { "--bg-inner": p.inner, "--bg-mid": p.mid, "--bg-outer": p.outer, "--accent": p.accent, "--on-accent": p.onAccent });
  }, [palettes]);

  // Pointer tracking, parallax, orb repulsion and float: one rAF loop, as in the original script.
  useEffect(() => {
    if (!items.length) return;
    const orbs = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(".bs-orb") ?? []);
    const sparkles = Array.from(sparklesRef.current?.querySelectorAll<HTMLElement>(".bs-spark") ?? []);
    orbs.forEach((b) => {
      b.dataset.rx = "0";
      b.dataset.ry = "0";
      b.dataset.angle = String(Math.random() * 360);
      b.dataset.baseX = "0";
      b.dataset.baseY = "0";
    });

    const mouse = { x: 0, y: 0, px: -9999, py: -9999 };
    const current = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      mouse.px = e.clientX;
      mouse.py = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let frame = 0;
    const animate = () => {
      const time = Date.now() * 0.001;
      current.x += (mouse.x - current.x) * 0.05;
      current.y += (mouse.y - current.y) * 0.05;

      // Tilt the centre piece toward the cursor, plus the switch spin
      if (productRef.current) {
        productRef.current.style.transform = `translate(-50%, -50%) rotate(12deg) perspective(1400px) rotateY(${current.x * 40 + spin.current.val}deg) rotateX(${-current.y * 20}deg)`;
        productRef.current.style.filter = spin.current.blur > 0.05 ? `blur(${spin.current.blur}px)` : "";
      }

      if (fgRef.current) fgRef.current.style.transform = `translate(${current.x * 60}px, ${current.y * 60}px)`;
      if (bgRef.current) bgRef.current.style.transform = `translate(${current.x * -30}px, ${current.y * -30}px)`;
      if (sparklesRef.current) sparklesRef.current.style.transform = `translate(${current.x * -15}px, ${current.y * -15}px)`;

      if (!switching.current) {
        orbs.forEach((orb, i) => {
          const rect = orb.getBoundingClientRect();
          const diffX = mouse.px - (rect.left + rect.width / 2);
          const diffY = mouse.py - (rect.top + rect.height / 2);
          const distance = Math.sqrt(diffX * diffX + diffY * diffY) || 1;
          let targetRx = 0, targetRy = 0, speedMult = 1;
          if (distance < 400) {
            const force = (400 - distance) / 400;
            targetRx = (diffX / distance) * force * -80;
            targetRy = (diffY / distance) * force * -80;
            speedMult = 1 + force * 5;
          }
          let rx = parseFloat(orb.dataset.rx!) || 0;
          let ry = parseFloat(orb.dataset.ry!) || 0;
          let angle = parseFloat(orb.dataset.angle!) || 0;
          const baseX = parseFloat(orb.dataset.baseX!) || 0;
          const baseY = parseFloat(orb.dataset.baseY!) || 0;
          rx += (targetRx - rx) * 0.1;
          ry += (targetRy - ry) * 0.1;
          angle += 0.2 * speedMult;
          orb.dataset.rx = String(rx);
          orb.dataset.ry = String(ry);
          orb.dataset.angle = String(angle);
          const dur = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10][i % 9];
          const phase = (time + i * 0.7) * ((Math.PI * 2) / dur);
          const floatY = Math.sin(phase) * 15;
          const floatAngle = Math.cos(phase) * 6;
          orb.style.transform = `translate(${rx + baseX}px, ${ry + baseY + floatY}px) rotate(${angle + floatAngle}deg)`;
        });
      }

      sparkles.forEach((s, i) => {
        const dur = 10 + i * 2;
        const phase = (time + i * 1.2) * ((Math.PI * 2) / dur);
        s.style.transform = `translate(${Math.cos(phase * 0.5) * 15}px, ${Math.sin(phase) * 20}px) rotate(${Math.sin(phase * 0.3) * 15}deg)`;
      });

      frame = requestAnimationFrame(animate);
    };
    if (!reduced) frame = requestAnimationFrame(animate);
    else if (productRef.current) productRef.current.style.transform = "translate(-50%, -50%) rotate(12deg)";

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [itemKey, reduced, items.length]);

  // Rising bubbles, one every 400ms.
  useEffect(() => {
    if (reduced) return;
    const container = bubblesRef.current;
    if (!container) return;
    const timer = window.setInterval(() => {
      const bubble = document.createElement("span");
      bubble.className = "bs-bubble";
      const size = Math.random() * 20 + 10;
      const duration = Math.random() * 6 + 4;
      bubble.style.width = bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.opacity = String(Math.random() * 0.4 + 0.2);
      bubble.style.animation = `bsFloatUp ${duration}s linear forwards`;
      container.appendChild(bubble);
      window.setTimeout(() => bubble.remove(), duration * 1000);
    }, BUBBLE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [reduced]);

  const switchTo = (index: number) => {
    if (switching.current || index === active || !items[index]) return;
    setActive(index);
    const root = rootRef.current!;
    const palette = palettes[index] ?? FALLBACK_PALETTES[index % 2];

    if (reduced) {
      gsap.set(root, { "--bg-inner": palette.inner, "--bg-mid": palette.mid, "--bg-outer": palette.outer, "--accent": palette.accent, "--on-accent": palette.onAccent });
      setShown(index);
      return;
    }
    switching.current = true;

    // 1. Background morph
    gsap.to(root, { "--bg-inner": palette.inner, "--bg-mid": palette.mid, "--bg-outer": palette.outer, "--accent": palette.accent, "--on-accent": palette.onAccent, duration: 1.5, ease: "power2.inOut" });

    // 2. Spin to 360° with blur, swap the piece at the peak, settle on 720°
    gsap.to(spin.current, {
      val: 360,
      blur: 15,
      duration: 0.6,
      ease: "power2.in",
      onComplete: () => {
        setShown(index);
        gsap.to(spin.current, {
          val: 720,
          blur: 0,
          duration: 1.5,
          ease: "back.out(0.7)",
          onComplete: () => {
            spin.current.val = 0;
            spin.current.blur = 0;
          },
        });
      },
    });

    // 3. Orbs implode to the centre, change shape, then explode out to new positions
    const orbs = Array.from(root.querySelectorAll<HTMLElement>(".bs-orb"));
    const center = centerRef.current;
    // Implode toward the centre piece (its stage centre), not just the window centre.
    const stage = (productRef.current ?? center)?.getBoundingClientRect();
    const targetX = stage ? stage.left + stage.width / 2 : window.innerWidth / 2;
    const targetY = stage ? stage.top + stage.height / 2 : window.innerHeight / 2;
    let done = 0;
    orbs.forEach((orb) => {
      const parent = orb.offsetParent as HTMLElement | null;
      const parentRect = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
      const centerX = targetX - parentRect.left - orb.offsetLeft - orb.offsetWidth / 2;
      const centerY = targetY - parentRect.top - orb.offsetTop - orb.offsetHeight / 2;
      const startAngle = parseFloat(orb.dataset.angle ?? "0") || 0;
      const baseX = parseFloat(orb.dataset.baseX ?? "0") || 0;
      const baseY = parseFloat(orb.dataset.baseY ?? "0") || 0;
      const nextX = (Math.random() - 0.5) * 200;
      const nextY = (Math.random() - 0.5) * 200;
      gsap.set(orb, { rotation: startAngle, x: baseX, y: baseY });
      gsap
        .timeline()
        .to(orb, {
          x: centerX,
          y: centerY,
          rotation: startAngle + 45,
          scale: 0.1,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            orb.classList.toggle("is-gem", index % 2 === 1);
            if (center) center.style.zIndex = "50";
          },
        })
        .to(orb, { duration: 0.3 })
        .to(orb, {
          onStart: () => {
            if (center) center.style.zIndex = "1";
          },
          x: nextX,
          y: nextY,
          rotation: startAngle + 90,
          scale: 1,
          opacity: Number(orb.dataset.opacity ?? 1),
          duration: 0.9,
          ease: "back.out(1.5)",
          onComplete: () => {
            orb.dataset.angle = String(startAngle + 90);
            orb.dataset.baseX = String(nextX);
            orb.dataset.baseY = String(nextY);
            orb.dataset.rx = "0";
            orb.dataset.ry = "0";
            gsap.set(orb, { clearProps: "transform,scale,x,y,rotation" });
            if (++done === orbs.length) switching.current = false;
          },
        });
    });
  };

  const piece = items[shown];
  const activeItem = items[active];

  return (
    <div ref={rootRef} className={`bs${reduced ? " bs--still" : ""}`} style={{ "--bg-inner": "#0b8a78", "--bg-mid": "#044e3b", "--bg-outer": "#011411" } as CSSProperties}>
      <div ref={bubblesRef} className="bs-bubbles" aria-hidden="true" />

      <header className="bs-header">
        <Link to="/" className="bs-logo" aria-label="CrownCart home">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M7 15.5h10M7.5 15.5 6.5 9l3.2 2.6L12 7.5l2.3 4.1L17.5 9l-1 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span>CrownCart</span>
        </Link>
        <nav className="bs-nav" aria-label="Main">
          <NavLink to="/" end className="bs-nav__item">
            Home
          </NavLink>
          <NavLink to="/shop" className="bs-nav__item">
            Shop
          </NavLink>
          <NavLink to="/collections" className="bs-nav__item">
            Collections
          </NavLink>
          <NavLink to="/explore" className="bs-nav__item">
            Explore
          </NavLink>
          <NavLink to="/contact" className="bs-nav__item">
            Contact
          </NavLink>
        </nav>
        <Link to="/contact" className="bs-contact">
          Contact Us
        </Link>
      </header>

      <main className="bs-hero">
        <div className="bs-content">
          <div ref={sparklesRef} className="bs-sparkles" aria-hidden="true">
            {["s1", "s2", "s3", "s4"].map((s) => (
              <span key={s} className={`bs-spark ${s}`}>
                ✦
              </span>
            ))}
          </div>

          <div className="bs-left">
            <h1 className="bs-title">
              <span className="bs-outline">{copy.main[0]}</span>
              <br />
              {copy.main[1]}
            </h1>
            <p className="bs-desc">
              {copy.line}
              <br />
              {activeItem?.tagline ?? activeItem?.name ?? ""}
              <br />
              Only at CrownCart.
            </p>
            <div className="bs-cta">
              <Link to={activeItem ? `/product/${activeItem.slug}` : "/shop"} className="bs-primary">
                Shop Now
                <span className="bs-plus" aria-hidden="true">
                  +
                </span>
              </Link>
            </div>
            <div className="bs-award">
              <div className="bs-award__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15L15 18L19 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="bs-award__text">
                <span className="bs-award__title">CROWNCART CERTIFIED</span>
                <span className="bs-award__subtitle">AUTHENTIC · EST. 2026</span>
              </div>
            </div>
          </div>

          <div ref={bgRef} className="bs-orbs bs-orbs--bg" aria-hidden="true">
            {ORB_BG.map((c) => (
              <span key={c} className={`bs-orb ${c}`} data-opacity={c === "b8" ? 0.6 : 0.7} />
            ))}
          </div>

          <div ref={centerRef} className="bs-center">
            {piece && (
              <div ref={productRef} className={`bs-product${cutoutOf(piece) ? " bs-product--cutout" : " bs-product--photo"}`}>
                <img src={cutoutOf(piece) ?? piece.image!} alt={piece.name} decoding="async" onError={onImageError(piece)} />
              </div>
            )}
          </div>

          <div ref={fgRef} className="bs-orbs bs-orbs--fg" aria-hidden="true">
            {ORB_FG.map((c) => (
              <span key={c} className={`bs-orb ${c}`} data-opacity={1} />
            ))}
          </div>

          <div className="bs-right">
            <div className="bs-carousel">
              <div className="bs-cards" role="tablist" aria-label={`${brandName} pieces`}>
                {items.map((p, i) => (
                  <button
                    key={p.slug}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    className={`bs-card${i === active ? " is-active" : ""}`}
                    onClick={() => switchTo(i)}
                  >
                    <img
                      src={cutoutOf(p) ?? p.image!}
                      alt=""
                      className={cutoutOf(p) ? "is-cutout" : undefined}
                      onError={onImageError(p)}
                      style={i === active ? undefined : { filter: "brightness(0.7)" }}
                    />
                    <span className="bs-card__info">
                      <span>{p.name}</span>
                      <span>{inr(p.pricePaise)}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="bs-arrows">
                <button type="button" className="bs-arrow" aria-label="Previous piece" onClick={() => switchTo((active + items.length - 1) % items.length)}>
                  ←
                </button>
                <button type="button" className="bs-arrow" aria-label="Next piece" onClick={() => switchTo((active + 1) % items.length)}>
                  →
                </button>
              </div>
            </div>
            <h2 className="bs-title bs-side">
              <span className="bs-outline">{copy.side[0]}</span>
              <br />
              {copy.side[1]}
            </h2>
          </div>
        </div>
      </main>
    </div>
  );
}
