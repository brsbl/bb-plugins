import { describe, expect, it } from "vitest";

import { clampLayout, DEFAULT_SIZE, defaultLayout, EDGE_GAP, MIN_SIZE, parseLayout } from "./window-layout";

const viewport = { width: 1900, height: 1100 };

describe("defaultLayout", () => {
  it("fits beside the thread pane without covering it", () => {
    const pane = { left: 780, right: 1580 };
    const layout = defaultLayout(viewport, pane);
    expect(viewport.width - layout.right - layout.width).toBeGreaterThanOrEqual(pane.right + EDGE_GAP);
    expect(layout.width).toBeGreaterThanOrEqual(MIN_SIZE.width);
  });

  it("keeps the usual size when the gutter is roomy", () => {
    expect(defaultLayout(viewport, { left: 400, right: 1200 })).toMatchObject(DEFAULT_SIZE);
  });

  it("falls back to the corner when there is no room or no pane", () => {
    const corner = { right: EDGE_GAP, bottom: EDGE_GAP, ...DEFAULT_SIZE };
    expect(defaultLayout(viewport, { left: 300, right: 1800 })).toEqual(corner);
    expect(defaultLayout(viewport, null)).toEqual(corner);
  });
});

describe("clampLayout", () => {
  it("keeps the window on screen and above the minimum size", () => {
    const layout = clampLayout({ right: -50, bottom: 5000, width: 100, height: 9000 }, viewport);
    expect(layout.width).toBe(MIN_SIZE.width);
    expect(layout.height).toBe(viewport.height - EDGE_GAP * 2);
    expect(layout.right).toBe(EDGE_GAP);
    expect(layout.bottom).toBe(EDGE_GAP);
  });
});

describe("parseLayout", () => {
  it("reads a saved layout", () => {
    expect(parseLayout({ right: 20, bottom: 30, width: 500, height: 400 })).toEqual({
      right: 20,
      bottom: 30,
      width: 500,
      height: 400,
    });
  });

  it("gives a position saved before resizing the usual size", () => {
    expect(parseLayout({ right: 20, bottom: 30 })).toEqual({ right: 20, bottom: 30, ...DEFAULT_SIZE });
  });

  it("rejects anything else", () => {
    expect(parseLayout(null)).toBeNull();
    expect(parseLayout({ right: "20", bottom: 30 })).toBeNull();
  });
});
