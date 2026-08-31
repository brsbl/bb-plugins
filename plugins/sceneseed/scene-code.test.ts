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

  it("rejects agent-authored scenes above the 600-vertex budget", () => {
    const result = safeCompileSceneCode(
      `const root = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 32),
  new THREE.MeshStandardMaterial({ color: 0xdddddd }),
);
return { root, name: "Dense sphere", altText: "A dense pale sphere." };`,
      identity,
    );

    expect(result).toMatchObject({
      success: false,
      issues: [
        expect.objectContaining({
          message: expect.stringContaining("budget is 600"),
        }),
      ],
    });
  });

  it("makes low-segment rounded boxes available to generated scenes", () => {
    const scene = compileSceneCode(
      `const root = new THREE.Mesh(
  new THREE.RoundedBoxGeometry(2, 1.4, 1, 1, 0.18),
  new THREE.MeshStandardMaterial({ color: 0xdddddd }),
);
return { root, name: "Soft box", altText: "A pale box with rounded corners." };`,
      identity,
    );

    expect(scene.stats.vertices).toBeLessThanOrEqual(600);
    expect(scene.stats.objects).toBe(1);
  });

  it("injects the bounded procedural brush without changing the source envelope", () => {
    const scene = compileSceneCode(
      `const root = new THREE.Group();
const pencil = BRUSH.create({
  seed: 31,
  texture: "pencil",
  width: 0.16,
  opacity: 0.5,
  pressureVariation: 0.3,
  jitter: 0.16,
  layering: 2,
  colorBehavior: "graphite",
});
root.add(pencil.stroke([[-3,-2],[-2.7,1],[-1.4,2.3],[0.8,2.5],[2.7,1],[3,-2]], { closed: true }));
root.add(pencil.stroke([[-2.4,0.4],[-1,0.8],[0.2,0.3],[1.7,0.7],[2.4,0.2]]));
root.add(pencil.stroke([[-1.7,-0.2],[-1.1,-1.3],[0.2,-1.7],[1.5,-0.8]]));
return {
  root,
  name: "Loose rain jar",
  altText: "A loose graphite outline of a cloud resting in a jar.",
  camera: "front",
  movement: "still",
  shadow: "none",
};`,
      identity,
    );

    expect(scene).toMatchObject({
      version: 2,
      cameraHint: "front",
      ground: { contactShadow: { strength: 0 } },
      stats: { objects: 6, materials: 2, lights: 0 },
    });
    expect(scene.stats.vertices).toBeLessThanOrEqual(600);
    expect(scene.objectJson.materials).toHaveLength(2);
  });

  it("normalizes each shared brush material once", () => {
    const source = (strokes: number) => `const root = new THREE.Group();
const pencil = BRUSH.create({
  texture: "pencil",
  layering: 3,
  color: 0x555555,
  colorBehavior: "graphite",
  colorVariation: 0.12,
});
for (let index = 0; index < ${strokes}; index += 1) {
  root.add(pencil.stroke([[0, index], [1, index + 0.2], [2, index]]));
}
return { root, name: "Shared graphite", altText: "Layered graphite lines." };`;
    const colors = (strokes: number) =>
      (compileSceneCode(source(strokes), identity).objectJson.materials as Array<{
        color: number;
      }>).map((material) => material.color);

    expect(colors(3)).toEqual(colors(1));
    expect(colors(3).some((value) => value !== 0)).toBe(true);
  });

  it("accepts detailed camera and shadow options emitted by Three.js authors", () => {
    const scene = compileSceneCode(
      lighthouseSource().replace(
        "const dark = new THREE.MeshStandardMaterial({ color: 0x222222 });",
        "const dark = new THREE.MeshStandardMaterial({ color: 0x222222 });\nconst orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)]), new THREE.LineDashedMaterial({ color: 0x555555 }));\nroot.add(orbit);",
      ).replace(
        'camera: "three-quarter",\n  shadow: "crisp",',
        "camera: { position: [5, 4, 6], target: [0, 2, 0] },\n  movement: { rotation: [0, 0.18, 0] },\n  shadow: { enabled: false, opacity: 0.2, blur: 2 },",
      ),
      identity,
    );

    expect(scene.cameraHint).toBe("free");
    expect(scene.motion.preset).toBe("orbit");
    expect(scene.ground.contactShadow.strength).toBe(0);
  });

  it("normalizes ignored Three-style camera metadata without an agent retry", () => {
    const scene = compileSceneCode(
      lighthouseSource().replace(
        'camera: "three-quarter"',
        "camera: { position: { x: 3, y: 2, z: 4 }, lookAt: { x: 0, y: 1, z: 0 } }",
      ),
      identity,
    );

    expect(scene.cameraHint).toBe("free");
  });

  it("normalizes a boolean shadow without forcing an agent retry", () => {
    const scene = compileSceneCode(
      lighthouseSource().replace('shadow: "crisp"', "shadow: true"),
      identity,
    );

    expect(scene.ground.contactShadow).toEqual({
      strength: 0.78,
      softness: 0.18,
    });
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
