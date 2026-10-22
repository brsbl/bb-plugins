import { expect, it } from "vitest";
import { layoutPins, type PinMetrics } from "./pin-layout.js";

const pins = ["a", "b", "c", "d", "e"].map((id) => ({ id }));
const metrics = (width: number, widths: Record<string, number>): PinMetrics => ({ width, gap: 4, more: { 1: 28, 2: 36 }, min: 96, pins: widths });

it("keeps whole labels in order at desktop, medium, and narrow widths", () => {
  const widths = { a: 250, b: 240, c: 230, d: 220, e: 210 };
  for (const [width, count] of [[1440, 5], [800, 3], [600, 2], [390, 1]] as const) {
    expect(layoutPins(pins, metrics(width, widths))).toEqual({ strip: pins.slice(0, count), more: pins.slice(count), caps: {} });
  }
});

it("moves the first label that cannot fit and all later pins into overflow without shrinking labels", () => {
  const widths = { a: 80, b: 400, c: 150 };
  expect(layoutPins(pins.slice(0, 3), metrics(600, widths))).toEqual({ strip: pins.slice(0, 2), more: pins.slice(2, 3), caps: {} });
  // A short later pin cannot jump ahead of the first pin that doesn't fit.
  expect(layoutPins(pins.slice(0, 3), metrics(450, widths))).toEqual({ strip: pins.slice(0, 1), more: pins.slice(1, 3), caps: {} });
});

it("uses the entire row when all labels fit, without reserving an empty menu", () => {
  const pair = pins.slice(0, 2);
  for (const width of [304, 305, 335, 304]) {
    expect(layoutPins(pair, metrics(width, { a: 150, b: 150 }))).toEqual({ strip: pair, more: [], caps: {} });
  }
  expect(layoutPins(pair, metrics(303, { a: 150, b: 150 }))).toEqual({ strip: pair.slice(0, 1), more: pair.slice(1), caps: {} });
});

it("reserves overflow space even when doing so moves another pin into the menu", () => {
  expect(layoutPins(pins.slice(0, 3), metrics(210, { a: 100, b: 100, c: 20 }))).toEqual({ strip: pins.slice(0, 1), more: pins.slice(1, 3), caps: {} });
});

it("shortens only a lone first pin that is wider than the available row", () => {
  expect(layoutPins(pins.slice(0, 1), metrics(200, { a: 300 }))).toEqual({ strip: pins.slice(0, 1), more: [], caps: { a: 200 } });
  expect(layoutPins(pins.slice(0, 2), metrics(350, { a: 500, b: 100 }))).toEqual({ strip: pins.slice(0, 1), more: pins.slice(1, 2), caps: { a: 318 } });
  expect(layoutPins(pins.slice(0, 2), metrics(20, { a: 500, b: 100 })).caps).toEqual({ a: 0 });
});

it("preserves every saved pin and its order before measurement", () => {
  expect(layoutPins(pins, null)).toEqual({ strip: pins, more: [], caps: {} });
  expect(layoutPins([], metrics(100, {}))).toEqual({ strip: [], more: [], caps: {} });
});


it("uses the actual count's digit width when overflow crosses from nine to ten pins", () => {
  const dozen = Array.from({ length: 12 }, (_, index) => ({ id: String(index) }));
  const widths = Object.fromEntries(dozen.map(({ id }) => [id, 100]));
  // Three pins and +9 need 340px; two pins and +10 need 244px.
  for (const [width, count] of [[340, 3], [339, 2], [244, 2], [243, 1], [340, 3]] as const) {
    const result = layoutPins(dozen, metrics(width, widths));
    expect(result.strip).toEqual(dozen.slice(0, count));
    expect(result.more).toEqual(dozen.slice(count));
    expect(result.caps).toEqual({});
  }
});
