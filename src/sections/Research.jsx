import { me, papers } from '../content/research.js';
import { ArrowIcon } from '../components/icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import './Research.css';

function Authors({ names }) {
  return (
    <p className="paper__authors">
      {names.map((n, i) => (
        <span key={n}>
          {me.includes(n) ? <strong>{n}</strong> : n}
          {i < names.length - 1 ? ', ' : ''}
        </span>
      ))}
    </p>
  );
}

function PaperCard({ paper, index }) {
  const titleId = `paper-${paper.id}`;
  return (
    <Reveal delay={index * 0.1} className="paper-slot">
      <article className="paper" aria-labelledby={titleId}>
        <header className="paper__meta">
          <span className="paper__index mono" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="mono">
            {paper.venue} <span aria-hidden="true">·</span> {paper.year}
          </span>
          {paper.award && (
            <span className="paper__award">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  d="M12 2.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.5l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
                  fill="currentColor"
                />
              </svg>
              {paper.award}
            </span>
          )}
        </header>

        <h3 id={titleId} className="paper__title">
          {paper.title}
        </h3>
        <Authors names={paper.authors} />
        <p className="paper__summary">{paper.summary}</p>

        <p className="paper__role">
          <strong>{paper.role}</strong>
          {paper.contribution && <> · {paper.contribution}</>}
          <span className="paper__areas"> · {paper.areas.join(', ')}</span>
        </p>

        <div className="paper__actions">
          {paper.paperUrl && (
            <a
              className="text-btn text-btn--solid"
              href={paper.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Paper <ArrowIcon size={14} />
              <span className="sr-only">: {paper.title}</span>
            </a>
          )}
          {paper.learnMoreUrl && (
            <a
              className="text-btn text-btn--quiet"
              href={paper.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More <ArrowIcon size={14} />
              <span className="sr-only">about {paper.title}</span>
            </a>
          )}
        </div>
      </article>
    </Reveal>
  );
}

export default function Research() {
  return (
    <section id="research" className="section section--tint research" aria-labelledby="research-title">
      <div className="wrap">
        <SectionHeader
          index="02"
          label="Research"
          title="Studying how people *experience* AI."
          id="research-title"
        />
        <div className="papers">
          {papers.map((p, i) => (
            <PaperCard key={p.id} paper={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
