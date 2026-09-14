import { describe, expect, it } from 'vitest';

import type { Tutorial } from './types';
import { filterTutorials } from './filters';

// Small fixture, independent from the real dataset — this test targets the
// pure predicate's logic, not the dataset itself (that's tutorials.test.ts).
const FIXTURE: readonly Tutorial[] = [
  {
    id: 'a',
    name: 'A',
    emoji: '🐱',
    category: 'animales',
    difficulty: 'facil',
    steps: [{ d: 'M0,0' }],
  },
  {
    id: 'b',
    name: 'B',
    emoji: '🌳',
    category: 'naturaleza',
    difficulty: 'medio',
    steps: [{ d: 'M0,0' }],
  },
  {
    id: 'c',
    name: 'C',
    emoji: '🚗',
    category: 'vehiculos',
    difficulty: 'dificil',
    steps: [{ d: 'M0,0' }],
  },
  {
    id: 'd',
    name: 'D',
    emoji: '🐶',
    category: 'animales',
    difficulty: 'dificil',
    steps: [{ d: 'M0,0' }],
  },
];

describe('filterTutorials', () => {
  it('"todos" on category matches every category, filtered only by difficulty', () => {
    const result = filterTutorials(FIXTURE, { category: 'todos', difficulty: 'dificil' });
    expect(result.map((t) => t.id)).toEqual(['c', 'd']);
  });

  it('"todos" on difficulty matches every difficulty, filtered only by category', () => {
    const result = filterTutorials(FIXTURE, { category: 'animales', difficulty: 'todos' });
    expect(result.map((t) => t.id)).toEqual(['a', 'd']);
  });

  it('"todos" on both axes returns every tutorial, in order', () => {
    const result = filterTutorials(FIXTURE, { category: 'todos', difficulty: 'todos' });
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('combines both axes with AND when neither is "todos"', () => {
    const result = filterTutorials(FIXTURE, { category: 'animales', difficulty: 'dificil' });
    expect(result.map((t) => t.id)).toEqual(['d']);
  });

  it('returns an empty array when no tutorial matches both axes', () => {
    const result = filterTutorials(FIXTURE, { category: 'naturaleza', difficulty: 'dificil' });
    expect(result).toEqual([]);
  });
});
