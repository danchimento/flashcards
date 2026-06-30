import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` emits a single self-contained dist/index.html, which makes
// the game trivial to open anywhere (including on a phone). `npm run dev`
// is the normal Vite dev server for iteration.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
});
