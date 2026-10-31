/*
 * CSS paint worklet for the theme-switch "venom" mask.
 * Paints the area the new theme has taken over at progress --venom-p (0..1):
 * bacteria-like colonies that bloom out of order, tendrils crawling from the top-right
 * corner toward the bottom-left, and a lumpy mass behind them that ends up covering
 * everything. Deterministic per --venom-seed, so the same seed retraces when reversed.
 */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

class VenomPainter {
  static get inputProperties() {
    return ["--venom-p", "--venom-seed"];
  }

  paint(ctx, size, props) {
    const p = parseFloat(String(props.get("--venom-p"))) || 0;
    if (p <= 0) return;
    const seed = parseInt(String(props.get("--venom-seed")), 10) || 7;
    const W = size.width;
    const H = size.height;
    const diag = Math.hypot(W, H);
    const rand = rng(seed);
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
    const fromCorner = (x, y) => Math.hypot(W - x, y) / diag;

    ctx.fillStyle = "#000";
    ctx.beginPath();
    const dot = (x, y, r) => {
      if (r < 0.4) return;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    };

    // The mass: grows out of the corner late and guarantees full cover at p = 1.
    const M = diag * 1.25 * smooth(0.32, 1, p);
    if (M > 0) {
      dot(W, 0, M);
      for (let i = 0; i < 46; i++) {
        const a = Math.PI / 2 + rand() * (Math.PI / 2);
        const d = M * (0.9 + rand() * 0.12);
        dot(W + Math.cos(a) * d, Math.sin(a) * d, M * (0.05 + rand() * 0.07));
      }
    }

    // Tendrils: wandering walks from the corner, pulled toward the bottom-left.
    const home = (135 * Math.PI) / 180;
    for (let k = 0; k < 13; k++) {
      let dir = home + (rand() - 0.5) * 1.3;
      let x = W;
      let y = 0;
      const delay = rand() * 0.08;
      const thick = 0.7 + rand() * 0.7;
      const steps = 64;
      for (let s = 0; s < steps; s++) {
        dir += (rand() - 0.5) * 0.55 + (home - dir) * 0.05;
        x += Math.cos(dir) * diag * 0.017;
        y += Math.sin(dir) * diag * 0.017;
        const arrive = delay + (s / steps) * 0.6;
        const grow = smooth(arrive, arrive + 0.1, p);
        dot(x, y, diag * 0.012 * thick * (1 - s / (steps * 1.25)) * grow);
        // Spores shed along the tendril.
        if (rand() < 0.55) {
          const sx = x + gauss() * diag * 0.022;
          const sy = y + gauss() * diag * 0.022;
          const sa = arrive + 0.03 + rand() * 0.05;
          dot(sx, sy, diag * (0.002 + rand() * 0.005) * smooth(sa, sa + 0.08, p));
        }
      }
    }

    // Colonies: clusters that bloom out of order, roughly front-to-back across the screen.
    for (let c = 0; c < 48; c++) {
      const cx = rand() * W;
      const cy = rand() * H;
      const start = Math.max(0.02, fromCorner(cx, cy) * 0.7 + (rand() - 0.5) * 0.24);
      const spread = diag * (0.025 + rand() * 0.05);
      const count = 18 + Math.floor(rand() * 18);
      for (let i = 0; i < count; i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.abs(gauss()) * spread;
        const arrive = start + (d / diag) * 1.8 + rand() * 0.05;
        const rMax = diag * (0.003 + rand() * 0.013) * Math.max(0.35, 1 - d / (spread * 2.4));
        dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rMax * smooth(arrive, arrive + 0.11, p));
      }
    }

    ctx.fill();
  }
}

registerPaint("venom", VenomPainter);
