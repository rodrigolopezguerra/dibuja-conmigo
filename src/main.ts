/**
 * Composition root. Sole owner of *shared* mutable state (`currentTutId`,
 * `filters`) — see design §1 (I3). Feature modules never import each other;
 * every wire-up happens here (design §2, §11).
 *
 * Slice 6: wires `canvas.ts` — the app is fully functional end-to-end.
 * `toolbar` is constructed before `board` and receives lazy `() => board.…`
 * arrows; `board` receives `toolbar.getDrawSettings` directly. That one lazy
 * edge is what breaks the mutual reference without either module importing
 * the other (design §2, §11).
 */
import '../styles/index.css';

import type { FilterState } from './filters';
import type { Tutorial } from './types';
import { TUTORIALS } from './data';
import { createDrawingCanvas } from './canvas';
import { createFilterBar, filterTutorials } from './filters';
import { createGallery } from './gallery';
import { createGuide } from './guide';
import { createToast } from './toast';
import { createToolbar } from './toolbar';
import { registerPwa } from './pwa';

function requireEl<T extends Element>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id);
  if (!(node instanceof ctor)) throw new Error(`Missing or wrong element: #${id}`);
  return node;
}

const el = {
  toast: requireEl('toast', HTMLDivElement),
  categoryFilters: requireEl('category-filters', HTMLDivElement),
  difficultyFilters: requireEl('difficulty-filters', HTMLDivElement),
  gallery: requireEl('gallery', HTMLElement),
  board: requireEl('board', HTMLDivElement),
  canvas: requireEl('draw-canvas', HTMLCanvasElement),
  guideSvg: requireEl('guide-svg', SVGSVGElement),
  stepDots: requireEl('step-dots', HTMLDivElement),
  playBtn: requireEl('play-btn', HTMLButtonElement),
  prevStep: requireEl('prev-step', HTMLButtonElement),
  nextStep: requireEl('next-step', HTMLButtonElement),
  guideToggle: requireEl('guide-toggle', HTMLInputElement),
  colors: requireEl('colors', HTMLDivElement),
  brushSize: requireEl('brush-size', HTMLInputElement),
  eraserBtn: requireEl('eraser-btn', HTMLButtonElement),
  undoBtn: requireEl('undo-btn', HTMLButtonElement),
  clearBtn: requireEl('clear-btn', HTMLButtonElement),
  saveBtn: requireEl('save-btn', HTMLButtonElement),
};

let currentTutId: string = TUTORIALS[0]?.id ?? '';
let filters: FilterState = { category: 'todos', difficulty: 'todos' };

function currentTutorial(): Tutorial {
  const tutorial = TUTORIALS.find((t) => t.id === currentTutId);
  if (!tutorial) throw new Error(`Unknown tutorial: ${currentTutId}`);
  return tutorial;
}

const toast = createToast(el.toast);

const filterBar = createFilterBar({
  categoryRow: el.categoryFilters,
  difficultyRow: el.difficultyFilters,
  onChange(next) {
    filters = next;
    filterBar.render(filters);
    renderGallery();
  },
});

const gallery = createGallery({ root: el.gallery, onSelect: selectTutorial });

const guide = createGuide({
  svg: el.guideSvg,
  dots: el.stepDots,
  playBtn: el.playBtn,
  prevBtn: el.prevStep,
  nextBtn: el.nextStep,
  toggle: el.guideToggle,
});

const toolbar = createToolbar(
  {
    colors: el.colors,
    brushSize: el.brushSize,
    eraserBtn: el.eraserBtn,
    undoBtn: el.undoBtn,
    clearBtn: el.clearBtn,
    saveBtn: el.saveBtn,
  },
  {
    onUndo() {
      board.undo();
    },
    onClear() {
      board.clear(true);
    },
    onSave() {
      board.exportPng();
    },
  },
);

const board = createDrawingCanvas({
  canvas: el.canvas,
  board: el.board,
  getDrawSettings: toolbar.getDrawSettings,
  notify: toast.show,
  getExportName: () => currentTutorial().name,
});

function renderGallery(): void {
  gallery.render(filterTutorials(TUTORIALS, filters), currentTutId);
}

function selectTutorial(id: string): void {
  currentTutId = id;
  renderGallery();
  guide.load(currentTutorial());
  board.clear(false);
  toast.show(`Nuevo dibujo: ${currentTutorial().name}`);
}

// PARITY: legacy init order — fitCanvas, filters, gallery, colors, guide
// (index.html:769-775). Colors are already rendered at toolbar
// construction time (see toolbar.ts's documented accepted deviation).
function init(): void {
  board.fit();
  filterBar.render(filters);
  renderGallery();
  guide.load(currentTutorial());
}

// PARITY: double-init, verbatim (legacy index.html:778-779). Deferred module
// execution runs after parsing and before `load`, so this still fires
// `init()` exactly once under Vite's `type="module"` script loading.
window.addEventListener('load', init);
if (document.readyState === 'complete') init();

// Platform-level side effect, deliberately last: not shared state, not a
// module wire-up. See src/pwa.ts for why the update is silent.
registerPwa();
