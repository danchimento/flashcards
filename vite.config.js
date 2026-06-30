import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Turn the single inlined `<script type="module">` into a classic script at
// the end of <body>. The bundle is a self-contained IIFE (no import/export),
// so this is safe and lets the file run in restrictive contexts (in-app file
// previews, file:// on mobile) where inline module scripts are blocked.
//
// Moving it to end-of-body matters: classic scripts aren't deferred like module
// scripts, so left in <head> it would run before #root exists.
function classicInlineScript() {
  return {
    name: 'classic-inline-script',
    enforce: 'post',
    // Runs after vite-plugin-singlefile has inlined everything into the file.
    writeBundle(options) {
      const file = join(options.dir || 'dist', 'index.html');
      let html = readFileSync(file, 'utf8');
      const match = html.match(/<script type="module"[^>]*>([\s\S]*?)<\/script>/);
      if (match) {
        // Use function replacements so `$` sequences in the bundled JS aren't
        // treated as special replacement patterns by String.replace.
        html = html.replace(match[0], () => '');
        html = html.replace('</body>', () => `  <script>${match[1]}</script>\n  </body>`);
      }
      writeFileSync(file, html);
    },
  };
}

// `npm run build` emits a single self-contained dist/index.html, which makes
// the game trivial to open anywhere (including on a phone). `npm run dev`
// is the normal Vite dev server for iteration.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), classicInlineScript()],
  build: {
    // Output into docs/ so the built page is committed to the repo and can be
    // served directly (e.g. via a raw-HTML viewer, or GitHub Pages /docs later).
    outDir: 'docs',
    target: 'es2018',
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
      },
    },
  },
});
