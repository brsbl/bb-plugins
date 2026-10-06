import { useLayoutEffect, useState, type RefObject } from "react";

// One stored order plus the files that are not pinned. The strip shows pinned
// files in order at their natural width, as many as fit; the ⋯ list holds the rest.
// When they don't all fit, the longest labels truncate first, down to the minimum.
export const PIN_MIN_WIDTH_CLASS = "w-24";

/** Measured widths in px: the strip's room, its gap, the ⋯ button, the minimum pin, and each pin's natural width. */
export type PinMetrics = { width: number; gap: number; more: number; min: number; pins: Record<string, number> };
/** `maxWidth` caps the strip's longest pins so the rest keep their natural width; null when nothing truncates. */
export type PinLayout<T extends { id: string }> = { strip: T[]; more: T[]; maxWidth: number | null };
export type Arrangement = { order: string[]; more: string[] };

/** Pinned files that no longer fit lead the ⋯ list until there is room again. */
export function layoutPins<T extends { id: string }>(pins: readonly T[], unpinned: readonly string[], metrics: PinMetrics | null): PinLayout<T> {
  const pinned = pins.filter((pin) => !unpinned.includes(pin.id));
  const rest = pins.filter((pin) => unpinned.includes(pin.id));
  if (!metrics) return { strip: pinned, more: rest, maxWidth: null };
  const natural = (pin: T) => metrics.pins[pin.id] ?? metrics.min;
  const room = (count: number) => metrics.width - Math.max(0, count - 1) * metrics.gap
    - (count < pinned.length || rest.length > 0 ? metrics.more + metrics.gap : 0);
  let count = pinned.length;
  while (count > 0 && pinned.slice(0, count).reduce((sum, pin) => sum + Math.min(natural(pin), metrics.min), 0) > room(count)) count--;
  const strip = pinned.slice(0, count);
  return { strip, more: [...pinned.slice(count), ...rest], maxWidth: truncation(strip.map(natural), room(count)) };
}

/** The widest a pin may be so the strip fits `room`: shorter pins keep their width, the longest share what is left. */
function truncation(widths: number[], room: number): number | null {
  const sorted = [...widths].sort((a, b) => a - b);
  let left = room;
  for (const [index, width] of sorted.entries()) {
    const share = left / (sorted.length - index);
    if (width > share) return share;
    left -= width;
  }
  return null;
}

export function unpinFile({ order, more }: Arrangement, id: string): Arrangement {
  return { order, more: [...new Set([...more, id])] };
}

/** Puts a file last on the strip; returns null when it would not fit beside every pinned file. */
export function pinFile<T extends { id: string }>(pins: readonly T[], { order, more }: Arrangement, id: string, metrics: PinMetrics | null): Arrangement | null {
  const rest = order.filter((pinId) => pinId !== id);
  const last = rest.filter((pinId) => !more.includes(pinId)).at(-1);
  const index = last === undefined ? 0 : rest.indexOf(last) + 1;
  const next = { order: [...rest.slice(0, index), id, ...rest.slice(index)], more: more.filter((pinId) => pinId !== id) };
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  const layout = layoutPins(next.order.flatMap((pinId) => byId.get(pinId) ?? []), next.more, metrics);
  return layout.more.every((pin) => next.more.includes(pin.id)) ? next : null;
}

/**
 * Measures `rowRef`, a hidden strip row of every pin at natural width (`data-pin-id`), the ⋯ button
 * (`data-measure="more"`) and the minimum pin (`data-measure="min"`). One ResizeObserver re-measures
 * on resize and label changes; `key` changes when the rendered pins do.
 */
export function useMeasurePins(rowRef: RefObject<HTMLElement | null>, key: string) {
  const [metrics, setMetrics] = useState<PinMetrics | null>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const style = getComputedStyle(row);
      const width = Math.floor(row.getBoundingClientRect().width - (Number.parseFloat(style.paddingLeft) || 0) - (Number.parseFloat(style.paddingRight) || 0));
      if (width <= 0) return;
      const next: PinMetrics = { width, gap: Number.parseFloat(style.columnGap) || 0, more: 0, min: 0, pins: {} };
      // Exact widths against a rounded-down room, so a label that fits is never cut and the strip never overflows.
      for (const child of Array.from(row.children) as HTMLElement[]) {
        const size = child.getBoundingClientRect().width;
        if (child.dataset.pinId) next.pins[child.dataset.pinId] = size;
        else if (child.dataset.measure === "more") next.more = size;
        else if (child.dataset.measure === "min") next.min = size;
      }
      setMetrics((previous) => previous && JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    for (const child of Array.from(row.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [rowRef, key]);
  return metrics;
}
