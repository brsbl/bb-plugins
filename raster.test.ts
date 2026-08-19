import { describe, expect, it, vi } from "vitest";

import type { MeshGradientSpec } from "./gradient.js";
import { drawMeshGradient } from "./raster.js";

describe("mesh gradient raster rendering", () => {
  it("paints layers back-to-front so the first CSS layer remains topmost", () => {
    const spec: MeshGradientSpec = {
      seed: 1,
      style: "aurora",
      points: [
        { x: 10, y: 20, hue: 10, saturation: 70, lightness: 60, radius: 40 },
        { x: 50, y: 60, hue: 120, saturation: 75, lightness: 55, radius: 50 },
        { x: 90, y: 80, hue: 240, saturation: 80, lightness: 50, radius: 60 },
      ],
    };
    const paintedCenters: number[] = [];
    let currentLayerCenter: number | null = null;
    const context = {
      clearRect: vi.fn(),
      createRadialGradient: vi.fn((x: number) => {
        currentLayerCenter = x;
        return { addColorStop: vi.fn() };
      }),
      fillRect: vi.fn(() => {
        if (currentLayerCenter !== null) paintedCenters.push(currentLayerCenter);
      }),
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;

    drawMeshGradient(context, spec, 100, 100);

    expect(paintedCenters).toEqual([90, 50, 10]);
  });
});
