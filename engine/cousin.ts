import * as THREE from "three";

import { mulberry32 } from "../katamari-math";
import { type MaterialKit, pick } from "./materials";

/**
 * Each thread gets its own royal cousin, built like the Prince in the key
 * art: a long capsule head with a yellow-framed face and a yellow antenna
 * topped by a red bead, a bell-shaped suit with a darker hem, and thin limbs
 * ending in round hands and feet. The first cousin is the Prince himself;
 * the thread id picks the rest from a family of colors and head shapes.
 */
type HeadShape = "hammer" | "tall" | "round" | "block";

interface CousinLook {
  head: HeadShape;
  suit: number;
  hem: number;
  stripe: number;
  legs: number;
}

const PRINCE: CousinLook = { head: "hammer", suit: 0x7cc242, hem: 0x4f8f2b, stripe: 0xb4dd72, legs: 0x7a2a8c };

const COUSINS: readonly CousinLook[] = [
  PRINCE,
  PRINCE,
  { head: "hammer", suit: 0xf28db2, hem: 0xc2577f, stripe: 0xfcc6da, legs: 0x3d5a98 },
  { head: "tall", suit: 0x4fa7dd, hem: 0x2f6f9f, stripe: 0x9fd4f2, legs: 0xf08a24 },
  { head: "round", suit: 0xf6c542, hem: 0xc48c1d, stripe: 0xfbe39a, legs: 0x3b8b4a },
  { head: "block", suit: 0xa77bd6, hem: 0x6f4aa0, stripe: 0xd3bdf0, legs: 0xe84a5f },
  { head: "hammer", suit: 0xf3903f, hem: 0xb95e1f, stripe: 0xfac48f, legs: 0x2e5aa8 },
  { head: "tall", suit: 0x45b8a0, hem: 0x2a7d6c, stripe: 0x9fe0cf, legs: 0x8c2a5a },
  { head: "round", suit: 0xe85d5d, hem: 0xa83838, stripe: 0xf7aaaa, legs: 0x4a3a8c },
];

const FACE_FRAME = 0xf5d94a;
const FACE = 0xf2dcc0;
const INK = 0x2b2233;

export interface CousinRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  cape: THREE.Object3D | null;
  antennaTip: THREE.Object3D;
  /** Stars circling the head, one more for each compaction. */
  dizzyStars: THREE.Group;
}

/** Past this many compactions a cousin cannot get any dizzier. */
export const MAX_DIZZY_STARS = 5;

function starGeometry(kit: MaterialKit): THREE.ExtrudeGeometry {
  return kit.geometry("star", () => {
    const shape = new THREE.Shape();
    for (let point = 0; point < 10; point += 1) {
      const angle = (point / 10) * Math.PI * 2 + Math.PI / 2;
      const radius = point % 2 === 0 ? 0.5 : 0.22;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
    geometry.center();
    return geometry;
  });
}

function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  scale: readonly [number, number, number],
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material);
  result.scale.set(...scale);
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

/** A thin limb hanging from its pivot, with a ball on the end. */
function limb(
  kit: MaterialKit,
  material: THREE.Material,
  length: number,
  radius: number,
  ball: number,
  pivot: readonly [number, number, number],
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...pivot);
  mesh(group, kit.cylinder(8), material, [radius * 2, length, radius * 2], [0, -length / 2, 0]);
  mesh(group, kit.sphere(1), material, [ball * 2, ball * 2, ball * 2], [0, -length, 0]);
  return group;
}

/** The face panel: yellow frame, pale face, dot eyes, brows, a nose, and a little "o" mouth. */
function face(kit: MaterialKit, head: THREE.Group, x: number, width: number, height: number): void {
  const ink = kit.solid(INK);
  mesh(head, kit.box(), kit.solid(FACE_FRAME), [0.02, height, width], [x, 0, 0]);
  mesh(head, kit.box(), kit.solid(FACE), [0.024, height * 0.78, width * 0.78], [x + 0.004, 0, 0]);
  const eyeY = height * 0.12;
  for (const side of [-1, 1]) {
    mesh(head, kit.sphere(0), ink, [0.02, 0.03, 0.02], [x + 0.016, eyeY, side * width * 0.2]);
    mesh(head, kit.box(), ink, [0.01, 0.012, width * 0.14], [x + 0.016, eyeY + height * 0.17, side * width * 0.2], [side * 0.3, 0, 0]);
  }
  mesh(head, kit.cone(4), kit.solid(0xf08a24), [0.04, 0.05, 0.04], [x + 0.03, -height * 0.02, 0], [0, 0, -Math.PI / 2]);
  mesh(head, kit.cylinder(10), kit.solid(0xd8342f), [0.045, 0.012, 0.05], [x + 0.016, -height * 0.24, 0], [0, 0, Math.PI / 2]);
}

/** A cousin about one unit tall, facing +x, feet on y = 0. */
export function buildCousin(kit: MaterialKit, seed: number): CousinRig {
  const random = mulberry32(seed);
  const look = pick(random, COUSINS);
  const suit = kit.solid(look.suit);
  const legs = kit.solid(look.legs);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const leftLeg = limb(kit, legs, 0.27, 0.03, 0.055, [0, 0.32, -0.075]);
  const rightLeg = limb(kit, legs, 0.27, 0.03, 0.055, [0, 0.32, 0.075]);
  body.add(leftLeg, rightLeg);

  // Bell-shaped suit, wide at the hem, with a darker band around the bottom.
  mesh(body, kit.cylinder(16, 0.52), suit, [0.34, 0.34, 0.34], [0, 0.47, 0]);
  mesh(body, kit.cylinder(16), kit.solid(look.hem), [0.36, 0.04, 0.36], [0, 0.31, 0]);

  const leftArm = limb(kit, suit, 0.24, 0.026, 0.05, [0, 0.58, -0.1]);
  const rightArm = limb(kit, suit, 0.24, 0.026, 0.05, [0, 0.58, 0.1]);
  body.add(leftArm, rightArm);

  const head = new THREE.Group();
  head.position.y = 0.8;
  body.add(head);
  const stripe = kit.solid(look.stripe);
  let top = 0.18;
  switch (look.head) {
    case "hammer": {
      // The Prince's long capsule, lying sideways, with pale bands near each end.
      mesh(head, kit.cylinder(18), suit, [0.34, 0.72, 0.34], [0, 0, 0], [Math.PI / 2, 0, 0]);
      for (const side of [-1, 1]) {
        mesh(head, kit.sphere(2), suit, [0.34, 0.34, 0.34], [0, 0, side * 0.36]);
        mesh(head, kit.cylinder(18), stripe, [0.345, 0.05, 0.345], [0, 0, side * 0.27], [Math.PI / 2, 0, 0]);
        mesh(head, kit.cylinder(18), stripe, [0.345, 0.03, 0.345], [0, 0, side * 0.2], [Math.PI / 2, 0, 0]);
      }
      face(kit, head, 0.17, 0.24, 0.29);
      break;
    }
    case "tall": {
      mesh(head, kit.cylinder(16), suit, [0.3, 0.46, 0.3], [0, 0.1, 0]);
      mesh(head, kit.sphere(2), suit, [0.3, 0.2, 0.3], [0, 0.33, 0]);
      mesh(head, kit.cylinder(16), stripe, [0.305, 0.05, 0.305], [0, 0.27, 0]);
      face(kit, head, 0.15, 0.2, 0.22);
      top = 0.42;
      break;
    }
    case "round": {
      mesh(head, kit.sphere(2), suit, [0.4, 0.38, 0.4], [0, 0.02, 0]);
      mesh(head, kit.torus(0.08), stripe, [0.34, 0.34, 0.34], [0, 0.02, 0], [Math.PI / 2, 0, 0]);
      face(kit, head, 0.19, 0.18, 0.2);
      top = 0.22;
      break;
    }
    case "block": {
      mesh(head, kit.box(), suit, [0.34, 0.32, 0.4], [0, 0.02, 0]);
      mesh(head, kit.box(), stripe, [0.35, 0.05, 0.41], [0, 0.14, 0]);
      face(kit, head, 0.17, 0.22, 0.22);
      top = 0.19;
      break;
    }
  }

  // Yellow cone antenna with the red bead on top.
  mesh(head, kit.cone(12), kit.solid(FACE_FRAME), [0.08, 0.13, 0.08], [0, top + 0.05, 0]);
  const antennaTip = mesh(head, kit.sphere(2), kit.solid(0xe0312b), [0.075, 0.075, 0.075], [0, top + 0.14, 0]);

  // The cartoon dizzy halo: little yellow stars chasing each other around.
  const dizzyStars = new THREE.Group();
  dizzyStars.position.y = top + 0.12;
  const star = starGeometry(kit);
  for (let index = 0; index < MAX_DIZZY_STARS; index += 1) {
    const orbit = new THREE.Group();
    orbit.rotation.y = (index / MAX_DIZZY_STARS) * Math.PI * 2;
    mesh(orbit, star, kit.glow(index % 2 === 0 ? 0xffe14d : 0xfff3a6), [0.16, 0.16, 0.16], [0.34, 0, 0]);
    orbit.visible = false;
    dizzyStars.add(orbit);
  }
  head.add(dizzyStars);

  return { root, body, head, leftLeg, rightLeg, leftArm, rightArm, cape: null, antennaTip, dizzyStars };
}

export interface CousinPose {
  /** Accumulated stride phase in radians. */
  stride: number;
  /** Ground speed relative to the cousin's height, per second. */
  speed: number;
  /** Seconds since the cousin last moved, for idle fidgets. */
  idleSeconds: number;
  /** Stopped because the user left threads: face the camera and wave. */
  waiting: boolean;
  time: number;
  /** How far forward, from straight down, the arms swing to reach the ball. */
  reach: number;
  /** 0 steady, 1 seeing stars: each compaction leaves the cousin woozier. */
  dizziness: number;
  /** Stars circling the head. */
  stars: number;
}

/**
 * Pushing is a forward lean with both arms on the ball; resting drops the
 * arms and bobs; waiting turns toward the viewer with the odd wave.
 */
export function poseCousin(rig: CousinRig, pose: CousinPose): void {
  const moving = Math.min(1, pose.speed / 1.2);
  const swing = Math.sin(pose.stride) * 0.9 * moving;
  rig.leftLeg.rotation.z = swing;
  rig.rightLeg.rotation.z = -swing;
  rig.body.position.y = Math.abs(Math.sin(pose.stride)) * 0.04 * moving;
  rig.body.rotation.z = -0.35 * moving;
  // Dizzy: a slow drunken sway side to side, faster when the stars pile up.
  const dizzy = pose.dizziness;
  rig.body.rotation.x = Math.sin(pose.time * (1.6 + dizzy)) * 0.2 * dizzy;

  // Limbs hang along -y; a positive z turn swings them forward toward +x.
  const reach = pose.reach;
  const breathe = Math.sin(pose.time * 2.2) * 0.03;
  if (pose.waiting) {
    const wave = Math.sin(pose.time * 7) * 0.5;
    const waving = Math.sin(pose.time * 0.7) > 0.55;
    rig.leftArm.rotation.set(0, 0, breathe);
    rig.rightArm.rotation.set(waving ? -2.6 + wave : 0, 0, 0);
    // Turn most of the way around to face the camera behind the ball.
    rig.body.rotation.y = THREE.MathUtils.lerp(rig.body.rotation.y, Math.PI * 0.8, 0.08);
  } else {
    const armZ = THREE.MathUtils.lerp(breathe, reach, Math.max(moving, 0.35));
    rig.leftArm.rotation.set(0, 0, armZ + (moving > 0 ? Math.sin(pose.stride) * 0.08 : 0));
    rig.rightArm.rotation.set(0, 0, armZ - (moving > 0 ? Math.sin(pose.stride) * 0.08 : 0));
    rig.body.rotation.y = THREE.MathUtils.lerp(rig.body.rotation.y, 0, 0.12);
  }

  // Idle fidget: look around, then tap a foot.
  const fidget = pose.idleSeconds > 1.5 ? Math.sin(pose.time * 0.9) : 0;
  rig.head.rotation.y = fidget * 0.6 * (1 - dizzy);
  // The head lolls around in circles when dizzy.
  const loll = pose.time * (2.4 + dizzy * 2);
  rig.head.rotation.x = Math.sin(loll) * 0.4 * dizzy;
  rig.head.rotation.z = moving * 0.15 + Math.sin(pose.time * 3) * 0.02 + Math.cos(loll) * 0.3 * dizzy;
  rig.dizzyStars.rotation.y = pose.time * (3 + dizzy * 3);
  rig.dizzyStars.children.forEach((orbit, index) => {
    orbit.visible = index < pose.stars;
    orbit.position.y = Math.sin(pose.time * 5 + index * 1.7) * 0.04;
    // Keep each star's face turned back toward the camera behind the cousin.
    orbit.children[0]?.rotation.set(0, Math.PI / 2 - rig.dizzyStars.rotation.y - orbit.rotation.y, pose.time * 4);
  });
  if (moving < 0.05 && pose.idleSeconds > 3 && !pose.waiting) {
    rig.rightLeg.rotation.x = Math.max(0, Math.sin(pose.time * 9)) * 0.25;
  } else {
    rig.rightLeg.rotation.x = 0;
  }
  rig.antennaTip.position.x = Math.sin(pose.time * 5 + pose.stride) * 0.03 * (0.4 + moving);
  // A cape trails a little behind; past ~35 degrees it reads as a plank.
  if (rig.cape) rig.cape.rotation.z = -(0.12 + moving * 0.42 + Math.sin(pose.time * 11) * 0.08 * moving);
}
