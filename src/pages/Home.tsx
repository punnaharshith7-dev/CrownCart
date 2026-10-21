import { Suspense, useEffect, useState, Component, type ReactNode } from "react";
import { App } from "../App";
import { Underlay, Overlay } from "../DirtyFigmaExport";
import { ReviewsGallery } from "../ReviewsGallery";
import { StackedProductsShowcase } from "../FrostedGlassShowcase";
import { useTitle } from "../lib/useApi";
import { useTheme } from "../lib/theme";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** If the 3D scene throws (driver issues, lost context), the page keeps working without it. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Home() {
  const [showReviews, setShowReviews] = useState(false);
  const [webgl] = useState(webglAvailable);
  const { motion } = useTheme();
  useTitle("", { description: "CrownCart — a curated, immersive store for fashion, footwear, timepieces and technology. Beyond Ordinary." });

  useEffect(() => {
    const open = () => setShowReviews(true);
    window.addEventListener("crowncart-open-reviews", open);
    return () => window.removeEventListener("crowncart-open-reviews", open);
  }, []);

  useEffect(() => {
    // Deep links such as /#our-story scroll once the sections exist.
    if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 400);
  }, []);

  return (
    <div style={{ width: "100%", minHeight: "100%", position: "relative" }}>
      {/* Section 0: Luxury Hero Baubles Scene (100vh) */}
      <section
        id="hero"
        aria-label="CrownCart"
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "linear-gradient(180deg, #e6eaf5 0%, #f6f6f6 80%)",
        }}
      >
        <Underlay />
        {webgl && motion !== "reduced" ? (
          <SceneBoundary>
            <Suspense fallback={null}>
              <App />
            </Suspense>
          </SceneBoundary>
        ) : (
          <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 55%, rgba(192,57,43,0.18), transparent 55%)" }}
          />
        )}
        <Overlay />
      </section>

      <StackedProductsShowcase />

      {showReviews && (
        <Suspense
          fallback={
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                backgroundColor: "#191920",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Antonio', sans-serif",
                fontSize: 24,
                letterSpacing: 2,
              }}
            >
              LOADING REVIEWS GALLERY...
            </div>
          }
        >
          {webgl ? (
            <ReviewsGallery onClose={() => setShowReviews(false)} />
          ) : (
            <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 200, background: "#191920", color: "#fff", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
              <div>
                <p style={{ marginBottom: 16 }}>The 3D reviews gallery needs WebGL, which isn't available in this browser. Reviews are shown on each product page.</p>
                <button type="button" onClick={() => setShowReviews(false)} style={{ padding: "10px 22px", borderRadius: 24, border: "none", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </Suspense>
      )}
    </div>
  );
}
