import { copyFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The .mp4 files in public/ are only sources for scripts/extract_frames.py. The page
// never loads them, so keep them out of the deployed build.
// GitHub Pages serves 404.html for unknown paths: making it a copy of index.html
// lets deep links like /writing/my-post boot the app, which then routes them.
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
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

// manogna-rayasam.me is a custom domain on a user site, so the base is '/'.
export default defineConfig({
  plugins: [react(), pagesBuild()],
  base: '/',
});
