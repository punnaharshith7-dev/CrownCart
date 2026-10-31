import { useEffect, useRef } from "react";

/**
 * Magnifier for the product page's main photo (desktop mouse only). A round lens follows the
 * cursor and shows that spot ZOOM× larger. It works out where the photo actually sits inside its
 * frame (object-fit contain or cover), hides itself over empty space, and never blocks clicks —
 * the photo still opens full screen.
 *
 * Render it inside the photo's frame (which must be position: relative).
 */
const ZOOM = 2.6;
const LENS = 180;

export function ZoomLens({ src }: { src: string }) {
  const lens = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lens.current;
    const frame = el?.parentElement;
    if (!el || !frame) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    /** The photo's drawn area inside the frame, honouring object-fit. */
    const contentBox = () => {
      const img = frame.querySelector<HTMLImageElement>("img.fit-image__main, :scope > img");
      if (!img || !img.naturalWidth) return null;
      const r = img.getBoundingClientRect();
      const fit = getComputedStyle(img).objectFit;
      const ratio = img.naturalWidth / img.naturalHeight;
      let w = r.width;
      let h = r.height;
      if (fit === "contain" ? r.width / r.height > ratio : fit === "cover" ? r.width / r.height < ratio : false) w = h * ratio;
      else if (fit === "contain" || fit === "cover") h = w / ratio;
      return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, w, h, clipL: r.left, clipT: r.top, clipR: r.right, clipB: r.bottom };
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = contentBox();
      const f = frame.getBoundingClientRect();
      if (!box) return;
      const inside = e.clientX >= Math.max(box.left, box.clipL) && e.clientX <= Math.min(box.left + box.w, box.clipR) && e.clientY >= Math.max(box.top, box.clipT) && e.clientY <= Math.min(box.top + box.h, box.clipB);
      el.classList.toggle("is-on", inside);
      if (!inside) return;
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      el.style.transform = `translate3d(${e.clientX - f.left - LENS / 2}px, ${e.clientY - f.top - LENS / 2}px, 0)`;
      el.style.backgroundSize = `${box.w * ZOOM}px ${box.h * ZOOM}px`;
      el.style.backgroundPosition = `${-(px * ZOOM - LENS / 2)}px ${-(py * ZOOM - LENS / 2)}px`;
    };
    const leave = () => el.classList.remove("is-on");
    frame.addEventListener("pointermove", move);
    frame.addEventListener("pointerleave", leave);
    return () => {
      frame.removeEventListener("pointermove", move);
      frame.removeEventListener("pointerleave", leave);
    };
  }, [src]);

  return <div ref={lens} className="zoom-lens" aria-hidden="true" style={{ width: LENS, height: LENS, backgroundImage: `url("${src.replace(/"/g, "%22")}")` }} />;
}
