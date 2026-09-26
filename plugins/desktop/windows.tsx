import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { CloseGlyph, MaximizeGlyph, MinusGlyph, RestoreGlyph } from "./art";

import { findApp } from "./bridge";
import { resizeRect, type Point, type Rect, type ResizeEdge } from "./core";

let nudges: ReadonlyMap<string, Point> = new Map();
const nudgeListeners = new Set<() => void>();

function subscribeNudges(listener: () => void) {
  nudgeListeners.add(listener);
  return () => nudgeListeners.delete(listener);
}

export function setWindowNudges(next: ReadonlyMap<string, Point>) {
  if (next.size === 0 && nudges.size === 0) return;
  nudges = next;
  for (const listener of nudgeListeners) listener();
}

function takeWindowNudge(id: string): Point | undefined {
  const nudge = nudges.get(id);
  if (nudge === undefined) return undefined;
  const next = new Map(nudges);
  next.delete(id);
  setWindowNudges(next);
  return nudge;
}

export type WindowSpec =
  | { kind: "finder"; key: string }
  | { kind: "thread"; threadId: string }
  | { kind: "panel"; threadId: string }
  | { kind: "buddy-list"; threadId: string }
  | { kind: "thread-tab"; threadId: string; tab: ThreadTabKind; tabId: string }
  | { kind: "threads" }
  | { kind: "recycle-bin" }
  | { kind: "more" }
  | { kind: "minesweeper" }
  | { kind: "solitaire" }
  | { kind: "pinball" }
  | { kind: "command-prompt" }
  | { kind: "paint" }
  | { kind: "internet-explorer" }
  | { kind: "app"; key: string }
  | { kind: "new-folder" }
  | { kind: "media-player" }
  | { kind: "new-thread"; groupKey: string | null };

export type ThreadTabKind = "browser" | "terminal";

export interface DesktopWindow {
  id: string;
  spec: WindowSpec;
  rect: Rect;
  z: number;
  minimized: boolean;
  restoreRect: Rect | null;
  openedThisSession: boolean;
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
  | { type: "fit-maximized"; viewport: Rect }
  | { type: "arrange"; rects: Record<string, Rect> };

const STORAGE_KEY = "bb-desktop:windows:v1";

export function windowId(spec: WindowSpec): string {
  switch (spec.kind) {
    case "finder":
      return `finder:${spec.key}`;
    case "thread":
    case "panel":
    case "buddy-list":
      return `${spec.kind}:${spec.threadId}`;
    case "thread-tab":
      return `thread-tab:${spec.tabId}`;
    case "new-thread":
      return `new-thread:${spec.groupKey ?? "desktop"}`;
    case "app":
      return `app:${spec.key}`;
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
            openedThisSession: true,
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
            ? { ...window, rect: fitDragRect(window.restoreRect, action.viewport), restoreRect: null }
            : { ...window, rect: action.viewport, restoreRect: window.rect };
        }),
      };
    case "fit-maximized": {
      const { viewport } = action;
      const fitted = (window: DesktopWindow) => window.restoreRect !== null ? viewport : fitDragRect(window.rect, viewport);
      const stale = state.windows.some((window) => !sameRect(window.rect, fitted(window)));
      if (!stale) return state;
      return {
        ...state,
        windows: state.windows.map((window) => ({ ...window, rect: fitted(window) })),
      };
    }
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
    case "app":
      return text("key") === null ? null : { kind: "app", key: text("key")! };
    case "thread":
    case "panel":
    case "buddy-list":
      return text("threadId") === null ? null : { kind: record.kind, threadId: text("threadId")! };
    case "thread-tab":
      return text("threadId") === null || text("tabId") === null || (record.tab !== "browser" && record.tab !== "terminal")
        ? null
        : { kind: "thread-tab", threadId: text("threadId")!, tab: record.tab, tabId: text("tabId")! };
    case "threads":
    case "recycle-bin":
    case "more":
    case "minesweeper":
    case "solitaire":
    case "pinball":
    case "command-prompt":
    case "paint":
    case "internet-explorer":
    case "media-player":
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
      const restoreRect = isRect(record.restoreRect) ? fitDragRect(record.restoreRect, workAreaRect()) : null;
      return [
        {
          id: windowId(spec),
          spec,
          rect: restoreRect === null ? fitDragRect(record.rect, workAreaRect()) : workAreaRect(),
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

const DOCK_RESERVE = 80;
const TASKBAR_GAP = 6;

/** The viewport below bb's chrome and above the floating taskbar, which is what a maximized window fills. */
export function workAreaRect(): Rect {
  const top = chromeTop();
  const taskbar = document.querySelector(".bbd-taskbar")?.getBoundingClientRect();
  const bottom = taskbar !== undefined && taskbar.height > 0 ? taskbar.top - TASKBAR_GAP : window.innerHeight - DOCK_RESERVE;
  return { x: 0, y: top, width: window.innerWidth, height: Math.max(0, bottom - top) };
}

function sameRect(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function defaultRect(spec: WindowSpec, stagger: number): Rect {
  const viewport = workAreaRect();
  const size =
    spec.kind === "thread"
      ? { width: 620, height: 640 }
      : spec.kind === "panel"
        ? { width: 320, height: 560 }
      : spec.kind === "buddy-list"
        ? { width: 280, height: 560 }
        : spec.kind === "threads" || spec.kind === "recycle-bin"
          ? { width: 460, height: 560 }
        : spec.kind === "thread-tab"
          ? spec.tab === "browser" ? { width: 880, height: 640 } : { width: 680, height: 420 }
        : spec.kind === "new-thread"
          ? { width: 720, height: 420 }
          : spec.kind === "new-folder"
            ? { width: 440, height: 480 }
            : spec.kind === "media-player"
              ? { width: 480, height: 380 }
            : spec.kind === "minesweeper"
              ? { width: 300, height: 400 }
            : spec.kind === "solitaire"
              ? { width: 720, height: 540 }
            : spec.kind === "pinball"
              ? { width: 640, height: 560 }
            : spec.kind === "command-prompt"
              ? { width: 680, height: 420 }
            : spec.kind === "paint"
              ? { width: 780, height: 580 }
            : spec.kind === "internet-explorer"
              ? { width: 880, height: 640 }
            : spec.kind === "app"
              ? { width: findApp(spec.key)?.width ?? 520, height: findApp(spec.key)?.height ?? 420 }
            : { width: 560, height: 400 };
  const offset = (stagger % 8) * 28;
  return fitDragRect(
    {
      ...size,
      x: Math.round((viewport.width - size.width) / 2) + offset - 84,
      y: viewport.y + Math.round((viewport.height - size.height) / 3) + offset,
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
  /** Re-fits maximized windows to the work area, e.g. once the taskbar has rendered and can be measured. */
  fitMaximized(): void;
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

  // Maximized windows track the work area as the bb window resizes, and pick up the taskbar's real height once it renders.
  useEffect(() => {
    const fit = () => dispatch({ type: "fit-maximized", viewport: workAreaRect() });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

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
      fitMaximized: () => dispatch({ type: "fit-maximized", viewport: workAreaRect() }),
      arrange: (rects) => dispatch({ type: "arrange", rects }),
    };
  }, [open, state.windows]);

  return (
    <WindowManagerContext.Provider value={manager}>{children}</WindowManagerContext.Provider>
  );
}

const EDGES: readonly ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

export const DRAG_THRESHOLD = 4;

export function crossedDragThreshold(delta: Point, threshold = DRAG_THRESHOLD): boolean {
  return Math.hypot(delta.x, delta.y) >= threshold;
}

/** Keep the whole frame inside the usable desktop, including on tiny viewports. */
export function fitDragRect(rect: Rect, area: Rect, minimum = { width: 280, height: 180 }): Rect {
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

let cancelActivePointer: (() => void) | undefined;

function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (delta: Point, event: PointerEvent) => void,
  onEnd?: (cancelled: boolean, moved: boolean) => void,
  options: { threshold?: number; samples?: boolean } = {},
): () => void {
  if (event.button !== 0 || event.isPrimary === false) return () => {};
  cancelActivePointer?.();
  const target = event.currentTarget;
  const pointerId = event.pointerId;
  const start = { x: event.clientX, y: event.clientY };
  let moved = false;
  let ended = false;
  let frame = 0;
  let latest: PointerEvent | null = null;
  let samples: PointerEvent[] = [];
  const selection = document.documentElement.style.userSelect;
  const shield = document.createElement("div");
  shield.className = "bbd-drag-shield";
  const blockSelection = (selectionEvent: Event) => selectionEvent.preventDefault();
  const flush = () => {
    frame = 0;
    if (latest === null) return;
    const next = latest;
    latest = null;
    const batch = options.samples ? samples : [next];
    samples = [];
    for (const sample of batch) onMove({ x: sample.clientX - start.x, y: sample.clientY - start.y }, sample);
  };
  const move = (next: PointerEvent) => {
    if (next.pointerId !== pointerId) return;
    const delta = { x: next.clientX - start.x, y: next.clientY - start.y };
    if (!moved && !crossedDragThreshold(delta, options.threshold)) return;
    if (!moved) {
      moved = true;
      document.documentElement.style.userSelect = "none";
      document.addEventListener("selectstart", blockSelection);
      window.getSelection()?.removeAllRanges();
      document.body.append(shield);
      window.dispatchEvent(new Event("bbd-drag-state"));
    }
    latest = next;
    if (options.samples) {
      const coalesced = next.getCoalescedEvents?.() ?? [];
      samples.push(...(coalesced.length ? coalesced : [next]));
    }
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const end = (cancelled: boolean) => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(frame);
    if (!cancelled) flush();
    window.removeEventListener("pointermove", move, true);
    window.removeEventListener("pointerup", up, true);
    window.removeEventListener("pointercancel", cancelPointer, true);
    window.removeEventListener("pointerdown", cancel, true);
    window.removeEventListener("keydown", key, true);
    window.removeEventListener("blur", cancel);
    window.removeEventListener("resize", cancel);
    window.removeEventListener("contextmenu", cancel, true);
    document.removeEventListener("visibilitychange", cancel);
    target.removeEventListener("lostpointercapture", cancelPointer);
    document.removeEventListener("selectstart", blockSelection);
    if (moved) document.documentElement.style.userSelect = selection;
    shield.remove();
    if (cancelActivePointer === cancel) cancelActivePointer = undefined;
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    // Suppress only the click belonging to this completed drag. A later click is unaffected.
    if (moved) {
      const suppress = (click: MouseEvent) => { click.preventDefault(); click.stopImmediatePropagation(); };
      window.addEventListener("click", suppress, true);
      window.addEventListener("dblclick", suppress, true);
      setTimeout(() => {
        window.removeEventListener("click", suppress, true);
        window.removeEventListener("dblclick", suppress, true);
      }, 0);
    }
    onEnd?.(cancelled, moved);
    window.dispatchEvent(new Event("bbd-drag-state"));
  };
  const cancel = () => end(true);
  const cancelPointer = (next: PointerEvent) => { if (next.pointerId === pointerId) cancel(); };
  const key = (next: KeyboardEvent) => { if (next.key === "Escape") { next.preventDefault(); cancel(); } };
  const up = (next: PointerEvent) => {
    if (next.pointerId !== pointerId) return;
    if (moved) move(next);
    end(false);
  };
  target.setPointerCapture(pointerId);
  cancelActivePointer = cancel;
  window.addEventListener("pointermove", move, true);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", cancelPointer, true);
  window.addEventListener("pointerdown", cancel, true);
  window.addEventListener("keydown", key, true);
  window.addEventListener("blur", cancel);
  window.addEventListener("resize", cancel);
  window.addEventListener("contextmenu", cancel, true);
  document.addEventListener("visibilitychange", cancel);
  target.addEventListener("lostpointercapture", cancelPointer);
  return cancel;
}

/** Component ownership also cancels capture when a window/app unmounts. */
export function usePointerTracker() {
  const cancel = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => cancel.current?.(), []);
  return (...args: Parameters<typeof trackPointer>) => {
    cancel.current?.();
    cancel.current = trackPointer(...args);
  };
}

export function previewRect(element: HTMLElement, rect: Rect) {
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

/** Shared title chrome; note pads retain their own persisted placement and lifecycle. */
export function WindowTitleBar({ title, icon, titleActions, maximized, onPointerDown, onDoubleClick, onMinimize, onMaximize, onClose }: {
  title: string; icon: ReactNode; titleActions?: ReactNode; maximized?: boolean;
  onPointerDown?: React.PointerEventHandler<HTMLElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLElement>;
  onMinimize?: () => void; onMaximize?: () => void; onClose: () => void;
}) {
  return <header className="bbd-titlebar" onPointerDown={onPointerDown} onDoubleClick={onDoubleClick}>
    <span className="flex size-4 flex-none items-center justify-center">{icon}</span>
    <span className="min-w-0 flex-1 truncate">{title}</span>
    {titleActions}
    {onMinimize && <button type="button" className="bbd-titlebar-button" aria-label="Minimize" title="Minimize to the dock" onClick={onMinimize}><MinusGlyph className="size-3.5" strokeWidth={2} /></button>}
    {onMaximize && <button type="button" className="bbd-titlebar-button" aria-label={maximized ? "Restore" : "Maximize"} title={maximized ? "Restore" : "Maximize"} onClick={onMaximize}>{maximized ? <RestoreGlyph className="size-3.5" strokeWidth={2} /> : <MaximizeGlyph className="size-3.5" strokeWidth={2} />}</button>}
    <button type="button" className="bbd-titlebar-button ml-0.5" data-variant="close" aria-label="Close" title="Close" onClick={onClose}><CloseGlyph className="size-3.5" strokeWidth={2} /></button>
  </header>;
}

export function WindowFrame({
  window: desktopWindow,
  title,
  icon,
  titleActions,
  statusBar,
  children,
  onClose,
  keepMounted = false,
}: {
  window: DesktopWindow;
  title: string;
  icon: ReactNode;
  titleActions?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  keepMounted?: boolean;
}) {
  const manager = useWindowManager();
  const track = usePointerTracker();
  const frameRef = useRef<HTMLElement>(null);
  const { id } = desktopWindow;
  const focused = manager.focusedId === id;
  const maximized = desktopWindow.restoreRect !== null;
  const nudge = useSyncExternalStore(subscribeNudges, () => nudges.get(id));
  const [settling, setSettling] = useState(false);
  const rect = nudge === undefined ? desktopWindow.rect : { ...desktopWindow.rect, x: desktopWindow.rect.x + nudge.x, y: desktopWindow.rect.y + nudge.y };

  const settle = () => {
    const taken = takeWindowNudge(id);
    if (taken === undefined) return;
    setSettling(true);
    manager.move(id, { ...desktopWindow.rect, x: desktopWindow.rect.x + taken.x, y: desktopWindow.rect.y + taken.y });
    requestAnimationFrame(() => setSettling(false));
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>, edge?: ResizeEdge) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button") !== null) return;
    const element = frameRef.current;
    if (!element) return;
    manager.focus(id);
    const area = workAreaRect();
    const origin = maximized && !edge ? fitDragRect({
      ...desktopWindow.restoreRect!,
      x: event.clientX - (event.clientX - rect.x) / rect.width * desktopWindow.restoreRect!.width,
      y: event.clientY - Math.min(24, event.clientY - rect.y),
    }, area) : fitDragRect(rect, area);
    let latest = origin;
    track(event, (delta) => {
      latest = edge ? resizeInArea(origin, edge, delta, area)
        : fitDragRect({ ...origin, x: origin.x + delta.x, y: origin.y + delta.y }, area);
      element.dataset.dragging = "true";
      if (maximized) element.removeAttribute("data-maximized");
      if (edge || maximized) previewRect(element, latest);
      else element.style.transform = `translate(${latest.x - rect.x}px, ${latest.y - rect.y}px)`;
    }, (cancelled, moved) => {
      delete element.dataset.dragging;
      element.style.transform = "";
      previewRect(element, cancelled || !moved ? rect : latest);
      if (maximized && (cancelled || !moved)) element.dataset.maximized = "true";
      if (!cancelled && moved) manager.move(id, latest);
    });
  };

  const startMove = (event: ReactPointerEvent<HTMLElement>) => startDrag(event);
  const startResize = (edge: ResizeEdge) => (event: ReactPointerEvent<HTMLElement>) => startDrag(event, edge);

  if (desktopWindow.minimized && !keepMounted) return null;

  return (
    <section
      ref={frameRef}
      role="dialog"
      aria-label={title}
      className="bbd-window"
      hidden={desktopWindow.minimized}
      data-focused={focused}
      data-maximized={maximized || undefined}
      data-settling={settling}
      style={{
        left: desktopWindow.rect.x,
        top: desktopWindow.rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: desktopWindow.z,
        transform: nudge === undefined ? undefined : `translate(${nudge.x}px, ${nudge.y}px)`,
      }}
      onPointerDownCapture={() => {
        settle();
        manager.focus(id);
      }}
    >
      <WindowTitleBar title={title} icon={icon} titleActions={titleActions} maximized={maximized}
        onPointerDown={startMove}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest("button") === null) manager.toggleMaximize(id);
        }}
        onMinimize={() => manager.minimize(id, true)}
        onMaximize={() => manager.toggleMaximize(id)}
        onClose={() => { onClose?.(); manager.close(id); }}
      />
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
