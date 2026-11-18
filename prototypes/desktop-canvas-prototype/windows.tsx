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
import { DOCK_RESERVE, UNMEASURED_VIEWPORT, useCamera, useCanvasControls, useViewport, useWorkArea } from "./camera";
import { clampInto, resizeRect, revealCamera, toWorld, visibleRect, type Camera, type Point, type Rect, type ResizeEdge } from "./core";
import { closeBrowserTab } from "./browser";
import { useMenu } from "./menu";
import { closeTerminalSession } from "./terminal";
import { STORAGE_KEY, defaultRect, dockedRect, isAttached, loadWindows, serializeWindows, threadIdOf, windowId, windowReducer, type DesktopWindow, type DockSide, type WindowSpec } from "./window-state";

export { clampInto, visibleRect } from "./core";
export { threadIdOf, windowId, windowSize, type DesktopWindow, type DockSide, type WindowSpec } from "./window-state";

/**
 * Desktop's window manager on a canvas: one window per place, z-order, minimize to the dock, maximize, Back and Forward,
 * Tile and Cascade. Rects are canvas coordinates, so windows pan and zoom with the folders around them; a maximized
 * window fills the screen, and a docked one sits flush against the canvas's left or right edge, beside bb's panels.
 */

/** How wide a docked window is: a readable column that leaves most of the canvas free. */
export const dockWidth = (viewportWidth: number) => Math.round(Math.min(400, viewportWidth * 0.4));

/** Below this zoom a window's own text stops being readable, and it shows its overview label instead. */
export const READABLE_ZOOM = 0.7;

/**
 * A window larger than what's on screen opens at the visible size, so all of it, title bar included, is in view; but
 * never below a size its content can lay out in (zoomed far in, it then keeps its title bar in view).
 */
export const fitSize = (size: { width: number; height: number }, view: Rect) => ({
  width: Math.min(size.width, Math.max(MIN_OPEN_WIDTH, view.width)),
  height: Math.min(size.height, Math.max(MIN_OPEN_HEIGHT, view.height)),
});
const MIN_OPEN_WIDTH = 320;
const MIN_OPEN_HEIGHT = 440;

/** A title bar's height, in canvas units: the part of a window that must be on screen to grab it. */
const TITLE_HEIGHT = 40;

/** Within this distance of an edge, dropping a dragged window docks it there. */
const DOCK_SNAP = 32;

export interface WindowManager {
  windows: DesktopWindow[];
  focusedId: string | null;
  /** The edge a dragged window would dock to if dropped now. */
  dockPreview: DockSide | null;
  /**
   * Opens `spec` (or focuses its window) inside the part of the canvas on screen. Opening never moves or zooms the
   * canvas: a new window is placed in view, and an open one that is off screen comes back into view.
   */
  open(spec: WindowSpec, rect?: Rect): void;
  /** Raises and restores a window; `reveal` brings it back into view if it is off screen, without moving the canvas. */
  focus(id: string, options?: { reveal?: boolean }): void;
  /** Zooms the canvas to 100% on a window: the explicit "fly in" from a zoomed-out window. */
  flyTo(id: string): void;
  /** Brings every open window that no longer fits the screen back into view, at the screen's size; `oversizedOnly`
   * leaves alone windows that would fit and were simply panned away from. */
  keepInView(oversizedOnly?: boolean): void;
  close(id: string): void;
  closeWhere(predicate: (window: DesktopWindow) => boolean): void;
  /** `attached` gives the thread's companions their new rects when they moved with it. */
  move(id: string, rect: Rect, attached?: Record<string, Rect>): void;
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

  const view = useCallback(() => visibleRect(canvas.getCamera(), canvas.getWorkArea()), [canvas]);

  const manager = useMemo<WindowManager>(() => {
    const focused = state.windows
      .filter((window) => !window.minimized)
      .reduce<DesktopWindow | null>((top, window) => (top === null || window.z > top.z ? window : top), null);
    const closeWhere = (predicate: (window: DesktopWindow) => boolean) => {
      const closing = windowsRef.current.filter(predicate);
      windowsRef.current = windowsRef.current.filter((window) => !predicate(window));
      dispatch({ type: "close-where", predicate });
      // A browser page and a terminal session belong to bb; closing the window closes them.
      for (const window of closing) {
        if (window.spec.kind === "browser") closeBrowserTab(window.spec.tabId);
        else if (window.spec.kind === "terminal") closeTerminalSession(window.spec.tabId);
      }
    };
    const floating = (window: DesktopWindow) => !window.maximized && window.dock === undefined;
    // A floating window whose title bar is off screen moves back into view, its docked companions with it; the canvas
    // stays where it is.
    const bringIntoView = (window: DesktopWindow) => {
      if (!floating(window)) return;
      const visible = view();
      // A window larger than the screen (opened on a wider one) comes back at the screen's size.
      const sized = { ...window.rect, ...fitSize(window.rect, visible) };
      const resized = sized.width !== window.rect.width || sized.height !== window.rect.height;
      if (resized) window = { ...window, rect: sized };
      // All of it when it fits on screen (so nothing ends up under the dock), else at least its title bar.
      const fits = window.rect.width <= visible.width && window.rect.height <= visible.height;
      const must = fits ? window.rect : { x: window.rect.x, y: window.rect.y, width: Math.min(window.rect.width, visible.width), height: TITLE_HEIGHT };
      const placed = clampInto(must, visible);
      if (placed.x === must.x && placed.y === must.y && !resized) return;
      const moved = { ...window.rect, x: placed.x, y: placed.y };
      const dx = moved.x - window.rect.x;
      const dy = moved.y - window.rect.y;
      const attached = Object.fromEntries(windowsRef.current.filter((other) => isAttached(other, window)).map((other) => [other.id, { ...other.rect, x: other.rect.x + dx, y: other.rect.y + dy }]));
      dispatch({ type: "move", id: window.id, rect: moved, attached });
    };
    return {
      windows: state.windows,
      focusedId: focused?.id ?? null,
      dockPreview,
      open(spec, rect) {
        const existing = windowsRef.current.find((window) => window.id === windowId(spec));
        if (existing !== undefined) {
          dispatch({ type: "focus", id: existing.id });
          bringIntoView(existing);
          return;
        }
        const visible = view();
        const proposed = rect ?? defaultRect(spec, windowsRef.current.length, canvas.getCamera(), canvas.getWorkArea());
        dispatch({ type: "open", spec, rect: clampInto({ ...proposed, ...fitSize(proposed, visible) }, visible) });
      },
      focus(id, options) {
        dispatch({ type: "focus", id });
        const target = windowsRef.current.find((window) => window.id === id);
        if (options?.reveal && target !== undefined) bringIntoView(target);
      },
      keepInView(oversizedOnly = false) {
        const visible = view();
        for (const window of windowsRef.current) {
          if (window.minimized || windowsRef.current.some((thread) => isAttached(window, thread))) continue;
          if (oversizedOnly && window.rect.width <= visible.width && window.rect.height <= visible.height) continue;
          bringIntoView(window);
        }
      },
      flyTo(id) {
        const target = windowsRef.current.find((window) => window.id === id);
        if (target === undefined) return;
        dispatch({ type: "focus", id });
        canvas.setCamera((camera) => revealCamera(camera, target.rect, canvas.getWorkArea()), { animate: true });
      },
      close(id) {
        const target = windowsRef.current.find((window) => window.id === id);
        closeWhere((window) => window.id === id || (target !== undefined && isAttached(window, target)));
      },
      closeWhere,
      move: (id, rect, attached) => dispatch({ type: "move", id, rect, attached }),
      minimize: (id, minimized) => dispatch({ type: "minimize", id, minimized }),
      toggleMaximize(id) {
        const target = windowsRef.current.find((window) => window.id === id);
        if (target === undefined) return;
        dispatch({ type: "maximize", id, maximized: !target.maximized });
        if (target.maximized) bringIntoView({ ...target, maximized: false });
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
        dispatch({ type: "dock", id, side: null, rect: clampInto(placed, view()) });
      },
      setDockPreview,
      arrange: (rects) => dispatch({ type: "arrange", rects }),
      navigate: (id, spec) => dispatch({ type: "navigate", id, spec }),
      goBack: (id) => dispatch({ type: "go", id, direction: "back" }),
      goForward: (id) => dispatch({ type: "go", id, direction: "forward" }),
    };
  }, [canvas, dockPreview, view, state.windows]);

  // When the screen gets smaller (a window resized, a phone rotated), windows that no longer fit come back into view.
  const lastViewport = useRef<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (viewport === UNMEASURED_VIEWPORT) return;
    const last = lastViewport.current;
    lastViewport.current = viewport;
    // bb remounts the page when it switches to its phone layout, so the first measurement also fixes windows left
    // larger than this screen.
    if (last === null) {
      manager.keepInView(true);
      return;
    }
    const shrank = viewport.width < last.width || viewport.height < last.height;
    if (shrank) manager.keepInView();
  }, [viewport.width, viewport.height]);

  return <WindowManagerContext.Provider value={manager}>{children}</WindowManagerContext.Provider>;
}

// Pointer gestures, as Desktop tracks them.

/** A tap, not a mouse click: touch has no double-click, so a tap opens what a double-click opens elsewhere. */
export const isTap = (event: ReactMouseEvent) => (event.nativeEvent as PointerEvent).pointerType === "touch";

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

/**
 * Touch has no right-click: holding a finger still for half a second opens the same context menu, and the tap that
 * ends the press doesn't also open the item. Where the browser fires its own long-press contextmenu, that one wins.
 */
export function useLongPressMenu(rootRef: { current: HTMLElement | null }) {
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let start: { x: number; y: number; id: number } | null = null;
    let suppressUntil = 0;
    const cancel = () => {
      clearTimeout(timer);
      timer = undefined;
      start = null;
    };
    const down = (event: PointerEvent) => {
      cancel();
      if (event.pointerType !== "touch" || !event.isPrimary || !(event.target instanceof Element)) return;
      const target = event.target;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      timer = setTimeout(() => {
        if (start === null) return;
        const { x, y } = start;
        cancel();
        suppressUntil = Date.now() + 800;
        target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }));
      }, 500);
    };
    const move = (event: PointerEvent) => {
      if (start !== null && event.pointerId === start.id && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancel();
    };
    const swallow = (event: Event) => {
      if (Date.now() > suppressUntil) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const nativeMenu = (event: MouseEvent) => {
      if (event.isTrusted) {
        if (Date.now() <= suppressUntil) swallow(event);
        else cancel();
      }
    };
    root.addEventListener("pointerdown", down, true);
    root.addEventListener("pointermove", move, true);
    root.addEventListener("pointerup", cancel, true);
    root.addEventListener("pointercancel", cancel, true);
    // The menu opens outside the canvas; the click that ends the press must not pick the item under the finger.
    document.addEventListener("click", swallow, true);
    root.addEventListener("contextmenu", nativeMenu, true);
    return () => {
      cancel();
      root.removeEventListener("pointerdown", down, true);
      root.removeEventListener("pointermove", move, true);
      root.removeEventListener("pointerup", cancel, true);
      root.removeEventListener("pointercancel", cancel, true);
      document.removeEventListener("click", swallow, true);
      root.removeEventListener("contextmenu", nativeMenu, true);
    };
  }, [rootRef]);
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
  keepMounted = false,
  overview,
}: {
  window: DesktopWindow;
  title: string;
  /** Threads have no glyph, as in bb's sidebar. */
  icon?: string;
  iconClassName?: string;
  titleActions?: ReactNode;
  statusBar?: ReactNode;
  children: ReactNode;
  bodyProps?: Record<string, string>;
  /** Keeps the window's content alive while minimized, for a native browser page. */
  keepMounted?: boolean;
  /** What the window says when the canvas is zoomed too far out to read it: a status line under its title. */
  overview?: { detail?: string; tone?: "attention" | "running" | "error" | null };
}) {
  const manager = useWindowManager();
  const camera = useCamera();
  const area = useWorkArea();
  const viewport = useViewport();
  const controls = useCanvasControls();
  const menu = useMenu();
  const track = usePointerTracker();
  const frameRef = useRef<HTMLElement>(null);
  // bb's chat measures itself as it first renders; scaled, it misjudges its scroll and shows an empty pane. A window
  // opened at another zoom lays out unscaled and out of sight until its content has rendered, then takes the zoom.
  const [settling, setSettling] = useState(() => !desktopWindow.maximized && desktopWindow.dock === undefined && camera.zoom !== 1);
  useEffect(() => {
    if (!settling) return;
    const start = performance.now();
    let done = false;
    const timer = setInterval(() => {
      const element = frameRef.current;
      const chat = element?.querySelector("[data-chat-thread]") ?? null;
      const ready = chat === null || chat.querySelector("p, [data-message-id]") !== null;
      if (done || !(ready || performance.now() - start > 2500)) return;
      done = true;
      clearInterval(timer);
      setTimeout(() => setSettling(false), chat === null ? 0 : 200);
    }, 100);
    return () => clearInterval(timer);
  }, [settling]);
  const { id, rect, maximized, dock } = desktopWindow;
  const focused = manager.focusedId === id;
  const docked = dock !== undefined;
  const sideWidth = dockWidth(viewport.width);
  const placement: Placement = maximized
    // Maximized windows hide the zoom controls, so they take the top band too.
    ? { left: area.x, top: 0, width: area.width, height: area.y + area.height, scale: 1 }
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
    // Info and Related threads windows docked beside this thread follow it, keeping to their side.
    const attached = maximized || docked ? [] : manager.windows.flatMap((other) => {
      const node = isAttached(other, desktopWindow) && !other.minimized ? document.querySelector<HTMLElement>(`[data-window-id="${CSS.escape(other.id)}"]`) : null;
      return node === null ? [] : [{ id: other.id, node, rect: other.rect }];
    });
    const dockedTo = (target: Rect) => attached.map((other) => dockedRect(other.rect, rect, target));
    track(event, (delta, pointerEvent) => {
      const scaled = { x: delta.x / view.zoom, y: delta.y / view.zoom };
      latest = edge ? resizeRect(origin, edge, scaled) : { ...origin, x: origin.x + scaled.x, y: origin.y + scaled.y };
      // The dock floats over the canvas's bottom band: a window's bottom edge stops above it, so its follow-up box and
      // resize corner stay reachable.
      const bottom = toWorld(view, { x: 0, y: area.y + area.height }).y;
      if (latest.y + latest.height > bottom && latest.height * view.zoom <= area.height) {
        latest = edge?.includes("s") ? { ...latest, height: Math.max(200, bottom - latest.y) } : { ...latest, y: bottom - latest.height };
      }
      element.dataset.dragging = edge ? "resize" : "move";
      element.removeAttribute("data-maximized");
      element.removeAttribute("data-dock");
      applyPlacement(element, floatingPlacement(latest, view));
      dockedTo(latest).forEach((companion, index) => {
        const other = attached[index]!;
        other.node.dataset.dragging = "move";
        applyPlacement(other.node, floatingPlacement(companion, view));
      });
      if (!edge) {
        const x = controls.toLocal(pointerEvent.clientX, pointerEvent.clientY).x;
        const next = x < DOCK_SNAP ? "left" : x > viewport.width - DOCK_SNAP ? "right" : null;
        if (next !== side) manager.setDockPreview((side = next));
      }
    }, (cancelled, moved) => {
      const commit = moved && !cancelled;
      delete element.dataset.dragging;
      for (const other of attached) {
        delete other.node.dataset.dragging;
        if (!commit || side !== null) applyPlacement(other.node, floatingPlacement(other.rect, view));
      }
      if (side !== null) manager.setDockPreview(null);
      if (commit && side !== null) {
        // React restores the docked placement; put back what it last rendered so it notices the change.
        applyPlacement(element, shown);
        manager.dock(id, side);
        return;
      }
      if (commit) {
        const companions = dockedTo(latest);
        manager.move(id, latest, Object.fromEntries(attached.map((other, index) => [other.id, companions[index]!])));
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

  if (desktopWindow.minimized && !keepMounted) return null;

  // One threshold, at the shown percentage: below 70% a window reads as its title and status, at 70% and above as its
  // content. Never both at once, so the label is never drawn over live content.
  const zoomedOut = !maximized && !docked && Math.round(camera.zoom * 100) < READABLE_ZOOM * 100;

  const style = {
    left: placement.left,
    top: placement.top,
    width: placement.width,
    height: placement.height,
    zIndex: desktopWindow.z,
    transform: placement.scale === 1 || settling ? "none" : `scale(${placement.scale})`,
    visibility: settling ? "hidden" : undefined,
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
      data-window-thread={threadIdOf(desktopWindow.spec) ?? undefined}
      hidden={desktopWindow.minimized}
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
          {icon === undefined ? null : <Icon name={icon} className={iconClassName} />}
          <span>{title}</span>
        </span>
        {titleActions}
        <TitleButton icon={dock === "left" ? "PanelLeft" : "PanelRight"} label="Position" onClick={positionMenu} />
        <TitleButton icon="Minus" label="Minimize" onClick={() => manager.minimize(id, true)} />
        <TitleButton icon={maximized ? "Minimize2" : "Maximize2"} label={maximized ? "Restore" : "Maximize"} onClick={() => manager.toggleMaximize(id)} />
        <TitleButton icon="X" label="Close" variant="close" onClick={() => manager.close(id)} />
      </header>
      <div className="cdc-window-body" data-window-content {...bodyProps}
        // Hidden while the overview label shows, so the title never sits on top of content.
        style={zoomedOut ? { visibility: "hidden" } : undefined}>{children}</div>
      {statusBar === undefined ? null : <footer className="cdc-statusbar">{statusBar}</footer>}
      {zoomedOut ? (
        // Zoomed out, the window reads as its title and status at a legible size; drag anywhere, double-click to fly in.
        <div className="cdc-window-overview" onPointerDown={(event) => startDrag(event)}
          onDoubleClick={() => manager.flyTo(id)} title="Double-click to read at 100%">
          <div className="cdc-overview-label">
            <strong>{title}</strong>
            {overview?.detail ? <span data-tone={overview.tone ?? undefined}><span className="cdc-status-pip" data-tone={overview.tone ?? undefined} />{overview.detail}</span> : null}
          </div>
        </div>
      ) : null}
      {maximized || docked ? null : EDGES.map((edge) => <div key={edge} className="cdc-resize" data-edge={edge} aria-hidden onPointerDown={(event) => startDrag(event, edge)} />)}
    </section>
  );
}
