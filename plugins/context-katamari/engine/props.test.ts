import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { mulberry32 } from "../katamari-math";
import { MaterialKit } from "./materials";
import { buildProp, PROP_CATALOG, propName, propsFor } from "./props";
import { ZONES } from "./zones";

describe("prop catalog", () => {
  it("builds every prop as a unit-sized model standing on the ground", () => {
    const kit = new MaterialKit();
    for (const definition of PROP_CATALOG) {
      const prop = buildProp(definition, { kit, random: mulberry32(7) });
      const bounds = new THREE.Box3().setFromObject(prop);
      const size = bounds.getSize(new THREE.Vector3());
      expect(Math.max(size.x, size.y, size.z), definition.kind).toBeCloseTo(2, 3);
      expect(bounds.min.y, definition.kind).toBeCloseTo(0, 3);
    }
    kit.dispose();
  });

  it("reuses one baked model per variant", () => {
    const kit = new MaterialKit();
    const first = buildProp(PROP_CATALOG[0], { kit, random: () => 0.1 });
    const second = buildProp(PROP_CATALOG[0], { kit, random: () => 0.2 });
    const geometryOf = (object: THREE.Object3D) => {
      let geometry: THREE.BufferGeometry | null = null;
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) geometry ??= child.geometry;
      });
      return geometry;
    };
    expect(first).not.toBe(second);
    expect(geometryOf(first)).toBe(geometryOf(second));
    kit.dispose();
  });

  it("names props for the pickup callout", () => {
    expect(propName({ ...PROP_CATALOG[0], kind: "rubber-duck" })).toBe("Rubber duck");
  });

  it("gives every zone something tiny to roll up first", () => {
    for (const zone of ZONES) {
      expect(propsFor(zone, 0).length, zone).toBeGreaterThan(0);
    }
  });
});
