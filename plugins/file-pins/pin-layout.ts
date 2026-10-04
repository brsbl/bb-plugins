import { useLayoutEffect, useState, type RefObject } from "react";

// One stored order plus the files that are not pinned. The strip shows pinned
// files in order, as many as fit; the ⋯ list holds the rest.
export const PIN_SLOT_CLASS = "w-[7rem]";
export const PIN_MAX_WIDTH_CLASS = "max-w-[7rem]";

export type PinLayout<T extends { id: string }> = { strip: T[]; more: T[]; canPin: boolean };
export type Arrangement = { order: string[]; more: string[] };

/** Pinned files that no longer fit lead the ⋯ list until there is room again. */
export function layoutPins<T extends { id: string }>(pins: readonly T[], unpinned: readonly string[], capacity: number | null): PinLayout<T> {
  const pinned = pins.filter((pin) => !unpinned.includes(pin.id));
  const strip = pinned.slice(0, capacity ?? undefined);
  return {
    strip,
    more: [...pinned.slice(strip.length), ...pins.filter((pin) => unpinned.includes(pin.id))],
    canPin: capacity === null || pinned.length < capacity,
  };
}

export function unpinFile({ order, more }: Arrangement, id: string): Arrangement {
  return { order, more: [...new Set([...more, id])] };
}

/** Puts a file last on the strip; returns null instead of displacing a pin. */
export function pinFile(layout: PinLayout<{ id: string }>, { order, more }: Arrangement, id: string): Arrangement | null {
  if (!layout.canPin) return null;
  const last = layout.strip.at(-1)?.id;
  const rest = order.filter((pinId) => pinId !== id);
  const index = last === undefined ? 0 : rest.indexOf(last) + 1;
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
