import { useEffect, useRef } from 'react';

/*
 * SeasonalParticles
 * -----------------
 * What falls from the sky this month: Seattle fall leaves, winter snow, or
 * spring cherry petals (see `particles` in src/content/seasons.js).
 * One fixed canvas that never takes clicks, drawn with plain 2D paths.
 *   • Off for people who prefer reduced motion.
 *   • Fewer particles on small screens.
 *   • Sleeps while the tab is hidden.
 *   • Particles drift gently away from the pointer as it passes.
 */

const FRAME_MS = 1000 / 60;

/*
 * Pacific Northwest leaves, as you'd see on a Seattle sidewalk in October.
 * Each outline is a polar curve (angle 0 = leaf tip, pointing up). A lobe is a
 * broad rounded bump (`gauss`) blended with a sharp point (`sigma`, weighted by
 * `tip`); `side` adds the small secondary points maples have on each lobe.
 * The bottom is left low, which makes the notch where the stem joins.
 */
function lobedPath({ lobes, base, sigma, gauss = 0, tip = 1, side = 0, sideWeight = 0 }) {
  const all = lobes.flatMap(([c, w]) =>
    side
      ? [
          [c, w],
          [c + side, w * sideWeight],
          [c - side, w * sideWeight],
        ]
      : [[c, w]],
  );
  const N = 240;
  const raw = [];
  let max = 0;
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI + (2 * Math.PI * i) / N;
    let r = base;
    for (const [c, w] of all) {
      const d = Math.atan2(Math.sin(a - c), Math.cos(a - c));
      if (gauss) r += w * (1 - tip) * Math.exp(-((d / gauss) ** 2));
      r += w * tip * Math.exp(-Math.abs(d) / sigma);
    }
    max = Math.max(max, r);
    raw.push([a, r]);
  }
  const path = new Path2D();
  raw.forEach(([a, r], i) => {
    const x = (Math.sin(a) * r) / (2 * max);
    const y = (-Math.cos(a) * r) / (2 * max);
    if (i) path.lineTo(x, y);
    else path.moveTo(x, y);
  });
  path.closePath();
  // veins run from where the stem joins out towards each main lobe tip
  const tips = lobes.map(([c, w]) => {
    const r = ((base + w) / (2 * max)) * 0.8;
    return [Math.sin(c) * r, -Math.cos(c) * r];
  });
  return { path, tips, stemY: base / (2 * max) };
}

const BIGLEAF = {
  lobes: [
    [0, 0.5],
    [1.2, 0.46],
    [-1.2, 0.46],
    [2.3, 0.24],
    [-2.3, 0.24],
  ],
  base: 0.14,
  gauss: 0.36,
  tip: 0.35,
  sigma: 0.09,
  side: 0.3,
  sideWeight: 0.22,
};

const SPECIES = [
  // bigleaf maple: big, broad and five-lobed, gold and yellow
  {
    weight: 0.5,
    size: [22, 36],
    colors: ['#e2b23a', '#d9a521', '#e8c25a', '#c98f1b', '#d4892a'],
    shape: BIGLEAF,
  },
  // vine maple: rounder, with seven to nine points, red and orange
  {
    weight: 0.25,
    size: [14, 24],
    colors: ['#c0392b', '#d35400', '#e0662a', '#b83227', '#e67e22'],
    shape: {
      lobes: [
        [0, 0.3],
        [0.75, 0.3],
        [-0.75, 0.3],
        [1.5, 0.28],
        [-1.5, 0.28],
        [2.25, 0.2],
        [-2.25, 0.2],
      ],
      base: 0.28,
      gauss: 0.27,
      tip: 0.3,
      sigma: 0.08,
    },
  },
  // sweetgum: a sharp five-pointed star, burgundy and wine
  {
    weight: 0.17,
    size: [14, 22],
    colors: ['#8e2c3b', '#a8323e', '#7a2435', '#b8442f'],
    shape: {
      lobes: [
        [0, 0.5],
        [1.25, 0.48],
        [-1.25, 0.48],
        [2.5, 0.4],
        [-2.5, 0.4],
      ],
      base: 0.2,
      sigma: 0.17,
    },
  },
  // an already-fallen bigleaf maple: dry and brown
  { weight: 0.08, size: [20, 30], colors: ['#8a5a2b', '#9b6a35', '#7a4e26'], shape: BIGLEAF },
];

let built = null;
function species() {
  if (!built) built = SPECIES.map((s) => ({ ...s, ...lobedPath(s.shape) }));
  return built;
}

function pickSpecies() {
  let r = Math.random();
  for (const s of species()) {
    if ((r -= s.weight) <= 0) return s;
  }
  return species()[0];
}

function makeLeaf(w, h, anywhere) {
  const kind = pickSpecies();
  const [lo, hi] = kind.size;
  return {
    kind,
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : -30 - Math.random() * h * 0.3,
    size: lo + Math.random() * (hi - lo),
    vy: 0.35 + Math.random() * 0.55, // px per 60 Hz frame
    drift: (Math.random() - 0.5) * 0.3,
    sway: 0.6 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    freq: 0.008 + Math.random() * 0.012,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.03,
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 0.02 + Math.random() * 0.03,
    color: kind.colors[Math.floor(Math.random() * kind.colors.length)],
    alpha: 0.6 + Math.random() * 0.3,
    push: 0,
  };
}

function drawLeaf(ctx, l) {
  ctx.scale(l.size * Math.max(0.15, Math.abs(Math.cos(l.flip))), l.size);
  ctx.fillStyle = l.color;
  ctx.fill(l.kind.path);
  // stem and veins, from where the stem joins out to each lobe tip
  ctx.beginPath();
  ctx.moveTo(0, l.kind.stemY + 0.22);
  ctx.lineTo(0, l.kind.stemY * 0.4);
  for (const [tx, ty] of l.kind.tips) {
    ctx.moveTo(0, l.kind.stemY * 0.4);
    ctx.lineTo(tx, ty);
  }
  ctx.lineWidth = 0.035;
  ctx.strokeStyle = 'rgb(70 35 15 / 0.4)';
  ctx.stroke();
}

// ── snow: soft dots, plus the odd six-armed crystal ─────────────────────────
const SNOW_COLORS = ['#9fb4cc', '#b3c4d8', '#8aa3bf', '#c6d3e2'];

function makeFlake(w, h, anywhere) {
  const crystal = Math.random() < 0.15;
  return {
    crystal,
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : -20 - Math.random() * h * 0.2,
    size: crystal ? 7 + Math.random() * 6 : 1.6 + Math.random() * 3.2,
    vy: 0.45 + Math.random() * 0.8,
    drift: (Math.random() - 0.5) * 0.2,
    sway: 0.3 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    freq: 0.01 + Math.random() * 0.015,
    rot: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.02,
    flip: 0,
    flipSpeed: 0,
    color: SNOW_COLORS[Math.floor(Math.random() * SNOW_COLORS.length)],
    alpha: 0.55 + Math.random() * 0.35,
    push: 0,
  };
}

function drawFlake(ctx, f) {
  ctx.fillStyle = f.color;
  ctx.strokeStyle = f.color;
  if (!f.crystal) {
    ctx.beginPath();
    ctx.arc(0, 0, f.size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.lineWidth = Math.max(1, f.size * 0.12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const cx = Math.cos(a);
    const sy = Math.sin(a);
    ctx.moveTo(0, 0);
    ctx.lineTo(cx * f.size, sy * f.size);
    // two little side branches per arm
    const bx = cx * f.size * 0.6;
    const by = sy * f.size * 0.6;
    const b = f.size * 0.28;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a + 0.7) * b, by + Math.sin(a + 0.7) * b);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a - 0.7) * b, by + Math.sin(a - 0.7) * b);
  }
  ctx.stroke();
}

// ── spring: cherry blossom petals, with the little notch at the tip ─────────
const PETAL_COLORS = ['#f6c1cf', '#f3aec2', '#f9d3dd', '#eea0b7', '#f7b9c9'];
const PETAL = (() => {
  const p = new Path2D();
  p.moveTo(0, 0.5);
  p.bezierCurveTo(-0.42, 0.3, -0.4, -0.3, -0.14, -0.48);
  p.lineTo(0, -0.36); // notch
  p.lineTo(0.14, -0.48);
  p.bezierCurveTo(0.4, -0.3, 0.42, 0.3, 0, 0.5);
  p.closePath();
  return p;
})();

function makePetal(w, h, anywhere) {
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : -20 - Math.random() * h * 0.3,
    size: 9 + Math.random() * 8,
    vy: 0.35 + Math.random() * 0.5,
    drift: 0.15 + Math.random() * 0.35, // a light breeze
    sway: 0.6 + Math.random() * 1.1,
    phase: Math.random() * Math.PI * 2,
    freq: 0.01 + Math.random() * 0.015,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.04,
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 0.03 + Math.random() * 0.04,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    alpha: 0.7 + Math.random() * 0.25,
    push: 0,
  };
}

function drawPetal(ctx, p) {
  ctx.scale(p.size * Math.max(0.2, Math.abs(Math.cos(p.flip))), p.size);
  ctx.fillStyle = p.color;
  ctx.fill(PETAL);
}

const KINDS = {
  leaves: { count: 16, mobile: 8, make: makeLeaf, draw: drawLeaf },
  snow: { count: 70, mobile: 35, make: makeFlake, draw: drawFlake },
  petals: { count: 24, mobile: 12, make: makePetal, draw: drawPetal },
};

export default function SeasonalParticles({ kind = 'leaves' }) {
  const ref = useRef(null);

  useEffect(() => {
    const type = KINDS[kind];
    if (!type || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let leaves = []; // the particles, whatever kind
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
      const n = w < 700 ? type.mobile : type.count;
      while (leaves.length < n) leaves.push(type.make(w, h, true));
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

        if (l.y > h + 30 || l.x < -60 || l.x > w + 60) Object.assign(l, type.make(w, h, false));

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.globalAlpha = l.alpha;
        type.draw(ctx, l);
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
  }, [kind]);

  return <canvas ref={ref} className="falling-leaves" aria-hidden="true" />;
}
