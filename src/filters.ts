/**
 * Category/difficulty filtering — ported from the legacy `renderFilters()`
 * (index.html:479-497). Split into a pure predicate (`filterTutorials`, unit
 * tested with zero DOM) and a chip-rendering factory (`createFilterBar`),
 * per design §2. `main.ts` owns the actual `FilterState`; this module only
 * renders it and reports intent via `onChange`.
 */
import type { FilterCategoryId, FilterDifficultyId, Tutorial } from './types';
import { CATEGORIES } from './data/categories';
import { DIFFICULTIES } from './data/difficulties';

export interface FilterState {
  readonly category: FilterCategoryId;
  readonly difficulty: FilterDifficultyId;
}

/**
 * Pure. No DOM. `'todos'` matches every value on that axis independently —
 * the two axes are combined with AND.
 */
export function filterTutorials(tutorials: readonly Tutorial[], state: FilterState): Tutorial[] {
  return tutorials.filter(
    (t) =>
      (state.category === 'todos' || t.category === state.category) &&
      (state.difficulty === 'todos' || t.difficulty === state.difficulty),
  );
}

export interface FilterBarOptions {
  categoryRow: HTMLElement;
  difficultyRow: HTMLElement;
  onChange(next: FilterState): void;
}

export interface FilterBar {
  render(state: FilterState): void;
}

export function createFilterBar(options: FilterBarOptions): FilterBar {
  function render(state: FilterState): void {
    options.categoryRow.innerHTML = '';
    CATEGORIES.forEach((chip) => {
      const button = document.createElement('button');
      button.className = 'chip' + (chip.id === state.category ? ' active' : '');
      button.textContent = chip.emoji + ' ' + chip.name;
      button.addEventListener('click', () => {
        options.onChange({ category: chip.id, difficulty: state.difficulty });
      });
      options.categoryRow.appendChild(button);
    });

    options.difficultyRow.innerHTML = '';
    DIFFICULTIES.forEach((chip) => {
      const button = document.createElement('button');
      button.className = 'chip diff-' + chip.id + (chip.id === state.difficulty ? ' active' : '');
      button.textContent = chip.name;
      button.addEventListener('click', () => {
        options.onChange({ category: state.category, difficulty: chip.id });
      });
      options.difficultyRow.appendChild(button);
    });
  }

  return { render };
}
