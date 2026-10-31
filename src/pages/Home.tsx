import { Suspense, useEffect, useRef, useState, Component, type ReactNode } from "react";
import { App } from "../App";
import { Underlay } from "../DirtyFigmaExport";
import { ReviewsGallery } from "../ReviewsGallery";
import { StackedProductsShowcase } from "../FrostedGlassShowcase";
import { useTitle } from "../lib/useApi";
import { useTheme } from "../lib/theme";
import { afterPageWave } from "../lib/pageWave";
import { Announcement } from "../components/Announcement";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function PageScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (resizeObserver) resizeObserver.observe(document.body);
    update();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <div className="home-scroll-progress" aria-hidden="true">
      <div ref={fillRef} className="home-scroll-progress__fill" />
    </div>
  );
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
  const pageRef = useRef<HTMLDivElement>(null);
  const { motion } = useTheme();
  const lenisRef = useRef<Lenis | null>(null);
  useTitle("", { description: "CrownCart — a curated, immersive store for fashion, footwear, timepieces and technology. Beyond Ordinary." });

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    let observer: IntersectionObserver | null = null;
    if (motion !== "reduced" && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            afterPageWave(() => entry.target.classList.add("cc-scroll-revealed"));
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
      );
    }

    const reveal = (target: HTMLElement) => {
      target.classList.add("cc-scroll-reveal");
      if (motion === "reduced" || !observer || target.classList.contains("cc-scroll-revealed")) {
        target.classList.add("cc-scroll-revealed");
        return;
      }
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        afterPageWave(() => target.classList.add("cc-scroll-revealed"));
      } else {
        observer.observe(target);
      }
    };

    const scan = (node: HTMLElement) => {
      if (node.matches("[data-scroll-reveal]")) reveal(node);
      node.querySelectorAll<HTMLElement>("[data-scroll-reveal]").forEach(reveal);
    };

    scan(root);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node);
        });
      });
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mutations.disconnect();
    };
  }, [motion]);

  useEffect(() => {
    // Inertial wheel scrolling for the homepage only; touch keeps native scrolling.
    if (motion === "reduced") return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      wheelMultiplier: 0.95,
      allowNestedScroll: true,
      anchors: true,
      prevent: (node) => Boolean(node.closest?.(".reviews-gallery, .modal-backdrop, .assistant, [data-lenis-prevent]")),
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [motion]);

  useEffect(() => {
    if (showReviews) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [showReviews]);

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
    <div ref={pageRef} style={{ width: "100%", minHeight: "100%", position: "relative" }}>
      <PageScrollProgress />
      <Announcement />
      {/* Section 0: Luxury Hero Baubles Scene (100vh) */}
      <section
        id="hero"
        className="home-hero"
        aria-label="CrownCart"
        data-scroll-reveal="section"
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
      </section>

      {/* Eased fade from the light hero into the dark drop stage, kept outside the hero so its text stays untouched. */}
      <div className="home-hero-fade" aria-hidden="true" />

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
