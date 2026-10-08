import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";
const MENU_ITEMS = "[role='menuitem']:not(:disabled)";
// Open panels per trigger: a menu item can open the next panel on the same trigger before the first one's cleanup runs.
const openOn = new WeakMap<HTMLElement, number>();

/**
 * A small floating panel anchored under a trigger. It portals to the body so
 * grid cells and the inline chat frame never clip it. Opening moves focus into
 * it (unless a child autofocuses); it closes on Escape, an outside press,
 * focus leaving both panel and trigger, scrolling, or resizing. Closing hands
 * focus back to the trigger unless focus already moved somewhere on purpose.
 * `role="menu"` panels hold `role="menuitem"` buttons and move with the arrows.
 */
export function Popover({ anchor, onClose, width = 240, align = "start", label, role = "dialog", children }: {
  anchor: HTMLElement | null; onClose: () => void; width?: number; align?: "start" | "end"; label: string; role?: "dialog" | "menu"; children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth || window.innerWidth;
    const left = align === "end" ? rect.right - width : rect.left;
    const height = panel.current?.offsetHeight ?? 0;
    const below = rect.bottom + 4;
    const top = height && below + height > window.innerHeight - 8 && rect.top - height - 4 > 8 ? rect.top - height - 4 : below;
    setPosition({ top, left: Math.max(8, Math.min(left, viewport - width - 8)) });
  }, [anchor, align, width]);

  // Move focus in once the panel is visible, unless a child already took it (autoFocus).
  const focusedIn = useRef(false);
  useEffect(() => {
    if (!position || focusedIn.current || !panel.current) return;
    focusedIn.current = true;
    if (panel.current.contains(document.activeElement)) return;
    panel.current.querySelector<HTMLElement>(role === "menu" ? MENU_ITEMS : FOCUSABLE)?.focus({ preventScroll: true });
  }, [position, role]);

  // However it closes, return focus to the trigger if it was inside the panel and nothing else took it.
  // aria-expanded also keeps a hover-revealed trigger (a card's ⋯) visible, so it can take focus back.
  useLayoutEffect(() => {
    const node = panel.current;
    if (anchor) { openOn.set(anchor, (openOn.get(anchor) ?? 0) + 1); anchor.setAttribute("aria-expanded", "true"); }
    return () => {
      if (anchor) openOn.set(anchor, (openOn.get(anchor) ?? 1) - 1);
      const refocus = !!node?.contains(document.activeElement);
      setTimeout(() => {
        const current = document.activeElement;
        if (refocus && anchor?.isConnected && (!current || current === document.body || !current.isConnected)) anchor.focus({ preventScroll: true });
        if (anchor && !openOn.get(anchor)) anchor.setAttribute("aria-expanded", "false");
      }, 0);
    };
  }, [anchor]);

  useEffect(() => {
    const inside = (target: EventTarget | null) => target instanceof Node && (!!panel.current?.contains(target) || !!anchor?.contains(target));
    const onPointer = (event: PointerEvent) => { if (!inside(event.target)) close.current(); };
    const onFocus = (event: FocusEvent) => { if (!inside(event.target)) close.current(); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close.current();
      anchor?.focus({ preventScroll: true });
    };
    const onScroll = (event: Event) => { if (!panel.current?.contains(event.target as Node)) close.current(); };
    const onResize = () => close.current();
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [anchor]);

  const onMenuKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (role !== "menu" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(MENU_ITEMS)];
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (index + 1) % items.length
      : event.key === "ArrowUp" ? (index <= 0 ? items.length - 1 : index - 1)
        : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
    if (next === -1) return;
    event.preventDefault();
    items[next]!.focus({ preventScroll: true });
  };

  return createPortal(
    <div ref={panel} className="cc-root cc-popover" role={role} aria-label={label} onKeyDown={onMenuKey}
      style={{ width, top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? "visible" : "hidden" }}>
      {children}
    </div>,
    document.body,
  );
}

/** Popover state keyed by the element that opened it. */
export function usePopover<T extends string = string>() {
  const [open, setOpen] = useState<{ kind: T; anchor: HTMLElement } | null>(null);
  return {
    open,
    show: (kind: T, anchor: HTMLElement) => setOpen({ kind, anchor }),
    toggle: (kind: T, anchor: HTMLElement) => setOpen((current) => current?.kind === kind && current.anchor === anchor ? null : { kind, anchor }),
    close: () => setOpen(null),
  };
}
