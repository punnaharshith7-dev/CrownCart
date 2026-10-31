import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "./lib/auth";
import { homepageWordmarkStyle } from "./lib/brandStyles";
import { BounceHeading } from "./components/BounceHeading";
import { pageScrollBehavior } from "./lib/scroll";

/** Smooth-scrolls to a homepage section, or navigates when it lives on another page. */
function goToSection(navigate: (to: string) => void, key: string) {
  const ids: Record<string, string> = { home: "hero", explore: "explore", why: "why-crowncart", story: "our-story" };
  if (key === "home") return navigate("/shop");
  if (key === "collections") return navigate("/collections");
  if (key === "explore") return navigate("/explore");
  if (key === "shop") return navigate("/shop");
  if (key === "contact") return navigate("/contact");
  document.getElementById(ids[key] ?? key)?.scrollIntoView({ behavior: pageScrollBehavior() });
}

/** Photo for each directory tile; unknown sections cycle through the set. */
const TILE_IMAGES: Record<string, { src: string; position: string }> = {
  home: { src: "/products/jordan_patent.jpg", position: "70% 40%" },
  explore: { src: "/products/nautilus_raw.jpg", position: "68% 50%" },
  collections: { src: "/products/ax_bomber_raw.jpg", position: "72% 45%" },
  why: { src: "/products/asus_tuf_bg.jpg", position: "70% 45%" },
  story: { src: "/products/nautilus_raw.jpg", position: "20% 30%" },
  contact: { src: "/products/ax_bomber_raw.jpg", position: "15% 60%" },
  shop: { src: "/products/asus_tuf_bg.jpg", position: "25% 70%" },
  reviews: { src: "/products/jordan_patent.jpg", position: "45% 70%" },
};
const TILE_FALLBACK = Object.values(TILE_IMAGES);

/** Feeds the cursor position to CSS so hover fills and spotlights start where the pointer is. */
function trackPointer(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/** Tilts a directory tile toward the cursor. */
function tiltTile(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  trackPointer(e);
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.setProperty("--tx", `${x * 10}deg`);
  e.currentTarget.style.setProperty("--ty", `${-y * 10}deg`);
}

function resetTile(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--tx", "0deg");
  e.currentTarget.style.setProperty("--ty", "0deg");
}

/** Drops a ripple at the press point. */
function spawnRipple(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "home-ripple";
  ripple.style.left = `${e.clientX - r.left}px`;
  ripple.style.top = `${e.clientY - r.top}px`;
  ripple.addEventListener("animationend", () => ripple.remove());
  el.appendChild(ripple);
}

export function Underlay() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<{ key: string; number: string; label: string; description: string; visible: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/catalog/home")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSections(d.homepage.sections.filter((x: { visible: boolean }) => x.visible)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOpenDir = () => setIsOpen(true);
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("crowncart-open-directory", handleOpenDir);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("crowncart-open-directory", handleOpenDir);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div
      className="home-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        padding: 40,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        className="home-topbar"
        style={{
          width: "100%",
          padding: 0,
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 60,
        }}
      >
        <BounceHeading
          as="p"
          className="home-wordmark"
          style={{
            ...homepageWordmarkStyle,
            color: "black",
          }}
        >
          CrownCart
        </BounceHeading>

        {/* Centered Navigation & Action Buttons */}
        <div
          className="home-controls"
          style={{
            position: "relative",
            pointerEvents: "all",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {/* Discover Button */}
          <button
            className={`home-control-button${isOpen ? " is-open" : ""}`}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            onPointerMove={trackPointer}
            onPointerEnter={trackPointer}
            onPointerDown={spawnRipple}
            aria-expanded={isOpen}
            aria-controls="home-directory"
          >
            <span>{isOpen ? "Close" : "Discover"}</span>
            <span className="home-control-icon" aria-hidden="true" />
          </button>

          {/* Sign In Button Directly Below Discover */}
          <button
            className="home-control-button"
            type="button"
            onClick={() => navigate(user ? homeFor(user) : "/signin?returnTo=%2F")}
            onPointerMove={trackPointer}
            onPointerEnter={trackPointer}
            onPointerDown={spawnRipple}
          >
            <span>{user ? "My Account" : "Sign In"}</span>
            <span className="home-control-arrow" aria-hidden="true">&rarr;</span>
          </button>

          {/* Expandable Sections Panel beneath the centered controls */}
          {isOpen && (
            <div className="home-directory no-scrollbar" id="home-directory" role="navigation" aria-label="Site sections">
              <div className="home-directory__head">
                <div>
                  <span className="home-directory__eyebrow">Where to next</span>
                  <span className="home-directory__title">Menu &amp; Directory</span>
                </div>
                <span className="home-directory__count">{String(sections.length + 2).padStart(2, "0")} SECTIONS</span>
              </div>

              <div className="home-directory__grid">
                {[
                  ...sections.map((x) => ({ key: x.key, title: x.label, desc: x.key === "explore" ? "Every brand in the house" : x.description })),
                  { key: "shop", title: "Shop All", desc: "Search, filter and browse every product" },
                  { key: "reviews", title: "Reviews", desc: "What customers say" },
                ].map((item, i, all) => {
                  const image = TILE_IMAGES[item.key] ?? TILE_FALLBACK[i % TILE_FALLBACK.length];
                  // Featured tile fills 2x2; stretch the last tile so the final row has no gap.
                  const leftover = (all.length - 3) % 3;
                  const span = i === 0 ? " home-tile--featured" : i === all.length - 1 && all.length > 3 && leftover ? (leftover === 2 ? " home-tile--wide" : " home-tile--full") : "";
                  return (
                  <button
                    type="button"
                    key={item.key}
                    className={`home-tile${span}`}
                    style={{ "--i": i } as CSSProperties}
                    onPointerMove={tiltTile}
                    onPointerLeave={resetTile}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.key === "reviews") window.dispatchEvent(new CustomEvent("crowncart-open-reviews"));
                      else if (item.key === "home") navigate("/shop");
                      else if (item.key === "shop") navigate("/shop");
                      else if (item.key === "collections") navigate("/collections");
                      else if (item.key === "explore") navigate("/explore");
                      else goToSection(navigate, item.key);
                    }}
                  >
                    <img className="home-tile__img" src={image.src} alt="" loading="lazy" decoding="async" style={{ objectPosition: image.position }} />
                    <span className="home-tile__shade" aria-hidden="true" />
                    <div className="home-tile__top">
                      {i === 0 && <span className="home-tile__tag">Start here</span>}
                      <span className="home-tile__arrow" aria-hidden="true">&rarr;</span>
                    </div>
                    <div className="home-tile__body">
                      <div className="home-tile__title">{item.title}</div>
                      <div className="home-tile__desc">{item.desc}</div>
                      <span className="home-tile__line" aria-hidden="true" />
                    </div>
                  </button>
                  );
                })}
              </div>

              <div className="home-directory__foot">
                <span>CrownCart Luxury Collective</span>
                <span className="home-directory__hint"><kbd>Esc</kbd> to close</span>
                <span>© 2026</span>
              </div>
            </div>
          )}
        </div>

      </div>
      <div className="home-spacer" style={{ height: 60 }} />
      <div
        className="home-meta-row"
        style={{
          width: "100%",
          padding: 0,
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            flex: "1 1 0%",
            height: "100%",
            fontSize: 12,
            lineHeight: "1.5em",
            color: "black",
          }}
        >
          <b>THE COLLECTION</b>
          <br />
          Discover the extraordinary
          <br />
          <b>—</b>
        </p>
      </div>
      <div className="home-spacer" style={{ height: 10 }} />
      <div
        className="home-huge-type full"
        style={{
          fontFamily: "'Antonio', sans-serif",
          width: "100%",
          flex: "1 1 0%",
          padding: 0,
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <BounceHeading
          as="p"
          style={{
            fontFamily: "'Antonio', sans-serif",
            flex: "1 1 0%",
            fontSize: 250,
            lineHeight: "1em",
            color: "black",
            margin: 0,
            letterSpacing: -10,
          }}
        >
          C
        </BounceHeading>
        <div style={{ width: 10 }} />
        <BounceHeading
          as="p"
          align="end"
          style={{
            fontFamily: "'Antonio', sans-serif",
            flex: "1 1 0%",
            fontSize: 250,
            lineHeight: "100%",
            color: "black",
            margin: 0,
            letterSpacing: -10,
          }}
        >
          #1
        </BounceHeading>
      </div>
      <div className="home-spacer" style={{ height: 60 }} />
      <div
        className="home-bottom-bar"
        style={
          {
            pointerEvents: "all",
            width: "100%",
            padding: 0,
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
          } as unknown as CSSProperties
        }
      >
        <p
          className="full"
          style={{
            whiteSpace: "nowrap",
            flex: "1 1 0%",
            fontSize: 12,
            lineHeight: "1.5em",
            color: "black",
          }}
        >
        </p>
        <div style={{ width: 10 }} />
        <div
          className="full"
          style={{
            flex: "1 1 0%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            pointerEvents: "all",
          }}
        >
          <BounceHeading
            as="p"
            align="center"
            style={{
              fontFamily: "'Antonio', sans-serif",
              fontSize: 16,
              fontWeight: "700",
              lineHeight: "1em",
              color: "black",
              letterSpacing: -0.5,
              whiteSpace: "nowrap",
              flexWrap: "nowrap",
              textTransform: "uppercase",
            }}
          >
            The Crown of Discovery
          </BounceHeading>
          <p
            className="home-hero-sells"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.12em",
              lineHeight: "1.3em",
              textAlign: "center",
              textTransform: "uppercase",
              color: "#111111",
              maxWidth: "calc(100vw - 32px)",
              margin: "0 0 4px",
            }}
          >
            Fashion · Footwear · Timepieces · Tech
          </p>
          <button
            type="button"
            data-magnetic
            style={{
              pointerEvents: "all",
              cursor: "pointer",
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              padding: "8px 22px",
              backgroundColor: "#111111",
              color: "#ffffff",
              border: "1px solid #111111",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.15s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
              outline: "none",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#111111";
              e.currentTarget.style.transform = "scale(1.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#111111";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => {
              const el = document.getElementById("product-shoe");
              if (el) {
                el.scrollIntoView({ behavior: pageScrollBehavior() });
              }
            }}
          >
            <span>TRENDING NOW</span>
            <span style={{ fontSize: "12px", transform: "translateY(1px)" }}>↓</span>
          </button>
        </div>
        <div style={{ width: 10 }} />
        <p
          className="full"
          style={{
            flex: "1 1 0%",
            fontSize: 12,
            lineHeight: "1em",
            textAlign: "right",
            color: "black",
          }}
        ></p>
      </div>
    </div>
  );
}
