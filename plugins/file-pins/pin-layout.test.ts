import { expect, it } from "vitest";
import { addToStrip, layoutPins, movePin, removeFromStrip } from "./pin-layout.js";

const pins = ["a", "b", "c", "d"].map((id) => ({ id }));
const ids = (items: Array<{ id: string }>) => items.map((pin) => pin.id);

it("fills the strip to capacity and keeps freed slots empty like the sidebar footer", () => {
  const layout = layoutPins(pins, ["b"], 2);
  expect([ids(layout.strip), ids(layout.more), layout.isFull]).toEqual([["a", "c"], ["b", "d"], true]);
  const removed = removeFromStrip(layout, { order: ["a", "b", "c", "d"], more: ["b"] }, "a");
  expect(ids(layoutPins(pins, removed.more, 2).strip)).toEqual(["c"]);
  expect(addToStrip(layout, { order: ["a", "b", "c", "d"], more: ["b"] }, "d")).toBeNull();
  expect(addToStrip(layoutPins(pins, removed.more, 2), removed, "d")).toEqual({ order: ["a", "b", "c", "d"], more: ["b", "a"] });
});

it("reorders within a zone and moves between zones at the drop target", () => {
  const layout = layoutPins(pins, ["b"], 2);
  const current = { order: ["a", "b", "c", "d"], more: ["b"] };
  expect(movePin(layout, current, "c", "a")).toEqual({ order: ["c", "b", "a", "d"], more: ["b"] });
  expect(movePin(layout, current, "d", "a")).toEqual({ order: ["d", "a", "b", "c"], more: ["b"] });
  expect(movePin(layout, current, "a", "d")).toEqual({ order: ["b", "c", "d", "a"], more: ["b", "d", "a"] });
  expect(movePin(layoutPins(pins, ["b", "c", "d"], 3), { order: current.order, more: ["b", "c", "d"] }, "d", null))
    .toEqual({ order: ["a", "d", "b", "c"], more: ["b", "c"] });
});
