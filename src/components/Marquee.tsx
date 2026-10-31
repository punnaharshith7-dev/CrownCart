import type { CSSProperties } from "react";

/** A slow editorial ticker; the words are rendered twice so the loop is seamless. Decorative only. */
export function Marquee({ words, className = "" }: { words: string[]; className?: string }) {
  if (!words.length) return null;
  const items = [...words, ...words];
  return (
    <div className={`ex-marquee ${className}`} aria-hidden="true">
      <div className="ex-marquee__track" style={{ "--duration": `${Math.max(30, words.length * 3)}s` } as CSSProperties}>
        {items.map((w, i) => (
          <span key={i} className="ex-marquee__item">
            {w}
            <span className="ex-marquee__star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
