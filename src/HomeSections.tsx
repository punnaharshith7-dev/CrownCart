import { useContext, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HomeDataContext } from "./lib/homeData";

/* Closing editorial sections of the homepage: Collections, Why CrownCart, Our Story. */

const sectionLabel: CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "3px",
  textTransform: "uppercase",
  color: "rgba(255, 255, 255, 0.5)",
  marginBottom: "12px",
};
const sectionTitle: CSSProperties = {
  fontFamily: "'Antonio', sans-serif",
  fontSize: "clamp(40px, 7vw, 68px)",
  fontWeight: 700,
  letterSpacing: "-1px",
  lineHeight: "1.05em",
  margin: "0 0 20px 0",
  color: "#ffffff",
};
const ghostNumber: CSSProperties = {
  fontFamily: "'Antonio', sans-serif",
  fontSize: "clamp(110px, 18vw, 220px)",
  fontWeight: 700,
  lineHeight: 0.8,
  color: "rgba(255, 255, 255, 0.06)",
  position: "absolute",
  top: "40px",
  left: "clamp(16px, 4vw, 60px)",
  userSelect: "none",
  pointerEvents: "none",
};
const pillButton: CSSProperties = {
  cursor: "pointer",
  padding: "10px 22px",
  backgroundColor: "transparent",
  color: "#ffffff",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "1px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

export function ExploreMoreSection() {
  const home = useContext(HomeDataContext);
  const navigate = useNavigate();
  const categories = (home?.categories ?? []).filter((c) => c.count > 0);

  return (
    <>
      <section
        id="explore-more"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "90vh",
          backgroundColor: "#111113",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px clamp(16px, 4vw, 40px)",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div aria-hidden="true" style={{ fontSize: "20px", marginBottom: "12px", filter: "drop-shadow(0 2px 8px rgba(255, 215, 0, 0.4))" }}>
            👑
          </div>
          <p style={sectionLabel}>02 · Collections</p>
          <h2 style={sectionTitle}>THE CROWN OF DISCOVERY</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", lineHeight: "1.6em", color: "rgba(255, 255, 255, 0.7)", maxWidth: "600px", margin: "0 0 36px 0" }}>
            {home?.brand.supportingLine ?? "Discover a world of extraordinary choices."} Browse every collection, search by brand, and filter by what matters to you.
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", marginBottom: "48px" }}>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              style={{
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                padding: "16px 44px",
                backgroundColor: "#ffffff",
                color: "#111111",
                border: "none",
                borderRadius: "32px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 8px 30px rgba(255, 255, 255, 0.25)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e0e0e0";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span>EXPLORE {home ? `ALL ${home.productCount}` : "MORE"}</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </button>
          </div>

          {categories.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", width: "100%", maxWidth: "840px", marginBottom: "50px" }}>
              {categories.map((cat, i) => (
                <Link
                  key={cat.slug}
                  to={`/shop/${cat.slug}`}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "20px 16px",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    color: "#ffffff",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{cat.name}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>
                    {cat.count} product{cat.count === 1 ? "" : "s"}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("crowncart-open-reviews"))} style={pillButton}>
              VIEW 3D CLIENT REVIEWS ★
            </button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("crowncart-open-directory"))} style={pillButton}>
              ALL SECTIONS
            </button>
          </div>
        </div>
      </section>

      <section id="why-crowncart" style={{ position: "relative", backgroundColor: "#0b0b0d", color: "#ffffff", padding: "120px clamp(16px, 4vw, 60px) 100px", overflow: "hidden" }}>
        <div aria-hidden="true" style={ghostNumber}>
          03
        </div>
        <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto" }}>
          <p style={sectionLabel}>03 · Why CrownCart</p>
          <h2 style={{ ...sectionTitle, maxWidth: "700px" }}>CURATED. SECURE. CONSIDERED.</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "16px",
              overflow: "hidden",
              marginTop: "40px",
            }}
          >
            {[
              ["Curated discovery", "A focused catalog across fashion, footwear, timepieces and technology — chosen, not crowded."],
              ["Transparent pricing", "Prices include GST. Shipping and any discounts are shown before you pay, never after."],
              ["Secure checkout", "Payments are confirmed with the payment provider before an order is marked paid. We never store card details."],
              ["Real service", "Track every order step by step, request returns online, and reach a person when you need one."],
            ].map(([t, d]) => (
              <div key={t} style={{ background: "#0b0b0d", padding: "28px 24px" }}>
                <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: "22px", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase" }}>{t}</div>
                <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="our-story" style={{ position: "relative", backgroundColor: "#111113", color: "#ffffff", padding: "120px clamp(16px, 4vw, 60px) 80px", overflow: "hidden" }}>
        <div aria-hidden="true" style={ghostNumber}>
          04
        </div>
        <div style={{ position: "relative", maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <p style={sectionLabel}>04 · Our Story</p>
          <h2 style={sectionTitle}>{(home?.brand.tagline ?? "Beyond Ordinary.").toUpperCase()}</h2>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)", marginBottom: "18px" }}>
            CrownCart began with a simple idea: shopping for exceptional things should feel exceptional too. We pair a small, carefully chosen catalog with a cinematic way of
            discovering it, and back it with the essentials that matter most: honest prices, secure payments and dependable delivery.
          </p>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>Established in 2026.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "36px" }}>
            <Link to="/contact" style={pillButton}>
              CONTACT US
            </Link>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ ...pillButton, backgroundColor: "rgba(255,255,255,0.1)" }}>
              ↑ BACK TO TOP
            </button>
          </div>
          <nav aria-label="Policies" style={{ marginTop: "60px", display: "flex", gap: "18px", justifyContent: "center", flexWrap: "wrap", fontSize: "11px", letterSpacing: "1px" }}>
            {[
              ["/policies/shipping", "SHIPPING"],
              ["/policies/returns", "RETURNS"],
              ["/policies/privacy", "PRIVACY"],
              ["/policies/terms", "TERMS"],
            ].map(([to, l]) => (
              <Link key={to} to={to} style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", padding: 0 }}>
                {l}
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: "24px", fontSize: "11px", color: "rgba(255, 255, 255, 0.35)", letterSpacing: "1px" }}>© {new Date().getFullYear()} CROWNCART • ALL RIGHTS RESERVED</div>
        </div>
      </section>
    </>
  );
}
