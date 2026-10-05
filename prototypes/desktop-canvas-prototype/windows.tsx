import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { useCamera, useCanvasControls, useWorkArea } from "./camera";
import { resizeRect, revealCamera, toWorld, type Camera, type Point, type Rect, type ResizeEdge } from "./core";
import { STORAGE_KEY, defaultRect, loadWindows, serializeWindows, windowId, windowReducer, type DesktopWindow, type WindowSpec } from "./window-state";

export { threadIdOf, windowId, windowSize, type DesktopWindow, type WindowSpec } from "./window-state";

/**
 * Desktop's window manager on a canvas: one window per place, z-order, minimize to the dock, maximize, Back and Forward,
 * Tile and Cascade. Rects are canvas coordinates, so windows pan and zoom with the folders around them; a maximized
 * window fills the screen instead.
 */

export interface WindowManager {
  windows: DesktopWindow[];
  focusedId: string | null;
  /** Opens `spec` (or focuses its window) and brings it into view at 100%. */
  open(spec: WindowSpec, rect?: Rect): void;
  /** Raises and restores a window; `reveal` also pans to it. */
  focus(id: string, options?: { reveal?: boolean }): void;
  close(id: string): void;
  closeWhere(predicate: (window: DesktopWindow) => boolean): void;
  move(id: string, rect: Rect): void;
  minimize(id: string, minimized: boolean): void;
  toggleMaximize(id: string): void;
  arrange(rects: Record<string, Rect>): void;
  navigate(id: string, spec: WindowSpec): void;
  goBack(id: string): void;
  goForward(id: string): void;
}

const WindowManagerContext = createContext<WindowManager | null>(null);

export function useWindowManager(): WindowManager {
  const manager = useContext(WindowManagerContext);
  if (manager === null) throw new Error("useWindowManager outside WindowManagerProvider");
  return manager;
}

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(windowReducer, undefined, loadWindows);
  const canvas = useCanvasControls();
  const windowsRef = useRef(state.windows);
  windowsRef.current = state.windows;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeWindows(state.windows));
    } catch {
      // Windows reopen from the dock or folders; a full disk only loses their places.
    }
  }, [state.windows]);

  const reveal = useCallback((rect: Rect) => {
    canvas.setCamera((camera) => revealCamera(camera, rect, canvas.getWorkArea()), { animate: true });
  }, [canvas]);

  const manager = useMemo<WindowManager>(() => {
    const focused = state.windows
      .filter((window) => !window.minimized)
      .reduce<DesktopWindow | null>((top, window) => (top === null || window.z > top.z ? window : top), null);
    const closeWhere = (predicate: (window: DesktopWindow) => boolean) => {
      windowsRef.current = windowsRef.current.filter((window) => !predicate(window));
      dispatch({ type: "close-where", predicate });
    };
    return {
      windows: state.windows,
      focusedId: focused?.id ?? null,
      open(spec, rect) {
        const existing = windowsRef.current.find((window) => window.id === windowId(spec));
        if (existing !== undefined) {
          dispatch({ type: "focus", id: existing.id });
          if (!existing.maximized) reveal(existing.rect);
          return;
        }
        const placed = rect ?? defaultRect(spec, windowsRef.current.length, canvas.getCamera(), canvas.getWorkArea());
        dispatch({ type: "open", spec, rect: placed });
        reveal(placed);
      },
      focus(id, options) {
        dispatch({ type: "focus", id });
        const target = windowsRef.current.find((window) => window.id === id);
        if (options?.reveal && target !== undefined && !target.maximized) reveal(target.rect);
      },
      close: (id) => closeWhere((window) => window.id === id),
      closeWhere,
      move: (id, rect) => dispatch({ type: "move", id, rect }),
      minimize: (id, minimized) => dispatch({ type: "minimize", id, minimized }),
      toggleMaximize(id) {
        const target = windowsRef.current.find((window) => window.id === id);
        if (target === undefined) return;
        dispatch({ type: "maximize", id, maximized: !target.maximized });
        if (target.maximized) reveal(target.rect);
      },
      arrange: (rects) => dispatch({ type: "arrange", rects }),
      navigate: (id, spec) => dispatch({ type: "navigate", id, spec }),
      goBack: (id) => dispatch({ type: "go", id, direction: "back" }),
      goForward: (id) => dispatch({ type: "go", id, direction: "forward" }),
    };
  }, [canvas, reveal, state.windows]);

  return <WindowManagerContext.Provider value={manager}>{children}</WindowManagerContext.Provider>;
}

// Pointer gestures, as Desktop tracks them.

export const DRAG_THRESHOLD = 4;

/**
 * One primary-pointer gesture: capture the pointer, start moving once it crosses 4 px so a press stays a click,
 * swallow the click that follows a drag, hold off text selection, and cover the page with a shield so embedded views
 * don't steal the pointer. Returns the cancel function.
 */
export function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (delta: Point, event: PointerEvent) => void,
  onEnd?: (cancelled: boolean, moved: boolean) => void,
  options: { threshold?: number; cursor?: string } = {},
): () => void {
  const target = event.currentTarget;
  const pointerId = event.pointerId;
  const start = { x: event.clientX, y: event.clientY };
  const threshold = options.threshold ?? DRAG_THRESHOLD;
  let moved = false;
  let ended = false;
  const selection = document.documentElement.style.userSelect;
  const shield = document.createElement("div");
  shield.className = "cdc-drag-shield";
  if (options.cursor) shield.style.cursor = options.cursor;
  const move = (next: PointerEvent) => {
    if (next.pointerId !== pointerId) return;
    const delta = { x: next.clientX - start.x, y: next.clientY - start.y };
    if (!moved && Math.hypot(delta.x, delta.y) < threshold) return;
    if (!moved) {
      moved = true;
      document.documentElement.style.userSelect = "none";
      window.getSelection()?.removeAllRanges();
      document.body.append(shield);
    }
    onMove(delta, next);
  };
  const finish = (cancelled: boolean) => {
    if (ended) return;
    ended = true;
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", lost);
    target.removeEventListener("lostpointercapture", lost);
    document.removeEventListener("pointerup", up, true);
    document.removeEventListener("pointercancel", lost, true);
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    if (moved) {
      document.documentElement.style.userSelect = selection;
      shield.remove();
      // A drag release can produce both click and dblclick; neither should activate its target.
      const suppress = (click: MouseEvent) => {
        click.preventDefault();
        click.stopImmediatePropagation();
      };
      window.addEventListener("click", suppress, { capture: true, once: true });
      window.addEventListener("dblclick", suppress, { capture: true, once: true });
      setTimeout(() => {
        window.removeEventListener("click", suppress, true);
        window.removeEventListener("dblclick", suppress, true);
      }, 0);
    }
    onEnd?.(cancelled, moved);
  };
  const up = (next: PointerEvent) => {
    if (ended || next.pointerId !== pointerId) return;
    if (moved && target.isConnected) move(next);
    finish(!target.isConnected);
  };
  // Some hosts drop capture right at release. Once the pointer has moved, losing it ends the gesture where it got to.
  const lost = (next: PointerEvent) => {
    if (next.pointerId === pointerId) finish(!moved || !target.isConnected);
  };
  target.setPointerCapture(pointerId);
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", lost);
  target.addEventListener("lostpointercapture", lost);
  document.addEventListener("pointerup", up, true);
  document.addEventListener("pointercancel", lost, true);
  return () => finish(true);
}

/** Component ownership also cancels capture when the owner unmounts. */
export function usePointerTracker() {
  const cancel = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => cancel.current?.(), []);
  return useCallback((...args: Parameters<typeof trackPointer>) => {
    cancel.current?.();
    cancel.current = trackPointer(...args);
  }, []);
}

// The window frame.

const EDGES: readonly ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

/** Where a window shows on screen: its canvas rect through the camera, or the whole work area when maximized. */
function placeElement(element: HTMLElement, rect: Rect, camera: Camera) {
  element.style.left = `${camera.x + rect.x * camera.zoom}px`;
  element.style.top = `${camera.y + rect.y * camera.zoom}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.transform = `scale(${camera.zoom})`;
}

function TitleButton({ icon, label, onClick, variant }: { icon: string; label: string; onClick: () => void; variant?: "close" }) {
  return (
    <button type="button" className="cdc-title-button" data-variant={variant} aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  );
}

export function WindowFrame({
  window: desktopWindow,
  title,
  icon,
  titleActions,
  statusBar,
  children,
  bodyProps,
}: {
  window: DesktopWindow;
  title: string;
  icon: string;
  titleActions?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
  bodyProps?: Record<string, string>;
}) {
  const manager = useWindowManager();
  const camera = useCamera();
  const area = useWorkArea();
  const controls = useCanvasControls();
  const track = usePointerTracker();
  const frameRef = useRef<HTMLElement>(null);
  const { id, rect, maximized } = desktopWindow;
  const focused = manager.focusedId === id;

  const startDrag = (event: ReactPointerEvent<HTMLElement>, edge?: ResizeEdge) => {
    if (event.button !== 0 || event.isPrimary === false || (event.target as HTMLElement).closest("button") !== null) return;
    const element = frameRef.current;
    if (element === null) return;
    event.stopPropagation();
    manager.focus(id);
    const view = controls.getCamera();
    const local = controls.toLocal(event.clientX, event.clientY);
    // A maximized window comes off the edge at its own size, under the pointer where it was grabbed.
    const origin: Rect = maximized && !edge
      ? (() => {
          const pointer = toWorld(view, local);
          const fraction = area.width > 0 ? (local.x - area.x) / area.width : 0.5;
          return { ...rect, x: pointer.x - fraction * rect.width, y: pointer.y - Math.min(18, local.y - area.y) / view.zoom };
        })()
      : rect;
    let latest = origin;
    track(event, (delta) => {
      const scaled = { x: delta.x / view.zoom, y: delta.y / view.zoom };
      latest = edge ? resizeRect(origin, edge, scaled) : { ...origin, x: origin.x + scaled.x, y: origin.y + scaled.y };
      element.dataset.dragging = edge ? "resize" : "move";
      element.removeAttribute("data-maximized");
      placeElement(element, latest, view);
    }, (cancelled, moved) => {
      const commit = moved && !cancelled;
      delete element.dataset.dragging;
      if (commit) {
        placeElement(element, latest, view);
        manager.move(id, latest);
        return;
      }
      if (!moved) return;
      if (maximized) {
        element.dataset.maximized = "true";
        Object.assign(element.style, { left: `${area.x}px`, top: `${area.y}px`, width: `${area.width}px`, height: `${area.height}px`, transform: "none" });
      } else placeElement(element, rect, view);
    }, { cursor: edge ? getComputedStyle(event.currentTarget).cursor : "grabbing" });
  };

  // The keyboard alternative to dragging: arrow keys on the title move the window, Shift moves farther.
  const nudge = (event: ReactKeyboardEvent<HTMLElement>) => {
    const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key];
    if (delta === undefined || maximized) return;
    event.preventDefault();
    const step = event.shiftKey ? 120 : 24;
    manager.move(id, { ...rect, x: rect.x + delta[0] * step, y: rect.y + delta[1] * step });
  };

  if (desktopWindow.minimized) return null;

  const style: CSSProperties = maximized
    ? { left: area.x, top: area.y, width: area.width, height: area.height, zIndex: desktopWindow.z, transform: "none" }
    : ({
        left: camera.x + rect.x * camera.zoom,
        top: camera.y + rect.y * camera.zoom,
        width: rect.width,
        height: rect.height,
        zIndex: desktopWindow.z,
        transform: `scale(${camera.zoom})`,
        "--cdc-zoom": camera.zoom,
      } as CSSProperties);

  return (
    <section
      ref={frameRef}
      role="dialog"
      tabIndex={-1}
      aria-label={title}
      className="cdc-window"
      data-window-id={id}
      data-focused={focused}
      data-maximized={maximized || undefined}
      style={style}
      onPointerDownCapture={() => {
        if (!focused) manager.focus(id);
      }}
    >
      <header
        className="cdc-titlebar"
        onPointerDown={(event) => startDrag(event)}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest("button") === null) manager.toggleMaximize(id);
        }}
      >
        <span className="cdc-title" tabIndex={0} role="button" aria-label={`${title}. Arrow keys move the window; Enter maximizes it.`}
          onKeyDown={(event) => {
            if (event.key === "Enter") manager.toggleMaximize(id);
            else nudge(event);
          }}>
          <Icon name={icon} />
          <span>{title}</span>
        </span>
        {titleActions}
        <TitleButton icon="Minus" label="Minimize" onClick={() => manager.minimize(id, true)} />
        <TitleButton icon={maximized ? "Minimize2" : "Maximize2"} label={maximized ? "Restore" : "Maximize"} onClick={() => manager.toggleMaximize(id)} />
        <TitleButton icon="X" label="Close" variant="close" onClick={() => manager.close(id)} />
      </header>
      <div className="cdc-window-body" data-window-content {...bodyProps}>{children}</div>
      {statusBar === undefined ? null : <footer className="cdc-statusbar">{statusBar}</footer>}
      {maximized ? null : EDGES.map((edge) => <div key={edge} className="cdc-resize" data-edge={edge} aria-hidden onPointerDown={(event) => startDrag(event, edge)} />)}
    </section>
  );
}
