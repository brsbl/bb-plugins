import type { Camera, Point, Rect, Size } from "./core";
import { toWorld } from "./core";

/**
 * Desktop's window state on a canvas: one window per place, z-order, minimize, maximize, Back and Forward. Rects are
 * canvas coordinates.
 */

/** What a window shows. Persisted in `desktop-canvas-prototype:windows:v2`, so fields are a stored contract. */
export type WindowSpec =
  | { kind: "finder"; key: string }
  | { kind: "thread"; threadId: string }
  /** A web page opened from a thread's chat, in bb's native browser bound to that thread. */
  | { kind: "browser"; threadId: string; tabId: string }
  /** A terminal in the thread's environment. */
  | { kind: "terminal"; threadId: string; tabId: string }
  /** A thread's details, docked beside its window (Desktop's Get Info). */
  | { kind: "info"; threadId: string }
  /** The threads in a thread's project or environment, docked beside its window (Desktop's Buddy List). */
  | { kind: "related"; threadId: string }
  | { kind: "threads" }
  | { kind: "recycle-bin" }
  | { kind: "new-folder"; at: Point | null }
  | { kind: "new-thread"; groupKey: string };

export type DockSide = "left" | "right";

export interface DesktopWindow {
  id: string;
  spec: WindowSpec;
  /** Where the window sits on the canvas; kept while it is docked or maximized, for when it returns. */
  rect: Rect;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Docked flush to the canvas's left or right edge, beside bb's panel, instead of floating on the canvas. */
  dock?: DockSide;
  /** Places this window showed before and after the current one, for Back and Forward. Kept in memory only. */
  history?: { back: WindowSpec[]; forward: WindowSpec[] };
}

export interface WindowState {
  windows: DesktopWindow[];
  nextZ: number;
}

export type WindowAction =
  | { type: "open"; spec: WindowSpec; rect: Rect }
  | { type: "focus"; id: string }
  | { type: "close-where"; predicate: (window: DesktopWindow) => boolean }
  | { type: "move"; id: string; rect: Rect; attached?: Record<string, Rect> }
  | { type: "minimize"; id: string; minimized: boolean }
  | { type: "maximize"; id: string; maximized: boolean }
  | { type: "dock"; id: string; side: DockSide | null; rect?: Rect }
  | { type: "arrange"; rects: Record<string, Rect> }
  | { type: "navigate"; id: string; spec: WindowSpec }
  | { type: "go"; id: string; direction: "back" | "forward" };

export const STORAGE_KEY = "desktop-canvas-prototype:windows:v2";

export function windowId(spec: WindowSpec): string {
  switch (spec.kind) {
    case "finder":
      return `finder:${spec.key}`;
    case "thread":
      return `thread:${spec.threadId}`;
    case "browser":
    case "terminal":
      return `${spec.kind}:${spec.tabId}`;
    case "info":
    case "related":
      return `${spec.kind}:${spec.threadId}`;
    case "new-thread":
      return `new-thread:${spec.groupKey}`;
    default:
      return spec.kind;
  }
}

/** The thread a window belongs to; archiving or deleting the thread closes all of them. */
export const threadIdOf = (spec: WindowSpec): string | null => ("threadId" in spec ? spec.threadId : null);

export function windowSize(spec: WindowSpec): Size {
  switch (spec.kind) {
    case "thread":
      return { width: 760, height: 640 };
    case "browser":
      return { width: 960, height: 680 };
    case "terminal":
      return { width: 720, height: 440 };
    case "info":
      return { width: 320, height: 640 };
    case "related":
      return { width: 300, height: 640 };
    case "finder":
    case "threads":
      return { width: 680, height: 480 };
    case "recycle-bin":
      return { width: 640, height: 440 };
    case "new-folder":
      return { width: 460, height: 540 };
    case "new-thread":
      return { width: 640, height: 300 };
  }
}

/** Shows `spec` in window `id`, like a folder opened inside an Explorer window. Another window showing it closes. */
function show(state: WindowState, id: string, spec: WindowSpec, history: { back: WindowSpec[]; forward: WindowSpec[] }): WindowState {
  const nextId = windowId(spec);
  if (!state.windows.some((window) => window.id === id) || nextId === id) return state;
  return {
    ...state,
    windows: state.windows.filter((window) => window.id !== nextId).map((window) => (window.id === id ? { ...window, id: nextId, spec, history } : window)),
  };
}

const update = (state: WindowState, id: string, change: (window: DesktopWindow) => DesktopWindow): WindowState => ({
  ...state,
  windows: state.windows.map((window) => (window.id === id ? change(window) : window)),
});

/** Whether `window` is an Info or Related threads window docked to `thread`'s window, which it moves and closes with. */
export function isAttached(window: DesktopWindow, thread: DesktopWindow): boolean {
  return thread.spec.kind === "thread" && (window.spec.kind === "info" || window.spec.kind === "related") && window.spec.threadId === thread.spec.threadId;
}

const DOCK_GAP = 8;
const MIN_ATTACHED_HEIGHT = 200;

/**
 * Where a window docked beside a thread goes when the thread moves from `from` to `to`: flush against the same side,
 * as tall as the thread.
 */
export function dockedRect(rect: Rect, from: Rect, to: Rect): Rect {
  const onRight = rect.x + rect.width / 2 >= from.x + from.width / 2;
  return { x: onRight ? to.x + to.width + DOCK_GAP : to.x - rect.width - DOCK_GAP, y: to.y, width: rect.width, height: Math.max(MIN_ATTACHED_HEIGHT, to.height) };
}

/** Where a companion opens beside its thread: Related threads on the left, Info on the right. */
export function besideRect(thread: Rect, side: "left" | "right", width: number): Rect {
  return { x: side === "right" ? thread.x + thread.width + DOCK_GAP : thread.x - width - DOCK_GAP, y: thread.y, width, height: Math.max(MIN_ATTACHED_HEIGHT, thread.height) };
}

export function windowReducer(state: WindowState, action: WindowAction): WindowState {
  switch (action.type) {
    case "open": {
      const id = windowId(action.spec);
      if (state.windows.some((window) => window.id === id)) return windowReducer(state, { type: "focus", id });
      return {
        nextZ: state.nextZ + 1,
        windows: [...state.windows, { id, spec: action.spec, rect: action.rect, z: state.nextZ, minimized: false, maximized: false }],
      };
    }
    case "focus": {
      const top = Math.max(0, ...state.windows.map((window) => window.z));
      const target = state.windows.find((window) => window.id === action.id);
      if (target === undefined || (target.z === top && !target.minimized)) return state;
      // A thread's companions come forward with it.
      const raised = new Map([...state.windows.filter((window) => isAttached(window, target)), target].map((window, index) => [window.id, state.nextZ + index]));
      return {
        nextZ: state.nextZ + raised.size,
        windows: state.windows.map((window) => {
          const z = raised.get(window.id);
          return z === undefined ? window : { ...window, z, minimized: false };
        }),
      };
    }
    case "close-where":
      return { ...state, windows: state.windows.filter((window) => !action.predicate(window)) };
    case "move": {
      // Companions take the rects the drag previewed, so they land where the person saw them.
      const attached = action.attached ?? {};
      return {
        ...state,
        windows: state.windows.map((window) => {
          if (window.id === action.id) return { ...window, rect: action.rect, maximized: false, dock: undefined };
          const docked = attached[window.id];
          return docked === undefined ? window : { ...window, rect: docked };
        }),
      };
    }
    case "minimize": {
      const target = state.windows.find((window) => window.id === action.id);
      if (target === undefined) return state;
      return {
        ...state,
        windows: state.windows.map((window) => (window.id === action.id || isAttached(window, target) ? { ...window, minimized: action.minimized } : window)),
      };
    }
    case "maximize":
      return update(state, action.id, (window) => ({ ...window, maximized: action.maximized, minimized: false, dock: action.maximized ? undefined : window.dock }));
    case "dock": {
      // Each side holds one window; the one it replaces goes back to its place on the canvas.
      if (!state.windows.some((window) => window.id === action.id)) return state;
      return {
        nextZ: state.nextZ + 1,
        windows: state.windows.map((window) => {
          if (window.id === action.id) {
            return { ...window, dock: action.side ?? undefined, rect: action.rect ?? window.rect, minimized: false, maximized: false, z: state.nextZ };
          }
          return action.side !== null && window.dock === action.side ? { ...window, dock: undefined } : window;
        }),
      };
    }
    case "arrange":
      return {
        ...state,
        windows: state.windows.map((window) => {
          const rect = action.rects[window.id];
          return rect === undefined ? window : { ...window, rect, minimized: false, maximized: false, dock: undefined };
        }),
      };
    case "navigate": {
      const current = state.windows.find((window) => window.id === action.id);
      if (current === undefined) return state;
      return show(state, action.id, action.spec, { back: [...(current.history?.back ?? []), current.spec], forward: [] });
    }
    case "go": {
      const current = state.windows.find((window) => window.id === action.id);
      if (current === undefined) return state;
      const back = current.history?.back ?? [];
      const forward = current.history?.forward ?? [];
      if (action.direction === "back") {
        const previous = back.at(-1);
        return previous === undefined ? state : show(state, action.id, previous, { back: back.slice(0, -1), forward: [current.spec, ...forward] });
      }
      const next = forward[0];
      return next === undefined ? state : show(state, action.id, next, { back: [...back, current.spec], forward: forward.slice(1) });
    }
  }
}

function isRect(value: unknown): value is Rect {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["x", "y", "width", "height"].every((key) => typeof record[key] === "number" && Number.isFinite(record[key]));
}

/** Reads a stored spec. The New folder and New thread forms are deliberately never restored. */
export function parseSpec(value: unknown): WindowSpec | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (record.kind === "finder" && typeof record.key === "string") return { kind: "finder", key: record.key };
  if (record.kind === "thread" && typeof record.threadId === "string") return { kind: "thread", threadId: record.threadId };
  if ((record.kind === "browser" || record.kind === "terminal") && typeof record.threadId === "string" && typeof record.tabId === "string") {
    return { kind: record.kind, threadId: record.threadId, tabId: record.tabId };
  }
  if ((record.kind === "info" || record.kind === "related") && typeof record.threadId === "string") return { kind: record.kind, threadId: record.threadId };
  if (record.kind === "threads" || record.kind === "recycle-bin") return { kind: record.kind };
  return null;
}

export function parseWindows(raw: string | null): WindowState {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return { windows: [], nextZ: 1 };
    const seen = new Set<string>();
    const docked = new Set<DockSide>();
    const windows = parsed.flatMap((entry: unknown): DesktopWindow[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const record = entry as Record<string, unknown>;
      const spec = parseSpec(record.spec);
      if (spec === null || !isRect(record.rect) || seen.has(windowId(spec))) return [];
      seen.add(windowId(spec));
      const side = record.dock === "left" || record.dock === "right" ? record.dock : undefined;
      return [{
        id: windowId(spec),
        spec,
        rect: record.rect,
        z: typeof record.z === "number" ? record.z : 1,
        minimized: record.minimized === true,
        maximized: record.maximized === true,
        ...(side === undefined ? {} : { dock: side }),
      }];
    });
    // One window per side: the most recently raised keeps it.
    for (const window of [...windows].sort((a, b) => b.z - a.z)) {
      if (window.dock === undefined) continue;
      if (docked.has(window.dock)) delete window.dock;
      else docked.add(window.dock);
    }
    return { windows, nextZ: Math.max(0, ...windows.map((window) => window.z)) + 1 };
  } catch {
    return { windows: [], nextZ: 1 };
  }
}

export function serializeWindows(windows: readonly DesktopWindow[]): string {
  return JSON.stringify(
    windows.filter((window) => parseSpec(window.spec) !== null).map(({ spec, rect, z, minimized, maximized, dock }) => ({ spec, rect, z, minimized, maximized, dock })),
  );
}

export function loadWindows(): WindowState {
  try {
    return parseWindows(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { windows: [], nextZ: 1 };
  }
}

/** Where a new window opens: centered in the current view, cascading by `stagger`, in canvas coordinates. */
export function defaultRect(spec: WindowSpec, stagger: number, camera: Camera, area: Rect): Rect {
  const size = windowSize(spec);
  const center = toWorld(camera, { x: area.x + area.width / 2, y: area.y + area.height / 2 });
  const offset = (stagger % 8) * 28;
  return { ...size, x: Math.round(center.x - size.width / 2 + offset), y: Math.round(center.y - size.height / 2 + offset) };
}
