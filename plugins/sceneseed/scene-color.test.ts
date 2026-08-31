import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { applySceneColor } from "./scene-color.js";

function sharedMaterialRoot(material: THREE.Material): THREE.Group {
  const root = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(1, 1);
  root.add(new THREE.Mesh(geometry, material));
  root.add(new THREE.Mesh(geometry, material));
  return root;
}

describe("scene color treatment", () => {
  it("preserves dark graphite materials used by sketch strokes", () => {
    const material = new THREE.MeshBasicMaterial({
      color: 0x080808,
      opacity: 0.36,
      transparent: true,
    });
    material.name = "Sketch pencil 1";

    applySceneColor(sharedMaterialRoot(material), null);

    expect(material.color.getHexString(THREE.SRGBColorSpace)).toBe("080808");
    expect(material.opacity).toBe(0.36);
  });

  it("normalizes a shared non-sketch material only once", () => {
    const material = new THREE.MeshBasicMaterial({ color: 0x080808 });

    applySceneColor(sharedMaterialRoot(material), null);

    expect(material.color.getHexString(THREE.SRGBColorSpace)).toBe("4e4e4e");
  });

  it("adds tint to sketch strokes without lifting their graphite value", () => {
    const material = new THREE.MeshBasicMaterial({ color: 0x202020 });
    material.name = "Sketch pencil 1";
    const before = material.color.getHSL({ h: 0, s: 0, l: 0 });

    applySceneColor(sharedMaterialRoot(material), "#2f6df6");

    const after = material.color.getHSL({ h: 0, s: 0, l: 0 });
    expect(after.s).toBeGreaterThan(0.45);
    expect(after.l).toBeCloseTo(before.l, 6);
  });
});
