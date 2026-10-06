import { expect, it } from "vitest";
import { layoutPins, pinFile, unpinFile, type PinMetrics } from "./pin-layout.js";

const order = ["a", "b", "c", "d", "e"];
const pins = order.map((id) => ({ id }));
const ids = (items: Array<{ id: string }>) => items.map((pin) => pin.id);
// A strip `width` px wide with a 4px gap, a 28px ⋯ button and a 96px minimum pin.
const metrics = (width: number, widths: Record<string, number>): PinMetrics => ({ width, gap: 4, more: 28, min: 96, pins: widths });
const even = (width: number) => metrics(width, Object.fromEntries(order.map((id) => [id, 100])));

it("shows one short pin, or one long pin with room, at its full width", () => {
  expect(layoutPins([{ id: "a" }], [], metrics(600, { a: 60 }))).toEqual({ strip: [{ id: "a" }], more: [], maxWidth: null });
  expect(layoutPins([{ id: "a" }], [], metrics(600, { a: 320 })).maxWidth).toBeNull();
});

it("truncates the longest pins first and leaves shorter ones whole", () => {
  // 600 - 2 gaps = 592; the 80px pin keeps its width and the two long ones share 512.
  const layout = layoutPins(pins.slice(0, 3), [], metrics(600, { a: 80, b: 400, c: 300 }));
  expect([ids(layout.strip), layout.maxWidth]).toEqual([["a", "b", "c"], 256]);
  // Only the longest pin truncates when that alone makes room.
  expect(layoutPins(pins.slice(0, 3), [], metrics(600, { a: 80, b: 400, c: 150 })).maxWidth).toBe(362);
});

it("moves pins into ⋯ only once every shown pin is at the minimum", () => {
  // Five 100px pins need 516px; at 510 each truncates slightly rather than overflowing.
  const tight = layoutPins(pins, [], even(510));
  expect([ids(tight.strip), tight.more, tight.maxWidth]).toEqual([order, [], 98]);
  // At 490 five minimum pins (496) no longer fit, so the last goes to ⋯, which takes its own room.
  const crowded = layoutPins(pins, [], even(490));
  expect([ids(crowded.strip), ids(crowded.more)]).toEqual([["a", "b", "c", "d"], ["e"]]);
});

it("lists pinned files that don't fit before unpinned ones", () => {
  const layout = layoutPins(pins, ["b"], even(212));
  expect([ids(layout.strip), ids(layout.more)]).toEqual([["a"], ["c", "d", "e", "b"]]);
});

it("unpins only the chosen file, so the next pinned file takes its place", () => {
  const next = unpinFile({ order, more: [] }, "b");
  expect(next).toEqual({ order, more: ["b"] });
  expect(ids(layoutPins(pins, next.more, even(240)).strip)).toEqual(["a", "c"]);
});

it("pins a file last on the strip only when every pinned file still fits", () => {
  const roomy = { order, more: ["b", "c", "d", "e"] };
  expect(pinFile(pins, roomy, "d", even(240))).toEqual({ order: ["a", "d", "b", "c", "e"], more: ["b", "c", "e"] });
  // Two pins fit at 260, so a third would push one into ⋯.
  const full = { order, more: ["c", "d", "e"] };
  expect(pinFile(pins, full, "e", even(260))).toBeNull();
  // A short label still fits where a long one would not.
  expect(pinFile(pins, full, "e", metrics(260, { a: 100, b: 100, e: 20 }))).toEqual({ order: ["a", "b", "e", "c", "d"], more: ["c", "d"] });
});
