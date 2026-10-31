import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Location } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { setPageWave, washToNewPage } from "../lib/pageWave";

/*
 * Page changes: on every change of page (pathname) the old page is washed away from left to right
 * behind a beach-wave edge (src/lib/pageWave.ts), uncovering the new page.
 *
 * How: the routes render a *displayed* location held one step behind the real one. The browser
 * snapshots the old page, we switch the displayed location so the new page mounts under the
 * snapshot, wait for it to load, then wash. It covers links, buttons, redirects and back/forward
 * alike. Changes that stay on the same page (filters, sort, ?query, #hash) switch instantly;
 * reduced motion switches instantly.
 *
 * The branded intro screen still breaks away with the falling pieces in crackCopies below: ~15
 * pieces (fewer on phones); each piece is only as big as itself and only transform/opacity animate.
 */

/** How long each piece takes to fall; pieces start up to SPREAD_MS apart (centre first). */
const PIECE_MS = 760;
const SPREAD_MS = 280;
/** A short "crack" pause before the pieces drop, so the break reads. */
const CRACK_MS = 110;
const MAX_WAIT_MS = 1400;
const FALL = "cubic-bezier(0.45, 0, 0.85, 0.55)";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Waits until the new page has rendered past its loading spinner, or gives up after MAX_WAIT_MS.
 * Timers only: the browser doesn't run animation frames while it holds rendering for the swap.
 */
async function pageReady() {
  await sleep(32);
  const start = performance.now();
  while (document.querySelector("#root .center-load") && performance.now() - start < MAX_WAIT_MS) await sleep(60);
}

function scrollForNewPage(loc: Location) {
  const target = loc.hash ? document.getElementById(decodeURIComponent(loc.hash.slice(1))) : null;
  if (target) target.scrollIntoView({ block: "start" });
  else window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
}

/** Irregular four-sided pieces covering the screen: a grid whose inner corners are jittered, so neighbours share edges exactly. */
function crackPattern(W: number, H: number) {
  const cols = W > 1100 ? 5 : W > 640 ? 4 : 3;
  const rows = Math.min(5, Math.max(3, Math.round((cols * H) / W)));
  const cw = W / cols;
  const ch = H / rows;
  const pt: [number, number][][] = [];
  for (let r = 0; r <= rows; r++) {
    pt[r] = [];
    for (let c = 0; c <= cols; c++) {
      const jx = c === 0 || c === cols ? 0 : (Math.random() - 0.5) * cw * 0.66;
      const jy = r === 0 || r === rows ? 0 : (Math.random() - 0.5) * ch * 0.66;
      pt[r][c] = [c * cw + jx, r * ch + jy];
    }
  }
  const quads: [number, number][][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) quads.push([pt[r][c], pt[r][c + 1], pt[r + 1][c + 1], pt[r + 1][c]]);
  return quads;
}

/**
 * Cuts copies of `template` into irregular pieces laid exactly over the screen (each a
 * viewport-sized window onto one copy, scrolled to `scroll`) and returns them with the function
 * that drops them. Used for the branded intro screen.
 */
export function crackCopies(template: HTMLElement, bg: string, scroll: { x: number; y: number } = { x: 0, y: 0 }): { layer: HTMLElement; drop: () => Promise<void> } {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const layer = document.createElement("div");
  layer.className = "page-crack";
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;

  const pieces: { el: HTMLElement; cx: number; cy: number }[] = [];
  for (const quad of crackPattern(W, H)) {
    const xs = quad.map((p) => p[0]);
    const ys = quad.map((p) => p[1]);
    const minX = Math.floor(Math.min(...xs));
    const minY = Math.floor(Math.min(...ys));
    const w = Math.ceil(Math.max(...xs)) - minX;
    const h = Math.ceil(Math.max(...ys)) - minY;

    const piece = document.createElement("div");
    piece.className = "page-crack__piece";
    Object.assign(piece.style, {
      left: `${minX}px`,
      top: `${minY}px`,
      width: `${w}px`,
      height: `${h}px`,
      clipPath: `polygon(${quad.map(([x, y]) => `${(x - minX).toFixed(1)}px ${(y - minY).toFixed(1)}px`).join(", ")})`,
    });
    // A viewport-sized window onto the copy, scrolled to where the page was. Being a scroll
    // container keeps sticky headers stuck; its transform keeps fixed elements in place.
    const view = document.createElement("div");
    view.className = "page-crack__view";
    Object.assign(view.style, { left: `${-minX}px`, top: `${-minY}px`, width: `${W}px`, height: `${H}px`, background: bg });
    view.appendChild(template.cloneNode(true));
    piece.appendChild(view);
    layer.appendChild(piece);
    pieces.push({ el: piece, cx: minX + w / 2, cy: minY + h / 2 });
  }
  document.body.appendChild(layer);
  // Scroll each copy to where the page was (needs the layout, so after insertion).
  layer.querySelectorAll<HTMLElement>(".page-crack__view").forEach((v) => {
    v.scrollLeft = scroll.x;
    v.scrollTop = scroll.y;
  });

  const drop = async () => {
    // The crack: pieces shift a hair apart so the break lines show, then they fall.
    pieces.forEach(({ el, cx, cy }) => {
      const nx = (cx - W / 2) / W;
      const ny = (cy - H / 2) / H;
      el.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${(nx * 10).toFixed(1)}px, ${(ny * 10).toFixed(1)}px, 0) rotate(${((Math.random() - 0.5) * 1.6).toFixed(2)}deg)` }], {
        duration: CRACK_MS,
        easing: "ease-out",
        fill: "forwards",
      });
    });
    await sleep(CRACK_MS);
    const maxDist = Math.hypot(W / 2, H / 2);
    await Promise.all(
      pieces.map(({ el, cx, cy }) => {
        const dist = Math.hypot(cx - W / 2, cy - H / 2) / maxDist;
        const dx = (cx - W / 2) * (0.3 + Math.random() * 0.35) + (Math.random() - 0.5) * 90;
        const dy = (cy - H / 2) * (0.2 + Math.random() * 0.25) + H * (0.45 + Math.random() * 0.35);
        const spin = (Math.random() - 0.5) * 60;
        const from = el.getAnimations()[0];
        const start = from ? getComputedStyle(el).transform : "none";
        from?.cancel();
        return el.animate(
          [
            { transform: start === "none" ? "translate3d(0,0,0)" : start, opacity: 1 },
            { transform: `translate3d(${dx.toFixed(0)}px, ${dy.toFixed(0)}px, 0) rotate(${spin.toFixed(0)}deg) scale(0.6)`, opacity: 0 },
          ],
          { duration: PIECE_MS + Math.random() * 140, delay: dist * SPREAD_MS + Math.random() * 60, easing: FALL, fill: "forwards" },
        ).finished;
      }),
    );
  };
  return { layer, drop };
}

/** Returns the location to render; pass it to <Routes location>. */
export function usePageCurtain(location: Location): Location {
  const { motion } = useTheme();
  const [shown, setShown] = useState(location);
  const shownRef = useRef(location);
  const latest = useRef(location);
  const busy = useRef(false);
  const reducedRef = useRef(motion === "reduced");
  reducedRef.current = motion === "reduced";

  const show = (loc: Location) => {
    shownRef.current = loc;
    setShown(loc);
  };

  const run = async () => {
    busy.current = true;
    try {
      await washToNewPage(
        async () => {
          const next = latest.current;
          setPageWave(true);
          flushSync(() => show(next));
          await pageReady();
          scrollForNewPage(next);
        },
        () => setPageWave(false),
      );
    } catch {
      // A failed effect must never leave the old page on screen.
      show(latest.current);
    } finally {
      setPageWave(false);
      busy.current = false;
    }
    // Something navigated while we were busy: another page gets its own wash, same-page changes just apply.
    if (latest.current.pathname !== shownRef.current.pathname) void run();
    else if (latest.current.key !== shownRef.current.key) show(latest.current);
  };

  useEffect(() => {
    latest.current = location;
    if (busy.current) return;
    if (location.pathname === shownRef.current.pathname || reducedRef.current) {
      const pageChanged = location.pathname !== shownRef.current.pathname;
      show(location);
      if (pageChanged) requestAnimationFrame(() => scrollForNewPage(location));
      return;
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return shown;
}
