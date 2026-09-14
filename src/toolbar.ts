/**
 * Drawing tool settings — ported verbatim from the legacy `renderColors()`,
 * brush-size input, and eraser toggle (index.html:660-685). Owns `color`,
 * `isEraser`, and `size`; exposes them read-only via `getDrawSettings()`.
 * Does NOT import `canvas.ts` — undo/clear/save leave as callbacks so
 * `toolbar.ts` and `canvas.ts` never reference each other (design §2).
 */
import type { DrawSettings } from './types';
import { BRUSH, COLORS } from './config';

export interface ToolbarElements {
  colors: HTMLElement;
  brushSize: HTMLInputElement;
  eraserBtn: HTMLButtonElement;
  undoBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
  saveBtn: HTMLButtonElement;
}

export interface ToolbarCallbacks {
  onUndo(): void;
  onClear(): void;
  onSave(): void;
}

export interface Toolbar {
  getDrawSettings(): DrawSettings;
}

export function createToolbar(elements: ToolbarElements, callbacks: ToolbarCallbacks): Toolbar {
  let color: string = COLORS[0];
  let isEraser = false;
  let size: number = BRUSH.default;

  function renderColors(): void {
    elements.colors.innerHTML = '';
    COLORS.forEach((c) => {
      const swatch = document.createElement('button');
      swatch.className = 'swatch' + (c === color && !isEraser ? ' selected' : '');
      swatch.style.background = c;
      if (c === '#FFFFFF') swatch.style.boxShadow = 'inset 0 0 0 2px #ddd';
      swatch.addEventListener('click', () => {
        color = c;
        isEraser = false;
        elements.eraserBtn.classList.remove('active');
        renderColors();
      });
      elements.colors.appendChild(swatch);
    });
  }

  elements.brushSize.addEventListener('input', (e) => {
    size = parseInt((e.target as HTMLInputElement).value, 10);
  });

  elements.eraserBtn.addEventListener('click', () => {
    isEraser = !isEraser;
    elements.eraserBtn.classList.toggle('active', isEraser);
    renderColors();
  });

  elements.undoBtn.addEventListener('click', () => callbacks.onUndo());
  elements.clearBtn.addEventListener('click', () => callbacks.onClear());
  elements.saveBtn.addEventListener('click', () => callbacks.onSave());

  // Accepted non-observable deviation from the legacy `init()` sequencing:
  // swatches render here, at construction time, rather than inside a later
  // init() call. Nothing paints before the first frame either way.
  renderColors();

  function getDrawSettings(): DrawSettings {
    return { color, isEraser, size };
  }

  return { getDrawSettings };
}
