import { useEffect, useRef, useState } from 'react';
import { links, nav, site } from '../content/site.js';
import { Link, useLocation } from '../lib/router.jsx';
import { ArrowIcon, InstagramIcon } from './icons.jsx';
import SocialLinks from './SocialLinks.jsx';
import './Header.css';

/*
 * Sticky header. Over the red hero on the home page it's transparent with white
 * ink; on every other page it's a blurred paper bar.
 * On small screens the links move into a full-screen menu.
 */
export default function Header() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [overHero, setOverHero] = useState(isHome);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  // over the hero?
  useEffect(() => {
    if (!isHome) {
      setOverHero(false);
      return undefined;
    }
    const hero = document.getElementById('top');
    if (!hero) return undefined;
    const io = new IntersectionObserver(([e]) => setOverHero(e.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
      threshold: 0,
    });
    io.observe(hero);
    return () => io.disconnect();
  }, [isHome]);

  // mobile menu: lock scroll, close on Escape, move focus in and back out
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector('a')?.focus();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      toggleRef.current?.focus();
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href) => (href === '/' ? isHome : pathname.startsWith(href));
  const light = overHero && !open;

  return (
    <header
      className={`site-header${light ? ' is-over-hero' : ''}${open ? ' is-open' : ''}`}
      data-cursor={open ? 'light' : 'dark'}
    >
      <div className="site-header__bar">
        <Link href="/" className="brand" aria-label={`${site.name}, home`}>
          <span className="brand__mark" aria-hidden="true">
            M
          </span>
          <span className="brand__name">{site.name}</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`site-nav__link${isActive(item.href) ? ' is-active' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__end">
          <a
            className="site-header__icon"
            href={links.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="The Data Girl Journal on Instagram"
          >
            <InstagramIcon size={19} />
          </a>
          <a
            className="pill-btn"
            href={links.topmate}
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic
          >
            Let’s talk <ArrowIcon size={14} />
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span className="menu-toggle__lines" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id="mobile-menu" ref={menuRef} className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile">
          <ol>
            {nav.map((item, i) => (
              <li key={item.href} style={{ '--i': i }}>
                <Link href={item.href} onClick={() => setOpen(false)}>
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mobile-menu__foot">
          <a
            className="pill-btn pill-btn--light"
            href={links.topmate}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a conversation <ArrowIcon size={14} />
          </a>
          <SocialLinks />
        </div>
      </div>
    </header>
  );
}
