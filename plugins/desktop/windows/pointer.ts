import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Point, Rect } from "../core";

export const DRAG_THRESHOLD = 4;

export function crossedDragThreshold(delta: Point, threshold = DRAG_THRESHOLD): boolean {
  return Math.hypot(delta.x, delta.y) >= threshold;
}

let cancelActivePointer: (() => void) | undefined;

/**
 * Captures one primary-pointer gesture. `onMove` runs at most once per frame after the drag threshold;
 * Escape, blur, resize, context menus, lost capture and a second pointer cancel it. Returns the cancel function.
 */
export function trackPointer(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (delta: Point, event: PointerEvent) => void,
  onEnd?: (cancelled: boolean, moved: boolean) => void,
  options: { threshold?: number; samples?: boolean } = {},
): () => void {
  if (event.button !== 0 || event.isPrimary === false) return () => {};
  cancelActivePointer?.();
  const target = event.currentTarget;
  const pointerId = event.pointerId;
  const start = { x: event.clientX, y: event.clientY };
  let moved = false;
  let ended = false;
  let frame = 0;
  let latest: PointerEvent | null = null;
  let samples: PointerEvent[] = [];
  const selection = document.documentElement.style.userSelect;
  const shield = document.createElement("div");
  shield.className = "bbd-drag-shield";
  const blockSelection = (selectionEvent: Event) => selectionEvent.preventDefault();
  const flush = () => {
    frame = 0;
    if (latest === null) return;
    const next = latest;
    latest = null;
    const batch = options.samples ? samples : [next];
    samples = [];
    for (const sample of batch) onMove({ x: sample.clientX - start.x, y: sample.clientY - start.y }, sample);
  };
  const move = (next: PointerEvent) => {
    if (next.pointerId !== pointerId) return;
    const delta = { x: next.clientX - start.x, y: next.clientY - start.y };
    if (!moved && !crossedDragThreshold(delta, options.threshold)) return;
    if (!moved) {
      moved = true;
      document.documentElement.style.userSelect = "none";
      document.addEventListener("selectstart", blockSelection);
      window.getSelection()?.removeAllRanges();
      document.body.append(shield);
      window.dispatchEvent(new Event("bbd-drag-state"));
    }
    latest = next;
    if (options.samples) {
      const coalesced = next.getCoalescedEvents?.() ?? [];
      samples.push(...(coalesced.length ? coalesced : [next]));
    }
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const end = (cancelled: boolean) => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(frame);
    if (!cancelled) flush();
    window.removeEventListener("pointermove", move, true);
    window.removeEventListener("pointerup", up, true);
    window.removeEventListener("pointercancel", cancelPointer, true);
    window.removeEventListener("pointerdown", cancel, true);
    window.removeEventListener("keydown", key, true);
    window.removeEventListener("blur", cancel);
    window.removeEventListener("resize", cancel);
    window.removeEventListener("contextmenu", cancel, true);
    document.removeEventListener("visibilitychange", cancel);
    target.removeEventListener("lostpointercapture", cancelPointer);
    document.removeEventListener("selectstart", blockSelection);
    if (moved) document.documentElement.style.userSelect = selection;
    shield.remove();
    if (cancelActivePointer === cancel) cancelActivePointer = undefined;
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    // Cancellation can precede pointerup (Escape/blur). Keep its click suppressed
    // until release, but never consume a subsequent gesture or keyboard activation.
    if (moved || cancelled) {
      const suppress = (click: MouseEvent) => {
        if (click.detail === 0) return;
        click.preventDefault(); click.stopImmediatePropagation();
      };
      const clear = () => {
        window.removeEventListener("click", suppress, true);
        window.removeEventListener("dblclick", suppress, true);
        window.removeEventListener("pointerdown", clear, true);
        window.removeEventListener("pointerup", afterUp, true);
      };
      const afterUp = () => { setTimeout(clear, 0); };
      window.addEventListener("click", suppress, true);
      window.addEventListener("dblclick", suppress, true);
      window.addEventListener("pointerdown", clear, true);
      if (cancelled) {
        window.addEventListener("pointerup", afterUp, true);
      } else afterUp();
    }
    onEnd?.(cancelled, moved);
    window.dispatchEvent(new Event("bbd-drag-state"));
  };
  const cancel = () => end(true);
  const cancelPointer = (next: PointerEvent) => { if (next.pointerId === pointerId) cancel(); };
  const key = (next: KeyboardEvent) => { if (next.key === "Escape") { next.preventDefault(); cancel(); } };
  const up = (next: PointerEvent) => {
    if (next.pointerId !== pointerId) return;
    if (moved) move(next);
    end(false);
  };
  target.setPointerCapture(pointerId);
  cancelActivePointer = cancel;
  window.addEventListener("pointermove", move, true);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", cancelPointer, true);
  window.addEventListener("pointerdown", cancel, true);
  window.addEventListener("keydown", key, true);
  window.addEventListener("blur", cancel);
  window.addEventListener("resize", cancel);
  window.addEventListener("contextmenu", cancel, true);
  document.addEventListener("visibilitychange", cancel);
  target.addEventListener("lostpointercapture", cancelPointer);
  return cancel;
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
