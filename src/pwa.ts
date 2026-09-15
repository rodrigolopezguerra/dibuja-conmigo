/**
 * Service-worker registration. Owns no shared state and imports no feature
 * module — a platform side effect called once from the composition root,
 * consistent with the module contract documented in `main.ts:1-11`.
 */
import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the precache service worker with a SILENT update policy.
 *
 * ── THE EMPTY `onNeedReload` IS DELIBERATE AND LOAD-BEARING. DO NOT DELETE IT. ──
 *
 * vite-plugin-pwa's `autoUpdate` branch does exactly this:
 *     if (onNeedReload) onNeedReload();   // our no-op
 *     else window.location.reload();      // the default
 * Supplying the callback — even empty — replaces the forced reload with a
 * no-op. Without it the page reloads the instant a new service worker
 * activates, destroying whatever the child is drawing. The canvas is never
 * persisted, so that reload is unrecoverable data loss.
 *
 * Net behaviour: a new version installs and activates in the background and
 * takes control of the page, but the page is NEVER reloaded. The new version
 * is served on the next natural open.
 *
 * INVARIANT — this is safe ONLY while the app makes zero runtime network
 * requests. The new worker controls a page still running the old bundle.
 * That is harmless today: no dynamic `import()`, no Workers, no `fetch`, no
 * CSS `url()` images (undo uses a `data:` URI from `toDataURL()`), all
 * verified by grep across `src/` and `styles/`. Add any one of those and
 * this trade stops being free — revisit before shipping it.
 */
export function registerPwa(): void {
  registerSW({ immediate: true, onNeedReload() {} });
}
