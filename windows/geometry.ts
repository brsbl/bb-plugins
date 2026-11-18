import { resizeRect, type Point, type Rect, type ResizeEdge } from "../core";

export interface Size {
  width: number;
  height: number;
}

/** The floating taskbar; windows measure it to keep maximized frames above it. */
export const TASKBAR_SELECTOR = ".bbd-taskbar";

const DOCK_RESERVE = 80;
const TASKBAR_GAP = 6;

/** The height of bb's own chrome row, which windows never cover. */
export function chromeTop(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--bb-app-chrome-row-height").trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 48;
  return raw.endsWith("rem") ? value * Number.parseFloat(getComputedStyle(document.documentElement).fontSize) : value;
}

export function viewportRect(): Rect {
  const top = chromeTop();
  return { x: 0, y: top, width: window.innerWidth, height: window.innerHeight - top };
}

/** The viewport below bb's chrome and above the floating taskbar, which is what a maximized window fills. */
export function workAreaRect(): Rect {
  const top = chromeTop();
  const taskbar = document.querySelector(TASKBAR_SELECTOR)?.getBoundingClientRect();
  const bottom = taskbar !== undefined && taskbar.height > 0 ? taskbar.top - TASKBAR_GAP : window.innerHeight - DOCK_RESERVE;
  return { x: 0, y: top, width: window.innerWidth, height: Math.max(0, bottom - top) };
}

export function sameRect(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/** Keep the whole frame inside the usable desktop, including on tiny viewports. */
export function fitDragRect(rect: Rect, area: Rect, minimum: Size = { width: 280, height: 180 }): Rect {
  const width = Math.min(Math.max(rect.width, minimum.width), area.width);
  const height = Math.min(Math.max(rect.height, minimum.height), area.height);
  return { width, height,
    x: Math.max(area.x, Math.min(rect.x, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(rect.y, area.y + area.height - height)),
  };
}

/** Resize without moving the opposite edge when the pointer reaches a boundary. */
export function resizeInArea(rect: Rect, edge: ResizeEdge, delta: Point, area: Rect): Rect {
  const bounded = {
    x: edge.includes("w") ? Math.max(delta.x, area.x - rect.x) : Math.min(delta.x, area.x + area.width - rect.x - rect.width),
    y: edge.includes("n") ? Math.max(delta.y, area.y - rect.y) : Math.min(delta.y, area.y + area.height - rect.y - rect.height),
  };
  return fitDragRect(resizeRect(rect, edge, bounded), area);
}

/** Where a new window of `size` opens: a little left of center, cascading by `stagger`. */
export function defaultRect(size: Size, stagger: number, area: Rect = workAreaRect()): Rect {
  const offset = (stagger % 8) * 28;
  return fitDragRect(
    {
      ...size,
      x: Math.round((area.width - size.width) / 2) + offset - 84,
      y: area.y + Math.round((area.height - size.height) / 3) + offset,
    },
    area,
  );
}
