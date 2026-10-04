import { useEffect } from 'react';
import { site } from '../content/site.js';

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
}

// Keeps <title>, the description and the social-card tags in step with the page.
export default function useDocumentMeta({ title, description, path = '/' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${site.name}` : `${site.name} · ${site.role} at ${site.company}`;
    const desc = description || site.description;
    const url = site.domain + path;
    document.title = fullTitle;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('link[rel="canonical"]', 'href', url);
  }, [title, description, path]);
}
