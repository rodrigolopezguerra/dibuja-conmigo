/**
 * Pure playback-cancellation state machine for the guide's step-by-step
 * animation (design §3, Bug 1 fix). No DOM, no timers — this module only
 * tracks `mode` and the generation token; `guide.ts` owns all side effects
 * (SVG attribute writes, `setTimeout`, `requestAnimationFrame`) and calls
 * into this controller purely for mode/generation bookkeeping.
 *
 * Extracted out of `guide.ts` so the generation-token invalidation semantics
 * — the actual fix for Bug 1 — are unit-testable without a browser
 * environment (this project intentionally has no jsdom/happy-dom).
 *
 * Two independent cancellation semantics (design §3):
 * - Soft stop (`requestStop`, Pause only): defers to 'stopping'; the
 *   in-flight step is left to finish and commit before playback idles.
 * - Hard abort (`hardAbort`, nav/dot-click/load): bumps the generation
 *   immediately, so any async continuation captured under the old
 *   generation becomes a guaranteed no-op via `isStale`.
 */

export type PlaybackMode = 'idle' | 'playing' | 'stopping';

export interface PlaybackController {
  /** Current mode, read-only. */
  readonly mode: PlaybackMode;
  /** Current generation, read-only. */
  readonly generation: number;
  /** True once `gen` (captured at schedule time) has been invalidated by a hard abort. */
  isStale(gen: number): boolean;
  /**
   * Hard abort — from ANY state (nav, dot click, `load()`, and the start of
   * every `play()`). Bumps the generation, neutering any in-flight
   * `animateStep` completion callback, and returns to 'idle'. Callers
   * remain responsible for clearing their own timer handles (`gapTimer`)
   * and re-rendering (`renderStatic()`); this controller only tracks
   * mode/generation, never DOM or timers. `play()` MUST call the caller's
   * full hard-abort (which also clears `gapTimer`) before `beginPlaying()`
   * — calling `beginPlaying()` alone would leave a previous run's pending
   * gap-timer callback able to fire into the new run.
   */
  hardAbort(): void;
  /**
   * Enters 'playing' at the CURRENT generation (does not bump it). Callers
   * MUST call `hardAbort()` immediately before this, every time `play()`
   * starts a run — including when restarting from 'stopping' (legacy
   * semantics preserved: Play always restarts from step 0). Returns the
   * generation to capture in the caller's closure.
   */
  beginPlaying(): number;
  /** Soft stop — Pause button only. Defers to 'stopping' if currently 'playing'; no-op otherwise. */
  requestStop(): void;
  /** True while a step-completion callback should schedule the next step. */
  isPlaying(): boolean;
  /** Settles back to 'idle' — called once the last step or a deferred stop commits. */
  finish(): void;
}

export function createPlaybackController(): PlaybackController {
  let mode: PlaybackMode = 'idle';
  let generation = 0;

  function hardAbort(): void {
    generation += 1;
    mode = 'idle';
  }

  function beginPlaying(): number {
    mode = 'playing';
    return generation;
  }

  function requestStop(): void {
    if (mode === 'playing') mode = 'stopping';
  }

  function isPlaying(): boolean {
    return mode === 'playing';
  }

  function finish(): void {
    mode = 'idle';
  }

  function isStale(gen: number): boolean {
    return gen !== generation;
  }

  return {
    get mode() {
      return mode;
    },
    get generation() {
      return generation;
    },
    isStale,
    hardAbort,
    beginPlaying,
    requestStop,
    isPlaying,
    finish,
  };
}
