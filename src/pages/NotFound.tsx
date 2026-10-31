import { useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { StoreLayout } from "../components/SiteHeader";
import "../styles/notfound.css";

/** A wheel with spokes — it popped off the cart and rolled in to become the "0". */
function Wheel() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="11" />
      <circle cx="50" cy="50" r="9" fill="var(--gold)" />
      {[0, 60, 120].map((a) => (
        <line key={a} x1="50" y1="12" x2="50" y2="88" stroke="currentColor" strokeWidth="4" transform={`rotate(${a} 50 50)`} />
      ))}
    </svg>
  );
}

/** Goods that spill out of the basket: start position, landing offset, final spin. */
const PIECES = [
  { x: 150, y: 84, dx: -70, dy: 128, r: -200, d: 0.9, el: <rect x="-16" y="-16" width="32" height="32" rx="4" fill="var(--gold)" /> },
  { x: 205, y: 78, dx: 85, dy: 136, r: 160, d: 1.05, el: <><rect x="-15" y="-12" width="30" height="28" rx="3" fill="var(--crimson)" /><path d="M-7 -12 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="var(--crimson)" strokeWidth="3" /></> },
  { x: 245, y: 90, dx: 120, dy: 126, r: 300, d: 1.2, el: <circle r="12" fill="var(--text-2)" /> },
  { x: 180, y: 70, dx: 30, dy: 150, r: -110, d: 1.35, el: <path d="M-18 10 L-18 -8 L-9 2 L0 -14 L9 2 L18 -8 L18 10 Z" fill="var(--gold)" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round" /> },
  { x: 120, y: 92, dx: -30, dy: 128, r: 90, d: 1.5, el: <rect x="-11" y="-11" width="22" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="3" /> },
];

export default function NotFound() {
  const { pathname } = useLocation();
  // Bumping the key remounts the scene so the whole crash plays again.
  const [take, setTake] = useState(0);

  return (
    <StoreLayout>
      <section className="nf" key={take}>
        <h1 className="nf-code" aria-label="404">
          <span className="nf-digit">4</span>
          <span className="nf-wheel"><Wheel /></span>
          <span className="nf-digit nf-digit-late">4</span>
        </h1>

        <button type="button" className="nf-scene" onClick={() => setTake((t) => t + 1)} aria-label="Crash the cart again">
          <svg viewBox="0 0 400 250" aria-hidden="true">
            <line className="nf-floor" x1="10" y1="232" x2="390" y2="232" />
            <g className="nf-rig">
              <g className="nf-cart">
                <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M30 40 H62 L92 172 H272" />
                  <path d="M70 72 H310 L286 150 H88" />
                  <path d="M120 72 L128 150 M170 72 L172 150 M220 72 L216 150 M268 72 L256 150" strokeWidth="3" />
                  <path d="M78 110 H298" strokeWidth="3" />
                  <path d="M112 172 V196" />
                  {/* Snapped front axle */}
                  <path d="M262 172 L258 188 L266 184 L261 198" strokeWidth="4" stroke="var(--crimson)" />
                </g>
                <circle cx="112" cy="214" r="18" fill="none" stroke="currentColor" strokeWidth="6" />
                <circle cx="112" cy="214" r="4" fill="var(--gold)" />
              </g>
              {PIECES.map((p, i) => (
                <g key={i} transform={`translate(${p.x} ${p.y})`}>
                  <g className="nf-piece" style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--r": `${p.r}deg`, animationDelay: `${p.d}s` } as CSSProperties}>
                    {p.el}
                  </g>
                </g>
              ))}
            </g>
          </svg>
        </button>

        <h2 className="nf-title">Clean-up on aisle 404.</h2>
        <p className="nf-copy">
          Our cart hit a bump and lost a wheel. There's nothing at <code>{pathname}</code> — but the rest of the store is right where we left it.
        </p>
        <div className="nf-actions">
          <Link className="btn" to="/shop">Back to the shop</Link>
          <Link className="btn btn-outline" to="/">Home</Link>
        </div>
        <p className="nf-hint">Psst — tap the cart to crash it again.</p>
      </section>
    </StoreLayout>
  );
}
