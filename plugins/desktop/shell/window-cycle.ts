import { useLayoutEffect, useRef } from "react";
import { useWindowManager, type DesktopWindow } from "../windows";

/** Taskbar order stays stable when focus raises a window, so repeated presses visit every window. */
export function cycleWindowId(windows: readonly DesktopWindow[], focusedId: string | null, direction: 1 | -1): string | null {
  if (windows.length === 0) return null;
  const current = windows.findIndex((window) => window.id === focusedId);
  const index = current === -1 ? (direction === 1 ? 0 : windows.length - 1) : (current + direction + windows.length) % windows.length;
  const next = windows[index]!;
  return next.id === focusedId ? null : next.id;
}

/** Desktop menu cycling uses the manager's restore/attached-window behavior. */
export function useWindowCycle() {
  const manager = useWindowManager();
  const pendingFocus = useRef<string | null>(null);
  const cycle = (direction: 1 | -1): boolean => {
    const id = cycleWindowId(manager.windows, manager.focusedId, direction);
    if (id === null) return false;
    pendingFocus.current = id;
    manager.focus(id);
    return true;
  };
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (id === null || manager.focusedId !== id) return;
    pendingFocus.current = null;
    // Restore may have just mounted the frame. Put Tab inside the chosen window, not the previous one.
    document.querySelector<HTMLElement>(`[data-bbd-window-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }, [manager]);

  return { cycle, canCycle: cycleWindowId(manager.windows, manager.focusedId, 1) !== null };
}
