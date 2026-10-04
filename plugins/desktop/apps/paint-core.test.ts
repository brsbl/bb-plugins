import { describe, expect, it } from "vitest";

import {
  HISTORY_BYTES,
  HISTORY_LIMIT,
  PALETTE,
  TOOLS,
  TOOL_SIZES,
  clipRect,
  containsPoint,
  defaultSizes,
  floodFill,
  hexToRgba,
  knockOut,
  linePoints,
  pathBounds,
  rgbaToHex,
  shapeBounds,
  shapeColors,
  snapAngle,
  sprayDots,
  trimHistory,
  wrapText,
  type Rgba,
} from "./paint-core";

const WHITE: Rgba = [255, 255, 255, 255];
const BLACK: Rgba = [0, 0, 0, 255];
const RED: Rgba = [255, 0, 0, 255];

function image(rows: string[]): { pixels: Uint8ClampedArray; width: number; height: number } {
  const width = rows[0]!.length;
  const height = rows.length;
  const pixels = new Uint8ClampedArray(width * height * 4);
  rows.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      pixels.set(char === "#" ? BLACK : WHITE, (y * width + x) * 4);
    });
  });
  return { pixels, width, height };
}

function render(pixels: Uint8ClampedArray, width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let row = "";
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const color = [pixels[index], pixels[index + 1], pixels[index + 2]].join(",");
      row += color === "0,0,0" ? "#" : color === "255,0,0" ? "r" : ".";
    }
    rows.push(row);
  }
  return rows;
}

describe("floodFill", () => {
  it("fills a bounded region and stops at its borders", () => {
    const { pixels, width, height } = image([
      "........",
      ".#####..",
      ".#...#..",
      ".#..##..",
      ".#...#..",
      ".#####..",
      "........",
    ]);
    floodFill(pixels, width, height, 2, 2, RED);
    expect(render(pixels, width, height)).toEqual([
      "........",
      ".#####..",
      ".#rrr#..",
      ".#rr##..",
      ".#rrr#..",
      ".#####..",
      "........",
    ]);
  });

  it("fills a concave region reachable only around corners", () => {
    const { pixels, width, height } = image([
      ".....",
      "###.#",
      "....#",
      ".####",
      ".....",
    ]);
    floodFill(pixels, width, height, 0, 0, RED);
    expect(render(pixels, width, height)).toEqual([
      "rrrrr",
      "###r#",
      "rrrr#",
      "r####",
      "rrrrr",
    ]);
  });

  it("does not leak through diagonal gaps", () => {
    const { pixels, width, height } = image([
      ".#..",
      "#...",
      "....",
    ]);
    floodFill(pixels, width, height, 0, 0, RED);
    expect(render(pixels, width, height)).toEqual([
      "r#..",
      "#...",
      "....",
    ]);
  });

  it("is a no-op when the target already equals the replacement", () => {
    const { pixels, width, height } = image([
      "....",
      ".##.",
      "....",
    ]);
    const before = pixels.slice();
    floodFill(pixels, width, height, 0, 0, WHITE);
    expect(pixels).toEqual(before);
  });

  it("is a no-op outside the image", () => {
    const { pixels, width, height } = image(["...", "..."]);
    const before = pixels.slice();
    floodFill(pixels, width, height, 3, 0, RED);
    floodFill(pixels, width, height, -1, 1, RED);
    expect(pixels).toEqual(before);
  });

  it("matches alpha exactly", () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 0]);
    floodFill(pixels, 2, 1, 0, 0, RED);
    expect(Array.from(pixels)).toEqual([255, 0, 0, 255, 255, 255, 255, 0]);
  });
});

describe("hexToRgba", () => {
  it("parses six-digit hex with an opaque alpha", () => {
    expect(hexToRgba("#FF8040")).toEqual([255, 128, 64, 255]);
    expect(hexToRgba("004080")).toEqual([0, 64, 128, 255]);
  });

  it("expands three- and four-digit shorthand", () => {
    expect(hexToRgba("#fff")).toEqual([255, 255, 255, 255]);
    expect(hexToRgba("#f008")).toEqual([255, 0, 0, 136]);
  });

  it("parses eight-digit hex alpha", () => {
    expect(hexToRgba("#11223344")).toEqual([17, 34, 51, 68]);
  });

  it("rejects malformed input", () => {
    expect(() => hexToRgba("#12")).toThrow();
    expect(() => hexToRgba("#gggggg")).toThrow();
    expect(() => hexToRgba("")).toThrow();
  });

  it("round-trips every palette color", () => {
    expect(PALETTE).toHaveLength(28);
    for (const color of PALETTE) {
      const [r, g, b] = hexToRgba(color);
      expect(rgbaToHex(r, g, b)).toBe(color);
    }
  });
});

describe("linePoints", () => {
  it("connects endpoints without gaps", () => {
    const points = linePoints({ x: 0, y: 0 }, { x: 4, y: 2 });
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points.at(-1)).toEqual({ x: 4, y: 2 });
    for (let index = 1; index < points.length; index += 1) {
      expect(Math.abs(points[index]!.x - points[index - 1]!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(points[index]!.y - points[index - 1]!.y)).toBeLessThanOrEqual(1);
    }
  });
});

describe("shapeBounds", () => {
  it("normalizes a drag in any direction", () => {
    expect(shapeBounds({ x: 10, y: 8 }, { x: 4, y: 2 }, false)).toEqual({ x: 4, y: 2, width: 6, height: 6 });
  });

  it("constrains to a square", () => {
    expect(shapeBounds({ x: 10, y: 10 }, { x: 4, y: 12 }, true)).toEqual({ x: 4, y: 10, width: 6, height: 6 });
  });
});

describe("trimHistory", () => {
  it("keeps undo steps within both the step limit and the memory budget, never dropping the newest", () => {
    const steps = Array.from({ length: 30 }, (_, index) => index);
    expect(trimHistory(steps, () => 1_000_000)).toEqual(steps.slice(-HISTORY_LIMIT));
    expect(trimHistory(steps, () => HISTORY_BYTES / 4)).toEqual([26, 27, 28, 29]);
    expect(trimHistory(steps, () => HISTORY_BYTES * 2)).toEqual([29]);
  });
});

describe("TOOLS", () => {
  it("covers all sixteen XP tools, each with a status label and a default size from its options", () => {
    expect(TOOLS).toHaveLength(16);
    expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(16);
    const sizes = defaultSizes();
    for (const { id, label } of TOOLS) {
      expect(label.length).toBeGreaterThan(0);
      if (TOOL_SIZES[id].length > 0) expect(TOOL_SIZES[id]).toContain(sizes[id]);
    }
  });
});

describe("snapAngle", () => {
  it("snaps to the nearest horizontal, vertical or diagonal", () => {
    expect(snapAngle({ x: 0, y: 0 }, { x: 10, y: 2 })).toEqual({ x: 10, y: 0 });
    expect(snapAngle({ x: 0, y: 0 }, { x: -1, y: -9 })).toEqual({ x: 0, y: -9 });
    expect(snapAngle({ x: 5, y: 5 }, { x: 14, y: 12 })).toEqual({ x: 14, y: 14 });
    expect(snapAngle({ x: 5, y: 5 }, { x: -3, y: 12 })).toEqual({ x: -3, y: 13 });
    expect(snapAngle({ x: 0, y: 0 }, { x: 6, y: -7 })).toEqual({ x: 7, y: -7 });
  });

  it("leaves a zero-length edge alone", () => {
    expect(snapAngle({ x: 3, y: 4 }, { x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
  });
});

describe("sprayDots", () => {
  it("lays whole-pixel dots inside the circle", () => {
    let seed = 42;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const dots = sprayDots({ x: 20, y: 30 }, 8, 200, random);
    expect(dots.length).toBeGreaterThan(100);
    for (const dot of dots) {
      expect(Number.isInteger(dot.x) && Number.isInteger(dot.y)).toBe(true);
      expect((dot.x - 20) ** 2 + (dot.y - 30) ** 2).toBeLessThanOrEqual(64);
    }
  });

  it("stays finite when the random source never lands inside", () => {
    expect(sprayDots({ x: 0, y: 0 }, 4, 10, () => 0)).toEqual([]);
  });
});

describe("clipRect", () => {
  it("keeps the part inside the picture", () => {
    expect(clipRect({ x: -4, y: 5, width: 10, height: 100 }, 20, 30)).toEqual({ x: 0, y: 5, width: 6, height: 25 });
  });

  it("returns null when nothing is left", () => {
    expect(clipRect({ x: 25, y: 0, width: 4, height: 4 }, 20, 30)).toBeNull();
    expect(clipRect({ x: 2, y: 2, width: 0, height: 4 }, 20, 30)).toBeNull();
  });
});

describe("pathBounds", () => {
  it("covers every outline pixel, clipped to the picture", () => {
    expect(pathBounds([{ x: 3, y: 4 }, { x: 9, y: 1 }, { x: 5, y: 7 }], 20, 20)).toEqual({ x: 3, y: 1, width: 7, height: 7 });
    expect(pathBounds([{ x: -5, y: 2 }, { x: 4, y: 40 }], 20, 20)).toEqual({ x: 0, y: 2, width: 5, height: 18 });
    expect(pathBounds([], 20, 20)).toBeNull();
  });
});

describe("containsPoint", () => {
  it("includes the top-left edge and excludes the bottom-right one", () => {
    const rect = { x: 2, y: 2, width: 3, height: 3 };
    expect(containsPoint(rect, { x: 2, y: 2 })).toBe(true);
    expect(containsPoint(rect, { x: 4, y: 4 })).toBe(true);
    expect(containsPoint(rect, { x: 5, y: 4 })).toBe(false);
  });
});

describe("knockOut", () => {
  it("makes background-colored pixels transparent and leaves the rest", () => {
    const pixels = new Uint8ClampedArray([...WHITE, ...BLACK, ...RED]);
    knockOut(pixels, WHITE);
    expect(Array.from(pixels)).toEqual([255, 255, 255, 0, ...BLACK, ...RED]);
  });
});

describe("shapeColors", () => {
  it("outlines in the drawing color, fills an outlined shape with the other color, and draws a solid shape in the drawing color", () => {
    expect(shapeColors("outline", "#000000", "#ffffff")).toEqual({ stroke: "#000000", fill: null });
    expect(shapeColors("both", "#000000", "#ffffff")).toEqual({ stroke: "#000000", fill: "#ffffff" });
    expect(shapeColors("fill", "#000000", "#ffffff")).toEqual({ stroke: null, fill: "#000000" });
  });
});

describe("wrapText", () => {
  const measure = (text: string) => text.length;

  it("wraps at spaces and keeps typed line breaks", () => {
    expect(wrapText("the quick brown fox\njumps", 10, measure)).toEqual(["the quick", "brown fox", "jumps"]);
  });

  it("splits a word only when it alone is too wide", () => {
    expect(wrapText("a abcdefghijkl b", 5, measure)).toEqual(["a", "abcde", "fghij", "kl b"]);
  });

  it("keeps blank lines", () => {
    expect(wrapText("one\n\ntwo", 10, measure)).toEqual(["one", "", "two"]);
  });

  it("splits a long unbroken word in a logarithmic number of measurements per line", () => {
    let calls = 0;
    const counted = (text: string) => {
      calls += 1;
      return text.length * 6.5;
    };
    const lines = wrapText("x".repeat(3000), 160, counted);
    expect(lines).toEqual(Array.from({ length: 125 }, () => "x".repeat(24)));
    expect(calls).toBeLessThan(5000);
  });

  it("stops after the requested number of lines", () => {
    expect(wrapText("one two three\nfour", 5, measure, 2)).toEqual(["one", "two"]);
    expect(wrapText("abcdefghijkl", 5, measure, 1)).toEqual(["abcde"]);
  });
});
