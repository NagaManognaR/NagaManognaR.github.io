import { Reveal, RevealText } from './Reveal.jsx';

// "01 — About" eyebrow, a large serif title, and an optional intro/aside.
export default function SectionHeader({ index, label, title, intro, aside, id }) {
  return (
    <div className="section-header">
      <div className="section-header__main">
        <Reveal as="p" className="eyebrow">
          <b>{index}</b>
          <span aria-hidden="true">—</span>
          {label}
        </Reveal>
        <RevealText as="h1" className="display" text={title} id={id} delay={0.05} />
      </div>
      {(intro || aside) && (
        <Reveal className="section-header__aside" delay={0.15}>
          {intro && <p className="lede">{intro}</p>}
          {aside}
        </Reveal>
      )}
    </div>
  );
}
