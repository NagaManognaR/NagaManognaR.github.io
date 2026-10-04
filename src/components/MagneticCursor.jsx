import { useEffect, useRef } from 'react';
import './MagneticCursor.css';

/*
 * MagneticCursor
 * --------------
 * A glowing dot that sits exactly on the pointer and an aura ring that trails it.
 * Over links and buttons the ring grows and is pulled toward the element's
 * centre, and elements marked data-magnetic lean toward the pointer.
 *
 * Only runs on devices with a precise, hovering pointer; touch keeps the
 * system behaviour. Uses 2D translate/scale only.
 */

const INTERACTIVE = 'a, button, [role="button"], [data-magnetic], input, select, textarea, label';
const FRAME_MS = 1000 / 60;

export default function MagneticCursor({
  trail = 0.2, // how quickly the ring catches up, per 60 Hz frame
  hoverScale = 1.9, // ring size over interactive elements
  pull = 0.35, // how far the ring is drawn toward a hovered element's centre
  magnetStrength = 0.28, // how far data-magnetic elements lean toward the pointer
}) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const root = document.documentElement;
    root.classList.add('has-magnetic-cursor');

    const p = { x: -100, y: -100 };
    const r = { x: -100, y: -100, s: 1 };
    let hovered = null; // interactive element under the pointer
    let magnet = null; // hovered element that leans (data-magnetic)
    let pressed = false;
    let seen = false;
    let raf = 0;
    let last = 0;

    const placeDot = () => {
      const s = pressed ? 0.7 : hovered ? 0.55 : 1;
      dot.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`;
    };

    const release = (el) => {
      if (!el) return;
      el.classList.remove('is-magnet');
      el.style.transform = '';
    };

    function tick(now) {
      const dt = last ? Math.min(100, now - last) : FRAME_MS;
      last = now;

      let tx = p.x;
      let ty = p.y;
      if (hovered) {
        const b = hovered.getBoundingClientRect();
        tx += (b.left + b.width / 2 - p.x) * pull;
        ty += (b.top + b.height / 2 - p.y) * pull;
      }
      const targetScale = (hovered ? hoverScale : 1) * (pressed ? 0.85 : 1);
      const t = reduced ? 1 : 1 - Math.pow(1 - trail, dt / FRAME_MS);
      r.x += (tx - r.x) * t;
      r.y += (ty - r.y) * t;
      r.s += (targetScale - r.s) * t;
      ring.style.transform = `translate(${r.x}px, ${r.y}px) scale(${r.s})`;

      if (magnet && !reduced) {
        const b = magnet.getBoundingClientRect();
        const dx = (p.x - (b.left + b.width / 2)) * magnetStrength;
        const dy = (p.y - (b.top + b.height / 2)) * magnetStrength;
        magnet.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      const settled =
        Math.abs(tx - r.x) < 0.1 && Math.abs(ty - r.y) < 0.1 && Math.abs(targetScale - r.s) < 0.002;
      raf = settled && !magnet ? 0 : requestAnimationFrame(tick);
      if (!raf) last = 0;
    }

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      p.x = e.clientX;
      p.y = e.clientY;
      if (!seen) {
        seen = true;
        r.x = p.x;
        r.y = p.y;
      }
      root.classList.add('cursor-visible');
      placeDot(); // the dot is written immediately: no frame of lag
      wake();
    };

    // The original white glow is kept over areas marked data-cursor="light" (dark
    // sections like the footer); everywhere else an ink version stays visible on paper.
    const setTone = (target) => {
      const light = target.closest?.('[data-cursor="light"]');
      root.classList.toggle('cursor-dark', !light);
    };

    const onOver = (e) => {
      setTone(e.target);
      const el = e.target.closest?.(INTERACTIVE) || null;
      if (el === hovered) return;
      release(magnet);
      hovered = el;
      magnet = el && el.hasAttribute('data-magnetic') ? el : null;
      magnet?.classList.add('is-magnet');
      ring.classList.toggle('is-hovering', !!hovered);
      placeDot();
      wake();
    };

    const onDown = () => {
      pressed = true;
      placeDot();
      wake();
    };
    const onUp = () => {
      pressed = false;
      placeDot();
      wake();
    };
    const onLeave = (e) => {
      if (e.relatedTarget) return;
      root.classList.remove('cursor-visible');
      release(magnet);
      magnet = null;
      hovered = null;
      ring.classList.remove('is-hovering');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseout', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      release(magnet);
      root.classList.remove('has-magnetic-cursor', 'cursor-visible', 'cursor-dark');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseout', onLeave);
    };
  }, [trail, hoverScale, pull, magnetStrength]);

  return (
    <>
      <div ref={ringRef} className="mc-ring" aria-hidden="true" />
      <div ref={dotRef} className="mc-dot" aria-hidden="true" />
    </>
  );
}
