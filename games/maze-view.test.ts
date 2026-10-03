import { describe, expect, it } from "vitest";
import { MAX_ROLL_PIXELS, MAX_VIEW_PIXELS, mazeShortcut, viewSize } from "./maze-view";

describe("3D Maze view", () => {
  it("keeps the render buffer within budget, rolling or not, at any aspect ratio", () => {
    for (const [width, height] of [[1280, 960], [3200, 320], [320, 3200], [5120, 2880], [200, 150]] as const) {
      for (const rolling of [false, true]) {
        const size = viewSize(width, height, rolling);
        const budget = rolling ? MAX_ROLL_PIXELS : MAX_VIEW_PIXELS;
        // Rounding each side to whole pixels can add a couple of rows and columns.
        expect(size.width * size.height).toBeLessThanOrEqual(budget + 4 * Math.sqrt(budget));
        if (rolling) {
          expect(size.width).toBe(size.height);
        }
      }
    }
  });

  it("covers the whole viewport at every roll angle, however wide or tall the window", () => {
    for (const [width, height] of [[2818, 274], [4000, 100], [100, 4000], [1280, 960], [641, 3]] as const) {
      const size = viewSize(width, height, true);
      // Drawn at its uniform scale, the square must reach the viewport's corners.
      expect(size.width * size.scale).toBeGreaterThanOrEqual(Math.hypot(width, height));
    }
  });

  it("keeps an ordinary window's detail through a roll", () => {
    expect(viewSize(1280, 960, true).baseWidth).toBe(viewSize(1280, 960, false).baseWidth);
  });

  it("does not upscale a small view", () => {
    expect(viewSize(200, 150, false)).toEqual({ baseWidth: 200, baseHeight: 150, scale: 1, width: 200, height: 150 });
  });

  it("acts on F2 and F3 once per press, ignoring key repeats", () => {
    expect(mazeShortcut({ key: "F2", repeat: false })).toBe("new-maze");
    expect(mazeShortcut({ key: "F3", repeat: false })).toBe("pause");
    expect(mazeShortcut({ key: "F2", repeat: true })).toBeNull();
    expect(mazeShortcut({ key: "F3", repeat: true })).toBeNull();
    expect(mazeShortcut({ key: "a", repeat: false })).toBeNull();
  });
});
