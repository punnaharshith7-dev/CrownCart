/**
 * A one-off confetti burst on a temporary full-screen canvas: two cannons fire from the bottom
 * corners in CrownCart's colours, pieces tumble and fall, and the canvas removes itself (~3 s).
 * Skipped for reduced motion.
 */
const COLORS = ["#c94449", "#ffd23f", "#2f5bea", "#ff7aa8", "#ffffff", "#1b1a17"];

export function confettiBurst() {
  if (document.documentElement.dataset.motion === "reduced") return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const count = W < 640 ? 110 : 190;
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    const angle = (left ? -60 : -120) + (Math.random() - 0.5) * 40;
    const speed = 11 + Math.random() * 10;
    return {
      x: left ? 0 : W,
      y: H * 0.85,
      vx: Math.cos((angle * Math.PI) / 180) * speed,
      vy: Math.sin((angle * Math.PI) / 180) * speed,
      w: 6 + Math.random() * 7,
      h: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      tilt: Math.random() * Math.PI,
      color: COLORS[i % COLORS.length],
      round: Math.random() < 0.25,
    };
  });

  const start = performance.now();
  const step = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of pieces) {
      p.vy += 0.32; // gravity
      p.vx *= 0.985; // air
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.tilt += 0.12;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (3000 - t) / 600));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.tilt)); // flutter
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h / 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < 3000) requestAnimationFrame(step);
    else canvas.remove();
  };
  requestAnimationFrame(step);
}
