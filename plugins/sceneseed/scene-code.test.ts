import { describe, expect, it } from "vitest";

import { compileSceneCode, safeCompileSceneCode } from "./scene-code.js";

const identity = { jobId: "job_fixture", objectId: "object_fixture" };

function lighthouseSource(): string {
  return `
const root = new THREE.Group();
const dark = new THREE.MeshStandardMaterial({ color: 0x222222 });
const pale = new THREE.MeshPhysicalMaterial({
  color: 0xeeeeee,
  transmission: 0.3,
  transparent: true,
  opacity: 0.82,
});
const profile = [
  new THREE.Vector2(0.72, 0),
  new THREE.Vector2(0.66, 2.8),
  new THREE.Vector2(0.52, 4.6),
];
root.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 32), dark));
const lantern = new THREE.Mesh(
  new THREE.CylinderGeometry(0.48, 0.48, 0.85, 24),
  pale,
);
lantern.position.y = 5.05;
root.add(lantern);
const roof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.8, 32), dark);
roof.position.y = 5.86;
root.add(roof);
return {
  root,
  name: "Tiny lighthouse",
  altText: "A tapered dark lighthouse with a pale lantern and pointed roof.",
  camera: "three-quarter",
  shadow: "crisp",
};`;
}

describe("SceneSeed generated Three.js source", () => {
  it("executes source and serializes a centered, grounded scene", () => {
    const scene = compileSceneCode(lighthouseSource(), identity);

    expect(scene).toMatchObject({
      version: 2,
      jobId: identity.jobId,
      objectId: identity.objectId,
      name: "Tiny lighthouse",
      cameraHint: "three-quarter",
      stats: { objects: 3, materials: 2, lights: 0 },
    });
    expect(scene.bounds.width).toBeGreaterThan(0);
    expect(scene.bounds.height).toBeGreaterThan(0);
    expect(scene.bounds.depth).toBeGreaterThan(0);
    expect(scene.objectJson).toMatchObject({
      metadata: { type: "Object" },
      object: { type: "Group" },
    });
    expect(
      (scene.objectJson.geometries as Array<{ type: string }>).every(
        (geometry) => geometry.type === "BufferGeometry",
      ),
    ).toBe(true);
  });

  it("rejects syntax errors, textures, and empty roots", () => {
    expect(safeCompileSceneCode("return {", identity).success).toBe(false);
    expect(
      safeCompileSceneCode(
        `const root = new THREE.Group();
return { root, name: "Empty", altText: "An empty scene." };`,
        identity,
      ).success,
    ).toBe(false);
    expect(
      safeCompileSceneCode(
        `const texture = new THREE.Texture();
const material = new THREE.MeshBasicMaterial({ map: texture });
const root = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
return { root, name: "Textured", altText: "A textured cube." };`,
        identity,
      ).success,
    ).toBe(false);
  });

  it("accepts detailed camera and shadow options emitted by Three.js authors", () => {
    const scene = compileSceneCode(
      lighthouseSource().replace(
        "const dark = new THREE.MeshStandardMaterial({ color: 0x222222 });",
        "const dark = new THREE.MeshStandardMaterial({ color: 0x222222 });\nconst orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)]), new THREE.LineDashedMaterial({ color: 0x555555 }));\nroot.add(orbit);",
      ).replace(
        'camera: "three-quarter",\n  shadow: "crisp",',
        "camera: { position: [5, 4, 6], target: [0, 2, 0], fov: 36 },\n  movement: { type: 'orbit', speed: 0.2 },\n  shadow: { enabled: false, opacity: 0.2, blur: 2 },",
      ),
      identity,
    );

    expect(scene.cameraHint).toBe("free");
    expect(scene.motion.preset).toBe("orbit");
    expect(scene.ground.contactShadow.strength).toBe(0);
  });

  it("preserves shared geometry while making generated geometry portable", () => {
    const scene = compileSceneCode(
      `const root = new THREE.Group();
const geometry = new THREE.SphereGeometry(0.4, 16, 12);
const material = new THREE.MeshStandardMaterial({ color: 0xdddddd });
for (let index = 0; index < 6; index += 1) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = index - 2.5;
  root.add(mesh);
}
return {
  root,
  name: "Shared forms",
  altText: "Six rounded forms made from one shared geometry.",
};`,
      identity,
    );

    expect(scene.objectJson.geometries).toHaveLength(1);
  });
});
