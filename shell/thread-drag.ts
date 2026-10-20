import type { PointerEvent as ReactPointerEvent } from "react";
import { acceptsDrop, type DesktopGroup } from "../core";
import type { usePointerTracker } from "../windows";

/** The drop key of the desktop's Recycle Bin, which archives a dropped thread. */
export const RECYCLE_BIN_DROP = "recycle-bin";

/** Marks an element as a place a dragged thread can land; `beginThreadDrag` reports its key. */
export function threadDropTarget(group: DesktopGroup | null): { "data-thread-drop"?: string } {
  return group !== null && acceptsDrop(group) ? { "data-thread-drop": group.key } : {};
}

/**
 * Drags a thread with a floating label onto the topmost `[data-thread-drop]` under the pointer, skipping targets
 * covered by a higher window. Calls `onDrop` with the target's key when the drag ends over one.
 */
export function beginThreadDrag(
  event: ReactPointerEvent<HTMLElement>,
  title: string,
  track: ReturnType<typeof usePointerTracker>,
  onDrop: (key: string) => void,
) {
  const source = event.currentTarget;
  const origin = { x: event.clientX, y: event.clientY };
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-thread-drop]")).filter((element) => !element.closest("[hidden]")).map((element) => ({
    element, key: element.dataset.threadDrop!, rect: element.getBoundingClientRect(),
    z: Number(element.closest<HTMLElement>(".bbd-window")?.style.zIndex ?? 0),
  })).sort((a, b) => b.z - a.z);
  const windows = Array.from(document.querySelectorAll<HTMLElement>(".bbd-window:not([hidden])")).map((element) => ({ rect: element.getBoundingClientRect(), z: Number(element.style.zIndex) || 0 }));
  const preview = document.createElement("div");
  preview.className = "bbd-root bbd-thread-drag-preview";
  preview.textContent = title;
  let target: typeof targets[number] | undefined;
  track(event, (delta) => {
    const x = origin.x + delta.x, y = origin.y + delta.y;
    const topZ = Math.max(0, ...windows.filter(({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom).map(({ z }) => z));
    const next = targets.find(({ rect, z }) => z >= topZ && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
    if (!preview.isConnected) document.body.append(preview);
    preview.style.transform = `translate(${x + 12}px, ${y + 12}px)`;
    if (target !== next) {
      if (target) target.element.dataset.dropTarget = "false";
      target = next;
      if (target) target.element.dataset.dropTarget = "true";
    }
    source.style.opacity = "0.5";
  }, (cancelled, moved) => {
    source.style.opacity = "";
    preview.remove();
    if (target) target.element.dataset.dropTarget = "false";
    if (cancelled || !moved || !target) return;
    onDrop(target.key);
  });
}
