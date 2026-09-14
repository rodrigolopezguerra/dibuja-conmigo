import type { Tutorial } from '../types';
import { ANIMALES } from './animales';
import { NATURALEZA } from './naturaleza';
import { VEHICULOS } from './vehiculos';
import { DIVERTIDAS } from './divertidas';
import { FANTASIA } from './fantasia';

// Order matters: this reproduces the legacy TUTORIALS array's gallery
// order byte-identically (animales -> naturaleza -> vehiculos ->
// divertidas -> fantasia). See tutorials.test.ts for the positional
// fidelity assertion.
export const TUTORIALS: readonly Tutorial[] = [
  ...ANIMALES,
  ...NATURALEZA,
  ...VEHICULOS,
  ...DIVERTIDAS,
  ...FANTASIA,
];
