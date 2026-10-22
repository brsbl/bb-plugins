import { useLayoutEffect, useState, type RefObject } from "react";

// Used only as a fallback while a pin's natural width is unavailable.
export const PIN_MIN_WIDTH_CLASS = "w-24";

/** Measured widths in px: the strip's room, its gap, the ⋯ button, the fallback pin, and each pin's natural width. */
export type PinMetrics = { width: number; gap: number; more: number; min: number; pins: Record<string, number> };
/** Only a lone first pin wider than the available row receives a width cap. */
export type PinLayout<T extends { id: string }> = { strip: T[]; more: T[]; caps: Record<string, number> };

/** Keep labels whole in stored order at every width; the first that doesn't fit goes to ⋯ with the rest. */
export function layoutPins<T extends { id: string }>(pins: readonly T[], metrics: PinMetrics | null): PinLayout<T> {
  if (!metrics) return { strip: [...pins], more: [], caps: {} };
  const natural = (pin: T) => metrics.pins[pin.id] ?? metrics.min;
  // Reserve ⋯ only when it has pins. The independent measurement row makes
  // this decision stable when the visible button mounts or unmounts.
  const room = (count: number) => Math.max(0, metrics.width - Math.max(0, count - 1) * metrics.gap
    - (count < pins.length ? metrics.more + metrics.gap : 0));
  let count = pins.length;
  let width = pins.reduce((sum, pin) => sum + natural(pin), 0);
  while (count > 1 && width > room(count)) width -= natural(pins[--count]!);
  const strip = pins.slice(0, count);
  const caps: Record<string, number> = {};
  if (strip.length === 1 && natural(strip[0]!) > room(count)) caps[strip[0]!.id] = room(count);
  return { strip, more: pins.slice(count), caps };
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
