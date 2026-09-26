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
}

export interface WindowState {
  windows: DesktopWindow[];
  nextZ: number;
}

export type WindowAction =
  | { type: "open"; spec: WindowSpec; rect: Rect }
  | { type: "focus"; id: string }
  | { type: "close-where"; predicate: (window: DesktopWindow) => boolean }
  | { type: "move"; id: string; rect: Rect }
  | { type: "minimize"; id: string; minimized: boolean }
  | { type: "maximize"; id: string; viewport: Rect }
  | { type: "fit-maximized"; viewport: Rect }
  | { type: "arrange"; rects: Record<string, Rect> };

export const STORAGE_KEY = "bb-desktop:windows:v1";

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
      return { ...update(state, action.id, (window) => ({ ...window, z: state.nextZ, minimized: false })), nextZ: state.nextZ + 1 };
    }
    case "close-where":
      return { ...state, windows: state.windows.filter((window) => !action.predicate(window)) };
    case "move":
      return update(state, action.id, (window) => ({ ...window, rect: action.rect, restoreRect: null }));
    case "minimize":
      return update(state, action.id, (window) => ({ ...window, minimized: action.minimized }));
    case "maximize":
      return update(state, action.id, (window) =>
        window.restoreRect !== null
          ? { ...window, rect: fitDragRect(window.restoreRect, action.viewport), restoreRect: null }
          : { ...window, rect: action.viewport, restoreRect: window.rect },
      );
    case "fit-maximized": {
      const { viewport } = action;
      const fitted = (window: DesktopWindow) => (window.restoreRect !== null ? viewport : fitDragRect(window.rect, viewport));
      if (state.windows.every((window) => sameRect(window.rect, fitted(window)))) return state;
      return { ...state, windows: state.windows.map((window) => ({ ...window, rect: fitted(window) })) };
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

/** Parses stored windows, refitting each to `area` (the current work area). */
export function parseWindows(raw: string | null, area: Rect): WindowState {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return { windows: [], nextZ: 1 };
    const windows = parsed.flatMap((entry: unknown): DesktopWindow[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const record = entry as Record<string, unknown>;
      const spec = parseSpec(record.spec);
      if (spec === null || !isRect(record.rect)) return [];
      const restoreRect = isRect(record.restoreRect) ? fitDragRect(record.restoreRect, area) : null;
      return [
        {
          id: windowId(spec),
          spec,
          rect: restoreRect === null ? fitDragRect(record.rect, area) : area,
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
