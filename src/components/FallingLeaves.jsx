import { useEffect, useRef } from 'react';

/*
 * FallingLeaves
 * -------------
 * A light seasonal touch: a handful of leaves drifting down over the page.
 * One fixed canvas that never takes clicks, drawn with plain 2D paths.
 *   • Off for people who prefer reduced motion.
 *   • Fewer leaves on small screens.
 *   • Sleeps while the tab is hidden.
 *   • Leaves drift gently away from the pointer as it passes.
 */

const COLORS = ['#c8553d', '#d4473b', '#d98a3d', '#e0a458', '#b5652a', '#8c4a2f'];
const FRAME_MS = 1000 / 60;

// A simple leaf, pointing up, about 1 unit tall: two curves and a centre vein.
function leafPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -0.5);
  ctx.bezierCurveTo(0.42, -0.3, 0.38, 0.22, 0, 0.5);
  ctx.bezierCurveTo(-0.38, 0.22, -0.42, -0.3, 0, -0.5);
  ctx.closePath();
}

function makeLeaf(w, h, anywhere) {
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : -30 - Math.random() * h * 0.3,
    size: 12 + Math.random() * 14,
    vy: 0.35 + Math.random() * 0.55, // px per 60 Hz frame
    drift: (Math.random() - 0.5) * 0.3,
    sway: 0.6 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    freq: 0.008 + Math.random() * 0.012,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.03,
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 0.02 + Math.random() * 0.03,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: 0.55 + Math.random() * 0.35,
    push: 0,
  };
}

export default function FallingLeaves({ count = 16, mobileCount = 8 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let leaves = [];
    let raf = 0;
    let last = 0;
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 700 ? mobileCount : count;
      while (leaves.length < n) leaves.push(makeLeaf(w, h, true));
      leaves.length = n;
    };

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const k = last ? Math.min(100, now - last) / FRAME_MS : 1;
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (const l of leaves) {
        l.phase += l.freq * k;
        l.rot += l.spin * k;
        l.flip += l.flipSpeed * k;

        // a soft nudge away from the pointer
        const dx = l.x - pointer.x;
        const dy = l.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) l.push += (dx > 0 ? 1 : -1) * 0.35 * k;
        l.push *= Math.pow(0.94, k);

        l.x += (l.drift + Math.sin(l.phase) * l.sway + l.push) * k;
        l.y += l.vy * k;

        if (l.y > h + 30 || l.x < -60 || l.x > w + 60) Object.assign(l, makeLeaf(w, h, false));

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.scale(l.size * Math.max(0.15, Math.abs(Math.cos(l.flip))), l.size);
        ctx.globalAlpha = l.alpha;
        leafPath(ctx);
        ctx.fillStyle = l.color;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -0.42);
        ctx.lineTo(0, 0.62); // vein, with a little stem
        ctx.lineWidth = 0.06;
        ctx.strokeStyle = 'rgb(60 30 20 / 0.45)';
        ctx.stroke();
        ctx.restore();
      }
    };

    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    resize();
    start();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [count, mobileCount]);

  return <canvas ref={ref} className="falling-leaves" aria-hidden="true" />;
}
