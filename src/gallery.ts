/**
 * Gallery card rendering — ported verbatim from the legacy `thumbSVG()`
 * (index.html:500-504), `diffDots()` (505-513), and `renderGallery()`
 * (514-533). Receives an already-filtered list (filtering itself lives in
 * `filters.ts`, kept pure and DOM-free).
 *
 * PARITY (non-goal, intentional): gallery thumbnails use `stroke-width: 12`
 * with no opacity. The guide SVG (slice 5) uses `stroke-width: 7` with
 * `opacity: 0.55`. These are deliberately different — do not unify them.
 */
import type { DifficultyId, Tutorial } from './types';
import { THUMB, VIEW_BOX } from './config';

export interface GalleryOptions {
  root: HTMLElement;
  onSelect(id: string): void;
}

export interface Gallery {
  render(tutorials: readonly Tutorial[], currentId: string): void;
}

const DIFFICULTY_LEVELS: Record<DifficultyId, number> = { facil: 1, medio: 2, dificil: 3 };

function thumbSVG(tutorial: Tutorial): string {
  const paths = tutorial.steps
    .map(
      (step) =>
        `<path d="${step.d}" fill="none" stroke="${THUMB.stroke}" stroke-width="${THUMB.width}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  return `<svg viewBox="${VIEW_BOX}">${paths}</svg>`;
}

function diffDots(difficulty: DifficultyId): string {
  const n = DIFFICULTY_LEVELS[difficulty];
  let html = '';
  for (let i = 1; i <= 3; i += 1) {
    html += `<i class="${i <= n ? 'on ' + difficulty : ''}"></i>`;
  }
  return `<div class="diff-dots">${html}</div>`;
}

export function createGallery(options: GalleryOptions): Gallery {
  function render(tutorials: readonly Tutorial[], currentId: string): void {
    options.root.innerHTML = '';

    if (tutorials.length === 0) {
      options.root.innerHTML =
        '<div class="empty-msg">No hay dibujos con esos filtros. ¡Probá otra combinación!</div>';
      return;
    }

    tutorials.forEach((tutorial) => {
      const card = document.createElement('div');
      card.className = 'tut-card' + (tutorial.id === currentId ? ' active' : '');
      card.innerHTML =
        thumbSVG(tutorial) +
        `<span class="tname">${tutorial.emoji} ${tutorial.name}</span>` +
        diffDots(tutorial.difficulty);
      card.addEventListener('click', () => options.onSelect(tutorial.id));
      options.root.appendChild(card);
    });
  }

  return { render };
}
