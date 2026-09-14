import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts: this survived the slice-7b phase A ->
// phase B switch unaffected, since `root` was only ever set in vite.config.ts.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'styles/**/*.test.ts'],
    // Vitest 5 exits non-zero on zero matched tests by default; this keeps
    // `npm run test` green if a future refactor briefly leaves no suites.
    passWithNoTests: true,
  },
});
