import { useEffect, useState } from 'react';
import { occasions } from '../content/site.js';

// The occasion for a given day (visitor's local date), if any.
export function occasionFor(date = new Date()) {
  return occasions.find((o) => o.month === date.getMonth() + 1 && o.day === date.getDate()) || null;
}

function current() {
  const preview = new URLSearchParams(window.location.search).get('occasion');
  if (preview) return occasions.find((o) => o.id === preview) || null;
  return occasionFor();
}

// Today's occasion; re-checked at midnight so a page left open rolls over.
export function useOccasion() {
  const [occasion, setOccasion] = useState(current);
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const t = setTimeout(() => setOccasion(current()), midnight - now);
    return () => clearTimeout(t);
  }, [occasion]);
  return occasion;
}
