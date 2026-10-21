import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "./lib/auth";

/** Smooth-scrolls to a homepage section, or navigates when it lives on another page. */
function goToSection(navigate: (to: string) => void, key: string) {
  const ids: Record<string, string> = { home: "hero", explore: "product-shoe", why: "why-crowncart", story: "our-story" };
  if (key === "home") return window.scrollTo({ top: 0, behavior: "smooth" });
  if (key === "collections") return navigate("/shop");
  if (key === "contact") return navigate("/contact");
  document.getElementById(ids[key] ?? key)?.scrollIntoView({ behavior: "smooth" });
}

export function Underlay() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, cartCount } = useAuth();
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
        <p
          style={{
            fontFamily: "'Antonio', sans-serif",
            height: 44,
            fontSize: 44,
            fontWeight: "700",
            lineHeight: "44px",
            color: "black",
            letterSpacing: -2,
            margin: 0,
          }}
        >
          CrownCart
        </p>

        {/* Top-Right Navigation & Action Buttons */}
        <div
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
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="home-directory"
            style={{
              pointerEvents: "all",
              cursor: "pointer",
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              padding: "9px 20px",
              backgroundColor: isOpen ? "#111111" : "transparent",
              color: isOpen ? "#ffffff" : "#111111",
              border: "1.5px solid #111111",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              outline: "none",
              boxShadow: isOpen ? "0 4px 14px rgba(0,0,0,0.12)" : "none",
              minWidth: "128px",
            }}
            onMouseEnter={(e) => {
              if (!isOpen) {
                e.currentTarget.style.backgroundColor = "#111111";
                e.currentTarget.style.color = "#ffffff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isOpen) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#111111";
              }
            }}
          >
            <span>{isOpen ? "Close" : "Discover"}</span>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{isOpen ? "✕" : "▾"}</span>
          </button>

          {/* Sign In Button Directly Below Discover */}
          <button
            type="button"
            onClick={() => navigate(user ? homeFor(user) : "/signin?returnTo=%2F")}
            style={{
              pointerEvents: "all",
              cursor: "pointer",
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              padding: "9px 20px",
              backgroundColor: "transparent",
              color: "#111111",
              border: "1.5px solid #111111",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              outline: "none",
              minWidth: "128px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#111111";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#111111";
            }}
          >
            <span>{user ? "My Account" : "Sign In"}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            aria-label={`Bag, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            style={{
              pointerEvents: "all",
              cursor: "pointer",
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              padding: "9px 20px",
              backgroundColor: "transparent",
              color: "#111111",
              border: "1.5px solid #111111",
              borderRadius: "24px",
              minWidth: "128px",
            }}
          >
            Bag{cartCount > 0 ? ` (${cartCount})` : ""}
          </button>

          {/* Expandable Sections Panel directly under that button */}
          {isOpen && (
            <div
              className="no-scrollbar"
              id="home-directory"
              role="navigation"
              aria-label="Site sections"
              style={{
                position: "absolute",
                top: "calc(100% + 14px)",
                right: 0,
                width: 360,
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                backgroundColor: "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 18,
                padding: "24px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)",
                pointerEvents: "all",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                animation: "dropdownFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {/* Panel Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                  paddingBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Antonio', sans-serif",
                    fontSize: "14px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "#111111",
                  }}
                >
                  MENU & DIRECTORY
                </span>
                <span style={{ fontSize: "11px", color: "#888888", fontWeight: "600" }}>
                  {String(sections.length + 2).padStart(2, "0")} SECTIONS
                </span>
              </div>

              {/* Exact 7 Navigation Sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  ...sections.map((x, i) => ({ id: String(i + 1).padStart(2, "0"), key: x.key, title: x.label, desc: x.description })),
                  { id: String(sections.length + 1).padStart(2, "0"), key: "shop", title: "Shop All", desc: "Search, filter and browse every product" },
                  { id: String(sections.length + 2).padStart(2, "0"), key: "reviews", title: "Reviews", desc: "What customers say" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    style={{
                      width: "100%",
                      border: "none",
                      textAlign: "left",
                      font: "inherit",
                      color: "inherit",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.07)";
                      e.currentTarget.style.transform = "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.02)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.key === "reviews") window.dispatchEvent(new CustomEvent("crowncart-open-reviews"));
                      else if (item.key === "shop") navigate("/shop");
                      else goToSection(navigate, item.key);
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: "'Antonio', sans-serif",
                          fontWeight: "700",
                          color: "#999999",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {item.id}
                      </span>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Antonio', sans-serif",
                            fontSize: "18px",
                            fontWeight: "700",
                            lineHeight: "1.1em",
                            color: "#111111",
                            letterSpacing: "-0.3px",
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#777777",
                            marginTop: "2px",
                            fontWeight: "400",
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#999999",
                        fontWeight: "400",
                        transform: "translateX(0)",
                        transition: "transform 0.18s ease",
                      }}
                    >
                      &rarr;
                    </span>
                  </button>
                ))}
              </div>

              {/* Panel Footer */}
              <div
                style={{
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                  color: "#888888",
                }}
              >
                <span>CrownCart Luxury Collective</span>
                <span>© 2026</span>
              </div>
            </div>
          )}
        </div>

      </div>
      <div style={{ height: 60 }} />
      <div
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
        <div style={{ width: 10 }} />
        <p
          style={{
            transform: "rotate3d(0, 0, 1, 90deg) translate3d(100%,10px,0)",
            transformOrigin: "right",
            fontSize: 12,
            fontWeight: "700",
            lineHeight: "100%",
            textAlign: "right",
            color: "black",
            whiteSpace: "nowrap",
          }}
        >
          ESTABLISHED IN 2026 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ●
        </p>
      </div>
      <div style={{ height: 10 }} />
      <div
        className="full"
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
        <p
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
        </p>
        <div style={{ width: 10 }} />
        <p
          style={{
            fontFamily: "'Antonio', sans-serif",
            flex: "1 1 0%",
            fontSize: 250,
            lineHeight: "100%",
            textAlign: "right",
            color: "black",
            margin: 0,
            letterSpacing: -10,
          }}
        >
          #1
        </p>
      </div>
      <div style={{ height: 60 }} />
      <div
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
          <b>The Art of Discovery</b>
          <br />
          Fashion, technology & lifestyle
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
          <p
            style={{
              fontFamily: "'Antonio', sans-serif",
              fontSize: 16,
              fontWeight: "700",
              lineHeight: "1em",
              textAlign: "center",
              color: "black",
              letterSpacing: -0.5,
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            The Crown of Discovery
          </p>
          <button
            type="button"
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
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <span>EXPLORE</span>
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

export function Overlay() {
  return (
    <div style={{ position: "absolute", bottom: 40, right: 40, pointerEvents: "all" }}>
      <p
        style={{
          flex: "1 1 0%",
          fontSize: 12,
          lineHeight: "1em",
          textAlign: "right",
          color: "black",
        }}
      >
        <span style={{ fontWeight: 600, letterSpacing: "0.2px", color: "black" }}>
          A world of extraordinary choices
        </span>
      </p>
    </div>
  );
}
