import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The .mp4 files in public/ are only sources for scripts/extract_frames.py. The page
// never loads them, so keep them out of the deployed build.
// Each page gets its own real HTML file (e.g. dist/about/index.html), so GitHub
// Pages answers 200 instead of 404 and link previews / search engines see the
// right title and description without running JavaScript. 404.html is a copy of
// index.html so any other path still boots the app, which shows "not found".
const SITE = 'https://manogna-rayasam.me';
const PAGES = {
  about: ['About', 'How a curious undergrad became a Data Scientist at Microsoft, and the space I wish I had.'],
  research: ['Research', 'Research on human–AI interaction and AI in education: ACM CSCW 2026 Best Paper and AIED 2026.'],
  writing: ['Writing', 'Essays on Medium, a weekly interview series on Substack, and visual notes on Instagram.'],
  journey: ['Journey', 'Every chapter of my data science journey, and the note I wish someone had given me then.'],
  contact: ['Contact', 'Let’s talk data, research, careers, or ideas. Book a free conversation on Topmate.'],
};

function pageHtml(html, slug, [title, description]) {
  const full = `${title} · Manogna Rayasam`;
  const url = `${SITE}/${slug}`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${full}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*/, `$1${description}`)
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*/, `$1${full}`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*/, `$1${description}`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*/, `$1${url}`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*/, `$1${url}`);
}

function pagesBuild() {
  let outDir = 'dist';
  return {
    name: 'pages-build',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const f of readdirSync(outDir)) {
        if (f.endsWith('.mp4')) rmSync(resolve(outDir, f), { force: true });
      }
      const index = resolve(outDir, 'index.html');
      copyFileSync(index, resolve(outDir, '404.html'));
      const html = readFileSync(index, 'utf8');
      for (const [slug, meta] of Object.entries(PAGES)) {
        mkdirSync(resolve(outDir, slug), { recursive: true });
        writeFileSync(resolve(outDir, slug, 'index.html'), pageHtml(html, slug, meta));
      }
    },
  };
}

// manogna-rayasam.me is a custom domain on a user site, so the base is '/'.
export default defineConfig({
  plugins: [react(), pagesBuild()],
  base: '/',
});
