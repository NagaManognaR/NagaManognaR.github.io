import { links, site } from '../content/site.js';
import { Link } from '../lib/router.jsx';
import { ArrowIcon } from './icons.jsx';
import SocialLinks from './SocialLinks.jsx';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer" data-cursor="light">
      <div className="wrap site-footer__grid">
        <div>
          <Link href="/" className="site-footer__name">
            {site.name}
          </Link>
          <p className="site-footer__role mono">
            {site.role} · {site.company}
          </p>
        </div>

        <p className="site-footer__line">{site.footerLine}</p>

        <div className="site-footer__end">
          <SocialLinks size={18} />
          <a
            className="site-footer__topmate link-line"
            href={links.topmate}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a conversation on Topmate <ArrowIcon size={13} />
          </a>
        </div>
      </div>
      <div className="wrap site-footer__base mono">
        <span>
          © {new Date().getFullYear()} {site.fullName}
        </span>
        <button
          type="button"
          className="link-line site-footer__top"
          onClick={() => window.scrollTo({ top: 0 })}
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
