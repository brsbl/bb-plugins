import { describe, expect, it } from "vitest";
import * as THREE from "three";

import { smoothGeneratedGeometryNormals } from "./geometry-smoothing";

function normalAt(geometry: THREE.BufferGeometry, index: number): THREE.Vector3 {
  const normal = geometry.getAttribute("normal");
  return new THREE.Vector3(
    normal.getX(index),
    normal.getY(index),
    normal.getZ(index),
  );
}

describe("smoothGeneratedGeometryNormals", () => {
  it("blends a shallow duplicated seam without adding vertices", () => {
    const geometry = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          0, 0, 0, 1, 0, 0, 0, 1, 0,
          1, 0, 0, 1, 1, 0.25, 0, 1, 0,
        ],
        3,
      ),
    );
    geometry.computeVertexNormals();
    const vertexCount = geometry.getAttribute("position").count;

    expect(normalAt(geometry, 1).equals(normalAt(geometry, 3))).toBe(false);
    expect(smoothGeneratedGeometryNormals(geometry)).toBe(true);
    expect(normalAt(geometry, 1).distanceTo(normalAt(geometry, 3))).toBeLessThan(
      0.000_01,
    );
    expect(geometry.getAttribute("position").count).toBe(vertexCount);
  });

  it("keeps a deliberate right-angle corner crisp", () => {
    const geometry = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          0, 0, 0, 1, 0, 0, 0, 1, 0,
          0, 0, 0, 0, 0, 1, 1, 0, 0,
        ],
        3,
      ),
    );
    geometry.computeVertexNormals();
    const before = normalAt(geometry, 0).dot(normalAt(geometry, 3));

    smoothGeneratedGeometryNormals(geometry);

    expect(before).toBeCloseTo(0);
    expect(normalAt(geometry, 0).dot(normalAt(geometry, 3))).toBeCloseTo(0);
  });
});
