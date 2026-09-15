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

describe('service worker precache manifest', () => {
  it('precaches the app shell and exactly 5 latin-only webfonts', () => {
    const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
    const urls = [
      ...sw.matchAll(/["'`]([^"'`\s]+\.(?:js|css|html|woff2|webmanifest|png|ico|svg))["'`]/g),
    ].map((m) => m[1] ?? '');

    expect(urls.some((u) => u.endsWith('index.html'))).toBe(true);
    expect(urls.some((u) => u.endsWith('manifest.webmanifest'))).toBe(true);
    expect(urls.some((u) => u.endsWith('.js'))).toBe(true);
    expect(urls.some((u) => u.endsWith('.css'))).toBe(true);

    const woff2 = urls.filter((u) => u.endsWith('.woff2'));
    expect(woff2, woff2.join('\n')).toHaveLength(5);
    expect(woff2.some((u) => /devanagari|latin-ext|vietnamese|cyrillic|greek/.test(u))).toBe(false);

    // [A, high] exact stem pattern — confirm by listing dist/assets on the
    // first real build; adjust these 5 strings if @fontsource's emitted
    // filenames differ.
    const stems = [
      'baloo-2-latin-700',
      'baloo-2-latin-800',
      'nunito-latin-500',
      'nunito-latin-700',
      'nunito-latin-800',
    ];
    for (const stem of stems) {
      expect(woff2.some((u) => u.includes(stem))).toBe(true);
    }
  });
});

describe('web app manifest', () => {
  it('declares standalone, Spanish-language app matching design tokens', () => {
    const tokensCss = readFileSync(join(ROOT, 'styles/tokens.css'), 'utf8');
    const ink = /--ink:\s*(#[0-9A-Fa-f]{6})/.exec(tokensCss)?.[1] ?? '';
    const paper = /--paper:\s*(#[0-9A-Fa-f]{6})/.exec(tokensCss)?.[1] ?? '';
    expect(ink).not.toBe('');
    expect(paper).not.toBe('');

    const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8')) as {
      lang?: string;
      display?: string;
      name?: string;
      short_name?: string;
      start_url?: string;
      theme_color?: string;
      background_color?: string;
    };

    expect(manifest.lang).toBe('es');
    expect(manifest.display).toBe('standalone');
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.theme_color?.toLowerCase()).toBe(ink.toLowerCase());
    expect(manifest.background_color?.toLowerCase()).toBe(paper.toLowerCase());
  });
});

describe('service worker registration is wired', () => {
  it('exposes a manifest link and registers a service worker', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    expect(html).toMatch(/rel=["']manifest["']/);

    const jsBlobs = readdirSync(join(DIST, 'assets'))
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(DIST, 'assets', f), 'utf8'))
      .join('\n');
    expect(jsBlobs).toMatch(/serviceWorker/);
  });
});

describe('installability assets', () => {
  it('every manifest icon exists in dist and is precached, plus platform icons', () => {
    const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8')) as {
      icons?: Array<{ src: string; purpose?: string }>;
    };
    const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');

    expect(manifest.icons?.length ?? 0).toBeGreaterThan(0);
    expect(manifest.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);

    for (const icon of manifest.icons ?? []) {
      const rel = icon.src.replace(/^\.\//, '');
      expect(existsSync(join(DIST, rel))).toBe(true);
      expect(sw).toContain(rel);
    }

    for (const file of ['apple-touch-icon-180x180.png', 'favicon.ico', 'logo.svg']) {
      expect(existsSync(join(DIST, file))).toBe(true);
    }
  });
});
