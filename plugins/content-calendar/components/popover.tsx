import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";
const MENU_ITEMS = "[role='menuitem']:not(:disabled)";
const GAP = 8;
// Open panels per trigger: a menu item can open the next panel on the same trigger before the first one's cleanup runs.
const openOn = new WeakMap<HTMLElement, number>();
const Host = createContext<HTMLElement | null>(null);

/**
 * A small floating panel anchored under a trigger. It portals to the body so
 * grid cells and the inline chat frame never clip it. Opening moves focus into
 * it (unless a child autofocuses); it closes on Escape, an outside press,
 * focus leaving both panel and trigger, scrolling, or resizing. Closing hands
 * focus back to the trigger unless focus already moved somewhere on purpose.
 * `role="menu"` panels hold `role="menuitem"` buttons and move with the arrows.
 */
export function Popover({ anchor, onClose, width = 240, align = "start", label, role = "dialog", kind = "popup", children }: {
  anchor: HTMLElement | null; onClose: () => void; width?: number; align?: "start" | "end"; label: string; role?: "dialog" | "menu";
  kind?: "popup" | "editor"; children: ReactNode;
}) {
  const parent = useContext(Host);
  const panel = useRef<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const setPanel = useCallback((node: HTMLDivElement | null) => { panel.current = node; setHost(node); }, []);
  const close = useRef(onClose); close.current = onClose;
  const editor = kind === "editor";
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight?: number } | null>(null);
  const place = useCallback(() => {
    if (!anchor?.isConnected) return;
    const rect = anchor.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth || window.innerWidth;
    const height = panel.current?.offsetHeight ?? 0;
    const fit = Math.min(width, viewport - 2 * GAP);
    const below = rect.bottom + 4;
    const above = rect.top - height - 4;
    const vertical = height && below + height > window.innerHeight - GAP && above > GAP ? above : below;
    if (!editor) {
      const left = align === "end" ? rect.right - width : rect.left;
      setPosition({ top: vertical, left: Math.max(GAP, Math.min(left, viewport - width - GAP)), width });
      return;
    }
    const beside = rect.right + GAP + fit <= viewport - GAP ? rect.right + GAP : rect.left - GAP - fit >= GAP ? rect.left - GAP - fit : null;
    const span = beside === null && viewport < 2 * width ? viewport - 2 * GAP : fit;
    const top = beside === null ? vertical : rect.top;
    const left = beside ?? rect.left;
    setPosition({
      top: Math.max(GAP, Math.min(top, window.innerHeight - height - GAP)),
      left: Math.max(GAP, Math.min(left, viewport - span - GAP)),
      width: span,
      maxHeight: window.innerHeight - 2 * GAP,
    });
  }, [anchor, align, width, editor]);
  useLayoutEffect(place, [place]);
  useEffect(() => {
    if (!editor || !panel.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => place());
    observer.observe(panel.current);
    return () => observer.disconnect();
  }, [editor, place]);

  // Move focus in once the panel is visible, unless a child already took it (autoFocus).
  const focusedIn = useRef(false);
  useEffect(() => {
    if (!position || focusedIn.current || !panel.current) return;
    focusedIn.current = true;
    if (panel.current.contains(document.activeElement)) return;
    if (editor) { panel.current.focus({ preventScroll: true }); return; }
    panel.current.querySelector<HTMLElement>(role === "menu" ? MENU_ITEMS : FOCUSABLE)?.focus({ preventScroll: true });
  }, [position, role, editor]);

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
    const dismiss = () => {
      const active = document.activeElement;
      if (editor && active instanceof HTMLElement && panel.current?.contains(active)) active.blur();
      close.current();
    };
    const onPointer = (event: PointerEvent) => { if (!inside(event.target)) dismiss(); };
    const onFocus = (event: FocusEvent) => { if (!inside(event.target)) dismiss(); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.stopPropagation();
      dismiss();
      anchor?.focus({ preventScroll: true });
    };
    let frame = 0;
    const follow = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(place); };
    const onScroll = (event: Event) => {
      if (panel.current?.contains(event.target as Node)) return;
      if (editor) follow(); else close.current();
    };
    const onResize = () => { if (editor) follow(); else close.current(); };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("keydown", onKey, !editor);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("keydown", onKey, !editor);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [anchor, editor, place]);

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
    <div ref={setPanel} className={editor ? "cc-root cc-popover cc-editor" : "cc-root cc-popover"} role={role} aria-label={label}
      tabIndex={editor ? -1 : undefined} onKeyDown={onMenuKey}
      style={{ width: position?.width ?? width, maxHeight: position?.maxHeight, top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? "visible" : "hidden" }}>
      <Host.Provider value={host}>{children}</Host.Provider>
    </div>,
    parent ?? document.body,
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
