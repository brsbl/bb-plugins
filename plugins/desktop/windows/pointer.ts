import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Point, Rect } from "../core";

export const DRAG_THRESHOLD = 4;

export function crossedDragThreshold(delta: Point, threshold = DRAG_THRESHOLD): boolean {
  return Math.hypot(delta.x, delta.y) >= threshold;
}

/**
 * One primary-pointer gesture, the way bb's own split resizers track one: capture the pointer on the pressed element
 * and listen there for move, up, cancel and lost capture. Up ends it normally; a cancelled or lost pointer ends it
 * cancelled. `onMove` starts once the pointer crosses the threshold (bb's dnd-kit drags use the same 4 px), so a press
 * stays a click. Beyond bb's pattern, Desktop needs three things its dividers don't: the click that follows a drag is
 * swallowed, text selection is held off, and a shield covers native web views (bb Explorer) so they don't take the
 * pointer. Returns the cancel function.
 */
export function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (delta: Point, event: PointerEvent) => void,
  onEnd?: (cancelled: boolean, moved: boolean) => void,
  options: { threshold?: number; samples?: boolean } = {},
): () => void {
  if (event.button !== 0 || event.isPrimary === false) return () => {};
  const target = event.currentTarget;
  const pointerId = event.pointerId;
  const start = { x: event.clientX, y: event.clientY };
  let moved = false;
  let ended = false;
  const selection = document.documentElement.style.userSelect;
  const shield = document.createElement("div");
  shield.className = "bbd-drag-shield";
  const move = (next: PointerEvent) => {
    if (next.pointerId !== pointerId) return;
    const delta = { x: next.clientX - start.x, y: next.clientY - start.y };
    if (!moved && !crossedDragThreshold(delta, options.threshold)) return;
    if (!moved) {
      moved = true;
      document.documentElement.style.userSelect = "none";
      window.getSelection()?.removeAllRanges();
      document.body.append(shield);
      window.dispatchEvent(new Event("bbd-drag-state"));
    }
    const samples = options.samples ? next.getCoalescedEvents?.() ?? [] : [];
    for (const sample of samples.length ? samples : [next]) onMove({ x: sample.clientX - start.x, y: sample.clientY - start.y }, sample);
  };
  const finish = (cancelled: boolean) => {
    if (ended) return;
    ended = true;
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", lost);
    target.removeEventListener("lostpointercapture", lost);
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    if (moved) {
      document.documentElement.style.userSelect = selection;
      shield.remove();
      // The release lands on the captured element as a click; a drag isn't one.
      const suppress = (click: MouseEvent) => {
        click.preventDefault();
        click.stopImmediatePropagation();
      };
      window.addEventListener("click", suppress, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", suppress, true), 0);
    }
    onEnd?.(cancelled, moved);
    if (moved) window.dispatchEvent(new Event("bbd-drag-state"));
  };
  const up = (next: PointerEvent) => {
    if (next.pointerId === pointerId) finish(false);
  };
  const lost = (next: PointerEvent) => {
    if (next.pointerId === pointerId) finish(true);
  };
  target.setPointerCapture(pointerId);
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", lost);
  target.addEventListener("lostpointercapture", lost);
  return () => finish(true);
}

/** Component ownership also cancels capture when a window/app unmounts. */
export function usePointerTracker() {
  const cancel = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => cancel.current?.(), []);
  return (...args: Parameters<typeof trackPointer>) => {
    cancel.current?.();
    cancel.current = trackPointer(...args);
  };
}

/** Applies a rect straight to an element's style during a gesture, without a React render. */
export function previewRect(element: HTMLElement, rect: Rect) {
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}
