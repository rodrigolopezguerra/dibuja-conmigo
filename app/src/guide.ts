/**
 * SVG guide rendering, step-by-step playback, and step navigation — ported
 * verbatim from the legacy `buildGuide`/`pathLength`/`renderStatic`/
 * `renderDots`/`animateStep`/`playAll`/`stopPlaying` (index.html:531-649).
 *
 * PARITY (Bug 1, fixed in slice 8): `stop()` only flips `isPlaying` and
 * resets the button label — it does NOT cancel the pending `animateStep`
 * timeout or in-flight CSS transition. A stale callback can still land
 * after a pause or a navigation and overwrite `drawnUpTo` via
 * `renderDots()` alone, desyncing the dots from the SVG. This is the
 * documented, accepted parity scenario (spec `guide-playback` →
 * Play/Pause Animation). Do not "fix" this here — slice 8 replaces
 * `isPlaying` with a mode/generation state machine (design §3).
 *
 * Public surface is one method, `load()`; everything else is
 * closure-private (design §2), which is what lets slice 8 rewrite the
 * playback engine without touching `main.ts`.
 *
 * Mandated port rule (design §2, task 5.9): every navigation handler is
 * exactly `stop(); <mutate drawnUpTo>; renderStatic();`. No handler may
 * inline `isPlaying = false` — that assignment exists in exactly one
 * place, `stop()` itself. This is what keeps slice 8's fix to a single
 * function split instead of touching every call site.
 */
import type { Tutorial } from './types';
import { GUIDE, PLAYBACK } from './config';

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
  // PARITY: slice 8 replaces this with mode + generation + gapTimer (design §3).
  let isPlaying = false;

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
        stop();
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

  function animateStep(i: number, done: () => void): void {
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
        path.setAttribute('stroke', GUIDE.stroke);
        done();
      },
      duration * 1000 + PLAYBACK.tailMs,
    );
  }

  function play(): void {
    const steps = paths.length;
    isPlaying = true;
    options.playBtn.textContent = LABEL_PAUSE;
    drawnUpTo = 0;
    renderStatic();
    let i = 0;
    function step(): void {
      if (!isPlaying || i >= steps) {
        stop();
        return;
      }
      animateStep(i, () => {
        i += 1;
        drawnUpTo = i;
        renderDots();
        if (!isPlaying) return;
        setTimeout(step, PLAYBACK.gapMs);
      });
    }
    step();
  }

  // PARITY (Bug 1, fixed slice 8): only flips `isPlaying` and resets the
  // button label. Does NOT cancel any pending `animateStep` timeout or
  // in-flight CSS transition — see module doc comment above. This
  // assignment is the ONLY place `isPlaying = false` appears in this file.
  function stop(): void {
    isPlaying = false;
    options.playBtn.textContent = LABEL_PLAY;
  }

  options.playBtn.addEventListener('click', () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  });

  options.prevBtn.addEventListener('click', () => {
    stop();
    drawnUpTo = Math.max(0, drawnUpTo - 1);
    renderStatic();
  });

  options.nextBtn.addEventListener('click', () => {
    stop();
    const max = paths.length;
    drawnUpTo = Math.min(max, drawnUpTo + 1);
    renderStatic();
  });

  options.toggle.addEventListener('change', () => {
    options.svg.style.display = options.toggle.checked ? 'block' : 'none';
  });

  function load(next: Tutorial): void {
    stop();
    tutorial = next;
    drawnUpTo = 0;
    build();
  }

  return { load };
}
