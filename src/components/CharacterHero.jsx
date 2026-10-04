import { useEffect, useRef, useState } from 'react';
// self-hosted: no third-party font request, no layout shift waiting on Google
import '@fontsource-variable/dancing-script';
import '@fontsource-variable/manrope';
import './CharacterHero.css';

/*
 * CharacterHero
 * -------------
 * A portrait whose head follows the cursor, rendered from pre-baked WebP frames
 * (see scripts/extract_frames.py). Rules this component keeps:
 *   • No <video>, no seeking, no playback. Frames are plain images.
 *   • No CSS 3D. The page and the body never move; only the frame changes.
 *   • Exactly one frame is painted per update, fully opaque. No cross-fades,
 *     so there is never a double face.
 *   • Paints only when the chosen frame changes, and the loop sleeps while
 *     the hero is off-screen.
 */

const TAU = Math.PI * 2;
const FRAME_MS = 1000 / 60;

// shortest-path interpolation between two angles (radians)
function lerpAngle(from, to, t) {
  const delta = ((((to - from + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return from + delta * t;
}

function normalise(a) {
  return ((a % TAU) + TAU) % TAU;
}

async function decodeOnce(url) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  // ImageBitmaps are already decoded and GPU-friendly: drawImage never stalls on them
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(img);
    } catch {
      /* fall back to the element */
    }
  }
  return img;
}

// A flaky connection shouldn't cost a frame: retry with a short backoff.
async function loadFrame(url, attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      return await decodeOnce(url);
    } catch (err) {
      if (i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 200 * i));
    }
  }
}

// Read the background colour the browser actually decoded, so the page matches
// the frame pixel-for-pixel even after WebP's colour rounding.
function sampleCorner(image) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, 4, 4, 0, 0, 4, 4);
  const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
  return `rgb(${r} ${g} ${b})`;
}

// Build ink colours from the background: same hue, pushed to the far end of lightness.
function inkFor(color) {
  const m = color.match(/\d+/g);
  const [r, g, b] = (m ? m.slice(0, 3).map(Number) : [255, 255, 255]).map((v) => v / 255);
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = Math.round(h * 60 + 360) % 360;
  const s = Math.min(40, Math.round((d / (1 - Math.abs(max + min - 1) || 1)) * 100));
  const dark = `hsl(${h} ${s}% 11%)`;
  return luminance > 0.36
    ? { ink: dark, soft: `hsl(${h} ${Math.max(8, s - 8)}% 11% / 0.74)`, dark, light: true }
    : { ink: `hsl(${h} ${Math.min(30, s)}% 96%)`, soft: `hsl(${h} ${Math.min(24, s)}% 96% / 0.78)`, dark };
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255})`;
}

export default function CharacterHero({
  framesPath = `${import.meta.env.BASE_URL}frames/`,
  response = 0.26, // fraction of the remaining angle closed per 60 Hz frame
  deadzone = 0.12, // eye-contact radius, as a fraction of the viewport's half-diagonal
  idleReturnMs = 1400, // touch: look back at the viewer this long after the finger lifts
  paintBody = true, // also paint <body> so overscroll and the area around the hero match
  focusX = 0.5, // where her face sits when cover has to crop (fraction of the viewport)
  focusY = 0.42,
  // Used when the frames have a transparent background (scripts/key_frames.py):
  // any CSS background, and the text colour to go with it.
  background = 'linear-gradient(120deg, #f7f2ec, #eecfc0)',
  backgroundInk = 'dark', // 'dark' text for a light background, 'light' for a dark one
  placement = null, // optional (width, height) => { x, height } | null; keep it a stable function
  greeting = 'Hi, I’m',
  name = 'Lohitha',
  bio = 'I build full-stack web products end to end, from React interfaces to the APIs and databases behind them, with a focus on speed and clarity.',
  resumeHref = '/resume.pdf',
  talkHref = '#contact',
  // buttons under the bio; defaults to the original Resume / Let's Talk pair
  actions = [
    { label: 'Resume', href: resumeHref, variant: 'solid' },
    { label: 'Let’s Talk', href: talkHref, variant: 'glass' },
  ],
  extra = null, // optional node shown under the buttons (e.g. social links)
  headline = null, // optional list of short phrases, shown as one line under the name
  id,
  // pass [] when the page has its own site-wide header
  nav = [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],
}) {
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    let cancelled = false;
    let raf = 0;
    let running = false;
    // .matches stays live, so toggling the OS setting takes effect without a reload
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const S = {
      manifest: null,
      center: null,
      frames: [],
      tracking: false,
      bg: '#000',
      // layout (CSS px, viewport space)
      face: { x: 0, y: 0 },
      draw: { x: 0, y: 0, w: 0, h: 0 },
      layoutDirty: true,
      // input
      pointer: { x: 0, y: 0, active: false },
      idleTimer: 0,
      // animation
      angle: 0,
      centered: true,
      drawn: null, // index currently on the canvas (-1 = center)
      needsPaint: true,
      last: 0,
    };

    // ── layout ────────────────────────────────────────────────────────────
    function measure() {
      S.layoutDirty = false;
      const m = S.manifest;
      if (!m) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.max(1, Math.round(rect.width * dpr));
      const bh = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        S.needsPaint = true;
      }
      // object-fit: cover, done by hand (CSS object-fit doesn't reach canvas drawing).
      // Where cover has to crop, the crop is steered so her face sits at
      // focusX / focusY of the viewport instead of wherever the centre lands.
      //
      // `placement(width, height)` can instead set { x, height } for the viewport
      // size: her face centre at x (fraction of the width) and the frame drawn at
      // `height` (fraction of the viewport height), standing on the bottom edge.
      // The frame's background is one flat colour, painted behind it, so the frame's
      // own edges never show.
      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
      const place = placement?.(rect.width, rect.height);
      let s, x, y;
      if (place) {
        s = (rect.height * place.height) / m.height;
        x = rect.width * place.x - m.face.x * m.width * s;
        y = rect.height - m.height * s;
      } else {
        s = Math.max(rect.width / m.width, rect.height / m.height);
        x = clamp(rect.width * focusX - m.face.x * m.width * s, rect.width - m.width * s, 0);
        y = clamp(rect.height * focusY - m.face.y * m.height * s, rect.height - m.height * s, 0);
      }
      const w = m.width * s;
      const h = m.height * s;
      S.draw = { x: x * dpr, y: y * dpr, w: w * dpr, h: h * dpr };
      S.face = { x: rect.left + x + m.face.x * w, y: rect.top + y + m.face.y * h };
    }

    function paint(index) {
      const img = index < 0 ? S.center : S.frames[index] || S.center;
      if (!img) return;
      const W = canvas.width;
      const H = canvas.height;
      const d = S.draw;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'copy';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, d.x, d.y, d.w, d.h); // one frame, 100% opacity; 'copy' clears the rest

      if (!S.transparent) {
        // Where the frame's own edge lands inside the canvas (placement mode), fade
        // it out so a softly shaded wall blends into the flat background colour
        // instead of ending in a hard line.
        const fx = d.w * 0.14;
        const fy = d.h * 0.14;
        const left = d.x > 0.5;
        const right = d.x + d.w < W - 0.5;
        const top = d.y > 0.5;
        if (left || right || top) {
          ctx.globalCompositeOperation = 'destination-in';
          if (left || right) {
            const g = ctx.createLinearGradient(d.x, 0, d.x + d.w, 0);
            g.addColorStop(0, left ? 'rgb(0 0 0 / 0)' : '#000');
            g.addColorStop(fx / d.w, '#000');
            g.addColorStop(1 - fx / d.w, '#000');
            g.addColorStop(1, right ? 'rgb(0 0 0 / 0)' : '#000');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
          }
          if (top) {
            const g = ctx.createLinearGradient(0, d.y, 0, d.y + fy);
            g.addColorStop(0, 'rgb(0 0 0 / 0)');
            g.addColorStop(1, '#000');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
          }
        }
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = S.bg;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';
      S.drawn = index;
      S.needsPaint = false;
    }

    // ── loop ──────────────────────────────────────────────────────────────
    function tick(now) {
      raf = requestAnimationFrame(tick);
      const dt = S.last ? Math.min(100, now - S.last) : FRAME_MS;
      S.last = now;
      if (S.layoutDirty) measure();

      let want = -1;
      const p = S.pointer;
      if (S.tracking && p.active && !reducedMotion.matches) {
        const dx = p.x - S.face.x;
        const dy = p.y - S.face.y;
        const dist = Math.hypot(dx, dy);
        const radius = (deadzone * Math.hypot(window.innerWidth, window.innerHeight)) / 2;
        // 15% hysteresis so she doesn't flicker when the cursor rests on the edge
        const inside = dist < (S.centered ? radius * 1.15 : radius);
        if (!inside) {
          const target = Math.atan2(dx, -dy); // 0 = up, clockwise
          if (S.centered) {
            S.angle = target; // leaving eye contact: turn straight there, no sweep
          } else {
            const t = 1 - Math.pow(1 - response, dt / FRAME_MS); // frame-rate independent
            S.angle = lerpAngle(S.angle, target, t);
          }
          const n = S.frames.length;
          want = Math.round(normalise(S.angle) / (TAU / n)) % n;
        }
      }
      S.centered = want === -1;
      if (want !== S.drawn || S.needsPaint) paint(want);
    }

    function start() {
      if (running || cancelled) return;
      running = true;
      S.last = 0;
      S.layoutDirty = true;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    // ── input ─────────────────────────────────────────────────────────────
    const onMove = (e) => {
      S.pointer.x = e.clientX;
      S.pointer.y = e.clientY;
      S.pointer.active = true;
      clearTimeout(S.idleTimer);
    };
    const onRelease = (e) => {
      if (e.pointerType === 'mouse') return;
      clearTimeout(S.idleTimer);
      S.idleTimer = setTimeout(() => (S.pointer.active = false), idleReturnMs);
    };
    const onLeave = (e) => {
      if (!e.relatedTarget) S.pointer.active = false; // cursor left the window
    };
    const onBlur = () => (S.pointer.active = false);
    const onLayout = () => (S.layoutDirty = true);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('pointerup', onRelease, { passive: true });
    window.addEventListener('pointercancel', onRelease, { passive: true });
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('blur', onBlur);
    window.addEventListener('scroll', onLayout, { passive: true });
    window.addEventListener('resize', onLayout);
    const ro = new ResizeObserver(onLayout);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(hero);

    // ── load ──────────────────────────────────────────────────────────────
    (async () => {
      try {
        const res = await fetch(`${framesPath}manifest.json`);
        if (!res.ok) throw new Error(`manifest.json: HTTP ${res.status}`);
        const manifest = await res.json();
        if (cancelled) return;
        S.manifest = manifest;
        S.transparent = Boolean(manifest.transparent);
        if (S.transparent) {
          const dark = backgroundInk !== 'light';
          setTheme({
            bg: background,
            ink: dark ? '#17130f' : '#fff8f3',
            soft: dark ? 'rgb(23 19 15 / 0.72)' : 'rgb(255 248 243 / 0.78)',
            dark: '#17130f',
            light: dark,
          });
        } else {
          S.bg = hexToRgb(manifest.background);
          setTheme({ bg: S.bg, ...inkFor(S.bg) });
        }

        // 1. the neutral frame first, so she appears immediately
        S.center = await loadFrame(framesPath + manifest.center);
        if (cancelled) return;
        if (!S.transparent) {
          S.bg = sampleCorner(S.center);
          setTheme({ bg: S.bg, ...inkFor(S.bg) });
        }
        S.layoutDirty = true;
        S.needsPaint = true;
        setStatus('ready');

        // 2. the whole ring in parallel; tracking starts once every frame is settled
        const settled = await Promise.allSettled(manifest.frames.map((f) => loadFrame(framesPath + f)));
        if (cancelled) return;
        const ring = settled.map((r) => (r.status === 'fulfilled' ? r.value : null));
        const missing = ring.filter((f) => !f).length;
        if (missing === ring.length) throw new Error('none of the ring frames loaded');
        if (missing) {
          console.warn(`[CharacterHero] ${missing} frame(s) failed; using nearest neighbours.`);
          const n = ring.length;
          for (let i = 0; i < n; i++) {
            for (let d = 1; !ring[i]; d++) {
              ring[i] = settled[(i + d) % n].value || settled[(i - d + n) % n].value || null;
            }
          }
        }
        S.frames = ring;
        S.tracking = true;
      } catch (err) {
        console.error(
          '[CharacterHero] Could not load frames. Run `python scripts/extract_frames.py` ' +
            `to generate ${framesPath}manifest.json.`,
          err,
        );
        // keep showing her if the neutral frame made it; only fail when nothing can be drawn
        if (!cancelled && !S.center) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      stop();
      clearTimeout(S.idleTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('scroll', onLayout);
      window.removeEventListener('resize', onLayout);
      ro.disconnect();
      io.disconnect();
      S.frames.forEach((f) => f.close?.());
      S.center?.close?.();
    };
  }, [framesPath, response, deadzone, idleReturnMs, focusX, focusY, placement, background, backgroundInk]);

  useEffect(() => {
    if (!paintBody || !theme || theme.bg.includes('gradient')) return;
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = theme.bg;
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, [paintBody, theme]);

  const style = theme
    ? {
        '--ch-bg': theme.bg,
        '--ch-ink': theme.ink,
        '--ch-ink-soft': theme.soft,
        '--ch-ink-dark': theme.dark,
        ...(theme.bg.startsWith('rgb') ? { '--ch-fade': theme.bg } : {}),
      }
    : undefined;

  return (
    <section
      ref={heroRef}
      id={id}
      className={`ch-hero${status === 'ready' ? ' is-ready' : ''}${theme?.light ? ' is-light' : ''}`}
      style={style}
      aria-labelledby="ch-name"
      data-cursor={theme?.light ? 'dark' : 'light'}
    >
      <div className="ch-stage">
        <canvas
          ref={canvasRef}
          className="ch-canvas"
          role="img"
          aria-label={`Portrait of ${name}, looking towards your cursor`}
        />
      </div>

      {nav.length > 0 && (
        <header className="ch-header">
          <nav className="ch-nav" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </header>
      )}

      <div className="ch-copy">
        <p className="ch-greeting">{greeting}</p>
        <h1 id="ch-name" className="ch-name">
          {name}
        </h1>
        {headline && <p className="ch-tagline">{headline.join(' ')}</p>}
        <p className="ch-bio">{bio}</p>
        <div className="ch-actions">
          {actions.map((a) => (
            <a
              key={a.label}
              className={`ch-btn ch-btn-${a.variant || 'glass'}`}
              href={a.href}
              data-magnetic
              {...(a.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {a.label}
              {(a.variant === 'solid' || a.external) && (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path
                    d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </a>
          ))}
          {extra && <div className="ch-extra">{extra}</div>}
        </div>
      </div>

      {status === 'error' && import.meta.env.DEV && (
        <p className="ch-dev-error" role="alert">
          Frames not found. Run <code>python scripts/extract_frames.py</code> to create{' '}
          <code>public/frames/</code>.
        </p>
      )}
    </section>
  );
}
