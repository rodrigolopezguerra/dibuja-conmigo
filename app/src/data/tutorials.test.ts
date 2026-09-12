/**
 * Fidelity oracle for the tutorial dataset.
 *
 * Reads the ORIGINAL `TUTORIALS` array from an immutable git object — the
 * `legacy-prototype` tag pinned at the pre-migration commit — never from the
 * working tree, because the legacy root `index.html` is deleted in slice 7b.
 * Asserts the typed, per-category split reproduces it byte-for-byte,
 * including gallery order.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

import { VIEW_BOX, COLORS } from '../config';
import type { CategoryId } from '../types';
import { CATEGORIES } from './categories';
import { DIFFICULTIES } from './difficulties';
import { TUTORIALS } from './index';

const PINNED_REF = 'legacy-prototype';
const START = '/* ---------- Categories & difficulty ---------- */';
const END = '/* ---------- State ---------- */';

interface LegacyStep {
  readonly d: string;
}

interface LegacyTutorial {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly category: string;
  readonly difficulty: string;
  readonly steps: readonly LegacyStep[];
}

interface LegacyShape {
  readonly CATEGORIES: readonly { id: string; name: string; emoji: string }[];
  readonly DIFFICULTIES: readonly { id: string; name: string }[];
  readonly TUTORIALS: readonly LegacyTutorial[];
  readonly COLORS: readonly string[];
  readonly VB: string;
}

function readLegacy(): LegacyShape {
  const html = execFileSync('git', ['show', `${PINNED_REF}:index.html`], {
    encoding: 'utf8',
  });
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a < 0 || b < 0) {
    throw new Error(
      `Pinned ref '${PINNED_REF}' is missing the expected markers — is the tag pushed and up to date?`,
    );
  }
  const ctx = createContext({});
  runInContext(
    `${html.slice(a, b)}\n;globalThis.__legacy = { CATEGORIES, DIFFICULTIES, TUTORIALS, COLORS, VB };`,
    ctx,
    { timeout: 1000 },
  );
  return (ctx as { __legacy: LegacyShape }).__legacy;
}

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

const stepsHash = (t: { steps: readonly { d: string }[] }): string =>
  sha256(t.steps.map((s) => s.d).join('\n'));

// ASCII unit/record/group separators between fields so that no
// concatenation of differing field values can ever collide with a
// different set of field values (unlike plain string concatenation).
const UNIT_SEP = '\u001f';
const RECORD_SEP = '\u001e';
const GROUP_SEP = '\u001d';

const canonical = (list: readonly LegacyTutorial[]): string =>
  list
    .map((t) =>
      [
        t.id,
        t.name,
        t.emoji,
        t.category,
        t.difficulty,
        t.steps.map((s) => s.d).join(UNIT_SEP),
      ].join(RECORD_SEP),
    )
    .join(GROUP_SEP);

const CATEGORY_COUNTS: Record<CategoryId, number> = {
  animales: 10,
  naturaleza: 7,
  vehiculos: 4,
  divertidas: 6,
  fantasia: 4,
};

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id).filter((id) => id !== 'todos'));
const DIFFICULTY_IDS = new Set<string>(
  DIFFICULTIES.map((d) => d.id).filter((id) => id !== 'todos'),
);

describe('tutorial dataset fidelity', () => {
  const legacy = readLegacy();

  it('has exactly 31 tutorials', () => {
    expect(TUTORIALS.length).toBe(31);
    expect(legacy.TUTORIALS.length).toBe(31);
  });

  it('matches the exact per-category counts', () => {
    const actual: Record<string, number> = {};
    for (const t of TUTORIALS) {
      actual[t.category] = (actual[t.category] ?? 0) + 1;
    }
    expect(actual).toEqual(CATEGORY_COUNTS);
  });

  it('preserves positional (gallery) order from the legacy array', () => {
    const mismatches: string[] = [];
    for (let i = 0; i < legacy.TUTORIALS.length; i += 1) {
      const expectedId = legacy.TUTORIALS[i]?.id;
      const actualId = TUTORIALS[i]?.id;
      if (expectedId !== actualId) {
        mismatches.push(`index ${i}: expected '${expectedId}', got '${actualId}'`);
      }
    }
    expect(mismatches, mismatches.join('\n')).toEqual([]);
  });

  it('is byte-identical to the pinned legacy source, per tutorial', () => {
    const failures: string[] = [];
    const table: { id: string; expectedHash: string; actualHash: string; match: boolean }[] = [];

    for (let i = 0; i < legacy.TUTORIALS.length; i += 1) {
      const expected = legacy.TUTORIALS[i];
      const actual = TUTORIALS[i];
      if (!expected || !actual) {
        failures.push(`index ${i}: missing tutorial on one side`);
        continue;
      }

      const expectedHash = stepsHash(expected);
      const actualHash = stepsHash(actual);
      const match =
        expected.id === actual.id &&
        expected.name === actual.name &&
        expected.emoji === actual.emoji &&
        expected.category === actual.category &&
        expected.difficulty === actual.difficulty &&
        expected.steps.length === actual.steps.length &&
        expectedHash === actualHash;

      table.push({ id: expected.id, expectedHash, actualHash, match });
      if (!match) {
        failures.push(
          `id='${expected.id}': fields or steps hash mismatch (expected ${expectedHash}, got ${actualHash})`,
        );
      }
    }

    if (failures.length > 0) {
      console.error('Per-tutorial hash table:\n' + JSON.stringify(table, null, 2));
    }

    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('matches one global SHA-256 over the canonical serialization', () => {
    const expectedHash = sha256(canonical(legacy.TUTORIALS));
    const actualHash = sha256(canonical(TUTORIALS as unknown as readonly LegacyTutorial[]));
    expect(
      actualHash,
      `global dataset hash mismatch (expected ${expectedHash}, got ${actualHash})`,
    ).toBe(expectedHash);
  });

  it('matches COLORS and VIEW_BOX exactly', () => {
    expect(COLORS).toEqual(legacy.COLORS);
    expect(VIEW_BOX).toBe(legacy.VB);
  });

  describe('structural invariants', () => {
    it('has unique ids', () => {
      const ids = TUTORIALS.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has non-empty steps for every tutorial', () => {
      for (const t of TUTORIALS) {
        expect(t.steps.length, `tutorial '${t.id}' has no steps`).toBeGreaterThan(0);
      }
    });

    it('has every step "d" starting with "M"', () => {
      for (const t of TUTORIALS) {
        for (const [i, step] of t.steps.entries()) {
          expect(
            step.d.startsWith('M'),
            `tutorial '${t.id}' step ${i} does not start with 'M'`,
          ).toBe(true);
        }
      }
    });

    it('has every category in CATEGORIES', () => {
      for (const t of TUTORIALS) {
        expect(
          CATEGORY_IDS.has(t.category),
          `tutorial '${t.id}' has unknown category '${t.category}'`,
        ).toBe(true);
      }
    });

    it('has every difficulty in DIFFICULTIES', () => {
      for (const t of TUTORIALS) {
        expect(
          DIFFICULTY_IDS.has(t.difficulty),
          `tutorial '${t.id}' has unknown difficulty '${t.difficulty}'`,
        ).toBe(true);
      }
    });

    it('uses the correct VIEW_BOX', () => {
      expect(VIEW_BOX).toBe('0 0 400 400');
    });
  });
});
