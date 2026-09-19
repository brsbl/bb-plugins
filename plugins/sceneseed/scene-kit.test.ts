import { describe, expect, it } from "vitest";
import {
  compileSceneSeedKitProgram,
  safeCompileSceneSeedKitProgram,
} from "./scene-kit.js";

function lighthouseProgram() {
  return {
    version: 1 as const,
    name: "Tiny lighthouse",
    altText: "A dark lighthouse with a white lantern and pointed roof.",
    parts: [
      {
        kind: "shape" as const,
        id: "tower",
        shape: "cylinder" as const,
        size: { width: 2, height: 5, depth: 2 },
        at: [7, 5, -4] as [number, number, number],
        tone: "dark" as const,
      },
      {
        kind: "shape" as const,
        id: "lantern",
        shape: "sphere" as const,
        size: { width: 1.4, height: 1.2, depth: 1.4 },
        at: [7, 8, -4] as [number, number, number],
        tone: "white" as const,
      },
      {
        kind: "shape" as const,
        id: "roof",
        shape: "cone" as const,
        size: { width: 2, height: 1.2, depth: 2 },
        at: [7, 9.1, -4] as [number, number, number],
        tone: "black" as const,
      },
    ],
  };
}

describe("SceneSeed Kit", () => {
  it("injects identity and compiles a centered, grounded grayscale scene", () => {
    const scene = compileSceneSeedKitProgram(lighthouseProgram(), {
      jobId: "job_fixture",
      objectId: "object_fixture",
    });

    expect(scene).toMatchObject({
      version: 1,
      jobId: "job_fixture",
      objectId: "object_fixture",
      cameraHint: "three-quarter",
      material: { preset: "matte", opacity: 1 },
      motion: { preset: "none", speed: 0, amplitude: 0 },
    });
    expect(scene.palette).toEqual([
      "#111111",
      "#444444",
      "#888888",
      "#cccccc",
      "#f5f5f5",
    ]);
    expect(Math.min(...scene.nodes.map((node) => node.position[1]))).toBeGreaterThan(
      0,
    );
    expect(scene.bounds.width).toBeLessThanOrEqual(17.6);
    expect(scene.bounds.height).toBeLessThanOrEqual(17.6);
    expect(scene.bounds.depth).toBeLessThanOrEqual(17.6);
    expect(scene.nodes.find((node) => node.id === "tower")?.position[0]).toBe(0);
    expect(scene.nodes.find((node) => node.id === "tower")?.position[2]).toBe(0);
  });

  it("fits an oversized composition into the renderer envelope", () => {
    const scene = compileSceneSeedKitProgram(
      {
        ...lighthouseProgram(),
        parts: [
          {
            kind: "shape" as const,
            id: "left",
            shape: "sphere" as const,
            size: { width: 12, height: 12, depth: 12 },
            at: [-12, 0, 0] as [number, number, number],
            scale: [3, 3, 3] as [number, number, number],
          },
          {
            kind: "shape" as const,
            id: "right",
            shape: "sphere" as const,
            size: { width: 12, height: 12, depth: 12 },
            at: [12, 0, 0] as [number, number, number],
            scale: [3, 3, 3] as [number, number, number],
          },
        ],
      },
      { jobId: "job_fixture", objectId: "object_fixture" },
    );

    expect(Math.max(scene.bounds.width, scene.bounds.height, scene.bounds.depth)).toBeLessThanOrEqual(
      17.6,
    );
  });

  it("rejects unknown executable fields and ambiguous detail budgets", () => {
    expect(
      safeCompileSceneSeedKitProgram(
        { ...lighthouseProgram(), code: "export default function Scene() {}" },
        { jobId: "job_fixture", objectId: "object_fixture" },
      ).success,
    ).toBe(false);

    const duplicate = lighthouseProgram();
    duplicate.parts[1] = { ...duplicate.parts[1]!, id: "tower" };
    expect(
      safeCompileSceneSeedKitProgram(duplicate, {
        jobId: "job_fixture",
        objectId: "object_fixture",
      }).success,
    ).toBe(false);
  });
});
