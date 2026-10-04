import { useEffect, useRef } from 'react';
import { journey } from '../content/journey.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { Reveal, RevealText } from '../components/Reveal.jsx';
import './Journey.css';

// Fills the timeline's spine as the reader moves through the chapters.
function useScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      el.style.setProperty('--progress', 1);
      return undefined;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mid = window.innerHeight * 0.55;
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      el.style.setProperty('--progress', p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return ref;
}

function Chapter({ chapter, index }) {
  return (
    <li className="chapter">
      <span className="chapter__dot" aria-hidden="true" />
      <Reveal className="chapter__aside">
        <span className="chapter__num" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="chapter__period mono">{chapter.period}</span>
      </Reveal>
      <Reveal className="chapter__body" delay={0.08}>
        <h2 className="chapter__title">
          <span className="sr-only">Chapter {index + 1}: </span>
          {chapter.title}
        </h2>
        {chapter.role && <p className="chapter__role">{chapter.role}</p>}
        <p className="chapter__story">{chapter.story}</p>
        {chapter.lesson && (
          <blockquote className="chapter__lesson">
            <span className="chapter__lesson-label mono">Note to past me</span>
            <p>{chapter.lesson}</p>
          </blockquote>
        )}
        {chapter.milestone && <p className="chapter__milestone mono">{chapter.milestone}</p>}
        {chapter.image?.src && (
          <figure className="chapter__figure">
            <img src={chapter.image.src} alt={chapter.image.alt || ''} loading="lazy" decoding="async" />
          </figure>
        )}
      </Reveal>
    </li>
  );
}

export default function Journey() {
  const listRef = useScrollProgress();
  return (
    <section id="journey" className="section journey" aria-labelledby="journey-title">
      <div className="wrap journey__grid">
        <div className="journey__intro">
          <div className="journey__sticky">
            <Reveal as="p" className="eyebrow">
              <b>04</b>
              <span aria-hidden="true">—</span>
              Journey
            </Reveal>
            <RevealText as="h1" id="journey-title" className="display" text="My *Journey*" />
            <Reveal as="p" className="lede" delay={0.1}>
              Every chapter, and the note I wish someone had given me then.
            </Reveal>
          </div>
        </div>

        <ol ref={listRef} className="chapters">
          {journey.map((c, i) => (
            <Chapter key={c.id} chapter={c} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
