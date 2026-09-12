import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts on purpose: while `root: 'app'` is set
// there (phase A), Vitest would otherwise resolve `include` against that
// root too. A standalone config keeps test discovery stable across the
// slice-7b phase A -> phase B switch.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['app/src/**/*.test.ts', 'app/styles/**/*.test.ts'],
    // Slice 1 has no test files yet (data/CSS/UI tests land in slices 2-4).
    // Vitest 5 exits non-zero on zero matched tests by default; this keeps
    // `npm run test` green until the first suite is added.
    passWithNoTests: true,
  },
});
