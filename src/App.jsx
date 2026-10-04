import { useEffect, useRef } from 'react';
import { useLinkInterception, useLocation } from './lib/router.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import MagneticCursor from './components/MagneticCursor.jsx';
import FallingLeaves from './components/FallingLeaves.jsx';
import OccasionBanner from './components/OccasionBanner.jsx';
import { seasonal } from './content/site.js';
import Home from './pages/Home.jsx';
import { AboutPage, ContactPage, JourneyPage, ResearchPage, WritingPage } from './pages/SectionPages.jsx';
import NotFound from './pages/NotFound.jsx';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './sections/sections.css';

const pages = {
  '/': Home,
  '/about': AboutPage,
  '/research': ResearchPage,
  '/writing': WritingPage,
  '/journey': JourneyPage,
  '/contact': ContactPage,
};

function route(pathname) {
  const Page = pages[pathname];
  if (Page) return <Page />;
  return <NotFound />;
}

// After a route change: go to the #section if there is one, otherwise to the top.
function useScrollOnNavigate(pathname, hash) {
  const first = useRef(true);
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (!hash) {
      if (!isFirst) window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    // wait a frame so the new page is in the DOM
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  }, [pathname, hash]);
}

// The page is one app, so tell Google Analytics about each in-app page change
// (the first page view is sent by the gtag snippet in index.html).
function usePageViews(pathname) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);
}

export default function App() {
  const { pathname, hash } = useLocation();
  useScrollOnNavigate(pathname, hash);
  usePageViews(pathname);
  useLinkInterception();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <MagneticCursor />
      {seasonal.leaves && <FallingLeaves />}
      <Header />
      <main id="main" key={pathname} className={`page${pathname === '/' ? ' page--home' : ''}`} tabIndex={-1}>
        {route(pathname)}
      </main>
      <Footer />
      <OccasionBanner />
    </>
  );
}
