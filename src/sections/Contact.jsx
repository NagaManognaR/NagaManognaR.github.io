import { contact, links } from '../content/site.js';
import { ArrowIcon, CalendarIcon } from '../components/icons.jsx';
import { Reveal, RevealText } from '../components/Reveal.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import './Contact.css';

export default function Contact() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <Reveal as="p" className="eyebrow contact__eyebrow">
          <b>05</b>
          <span aria-hidden="true">—</span>
          Contact
        </Reveal>
        <RevealText as="h1" id="contact-title" className="contact__title" text={contact.headline} />
        <div className="contact__row">
          <Reveal className="contact__actions" delay={0.2}>
            <a
              className="contact__cta"
              data-magnetic
              href={links.topmate}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CalendarIcon />
              {contact.cta}
              <ArrowIcon size={16} />
            </a>
            <SocialLinks size={22} className="contact__social" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
