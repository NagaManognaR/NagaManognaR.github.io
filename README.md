# manogna-rayasam.me

Personal site of Manogna Rayasam: Data Scientist, researcher, storyteller.
Vite + React, no UI framework. The cursor-tracking portrait hero and the magnetic
cursor are the same components as the `character-hero` project.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # serve the production build
```

## Updating content

Everything you'd want to change lives in `src/content/`. You never need to open a component.

| What                                       | File                                   |
| ------------------------------------------ | -------------------------------------- |
| Name, hero text, About, contact copy       | `src/content/site.js`                  |
| Social links                               | `src/content/site.js` → `links`        |
| Research papers and their URLs             | `src/content/research.js`              |
| Writing page (Medium, Substack, Instagram) | `src/content/site.js` → `writing`      |
| Journey chapters                           | `src/content/journey.js`               |

Each file starts with a comment listing its fields.

**Writing.** The Writing page has three cards, one per channel: Medium for
ideas and essays, Substack for the weekly interview series, and Instagram for
visual notes. Edit their text and links in `writing` in `site.js`.

**Images.** Journey chapters accept `image: { src, alt }`. Put the
files under `public/images/`.

## Before launch: checklist

- [ ] `contribution` on both papers, plus `paperUrl` for the CSCW paper (swap the lnkd.in links for DOIs)
- [ ] Rewrite the Journey stories in your own words and add years

## Structure

```
src/
  content/      text, links, lists (edit these)
  lib/          router, content helpers, scroll motion, <title>/meta
  components/   CharacterHero, MagneticCursor, Header, Footer, cards, DataGlyph, icons
  sections/     About, Research, Writing, Journey, Contact
  pages/        Home (hero), SectionPages (one page per section), NotFound
```

- **Hero.** `CharacterHero` was ported unchanged: same frames, loop and cover-fit.
  Its copy block now takes `headline` and `actions` props, and `nav={[]}` hides its
  own pill nav so the site header can take over. The frames come from
  `public/character_latest.mp4`; re-bake them with `npm run frames` (the eight
  directions are picked by frame number in `package.json`, and
  `--keep-background` keeps the wall's natural shading). The hero takes its
  background colour from the video, and fades the photo's edges into it.
  `placement` in `src/pages/Home.jsx` sets where she stands on wide screens.
  (`scripts/key_frames.py` can cut out a flat, saturated backdrop if a future
  video has one.)
- **Cursor.** `MagneticCursor` shows the original white glow over dark or red
  sections and an ink version over paper. Sections opt in with
  `data-cursor="light" | "dark"`.
- **Pages.** Each section is its own page: `/about`, `/research`, `/writing`
  (Medium, Substack and Instagram), `/journey`, `/contact`. The home page is the hero.
  To add or reorder pages, edit `nav` in `site.js` and the `pages` map in `src/App.jsx`.
- **Routing.** A small History-API router (`src/lib/router.jsx`). The build
  copies `index.html` to `404.html` so GitHub Pages can serve deep links.
- **Motion.** Reveal-on-scroll, word-by-word headings and a scroll-linked journey
  timeline. All of it is disabled when the OS
  asks for reduced motion.
- **SEO.** Per-page `<title>`/description/canonical, Open Graph image
  (`public/og.jpg`), Person JSON-LD, `robots.txt` and `sitemap.xml`.
  Add new pages to `public/sitemap.xml`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds on every push to `main`. In the repo, go to
Settings → Pages and set the source to **GitHub Actions**. Keep `public/CNAME`
(`manogna-rayasam.me`) so the custom domain survives each deploy.
