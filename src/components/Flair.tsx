import { useEffect, useRef } from "react";
import { useTheme } from "../lib/theme";
import { afterPageWave } from "../lib/pageWave";

/*
 * Site-wide finishing touches, mounted once:
 *  - Custom cursor (desktop mouse only): a dot plus a trailing ring that grows over links and
 *    buttons and becomes a red "View" disc over product images. Text fields keep the normal caret.
 *  - Magnetic buttons: main call-to-action buttons lean toward the cursor while it's over them and
 *    spring back on leave. Uses the CSS `translate` property, so existing hover transforms still work.
 *  - Image reveals: product photos uncover with a soft wipe-and-settle the first time they scroll
 *    into view. Uses clip-path, opacity and the `scale` property, never `transform`.
 * Everything is off for reduced motion; cursor and magnets are off on touch devices.
 */

const INTERACTIVE = 'a, button, [role="button"], label, select, summary, [data-cursor="link"]';
const VIEW = '[data-cursor="view"], .product-card .media, .gallery-main, .drop-card, .ad-tile, .rx-row, .rx-card__print, .rx-spot__print, .assistant-card';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), textarea, [contenteditable="true"]';
const MAGNETIC = "[data-magnetic], .drop-btn, .ad-cta, .rx-btn, .btn-lg";
const REVEAL = ".product-card .media img:not(.media__alt), .gallery-main img, .ad-stack__media img, .ad-story__photo img, .thumbs img";

export function Flair() {
  const { motion } = useTheme();
  const reduced = motion === "reduced";
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // ── Cursor + magnetic buttons ──
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!fine || reduced || !cursor || !ring || !dot) return;
    document.documentElement.classList.add("cc-cursor-on");

    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let raf = 0;
    let magnet: HTMLElement | null = null;
    const pull = { x: 0, y: 0, tx: 0, ty: 0 };

    const tick = () => {
      raf = 0;
      ringPos.x += (pos.x - ringPos.x) * 0.2;
      ringPos.y += (pos.y - ringPos.y) * 0.2;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      if (magnet) {
        pull.x += (pull.tx - pull.x) * 0.25;
        pull.y += (pull.ty - pull.y) * 0.25;
        magnet.style.translate = `${pull.x.toFixed(2)}px ${pull.y.toFixed(2)}px`;
      }
      const moving = Math.abs(pos.x - ringPos.x) > 0.2 || Math.abs(pos.y - ringPos.y) > 0.2 || (magnet && (Math.abs(pull.tx - pull.x) > 0.05 || Math.abs(pull.ty - pull.y) > 0.05));
      if (moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const releaseMagnet = () => {
      if (!magnet) return;
      const el = magnet;
      const from = `${pull.x.toFixed(2)}px ${pull.y.toFixed(2)}px`;
      magnet = null;
      el.style.translate = "";
      el.animate([{ translate: from }, { translate: "0px 0px" }], { duration: 520, easing: "cubic-bezier(0.3, 1.7, 0.45, 1)" });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      cursor.classList.add("is-visible");
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const max = Math.min(14, r.width * 0.12 + 4);
        pull.tx = Math.max(-max, Math.min(max, (e.clientX - (r.left + r.width / 2)) * 0.32));
        pull.ty = Math.max(-max, Math.min(max, (e.clientY - (r.top + r.height / 2)) * 0.32));
      }
      kick();
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      const text = t.closest(TEXT);
      const view = !text && t.closest(VIEW);
      const link = !text && !view && t.closest(INTERACTIVE);
      cursor.classList.toggle("is-text", Boolean(text));
      cursor.classList.toggle("is-view", Boolean(view));
      cursor.classList.toggle("is-link", Boolean(link));
      const m = (t.closest(MAGNETIC) as HTMLElement | null) ?? null;
      if (m !== magnet) {
        releaseMagnet();
        if (m && !(m as HTMLButtonElement).disabled) {
          magnet = m;
          pull.x = pull.y = pull.tx = pull.ty = 0;
        }
      }
    };

    const onLeaveWindow = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        cursor.classList.remove("is-visible");
        releaseMagnet();
      }
    };
    const onDown = () => cursor.classList.add("is-down");
    const onUp = () => cursor.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("mouseout", onLeaveWindow);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      document.documentElement.classList.remove("cc-cursor-on");
      if (raf) cancelAnimationFrame(raf);
      releaseMagnet();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseout", onLeaveWindow);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [reduced]);

  // ── Image reveals ──
  useEffect(() => {
    const root = document.getElementById("root");
    if (reduced || !root || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target as HTMLElement;
          io.unobserve(img);
          afterPageWave(() => {
            img.classList.remove("cc-reveal-pending");
            img.animate(
              [
                { clipPath: "inset(14% 14% 14% 14% round 18px)", opacity: 0, scale: "1.16" },
                { clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1, scale: "1" },
              ],
              { duration: 950, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
            );
          });
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const watch = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(REVEAL).forEach((img) => {
        if (seen.has(img)) return;
        seen.add(img);
        img.classList.add("cc-reveal-pending");
        io.observe(img);
      });
    };
    watch(root);
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof HTMLElement && watch(n.parentElement ?? n));
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      root.querySelectorAll(".cc-reveal-pending").forEach((n) => n.classList.remove("cc-reveal-pending"));
    };
  }, [reduced]);

  return (
    <div ref={cursorRef} className="cc-cursor" aria-hidden="true">
      <div ref={ringRef} className="cc-cursor__ring">
        <span className="cc-cursor__label">View</span>
      </div>
      <div ref={dotRef} className="cc-cursor__dot" />
    </div>
  );
}
