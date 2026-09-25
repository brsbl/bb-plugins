import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { CloseGlyph, MaximizeGlyph, MinusGlyph, RestoreGlyph } from "./art";

import { clampRect, resizeRect, type Rect, type ResizeEdge } from "./core";

export type WindowSpec =
  | { kind: "finder"; key: string }
  | { kind: "thread"; threadId: string }
  | { kind: "panel"; threadId: string }
  | { kind: "threads" }
  | { kind: "notifications" }
  | { kind: "new-folder" }
  | { kind: "new-thread"; groupKey: string | null }
  | { kind: "new-webhook" }
  | { kind: "webhook"; webhookId: string };

export interface DesktopWindow {
  id: string;
  spec: WindowSpec;
  rect: Rect;
  z: number;
  minimized: boolean;
  restoreRect: Rect | null;
}

interface WindowState {
  windows: DesktopWindow[];
  nextZ: number;
}

type Action =
  | { type: "open"; spec: WindowSpec; rect: Rect }
  | { type: "focus"; id: string }
  | { type: "close"; id: string }
  | { type: "close-where"; predicate: (window: DesktopWindow) => boolean }
  | { type: "move"; id: string; rect: Rect }
  | { type: "minimize"; id: string; minimized: boolean }
  | { type: "maximize"; id: string; viewport: Rect }
  | { type: "arrange"; rects: Record<string, Rect> };

const STORAGE_KEY = "bb-desktop:windows:v1";

export function windowId(spec: WindowSpec): string {
  switch (spec.kind) {
    case "finder":
      return `finder:${spec.key}`;
    case "thread":
    case "panel":
      return `${spec.kind}:${spec.threadId}`;
    case "webhook":
      return `webhook:${spec.webhookId}`;
    case "new-thread":
      return `new-thread:${spec.groupKey ?? "desktop"}`;
    default:
      return spec.kind;
  }
}

function reducer(state: WindowState, action: Action): WindowState {
  switch (action.type) {
    case "open": {
      const id = windowId(action.spec);
      const existing = state.windows.find((window) => window.id === id);
      if (existing !== undefined) return reducer(state, { type: "focus", id });
      return {
        nextZ: state.nextZ + 1,
        windows: [
          ...state.windows,
          {
            id,
            spec: action.spec,
            rect: action.rect,
            z: state.nextZ,
            minimized: false,
            restoreRect: null,
          },
        ],
      };
    }
    case "focus": {
      const top = Math.max(0, ...state.windows.map((window) => window.z));
      const target = state.windows.find((window) => window.id === action.id);
      if (target === undefined || (target.z === top && !target.minimized)) return state;
      return {
        nextZ: state.nextZ + 1,
        windows: state.windows.map((window) =>
          window.id === action.id
            ? { ...window, z: state.nextZ, minimized: false }
            : window,
        ),
      };
    }
    case "close":
      return {
        ...state,
        windows: state.windows.filter((window) => window.id !== action.id),
      };
    case "close-where":
      return {
        ...state,
        windows: state.windows.filter((window) => !action.predicate(window)),
      };
    case "move":
      return {
        ...state,
        windows: state.windows.map((window) =>
          window.id === action.id
            ? { ...window, rect: action.rect, restoreRect: null }
            : window,
        ),
      };
    case "minimize":
      return {
        ...state,
        windows: state.windows.map((window) =>
          window.id === action.id ? { ...window, minimized: action.minimized } : window,
        ),
      };
    case "maximize":
      return {
        ...state,
        windows: state.windows.map((window) => {
          if (window.id !== action.id) return window;
          return window.restoreRect !== null
            ? { ...window, rect: window.restoreRect, restoreRect: null }
            : { ...window, rect: action.viewport, restoreRect: window.rect };
        }),
      };
    case "arrange":
      return {
        ...state,
        windows: state.windows.map((window) => {
          const rect = action.rects[window.id];
          return rect === undefined
            ? window
            : { ...window, rect, minimized: false, restoreRect: null };
        }),
      };
  }
}

function isRect(value: unknown): value is Rect {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return ["x", "y", "width", "height"].every(
    (key) => typeof record[key] === "number" && Number.isFinite(record[key]),
  );
}

function parseSpec(value: unknown): WindowSpec | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const text = (key: string) => (typeof record[key] === "string" ? String(record[key]) : null);
  switch (record.kind) {
    case "finder":
      return text("key") === null ? null : { kind: "finder", key: text("key")! };
    case "thread":
    case "panel":
      return text("threadId") === null ? null : { kind: record.kind, threadId: text("threadId")! };
    case "webhook":
      return text("webhookId") === null ? null : { kind: "webhook", webhookId: text("webhookId")! };
    case "threads":
    case "notifications":
      return { kind: record.kind };
    default:
      return null;
  }
}

function loadState(): WindowState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return { windows: [], nextZ: 1 };
    const windows = parsed.flatMap((entry: unknown): DesktopWindow[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const record = entry as Record<string, unknown>;
      const spec = parseSpec(record.spec);
      if (spec === null || !isRect(record.rect)) return [];
      return [
        {
          id: windowId(spec),
          spec,
          rect: record.rect,
          z: typeof record.z === "number" ? record.z : 1,
          minimized: record.minimized === true,
          restoreRect: isRect(record.restoreRect) ? record.restoreRect : null,
        },
      ];
    });
    return { windows, nextZ: Math.max(0, ...windows.map((window) => window.z)) + 1 };
  } catch {
    return { windows: [], nextZ: 1 };
  }
}

export function viewportRect(): Rect {
  return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
}

const DOCK_RESERVE = 80;

export function workAreaRect(): Rect {
  return { x: 0, y: 0, width: window.innerWidth, height: Math.max(200, window.innerHeight - DOCK_RESERVE) };
}

export function defaultRect(spec: WindowSpec, stagger: number): Rect {
  const viewport = viewportRect();
  const size =
    spec.kind === "thread"
      ? { width: 620, height: 640 }
      : spec.kind === "panel" || spec.kind === "threads"
        ? { width: 320, height: 560 }
        : spec.kind === "new-thread" || spec.kind === "new-webhook"
          ? { width: 720, height: 420 }
          : spec.kind === "notifications"
            ? { width: 380, height: 460 }
            : spec.kind === "new-folder"
              ? { width: 440, height: 480 }
              : { width: 560, height: 400 };
  const offset = (stagger % 8) * 28;
  return clampRect(
    {
      ...size,
      x: Math.round((viewport.width - size.width) / 2) + offset - 84,
      y: Math.round((viewport.height - size.height) / 3) + offset,
    },
    viewport,
  );
}

interface WindowManager {
  windows: DesktopWindow[];
  focusedId: string | null;
  open(spec: WindowSpec, rect?: Rect): void;
  focus(id: string): void;
  close(id: string): void;
  closeWhere(predicate: (window: DesktopWindow) => boolean): void;
  move(id: string, rect: Rect): void;
  minimize(id: string, minimized: boolean): void;
  toggleMaximize(id: string): void;
  arrange(rects: Record<string, Rect>): void;
}

const WindowManagerContext = createContext<WindowManager | null>(null);

export function useWindowManager(): WindowManager {
  const manager = useContext(WindowManagerContext);
  if (manager === null) throw new Error("useWindowManager outside WindowManagerProvider");
  return manager;
}

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    const persisted = state.windows
      .filter((window) => parseSpec(window.spec) !== null)
      .map(({ spec, rect, z, minimized, restoreRect }) => ({
        spec,
        rect,
        z,
        minimized,
        restoreRect,
      }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      return;
    }
  }, [state.windows]);

  const countRef = useRef(state.windows.length);
  countRef.current = state.windows.length;

  const open = useCallback((spec: WindowSpec, rect?: Rect) => {
    dispatch({ type: "open", spec, rect: rect ?? defaultRect(spec, countRef.current) });
  }, []);

  const manager = useMemo<WindowManager>(() => {
    const focused = state.windows
      .filter((window) => !window.minimized)
      .reduce<DesktopWindow | null>(
      (top, window) => (top === null || window.z > top.z ? window : top),
      null,
    );
    return {
      windows: state.windows,
      focusedId: focused?.id ?? null,
      open,
      focus: (id) => dispatch({ type: "focus", id }),
      close: (id) => dispatch({ type: "close", id }),
      closeWhere: (predicate) => dispatch({ type: "close-where", predicate }),
      move: (id, rect) => dispatch({ type: "move", id, rect }),
      minimize: (id, minimized) => dispatch({ type: "minimize", id, minimized }),
      toggleMaximize: (id) => dispatch({ type: "maximize", id, viewport: workAreaRect() }),
      arrange: (rects) => dispatch({ type: "arrange", rects }),
    };
  }, [open, state.windows]);

  return (
    <WindowManagerContext.Provider value={manager}>{children}</WindowManagerContext.Provider>
  );
}

const EDGES: readonly ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (delta: { x: number; y: number }) => void,
  onEnd?: () => void,
) {
  if (event.button !== 0) return;
  const target = event.currentTarget;
  const start = { x: event.clientX, y: event.clientY };
  target.setPointerCapture(event.pointerId);
  const blockSelection = (selection: Event) => selection.preventDefault();
  document.addEventListener("selectstart", blockSelection);
  window.getSelection()?.removeAllRanges();
  const move = (next: PointerEvent) =>
    onMove({ x: next.clientX - start.x, y: next.clientY - start.y });
  const end = () => {
    document.removeEventListener("selectstart", blockSelection);
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", end);
    target.removeEventListener("pointercancel", end);
    onEnd?.();
  };
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", end);
  target.addEventListener("pointercancel", end);
}

export function WindowFrame({
  window: desktopWindow,
  title,
  icon,
  titleActions,
  statusBar,
  children,
}: {
  window: DesktopWindow;
  title: string;
  icon: ReactNode;
  titleActions?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
}) {
  const manager = useWindowManager();
  const { id, rect } = desktopWindow;
  const focused = manager.focusedId === id;
  const maximized = desktopWindow.restoreRect !== null;

  const startMove = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button") !== null) return;
    manager.focus(id);
    if (maximized) return;
    trackPointer(event, (delta) =>
      manager.move(
        id,
        clampRect({ ...rect, x: rect.x + delta.x, y: rect.y + delta.y }, viewportRect()),
      ),
    );
  };

  const startResize = (edge: ResizeEdge) => (event: ReactPointerEvent<HTMLElement>) => {
    manager.focus(id);
    trackPointer(event, (delta) =>
      manager.move(id, clampRect(resizeRect(rect, edge, delta), viewportRect())),
    );
  };

  if (desktopWindow.minimized) return null;

  return (
    <section
      role="dialog"
      aria-label={title}
      className="bbd-window"
      data-focused={focused}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: desktopWindow.z,
      }}
      onPointerDownCapture={() => manager.focus(id)}
    >
      <header
        className="bbd-titlebar"
        onPointerDown={startMove}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest("button") === null) {
            manager.toggleMaximize(id);
          }
        }}
      >
        <span className="flex size-4 flex-none items-center justify-center">{icon}</span>
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {titleActions}
        <button
          type="button"
          className="bbd-titlebar-button"
          aria-label="Minimize"
          title="Minimize to the dock"
          onClick={() => manager.minimize(id, true)}
        >
          <MinusGlyph className="size-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="bbd-titlebar-button"
          aria-label={maximized ? "Restore" : "Maximize"}
          title={maximized ? "Restore" : "Maximize"}
          onClick={() => manager.toggleMaximize(id)}
        >
          {maximized ? (
            <RestoreGlyph className="size-3.5" strokeWidth={2} />
          ) : (
            <MaximizeGlyph className="size-3.5" strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          className="bbd-titlebar-button ml-0.5"
          data-variant="close"
          aria-label="Close"
          title="Close"
          onClick={() => manager.close(id)}
        >
          <CloseGlyph className="size-3.5" strokeWidth={2} />
        </button>
      </header>
      <div className="bbd-window-body">{children}</div>
      {statusBar !== undefined ? <footer className="bbd-statusbar">{statusBar}</footer> : null}
      {maximized
        ? null
        : EDGES.map((edge) => (
            <div
              key={edge}
              className="bbd-resize"
              data-edge={edge}
              aria-hidden
              onPointerDown={startResize(edge)}
            />
          ))}
      {maximized ? null : <div className="bbd-grip" aria-hidden />}
    </section>
  );
}

export { trackPointer };
