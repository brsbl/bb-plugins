import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * A small floating panel anchored under a trigger. It portals to the body so
 * grid cells and the inline chat frame never clip it, and closes on Escape,
 * an outside press, scrolling, or resizing.
 */
export function Popover({ anchor, onClose, width = 240, align = "start", label, children }: {
  anchor: HTMLElement | null; onClose: () => void; width?: number; align?: "start" | "end"; label: string; children: ReactNode;
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
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || anchor?.contains(target)) return;
      close.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close.current();
      anchor?.focus();
    };
    const onScroll = (event: Event) => { if (!panel.current?.contains(event.target as Node)) close.current(); };
    const onResize = () => close.current();
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [anchor]);
  return createPortal(
    <div ref={panel} className="cc-root cc-popover" role="dialog" aria-label={label}
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
