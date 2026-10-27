import { useLayoutEffect, useState, type RefObject } from "react";

export type StripEdges = { left: boolean; right: boolean };
type Scroll = { scrollLeft: number; scrollWidth: number; clientWidth: number; clientHeight: number };
type Wheel = { ctrlKey: boolean; deltaX: number; deltaY: number; deltaMode: number };

/** Which sides of the strip have more pins scrolled out of view. */
export function stripEdges(row: Scroll): StripEdges {
  return { left: row.scrollLeft > 1, right: row.scrollLeft < row.scrollWidth - row.clientWidth - 1 };
}

/**
 * Horizontal px a mouse wheel moves the strip. Vertical wheels scroll it sideways; horizontal trackpad
 * and touch swipes, and pinch zoom (ctrlKey), stay native and return 0.
 */
export function wheelScrollDelta(event: Wheel, row: Scroll) {
  if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return 0;
  const unit = event.deltaMode === 1 ? row.clientHeight : event.deltaMode === 2 ? row.clientWidth : 1;
  return event.deltaY * unit;
}

/** A 16px fade on each side that has more pins, and a hard edge on a side that doesn't. */
export function edgeMask(edges: StripEdges) {
  return `linear-gradient(to right, ${edges.left ? "transparent, black 16px" : "black"}, ${edges.right ? "black calc(100% - 16px), transparent" : "black"})`;
}

/**
 * Tracks a sideways-scrolling row's edges and maps a vertical mouse wheel over it to horizontal scrolling.
 * At either end the wheel falls through, so the page behind still scrolls. `key` changes when the pins do.
 */
export function useSwipeStrip(rowRef: RefObject<HTMLElement | null>, key: string) {
  const [edges, setEdges] = useState<StripEdges>({ left: false, right: false });
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const check = () => {
      const next = stripEdges(row);
      setEdges((previous) => previous.left === next.left && previous.right === next.right ? previous : next);
    };
    const wheel = (event: WheelEvent) => {
      const delta = wheelScrollDelta(event, row);
      if (!delta) return;
      const before = row.scrollLeft;
      row.scrollLeft += delta;
      if (row.scrollLeft !== before) event.preventDefault();
    };
    check();
    row.addEventListener("scroll", check, { passive: true });
    row.addEventListener("wheel", wheel, { passive: false });
    if (typeof ResizeObserver === "undefined") return () => { row.removeEventListener("scroll", check); row.removeEventListener("wheel", wheel); };
    const observer = new ResizeObserver(check);
    observer.observe(row);
    for (const child of Array.from(row.children)) observer.observe(child);
    return () => { row.removeEventListener("scroll", check); row.removeEventListener("wheel", wheel); observer.disconnect(); };
  }, [rowRef, key]);
  return edges;
}
