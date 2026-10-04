import { writing } from '../content/site.js';
import { ArrowIcon, InstagramIcon, MediumIcon, SubstackIcon } from '../components/icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import './Writing.css';

const icons = { medium: MediumIcon, substack: SubstackIcon, instagram: InstagramIcon };

export default function Writing() {
  return (
    <section id="writing" className="section writing" aria-labelledby="writing-title">
      <div className="wrap">
        <SectionHeader index="04" label="Writing" title={writing.title} id="writing-title" />
        <ul className="channels">
          {writing.channels.map((c, i) => {
            const Icon = icons[c.id];
            return (
              <Reveal as="li" key={c.id} delay={i * 0.08} className={`channel channel--${c.id}`}>
                <a className="channel__link" href={c.url} target="_blank" rel="noopener noreferrer">
                  <span className="channel__top">
                    <span className="channel__icon">
                      <Icon size={22} />
                    </span>
                    <span className="channel__name mono">{c.name}</span>
                    {c.badge && <span className="channel__badge mono">{c.badge}</span>}
                  </span>
                  <span className="channel__kind">{c.kind}</span>
                  <span className="channel__text">{c.text}</span>
                  <span className="channel__cta">
                    {c.cta} <ArrowIcon size={14} />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
