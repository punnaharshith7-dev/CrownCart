import { useEffect } from "react";
import { crackCopies } from "./PageCurtain";

/*
 * Finishes the branded intro (#cc-intro in index.html). Once the badge has assembled and the
 * page underneath has rendered past its loading spinner, the intro screen cracks into falling
 * pieces and drops away, revealing the page. Renders nothing.
 */

declare global {
  interface Window {
    __ccIntroStart?: number;
  }
}

/** The badge's assemble animation is ~1.55 s; hold a beat after it. */
const MIN_SHOW_MS = 1900;
/** Never keep visitors waiting longer than this for the page. */
const MAX_WAIT_MS = 6000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

async function appReady() {
  const start = performance.now();
  const root = document.getElementById("root");
  while (performance.now() - start < MAX_WAIT_MS) {
    if (root && root.childElementCount > 0 && !root.querySelector(".center-load")) break;
    await sleep(80);
  }
  await frame();
  await frame();
}

export function IntroReveal() {
  useEffect(() => {
    const intro = document.getElementById("cc-intro");
    if (!intro) return;
    let cancelled = false;
    (async () => {
      const shown = performance.now() - (window.__ccIntroStart ?? 0);
      await Promise.all([sleep(Math.max(0, MIN_SHOW_MS - shown)), appReady()]);
      if (cancelled || !intro.isConnected) return;

      // A still copy of the finished screen (no id, animations off) is what cracks.
      const copy = intro.cloneNode(true) as HTMLElement;
      copy.removeAttribute("id");
      copy.classList.add("cc-intro--still");
      copy.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;background:#c94449;overflow:hidden";
      let crack: ReturnType<typeof crackCopies> | null = null;
      try {
        crack = crackCopies(copy, "#c94449");
        intro.remove();
        await crack.drop();
      } catch {
        intro.remove();
      } finally {
        crack?.layer.remove();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
