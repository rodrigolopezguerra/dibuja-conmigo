/**
 * Build-output assertions. These run against the EXACT `dist/` that
 * .github/workflows/deploy.yml uploads — not a separate build — so they
 * verify the artifact that actually ships.
 *
 * Run via `npm run test:build` AFTER `npm run build`. Not matched by
 * vitest.config.ts's `include`, so `npm test` stays fast and dist-free.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const cssFiles = (): string[] =>
  readdirSync(join(DIST, 'assets'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => join('assets', f));

beforeAll(() => {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error('dist/ not found — run `npm run build` before `npm run test:build`.');
  }
});

describe('self-hosted fonts', () => {
  it('references no Google Fonts domain in shipped HTML or CSS', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    const cssBlobs = cssFiles().map((f) => readFileSync(join(DIST, f), 'utf8'));
    const haystack = [html, ...cssBlobs].join('\n');
    expect(haystack).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });
});
