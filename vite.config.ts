import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Phase B (post-slice-7b): app/ has been promoted to the repo root, so
// `root` is no longer needed and `outDir` points at `dist` directly.
// `base: './'` stays unchanged — it is load-bearing for the custom-domain
// root deploy (relative asset paths).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
  plugins: [
    VitePWA({
      // Silent background update: combined with the EMPTY onNeedReload in
      // src/pwa.ts, a new version installs and takes control without ever
      // reloading the page. See src/pwa.ts for the full why.
      registerType: 'autoUpdate',

      // MUST be `null`, NEVER `false`. The plugin forces skipWaiting +
      // clientsClaim only when this is 'auto' or NULLISH (dist/index.js
      // L874-876). `false` is not nullish — the new worker would park in
      // `waiting` forever on a tablet whose tab is never closed, and
      // offline fixes would never reach the device. One character, silent.
      injectRegister: null,

      // KILL SWITCH — uncomment, push to main, wait for the deploy, open the
      // app ONCE on the device, then revert. Ships a worker at the same
      // filename that unregisters itself and purges Cache Storage: the only
      // way to un-brick a tablet serving a broken precache, because a child
      // cannot be talked through DevTools. Deliberately manual, never an env
      // var — see README.
      // selfDestroying: true,

      workbox: {
        // The default is `**/*.{js,css,html}` and EXCLUDES woff2. Leave it
        // and the self-hosted fonts are silently NOT precached: the app
        // still "works" offline, in system sans-serif. Rooted at `outDir`,
        // and `**` crosses directories, so `assets/*.woff2` is matched.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico,webmanifest}'],
        // Explicit, so behaviour does not ride on a plugin default.
        cleanupOutdatedCaches: true,
        // No `runtimeCaching`: this app issues zero runtime network
        // requests, so there is nothing to cache at runtime.
      },

      manifest: {
        name: 'Dibujá Conmigo',
        short_name: 'Dibujá',
        description: 'Elegí un dibujo y aprendé a hacerlo, paso a paso',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        // `orientation` intentionally unset: the workspace grid collapses at
        // 720px (board.css:5-7), both orientations are designed for, and a
        // tablet handed to a child rotates constantly.
        //
        // From styles/tokens.css:2-3. `background_color` is the splash
        // before first paint and must match what the app actually paints
        // (base.css:4). `theme_color` is ink, not paper: cream-on-cream
        // reads as a rendering glitch.
        theme_color: '#2B2B2B',
        background_color: '#FFFBF2',
        icons: [
          { src: './pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: './pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: './pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: './maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
