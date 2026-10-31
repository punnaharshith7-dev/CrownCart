import type { CSSProperties } from "react";
import TextEngine from "spring-text-engine";
import { useTheme } from "../lib/theme";
import { usePageWave } from "../lib/pageWave";

type TextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";

/*
 * "Bounce Up" display text: letters spring up from below with a bouncy overshoot, once, the
 * first time the text scrolls into view. Spring-driven (spring-text-engine), so it stays
 * interruptible. Screen readers and search engines get the plain text (the engine's `seo` copy).
 *
 * Used for customer-facing page titles and the homepage hero's display text. Headings with
 * their own designed effects (offset-print, gradient or outline text) and staff dashboards keep
 * their static text. The spring settings below are tuned for this look; keep them as they are.
 */
export function BounceHeading({
  as = "h1",
  className,
  style,
  center = false,
  align,
  children,
}: {
  /** The element to render; hero display text that was a <p> stays a <p>. */
  as?: TextTag;
  className?: string;
  style?: CSSProperties;
  /** Shorthand for align="center". */
  center?: boolean;
  /** The engine lays letters out with flexbox, so alignment uses justify-content, never text-align. */
  align?: "start" | "center" | "end";
  children: string;
}) {
  const { motion } = useTheme();
  const waving = usePageWave();
  const side = align ?? (center ? "center" : undefined);
  const Tag = as;
  if (motion === "reduced") {
    const textAlign = side === "center" ? "center" : side === "end" ? "right" : undefined;
    return (
      <Tag className={className} style={textAlign ? { ...style, textAlign } : style}>
        {children}
      </Tag>
    );
  }
  const justifyContent = side === "center" ? "center" : side === "end" ? "flex-end" : undefined;
  return (
    // Keyed by the text so a changed title (e.g. switching category) springs in again. During a page
    // change it's hidden, holding its space, and remounts to spring in once the wash clears.
    <TextEngine
      key={`${children}|${waving}`}
      tag={as}
      mode="once"
      letterOut={{ opacity: 0, y: 30 }}
      letterIn={{ opacity: 1, y: 0 }}
      letterConfig={{ tension: 420, friction: 12 }}
      letterStagger={28}
      className={className}
      style={{ ...style, ...(justifyContent && { justifyContent }), ...(waving && { visibility: "hidden" }) }}
    >
      {children}
    </TextEngine>
  );
}
