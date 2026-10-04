import { useEffect, useRef } from 'react';

/*
 * Scroll-driven motion, kept deliberately small:
 *   useReveal   adds .is-in once an element scrolls into view (one shared observer)
 * It does nothing for people who prefer reduced motion.
 */

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer = null;
function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  return observer;
}

export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = getObserver();
    if (!io || prefersReducedMotion()) {
      el.classList.add('is-in');
      return undefined;
    }
    io.observe(el);
    return () => io.unobserve(el);
  }, []);
  return ref;
}
