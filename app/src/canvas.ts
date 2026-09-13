/**
 * Drawing surface: bitmap sizing, pointer input, undo history, clear, and
 * PNG export — ported verbatim from the legacy `fitCanvas`/`pointerPos`/
 * `startDraw`/`moveDraw`/`endDraw`/`pushHistory`/undo/`clearCanvas`/save
 * handlers (index.html:461-782).
 *
 * Does NOT import `toolbar.ts`: color/eraser/brush-size are read on every
 * stroke event via the injected `getDrawSettings()` callback, so `canvas.ts`
 * and `toolbar.ts` never reference each other (design §2).
 *
 * Slice 8 (Bug 2 fix): `exportPng()` now sizes the output canvas from the
 * source bitmap's actual device-pixel dimensions (`canvas.width`/
 * `canvas.height`), not CSS pixels, so the exported PNG matches the
 * on-screen bitmap 1:1 with no downscaling and no maximum-dimension cap
 * (spec `drawing-canvas` → PNG Export Resolution Fix).
 *
 * PARITY (Bug 3, fixed in slice 8): `exportPng()` fills the background with
 * `EXPORT_BACKGROUND` (`#FFFBF2`, the board's paper tone), not the board's
 * actual white (`#FFFFFF` / `--panel`). Do not "fix" this here (spec
 * `drawing-canvas` → PNG Export Background).
 *
 * PARITY (non-goals, intentional, never fixed): `pointerleave` ends the
 * stroke only when `drawing` is true, clamping the last point at the canvas
 * edge instead of extrapolating past it (spec `drawing-canvas` → Pointer
 * Input). `moveDraw` sets `strokeStyle = color` even while erasing —
 * `destination-out` ignores RGB entirely, so this is cosmetically odd but
 * functionally correct (spec `drawing-canvas` → Eraser Rendering).
 */
import type { DrawSettings } from './types';
import { EXPORT_BACKGROUND, HISTORY_LIMIT } from './config';

export interface CanvasOptions {
  canvas: HTMLCanvasElement;
  board: HTMLElement;
  getDrawSettings(): DrawSettings;
  notify(message: string): void;
  getExportName(): string;
}

export interface DrawingCanvas {
  fit(): void;
  undo(): void;
  clear(showToast: boolean): void;
  exportPng(): void;
}

function get2dContext(el: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = el.getContext('2d');
  if (!context) throw new Error('Unable to acquire 2D context for the drawing canvas');
  return context;
}

export function createDrawingCanvas(options: CanvasOptions): DrawingCanvas {
  const { canvas } = options;
  const ctx = get2dContext(canvas);

  let history: string[] = [];
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function pointerPos(e: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function fit(): void {
    const rect = options.board.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const prev = document.createElement('canvas');
    prev.width = canvas.width;
    prev.height = canvas.height;
    const pctx = prev.getContext('2d');
    if (canvas.width > 0 && pctx) pctx.drawImage(canvas, 0, 0);
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (prev.width > 0) {
      ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, rect.width, rect.height);
    }
  }

  function startDraw(e: PointerEvent): void {
    drawing = true;
    const pos = pointerPos(e);
    lastX = pos.x;
    lastY = pos.y;
    const { color, isEraser, size } = options.getDrawSettings();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? '#000000' : color;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.fill();
  }

  function moveDraw(e: PointerEvent): void {
    if (!drawing) return;
    const pos = pointerPos(e);
    const { color, isEraser, size } = options.getDrawSettings();
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    // PARITY: strokeStyle is always `color`, even while erasing — see module
    // doc comment above. Do not "fix".
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  }

  function pushHistory(): void {
    try {
      history.push(canvas.toDataURL());
      if (history.length > HISTORY_LIMIT) history.shift();
    } catch {
      // PARITY: legacy silently swallows toDataURL failures (e.g. a tainted
      // canvas). Do not surface an error here.
    }
  }

  function endDraw(): void {
    if (!drawing) return;
    drawing = false;
    pushHistory();
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    startDraw(e);
  });
  canvas.addEventListener('pointermove', moveDraw);
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);
  // PARITY: edge-clamp only if a stroke is in progress — see module doc
  // comment above. Do not "fix".
  canvas.addEventListener('pointerleave', () => {
    if (drawing) endDraw();
  });

  function undo(): void {
    if (history.length === 0) {
      options.notify('Nada para deshacer');
      return;
    }
    history.pop();
    const rect = options.board.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    const last = history[history.length - 1];
    if (last !== undefined) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = last;
    }
  }

  function clear(showToast: boolean): void {
    const rect = options.board.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    history = [];
    if (showToast) options.notify('Lienzo borrado');
  }

  function exportPng(): void {
    const out = document.createElement('canvas');
    // Bug 2 fix (slice 8): size the export canvas from the source bitmap's
    // actual device-pixel dimensions (set in fit() as rect * devicePixelRatio),
    // not CSS pixels. drawImage below then copies 1:1 — no downscaling, no
    // maximum-dimension cap.
    out.width = canvas.width;
    out.height = canvas.height;
    const octx = out.getContext('2d');
    if (!octx) throw new Error('Unable to acquire 2D context for PNG export');
    // PARITY (Bug 3, fixed slice 8): fills with the board's paper tone, not
    // its actual white — see module doc comment above. Do not "fix".
    octx.fillStyle = EXPORT_BACKGROUND;
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0, out.width, out.height);
    const link = document.createElement('a');
    link.download = `${options.getExportName().toLowerCase()}-dibujo.png`;
    link.href = out.toDataURL('image/png');
    link.click();
    options.notify('¡Dibujo guardado!');
  }

  window.addEventListener('resize', fit);

  return { fit, undo, clear, exportPng };
}
