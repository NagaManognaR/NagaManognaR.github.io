import { hero, site } from '../content/site.js';
import useDocumentMeta from '../lib/useDocumentMeta.js';
import CharacterHero from '../components/CharacterHero.jsx';
import SocialLinks from '../components/SocialLinks.jsx';

// Wide screens: she stands on the right, clear of the text. Narrower screens
// keep the original full-bleed, centred crop.
const placement = (width) => (width > 960 ? { x: 0.7, height: 0.9 } : null);

export default function Home() {
  useDocumentMeta({});
  return (
    <CharacterHero
      id="top"
      nav={[]}
      paintBody={false}
      greeting={hero.greeting}
      name={site.name}
      headline={hero.headline}
      bio={hero.bio}
      actions={hero.actions}
      placement={placement}
      extra={<SocialLinks size={20} />}
      background="var(--glow)"
    />
  );
}
