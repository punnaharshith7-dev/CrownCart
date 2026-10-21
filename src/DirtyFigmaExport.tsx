import { useState, useEffect, type CSSProperties } from "react";

export function Underlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const handleOpenDir = () => setIsOpen(true);
    window.addEventListener("crowncart-open-directory", handleOpenDir);
    return () => window.removeEventListener("crowncart-open-directory", handleOpenDir);
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
            onClick={() => setIsSignInOpen(true)}
            style={{
              pointerEvents: "all",
              cursor: "pointer",
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              padding: "9px 20px",
              backgroundColor: isSignInOpen ? "#111111" : "transparent",
              color: isSignInOpen ? "#ffffff" : "#111111",
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
              if (!isSignInOpen) {
                e.currentTarget.style.backgroundColor = "#111111";
                e.currentTarget.style.color = "#ffffff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSignInOpen) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#111111";
              }
            }}
          >
            <span>{isSignedIn ? "Client VIP ✓" : "Sign In"}</span>
          </button>

          {/* Expandable Sections Panel directly under that button */}
          {isOpen && (
            <div
              className="no-scrollbar"
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
                  07 SECTIONS
                </span>
              </div>

              {/* Exact 7 Navigation Sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { id: "01", title: "Home", desc: "Return to overview" },
                  { id: "02", title: "Explore", desc: "Interactive 3D experience" },
                  { id: "03", title: "Collections", desc: "Fashion, technology & lifestyle" },
                  { id: "04", title: "Why CrownCart", desc: "Quality & authenticity" },
                  { id: "05", title: "Our Story", desc: "The heritage & design craft" },
                  { id: "06", title: "Contact", desc: "Private client concierge" },
                  { id: "07", title: "Reviews", desc: "Client testimonials & ratings" },
                ].map((item) => (
                  <div
                    key={item.id}
                    style={{
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
                      if (item.title === "Reviews") {
                        window.dispatchEvent(new CustomEvent("crowncart-open-reviews"));
                        setIsOpen(false);
                      } else if (item.title === "Home") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        setIsOpen(false);
                      } else if (item.title === "Explore" || item.title === "Collections") {
                        const el = document.getElementById("product-shoe");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                        setIsOpen(false);
                      } else {
                        window.dispatchEvent(new CustomEvent("crowncart-explore"));
                      }
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
                  </div>
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

        {/* Luxury Client Sign In Modal */}
        {isSignInOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 300,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              pointerEvents: "all",
              animation: "dropdownFadeIn 0.2s ease-out forwards",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsSignInOpen(false);
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "36px 32px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                position: "relative",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsSignInOpen(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "transparent",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#888888",
                  padding: "4px 8px",
                  borderRadius: "50%",
                }}
                aria-label="Close modal"
              >
                ✕
              </button>

              <div style={{ textAlign: "center", marginBottom: "26px" }}>
                <div
                  style={{
                    fontFamily: "'Antonio', sans-serif",
                    fontSize: "30px",
                    fontWeight: 700,
                    letterSpacing: "-1px",
                    color: "#111111",
                  }}
                >
                  CrownCart
                </div>
                <div
                  style={{
                    fontSize: "10.5px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "#888888",
                    marginTop: "6px",
                    fontWeight: 600,
                  }}
                >
                  Client Authentication
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSignedIn(true);
                  setIsSignInOpen(false);
                }}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#555555",
                      marginBottom: "6px",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="client@crowncart.luxury"
                    required
                    placeholder="Enter email"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e2e2",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#555555",
                      marginBottom: "6px",
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    defaultValue="••••••••••••"
                    required
                    placeholder="Enter password"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e2e2",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: "6px",
                    padding: "13px 20px",
                    backgroundColor: "#111111",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2a2a2a")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#111111")}
                >
                  Sign In to Vault
                </button>
              </form>

              <div
                style={{
                  marginTop: "18px",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#777777",
                }}
              >
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignedIn(true);
                    setIsSignInOpen(false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#111111",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                    fontSize: "11px",
                  }}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        )}
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
            <span>SCROLL DOWN</span>
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
