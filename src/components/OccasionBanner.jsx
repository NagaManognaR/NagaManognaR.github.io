import { useState } from 'react';
import './OccasionBanner.css';

/*
 * A small floating greeting: the month's (closed = hidden for the rest of
 * the month) or a special day's (closed = hidden for the rest of the visit).
 * Content lives in src/content/seasons.js.
 */
function storageFor(scope) {
  try {
    return scope === 'month' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export default function OccasionBanner({ greeting, monthKey, dayKey }) {
  const key = greeting
    ? `greeting-closed:${greeting.id}:${greeting.scope === 'month' ? monthKey : dayKey}`
    : '';
  const [closed, setClosed] = useState(() => {
    try {
      return key ? storageFor(greeting.scope)?.getItem(key) === '1' : false;
    } catch {
      return false;
    }
  });

  if (!greeting || closed) return null;

  const close = () => {
    setClosed(true);
    try {
      storageFor(greeting.scope)?.setItem(key, '1');
    } catch {
      /* private mode: just hide it for now */
    }
  };

  return (
    <aside className={`occasion occasion--${greeting.id}`} role="status" aria-label={greeting.title}>
      <span className="occasion__emoji" aria-hidden="true">
        {greeting.emoji}
      </span>
      <span className="occasion__copy">
        <strong className="occasion__title">{greeting.title}</strong>
        <span className="occasion__text">{greeting.text}</span>
      </span>
      <button type="button" className="occasion__close" onClick={close} aria-label="Close greeting">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  );
}
