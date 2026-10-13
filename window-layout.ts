/**
 * Where the floating window sits and how big it is. The window is anchored to
 * the bottom-right corner, so it grows up and to the left.
 */

export interface WindowLayout {
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/** The thread pane's horizontal extent in viewport pixels. */
export interface PaneBounds {
  left: number;
  right: number;
}

export const EDGE_GAP = 16;
export const DEFAULT_SIZE = { width: 360, height: 280 } as const;
// Small enough to tuck beside the thread pane, big enough for the guide to fit.
export const MIN_SIZE = { width: 300, height: 240 } as const;

export function clampLayout(layout: WindowLayout, viewport: Viewport): WindowLayout {
  const width = clamp(layout.width, MIN_SIZE.width, Math.max(MIN_SIZE.width, viewport.width - EDGE_GAP * 2));
  const height = clamp(layout.height, MIN_SIZE.height, Math.max(MIN_SIZE.height, viewport.height - EDGE_GAP * 2));
  return {
    width,
    height,
    right: clamp(layout.right, EDGE_GAP, Math.max(EDGE_GAP, viewport.width - width - EDGE_GAP)),
    bottom: clamp(layout.bottom, EDGE_GAP, Math.max(EDGE_GAP, viewport.height - height - EDGE_GAP)),
  };
}

/**
 * The bottom-right corner, shrunk to fit beside the thread pane when there is
 * room so the window never covers the conversation. With no room, it keeps
 * its usual size in the corner.
 */
export function defaultLayout(viewport: Viewport, pane: PaneBounds | null): WindowLayout {
  const corner = { right: EDGE_GAP, bottom: EDGE_GAP, ...DEFAULT_SIZE };
  if (!pane) return clampLayout(corner, viewport);
  const gutter = viewport.width - pane.right - EDGE_GAP * 2;
  if (gutter < MIN_SIZE.width) return clampLayout(corner, viewport);
  const width = Math.min(DEFAULT_SIZE.width, gutter);
  const height = Math.max(MIN_SIZE.height, Math.round((width * DEFAULT_SIZE.height) / DEFAULT_SIZE.width));
  return clampLayout({ right: EDGE_GAP, bottom: EDGE_GAP, width, height }, viewport);
}

/** A saved layout, or a position saved before the window could be resized. */
export function parseLayout(value: unknown): WindowLayout | null {
  if (!value || typeof value !== "object") return null;
  const { right, bottom, width, height } = value as Partial<Record<keyof WindowLayout, unknown>>;
  if (!isNumber(right) || !isNumber(bottom)) return null;
  return {
    right,
    bottom,
    width: isNumber(width) ? width : DEFAULT_SIZE.width,
    height: isNumber(height) ? height : DEFAULT_SIZE.height,
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
