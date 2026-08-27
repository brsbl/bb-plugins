import { describe, expect, it } from "vitest";
import {
  MAX_SCENE_COST,
  SceneContractError,
  calculateSceneCost,
  normalizeSceneObjectV1,
  safeNormalizeSceneObjectV1,
  type SceneObjectV1,
} from "./scene-contract.js";

function sceneFixture(overrides: Partial<SceneObjectV1> = {}): SceneObjectV1 {
  return {
    version: 1,
    jobId: "job_fixture",
    objectId: "object_fixture",
    name: "Rain jar",
    altText: "A blue glass jar holding a small rain cloud.",
    bounds: { width: 4, height: 5, depth: 4 },
    cameraHint: "three-quarter",
    palette: ["theme:accent", "#AACCFF"],
    material: { preset: "glass", opacity: 0.8 },
    nodes: [
      {
        kind: "group",
        id: "root",
        parentId: null,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      {
        kind: "mesh",
        id: "jar",
        parentId: "root",
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        paletteIndex: 1,
        geometry: "cylinder",
        size: { width: 2, height: 3, depth: 2 },
      },
      {
        kind: "particles",
        id: "rain",
        parentId: "root",
        position: [0, 2, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        paletteIndex: 0,
        preset: "motes",
        count: 80,
        size: 0.08,
        spread: { width: 1.5, height: 1, depth: 1.5 },
      },
    ],
    lights: [
      {
        id: "glow",
        kind: "point",
        position: [0, 3, 1],
        paletteIndex: 0,
        intensity: 0.7,
        range: 8,
      },
    ],
    motion: { preset: "breathe", speed: 0.4, amplitude: 0.2 },
    ground: { contactShadow: { strength: 0.6, softness: 0.7 } },
    ...overrides,
  };
}

describe("SceneObjectV1", () => {
  it("normalizes a bounded strict scene and computes a stable integer cost", () => {
    const scene = normalizeSceneObjectV1(sceneFixture());

    expect(scene.palette).toEqual(["theme:accent", "#aaccff"]);
    expect(calculateSceneCost(scene)).toBe(4);
    expect(calculateSceneCost(scene)).toBe(calculateSceneCost(scene));
  });

  it.each([
    [
      "remote URL",
      { ...sceneFixture(), url: "https://example.test/model.glb" },
    ],
    [
      "generated code",
      { ...sceneFixture(), code: "export default function Scene() {}" },
    ],
    ["shader", { ...sceneFixture(), fragmentShader: "void main() {}" }],
    ["file", { ...sceneFixture(), file: "/tmp/model.glb" }],
    [
      "nested texture",
      {
        ...sceneFixture(),
        material: {
          ...sceneFixture().material,
          texture: "data:image/png;base64,AAAA",
        },
      },
    ],
  ])("rejects an arbitrary %s field", (_label, value) => {
    expect(() => normalizeSceneObjectV1(value)).toThrow(SceneContractError);
  });

  it("rejects non-finite and out-of-budget renderer inputs", () => {
    expect(() =>
      normalizeSceneObjectV1(
        sceneFixture({
          bounds: { width: Number.POSITIVE_INFINITY, height: 1, depth: 1 },
        }),
      ),
    ).toThrow(SceneContractError);

    expect(() =>
      normalizeSceneObjectV1(
        sceneFixture({
          nodes: Array.from({ length: 40 }, (_, index) => ({
            kind: "mesh" as const,
            id: `torus_${index}`,
            parentId: null,
            position: [0, 0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: [1, 1, 1] as [number, number, number],
            paletteIndex: 0,
            geometry: "torus" as const,
            size: { width: 1, height: 1, depth: 1 },
          })),
          lights: [],
          material: { preset: "matte", opacity: 1 },
          motion: { preset: "none", speed: 0, amplitude: 0 },
        }),
      ),
    ).toThrow(`maximum is ${MAX_SCENE_COST}`);
  });

  it("rejects missing parents, duplicate IDs, cycles, and bad palette references", () => {
    const base = sceneFixture();
    const root = base.nodes[0]!;
    const jar = base.nodes[1]!;

    for (const nodes of [
      [{ ...root, parentId: "missing" }, jar],
      [root, { ...jar, id: root.id }],
      [
        { ...root, parentId: jar.id },
        { ...jar, parentId: root.id },
      ],
      [root, { ...jar, paletteIndex: 7 }],
    ]) {
      expect(safeNormalizeSceneObjectV1(sceneFixture({ nodes })).success).toBe(
        false,
      );
    }
  });

  it("bounds particles, lights, extrusion points, transforms, and motion", () => {
    const badScenes = [
      sceneFixture({
        nodes: [
          {
            kind: "particles",
            id: "too_many",
            parentId: null,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            paletteIndex: 0,
            preset: "sparks",
            count: 501,
            size: 0.1,
            spread: { width: 1, height: 1, depth: 1 },
          },
        ],
      }),
      sceneFixture({
        lights: [
          ...sceneFixture().lights,
          ...sceneFixture().lights,
          ...sceneFixture().lights,
          ...sceneFixture().lights,
        ],
      }),
      sceneFixture({ motion: { preset: "orbit", speed: 2.01, amplitude: 1 } }),
      sceneFixture({
        nodes: [
          {
            kind: "extrudedShape",
            id: "shape",
            parentId: null,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            paletteIndex: 0,
            points: [
              [0, 0],
              [1, 0],
            ],
            depth: 1,
          },
        ],
      }),
    ];

    for (const scene of badScenes) {
      expect(safeNormalizeSceneObjectV1(scene).success).toBe(false);
    }
  });
});
