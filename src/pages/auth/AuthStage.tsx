import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../../lib/useApi";
import { emitStage, phaseFor, stageBus } from "./stageBus";
import "./auth-stage.css";

const FallingProducts = lazy(() => import("./FallingProducts"));

const CLOSE_DELAY_MS = 380;

/** idle: follows the cursor · shy: hands over eyes (typing a password) · peek: one eye peeking (password shown) · squint: wrong password · happy: signed in */
export type Mood = "idle" | "shy" | "peek" | "squint" | "happy";

interface StageApi {
  /** Wrong credentials: card shakes, eyes squint, products jump. */
  fail: () => void;
  /** Signed in: happy eyes, products burst, confetti. Resolves when it's time to navigate. */
  celebrate: () => Promise<void>;
}
// The page component renders <AuthStage> itself, so its forms can't read a
// context from it; the mounted stage registers here instead.
let mounted: StageApi | null = null;
const stageHandle: StageApi = {
  fail: () => mounted?.fail(),
  celebrate: () => mounted?.celebrate() ?? Promise.resolve(),
};
export const useStage = () => stageHandle;

/** Hover-capable mouse/trackpad. Touch screens never get the close-to-eyes behaviour. */
function useFinePointer() {
  const [fine, setFine] = useState(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const on = () => setFine(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return fine;
}


/**
 * A pair of eyes that follow the cursor (or stare at `lookAt`), blink now and
 * then, and glance around on their own when the cursor sits still.
 */
function Eyes({ variant, mood, active, lookAt }: { variant: "big" | "peek"; mood: Mood; active: boolean; lookAt?: React.MutableRefObject<HTMLElement | null> }) {
  const root = useRef<HTMLSpanElement>(null);
  const eyes = useRef<(HTMLSpanElement | null)[]>([]);
  const [blink, setBlink] = useState(false);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    if (!active) return;
    const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.75 };
    const cur = [
      { x: 0, y: 0, s: 1 },
      { x: 0, y: 0, s: 1 },
    ];
    const tilt = { x: 0, y: 0 };
    let lastMove = performance.now();
    let wanderAt = 0;
    const move = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      lastMove = performance.now();
    };
    window.addEventListener("pointermove", move, { passive: true });

    let raf = 0;
    const tick = (now: number) => {
      let tx0 = target.x;
      let ty0 = target.y;
      const field = moodRef.current === "peek" ? lookAt?.current : null;
      if (field) {
        // Sneaking a look at the password you just revealed.
        const r = field.getBoundingClientRect();
        tx0 = r.left + r.width * 0.3;
        ty0 = r.top + r.height / 2;
      } else if (now - lastMove > 4500 && now > wanderAt) {
        // Nobody's moving: look around the room.
        target.x = window.innerWidth * (0.15 + Math.random() * 0.7);
        target.y = window.innerHeight * (0.15 + Math.random() * 0.7);
        wanderAt = now + 900 + Math.random() * 1400;
      }
      const box = root.current?.getBoundingClientRect();
      if (box && variant === "big") {
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        tilt.x += (((ty0 - cy) / window.innerHeight) * -16 - tilt.x) * 0.12;
        tilt.y += (((tx0 - cx) / window.innerWidth) * 22 - tilt.y) * 0.12;
        root.current!.style.setProperty("--tilt-x", `${tilt.x.toFixed(2)}deg`);
        root.current!.style.setProperty("--tilt-y", `${tilt.y.toFixed(2)}deg`);
      }
      eyes.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = tx0 - (r.left + r.width / 2);
        const dy = ty0 - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        const reach = r.width * 0.27;
        const k = Math.min(1, dist / (r.width * 2.2));
        const tx = dist ? (dx / dist) * reach * k : 0;
        const ty = dist ? (dy / dist) * reach * k * 0.85 : 0;
        // Pupils widen as the cursor comes close.
        const ts = 1 + 0.38 * (1 - Math.min(1, dist / 420));
        const c = cur[i];
        c.x += (tx - c.x) * 0.2;
        c.y += (ty - c.y) * 0.2;
        c.s += (ts - c.s) * 0.12;
        el.style.setProperty("--look-x", `${c.x.toFixed(2)}px`);
        el.style.setProperty("--look-y", `${c.y.toFixed(2)}px`);
        el.style.setProperty("--pupil", c.s.toFixed(3));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let blinkTimer = 0;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(
        () => {
          if (moodRef.current === "idle") {
            setBlink(true);
            window.setTimeout(() => setBlink(false), 150);
            // Sometimes a quick double blink.
            if (Math.random() < 0.25) window.setTimeout(() => (setBlink(true), window.setTimeout(() => setBlink(false), 130)), 320);
          }
          scheduleBlink();
        },
        2200 + Math.random() * 3600,
      );
    };
    scheduleBlink();
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
    };
  }, [active, variant, lookAt]);

  return (
    <span ref={root} className={`cc-eyes-pair cc-eyes-${variant}`} data-mood={mood} data-blink={blink || undefined}>
      {[0, 1].map((i) => (
        <span key={i} className="cc-eye-slot">
          {variant === "peek" && <span className="cc-brow" />}
          <span
            className="cc-eye"
            ref={(el) => {
              eyes.current[i] = el;
            }}
          >
            <span className="cc-iris">
              <span className="cc-pupil" />
              <span className="cc-glint" />
            </span>
            <span className="cc-lid cc-lid-top" />
            <span className="cc-lid cc-lid-bottom" />
          </span>
        </span>
      ))}
    </span>
  );
}

/** Gold confetti fired from the card on a successful sign-in. */
function Confetti({ from }: { from: DOMRect | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = window.innerWidth * dpr;
    el.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const cx = from ? from.left + from.width / 2 : window.innerWidth / 2;
    const cy = from ? from.top + from.height * 0.35 : window.innerHeight / 2;
    const colors = ["#e8c07d", "#fbf3df", "#c9973f", "#ffffff", "#f5d9a0"];
    const parts = Array.from({ length: 190 }, () => {
      const a = Math.random() * Math.PI * 2;
      const s = 6 + Math.random() * 13;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 7,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        w: 5 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        c: colors[(Math.random() * colors.length) | 0],
      };
    });
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const age = (t - start) / 1000;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - 1.1) / 0.6);
      for (const p of parts) {
        p.vy += 0.42;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.scale(1, Math.cos(p.r * 3));
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (age < 1.8) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from]);
  return <canvas ref={canvas} className="cc-confetti" aria-hidden="true" />;
}

/** A handful of twinkling stars for the night sky. */
function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 62}%`,
        size: Math.random() < 0.85 ? 1.5 : 2.5,
        delay: `${(Math.random() * 4).toFixed(2)}s`,
        dur: `${(2.5 + Math.random() * 3).toFixed(2)}s`,
      })),
    [],
  );
  return (
    <div className="cc-stars" aria-hidden="true">
      {stars.map((s, i) => (
        <span key={i} style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur }} />
      ))}
    </div>
  );
}

/**
 * Full-screen sign-in stage: products raining down in 3D behind a frosted
 * glass card, with a little creature peeking over the top. Move the cursor
 * off the card and it shuts like an eyelid; big eyes take its place and
 * follow the cursor until you come back.
 */
export function AuthStage({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  useTitle(title, { noindex: true });
  const fine = useFinePointer();
  const card = useRef<HTMLDivElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const passwordField = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);
  const [fieldMood, setFieldMood] = useState<Mood>("idle");
  const [flash, setFlash] = useState<Mood | null>(null);
  const [confetti, setConfetti] = useState<DOMRect | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [mine, setMine] = useState(0);
  const phase = useMemo(() => phaseFor(), []);
  const closeTimer = useRef(0);
  const flashTimer = useRef(0);
  const pointerInside = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const leavingRef = useRef(false);
  const mood: Mood = flash ?? fieldMood;

  // The stage is exactly one screen tall: no page scrollbar.
  useEffect(() => {
    const html = document.documentElement;
    const prev = [html.style.overflow, document.body.style.overflow];
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev[0];
      document.body.style.overflow = prev[1];
    };
  }, []);

  useEffect(() => {
    const on = (e: Event) => setMine(Number((e as CustomEvent).detail) || 0);
    stageBus.addEventListener("interests", on);
    return () => stageBus.removeEventListener("interests", on);
  }, []);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      if (pointerInside.current || leavingRef.current) return;
      // Remember the field they were in, so coming back puts the caret right where it was.
      const a = document.activeElement as HTMLElement | null;
      lastFocus.current = a && card.current?.contains(a) ? a : null;
      lastFocus.current?.blur();
      setOpen(false);
    }, CLOSE_DELAY_MS);
  }, []);
  useEffect(() => () => (cancelClose(), window.clearTimeout(flashTimer.current)), []);
  useEffect(() => {
    if (!fine) setOpen(true);
  }, [fine]);

  const wake = useCallback(() => {
    cancelClose();
    setOpen(true);
    const f = lastFocus.current;
    lastFocus.current = null;
    if (f) requestAnimationFrame(() => f.focus({ preventScroll: true }));
  }, []);

  /** Hands over the eyes while a password is hidden, a sneaky peek when it's shown. */
  const readFieldMood = useCallback(() => {
    requestAnimationFrame(() => {
      const a = document.activeElement as HTMLElement | null;
      const input = a?.closest(".input-wrap")?.querySelector("input");
      if (input && card.current?.contains(input) && /password/.test(input.autocomplete)) {
        passwordField.current = input;
        setFieldMood(input.type === "password" ? "shy" : "peek");
      } else {
        setFieldMood("idle");
      }
    });
  }, []);

  const api = useMemo<StageApi>(
    () => ({
      fail() {
        window.clearTimeout(flashTimer.current);
        setFlash("squint");
        flashTimer.current = window.setTimeout(() => setFlash(null), 1700);
        const el = lid.current;
        if (el) {
          el.classList.remove("is-shaking");
          void el.offsetWidth; // restart the animation
          el.classList.add("is-shaking");
        }
        emitStage("quake");
      },
      celebrate() {
        window.clearTimeout(flashTimer.current);
        leavingRef.current = true;
        setFlash("happy");
        setOpen(true);
        emitStage("burst");
        setConfetti(card.current?.getBoundingClientRect() ?? null);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return new Promise<void>((resolve) => {
          window.setTimeout(() => setLeaving(true), reduced ? 0 : 700);
          window.setTimeout(resolve, reduced ? 150 : 1200);
        });
      },
    }),
    [],
  );
  useEffect(() => {
    mounted = api;
    return () => {
      if (mounted === api) mounted = null;
    };
  }, [api]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--rx", `${((0.5 - py) * 5).toFixed(2)}deg`);
    e.currentTarget.style.setProperty("--ry", `${((px - 0.5) * 6).toFixed(2)}deg`);
  };

  return (
    <>
      <div className="cc-auth-stage" data-open={open || undefined} data-phase={phase} data-leaving={leaving || undefined}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {phase === "night" && <Stars />}
        <div className="cc-auth-glow" aria-hidden="true" />
        <Suspense fallback={null}>
          <FallingProducts />
        </Suspense>
        <div className="cc-auth-vignette" aria-hidden="true" />

        <Link to="/" className="wordmark cc-auth-wordmark">
          CrownCart
        </Link>
        <p className="cc-auth-tagline" aria-hidden="true">
          Beyond Ordinary.
        </p>
        {mine > 0 && (
          <p className="cc-auth-mine" aria-hidden="true">
            ✦ Raining your recent picks
          </p>
        )}

        <main id="main" className="cc-auth-center">
          <div ref={lid} className="cc-auth-lid" onAnimationEnd={(e) => e.target === e.currentTarget && e.currentTarget.classList.remove("is-shaking")}>
            <span className="cc-peeker" aria-hidden="true">
              <Eyes variant="peek" mood={mood} active={open} lookAt={passwordField} />
            </span>
            <div
              ref={card}
              className="cc-auth-card"
              inert={!open || undefined}
              aria-hidden={!open || undefined}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                pointerInside.current = true;
                cancelClose();
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== "mouse") return;
                pointerInside.current = false;
                e.currentTarget.style.setProperty("--rx", "0deg");
                e.currentTarget.style.setProperty("--ry", "0deg");
                if (fine) scheduleClose();
              }}
              onFocus={readFieldMood}
              onBlur={() => {
                readFieldMood();
                if (fine && !pointerInside.current) scheduleClose();
              }}
              onClick={readFieldMood}
              onPointerMove={onMove}
            >
              <div className="cc-auth-card-inner stack">
                <div>
                  <h1 className="cc-auth-title">{title}</h1>
                  {subtitle && <p className="cc-auth-sub">{subtitle}</p>}
                </div>
                {children}
              </div>
            </div>
            <span className="cc-paws" data-mood={mood} aria-hidden="true">
              <span className="cc-paw cc-paw-l" />
              <span className="cc-paw cc-paw-r" />
            </span>
          </div>
          {fine && (
            <button
              type="button"
              className="cc-eyes"
              aria-hidden={open}
              tabIndex={open ? -1 : 0}
              aria-label="Open sign in"
              onPointerEnter={wake}
              onClick={wake}
              onFocus={wake}
            >
              <Eyes variant="big" mood="idle" active={!open} />
              <span className="cc-eyes-hint">Come back, we're watching your bag</span>
            </button>
          )}
        </main>
        {confetti && <Confetti from={confetti} />}
      </div>
    </>
  );
}
