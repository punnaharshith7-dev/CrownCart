import { createRoot } from "react-dom/client";
import { Suspense, useState, useEffect } from "react";
import { App } from "./App";
import { Underlay, Overlay } from "./DirtyFigmaExport";
import { ReviewsGallery } from "./ReviewsGallery";
import { StackedProductsShowcase } from "./FrostedGlassShowcase";
import "./styles.css";

function Root() {
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    const handleOpenReviews = () => {
      setShowReviews(true);
    };

    window.addEventListener("crowncart-open-reviews", handleOpenReviews);
    return () => {
      window.removeEventListener("crowncart-open-reviews", handleOpenReviews);
    };
  }, []);

  return (
    <div style={{ width: "100%", minHeight: "100%", position: "relative" }}>
      {/* Section 0: Luxury Hero Baubles Scene (100vh) */}
      <section
        id="hero"
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "linear-gradient(180deg, #e6eaf5 0%, #f6f6f6 80%)",
        }}
      >
        <Underlay />
        <Suspense fallback={null}>
          <App />
        </Suspense>
        <Overlay />
      </section>

      {/* 4 Stacked Products (one bottom of other) + Explore More at last in middle */}
      <StackedProductsShowcase />

      {/* Reviews Gallery Modal */}
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
          <ReviewsGallery onClose={() => setShowReviews(false)} />
        </Suspense>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
