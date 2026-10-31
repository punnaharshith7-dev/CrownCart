import { useEffect, useRef, useState } from "react";
import { useTheme } from "../lib/theme";

/*
 * Velocity Squish cursor: an additive overlay that never replaces the native cursor.
 * One dot follows the pointer, rotates to its direction of travel (atan2 of the delta)
 * and stretches along it: speed drives scaleX up and scaleY down.
 */

const SIZE = 34; // dot diameter in CSS px
const FOLLOW = 0.16; // easing toward the pointer per frame
const DEFORM = 0.72; // maximum stretch at full speed
const FULL_SPEED = 38; // px per frame that counts as "full speed"
const HOVER_SCALE = 1.6;
const INTERACTIVE = "a, button, input";

const finePointer = "(hover: hover) and (pointer: fine)";
const reducedMotion = "(prefers-reduced-motion: reduce)";

/** True when the device has a precise hovering pointer and the user hasn't asked for less motion. */
function useCursorAllowed() {
  const { motion } = useTheme();
  const [mediaOk, setMediaOk] = useState(() => matchMedia(finePointer).matches && !matchMedia(reducedMotion).matches);

  useEffect(() => {
    const fine = matchMedia(finePointer);
    const reduced = matchMedia(reducedMotion);
    const update = () => setMediaOk(fine.matches && !reduced.matches);
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    update();
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  return mediaOk && motion !== "reduced";
}

export function VelocitySquish() {
  const allowed = useCursorAllowed();
  return allowed ? <SquishDot /> : null;
}

function SquishDot() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let angle = 0;
    let stretch = 0; // smoothed 0..1 speed factor
    let hover = 1; // eased hover scale
    let hoverTarget = 1;
    let seen = false;
    let frame = 0;

    const tick = () => {
      frame = 0;
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const vx = dx * FOLLOW;
      const vy = dy * FOLLOW;
      pos.x += vx;
      pos.y += vy;

      const speed = Math.hypot(vx, vy);
      // Keep the last heading while nearly still so the dot doesn't spin on tiny jitters.
      if (speed > 0.2) angle = Math.atan2(vy, vx);
      stretch += (Math.min(speed / FULL_SPEED, 1) - stretch) * 0.25;
      hover += (hoverTarget - hover) * 0.2;

      const d = stretch * DEFORM;
      const sx = (1 + d) * hover;
      const sy = (1 - d * 0.55) * hover;
      dot.style.transform = `translate3d(${pos.x - SIZE / 2}px, ${pos.y - SIZE / 2}px, 0) rotate(${angle}rad) scale(${sx}, ${sy})`;

      // Sleep once the dot has caught up and relaxed back to a circle.
      const settled = Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && stretch < 0.001 && Math.abs(hoverTarget - hover) < 0.001;
      if (!settled) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!seen) {
        // First sighting: appear under the pointer instead of flying in from the corner.
        seen = true;
        pos.x = target.x;
        pos.y = target.y;
      }
      hoverTarget = e.target instanceof Element && e.target.closest(INTERACTIVE) ? HOVER_SCALE : 1;
      dot.classList.add("is-visible");
      wake();
    };

    const onLeave = () => {
      dot.classList.remove("is-visible");
      seen = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return <div ref={dotRef} className="velocity-squish" aria-hidden="true" />;
}
