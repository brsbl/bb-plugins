import { expect, it } from "vitest";
import { layoutPins, pinFile, unpinFile, type PinMetrics } from "./pin-layout.js";

const order = ["a", "b", "c", "d", "e"];
const pins = order.map((id) => ({ id }));
const ids = (items: Array<{ id: string }>) => items.map((pin) => pin.id);
// A strip `width` px wide with a 4px gap, a 28px ⋯ button and a 96px minimum pin.
const metrics = (width: number, widths: Record<string, number>): PinMetrics => ({ width, gap: 4, more: 28, min: 96, pins: widths });
const even = (width: number) => metrics(width, Object.fromEntries(order.map((id) => [id, 100])));

it("shows one short pin, or one long pin with room, at its full width", () => {
  expect(layoutPins([{ id: "a" }], [], metrics(600, { a: 60 }))).toEqual({ strip: [{ id: "a" }], more: [], caps: {} });
  expect(layoutPins([{ id: "a" }], [], metrics(600, { a: 320 })).caps).toEqual({});
});

it("truncates the longest pins first and leaves shorter ones whole", () => {
  // 600 - 2 gaps = 592; the 80px pin keeps its width and the two long ones share 512.
  const layout = layoutPins(pins.slice(0, 3), [], metrics(600, { a: 80, b: 400, c: 300 }));
  expect([ids(layout.strip), layout.caps]).toEqual([["a", "b", "c"], { b: 256, c: 256 }]);
  // Only the longest pin truncates when that alone makes room.
  expect(layoutPins(pins.slice(0, 3), [], metrics(600, { a: 80, b: 400, c: 150 })).caps).toEqual({ b: 362 });
  // A label just over the share (105.5 vs 105) stays whole; the two long pins give up the difference.
  expect(layoutPins(pins.slice(0, 3), [], metrics(323, { a: 300, b: 300, c: 105.5 })).caps).toEqual({ a: 104.75, b: 104.75 });
});

it("moves pins into ⋯ only once every shown pin is at the minimum", () => {
  // Five 100px pins need 516px; at 510 each truncates slightly rather than overflowing.
  const tight = layoutPins(pins, [], even(510));
  expect([ids(tight.strip), tight.more, tight.caps]).toEqual([order, [], Object.fromEntries(order.map((id) => [id, 98.8]))]);
  // At 490 five minimum pins (496) no longer fit, so the last goes to ⋯, which takes its own room.
  const crowded = layoutPins(pins, [], even(490));
  expect([ids(crowded.strip), ids(crowded.more)]).toEqual([["a", "b", "c", "d"], ["e"]]);
});

it("keeps labels whole on touch while they fit, then fills the rest of the row with the next pin", () => {
  // 155 + 4 + 170 overflows the 314px left beside ⋯, so the second pin shortens into the 159px that remain.
  const filled = layoutPins(pins.slice(0, 3), [], metrics(350, { a: 155, b: 170, c: 150 }), { whole: true });
  expect([ids(filled.strip), ids(filled.more), filled.caps]).toEqual([["a", "b"], ["c"], { b: 159 }]);

  // Two long links in a 350px phone strip: the first keeps its whole label; 66px is too little for the second, so it waits in ⋯.
  const phone = layoutPins(pins.slice(0, 2), [], metrics(350, { a: 280, b: 260 }), { whole: true });
  expect([ids(phone.strip), ids(phone.more), phone.caps]).toEqual([["a"], ["b"], {}]);
  // Both fit whole when there is room, with no ⋯.
  expect(layoutPins(pins.slice(0, 2), [], metrics(350, { a: 150, b: 150 }), { whole: true })).toEqual({ strip: [{ id: "a" }, { id: "b" }], more: [], caps: {} });
  // A lone pin wider than the row still shows, truncated beside ⋯.
  const lone = layoutPins(pins.slice(0, 2), [], metrics(350, { a: 500, b: 100 }), { whole: true });
  expect([ids(lone.strip), ids(lone.more), lone.caps]).toEqual([["a"], ["b"], { a: 318 }]);
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
