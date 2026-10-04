import { about } from '../content/site.js';
import { Reveal } from '../components/Reveal.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import './About.css';

// **bold** inside a story line
function Rich({ text }) {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .map((part, i) => (part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
}

export default function About() {
  const { ask } = about;
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="wrap about__wrap">
        <SectionHeader index="01" label="About" title={about.title} id="about-title" />
        <div className="about__story">
          {about.story.map((line, i) => (
            <Reveal as="p" key={line} delay={Math.min(i * 0.06, 0.3)}>
              <Rich text={line} />
            </Reveal>
          ))}
          <Reveal as="p" className="about__ask" delay={0.3}>
            {ask.text}{' '}
            <a className="about__ask-link" href={ask.href} target="_blank" rel="noopener noreferrer">
              {ask.link}
            </a>
            {ask.rest}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
