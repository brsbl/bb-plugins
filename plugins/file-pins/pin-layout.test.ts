import { expect, it } from "vitest";
import { layoutPins, pinFile, unpinFile } from "./pin-layout.js";

const order = ["a", "b", "c", "d", "e"];
const pins = order.map((id) => ({ id }));
const ids = (items: Array<{ id: string }>) => items.map((pin) => pin.id);

it("shows pinned files that fit, then lists pinned files that don't before unpinned ones", () => {
  const layout = layoutPins(pins, ["b"], 2);
  expect([ids(layout.strip), ids(layout.more), layout.canPin]).toEqual([["a", "c"], ["d", "e", "b"], false]);
  expect(layoutPins(pins, ["b", "d", "e"], 2).canPin).toBe(false);
  expect(layoutPins(pins, ["b", "c", "d", "e"], 2).canPin).toBe(true);
});

it("unpins only the chosen file, so the next pinned file takes its place", () => {
  const next = unpinFile({ order, more: [] }, "b");
  expect(next).toEqual({ order, more: ["b"] });
  expect(ids(layoutPins(pins, next.more, 2).strip)).toEqual(["a", "c"]);
});

it("pins a file last on the strip only when it has room", () => {
  const roomy = { order, more: ["b", "c", "d", "e"] };
  expect(pinFile(layoutPins(pins, roomy.more, 2), roomy, "d")).toEqual({ order: ["a", "d", "b", "c", "e"], more: ["b", "c", "e"] });
  const full = { order, more: ["d", "e"] };
  expect(pinFile(layoutPins(pins, full.more, 3), full, "e")).toBeNull();
});
