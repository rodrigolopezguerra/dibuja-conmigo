import { defineConfig } from 'vitest/config';

// Build-output tests, deliberately a SECOND config so that
// `vitest.config.ts` — and therefore `npm test` — never needs `dist/` to
// exist and stays fast. `test/` is outside the main config's `include`, so
// no `exclude` is required here, which matters: in Vitest, setting `exclude`
// REPLACES the defaults (`**/node_modules/**`, `**/dist/**`).
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['test/**/*.test.ts'],
    // The OPPOSITE of vitest.config.ts, on purpose. If this suite is ever
    // renamed or moved out of the glob, `npm run test:build` must FAIL —
    // not pass green with zero tests.
    passWithNoTests: false,
  },
});
