/**
 * SVG guide rendering, step-by-step playback, and step navigation — ported
 * verbatim from the legacy `buildGuide`/`pathLength`/`renderStatic`/
 * `renderDots`/`animateStep`/`playAll`/`stopPlaying` (index.html:531-649).
 *
 * Slice 8 (Bug 1 fix): the legacy `stopPlaying()` only flipped `isPlaying`
 * and reset the button label — it never cancelled the pending `animateStep`
 * timeout or in-flight CSS transition, so a stale callback could land after
 * a pause or a navigation and overwrite `drawnUpTo` via `renderDots()`
 * alone, desyncing the dots from the SVG (spec `guide-playback` → Pause
 * Cancellation Fix, Navigation Cancellation Fix, SVG/Dots Consistency
 * Invariant). Fixed via a generation-token + mode state machine (design
 * §3), delegated to the pure `./playback-state` controller so the
 * cancellation semantics are unit-testable without a DOM:
 * - Pause → `requestStop()` (soft/deferred): the in-flight step finishes
 *   drawing and commits, then playback idles. Never freezes mid-stroke.
 * - Prev/Next/dot-click/`load()` → `hardAbort()` (hard/immediate): bumps
 *   the generation so the stale callback becomes a guaranteed no-op; always
 *   paired with a `renderStatic()` (or `build()` → `renderStatic()`), whose
 *   `transition:none` + `dashoffset` rewrite is what guarantees no partial
 *   stroke survives — that guarantee predates this fix, deferral exists
 *   only to avoid discarding in-progress work on Pause.
 *
 * Public surface is one method, `load()`; everything else is
 * closure-private (design §2), which is what let this fix stay inside
 * `guide.ts` (plus the extracted pure controller) without touching
 * `main.ts` or `canvas.ts`.
 *
 * Mandated port rule (design §2, task 5.9): every navigation handler is
 * exactly `hardAbort(); <mutate drawnUpTo>; renderStatic();` — no handler
 * inlines mode/generation bookkeeping directly.
 */
import type { Tutorial } from './types';
import { GUIDE, PLAYBACK } from './config';
import { createPlaybackController } from './playback-state';

export interface GuideOptions {
  svg: SVGSVGElement;
  dots: HTMLElement;
  playBtn: HTMLButtonElement;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  toggle: HTMLInputElement;
}

export interface Guide {
  /** Hard-aborts playback, rebuilds the SVG, resets to step 0, renders. */
  load(tutorial: Tutorial): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const LABEL_PLAY = '▶ Ver cómo se dibuja';
const LABEL_PAUSE = '⏸ Pausar';

export function createGuide(options: GuideOptions): Guide {
  let tutorial: Tutorial | null = null;
  let paths: SVGPathElement[] = [];
  let drawnUpTo = 0;
  const playback = createPlaybackController();
  let gapTimer: ReturnType<typeof setTimeout> | null = null;

  function measure(path: SVGPathElement): number {
    try {
      return path.getTotalLength();
    } catch {
      return 400;
    }
  }

  function renderDots(): void {
    options.dots.innerHTML = '';
    paths.forEach((_path, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i < drawnUpTo ? (i === drawnUpTo - 1 ? ' current' : ' filled') : '');
      dot.title = `Paso ${i + 1}`;
      dot.addEventListener('click', () => {
        hardAbort();
        drawnUpTo = i + 1;
        renderStatic();
      });
      options.dots.appendChild(dot);
    });
  }

  function renderStatic(): void {
    paths.forEach((path, i) => {
      const len = measure(path);
      path.style.transition = 'none';
      path.setAttribute('stroke-dasharray', String(len));
      if (i < drawnUpTo) {
        path.setAttribute('stroke-dashoffset', '0');
        path.setAttribute('stroke', i === drawnUpTo - 1 ? GUIDE.active : GUIDE.stroke);
      } else {
        path.setAttribute('stroke-dashoffset', String(len));
      }
    });
    renderDots();
  }

  function build(): void {
    options.svg.innerHTML = '';
    paths = [];
    if (!tutorial) {
      renderStatic();
      return;
    }
    tutorial.steps.forEach((step) => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', step.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', GUIDE.stroke);
      path.setAttribute('stroke-width', GUIDE.width);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('opacity', GUIDE.opacity);
      options.svg.appendChild(path);
      paths.push(path);
    });
    renderStatic();
  }

  function animateStep(i: number, gen: number, done: () => void): void {
    const path = paths[i];
    if (!path) return;
    const len = measure(path);
    const duration = Math.min(
      PLAYBACK.maxSec,
      Math.max(PLAYBACK.minSec, len / PLAYBACK.unitsPerSec),
    );
    path.setAttribute('stroke', GUIDE.active);
    path.setAttribute('stroke-dasharray', String(len));
    path.style.transition = 'none';
    path.setAttribute('stroke-dashoffset', String(len));
    path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${duration}s linear`;
    requestAnimationFrame(() => {
      path.setAttribute('stroke-dashoffset', '0');
    });
    setTimeout(
      () => {
        // Hard-aborted since this was scheduled — the DOM has already been
        // reset by the caller's renderStatic()/build(). No-op.
        if (playback.isStale(gen)) return;
        path.setAttribute('stroke', GUIDE.stroke);
        done();
      },
      duration * 1000 + PLAYBACK.tailMs,
    );
  }

  function play(): void {
    const totalSteps = paths.length;
    // Hard-abort first — this is what clears any pending gapTimer from a
    // previous run. Skipping this and only bumping mode/generation would
    // let a stale inter-step timer fire animateStep() into the new run's
    // DOM (its synchronous portion is unconditional; only its completion
    // callback checks staleness).
    hardAbort();
    const gen = playback.beginPlaying();
    options.playBtn.textContent = LABEL_PAUSE;
    drawnUpTo = 0;
    renderStatic();
    let i = 0;
    function next(): void {
      if (!playback.isPlaying() || i >= totalSteps) {
        finishPlayback();
        return;
      }
      animateStep(i, gen, () => {
        i += 1;
        drawnUpTo = i;
        renderDots();
        // Soft-stopped (Pause) during this step, or this was the last step:
        // the step DID finish drawing, so committing drawnUpTo above is
        // correct — only the schedule-next decision changes here.
        if (!playback.isPlaying() || i >= totalSteps) {
          finishPlayback();
          return;
        }
        gapTimer = setTimeout(next, PLAYBACK.gapMs);
      });
    }
    next();
  }

  // Pause — soft/deferred stop. Lets the in-flight step finish drawing and
  // commit; only THEN does playback idle. Never freezes mid-stroke.
  function requestStop(): void {
    if (!playback.isPlaying()) return;
    playback.requestStop();
    options.playBtn.textContent = LABEL_PLAY;
  }

  // Nav (prev/next/dot-click) and load() — hard/immediate abort. Bumps the
  // generation so any in-flight animateStep callback becomes a no-op, then
  // clears the pending gap timer. Callers pair this with a renderStatic()
  // (or build()), which is what guarantees no partial stroke survives.
  function hardAbort(): void {
    playback.hardAbort();
    if (gapTimer !== null) {
      clearTimeout(gapTimer);
      gapTimer = null;
    }
    options.playBtn.textContent = LABEL_PLAY;
  }

  function finishPlayback(): void {
    playback.finish();
    options.playBtn.textContent = LABEL_PLAY;
  }

  options.playBtn.addEventListener('click', () => {
    if (playback.isPlaying()) {
      requestStop();
    } else {
      play();
    }
  });

  options.prevBtn.addEventListener('click', () => {
    hardAbort();
    drawnUpTo = Math.max(0, drawnUpTo - 1);
    renderStatic();
  });

  options.nextBtn.addEventListener('click', () => {
    hardAbort();
    const max = paths.length;
    drawnUpTo = Math.min(max, drawnUpTo + 1);
    renderStatic();
  });

  options.toggle.addEventListener('change', () => {
    options.svg.style.display = options.toggle.checked ? 'block' : 'none';
  });

  function load(next: Tutorial): void {
    hardAbort();
    tutorial = next;
    drawnUpTo = 0;
    build();
  }

  return { load };
}
