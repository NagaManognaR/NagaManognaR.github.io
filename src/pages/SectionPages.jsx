import { writing } from '../content/site.js';
import useDocumentMeta from '../lib/useDocumentMeta.js';
import About from '../sections/About.jsx';
import Research from '../sections/Research.jsx';
import Writing from '../sections/Writing.jsx';
import Journey from '../sections/Journey.jsx';
import Contact from '../sections/Contact.jsx';

// One page per section. `path` feeds the canonical URL.

export function AboutPage() {
  useDocumentMeta({ title: 'About', path: '/about' });
  return <About />;
}

export function ResearchPage() {
  useDocumentMeta({
    title: 'Research',
    description: 'Research papers on human–AI interaction and AI in education (ACM CSCW 2026, AIED 2026).',
    path: '/research',
  });
  return <Research />;
}

export function WritingPage() {
  useDocumentMeta({ title: 'Writing', description: writing.description, path: '/writing' });
  return <Writing />;
}

export function JourneyPage() {
  useDocumentMeta({ title: 'Journey', path: '/journey' });
  return <Journey />;
}

export function ContactPage() {
  useDocumentMeta({ title: 'Contact', path: '/contact' });
  return <Contact />;
}
