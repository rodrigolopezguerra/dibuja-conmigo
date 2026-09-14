import { defineConfig } from 'vite';

// Phase B (post-slice-7b): app/ has been promoted to the repo root, so
// `root` is no longer needed and `outDir` points at `dist` directly.
// `base: './'` stays unchanged — it is load-bearing for the custom-domain
// root deploy (relative asset paths).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
