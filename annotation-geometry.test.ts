import { describe, expect, it } from "vitest";
import { annotationGeometry } from "./annotation-geometry.js";
import type { Shape } from "./model.js";

const arrow: Shape = {kind: "arrow", x1: .2, y1: .3, x2: .8, y2: .7};
const points = (path: string) => path.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)!.map(Number);

describe("annotation geometry", () => {
  it.each([[640, 360], [240, 480]])("points at the saved target without stretching the head in a %i × %i frame", (width, height) => {
    const {head, marker} = annotationGeometry(arrow, width, height);
    const [tx, ty, ax, ay, bx, by] = points(head!);
    expect([tx, ty]).toEqual([arrow.x2 * width, arrow.y2 * height]);
    expect(Math.hypot(ax - bx, ay - by)).toBeCloseTo(19.8);
    expect(Math.hypot(tx - (ax+bx)/2, ty - (ay+by)/2)).toBeCloseTo(18);
    // Both head wings sit behind the tip, in the direction of the drag origin.
    expect((tx - (ax+bx)/2) * (arrow.x2-arrow.x1)).toBeGreaterThan(0);
    expect((ty - (ay+by)/2) * (arrow.y2-arrow.y1)).toBeGreaterThan(0);
    expect(marker).toEqual({x: arrow.x1 * width, y: arrow.y1 * height});
  });
  it("keeps the tip at the release point for a reversed drag and bounds edge labels", () => {
    const result = annotationGeometry({kind: "arrow", x1: 1, y1: 1, x2: 0, y2: 0}, 320, 180);
    const [tx, ty, ax, ay, bx, by] = points(result.head!);
    expect([tx, ty]).toEqual([0, 0]);
    expect((ax+bx)/2).toBeGreaterThan(tx);
    expect((ay+by)/2).toBeGreaterThan(ty);
    expect(result.marker).toEqual({x: 306, y: 166});
  });
  it("places box and zoom labels on the top left even when dragged backwards", () => {
    for (const kind of ["box", "zoom"] as const) {
      const result = annotationGeometry({...arrow, kind, x1: .8, y1: .7, x2: .2, y2: .3}, 640, 360);
      expect(result.marker).toEqual({x: 128, y: 108});
      expect(result.head).toBeNull();
    }
    expect(annotationGeometry({...arrow, x2: arrow.x1, y2: arrow.y1}, 640, 360).head).toBeNull();
  });
});
