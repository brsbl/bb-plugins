import { useLayoutEffect, useState, type RefObject } from "react";

// One stored order plus the pins moved to overflow. The strip shows the other
// pins in order, as many as fit; the rest sit behind +N.
export const PIN_SLOT_CLASS = "w-[7rem]";
export const PIN_MAX_WIDTH_CLASS = "max-w-[7rem]";

export type PinLayout<T extends { id: string }> = { strip: T[]; more: T[]; isFull: boolean };
export type Arrangement = { order: string[]; more: string[] };

export function layoutPins<T extends { id: string }>(pins: readonly T[], more: readonly string[], capacity: number | null): PinLayout<T> {
  const strip = pins.filter((pin) => !more.includes(pin.id)).slice(0, capacity ?? undefined);
  return { strip, more: pins.filter((pin) => !strip.includes(pin)), isFull: capacity !== null && strip.length >= capacity };
}

/** Moves only this pin to overflow; the next pins that fit take its place. */
export function moveToOverflow({ order, more }: Arrangement, id: string): Arrangement {
  return { order, more: [...new Set([...more, id])] };
}

/** Puts an overflow pin last on the strip, taking the last slot when the strip is full. */
export function moveToStrip(layout: PinLayout<{ id: string }>, { order, more }: Arrangement, id: string): Arrangement {
  const last = layout.strip.at(-1)?.id;
  const rest = order.filter((pinId) => pinId !== id);
  const index = last === undefined ? 0 : rest.indexOf(last) + (layout.isFull ? 0 : 1);
  return { order: [...rest.slice(0, index), id, ...rest.slice(index)], more: more.filter((pinId) => pinId !== id) };
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
