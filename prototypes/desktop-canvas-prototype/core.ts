/**
 * The canvas desktop's model, adapted from Desktop's `core.ts`: status summaries and window geometry, plus the camera
 * that turns the desktop into a pannable, zoomable canvas. Groups and their order come from `organization.ts`.
 */

export interface Folder {
  id: string;
  name: string;
  threadIds: string[];
  createdAt: number;
}

/** The fields of a bb sidebar thread the canvas reads; `PluginSidebarThread` satisfies it. */
export interface DesktopThread {
  id: string;
  displayTitle: string;
  projectId: string;
  sectionId: string | null;
  providerId: string;
  status: string;
  hasPendingInteraction: boolean;
  isArchived: boolean;
  isPinned: boolean;
  isUnread: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/** One icon's slot in Arrange icons, and the icon's own hit box inside it. */
export const ICON_CELL = { width: 104, height: 104 } as const;
export const ICON_BOX = { width: 88, height: 88 } as const;

// Status, as Desktop reads it across icons, rows and windows.

export function statusTone(thread: DesktopThread): "attention" | "running" | null {
  if (thread.hasPendingInteraction) return "attention";
  if (thread.status === "active" || thread.status === "starting") return "running";
  return null;
}

export function groupTone(members: readonly DesktopThread[]) {
  const tones = members.map(statusTone);
  const tone = tones.includes("attention") ? "attention" : tones.includes("running") ? "running" : null;
  return {
    tone,
    toneCount: tones.filter((candidate) => candidate === tone).length,
    unreadCount: tone === null ? members.filter((thread) => thread.isUnread).length : 0,
  } as const;
}

export function folderSummary(name: string, members: readonly DesktopThread[]): string {
  const { tone, toneCount, unreadCount } = groupTone(members);
  if (members.length === 0) return `${name} — empty`;
  const threads = `${members.length} ${members.length === 1 ? "thread" : "threads"}`;
  if (tone === "attention") return `${name} — ${threads}, ${toneCount} ${toneCount === 1 ? "needs" : "need"} input`;
  if (tone === "running") return `${name} — ${threads}, ${toneCount} running`;
  if (unreadCount > 0) return `${name} — ${threads}, ${unreadCount} unread`;
  return `${name} — ${threads}`;
}

export function describeStatus(thread: DesktopThread): string {
  if (thread.hasPendingInteraction) return "Needs input";
  if (thread.isArchived) return "Archived";
  switch (thread.status) {
    case "active":
      return "Working";
    case "starting":
      return "Starting";
    case "stopping":
      return "Stopping";
    case "pending":
      return "Scheduled";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}

export function relativeTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.round((now - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Window geometry. Rects are in canvas (world) coordinates; maximized windows fill the screen's work area instead.

export const MIN_WINDOW = { width: 320, height: 200 } as const;

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function resizeRect(start: Rect, edge: ResizeEdge, delta: Point): Rect {
  let { x, y, width, height } = start;
  if (edge.includes("e")) width = Math.max(MIN_WINDOW.width, start.width + delta.x);
  if (edge.includes("s")) height = Math.max(MIN_WINDOW.height, start.height + delta.y);
  if (edge.includes("w")) {
    width = Math.max(MIN_WINDOW.width, start.width - delta.x);
    x = start.x + start.width - width;
  }
  if (edge.includes("n")) {
    height = Math.max(MIN_WINDOW.height, start.height - delta.y);
    y = start.y + start.height - height;
  }
  return { x, y, width, height };
}

export function tileRects(count: number, area: Rect, gap = 12): Rect[] {
  if (count === 0) return [];
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const width = Math.floor((area.width - gap * (columns + 1)) / columns);
  const height = Math.floor((area.height - gap * (rows + 1)) / rows);
  return Array.from({ length: count }, (_, index) => ({
    x: area.x + gap + (index % columns) * (width + gap),
    y: area.y + gap + Math.floor(index / columns) * (height + gap),
    width,
    height,
  }));
}

/** Windows stacked down and to the right from `origin`, each the size it already is, like Windows' Cascade. */
export function cascadeRects(sizes: readonly Size[], origin: Point, step = 32): Rect[] {
  return sizes.map((size, index) => ({ x: origin.x + index * step, y: origin.y + index * step, ...size }));
}

// The camera. A world point p shows on screen at camera + p × zoom.

export interface Camera extends Point {
  zoom: number;
}

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2;

export const clampZoom = (zoom: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

export function zoomAt(camera: Camera, zoom: number, anchor: Point): Camera {
  const bounded = clampZoom(zoom);
  return {
    zoom: bounded,
    x: anchor.x - ((anchor.x - camera.x) * bounded) / camera.zoom,
    y: anchor.y - ((anchor.y - camera.y) * bounded) / camera.zoom,
  };
}

export const toWorld = (camera: Camera, point: Point): Point => ({ x: (point.x - camera.x) / camera.zoom, y: (point.y - camera.y) / camera.zoom });

export const toScreen = (camera: Camera, point: Point): Point => ({ x: camera.x + point.x * camera.zoom, y: camera.y + point.y * camera.zoom });

/** The part of the canvas a screen rect shows. */
export function worldRect(camera: Camera, screen: Rect): Rect {
  const origin = toWorld(camera, screen);
  return { ...origin, width: screen.width / camera.zoom, height: screen.height / camera.zoom };
}

export function boundsOf(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Frames `bounds` inside the screen's work area, never zooming in past 100%. */
export function fitCamera(bounds: Rect | null, area: Rect, padding = 48): Camera {
  if (bounds === null) return { x: area.x, y: area.y, zoom: 1 };
  const zoom = clampZoom(Math.min(1, (area.width - padding * 2) / bounds.width, (area.height - padding * 2) / bounds.height));
  return {
    zoom,
    x: area.x + (area.width - bounds.width * zoom) / 2 - bounds.x * zoom,
    y: area.y + (area.height - bounds.height * zoom) / 2 - bounds.y * zoom,
  };
}

/** Brings `rect` fully into view at 100% when it is offscreen or the canvas is zoomed, keeping the camera otherwise. */
export function revealCamera(camera: Camera, rect: Rect, area: Rect, margin = 24): Camera {
  const zoom = 1;
  const screen = { x: camera.x + rect.x * camera.zoom, y: camera.y + rect.y * camera.zoom };
  const inView =
    camera.zoom === zoom &&
    screen.x >= area.x && screen.y >= area.y &&
    screen.x + rect.width <= area.x + area.width && screen.y + rect.height <= area.y + area.height;
  if (inView) return camera;
  const x = rect.width + margin * 2 <= area.width ? area.x + (area.width - rect.width) / 2 : area.x + margin;
  const y = rect.height + margin * 2 <= area.height ? area.y + (area.height - rect.height) / 2 : area.y + margin;
  return { zoom, x: x - rect.x, y: y - rect.y };
}

/** Icon slots in reading order inside `area`, one per item. */
export function gridPositions(count: number, area: Rect): Point[] {
  const columns = Math.max(1, Math.floor(area.width / ICON_CELL.width));
  return Array.from({ length: count }, (_, index) => ({
    x: area.x + (index % columns) * ICON_CELL.width,
    y: area.y + Math.floor(index / columns) * ICON_CELL.height,
  }));
}

/** The first grid slot in `area` that no taken icon overlaps. */
export function nextFreePosition(taken: readonly Point[], area: Rect): Point {
  const candidates = gridPositions(taken.length * 4 + 1, area);
  const free = candidates.find((candidate) =>
    taken.every((point) => Math.abs(point.x - candidate.x) >= ICON_BOX.width || Math.abs(point.y - candidate.y) >= ICON_BOX.height),
  );
  return free ?? candidates.at(-1)!;
}

// Threads that start waiting for input, for the needs-input notice (Desktop's balloon).

export interface NeedsInputTracker {
  known: ReadonlySet<string> | null;
  queue: readonly string[];
}

/** Adds threads that just started waiting to the queue and drops ones that stopped; the first observation only seeds. */
export function trackNeedsInput(tracker: NeedsInputTracker, pendingIds: readonly string[]): NeedsInputTracker & { arrived: boolean } {
  const pending = new Set(pendingIds);
  if (tracker.known === null) return { known: pending, queue: [], arrived: false };
  const previous = tracker.known;
  const kept = tracker.queue.filter((id) => pending.has(id));
  const arrived = pendingIds.filter((id) => !previous.has(id) && !kept.includes(id));
  return { known: pending, queue: [...kept, ...arrived], arrived: arrived.length > 0 };
}
