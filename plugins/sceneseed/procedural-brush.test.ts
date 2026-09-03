import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  MAX_BRUSH_VERTICES,
  createProceduralBrushApi,
  type BrushPoint,
} from "./procedural-brush.js";

const contour: BrushPoint[] = [
  [-2.8, -1.5],
  [-2.2, 1.2],
  [-0.8, 2.1],
  [0.9, 1.8],
  [2.5, 0.4],
  [2.1, -1.4],
  [0.2, -2],
];

function positionArrays(group: THREE.Group): number[][] {
  const arrays: number[][] = [];
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const position = object.geometry.getAttribute("position");
    arrays.push(Array.from(position.array));
  });
  return arrays;
}

describe("procedural sketch brush", () => {
  it("keeps the default pencil pass legible without an opacity override", () => {
    const brush = createProceduralBrushApi().create({
      texture: "pencil",
      layering: 1,
    });
    const result = brush.stroke([[0, 0], [1, 1]]);
    const material = (result.children[0] as THREE.Mesh)
      .material as THREE.MeshBasicMaterial;

    expect(material.opacity).toBeGreaterThanOrEqual(0.7);
  });

  it("gives a two-point tapered stroke a readable center", () => {
    const brush = createProceduralBrushApi().create({
      shape: "tapered",
      width: 0.2,
      pressure: 1,
      pressureVariation: 0,
      jitter: 0,
      layering: 1,
      smoothing: 0,
    });
    const stroke = brush.stroke([[0, 0], [2, 0]]);
    const positions = (stroke.children[0] as THREE.Mesh).geometry.getAttribute(
      "position",
    );
    const widths = Array.from({ length: positions.count / 2 }, (_, index) => {
      const left = new THREE.Vector3().fromBufferAttribute(positions, index * 2);
      const right = new THREE.Vector3().fromBufferAttribute(
        positions,
        index * 2 + 1,
      );
      return left.distanceTo(right);
    });

    expect(widths).toHaveLength(3);
    expect(widths[1]).toBeGreaterThan(widths[0]! * 5);
    expect(widths[1]).toBeGreaterThan(widths[2]! * 5);
  });

  it("creates deterministic layered pencil strokes from the same input", () => {
    const options = {
      seed: 42,
      texture: "pencil" as const,
      width: 0.16,
      jitter: 0.18,
      layering: 3,
      pressure: [0.3, 0.8, 1, 0.72, 0.86, 0.6, 0.2],
    };
    const first = createProceduralBrushApi().create(options);
    const second = createProceduralBrushApi().create(options);

    const firstStroke = first.stroke(contour);
    const secondStroke = second.stroke(contour);

    expect(positionArrays(firstStroke)).toEqual(positionArrays(secondStroke));
    expect(first.stats()).toEqual({
      strokes: 1,
      layers: 3,
      vertices: positionArrays(firstStroke).reduce(
        (total, positions) => total + positions.length / 3,
        0,
      ),
    });
  });

  it("composes independent strokes while reusing compatible materials", () => {
    const brush = createProceduralBrushApi().create({
      seed: 9,
      texture: "charcoal",
      layering: 2,
    });
    const root = new THREE.Group();
    root.add(brush.stroke(contour));
    root.add(
      brush.stroke(
        [
          [-2, -0.4, 0.1],
          [0, 0.2, 0.1],
          [2, -0.1, 0.1],
        ],
        { shape: "round" },
      ),
    );

    const materials = new Set<THREE.Material>();
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) materials.add(object.material);
    });

    expect(materials.size).toBe(2);
    expect(brush.stats()).toMatchObject({ strokes: 2, layers: 4 });
  });

  it("supports closed paths, explicit pressure, color behavior, and 3D planes", () => {
    const brush = createProceduralBrushApi().create({
      seed: 17,
      color: "#855f3a",
      colorBehavior: "layered",
      opacity: 0.38,
      normal: [0, 1, 0],
    });
    const result = brush.stroke(
      [
        [-1, 0, -1],
        [1, 0, -1],
        [1, 0, 1],
        [-1, 0, 1],
      ],
      {
        closed: true,
        pressure: [0.25, 1, 0.6, 0.4],
        shape: "flat",
      },
    );

    const meshes = result.children.filter(
      (child): child is THREE.Mesh => child instanceof THREE.Mesh,
    );
    expect(meshes).toHaveLength(2);
    expect(meshes.every((mesh) => mesh.material instanceof THREE.MeshBasicMaterial)).toBe(
      true,
    );
    expect(
      meshes.every((mesh) => {
        const material = mesh.material as THREE.MeshBasicMaterial;
        return material.transparent && material.depthWrite === false;
      }),
    ).toBe(true);
    const colors = meshes.map((mesh) =>
      (mesh.material as THREE.MeshBasicMaterial).color.getHSL({ h: 0, s: 0, l: 0 }),
    );
    expect(colors.every((entry) => entry.s > 0.1)).toBe(true);
    expect(
      meshes.map((mesh) => (mesh.material as THREE.MeshBasicMaterial).opacity),
    ).toContain(0.38);

    const graphite = createProceduralBrushApi().create({
      color: "#855f3a",
      colorBehavior: "graphite",
      layering: 1,
    });
    const graphiteStroke = graphite.stroke([[0, 0], [1, 1]]);
    const graphiteMaterial = (graphiteStroke.children[0] as THREE.Mesh)
      .material as THREE.MeshBasicMaterial;
    expect(graphiteMaterial.color.getHSL({ h: 0, s: 0, l: 0 }).s).toBe(0);
  });

  it("keeps closed tapered contours continuous at their seam", () => {
    const brush = createProceduralBrushApi().create({
      texture: "clean",
      shape: "tapered",
      width: 0.2,
      pressure: 1,
      pressureVariation: 0,
      jitter: 0,
      layering: 1,
      smoothing: 0,
      closed: true,
    });
    const stroke = brush.stroke([
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]);
    const geometry = (stroke.children[0] as THREE.Mesh).geometry;
    const positions = geometry.getAttribute("position");
    const widths = Array.from({ length: positions.count / 2 }, (_, index) => {
      const left = new THREE.Vector3().fromBufferAttribute(positions, index * 2);
      const right = new THREE.Vector3().fromBufferAttribute(positions, index * 2 + 1);
      return left.distanceTo(right);
    });
    expect(widths.every((value) => Math.abs(value - 0.2) < 0.00001)).toBe(true);
  });

  it("bounds invalid options and cumulative brush geometry", () => {
    const api = createProceduralBrushApi();
    expect(() => api.create().stroke([[0, 0]])).toThrow(/2–48/);
    expect(() =>
      api.create({ normal: [0, 0, 0] }).stroke([
        [0, 0],
        [1, 1],
      ]),
    ).toThrow(/zero vector/);

    const brush = api.create({
      layering: 4,
      smoothing: 0.4,
      texture: "clean",
    });
    const dense = Array.from({ length: 32 }, (_, index) => [index, index % 3] as const);
    brush.stroke(dense);
    expect(() => brush.stroke(dense)).toThrow(
      new RegExp(`${MAX_BRUSH_VERTICES} vertices`),
    );
  });
});
