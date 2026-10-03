import { expect, it } from "vitest";
import { layoutPins, moveToOverflow, moveToStrip } from "./pin-layout.js";

const order = ["a", "b", "c", "d", "e"];
const pins = order.map((id) => ({ id }));
const ids = (items: Array<{ id: string }>) => items.map((pin) => pin.id);
const strip = (next: { order: string[]; more: string[] }, capacity: number) =>
  ids(layoutPins(next.order.map((id) => ({ id })), next.more, capacity).strip);

it("shows pins outside overflow in order, as many as fit, with the rest behind +N", () => {
  const layout = layoutPins(pins, ["b"], 2);
  expect([ids(layout.strip), ids(layout.more), layout.isFull]).toEqual([["a", "c"], ["b", "d", "e"], true]);
});

it("moves only the clicked pin to overflow so the next pin takes its place", () => {
  const next = moveToOverflow({ order, more: [] }, "b");
  expect(next).toEqual({ order, more: ["b"] });
  expect(strip(next, 2)).toEqual(["a", "c"]);
});

it("moves an overflow pin to the end of the strip, taking the last slot when full", () => {
  const roomy = { order, more: ["b", "c", "d", "e"] };
  expect(moveToStrip(layoutPins(pins, roomy.more, 2), roomy, "d")).toEqual({ order: ["a", "d", "b", "c", "e"], more: ["b", "c", "e"] });
  const full = { order, more: ["b"] };
  const next = moveToStrip(layoutPins(pins, full.more, 2), full, "e");
  expect(next).toEqual({ order: ["a", "b", "e", "c", "d"], more: ["b"] });
  expect(strip(next, 2)).toEqual(["a", "e"]);
});
