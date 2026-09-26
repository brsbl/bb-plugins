import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { Rect } from "../core";
import { defaultRect, fitDragRect, workAreaRect, type Size } from "./geometry";
import type { WindowSpec } from "./specs";
import { loadWindows, saveWindows, windowReducer, type DesktopWindow } from "./state";

export interface WindowManager {
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

/**
 * The program registry supplies `sizeOf`, a new window's default size, and `onDispose`, which releases what a
 * window holds (a native browser view, a terminal session, the microphone) on every close path.
 */
export function WindowManagerProvider({ sizeOf, onDispose, children }: {
  sizeOf: (spec: WindowSpec) => Size;
  onDispose?: (spec: WindowSpec) => void;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(windowReducer, undefined, loadWindows);

  useEffect(() => saveWindows(state.windows), [state.windows]);

  // Maximized windows track the work area as the bb window resizes, and pick up the taskbar's real height once it renders.
  useEffect(() => {
    const fit = () => dispatch({ type: "fit-maximized", viewport: workAreaRect() });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const countRef = useRef(state.windows.length);
  countRef.current = state.windows.length;
  const sizeRef = useRef(sizeOf);
  sizeRef.current = sizeOf;
  const disposeRef = useRef(onDispose);
  disposeRef.current = onDispose;
  const windowsRef = useRef(state.windows);
  windowsRef.current = state.windows;

  const open = useCallback((spec: WindowSpec, rect?: Rect) => {
    dispatch({ type: "open", spec, rect: rect ? fitDragRect(rect, workAreaRect()) : defaultRect(sizeRef.current(spec), countRef.current) });
  }, []);

  const closeWhere = useCallback((predicate: (window: DesktopWindow) => boolean) => {
    const closing = windowsRef.current.filter(predicate);
    windowsRef.current = windowsRef.current.filter((window) => !predicate(window));
    // The reducer applies the predicate to its own state, which also sees windows opened earlier in this tick.
    dispatch({ type: "close-where", predicate });
    for (const window of closing) disposeRef.current?.(window.spec);
  }, []);

  const manager = useMemo<WindowManager>(() => {
    const focused = state.windows
      .filter((window) => !window.minimized)
      .reduce<DesktopWindow | null>((top, window) => (top === null || window.z > top.z ? window : top), null);
    return {
      windows: state.windows,
      focusedId: focused?.id ?? null,
      open,
      focus: (id) => dispatch({ type: "focus", id }),
      close: (id) => closeWhere((window) => window.id === id),
      closeWhere,
      move: (id, rect) => dispatch({ type: "move", id, rect }),
      minimize: (id, minimized) => dispatch({ type: "minimize", id, minimized }),
      toggleMaximize: (id) => dispatch({ type: "maximize", id, viewport: workAreaRect() }),
      fitMaximized: () => dispatch({ type: "fit-maximized", viewport: workAreaRect() }),
      arrange: (rects) => dispatch({ type: "arrange", rects }),
    };
  }, [closeWhere, open, state.windows]);

  return <WindowManagerContext.Provider value={manager}>{children}</WindowManagerContext.Provider>;
}
