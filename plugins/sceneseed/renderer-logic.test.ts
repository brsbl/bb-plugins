import { describe, expect, it, vi } from "vitest";

import type { SceneNodeV1, SceneObjectV1 } from "./scene-contract";
import {
  FALLBACK_THEME_PALETTE,
  REDUCED_MOTION_REVEAL_SECONDS,
  RendererResourceRegistry,
  SceneRendererInvariantError,
  buildSceneNodeTree,
  cameraPlanForScene,
  createParticlePositions,
  evaluateMotion,
  evaluateReveal,
  mapMaterial,
  mapMeshGeometry,
  resolvePaletteEntry,
  resolveScenePalette,
  type SceneThemePalette,
} from "./renderer-logic";

type MeshNode = Extract<SceneNodeV1, { kind: "mesh" }>;
type ParticleNode = Extract<SceneNodeV1, { kind: "particles" }>;

function meshNode(geometry: MeshNode["geometry"]): MeshNode {
  return {
    kind: "mesh",
    id: `mesh-${geometry}`,
    parentId: null,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    paletteIndex: 0,
    geometry,
    size: { width: 4, height: 3, depth: 2 },
  };
}

function particleNode(preset: ParticleNode["preset"]): ParticleNode {
  return {
    kind: "particles",
    id: `particles-${preset}`,
    parentId: null,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    paletteIndex: 0,
    preset,
    count: 32,
    size: 0.1,
    spread: { width: 4, height: 6, depth: 2 },
  };
}

describe("renderer palette mapping", () => {
  it("resolves safe scene colors and rejects unsafe theme values", () => {
    const palette = {
      ...FALLBACK_THEME_PALETTE,
      "theme:accent": "not-a-color",
      "theme:success": "#AABBCC",
    } satisfies SceneThemePalette;

    expect(resolvePaletteEntry("#ABCDEF", palette)).toBe("#abcdef");
    expect(resolvePaletteEntry("theme:success", palette)).toBe("#aabbcc");
    expect(resolvePaletteEntry("theme:accent", palette)).toBe(
      FALLBACK_THEME_PALETTE["theme:accent"],
    );
    expect(resolvePaletteEntry("https://example.test/texture", palette)).toBe(
      FALLBACK_THEME_PALETTE["theme:accent"],
    );
  });

  it("resolves a scene palette without preserving token or URL-like input", () => {
    const resolved = resolveScenePalette(
      { palette: ["theme:ink", "#123456", "javascript:alert(1)"] },
      FALLBACK_THEME_PALETTE,
    );
    expect(resolved).toEqual([
      FALLBACK_THEME_PALETTE["theme:ink"],
      "#123456",
      FALLBACK_THEME_PALETTE["theme:accent"],
    ]);
  });
});

describe("scene hierarchy", () => {
  const transform = {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  };

  it("preserves source order while nesting children", () => {
    const nodes = [
      { kind: "group", id: "root", parentId: null, ...transform },
      { ...meshNode("sphere"), id: "first", parentId: "root" },
      { kind: "group", id: "nested", parentId: "root", ...transform },
      { ...meshNode("box"), id: "leaf", parentId: "nested" },
      { ...meshNode("cone"), id: "second-root", parentId: null },
    ] satisfies SceneNodeV1[];

    const tree = buildSceneNodeTree(nodes);
    expect(tree.map((entry) => entry.node.id)).toEqual(["root", "second-root"]);
    expect(tree[0]?.children.map((entry) => entry.node.id)).toEqual([
      "first",
      "nested",
    ]);
    expect(tree[0]?.children[1]?.children[0]?.node.id).toBe("leaf");
  });

  it("fails safely for missing parents, duplicate ids, and cycles", () => {
    const missing = [
      { kind: "group", id: "orphan", parentId: "missing", ...transform },
    ] satisfies SceneNodeV1[];
    const duplicate = [
      { kind: "group", id: "same", parentId: null, ...transform },
      { kind: "group", id: "same", parentId: null, ...transform },
    ] satisfies SceneNodeV1[];
    const cycle = [
      { kind: "group", id: "a", parentId: "b", ...transform },
      { kind: "group", id: "b", parentId: "a", ...transform },
    ] satisfies SceneNodeV1[];

    expect(() => buildSceneNodeTree(missing)).toThrow(
      SceneRendererInvariantError,
    );
    expect(() => buildSceneNodeTree(duplicate)).toThrow(
      SceneRendererInvariantError,
    );
    expect(() => buildSceneNodeTree(cycle)).toThrow(
      SceneRendererInvariantError,
    );
  });
});

describe("bounded geometry and material plans", () => {
  it.each([
    "box",
    "sphere",
    "cylinder",
    "cone",
    "torus",
    "capsule",
    "plane",
  ] as const)("maps %s to a fixed-segment host plan", (geometry) => {
    const plan = mapMeshGeometry(meshNode(geometry));
    expect(plan.kind).toBe(geometry);
    expect(plan.args.every(Number.isFinite)).toBe(true);
    expect(plan.localScale.every(Number.isFinite)).toBe(true);
    expect(plan.localRotation.every(Number.isFinite)).toBe(true);
  });

  it("orients planes and toruses onto the host ground convention", () => {
    expect(mapMeshGeometry(meshNode("plane")).localRotation[0]).toBe(
      -Math.PI / 2,
    );
    expect(mapMeshGeometry(meshNode("torus")).localRotation[0]).toBe(
      Math.PI / 2,
    );
  });

  it("maps all material presets without exposing shaders or textures", () => {
    const plans = (
      ["matte", "glossy", "glass", "metal", "emissive", "toon"] as const
    ).map((preset) => mapMaterial({ preset, opacity: 0.75 }));

    expect(plans.map((plan) => plan.kind)).toEqual([
      "standard",
      "standard",
      "physical",
      "standard",
      "standard",
      "toon",
    ]);
    expect(plans.every((plan) => plan.opacity === 0.75)).toBe(true);
    expect(plans[2]).toMatchObject({
      transparent: true,
      depthWrite: false,
      transmission: 0.82,
    });
    expect(Object.keys(plans[0] ?? {})).not.toContain("shader");
    expect(Object.keys(plans[0] ?? {})).not.toContain("url");
  });
});

describe("particle, motion, and reveal plans", () => {
  it.each(["dust", "motes", "sparks", "snow"] as const)(
    "creates deterministic bounded %s particles",
    (preset) => {
      const node = particleNode(preset);
      const first = createParticlePositions(node);
      const second = createParticlePositions(node);
      expect(first).toEqual(second);
      expect(first).toHaveLength(node.count * 3);
      for (let index = 0; index < first.length; index += 3) {
        expect(Math.abs(first[index] ?? Infinity)).toBeLessThanOrEqual(2.2);
        expect(Math.abs(first[index + 1] ?? Infinity)).toBeLessThanOrEqual(3);
        expect(Math.abs(first[index + 2] ?? Infinity)).toBeLessThanOrEqual(1.1);
      }
    },
  );

  it("maps every motion preset to finite bounded transforms", () => {
    const frames = (
      ["none", "breathe", "orbit", "bob", "shimmer"] as const
    ).map((preset) =>
      evaluateMotion({ preset, speed: 0.7, amplitude: 0.8 }, 12.5),
    );
    for (const frame of frames) {
      expect(Object.values(frame).every(Number.isFinite)).toBe(true);
      expect(frame.opacityMultiplier).toBeGreaterThanOrEqual(0.7);
      expect(frame.opacityMultiplier).toBeLessThanOrEqual(1);
      expect(frame.scaleMultiplier).toBeGreaterThan(0.9);
      expect(frame.scaleMultiplier).toBeLessThan(1.1);
    }
  });

  it("uses opacity only and completes within 150ms for reduced motion", () => {
    const halfway = evaluateReveal(REDUCED_MOTION_REVEAL_SECONDS / 2, true);
    const complete = evaluateReveal(REDUCED_MOTION_REVEAL_SECONDS, true);
    expect(halfway.scale).toEqual([1, 1, 1]);
    expect(halfway.rotationZ).toBe(0);
    expect(halfway.opacity).toBeCloseTo(0.5);
    expect(complete).toMatchObject({
      opacity: 1,
      scale: [1, 1, 1],
      rotationZ: 0,
      complete: true,
    });
  });

  it("uses a bounded fold-and-extrude reveal for standard motion", () => {
    const start = evaluateReveal(0, false);
    const complete = evaluateReveal(10, false);
    expect(start.scale).toEqual([0.86, 0.035, 0.86]);
    expect(start.opacity).toBe(0);
    expect(complete).toMatchObject({
      opacity: 1,
      scale: [1, 1, 1],
      rotationZ: 0,
      complete: true,
    });
  });
});

describe("camera plans and resource disposal", () => {
  it("keeps camera hints host-owned and finite", () => {
    const bounds = { width: 8, height: 5, depth: 3 };
    for (const cameraHint of [
      "front",
      "three-quarter",
      "top",
      "free",
    ] as const) {
      const plan = cameraPlanForScene({ bounds, cameraHint });
      expect(plan.position.every(Number.isFinite)).toBe(true);
      expect(plan.target).toEqual([0, 2.25, 0]);
    }
  });

  it("disposes each registered GPU-style resource exactly once", () => {
    const firstDispose = vi.fn();
    const secondDispose = vi.fn();
    const registry = new RendererResourceRegistry();
    const first = { dispose: firstDispose };
    const second = { dispose: secondDispose };
    registry.register(first);
    registry.register(second);

    registry.dispose(first);
    registry.dispose(first);
    registry.disposeAll();
    registry.disposeAll();

    expect(firstDispose).toHaveBeenCalledTimes(1);
    expect(secondDispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
  });
});

// Compile-time guard: renderer helpers consume the normalized contract rather
// than a looser parallel scene type.
type _SceneContractCompatibility = Parameters<typeof resolveScenePalette>[0] &
  Pick<SceneObjectV1, "palette">;
