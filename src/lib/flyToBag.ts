/**
 * Add-to-bag flourish: a copy of the product image lifts off, arcs across the screen and shrinks
 * into the header bag icon, which then bounces (with its counter). Where there's no bag icon on
 * screen (e.g. the homepage hero) it flies to the top-right corner. Skipped for reduced motion.
 */
export function flyToBag(source: Element | null | undefined) {
  if (!source || document.documentElement.dataset.motion === "reduced") return;
  const img = source instanceof HTMLImageElement ? source : source.querySelector("img");
  if (!img?.currentSrc && !img?.src) return;
  const from = img.getBoundingClientRect();
  if (!from.width || !from.height) return;

  const bag = Array.from(document.querySelectorAll<HTMLElement>("[data-bag-target]")).find((el) => el.getBoundingClientRect().width > 0) ?? null;
  const to = bag?.getBoundingClientRect() ?? new DOMRect(window.innerWidth - 56, 18, 36, 36);

  // Fly a square thumbnail no bigger than 220px, centred on the source image.
  const size = Math.min(220, from.width, from.height);
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endX = to.left + to.width / 2 - size / 2;
  const endY = to.top + to.height / 2 - size / 2;
  const endScale = Math.max(0.08, 26 / size);
  // The arc peaks above the higher of the two points.
  const peakY = Math.min(startY, endY) - 120;
  const midX = startX + (endX - startX) * 0.55;

  const ghost = document.createElement("img");
  ghost.src = img.currentSrc || img.src;
  ghost.alt = "";
  ghost.className = "bag-fly";
  Object.assign(ghost.style, { left: "0px", top: "0px", width: `${size}px`, height: `${size}px` });
  document.body.appendChild(ghost);

  const flight = ghost.animate(
    [
      { transform: `translate3d(${startX}px, ${startY}px, 0) scale(1) rotate(0deg)`, opacity: 1, offset: 0 },
      { transform: `translate3d(${midX}px, ${peakY}px, 0) scale(0.55) rotate(-8deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate3d(${endX}px, ${endY}px, 0) scale(${endScale}) rotate(6deg)`, opacity: 0.6, offset: 1 },
    ],
    { duration: 820, easing: "cubic-bezier(0.55, 0, 0.35, 1)" },
  );
  flight.finished
    .catch(() => {})
    .finally(() => {
      ghost.remove();
      if (!bag) return;
      bag.animate([{ scale: "1" }, { scale: "1.28" }, { scale: "0.92" }, { scale: "1" }], { duration: 520, easing: "cubic-bezier(0.3, 1.5, 0.5, 1)" });
      bag.querySelector(".count-dot")?.animate([{ scale: "1" }, { scale: "1.7" }, { scale: "1" }], { duration: 480, easing: "cubic-bezier(0.3, 1.8, 0.5, 1)" });
    });
}
