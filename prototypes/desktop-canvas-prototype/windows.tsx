import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { DOCK_RESERVE, useCamera, useCanvasControls, useViewport, useWorkArea } from "./camera";
import { resizeRect, revealCamera, toWorld, type Camera, type Point, type Rect, type ResizeEdge } from "./core";
import { useMenu } from "./menu";
import { STORAGE_KEY, defaultRect, loadWindows, serializeWindows, windowId, windowReducer, type DesktopWindow, type DockSide, type WindowSpec } from "./window-state";

export { threadIdOf, windowId, windowSize, type DesktopWindow, type DockSide, type WindowSpec } from "./window-state";

/**
 * Desktop's window manager on a canvas: one window per place, z-order, minimize to the dock, maximize, Back and Forward,
 * Tile and Cascade. Rects are canvas coordinates, so windows pan and zoom with the folders around them; a maximized
 * window fills the screen, and a docked one sits flush against the canvas's left or right edge, beside bb's panels.
 */

/** How wide a docked window is: a readable column that leaves most of the canvas free. */
export const dockWidth = (viewportWidth: number) => Math.round(Math.min(400, viewportWidth * 0.4));

/** Within this distance of an edge, dropping a dragged window docks it there. */
const DOCK_SNAP = 32;

export interface WindowManager {
  windows: DesktopWindow[];
  focusedId: string | null;
  /** The edge a dragged window would dock to if dropped now. */
  dockPreview: DockSide | null;
  /** Opens `spec` (or focuses its window) and brings it into view at 100%. */
  open(spec: WindowSpec, rect?: Rect): void;
  /** Raises and restores a window; `reveal` also pans to it. */
  focus(id: string, options?: { reveal?: boolean }): void;
  close(id: string): void;
  closeWhere(predicate: (window: DesktopWindow) => boolean): void;
  move(id: string, rect: Rect): void;
  minimize(id: string, minimized: boolean): void;
  toggleMaximize(id: string): void;
  /** Docks a window to an edge, or with null returns it to the canvas in the current view. */
  dock(id: string, side: DockSide | null): void;
  setDockPreview(side: DockSide | null): void;
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
  const [dockPreview, setDockPreview] = useState<DockSide | null>(null);
  const canvas = useCanvasControls();
  const viewport = useViewport();
  const windowsRef = useRef(state.windows);
  windowsRef.current = state.windows;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeWindows(state.windows));
    } catch {
      // Windows reopen from the dock or folders; a full disk only loses their places.
    }
  }, [state.windows]);

  // Docked windows take their edge from the canvas, so Fit all, Tile and maximize stay between them.
  const width = dockWidth(viewport.width);
  const docked = (side: DockSide) => state.windows.some((window) => window.dock === side && !window.minimized);
  const left = docked("left") ? width : 0;
  const right = docked("right") ? width : 0;
  useEffect(() => canvas.setInsets({ left, right }), [canvas, left, right]);

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
    const floating = (window: DesktopWindow) => !window.maximized && window.dock === undefined;
    return {
      windows: state.windows,
      focusedId: focused?.id ?? null,
      dockPreview,
      open(spec, rect) {
        const existing = windowsRef.current.find((window) => window.id === windowId(spec));
        if (existing !== undefined) {
          dispatch({ type: "focus", id: existing.id });
          if (floating(existing)) reveal(existing.rect);
          return;
        }
        const placed = rect ?? defaultRect(spec, windowsRef.current.length, canvas.getCamera(), canvas.getWorkArea());
        dispatch({ type: "open", spec, rect: placed });
        reveal(placed);
      },
      focus(id, options) {
        dispatch({ type: "focus", id });
        const target = windowsRef.current.find((window) => window.id === id);
        if (options?.reveal && target !== undefined && floating(target)) reveal(target.rect);
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
      dock(id, side) {
        const target = windowsRef.current.find((window) => window.id === id);
        if (target === undefined) return;
        if (side !== null) {
          dispatch({ type: "dock", id, side });
          return;
        }
        // Undocked into the current view, even after the canvas has panned since it docked.
        const placed = { ...defaultRect(target.spec, 0, canvas.getCamera(), canvas.getWorkArea()), width: target.rect.width, height: target.rect.height };
        dispatch({ type: "dock", id, side: null, rect: placed });
        reveal(placed);
      },
      setDockPreview,
      arrange: (rects) => dispatch({ type: "arrange", rects }),
      navigate: (id, spec) => dispatch({ type: "navigate", id, spec }),
      goBack: (id) => dispatch({ type: "go", id, direction: "back" }),
      goForward: (id) => dispatch({ type: "go", id, direction: "forward" }),
    };
  }, [canvas, dockPreview, reveal, state.windows]);

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

/** Where a window shows on screen, relative to the canvas root. Floating windows scale with the camera. */
interface Placement {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

const floatingPlacement = (rect: Rect, camera: Camera): Placement => ({
  left: camera.x + rect.x * camera.zoom,
  top: camera.y + rect.y * camera.zoom,
  width: rect.width,
  height: rect.height,
  scale: camera.zoom,
});

function applyPlacement(element: HTMLElement, placement: Placement) {
  element.style.left = `${placement.left}px`;
  element.style.top = `${placement.top}px`;
  element.style.width = `${placement.width}px`;
  element.style.height = `${placement.height}px`;
  element.style.transform = placement.scale === 1 ? "none" : `scale(${placement.scale})`;
}

function TitleButton({ icon, label, onClick, variant }: { icon: string; label: string; onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void; variant?: "close" }) {
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
  iconClassName,
  titleActions,
  statusBar,
  children,
  bodyProps,
}: {
  window: DesktopWindow;
  title: string;
  icon: string;
  iconClassName?: string;
  titleActions?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
  bodyProps?: Record<string, string>;
}) {
  const manager = useWindowManager();
  const camera = useCamera();
  const area = useWorkArea();
  const viewport = useViewport();
  const controls = useCanvasControls();
  const menu = useMenu();
  const track = usePointerTracker();
  const frameRef = useRef<HTMLElement>(null);
  const { id, rect, maximized, dock } = desktopWindow;
  const focused = manager.focusedId === id;
  const docked = dock !== undefined;
  const sideWidth = dockWidth(viewport.width);
  const placement: Placement = maximized
    ? { left: area.x, top: area.y, width: area.width, height: area.height, scale: 1 }
    : dock !== undefined
      ? { left: dock === "left" ? 0 : viewport.width - sideWidth, top: 0, width: sideWidth, height: Math.max(220, viewport.height - DOCK_RESERVE), scale: 1 }
      : floatingPlacement(rect, camera);

  const startDrag = (event: ReactPointerEvent<HTMLElement>, edge?: ResizeEdge) => {
    if (event.button !== 0 || event.isPrimary === false || (event.target as HTMLElement).closest("button") !== null) return;
    const element = frameRef.current;
    if (element === null) return;
    event.stopPropagation();
    manager.focus(id);
    const view = controls.getCamera();
    const local = controls.toLocal(event.clientX, event.clientY);
    const shown = placement;
    // A maximized or docked window comes off at its own size, under the pointer where it was grabbed.
    const origin: Rect = (maximized || docked) && !edge
      ? (() => {
          const pointer = toWorld(view, local);
          const fraction = shown.width > 0 ? (local.x - shown.left) / shown.width : 0.5;
          return { ...rect, x: pointer.x - fraction * rect.width, y: pointer.y - Math.min(18, local.y - shown.top) / view.zoom };
        })()
      : rect;
    let latest = origin;
    let side: DockSide | null = null;
    track(event, (delta, pointerEvent) => {
      const scaled = { x: delta.x / view.zoom, y: delta.y / view.zoom };
      latest = edge ? resizeRect(origin, edge, scaled) : { ...origin, x: origin.x + scaled.x, y: origin.y + scaled.y };
      element.dataset.dragging = edge ? "resize" : "move";
      element.removeAttribute("data-maximized");
      element.removeAttribute("data-dock");
      applyPlacement(element, floatingPlacement(latest, view));
      if (!edge) {
        const x = controls.toLocal(pointerEvent.clientX, pointerEvent.clientY).x;
        const next = x < DOCK_SNAP ? "left" : x > viewport.width - DOCK_SNAP ? "right" : null;
        if (next !== side) manager.setDockPreview((side = next));
      }
    }, (cancelled, moved) => {
      const commit = moved && !cancelled;
      delete element.dataset.dragging;
      if (side !== null) manager.setDockPreview(null);
      if (commit && side !== null) {
        // React restores the docked placement; put back what it last rendered so it notices the change.
        applyPlacement(element, shown);
        manager.dock(id, side);
        return;
      }
      if (commit) {
        manager.move(id, latest);
        return;
      }
      if (!moved) return;
      if (maximized) element.dataset.maximized = "true";
      if (dock !== undefined) element.dataset.dock = dock;
      applyPlacement(element, shown);
    }, { cursor: edge ? getComputedStyle(event.currentTarget).cursor : "grabbing" });
  };

  // The keyboard alternative to dragging: arrow keys on the title move the window, Shift moves farther. A docked window
  // returns to the canvas first.
  const nudge = (event: ReactKeyboardEvent<HTMLElement>) => {
    const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key];
    if (delta === undefined || maximized) return;
    event.preventDefault();
    if (docked) {
      manager.dock(id, null);
      return;
    }
    const step = event.shiftKey ? 120 : 24;
    manager.move(id, { ...rect, x: rect.x + delta[0] * step, y: rect.y + delta[1] * step });
  };

  const positionMenu = (event: ReactMouseEvent<HTMLButtonElement>) =>
    menu.openFrom(event.currentTarget, [
      { label: "Dock left", icon: "PanelLeft", checked: dock === "left", run: () => manager.dock(id, "left") },
      { label: "Dock right", icon: "PanelRight", checked: dock === "right", run: () => manager.dock(id, "right") },
      ...(docked ? ["separator" as const, { label: "Undock", icon: "AppWindow", run: () => manager.dock(id, null) }] : []),
    ]);

  if (desktopWindow.minimized) return null;

  const style = {
    left: placement.left,
    top: placement.top,
    width: placement.width,
    height: placement.height,
    zIndex: desktopWindow.z,
    transform: placement.scale === 1 ? "none" : `scale(${placement.scale})`,
    "--cdc-zoom": placement.scale,
  } as CSSProperties;

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
      data-dock={dock}
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
          <Icon name={icon} className={iconClassName} />
          <span>{title}</span>
        </span>
        {titleActions}
        <TitleButton icon={dock === "left" ? "PanelLeft" : "PanelRight"} label="Position" onClick={positionMenu} />
        <TitleButton icon="Minus" label="Minimize" onClick={() => manager.minimize(id, true)} />
        <TitleButton icon={maximized ? "Minimize2" : "Maximize2"} label={maximized ? "Restore" : "Maximize"} onClick={() => manager.toggleMaximize(id)} />
        <TitleButton icon="X" label="Close" variant="close" onClick={() => manager.close(id)} />
      </header>
      <div className="cdc-window-body" data-window-content {...bodyProps}>{children}</div>
      {statusBar === undefined ? null : <footer className="cdc-statusbar">{statusBar}</footer>}
      {maximized || docked ? null : EDGES.map((edge) => <div key={edge} className="cdc-resize" data-edge={edge} aria-hidden onPointerDown={(event) => startDrag(event, edge)} />)}
    </section>
  );
}
