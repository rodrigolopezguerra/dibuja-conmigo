import type { CategoryChip } from '../types';

export const CATEGORIES = [
  { id: 'todos', name: 'Todos', emoji: '🎨' },
  { id: 'animales', name: 'Animales', emoji: '🐾' },
  { id: 'naturaleza', name: 'Naturaleza', emoji: '🌿' },
  { id: 'vehiculos', name: 'Vehículos', emoji: '🚗' },
  { id: 'divertidas', name: 'Cosas Divertidas', emoji: '🎁' },
  { id: 'fantasia', name: 'Fantasía', emoji: '✨' },
] as const satisfies readonly CategoryChip[];
