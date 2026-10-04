import { socials } from '../content/site.js';
import { socialIcons } from './icons.jsx';
import './SocialLinks.css';

/*
 * Icon row for Instagram, LinkedIn, Medium and Substack. A network without a URL
 * yet stays visible but dimmed and inert, so adding the link later is a one-line
 * change in src/content/site.js.
 */
export default function SocialLinks({ size = 20, only, className = '' }) {
  const list = only ? socials.filter((s) => only.includes(s.id)) : socials;
  return (
    <ul className={`social ${className}`.trim()}>
      {list.map(({ id, label, url }) => {
        const Icon = socialIcons[id];
        return (
          <li key={id}>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                <Icon size={size} />
              </a>
            ) : (
              <span className="social-soon" title={`${label}: coming soon`}>
                <Icon size={size} />
                <span className="sr-only">{label} (coming soon)</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
