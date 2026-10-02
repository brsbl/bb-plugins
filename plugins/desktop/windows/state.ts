import type { Rect } from "../core";
import { fitDragRect, sameRect, workAreaRect } from "./geometry";
import { parseSpec, windowId, type WindowSpec } from "./specs";

export interface DesktopWindow {
  id: string;
  spec: WindowSpec;
  rect: Rect;
  z: number;
  minimized: boolean;
  /** The pre-maximize rect; non-null means the window is maximized. */
  restoreRect: Rect | null;
  openedThisSession: boolean;
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
  | { type: "maximize"; id: string; viewport: Rect }
  | { type: "fit-maximized"; viewport: Rect }
  | { type: "arrange"; rects: Record<string, Rect> }
  | { type: "navigate"; id: string; spec: WindowSpec }
  | { type: "go"; id: string; direction: "back" | "forward" };

export const STORAGE_KEY = "bb-desktop:windows:v1";

/**
 * Shows `spec` in window `id`, like a folder opened inside an Explorer window. Another window already showing it
 * closes, since a place has one window.
 */
function show(state: WindowState, id: string, spec: WindowSpec, history: { back: WindowSpec[]; forward: WindowSpec[] }): WindowState {
  const nextId = windowId(spec);
  const current = state.windows.find((window) => window.id === id);
  if (current === undefined || nextId === id) return state;
  return {
    ...state,
    windows: state.windows
      .filter((window) => window.id !== nextId)
      .map((window) => (window.id === id ? { ...window, id: nextId, spec, history } : window)),
  };
}

/** Whether `window` is a Buddy List or Buddy Info docked to `thread`'s Instant Message, which it moves and closes with. */
export function isAttached(window: DesktopWindow, thread: DesktopWindow): boolean {
  return (
    thread.spec.kind === "thread" &&
    (window.spec.kind === "panel" || window.spec.kind === "buddy-list") &&
    window.spec.threadId === thread.spec.threadId
  );
}

/** Where a window docked beside a thread goes when the thread moves from `from` to `to`: it keeps to its side and height. */
export function dockedRect(rect: Rect, from: Rect, to: Rect): Rect {
  const onRight = rect.x + rect.width / 2 >= from.x + from.width / 2;
  return {
    x: rect.x + (onRight ? to.x + to.width - (from.x + from.width) : to.x - from.x),
    y: rect.y + to.y - from.y,
    width: rect.width,
    height: Math.max(MIN_ATTACHED_HEIGHT, rect.height + to.height - from.height),
  };
}

const MIN_ATTACHED_HEIGHT = 160;

function update(state: WindowState, id: string, change: (window: DesktopWindow) => DesktopWindow): WindowState {
  return { ...state, windows: state.windows.map((window) => (window.id === id ? change(window) : window)) };
}

export function windowReducer(state: WindowState, action: WindowAction): WindowState {
  switch (action.type) {
    case "open": {
      const id = windowId(action.spec);
      if (state.windows.some((window) => window.id === id)) return windowReducer(state, { type: "focus", id });
      return {
        nextZ: state.nextZ + 1,
        windows: [
          ...state.windows,
          { id, spec: action.spec, rect: action.rect, z: state.nextZ, minimized: false, restoreRect: null, openedThisSession: true },
        ],
      };
    }
    case "focus": {
      const top = Math.max(0, ...state.windows.map((window) => window.z));
      const target = state.windows.find((window) => window.id === action.id);
      if (target === undefined || (target.z === top && !target.minimized)) return state;
      const attached = state.windows.filter((window) => isAttached(window, target));
      const raised = new Map([...attached, target].map((window, index) => [window.id, state.nextZ + index]));
      return {
        windows: state.windows.map((window) => {
          const z = raised.get(window.id);
          return z === undefined ? window : { ...window, z, minimized: false };
        }),
        nextZ: state.nextZ + raised.size,
      };
    }
    case "close-where":
      return { ...state, windows: state.windows.filter((window) => !action.predicate(window)) };
    case "move": {
      // Docked windows take the rects the drag previewed, so they land where the person saw them.
      const attached = action.attached ?? {};
      return {
        ...state,
        windows: state.windows.map((window) => {
          if (window.id === action.id) return { ...window, rect: action.rect, restoreRect: null };
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
        windows: state.windows.map((window) =>
          window.id === action.id || isAttached(window, target) ? { ...window, minimized: action.minimized } : window,
        ),
      };
    }
    case "maximize":
      return update(state, action.id, (window) =>
        window.restoreRect !== null
          ? { ...window, rect: window.restoreRect, restoreRect: null }
          : { ...window, rect: action.viewport, restoreRect: window.rect },
      );
    case "fit-maximized": {
      // Only maximized windows track the work area; the rest keep their rects and are fitted when shown (`placeWindows`).
      const { viewport } = action;
      if (state.windows.every((window) => window.restoreRect === null || sameRect(window.rect, viewport))) return state;
      return { ...state, windows: state.windows.map((window) => (window.restoreRect === null ? window : { ...window, rect: viewport })) };
    }
    case "navigate": {
      const current = state.windows.find((window) => window.id === action.id);
      if (current === undefined) return state;
      return show(state, action.id, action.spec, { back: [...(current.history?.back ?? []), current.spec], forward: [] });
    }
    case "go": {
      const current = state.windows.find((window) => window.id === action.id);
      const back = current?.history?.back ?? [];
      const forward = current?.history?.forward ?? [];
      if (current === undefined) return state;
      if (action.direction === "back") {
        const previous = back.at(-1);
        return previous === undefined ? state : show(state, action.id, previous, { back: back.slice(0, -1), forward: [current.spec, ...forward] });
      }
      const next = forward[0];
      return next === undefined ? state : show(state, action.id, next, { back: [...back, current.spec], forward: forward.slice(1) });
    }
    case "arrange":
      return {
        ...state,
        windows: state.windows.map((window) => {
          const rect = action.rects[window.id];
          return rect === undefined ? window : { ...window, rect, minimized: false, restoreRect: null };
        }),
      };
  }
}

function isRect(value: unknown): value is Rect {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["x", "y", "width", "height"].every((key) => typeof record[key] === "number" && Number.isFinite(record[key]));
}

/**
 * Where windows show in `area`, the current work area. Stored rects stay as the person left them, so a viewport that
 * shrinks for a moment doesn't shrink every window for good; only the shown copy is fitted.
 */
export function placeWindows(windows: DesktopWindow[], area: Rect): DesktopWindow[] {
  return windows.map((window) => {
    if (window.restoreRect !== null) return window;
    const rect = fitDragRect(window.rect, area);
    return sameRect(rect, window.rect) ? window : { ...window, rect };
  });
}

/** Parses stored windows as they were left; a maximized one fills `area` (the current work area). */
export function parseWindows(raw: string | null, area: Rect): WindowState {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return { windows: [], nextZ: 1 };
    const windows = parsed.flatMap((entry: unknown): DesktopWindow[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const record = entry as Record<string, unknown>;
      const spec = parseSpec(record.spec);
      if (spec === null || !isRect(record.rect)) return [];
      const restoreRect = isRect(record.restoreRect) ? record.restoreRect : null;
      return [
        {
          id: windowId(spec),
          spec,
          rect: restoreRect === null ? record.rect : area,
          z: typeof record.z === "number" ? record.z : 1,
          minimized: record.minimized === true,
          restoreRect,
          openedThisSession: false,
        },
      ];
    });
    return { windows, nextZ: Math.max(0, ...windows.map((window) => window.z)) + 1 };
  } catch {
    return { windows: [], nextZ: 1 };
  }
}

export function serializeWindows(windows: readonly DesktopWindow[]): string {
  return JSON.stringify(
    windows
      .filter((window) => parseSpec(window.spec) !== null)
      .map(({ spec, rect, z, minimized, restoreRect }) => ({ spec, rect, z, minimized, restoreRect })),
  );
}

export function loadWindows(): WindowState {
  try {
    return parseWindows(localStorage.getItem(STORAGE_KEY), workAreaRect());
  } catch {
    return { windows: [], nextZ: 1 };
  }
}

export function saveWindows(windows: readonly DesktopWindow[]) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeWindows(windows));
  } catch {
    return;
  }
}
