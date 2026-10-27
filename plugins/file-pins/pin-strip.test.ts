import { expect, it } from "vitest";
import { edgeMask, stripEdges, wheelScrollDelta } from "./pin-strip.js";

const row = (scrollLeft: number, scrollWidth = 1000, clientWidth = 400) => ({ scrollLeft, scrollWidth, clientWidth, clientHeight: 36 });
const wheel = (deltaY: number, deltaX = 0, deltaMode = 0, ctrlKey = false) => ({ deltaY, deltaX, deltaMode, ctrlKey });

it("fades only the sides that have more pins", () => {
  expect(stripEdges(row(0, 300))).toEqual({ left: false, right: false });
  expect(stripEdges(row(0))).toEqual({ left: false, right: true });
  expect(stripEdges(row(300))).toEqual({ left: true, right: true });
  expect(stripEdges(row(600))).toEqual({ left: true, right: false });
  // Sub-pixel scroll positions at either end count as the end.
  expect(stripEdges(row(0.5))).toEqual({ left: false, right: true });
  expect(stripEdges(row(599.5))).toEqual({ left: true, right: false });
  expect(edgeMask({ left: false, right: false })).toBe("linear-gradient(to right, black, black)");
  expect(edgeMask({ left: true, right: true })).toBe("linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)");
});

it("turns a vertical mouse wheel into sideways scrolling", () => {
  expect(wheelScrollDelta(wheel(100), row(0))).toBe(100);
  expect(wheelScrollDelta(wheel(-3, 0, 1), row(0))).toBe(-108);
  expect(wheelScrollDelta(wheel(1, 0, 2), row(0))).toBe(400);
});

it("leaves horizontal swipes and pinch zoom to the browser", () => {
  expect(wheelScrollDelta(wheel(0, 40), row(0))).toBe(0);
  expect(wheelScrollDelta(wheel(10, 30), row(0))).toBe(0);
  expect(wheelScrollDelta(wheel(20, 20), row(0))).toBe(0);
  expect(wheelScrollDelta(wheel(100, 0, 0, true), row(0))).toBe(0);
});
