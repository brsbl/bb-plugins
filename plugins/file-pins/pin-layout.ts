import { useLayoutEffect, useState, type RefObject } from "react";

// Mirrors bb's sidebarFooterPreferences: one stored order plus the pins kept
// in "More pins". The strip shows the remaining pins up to its measured capacity.
export const PIN_SLOT_CLASS = "w-[7rem]";
export const PIN_MAX_WIDTH_CLASS = "max-w-[7rem]";

export type PinLayout<T extends { id: string }> = { strip: T[]; more: T[]; isFull: boolean };
export type Arrangement = { order: string[]; more: string[] };

export function layoutPins<T extends { id: string }>(pins: readonly T[], more: readonly string[], capacity: number | null): PinLayout<T> {
  const strip = pins.filter((pin) => !more.includes(pin.id)).slice(0, capacity ?? undefined);
  return { strip, more: pins.filter((pin) => !strip.includes(pin)), isFull: capacity !== null && strip.length >= capacity };
}

export function removeFromStrip(layout: PinLayout<{ id: string }>, { order, more }: Arrangement, id: string): Arrangement {
  return { order, more: [...new Set([...more, ...layout.more.map((pin) => pin.id), id])] };
}

export function addToStrip(layout: PinLayout<{ id: string }>, { order, more }: Arrangement, id: string): Arrangement | null {
  if (layout.isFull) return null;
  const last = layout.strip.at(-1)?.id;
  const rest = order.filter((pinId) => pinId !== id);
  const index = last === undefined ? 0 : rest.indexOf(last) + 1;
  return { order: [...rest.slice(0, index), id, ...rest.slice(index)], more: more.filter((pinId) => pinId !== id) };
}

/** Drops `activeId` on a pin or on an empty strip slot (`overId === null`). */
export function movePin(layout: PinLayout<{ id: string }>, current: Arrangement, activeId: string, overId: string | null): Arrangement | null {
  const strip = layout.strip.map((pin) => pin.id);
  const more = layout.more.map((pin) => pin.id);
  if (overId === null) {
    if (more.includes(activeId)) return addToStrip(layout, current, activeId);
    overId = strip.at(-1) ?? activeId;
  }
  if (activeId === overId) return null;
  const zone = [strip, more].find((ids) => ids.includes(activeId) && ids.includes(overId));
  if (zone) {
    const next = move(zone, zone.indexOf(activeId), zone.indexOf(overId));
    let cursor = 0;
    const order = current.order.map((id) => (zone.includes(id) ? next[cursor++]! : id));
    // Reordering More pins must not promote capacity-overflow pins into strip slots.
    return { order, more: zone === more ? [...new Set([...current.more, ...more])] : current.more };
  }
  const order = move(current.order, current.order.indexOf(activeId), current.order.indexOf(overId));
  return strip.includes(overId)
    ? { order, more: current.more.filter((id) => id !== activeId) }
    : { order, more: [...new Set([...current.more, ...more, activeId])] };
}

function move(ids: readonly string[], from: number, to: number) {
  const next = [...ids];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/** Like useMeasureSidebarFooterCapacity: how many fixed pin slots fit in `zoneRef`. */
export function useMeasurePinCapacity(zoneRef: RefObject<HTMLElement | null>, slotRef: RefObject<HTMLElement | null>) {
  const [capacity, setCapacity] = useState<number | null>(null);
  useLayoutEffect(() => {
    const zone = zoneRef.current;
    const slot = slotRef.current;
    if (!zone || !slot) return;
    const measure = () => {
      const width = zone.getBoundingClientRect().width;
      const slotWidth = slot.getBoundingClientRect().width;
      if (width === 0 || slotWidth === 0) return;
      const gap = Number.parseFloat(getComputedStyle(zone.parentElement ?? zone).columnGap) || 0;
      setCapacity(Math.max(0, Math.floor((width + gap) / (slotWidth + gap))));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(zone);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [zoneRef, slotRef]);
  return capacity;
}
