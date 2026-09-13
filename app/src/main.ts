/**
 * Composition root. Sole owner of *shared* mutable state (`currentTutId`,
 * `filters`) — see design §1 (I3). Feature modules never import each other;
 * every wire-up happens here (design §2, §11).
 *
 * Slice 4 skeleton: wires toast/filters/gallery/toolbar only. `guide.ts`
 * (slice 5) and `canvas.ts` (slice 6) are not implemented yet — the seams
 * they will plug into are marked with `TODO(slice N)` comments below.
 */
import '../styles/index.css';

import type { FilterState } from './filters';
import type { Tutorial } from './types';
import { TUTORIALS } from './data';
import { createFilterBar, filterTutorials } from './filters';
import { createGallery } from './gallery';
import { createToast } from './toast';
import { createToolbar } from './toolbar';

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

// TODO(slice 6): pass `getDrawSettings: toolbar.getDrawSettings` into
// `createDrawingCanvas`, and wire onUndo/onClear/onSave to the real board.
createToolbar(
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
      // TODO(slice 6): board.undo()
    },
    onClear() {
      // TODO(slice 6): board.clear(true)
    },
    onSave() {
      // TODO(slice 6): board.exportPng()
    },
  },
);

function renderGallery(): void {
  gallery.render(filterTutorials(TUTORIALS, filters), currentTutId);
}

function selectTutorial(id: string): void {
  currentTutId = id;
  renderGallery();
  // TODO(slice 5): guide.load(currentTutorial())
  // TODO(slice 6): board.clear(false)
  toast.show(`Nuevo dibujo: ${currentTutorial().name}`);
}

function init(): void {
  filterBar.render(filters);
  renderGallery();
  // TODO(slice 6): board.fit()
  // TODO(slice 5): guide.load(currentTutorial())
}

// PARITY: double-init, verbatim (legacy index.html:778-779). Deferred module
// execution runs after parsing and before `load`, so this still fires
// `init()` exactly once under Vite's `type="module"` script loading.
window.addEventListener('load', init);
if (document.readyState === 'complete') init();
