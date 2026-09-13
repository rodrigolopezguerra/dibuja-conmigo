/** Shared drawing/UI constants ported verbatim from the legacy `index.html`. */

export const VIEW_BOX = '0 0 400 400';

export const COLORS = [
  '#2B2B2B',
  '#FF6B4A',
  '#FFC93C',
  '#4EA8DE',
  '#4CB963',
  '#B79CED',
  '#8B5A2B',
  '#FFFFFF',
] as const;

export const BRUSH = { min: 2, max: 28, default: 7 } as const;

export const HISTORY_LIMIT = 20;

export const GUIDE = { stroke: '#2B2B2B', active: '#FF6B4A', width: '7', opacity: '0.55' } as const;

// Deliberately different from GUIDE.width — gallery thumbnails and the guide
// SVG must keep distinct stroke widths (see design §1 I5 / §6 parity table).
export const THUMB = { stroke: '#2B2B2B', width: '12' } as const;

export const PLAYBACK = {
  minSec: 0.6,
  maxSec: 2.4,
  unitsPerSec: 260,
  tailMs: 60,
  gapMs: 350,
} as const;

export const TOAST_MS = 1600;

// Bug 3 fix (slice 8): opaque board white (--panel), matching the on-screen
// board. Legacy exported the paper tone (--paper, #FFFBF2) instead — see
// canvas.ts's module doc comment for the full PNG Export Background Fix.
export const EXPORT_BACKGROUND = '#FFFFFF';
