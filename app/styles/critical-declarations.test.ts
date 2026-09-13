import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Guards the two mobile-critical declarations (design §7): losing either one
// silently breaks touch drawing on tablets, so this must fail loudly if the
// CSS split ever drops them.
const boardCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'board.css'), 'utf-8');

describe('critical CSS declarations survive the styles split', () => {
  it('keeps touch-action:none on .board', () => {
    expect(boardCss).toContain('touch-action:none');
  });

  it('keeps pointer-events:none on .board svg', () => {
    expect(boardCss).toContain('pointer-events:none');
  });
});
