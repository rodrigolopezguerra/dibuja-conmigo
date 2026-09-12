import { defineConfig } from 'vite';

// Phase A (slices 1-6): the app lives under `app/` while the legacy root
// `index.html` keeps serving the live site. Slice 7b promotes `app/` to the
// repo root and switches this to phase B (`root` removed, `outDir: 'dist'`).
export default defineConfig({
  root: 'app',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
