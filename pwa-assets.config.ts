/**
 * Recipe for the PWA icon set. NOT a build input — nothing in `npm run build`
 * reads this file.
 *
 * Regenerate after changing `public/logo.svg`:
 *     npx @vite-pwa/assets-generator@2.0.0
 *
 * `@vite-pwa/assets-generator` is deliberately NOT a devDependency: it pulls
 * `sharp`, a heavy platform-specific native binary, into every `npm ci` in
 * CI, to produce artifacts that change approximately never. The generated
 * PNGs and favicon.ico are committed to `public/` instead, so the build stays
 * deterministic and `.github/workflows/deploy.yml` needs no change.
 *
 * This file is intentionally ABSENT from `tsconfig.json`'s `include`: the
 * package is not installed, so `tsc --noEmit` would fail TS2307 and break
 * `npm run build`. ESLint does not need it there — this repo configures no
 * type-aware rules (eslint.config.js uses `recommended`, not
 * `recommendedTypeChecked`), so ESLint never resolves modules.
 */
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
});
