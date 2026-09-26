import { describe, expect, it } from "vitest";

import { PALETTE, floodFill, hexToRgba, linePoints, rgbaToHex, shapeBounds, type Rgba } from "./paint-core";

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
