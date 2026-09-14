/**
 * Toast notification — ported verbatim from the legacy `toast()` helper
 * (index.html:456-459). Owns its own dismiss timer; re-showing a message
 * before the previous one dismissed resets the timer instead of stacking.
 */
import { TOAST_MS } from './config';

export interface Toast {
  show(message: string): void;
}

export function createToast(el: HTMLElement): Toast {
  let timer: ReturnType<typeof setTimeout> | undefined;

  function show(message: string): void {
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), TOAST_MS);
  }

  return { show };
}
