import { useEffect, useSyncExternalStore } from 'react';

/*
 * A tiny History-API router: one page per section plus article pages, which
 * doesn't justify a dependency.
 * GitHub Pages serves 404.html for unknown paths; the build copies index.html
 * there so deep links like /writing/my-post still boot the app.
 */

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') window.addEventListener('popstate', emit);

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => window.location.pathname + window.location.hash;

export function useLocation() {
  const href = useSyncExternalStore(subscribe, snapshot);
  const url = new URL(href, window.location.origin);
  return { pathname: url.pathname.replace(/\/+$/, '') || '/', hash: url.hash };
}

export function navigate(to) {
  if (to === snapshot()) {
    emit(); // same URL: still let listeners re-scroll to the hash
    return;
  }
  window.history.pushState({}, '', to);
  emit();
}

const isInternal = (href) => href && (href.startsWith('/') || href.startsWith('#')) && !href.startsWith('//');

/*
 * <Link> behaves like <a>: external URLs open in a new tab, internal ones are
 * routed client-side. A bare '#section' only works on the home page, so it's
 * resolved against '/'.
 */
export function Link({ href, external, children, onClick, ...rest }) {
  if (!href) return <span {...rest}>{children}</span>;

  if (external || !isInternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  const to = href.startsWith('#') ? `/${href}` : href;
  const handle = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

// Plain <a href="/about"> elements (e.g. inside the hero) get client-side routing too.
export function useLinkInterception() {
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.target || a.hasAttribute('download') || a.getAttribute('href').startsWith('#')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
      navigate(url.pathname + url.hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
