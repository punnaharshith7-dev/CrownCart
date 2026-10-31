import { useState, type ImgHTMLAttributes } from "react";

/**
 * Shows the whole image inside a fixed-shape frame, never cropping it. When the image's shape
 * differs from the frame (e.g. a tall phone photo in a square), the empty bands are filled with a
 * blurred copy of the same image so any uploaded photo looks intentionally framed.
 */
export function FitImage({ className = "", onLoad, ...img }: ImgHTMLAttributes<HTMLImageElement>) {
  const [mismatch, setMismatch] = useState(false);
  return (
    <span className={`fit-image${mismatch ? " fit-image--framed" : ""} ${className}`.trim()}>
      {mismatch && <img className="fit-image__backdrop" src={img.src} alt="" aria-hidden="true" />}
      <img
        {...img}
        className="fit-image__main"
        onLoad={(e) => {
          const el = e.currentTarget;
          const frame = el.parentElement!.getBoundingClientRect();
          const ratio = el.naturalWidth / el.naturalHeight / (frame.width / frame.height || 1);
          setMismatch(ratio < 0.85 || ratio > 1.18);
          onLoad?.(e);
        }}
      />
    </span>
  );
}
