import { useState } from 'react';
import { useOccasion } from '../lib/occasion.js';
import './OccasionBanner.css';

// A small floating greeting on special days (see `occasions` in site.js).
// Closing it hides it for the rest of that visit.
export default function OccasionBanner() {
  const occasion = useOccasion();
  const key = occasion ? `occasion-closed:${occasion.id}:${new Date().toDateString()}` : '';
  const [closed, setClosed] = useState(() => {
    try {
      return key ? sessionStorage.getItem(key) === '1' : false;
    } catch {
      return false;
    }
  });

  if (!occasion || closed) return null;

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      /* private mode: just hide it for now */
    }
  };

  return (
    <aside className={`occasion occasion--${occasion.id}`} role="status" aria-label={occasion.title}>
      <span className="occasion__emoji" aria-hidden="true">
        {occasion.emoji}
      </span>
      <span className="occasion__copy">
        <strong className="occasion__title">{occasion.title}</strong>
        <span className="occasion__text">{occasion.text}</span>
      </span>
      <button type="button" className="occasion__close" onClick={close} aria-label="Close greeting">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  );
}
