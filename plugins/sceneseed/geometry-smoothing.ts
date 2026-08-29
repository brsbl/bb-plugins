import * as THREE from "three";

const SMOOTH_CREASE_COSINE = Math.cos(THREE.MathUtils.degToRad(67.5));
const POSITION_PRECISION = 100_000;

function positionKey(
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  index: number,
): string {
  return `${Math.round(position.getX(index) * POSITION_PRECISION)}|${Math.round(
    position.getY(index) * POSITION_PRECISION,
  )}|${Math.round(position.getZ(index) * POSITION_PRECISION)}`;
}

/**
 * Smooths shallow seams in compact generated geometry without adding vertices.
 * Duplicate positions are joined only through normals within the crease angle,
 * so rounded low-poly forms blend while deliberate box-like corners stay hard.
 */
export function smoothGeneratedGeometryNormals(
  geometry: THREE.BufferGeometry,
): boolean {
  const position = geometry.getAttribute("position");
  if (!position || position.count < 2) return false;

  geometry.computeVertexNormals();
  const normal = geometry.getAttribute("normal");
  if (!normal || normal.count !== position.count) return false;

  const groups = new Map<string, number[]>();
  for (let index = 0; index < position.count; index += 1) {
    const key = positionKey(position, index);
    const group = groups.get(key);
    if (group) group.push(index);
    else groups.set(key, [index]);
  }

  const originals = Array.from({ length: normal.count }, (_, index) =>
    new THREE.Vector3(
      normal.getX(index),
      normal.getY(index),
      normal.getZ(index),
    ).normalize(),
  );
  let changed = false;

  for (const indices of groups.values()) {
    if (indices.length < 2) continue;

    const parent = indices.map((_, index) => index);
    const find = (index: number): number => {
      let current = index;
      while (parent[current] !== current) {
        parent[current] = parent[parent[current]!]!;
        current = parent[current]!;
      }
      return current;
    };
    const join = (left: number, right: number): void => {
      const leftRoot = find(left);
      const rightRoot = find(right);
      if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
    };

    for (let left = 0; left < indices.length; left += 1) {
      for (let right = left + 1; right < indices.length; right += 1) {
        const leftNormal = originals[indices[left]!]!;
        const rightNormal = originals[indices[right]!]!;
        if (leftNormal.dot(rightNormal) >= SMOOTH_CREASE_COSINE) {
          join(left, right);
        }
      }
    }

    const sums = new Map<number, THREE.Vector3>();
    for (let localIndex = 0; localIndex < indices.length; localIndex += 1) {
      const root = find(localIndex);
      const sum = sums.get(root) ?? new THREE.Vector3();
      sum.add(originals[indices[localIndex]!]!);
      sums.set(root, sum);
    }

    for (let localIndex = 0; localIndex < indices.length; localIndex += 1) {
      const vertexIndex = indices[localIndex]!;
      const smoothed = sums.get(find(localIndex))!.clone().normalize();
      if (!smoothed.equals(originals[vertexIndex]!)) changed = true;
      normal.setXYZ(vertexIndex, smoothed.x, smoothed.y, smoothed.z);
    }
  }

  normal.needsUpdate = true;
  return changed;
}
