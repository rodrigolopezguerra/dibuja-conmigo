/**
 * Shared type contract for the tutorial dataset and UI filter chips.
 *
 * `CategoryId` / `DifficultyId` are the DATA families: the only values a
 * `Tutorial` may carry. `FilterCategoryId` / `FilterDifficultyId` are the UI
 * families: they add the `'todos'` ("all") sentinel used by the filter bar.
 * Modelling these as two separate unions means `category: 'todos'` on a
 * `Tutorial` is a compile error, while `'todos'` remains legal on a
 * `CategoryChip` / `DifficultyChip`.
 */

export type CategoryId = 'animales' | 'naturaleza' | 'vehiculos' | 'divertidas' | 'fantasia';
export type DifficultyId = 'facil' | 'medio' | 'dificil';

/** 'todos' is a FILTER sentinel. It is never a tutorial's category. */
export type FilterCategoryId = 'todos' | CategoryId;
/** 'todos' is a FILTER sentinel. It is never a tutorial's difficulty. */
export type FilterDifficultyId = 'todos' | DifficultyId;

export interface Step {
  readonly d: string;
}

/**
 * `C` pins the category per-file (e.g. `Tutorial<'animales'>`), which is
 * what makes filing a tutorial in the wrong category module a compile error.
 */
export interface Tutorial<C extends CategoryId = CategoryId> {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly category: C;
  readonly difficulty: DifficultyId;
  readonly steps: readonly Step[];
}

export interface CategoryChip {
  readonly id: FilterCategoryId;
  readonly name: string;
  readonly emoji: string;
}

export interface DifficultyChip {
  readonly id: FilterDifficultyId;
  readonly name: string;
}

export interface DrawSettings {
  readonly color: string;
  readonly isEraser: boolean;
  readonly size: number;
}
