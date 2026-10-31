import { flushSync } from "react-dom";

/*
 * The theme-switch "venom". The page is snapshotted in both themes (View Transitions API) and
 * the new theme is revealed through a living mask painted by public/venom-worklet.js: colonies
 * of particles bloom, tendrils crawl from the top-right corner to the bottom-left, then the mass
 * takes the whole page. Text is part of the page, so it changes colour as the venom passes.
 * Going light plays it in reverse: the dark colony retreats into the corner.
 * Browsers without paint worklets get a diagonal wipe; without view transitions, an instant swap.
 */

type VTDocument = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> } };

let worklet: Promise<boolean> | null = null;
let running = false;

function loadWorklet() {
  return (worklet ??= (async () => {
    const css = CSS as typeof CSS & { paintWorklet?: { addModule(url: string): Promise<void> }; registerProperty?: (def: object) => void };
    if (!css.paintWorklet || !css.registerProperty) return false;
    try {
      css.registerProperty({ name: "--venom-p", syntax: "<number>", inherits: false, initialValue: "0" });
      css.registerProperty({ name: "--venom-seed", syntax: "<integer>", inherits: true, initialValue: "7" });
    } catch {
      /* already registered (e.g. after hot reload) */
    }
    try {
      await css.paintWorklet.addModule("/venom-worklet.js");
      return true;
    } catch {
      return false;
    }
  })());
}

/** Warm the worklet up ahead of the first click so the first switch doesn't wait on a fetch. */
export function preloadVenom() {
  if (typeof CSS !== "undefined") void loadWorklet();
}

/**
 * Plays the venom while `apply` switches the theme. `apply` must update the DOM synchronously
 * (it runs inside flushSync so the new snapshot already has the new theme).
 */
export async function venomTransition(to: "light" | "dark", apply: () => void) {
  const doc = document as VTDocument;
  if (running || !doc.startViewTransition) {
    apply();
    return;
  }
  running = true;
  const painted = await loadWorklet();
  const root = document.documentElement;
  const goingDark = to === "dark";
  const cls = ["venom-active", goingDark ? "venom-in" : "venom-out", painted ? "venom-paint" : "venom-wipe"];
  root.style.setProperty("--venom-seed", String(1 + Math.floor(Math.random() * 100000)));
  root.classList.add(...cls);

  try {
    const vt = doc.startViewTransition(() => flushSync(apply));
    await vt.ready;
    const pseudoElement = goingDark ? "::view-transition-new(root)" : "::view-transition-old(root)";
    const timing: KeyframeAnimationOptions = { duration: 1600, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards", pseudoElement };
    if (painted) {
      root.animate({ "--venom-p": goingDark ? [0, 1] : [1, 0] } as PropertyIndexedKeyframes, timing);
    } else {
      // Diagonal wipe from the top-right corner.
      const hidden = "polygon(100% 0, 100% 0, 100% 0, 100% 0)";
      const shown = "polygon(100% 0, -100% 0, 100% 200%, 100% 200%)";
      root.animate({ clipPath: goingDark ? [hidden, shown] : [shown, hidden] }, { ...timing, duration: 900 });
    }
    await vt.finished;
  } catch {
    /* transition skipped or interrupted: the theme is applied either way */
  } finally {
    root.classList.remove(...cls);
    running = false;
  }
}
