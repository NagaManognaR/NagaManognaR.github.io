import { createElement } from 'react';
import { useReveal } from '../lib/motion.js';

// Fades and lifts its children in the first time they scroll into view.
export function Reveal({ as = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useReveal();
  return createElement(
    as,
    {
      ref,
      className: `reveal ${className}`.trim(),
      style: { ...style, '--delay': `${delay}s` },
      ...rest,
    },
    children,
  );
}

/*
 * Word-by-word reveal for headings. `text` is plain text; wrap a phrase in
 * *asterisks* to set it in the accent italic.
 */
export function RevealText({ as = 'h2', text, delay = 0, className = '', ...rest }) {
  const ref = useReveal();
  let inEm = false;
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((raw, i) => {
      const emphasis = inEm || raw.startsWith('*');
      if ((raw.match(/\*/g) || []).length % 2) inEm = !inEm;
      const inner = <span style={{ '--i': i }}>{raw.replace(/\*/g, '')}</span>;
      return [
        i ? ' ' : null,
        <span className="w" key={i}>
          {emphasis ? <em>{inner}</em> : inner}
        </span>,
      ];
    });
  return createElement(
    as,
    {
      ref,
      className: `reveal-words ${className}`.trim(),
      style: { '--delay': `${delay}s` },
      'aria-label': text.replace(/\*/g, ''),
      ...rest,
    },
    <span aria-hidden="true">{words}</span>,
  );
}
