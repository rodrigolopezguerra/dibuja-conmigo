import { describe, expect, it } from 'vitest';

import { createPlaybackController } from './playback-state';

// This is the actual fix for Bug 1 (stale-callback desync after
// pause/navigation), extracted so it is verifiable without a DOM. It does
// NOT exercise guide.ts's SVG/timer side effects (including the gapTimer
// race described in guide.ts's play()) — those are only verifiable in a
// browser (see the PR description's manual verification recipe).
describe('createPlaybackController', () => {
  it('starts idle at generation 0', () => {
    const playback = createPlaybackController();
    expect(playback.mode).toBe('idle');
    expect(playback.generation).toBe(0);
    expect(playback.isPlaying()).toBe(false);
  });

  it('hardAbort() then beginPlaying() enters playing and returns the current generation', () => {
    const playback = createPlaybackController();
    playback.hardAbort();
    const gen = playback.beginPlaying();
    expect(playback.mode).toBe('playing');
    expect(playback.isPlaying()).toBe(true);
    expect(gen).toBe(playback.generation);
  });

  it('requestStop() (soft stop) defers to stopping without bumping the generation', () => {
    const playback = createPlaybackController();
    playback.hardAbort();
    const gen = playback.beginPlaying();
    playback.requestStop();
    expect(playback.mode).toBe('stopping');
    expect(playback.isPlaying()).toBe(false);
    // Soft stop must NOT invalidate the in-flight step's generation — the
    // step is meant to finish and commit, not be treated as stale.
    expect(playback.isStale(gen)).toBe(false);
  });

  it('requestStop() is a no-op when not playing', () => {
    const playback = createPlaybackController();
    playback.requestStop();
    expect(playback.mode).toBe('idle');
  });

  it('hardAbort() bumps the generation and returns to idle from any state', () => {
    const playback = createPlaybackController();
    playback.hardAbort();
    const gen = playback.beginPlaying();
    playback.hardAbort();
    expect(playback.mode).toBe('idle');
    // This is the actual bug fix: a callback captured under the old
    // generation is now permanently stale, so it becomes a guaranteed no-op.
    expect(playback.isStale(gen)).toBe(true);
  });

  it('hardAbort() during a soft stop also invalidates the pending step', () => {
    const playback = createPlaybackController();
    playback.hardAbort();
    const gen = playback.beginPlaying();
    playback.requestStop();
    playback.hardAbort();
    expect(playback.mode).toBe('idle');
    expect(playback.isStale(gen)).toBe(true);
  });

  it('hardAbort() + beginPlaying() while stopping restarts from a fresh generation (legacy: Play always restarts from 0)', () => {
    const playback = createPlaybackController();
    playback.hardAbort();
    const firstGen = playback.beginPlaying();
    playback.requestStop();
    playback.hardAbort();
    const secondGen = playback.beginPlaying();
    expect(secondGen).not.toBe(firstGen);
    expect(playback.mode).toBe('playing');
    expect(playback.isStale(firstGen)).toBe(true);
    expect(playback.isStale(secondGen)).toBe(false);
  });

  it('finish() settles to idle without touching the generation', () => {
    const playback = createPlaybackController();
    playback.hardAbort();
    const gen = playback.beginPlaying();
    playback.finish();
    expect(playback.mode).toBe('idle');
    expect(playback.isPlaying()).toBe(false);
    // finish() is the natural end of a still-valid run — the generation it
    // was playing under must still read as current, not stale.
    expect(playback.isStale(gen)).toBe(false);
  });
});
