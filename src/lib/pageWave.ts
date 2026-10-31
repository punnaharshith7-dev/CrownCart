import { useSyncExternalStore } from "react";

/*
 * Page-change wash: the old page itself is carried off from left to right behind a rolling,
 * beach-wave edge, and the new page is there underneath it.
 *
 * Uses a view transition: the browser snapshots the old page, the new page renders live below it,
 * and only the snapshot's clip-path and transform animate, so nothing on the page is copied.
 * Browsers without view transitions switch instantly.
 *
 * While the wash runs, entrance effects on the new page wait: BounceHeading and the reveals use
 * usePageWave/afterPageWave, and the html class pauses CSS keyframe animations (see styles.css).
 */

const WASH_MS = 1350;
/** How far through the wash the new page's effects start; the left side is clear by then. */
const RELEASE_AT = 0.7;
const FRAMES = 60;
const ROWS = 56;

type VTDocument = Document & { startViewTransition?: (update: () => Promise<void>) => { ready: Promise<void>; finished: Promise<void> } };

let active = false;
const listeners = new Set<() => void>();
const waiting: (() => void)[] = [];

export function setPageWave(on: boolean) {
  if (on === active) return;
  active = on;
  document.documentElement.classList.toggle("cc-page-wave", on);
  listeners.forEach((l) => l());
  if (!on) waiting.splice(0).forEach((fn) => fn());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

/** True while the wash is covering the page. */
export const usePageWave = () => useSyncExternalStore(subscribe, () => active);

/** Runs `fn` now, or as soon as the wash has cleared. */
export function afterPageWave(fn: () => void) {
  if (active) waiting.push(fn);
  else fn();
}

/** The old page's keyframes: its left edge rolls across as overlapping swells while the page is pushed along. */
function washFrames(W: number, H: number): Keyframe[] {
  const A = Math.min(110, Math.max(36, W * 0.06));
  const M = A * 1.75;
  const frames: Keyframe[] = [];
  for (let f = 0; f <= FRAMES; f++) {
    const p = f / FRAMES;
    const eased = p * p * (3 - 2 * p);
    const push = eased * W * 0.08;
    const bob = Math.sin(p * Math.PI * 2) * 5;
    const s = (p * WASH_MS) / 1000;
    const swell = 0.7 + Math.sin(p * Math.PI) * 0.5;
    const base = -M + (W + M * 2) * eased - push;
    const points: string[] = [];
    for (let r = 0; r <= ROWS; r++) {
      const y = -20 + (r / ROWS) * (H + 40);
      const v = (y / H) * Math.PI * 2;
      const x = base + (Math.sin(v * 1.3 + s * 2.2 + 0.6) + Math.sin(v * 3.1 - s * 3.4 + 1.2) * 0.45 + Math.sin(v * 7.3 + s * 5.2 + 1.8) * 0.16) * A * swell;
      points.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
    }
    points.push(`${W * 2}px ${H + 20}px`, `${W * 2}px -20px`);
    frames.push({ clipPath: `polygon(${points.join(", ")})`, transform: `translate3d(${push.toFixed(1)}px, ${bob.toFixed(1)}px, 0)` });
  }
  return frames;
}

/**
 * Washes the old page away. `swap` must render the new page and resolve once it's ready to be
 * seen (it can't rely on requestAnimationFrame: the browser holds rendering until it resolves);
 * `release` is called as the wash clears.
 */
export async function washToNewPage(swap: () => Promise<void>, release: () => void) {
  const doc = document as VTDocument;
  if (!doc.startViewTransition) {
    await swap();
    release();
    return;
  }
  const root = document.documentElement;
  root.classList.add("cc-page-wash");
  let timer = 0;
  try {
    const vt = doc.startViewTransition(swap);
    await vt.ready;
    root.animate(washFrames(window.innerWidth, window.innerHeight), { duration: WASH_MS, easing: "linear", fill: "forwards", pseudoElement: "::view-transition-old(root)" });
    // The new page starts in the old one's shadow and brightens as it's uncovered.
    root.animate({ filter: ["brightness(0.78)", "brightness(1)"] }, { duration: WASH_MS, easing: "ease-out", fill: "forwards", pseudoElement: "::view-transition-new(root)" });
    timer = window.setTimeout(release, WASH_MS * RELEASE_AT);
    await vt.finished;
  } finally {
    window.clearTimeout(timer);
    root.classList.remove("cc-page-wash");
  }
}
