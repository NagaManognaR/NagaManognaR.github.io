import { useEffect, useState } from 'react';
import { months, occasions, seasonSettings } from '../content/seasons.js';

/*
 * What the calendar says today: the month's season, its falling particles,
 * its greeting, and any special day. Preview overrides in the address bar:
 * ?date=YYYY-MM-DD, ?month=N, ?occasion=id (see src/content/seasons.js).
 */

function today() {
  const q = new URLSearchParams(window.location.search);
  const date = q.get('date');
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
  }
  const month = Number(q.get('month'));
  if (month >= 1 && month <= 12) return new Date(new Date().getFullYear(), month - 1, 15, 12);
  return new Date();
}

function occasionOn(date) {
  const q = new URLSearchParams(window.location.search).get('occasion');
  if (q) return occasions.find((o) => o.id === q) || null;
  const m = date.getMonth() + 1;
  return (
    occasions.find((o) => {
      if (o.month !== m) return false;
      const day = typeof o.day === 'function' ? o.day(date.getFullYear()) : o.day;
      return day === date.getDate();
    }) || null
  );
}

export function seasonFor(date = today()) {
  const m = months.find((x) => x.month === date.getMonth() + 1);
  const occasion = occasionOn(date);
  return {
    key: `${date.getFullYear()}-${date.getMonth() + 1}`,
    dayKey: date.toDateString(),
    season: seasonSettings.colors ? m.season : null,
    accent: seasonSettings.colors ? m.accent || null : null,
    particles: seasonSettings.particles ? m.particles : null,
    // a special day wins over the month's greeting
    greeting: !seasonSettings.greetings
      ? null
      : occasion
        ? { ...occasion, scope: 'day' }
        : { id: `month-${m.month}`, ...m.greeting, scope: 'month' },
  };
}

// Puts the season's colours on <html> (also called once before the first paint).
export function applySeason(s) {
  const root = document.documentElement;
  if (s.season) root.dataset.season = s.season;
  else delete root.dataset.season;
  for (const prop of ['--accent', '--accent-ink']) {
    if (s.accent) root.style.setProperty(prop, s.accent);
    else root.style.removeProperty(prop);
  }
}

// Today's season; re-checked just after midnight so an open page rolls over.
export function useSeason() {
  const [s, setS] = useState(() => seasonFor());
  useEffect(() => {
    applySeason(s);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const t = setTimeout(() => setS(seasonFor()), midnight - now);
    return () => clearTimeout(t);
  }, [s]);
  return s;
}
