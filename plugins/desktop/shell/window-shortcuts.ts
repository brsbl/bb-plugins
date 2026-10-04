import { useEffect, useLayoutEffect, useRef } from "react";
import { useWindowManager, type DesktopWindow } from "../windows";

/** Taskbar order stays stable when focus raises a window, so repeated presses visit every window. */
export function cycleWindowId(windows: readonly DesktopWindow[], focusedId: string | null, direction: 1 | -1): string | null {
  if (windows.length === 0) return null;
  const current = windows.findIndex((window) => window.id === focusedId);
  const index = current === -1 ? (direction === 1 ? 0 : windows.length - 1) : (current + direction + windows.length) % windows.length;
  const next = windows[index]!;
  return next.id === focusedId ? null : next.id;
}

/** Control is intentional on Mac too: Command+` belongs to the OS. Allow drafts, but leave IME and terminals alone. */
export function windowShortcutDirection(event: KeyboardEvent): 1 | -1 | null {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat ||
      !event.ctrlKey || event.metaKey || event.altKey || (event.key !== "`" && event.key !== "~")) return null;
  const ownsKeys = ".xterm, [role=menu]";
  if (event.composedPath().some((node) => node instanceof Element && node.closest(ownsKeys)) ||
      document.activeElement?.closest(ownsKeys) || document.querySelector('[aria-modal="true"], .bbd-ask')) return null;
  return event.shiftKey ? -1 : 1;
}

/** Mounted only with Desktop. Menu and keyboard cycling share the manager's restore/attached-window behavior. */
export function useWindowShortcuts() {
  const manager = useWindowManager();
  const pendingFocus = useRef<string | null>(null);
  const cycle = (direction: 1 | -1): boolean => {
    const id = cycleWindowId(manager.windows, manager.focusedId, direction);
    if (id === null) return false;
    pendingFocus.current = id;
    manager.focus(id);
    return true;
  };
  const latest = useRef(cycle);
  latest.current = cycle;

  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (id === null || manager.focusedId !== id) return;
    pendingFocus.current = null;
    // Restore may have just mounted the frame. Put Tab inside the chosen window, not the previous one.
    document.querySelector<HTMLElement>(`[data-bbd-window-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }, [manager]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = windowShortcutDirection(event);
      if (direction === null || !latest.current(direction)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { cycle, canCycle: cycleWindowId(manager.windows, manager.focusedId, 1) !== null };
}
