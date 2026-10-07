import { useLayoutEffect, useState, type RefObject } from "react";

// One stored order plus the files that are not pinned. The strip shows pinned
// files in order at their natural width, as many as fit; the ⋯ list holds the rest.
// When they don't all fit, the longest labels truncate first, down to the minimum.
export const PIN_MIN_WIDTH_CLASS = "w-24";
// A pin this close to the longest pins' share keeps its full label; the longer pins absorb the difference.
const SLACK = 16;

/** Measured widths in px: the strip's room, its gap, the ⋯ button, the minimum pin, and each pin's natural width. */
export type PinMetrics = { width: number; gap: number; more: number; min: number; pins: Record<string, number> };
/** `caps` holds a max width for each strip pin that truncates; the rest keep their natural width. */
export type PinLayout<T extends { id: string }> = { strip: T[]; more: T[]; caps: Record<string, number> };
export type Arrangement = { order: string[]; more: string[] };

/**
 * Pinned files that no longer fit lead the ⋯ list until there is room again. With `whole` (touch screens,
 * where no hover reveals a cut-off label), pins never shrink to make room: those that don't fit at full
 * width go to ⋯, and only a lone first pin wider than the row truncates.
 */
export function layoutPins<T extends { id: string }>(pins: readonly T[], unpinned: readonly string[], metrics: PinMetrics | null, { whole = false } = {}): PinLayout<T> {
  const pinned = pins.filter((pin) => !unpinned.includes(pin.id));
  const rest = pins.filter((pin) => unpinned.includes(pin.id));
  if (!metrics) return { strip: pinned, more: rest, caps: {} };
  const natural = (pin: T) => metrics.pins[pin.id] ?? metrics.min;
  const room = (count: number) => metrics.width - Math.max(0, count - 1) * metrics.gap
    - (count < pinned.length || rest.length > 0 ? metrics.more + metrics.gap : 0);
  const least = (pin: T) => whole ? natural(pin) : Math.min(natural(pin), metrics.min);
  let count = pinned.length;
  while (count > (whole ? 1 : 0) && pinned.slice(0, count).reduce((sum, pin) => sum + least(pin), 0) > room(count)) count--;
  const strip = pinned.slice(0, count);
  const caps: Record<string, number> = {};
  const space = room(count);
  const cap = share(strip.map(natural), space);
  if (cap !== null) {
    // Spare labels just over the share when the longest pins can give up the difference and stay above the minimum.
    const cut = strip.filter((pin) => natural(pin) > cap + SLACK);
    const kept = strip.reduce((sum, pin) => cut.includes(pin) ? sum : sum + natural(pin), 0);
    const tighter = cut.length > 0 ? (space - kept) / cut.length : 0;
    const spare = cut.length > 0 && tighter >= metrics.min;
    for (const pin of spare ? cut : strip) if (natural(pin) > cap) caps[pin.id] = spare ? tighter : cap;
  }
  return { strip, more: [...pinned.slice(count), ...rest], caps };
}

/** The widest a pin may be so the strip fits `room`: shorter pins keep their width, the longest share what is left. */
function share(widths: number[], room: number): number | null {
  const sorted = [...widths].sort((a, b) => a - b);
  let left = room;
  for (const [index, width] of sorted.entries()) {
    const each = left / (sorted.length - index);
    if (width > each) return each;
    left -= width;
  }
  return null;
}

export function unpinFile({ order, more }: Arrangement, id: string): Arrangement {
  return { order, more: [...new Set([...more, id])] };
}

/** Puts a file last on the strip; returns null when it would not fit beside every pinned file. */
export function pinFile<T extends { id: string }>(pins: readonly T[], { order, more }: Arrangement, id: string, metrics: PinMetrics | null, options: { whole?: boolean } = {}): Arrangement | null {
  const rest = order.filter((pinId) => pinId !== id);
  const last = rest.filter((pinId) => !more.includes(pinId)).at(-1);
  const index = last === undefined ? 0 : rest.indexOf(last) + 1;
  const next = { order: [...rest.slice(0, index), id, ...rest.slice(index)], more: more.filter((pinId) => pinId !== id) };
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  const layout = layoutPins(next.order.flatMap((pinId) => byId.get(pinId) ?? []), next.more, metrics, options);
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
