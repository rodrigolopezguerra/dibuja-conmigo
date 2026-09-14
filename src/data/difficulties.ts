import type { DifficultyChip } from '../types';

export const DIFFICULTIES = [
  { id: 'todos', name: 'Todas las dificultades' },
  { id: 'facil', name: '⭐ Fácil' },
  { id: 'medio', name: '⭐⭐ Medio' },
  { id: 'dificil', name: '⭐⭐⭐ Difícil' },
] as const satisfies readonly DifficultyChip[];
