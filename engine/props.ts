import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { hashString, mulberry32 } from "../katamari-math";
import { type MaterialKit, pick, TOY_COLORS } from "./materials";
import type { Zone } from "./zones";

type Vec3 = readonly [number, number, number];

export type PropMotion = "walk" | "drive" | "fly" | "bob";

interface BuildContext {
  kit: MaterialKit;
  random: () => number;
}

export interface PropDefinition {
  kind: string;
  /** Scale level where the prop is a snack-sized pickup (see `scaleLevel`). */
  tier: number;
  zones: readonly Zone[] | "all";
  weight?: number;
  motion?: PropMotion;
  build(context: BuildContext): THREE.Group;
}

function part(
  group: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  scale: Vec3,
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

const SKIN = [0xffd7b5, 0xf1b98c, 0xc98d5e, 0x8d5a3b, 0xffe3cc] as const;
const HALF_PI = Math.PI / 2;

const thumbtack: PropDefinition = {
  kind: "thumbtack",
  tier: 0,
  zones: ["room", "town"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(12), kit.solid(pick(random, TOY_COLORS)), [1, 0.28, 1], [0, 0.14, 0]);
    part(group, kit.cylinder(10), kit.solid(pick(random, TOY_COLORS)), [0.55, 0.3, 0.55], [0, 0.42, 0]);
    part(group, kit.cone(6), kit.solid(0xd9dde6), [0.12, 0.9, 0.12], [0, 1.0, 0]);
    return group;
  },
};

const coin: PropDefinition = {
  kind: "coin",
  tier: 0,
  zones: "all",
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(14), kit.solid(0xf5b82e), [1, 0.14, 1], [0, 0.07, 0]);
    part(group, kit.cylinder(14), kit.solid(0xffd65c), [0.72, 0.16, 0.72], [0, 0.08, 0]);
    return group;
  },
};

const button: PropDefinition = {
  kind: "button",
  tier: 0,
  zones: ["room", "candy"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(14), kit.solid(pick(random, TOY_COLORS)), [1, 0.2, 1], [0, 0.1, 0]);
    const hole = kit.solid(0x2b2140);
    for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]] as const) {
      part(group, kit.cylinder(6), hole, [0.12, 0.05, 0.12], [x, 0.21, z]);
    }
    return group;
  },
};

const candy: PropDefinition = {
  kind: "candy",
  tier: 0,
  zones: ["room", "candy"],
  weight: 1.6,
  build({ kit, random }) {
    const group = new THREE.Group();
    const color = pick(random, TOY_COLORS);
    part(group, kit.sphere(1), kit.solid(color), [1, 0.62, 0.62], [0, 0.31, 0]);
    const wrapper = kit.solid(new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.45));
    part(group, kit.cone(6), wrapper, [0.42, 0.42, 0.42], [-0.68, 0.31, 0], [0, 0, -HALF_PI]);
    part(group, kit.cone(6), wrapper, [0.42, 0.42, 0.42], [0.68, 0.31, 0], [0, 0, HALF_PI]);
    return group;
  },
};

const die: PropDefinition = {
  kind: "die",
  tier: 0,
  zones: ["room", "candy"],
  build({ kit, random }) {
    const group = new THREE.Group();
    group.rotation.y = random() * Math.PI;
    part(group, kit.box(), kit.solid(0xfbfbff), [1, 1, 1], [0, 0.5, 0]);
    const pip = kit.solid(random() < 0.3 ? 0xe63946 : 0x1d1b3a);
    for (const [x, z] of [[0, 0], [-0.25, -0.25], [0.25, 0.25], [-0.25, 0.25], [0.25, -0.25]] as const) {
      part(group, kit.sphere(0), pip, [0.16, 0.08, 0.16], [x, 1.0, z]);
    }
    for (const [y, z] of [[0.3, -0.2], [0.7, 0.2]] as const) {
      part(group, kit.sphere(0), pip, [0.08, 0.16, 0.16], [0.5, y, z]);
    }
    return group;
  },
};

const battery: PropDefinition = {
  kind: "battery",
  tier: 0,
  zones: ["room", "town"],
  build({ kit, random }) {
    const group = new THREE.Group();
    const body = pick(random, [0x2b2d42, 0xef233c, 0x3a86ff, 0x06d6a0] as const);
    part(group, kit.cylinder(10), kit.solid(body), [0.5, 1.3, 0.5], [0, 0.25, 0], [0, 0, HALF_PI]);
    part(group, kit.cylinder(10), kit.solid(0xffc300), [0.52, 0.35, 0.52], [0.45, 0.25, 0], [0, 0, HALF_PI]);
    part(group, kit.cylinder(8), kit.solid(0xd9dde6), [0.18, 0.12, 0.18], [0.72, 0.25, 0], [0, 0, HALF_PI]);
    return group;
  },
};

const eraser: PropDefinition = {
  kind: "eraser",
  tier: 0,
  zones: ["room"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(pick(random, [0xffffff, 0xffc8dd, 0xfff3b0] as const)), [1, 0.38, 0.55], [0, 0.19, 0]);
    part(group, kit.box(), kit.solid(pick(random, [0x3a86ff, 0x118ab2, 0x8338ec] as const)), [0.6, 0.4, 0.57], [0.12, 0.2, 0]);
    return group;
  },
};

const mahjong: PropDefinition = {
  kind: "mahjong",
  tier: 0,
  zones: ["room"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(0x2a9d8f), [0.72, 0.16, 1], [0, 0.08, 0]);
    part(group, kit.box(), kit.solid(0xfdf6e3), [0.72, 0.22, 1], [0, 0.27, 0]);
    part(group, kit.box(), kit.solid(pick(random, [0xe63946, 0x1d3557, 0x2a9d8f] as const)), [0.22, 0.03, 0.5], [0, 0.39, 0]);
    return group;
  },
};

const sushi: PropDefinition = {
  kind: "sushi",
  tier: 0,
  zones: ["room", "beach"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(0xfffdf5), [1, 0.42, 0.55], [0, 0.21, 0]);
    const fish = pick(random, [0xff8c5a, 0xff5d73, 0xffd166] as const);
    part(group, kit.box(), kit.solid(fish), [1.12, 0.18, 0.62], [0, 0.5, 0]);
    part(group, kit.box(), kit.solid(0xfff1e6), [0.06, 0.19, 0.63], [-0.2, 0.5, 0]);
    part(group, kit.box(), kit.solid(0xfff1e6), [0.06, 0.19, 0.63], [0.2, 0.5, 0]);
    return group;
  },
};

const strawberry: PropDefinition = {
  kind: "strawberry",
  tier: 0,
  zones: ["room", "candy", "garden"],
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.cone(8), kit.solid(0xf0304f), [0.8, 1, 0.8], [0, 0.5, 0], [Math.PI, 0, 0]);
    part(group, kit.cone(5), kit.solid(0x2fbf71), [0.7, 0.2, 0.7], [0, 1.05, 0], [Math.PI, 0, 0]);
    part(group, kit.cylinder(5), kit.solid(0x2fbf71), [0.08, 0.25, 0.08], [0, 1.2, 0]);
    return group;
  },
};

const seashell: PropDefinition = {
  kind: "seashell",
  tier: 0,
  zones: ["beach"],
  weight: 2,
  build({ kit, random }) {
    const group = new THREE.Group();
    const color = pick(random, [0xffc4a8, 0xffe5d9, 0xf7a8b8, 0xfff1d0] as const);
    part(group, kit.sphere(1), kit.solid(color), [1, 0.4, 0.85], [0, 0.2, 0]);
    const ridge = kit.solid(new THREE.Color(color).multiplyScalar(0.85));
    for (let index = -2; index <= 2; index += 1) {
      part(group, kit.box(), ridge, [0.06, 0.1, 0.8], [index * 0.17, 0.36, 0], [0, index * 0.18, 0]);
    }
    return group;
  },
};

const starfish: PropDefinition = {
  kind: "starfish",
  tier: 0,
  zones: ["beach"],
  weight: 1.5,
  build({ kit, random }) {
    const group = new THREE.Group();
    const material = kit.solid(pick(random, [0xff8c42, 0xff5d8f, 0xffc15e] as const));
    for (let arm = 0; arm < 5; arm += 1) {
      const angle = (arm / 5) * Math.PI * 2;
      part(group, kit.cone(5), material, [0.34, 0.9, 0.2], [Math.cos(angle) * 0.42, 0.1, Math.sin(angle) * 0.42], [HALF_PI, 0, angle - HALF_PI]);
    }
    part(group, kit.sphere(0), material, [0.45, 0.22, 0.45], [0, 0.11, 0]);
    return group;
  },
};

const pencil: PropDefinition = {
  kind: "pencil",
  tier: 1,
  zones: ["room", "town"],
  build({ kit, random }) {
    const group = new THREE.Group();
    group.rotation.y = random() * Math.PI;
    part(group, kit.cylinder(6), kit.solid(pick(random, [0xffd23f, 0x3a86ff, 0xef476f, 0x06d6a0] as const)), [0.3, 2, 0.3], [0, 0.15, 0], [0, 0, HALF_PI]);
    part(group, kit.cone(6), kit.solid(0xf1d3a0), [0.3, 0.4, 0.3], [1.2, 0.15, 0], [0, 0, -HALF_PI]);
    part(group, kit.cone(6), kit.solid(0x2b2d42), [0.1, 0.14, 0.1], [1.4, 0.15, 0], [0, 0, -HALF_PI]);
    part(group, kit.cylinder(8), kit.solid(0xff8fab), [0.3, 0.26, 0.3], [-1.1, 0.15, 0], [0, 0, HALF_PI]);
    return group;
  },
};

const rubberDuck: PropDefinition = {
  kind: "rubber-duck",
  tier: 1,
  zones: ["room", "beach"],
  build({ kit }) {
    const group = new THREE.Group();
    const yellow = kit.solid(0xffd60a);
    part(group, kit.sphere(1), yellow, [1.1, 0.75, 0.85], [0, 0.38, 0]);
    part(group, kit.sphere(1), yellow, [0.6, 0.6, 0.6], [0.32, 0.9, 0]);
    part(group, kit.cone(6), kit.solid(0xff7b00), [0.24, 0.34, 0.24], [0.72, 0.88, 0], [0, 0, -HALF_PI]);
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.08, 0.08, 0.08], [0.55, 1.02, 0.2]);
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.08, 0.08, 0.08], [0.55, 1.02, -0.2]);
    return group;
  },
};

const fruit: PropDefinition = {
  kind: "fruit",
  tier: 1,
  zones: ["room", "garden", "candy"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.sphere(1), kit.solid(pick(random, [0xe63946, 0xff9f1c, 0x9bd346, 0xffd23f] as const)), [1, 0.95, 1], [0, 0.48, 0]);
    part(group, kit.cylinder(5), kit.solid(0x7a4e2d), [0.07, 0.25, 0.07], [0, 1.0, 0]);
    part(group, kit.sphere(0), kit.solid(0x2fbf71), [0.28, 0.06, 0.14], [0.14, 1.04, 0], [0, 0, 0.4]);
    return group;
  },
};

const mug: PropDefinition = {
  kind: "mug",
  tier: 1,
  zones: ["room"],
  build({ kit, random }) {
    const group = new THREE.Group();
    const color = kit.solid(pick(random, TOY_COLORS));
    part(group, kit.cylinder(14), color, [0.8, 0.9, 0.8], [0, 0.45, 0]);
    part(group, kit.cylinder(14), kit.solid(0x6f3b1f), [0.68, 0.02, 0.68], [0, 0.88, 0]);
    part(group, kit.torus(0.2), color, [0.45, 0.45, 0.45], [0.45, 0.45, 0]);
    return group;
  },
};

const cakeSlice: PropDefinition = {
  kind: "cake",
  tier: 1,
  zones: ["room", "candy"],
  build({ kit }) {
    const group = new THREE.Group();
    const wedge = kit.geometry("wedge", () => new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1, false, 0, Math.PI / 3));
    part(group, wedge, kit.solid(0xffe0a3), [2, 0.5, 2], [0, 0.25, 0]);
    part(group, wedge, kit.solid(0xfff8f0), [2.02, 0.12, 2.02], [0, 0.56, 0]);
    part(group, kit.sphere(0), kit.solid(0xf0304f), [0.22, 0.22, 0.22], [0.35, 0.7, 0.35]);
    return group;
  },
};

const alarmClock: PropDefinition = {
  kind: "alarm-clock",
  tier: 1,
  zones: ["room"],
  build({ kit, random }) {
    const group = new THREE.Group();
    const color = kit.solid(pick(random, [0xef233c, 0x3a86ff, 0x06d6a0] as const));
    part(group, kit.cylinder(16), color, [1, 0.4, 1], [0, 0.6, 0], [HALF_PI, 0, 0]);
    part(group, kit.cylinder(16), kit.solid(0xffffff), [0.82, 0.42, 0.82], [0, 0.6, 0.02], [HALF_PI, 0, 0]);
    part(group, kit.box(), kit.solid(0x1d1b3a), [0.05, 0.3, 0.02], [0, 0.7, 0.24]);
    part(group, kit.box(), kit.solid(0x1d1b3a), [0.22, 0.05, 0.02], [0.08, 0.6, 0.24]);
    part(group, kit.sphere(1), color, [0.36, 0.36, 0.36], [-0.32, 1.1, 0]);
    part(group, kit.sphere(1), color, [0.36, 0.36, 0.36], [0.32, 1.1, 0]);
    part(group, kit.cylinder(5), kit.solid(0x1d1b3a), [0.1, 0.2, 0.1], [-0.3, 0.1, 0]);
    part(group, kit.cylinder(5), kit.solid(0x1d1b3a), [0.1, 0.2, 0.1], [0.3, 0.1, 0]);
    return group;
  },
};

const giftBox: PropDefinition = {
  kind: "gift",
  tier: 1,
  zones: ["room", "candy"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(pick(random, TOY_COLORS)), [1, 0.8, 1], [0, 0.4, 0]);
    const ribbon = kit.solid(pick(random, [0xffffff, 0xffd23f, 0xef476f] as const));
    part(group, kit.box(), ribbon, [1.02, 0.82, 0.16], [0, 0.4, 0]);
    part(group, kit.box(), ribbon, [0.16, 0.82, 1.02], [0, 0.4, 0]);
    part(group, kit.torus(0.25), ribbon, [0.36, 0.36, 0.36], [-0.14, 0.92, 0], [0, 0, 0.5]);
    part(group, kit.torus(0.25), ribbon, [0.36, 0.36, 0.36], [0.14, 0.92, 0], [0, 0, -0.5]);
    return group;
  },
};

const lollipop: PropDefinition = {
  kind: "lollipop",
  tier: 1,
  zones: ["candy"],
  weight: 2,
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(6), kit.solid(0xffffff), [0.1, 1.4, 0.1], [0, 0.7, 0]);
    part(group, kit.cylinder(16), kit.solid(pick(random, TOY_COLORS)), [1, 0.2, 1], [0, 1.6, 0], [HALF_PI, 0, 0]);
    part(group, kit.torus(0.14), kit.solid(0xffffff), [0.6, 0.6, 0.6], [0, 1.6, 0.1]);
    return group;
  },
};

const mushroom: PropDefinition = {
  kind: "mushroom",
  tier: 1,
  zones: ["forest", "garden"],
  weight: 1.6,
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(8), kit.solid(0xfff1d6), [0.4, 0.6, 0.4], [0, 0.3, 0]);
    const cap = pick(random, [0xe63946, 0xff9f1c, 0x8338ec] as const);
    part(group, kit.sphere(1), kit.solid(cap), [1.1, 0.6, 1.1], [0, 0.7, 0]);
    const dot = kit.solid(0xffffff);
    for (const [x, z] of [[0.25, 0.1], [-0.2, 0.25], [-0.1, -0.3], [0.3, -0.25]] as const) {
      part(group, kit.sphere(0), dot, [0.14, 0.1, 0.14], [x, 0.92, z]);
    }
    return group;
  },
};

const book: PropDefinition = {
  kind: "book",
  tier: 2,
  zones: ["room"],
  build({ kit, random }) {
    const group = new THREE.Group();
    group.rotation.y = random() * Math.PI;
    part(group, kit.box(), kit.solid(pick(random, TOY_COLORS)), [1, 0.26, 1.4], [0, 0.13, 0]);
    part(group, kit.box(), kit.solid(0xfffbea), [0.94, 0.2, 1.36], [0.05, 0.13, 0]);
    part(group, kit.box(), kit.solid(pick(random, TOY_COLORS)), [0.9, 0.24, 1.3], [0.1, 0.37, 0.05], [0, 0.3, 0]);
    part(group, kit.box(), kit.solid(0xfffbea), [0.84, 0.18, 1.26], [0.15, 0.37, 0.05], [0, 0.3, 0]);
    return group;
  },
};

const teapot: PropDefinition = {
  kind: "teapot",
  tier: 2,
  zones: ["room"],
  build({ kit, random }) {
    const group = new THREE.Group();
    const color = kit.solid(pick(random, [0xffffff, 0x9bf6ff, 0xffc8dd, 0xb8e0d2] as const));
    part(group, kit.sphere(1), color, [1.1, 0.85, 1.1], [0, 0.45, 0]);
    part(group, kit.cylinder(6, 0.5), color, [0.24, 0.7, 0.24], [0.6, 0.6, 0], [0, 0, -0.7]);
    part(group, kit.torus(0.2), color, [0.5, 0.5, 0.5], [-0.58, 0.5, 0]);
    part(group, kit.sphere(1), color, [0.5, 0.2, 0.5], [0, 0.88, 0]);
    part(group, kit.sphere(0), kit.solid(0xffd23f), [0.14, 0.14, 0.14], [0, 1.0, 0]);
    return group;
  },
};

const toyRobot: PropDefinition = {
  kind: "toy-robot",
  tier: 2,
  zones: ["room", "town"],
  motion: "walk",
  build({ kit, random }) {
    const group = new THREE.Group();
    const metal = kit.solid(pick(random, [0xbfc7d5, 0x3a86ff, 0xef476f] as const));
    const trim = kit.solid(0x2b2d42);
    part(group, kit.box(), trim, [0.22, 0.45, 0.22], [0, 0.22, -0.18]);
    part(group, kit.box(), trim, [0.22, 0.45, 0.22], [0, 0.22, 0.18]);
    part(group, kit.box(), metal, [0.6, 0.6, 0.7], [0, 0.75, 0]);
    part(group, kit.box(), metal, [0.46, 0.4, 0.5], [0, 1.28, 0]);
    part(group, kit.box(), kit.glow(0x9bf6ff), [0.05, 0.1, 0.1], [0.24, 1.3, -0.12]);
    part(group, kit.box(), kit.glow(0x9bf6ff), [0.05, 0.1, 0.1], [0.24, 1.3, 0.12]);
    part(group, kit.cylinder(4), trim, [0.04, 0.3, 0.04], [0, 1.62, 0]);
    part(group, kit.sphere(0), kit.glow(0xff006e), [0.12, 0.12, 0.12], [0, 1.78, 0]);
    part(group, kit.box(), metal, [0.16, 0.5, 0.16], [0, 0.72, -0.46]);
    part(group, kit.box(), metal, [0.16, 0.5, 0.16], [0, 0.72, 0.46]);
    return group;
  },
};

const pottedFlower: PropDefinition = {
  kind: "potted-flower",
  tier: 2,
  zones: ["room", "garden", "town"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(8, 1.3), kit.solid(0xd2693c), [0.7, 0.6, 0.7], [0, 0.3, 0]);
    part(group, kit.cylinder(8), kit.solid(0x5b3a29), [0.84, 0.04, 0.84], [0, 0.6, 0]);
    part(group, kit.cylinder(5), kit.solid(0x2fbf71), [0.08, 0.8, 0.08], [0, 1.0, 0]);
    const petal = kit.solid(pick(random, TOY_COLORS));
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      part(group, kit.sphere(0), petal, [0.3, 0.12, 0.3], [Math.cos(angle) * 0.24, 1.42, Math.sin(angle) * 0.24]);
    }
    part(group, kit.sphere(0), kit.solid(0xffd23f), [0.22, 0.14, 0.22], [0, 1.44, 0]);
    return group;
  },
};

const trafficCone: PropDefinition = {
  kind: "traffic-cone",
  tier: 2,
  zones: ["town"],
  weight: 1.4,
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(0xff6b00), [0.9, 0.1, 0.9], [0, 0.05, 0]);
    part(group, kit.cone(10), kit.solid(0xff7b00), [0.7, 1.3, 0.7], [0, 0.72, 0]);
    part(group, kit.cylinder(10, 0.75), kit.solid(0xffffff), [0.48, 0.22, 0.48], [0, 0.72, 0]);
    return group;
  },
};

const beachBall: PropDefinition = {
  kind: "beach-ball",
  tier: 2,
  zones: ["beach"],
  weight: 1.4,
  motion: "bob",
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.sphere(2), kit.solid(0xffffff), [1, 1, 1], [0, 0.5, 0]);
    part(group, kit.torus(0.16), kit.solid(0xef233c), [0.96, 0.96, 0.96], [0, 0.5, 0]);
    part(group, kit.torus(0.16), kit.solid(0x3a86ff), [0.96, 0.96, 0.96], [0, 0.5, 0], [0, HALF_PI, 0]);
    part(group, kit.torus(0.16), kit.solid(0xffd23f), [0.96, 0.96, 0.96], [0, 0.5, 0], [HALF_PI, 0, 0]);
    return group;
  },
};

const cat: PropDefinition = {
  kind: "cat",
  tier: 2,
  zones: ["room", "garden", "town"],
  motion: "walk",
  build({ kit, random }) {
    const group = new THREE.Group();
    const fur = kit.solid(pick(random, [0xff9f45, 0x5c5c6e, 0xfdfdfd, 0x2b2b36, 0xe8c07d] as const));
    part(group, kit.sphere(1), fur, [1.3, 0.72, 0.7], [0, 0.55, 0]);
    part(group, kit.sphere(1), fur, [0.66, 0.6, 0.62], [0.7, 0.85, 0]);
    part(group, kit.cone(4), fur, [0.2, 0.3, 0.2], [0.72, 1.2, -0.18]);
    part(group, kit.cone(4), fur, [0.2, 0.3, 0.2], [0.72, 1.2, 0.18]);
    part(group, kit.cylinder(5), fur, [0.1, 0.8, 0.1], [-0.75, 0.9, 0], [0, 0, 0.7]);
    for (const [x, z] of [[0.4, 0.2], [0.4, -0.2], [-0.4, 0.2], [-0.4, -0.2]] as const) {
      part(group, kit.cylinder(5), fur, [0.14, 0.4, 0.14], [x, 0.2, z]);
    }
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.07, 0.1, 0.07], [0.98, 0.92, -0.14]);
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.07, 0.1, 0.07], [0.98, 0.92, 0.14]);
    return group;
  },
};

const penguin: PropDefinition = {
  kind: "penguin",
  tier: 2,
  zones: ["snow"],
  weight: 2,
  motion: "walk",
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.sphere(1), kit.solid(0x22223b), [0.8, 1.2, 0.75], [0, 0.65, 0]);
    part(group, kit.sphere(1), kit.solid(0xffffff), [0.5, 0.9, 0.6], [0.2, 0.6, 0]);
    part(group, kit.cone(5), kit.solid(0xff9f1c), [0.14, 0.26, 0.14], [0.46, 1.0, 0], [0, 0, -HALF_PI]);
    part(group, kit.box(), kit.solid(0xff9f1c), [0.3, 0.06, 0.18], [0.12, 0.03, -0.16]);
    part(group, kit.box(), kit.solid(0xff9f1c), [0.3, 0.06, 0.18], [0.12, 0.03, 0.16]);
    return group;
  },
};

const crab: PropDefinition = {
  kind: "crab",
  tier: 1,
  zones: ["beach"],
  motion: "walk",
  build({ kit }) {
    const group = new THREE.Group();
    const shell = kit.solid(0xff4d4d);
    part(group, kit.sphere(1), shell, [1, 0.45, 0.8], [0, 0.35, 0]);
    part(group, kit.sphere(0), shell, [0.32, 0.26, 0.26], [0.55, 0.42, -0.45]);
    part(group, kit.sphere(0), shell, [0.32, 0.26, 0.26], [0.55, 0.42, 0.45]);
    for (let index = 0; index < 3; index += 1) {
      part(group, kit.cylinder(4), shell, [0.06, 0.4, 0.06], [-0.2 + index * 0.2, 0.18, -0.45], [0.7, 0, 0]);
      part(group, kit.cylinder(4), shell, [0.06, 0.4, 0.06], [-0.2 + index * 0.2, 0.18, 0.45], [-0.7, 0, 0]);
    }
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.08, 0.12, 0.08], [0.35, 0.62, -0.12]);
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.08, 0.12, 0.08], [0.35, 0.62, 0.12]);
    return group;
  },
};

const sunflower: PropDefinition = {
  kind: "sunflower",
  tier: 3,
  zones: ["garden"],
  weight: 1.4,
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(6), kit.solid(0x3a9d23), [0.12, 2.4, 0.12], [0, 1.2, 0]);
    part(group, kit.sphere(0), kit.solid(0x3a9d23), [0.5, 0.08, 0.24], [0.22, 1.1, 0], [0, 0, 0.4]);
    part(group, kit.cylinder(12), kit.solid(0x6b3e1d), [0.6, 0.12, 0.6], [0.05, 2.5, 0], [0, 0, HALF_PI]);
    const petal = kit.solid(0xffd000);
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2;
      part(group, kit.sphere(0), petal, [0.08, 0.32, 0.18], [0.06, 2.5 + Math.sin(angle) * 0.45, Math.cos(angle) * 0.45], [angle, 0, 0]);
    }
    return group;
  },
};

const dog: PropDefinition = {
  kind: "dog",
  tier: 3,
  zones: ["garden", "town", "beach"],
  motion: "walk",
  build({ kit, random }) {
    const group = new THREE.Group();
    const fur = kit.solid(pick(random, [0xc68b59, 0xfdfdfd, 0x3d3d3d, 0xf4d58d] as const));
    const dark = kit.solid(0x5a3d2b);
    part(group, kit.box(), fur, [1.3, 0.6, 0.62], [0, 0.7, 0]);
    part(group, kit.box(), fur, [0.62, 0.58, 0.56], [0.78, 1.1, 0]);
    part(group, kit.box(), fur, [0.36, 0.28, 0.4], [1.2, 0.98, 0]);
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.12, 0.12, 0.12], [1.4, 1.05, 0]);
    part(group, kit.box(), dark, [0.12, 0.44, 0.22], [0.7, 1.12, -0.36]);
    part(group, kit.box(), dark, [0.12, 0.44, 0.22], [0.7, 1.12, 0.36]);
    part(group, kit.cylinder(5), fur, [0.1, 0.5, 0.1], [-0.75, 1.05, 0], [0, 0, 0.8]);
    for (const [x, z] of [[0.45, 0.2], [0.45, -0.2], [-0.45, 0.2], [-0.45, -0.2]] as const) {
      part(group, kit.cylinder(5), fur, [0.16, 0.5, 0.16], [x, 0.25, z]);
    }
    return group;
  },
};

const person: PropDefinition = {
  kind: "person",
  tier: 3,
  zones: ["town", "garden", "beach", "snow", "room"],
  weight: 1.6,
  motion: "walk",
  build({ kit, random }) {
    const group = new THREE.Group();
    const shirt = kit.solid(pick(random, TOY_COLORS));
    const pants = kit.solid(pick(random, [0x1d3557, 0x2b2d42, 0x6d597a, 0x588157] as const));
    const skin = kit.solid(pick(random, SKIN));
    part(group, kit.cylinder(6), pants, [0.2, 0.9, 0.2], [0, 0.45, -0.14]);
    part(group, kit.cylinder(6), pants, [0.2, 0.9, 0.2], [0, 0.45, 0.14]);
    part(group, kit.cylinder(8, 0.85), shirt, [0.62, 0.95, 0.5], [0, 1.35, 0]);
    part(group, kit.cylinder(6), shirt, [0.16, 0.8, 0.16], [0, 1.3, -0.4], [0.25, 0, 0]);
    part(group, kit.cylinder(6), shirt, [0.16, 0.8, 0.16], [0, 1.3, 0.4], [-0.25, 0, 0]);
    part(group, kit.sphere(1), skin, [0.5, 0.56, 0.5], [0, 2.1, 0]);
    part(group, kit.sphere(1), kit.solid(pick(random, [0x2b2118, 0x6b3e1d, 0xf2c14e, 0xb23a48, 0x1d1b3a] as const)), [0.54, 0.34, 0.54], [-0.04, 2.3, 0]);
    return group;
  },
};

const mailbox: PropDefinition = {
  kind: "mailbox",
  tier: 3,
  zones: ["town", "garden"],
  build({ kit }) {
    const group = new THREE.Group();
    const red = kit.solid(0xe63946);
    part(group, kit.box(), kit.solid(0x7a4e2d), [0.2, 1.2, 0.2], [0, 0.6, 0]);
    part(group, kit.box(), red, [0.9, 0.45, 0.5], [0, 1.4, 0]);
    part(group, kit.cylinder(10), red, [0.5, 0.9, 0.5], [0, 1.62, 0], [0, 0, HALF_PI]);
    part(group, kit.box(), kit.solid(0xffd23f), [0.06, 0.4, 0.06], [0.3, 1.9, 0.26]);
    return group;
  },
};

const bench: PropDefinition = {
  kind: "bench",
  tier: 3,
  zones: ["town", "garden", "beach"],
  build({ kit }) {
    const group = new THREE.Group();
    const wood = kit.solid(0xc97b3d);
    const metal = kit.solid(0x2d6a4f);
    part(group, kit.box(), wood, [2, 0.1, 0.7], [0, 0.6, 0]);
    part(group, kit.box(), wood, [2, 0.5, 0.08], [0, 1.0, -0.32], [-0.15, 0, 0]);
    for (const x of [-0.85, 0.85]) {
      part(group, kit.box(), metal, [0.1, 0.6, 0.6], [x, 0.3, 0]);
      part(group, kit.box(), metal, [0.1, 0.6, 0.08], [x, 0.95, -0.34]);
    }
    return group;
  },
};

const bicycle: PropDefinition = {
  kind: "bicycle",
  tier: 3,
  zones: ["town", "garden"],
  build({ kit, random }) {
    const group = new THREE.Group();
    const tire = kit.solid(0x1d1b3a);
    const frame = kit.solid(pick(random, TOY_COLORS));
    part(group, kit.torus(0.1), tire, [1.1, 1.1, 1.1], [-0.7, 0.55, 0]);
    part(group, kit.torus(0.1), tire, [1.1, 1.1, 1.1], [0.7, 0.55, 0]);
    part(group, kit.cylinder(5), frame, [0.08, 1.3, 0.08], [0, 0.85, 0], [0, 0, HALF_PI]);
    part(group, kit.cylinder(5), frame, [0.08, 0.9, 0.08], [-0.35, 0.72, 0], [0, 0, 0.9]);
    part(group, kit.cylinder(5), frame, [0.08, 0.9, 0.08], [0.45, 0.8, 0], [0, 0, -0.35]);
    part(group, kit.box(), kit.solid(0x2b2d42), [0.36, 0.08, 0.2], [-0.35, 1.18, 0]);
    part(group, kit.cylinder(5), kit.solid(0xbfc7d5), [0.06, 0.6, 0.06], [0.58, 1.25, 0], [HALF_PI, 0, 0]);
    return group;
  },
};

const umbrella: PropDefinition = {
  kind: "umbrella",
  tier: 3,
  zones: ["beach"],
  weight: 1.5,
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(6), kit.solid(0xffffff), [0.08, 2.2, 0.08], [0, 1.1, 0], [0.12, 0, 0]);
    part(group, kit.cone(8), kit.solid(pick(random, TOY_COLORS)), [2.4, 0.6, 2.4], [0, 2.2, 0.12]);
    part(group, kit.cone(8), kit.solid(0xffffff), [1.2, 0.34, 1.2], [0, 2.38, 0.12]);
    return group;
  },
};

const snowman: PropDefinition = {
  kind: "snowman",
  tier: 3,
  zones: ["snow"],
  weight: 1.8,
  build({ kit, random }) {
    const group = new THREE.Group();
    const snow = kit.solid(0xfdfdff);
    part(group, kit.sphere(1), snow, [1.1, 1.0, 1.1], [0, 0.5, 0]);
    part(group, kit.sphere(1), snow, [0.8, 0.75, 0.8], [0, 1.28, 0]);
    part(group, kit.sphere(1), snow, [0.58, 0.55, 0.58], [0, 1.88, 0]);
    part(group, kit.cone(6), kit.solid(0xff7b00), [0.1, 0.36, 0.1], [0.36, 1.9, 0], [0, 0, -HALF_PI]);
    part(group, kit.torus(0.2), kit.solid(pick(random, [0xe63946, 0x3a86ff, 0x06d6a0] as const)), [0.62, 0.62, 0.62], [0, 1.6, 0], [HALF_PI, 0, 0]);
    part(group, kit.cylinder(10), kit.solid(0x1d1b3a), [0.5, 0.06, 0.5], [0, 2.12, 0]);
    part(group, kit.cylinder(10), kit.solid(0x1d1b3a), [0.34, 0.36, 0.34], [0, 2.3, 0]);
    return group;
  },
};

const vendingMachine: PropDefinition = {
  kind: "vending-machine",
  tier: 3,
  zones: ["town"],
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(pick(random, [0xe63946, 0x3a86ff, 0xfdfdfd] as const)), [0.9, 1.9, 0.8], [0, 0.95, 0]);
    part(group, kit.box(), kit.glow(0xcaf0f8), [0.05, 0.9, 0.6], [0.46, 1.25, 0]);
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        part(group, kit.cylinder(6), kit.solid(pick(random, TOY_COLORS)), [0.1, 0.22, 0.1], [0.44, 1.0 + row * 0.26, -0.18 + column * 0.18]);
      }
    }
    part(group, kit.box(), kit.solid(0x2b2d42), [0.05, 0.14, 0.5], [0.46, 0.35, 0]);
    return group;
  },
};

const car: PropDefinition = {
  kind: "car",
  tier: 4,
  zones: ["town", "beach"],
  weight: 1.6,
  motion: "drive",
  build({ kit, random }) {
    const group = new THREE.Group();
    const paint = kit.solid(pick(random, TOY_COLORS));
    part(group, kit.box(), paint, [2.3, 0.62, 1.1], [0, 0.55, 0]);
    part(group, kit.box(), kit.solid(0xbde0fe), [1.2, 0.5, 1.0], [-0.15, 1.1, 0]);
    part(group, kit.box(), paint, [1.26, 0.08, 1.04], [-0.15, 1.38, 0]);
    const tire = kit.solid(0x1d1b3a);
    for (const [x, z] of [[0.75, 0.55], [0.75, -0.55], [-0.75, 0.55], [-0.75, -0.55]] as const) {
      part(group, kit.cylinder(10), tire, [0.52, 0.22, 0.52], [x, 0.26, z], [HALF_PI, 0, 0]);
    }
    part(group, kit.box(), kit.glow(0xfff3b0), [0.04, 0.14, 0.22], [1.16, 0.62, -0.35]);
    part(group, kit.box(), kit.glow(0xfff3b0), [0.04, 0.14, 0.22], [1.16, 0.62, 0.35]);
    return group;
  },
};

const cow: PropDefinition = {
  kind: "cow",
  tier: 4,
  zones: ["garden", "forest"],
  motion: "walk",
  build({ kit }) {
    const group = new THREE.Group();
    const white = kit.solid(0xfdfdfd);
    const black = kit.solid(0x1d1b3a);
    part(group, kit.box(), white, [1.8, 0.9, 0.9], [0, 1.1, 0]);
    part(group, kit.sphere(0), black, [0.6, 0.5, 0.1], [0.2, 1.2, 0.46]);
    part(group, kit.sphere(0), black, [0.5, 0.4, 0.1], [-0.4, 1.05, -0.46]);
    part(group, kit.box(), white, [0.6, 0.55, 0.6], [1.1, 1.4, 0]);
    part(group, kit.box(), kit.solid(0xffb4c2), [0.24, 0.3, 0.5], [1.44, 1.3, 0]);
    part(group, kit.cone(5), kit.solid(0xfff1d6), [0.1, 0.3, 0.1], [1.05, 1.8, -0.22]);
    part(group, kit.cone(5), kit.solid(0xfff1d6), [0.1, 0.3, 0.1], [1.05, 1.8, 0.22]);
    for (const [x, z] of [[0.65, 0.3], [0.65, -0.3], [-0.65, 0.3], [-0.65, -0.3]] as const) {
      part(group, kit.cylinder(5), white, [0.2, 0.7, 0.2], [x, 0.35, z]);
    }
    part(group, kit.sphere(0), kit.solid(0xffb4c2), [0.34, 0.2, 0.3], [-0.3, 0.62, 0]);
    return group;
  },
};

const tree: PropDefinition = {
  kind: "tree",
  tier: 4,
  zones: ["garden", "town", "forest"],
  weight: 2,
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(6), kit.solid(0x8a5a3b), [0.4, 1.6, 0.4], [0, 0.8, 0]);
    const greens = [0x52b788, 0x74c69d, 0x40916c, 0x95d5b2] as const;
    part(group, kit.sphere(0), kit.solid(pick(random, greens)), [1.8, 1.6, 1.8], [0, 2.2, 0]);
    part(group, kit.sphere(0), kit.solid(pick(random, greens)), [1.2, 1.1, 1.2], [0.5, 2.8, 0.3]);
    part(group, kit.sphere(0), kit.solid(pick(random, greens)), [1.1, 1.0, 1.1], [-0.5, 2.6, -0.3]);
    if (random() < 0.4) {
      for (let index = 0; index < 4; index += 1) {
        part(group, kit.sphere(0), kit.solid(0xe63946), [0.2, 0.2, 0.2], [Math.cos(index * 1.7) * 0.8, 2.1 + index * 0.15, Math.sin(index * 1.7) * 0.8]);
      }
    }
    return group;
  },
};

const pineTree: PropDefinition = {
  kind: "pine-tree",
  tier: 4,
  zones: ["forest", "snow"],
  weight: 2.2,
  build({ kit, random }) {
    const group = new THREE.Group();
    const snowy = random() < 0.5;
    part(group, kit.cylinder(6), kit.solid(0x6b4226), [0.35, 0.9, 0.35], [0, 0.45, 0]);
    const green = kit.solid(pick(random, [0x2d6a4f, 0x1b4332, 0x40916c] as const));
    for (let tier = 0; tier < 3; tier += 1) {
      part(group, kit.cone(7), green, [1.8 - tier * 0.45, 1.3, 1.8 - tier * 0.45], [0, 1.4 + tier * 0.75, 0]);
    }
    if (snowy) part(group, kit.cone(7), kit.solid(0xffffff), [0.5, 0.45, 0.5], [0, 3.1, 0]);
    return group;
  },
};

const palmTree: PropDefinition = {
  kind: "palm-tree",
  tier: 4,
  zones: ["beach"],
  weight: 2,
  build({ kit }) {
    const group = new THREE.Group();
    const bark = kit.solid(0xb5835a);
    for (let segment = 0; segment < 6; segment += 1) {
      part(group, kit.cylinder(6, 0.85), bark, [0.34, 0.6, 0.34], [segment * segment * 0.02, 0.3 + segment * 0.55, 0], [0, 0, -segment * 0.05]);
    }
    const leaf = kit.solid(0x2fbf71);
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      part(group, kit.sphere(0), leaf, [1.5, 0.08, 0.4], [0.6 + Math.cos(angle) * 0.7, 3.4, Math.sin(angle) * 0.7], [0, -angle, -0.3]);
    }
    part(group, kit.sphere(0), kit.solid(0x7a4e2d), [0.26, 0.26, 0.26], [0.55, 3.2, 0.15]);
    part(group, kit.sphere(0), kit.solid(0x7a4e2d), [0.26, 0.26, 0.26], [0.7, 3.2, -0.12]);
    return group;
  },
};

const house: PropDefinition = {
  kind: "house",
  tier: 5,
  zones: ["town", "garden", "snow"],
  weight: 2,
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(pick(random, [0xfff1d6, 0xffd6e0, 0xcaf0f8, 0xfdfcdc, 0xe2ece9] as const)), [2.2, 1.5, 1.9], [0, 0.75, 0]);
    part(group, kit.cone(4), kit.solid(pick(random, [0xe63946, 0x3a86ff, 0x2a9d8f, 0x6d597a] as const)), [2.3, 1.1, 2.0], [0, 2.05, 0], [0, Math.PI / 4, 0]);
    part(group, kit.box(), kit.solid(0x7a4e2d), [0.05, 0.8, 0.5], [1.11, 0.4, 0.3]);
    const window = kit.glow(0xfff3b0);
    part(group, kit.box(), window, [0.05, 0.42, 0.42], [1.11, 0.95, -0.45]);
    part(group, kit.box(), window, [0.42, 0.42, 0.05], [-0.4, 0.95, 0.96]);
    part(group, kit.box(), window, [0.42, 0.42, 0.05], [0.5, 0.95, 0.96]);
    part(group, kit.box(), kit.solid(0x9d4edd), [0.3, 0.7, 0.3], [-0.55, 2.35, -0.35]);
    return group;
  },
};

const bus: PropDefinition = {
  kind: "bus",
  tier: 5,
  zones: ["town"],
  motion: "drive",
  build({ kit, random }) {
    const group = new THREE.Group();
    const paint = kit.solid(pick(random, [0xffd23f, 0x06d6a0, 0xef476f] as const));
    part(group, kit.box(), paint, [4.2, 1.5, 1.4], [0, 1.05, 0]);
    part(group, kit.box(), kit.solid(0xbde0fe), [3.8, 0.5, 1.42], [-0.1, 1.35, 0]);
    part(group, kit.box(), kit.solid(0xbde0fe), [0.05, 0.7, 1.2], [2.11, 1.25, 0]);
    const tire = kit.solid(0x1d1b3a);
    for (const [x, z] of [[1.3, 0.7], [1.3, -0.7], [-1.3, 0.7], [-1.3, -0.7]] as const) {
      part(group, kit.cylinder(10), tire, [0.62, 0.24, 0.62], [x, 0.3, z], [HALF_PI, 0, 0]);
    }
    return group;
  },
};

const windmill: PropDefinition = {
  kind: "windmill",
  tier: 5,
  zones: ["garden", "forest"],
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(8, 0.65), kit.solid(0xfdfcdc), [1.3, 3, 1.3], [0, 1.5, 0]);
    part(group, kit.cone(8), kit.solid(0xe63946), [1.1, 0.8, 1.1], [0, 3.4, 0]);
    const hub = new THREE.Group();
    hub.position.set(0.56, 2.7, 0);
    hub.userData.spin = { axis: "x", speed: 1.4 };
    const sail = kit.solid(0xfff8f0);
    for (let blade = 0; blade < 4; blade += 1) {
      const arm = new THREE.Group();
      arm.rotation.x = (blade / 4) * Math.PI * 2;
      part(arm, kit.box(), sail, [0.06, 1.7, 0.4], [0, 0.95, 0]);
      hub.add(arm);
    }
    group.add(hub);
    return group;
  },
};

const lighthouse: PropDefinition = {
  kind: "lighthouse",
  tier: 5,
  zones: ["beach"],
  build({ kit }) {
    const group = new THREE.Group();
    for (let band = 0; band < 5; band += 1) {
      part(group, kit.cylinder(10, 0.94), kit.solid(band % 2 === 0 ? 0xffffff : 0xe63946), [1.2 - band * 0.12, 0.8, 1.2 - band * 0.12], [0, 0.4 + band * 0.8, 0]);
    }
    part(group, kit.cylinder(10), kit.glow(0xfff3b0), [0.62, 0.5, 0.62], [0, 4.25, 0]);
    part(group, kit.cone(10), kit.solid(0x1d3557), [0.9, 0.6, 0.9], [0, 4.8, 0]);
    return group;
  },
};

const pagoda: PropDefinition = {
  kind: "pagoda",
  tier: 5,
  zones: ["garden", "town", "forest"],
  build({ kit, random }) {
    const group = new THREE.Group();
    const wall = kit.solid(0xfff1d6);
    const roof = kit.solid(pick(random, [0xd62828, 0x2a9d8f, 0x3d405b] as const));
    for (let storey = 0; storey < 3; storey += 1) {
      const width = 1.8 - storey * 0.4;
      part(group, kit.box(), wall, [width, 0.9, width], [0, 0.45 + storey * 1.2, 0]);
      part(group, kit.cone(4), roof, [width * 1.9, 0.45, width * 1.9], [0, 1.08 + storey * 1.2, 0], [0, Math.PI / 4, 0]);
    }
    part(group, kit.cylinder(5), kit.solid(0xffd23f), [0.08, 0.8, 0.08], [0, 3.9, 0]);
    return group;
  },
};

const hotAirBalloon: PropDefinition = {
  kind: "hot-air-balloon",
  tier: 5,
  zones: "all",
  weight: 0.6,
  motion: "fly",
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.sphere(1), kit.solid(pick(random, TOY_COLORS)), [2, 2.3, 2], [0, 2.6, 0]);
    part(group, kit.torus(0.06), kit.solid(pick(random, TOY_COLORS)), [2.04, 2.04, 2.04], [0, 2.6, 0], [HALF_PI, 0, 0]);
    part(group, kit.torus(0.06), kit.solid(0xffffff), [1.7, 1.7, 1.7], [0, 3.2, 0], [HALF_PI, 0, 0]);
    part(group, kit.box(), kit.solid(0xa0522d), [0.6, 0.45, 0.6], [0, 0.22, 0]);
    for (const [x, z] of [[0.26, 0.26], [-0.26, 0.26], [0.26, -0.26], [-0.26, -0.26]] as const) {
      part(group, kit.cylinder(3), kit.solid(0x5a3d2b), [0.03, 1.2, 0.03], [x * 1.4, 0.95, z * 1.4]);
    }
    return group;
  },
};

const whale: PropDefinition = {
  kind: "whale",
  tier: 5,
  zones: ["beach"],
  weight: 0.8,
  motion: "bob",
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.sphere(1), kit.solid(0x4895ef), [3, 1.3, 1.5], [0, 0.65, 0]);
    part(group, kit.sphere(1), kit.solid(0xcaf0f8), [2.4, 0.6, 1.2], [0.2, 0.36, 0]);
    part(group, kit.sphere(0), kit.solid(0x4895ef), [0.4, 0.1, 1.2], [-1.7, 0.9, 0], [0, 0, 0.5]);
    part(group, kit.sphere(0), kit.solid(0x1d1b3a), [0.12, 0.12, 0.12], [1.1, 0.8, 0.6]);
    part(group, kit.cylinder(6, 1.6), kit.solid(0x90e0ef), [0.18, 0.6, 0.18], [0.5, 1.5, 0]);
    return group;
  },
};

const building: PropDefinition = {
  kind: "building",
  tier: 6,
  zones: ["town"],
  weight: 2.4,
  build({ kit, random }) {
    const group = new THREE.Group();
    const floors = 5 + Math.floor(random() * 4);
    const height = floors * 0.62;
    part(group, kit.box(), kit.solid(pick(random, [0xa8dadc, 0xf1faee, 0xffcad4, 0xcdb4db, 0xffe5b4] as const)), [1.8, height, 1.8], [0, height / 2, 0]);
    const glass = kit.glow(pick(random, [0xfff3b0, 0xcaf0f8] as const));
    for (let floor = 0; floor < floors; floor += 1) {
      part(group, kit.box(), glass, [1.82, 0.22, 1.5], [0, 0.4 + floor * 0.62, 0]);
      part(group, kit.box(), glass, [1.5, 0.22, 1.82], [0, 0.4 + floor * 0.62, 0]);
    }
    part(group, kit.cylinder(4), kit.solid(0xe63946), [0.06, 1.0, 0.06], [0.4, height + 0.5, 0.4]);
    return group;
  },
};

const ferrisWheel: PropDefinition = {
  kind: "ferris-wheel",
  tier: 6,
  zones: ["town", "beach", "candy"],
  build({ kit }) {
    const group = new THREE.Group();
    const steel = kit.solid(0xffffff);
    part(group, kit.cylinder(5), steel, [0.16, 3.2, 0.16], [0, 1.5, -0.6], [0, 0, 0.3]);
    part(group, kit.cylinder(5), steel, [0.16, 3.2, 0.16], [0, 1.5, -0.6], [0, 0, -0.3]);
    const wheel = new THREE.Group();
    wheel.position.set(0, 2.9, 0);
    wheel.userData.spin = { axis: "z", speed: 0.35 };
    part(wheel, kit.torus(0.04), kit.solid(0xff006e), [5, 5, 5], [0, 0, 0]);
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const angle = (spoke / 8) * Math.PI * 2;
      part(wheel, kit.box(), steel, [0.06, 2.5, 0.06], [Math.cos(angle) * 1.25, Math.sin(angle) * 1.25, 0], [0, 0, angle - HALF_PI]);
      part(wheel, kit.box(), kit.solid(TOY_COLORS[spoke % TOY_COLORS.length]), [0.4, 0.4, 0.5], [Math.cos(angle) * 2.5, Math.sin(angle) * 2.5 - 0.25, 0]);
    }
    group.add(wheel);
    return group;
  },
};

const rocket: PropDefinition = {
  kind: "rocket",
  tier: 6,
  zones: "all",
  weight: 0.5,
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(10), kit.solid(0xfdfdfd), [1, 3, 1], [0, 2, 0]);
    part(group, kit.cone(10), kit.solid(0xe63946), [1, 1.2, 1], [0, 4.1, 0]);
    part(group, kit.cylinder(10), kit.glow(0x9bf6ff), [0.4, 0.1, 0.4], [0, 3, 0.48], [HALF_PI, 0, 0]);
    for (let fin = 0; fin < 3; fin += 1) {
      const angle = (fin / 3) * Math.PI * 2;
      part(group, kit.box(), kit.solid(0xe63946), [0.08, 1.0, 0.7], [Math.cos(angle) * 0.6, 0.8, Math.sin(angle) * 0.6], [0, -angle, 0]);
    }
    part(group, kit.cone(8), kit.glow(0xffb703), [0.7, 0.6, 0.7], [0, 0.3, 0], [Math.PI, 0, 0]);
    return group;
  },
};

const cupcake: PropDefinition = {
  kind: "cupcake",
  tier: 3,
  zones: ["candy", "room"],
  weight: 1.6,
  build({ kit, random }) {
    const group = new THREE.Group();
    part(group, kit.cylinder(10, 1.25), kit.solid(pick(random, [0xffb3c6, 0x9bf6ff, 0xfdffb6] as const)), [0.9, 0.7, 0.9], [0, 0.35, 0]);
    const frosting = kit.solid(pick(random, [0xfff1f7, 0xffc8dd, 0xcaffbf] as const));
    part(group, kit.sphere(1), frosting, [1.2, 0.5, 1.2], [0, 0.85, 0]);
    part(group, kit.sphere(1), frosting, [0.8, 0.4, 0.8], [0, 1.15, 0]);
    part(group, kit.sphere(0), kit.solid(0xe63946), [0.26, 0.26, 0.26], [0, 1.42, 0]);
    return group;
  },
};

const candyCane: PropDefinition = {
  kind: "candy-cane",
  tier: 4,
  zones: ["candy", "snow"],
  weight: 1.6,
  build({ kit }) {
    const group = new THREE.Group();
    for (let band = 0; band < 6; band += 1) {
      part(group, kit.cylinder(8), kit.solid(band % 2 === 0 ? 0xffffff : 0xe63946), [0.3, 0.5, 0.3], [0, 0.25 + band * 0.5, 0]);
    }
    part(group, kit.torus(0.3, Math.PI), kit.solid(0xe63946), [0.9, 0.9, 0.9], [0.45, 3.0, 0]);
    return group;
  },
};

const gingerbreadHouse: PropDefinition = {
  kind: "gingerbread-house",
  tier: 5,
  zones: ["candy", "snow"],
  weight: 1.4,
  build({ kit }) {
    const group = new THREE.Group();
    part(group, kit.box(), kit.solid(0xb5651d), [2, 1.3, 1.7], [0, 0.65, 0]);
    part(group, kit.cone(4), kit.solid(0xfff8f0), [2.2, 1.1, 1.9], [0, 1.85, 0], [0, Math.PI / 4, 0]);
    part(group, kit.box(), kit.solid(0xff6fb5), [0.05, 0.7, 0.5], [1.01, 0.35, 0]);
    for (const [y, z] of [[1.0, -0.55], [1.0, 0.55]] as const) {
      part(group, kit.box(), kit.solid(0x9bf6ff), [0.05, 0.36, 0.36], [1.01, y, z]);
    }
    for (let drop = 0; drop < 6; drop += 1) {
      part(group, kit.sphere(0), kit.solid(TOY_COLORS[drop * 2]), [0.18, 0.18, 0.18], [-0.8 + drop * 0.32, 1.32, 0.86]);
    }
    return group;
  },
};

const zabuton: PropDefinition = {
  kind: "zabuton",
  tier: 2,
  zones: ["room"],
  weight: 1.4,
  build({ kit, random }) {
    const group = new THREE.Group();
    const color = pick(random, [0x9d3c72, 0x3d5a80, 0xe07a5f, 0x81b29a] as const);
    part(group, kit.box(), kit.solid(color), [1.1, 0.22, 1.1], [0, 0.11, 0]);
    part(group, kit.sphere(1), kit.solid(color), [1.1, 0.14, 1.1], [0, 0.22, 0]);
    part(group, kit.sphere(0), kit.solid(0xf2cc8f), [0.1, 0.08, 0.1], [0, 0.3, 0]);
    return group;
  },
};

const chabudai: PropDefinition = {
  kind: "low-table",
  tier: 3,
  zones: ["room"],
  weight: 1.4,
  build({ kit }) {
    const group = new THREE.Group();
    const wood = kit.solid(0x8b5a2b);
    part(group, kit.cylinder(18), wood, [2.2, 0.12, 2.2], [0, 0.7, 0]);
    for (const [x, z] of [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]] as const) {
      part(group, kit.box(), kit.solid(0x6b4226), [0.14, 0.66, 0.14], [x, 0.33, z]);
    }
    part(group, kit.cylinder(10), kit.solid(0xffffff), [0.3, 0.3, 0.3], [0.3, 0.9, 0.2]);
    part(group, kit.cylinder(10), kit.solid(0x6f3b1f), [0.24, 0.02, 0.24], [0.3, 1.05, 0.2]);
    part(group, kit.sphere(1), kit.solid(0xff9f1c), [0.28, 0.28, 0.28], [-0.4, 0.9, -0.3]);
    return group;
  },
};

const television: PropDefinition = {
  kind: "television",
  tier: 3,
  zones: ["room"],
  build({ kit, random }) {
    const group = new THREE.Group();
    const case_ = kit.solid(pick(random, [0x9a8c98, 0x4a4e69, 0xc9ada7] as const));
    part(group, kit.box(), case_, [1.3, 1.0, 1.0], [0, 0.6, 0]);
    part(group, kit.box(), kit.glow(pick(random, [0x7ae582, 0x9bf6ff, 0xffc6ff] as const)), [0.04, 0.72, 0.78], [0.66, 0.62, -0.05]);
    part(group, kit.cylinder(6), kit.solid(0x22223b), [0.12, 0.12, 0.12], [0.66, 0.3, 0.38], [0, 0, Math.PI / 2]);
    part(group, kit.cylinder(4), kit.solid(0xbfc7d5), [0.03, 0.7, 0.03], [0, 1.4, -0.2], [0.5, 0, 0]);
    part(group, kit.cylinder(4), kit.solid(0xbfc7d5), [0.03, 0.7, 0.03], [0, 1.4, 0.2], [-0.5, 0, 0]);
    part(group, kit.box(), kit.solid(0x6b4226), [1.1, 0.1, 0.9], [0, 0.05, 0]);
    return group;
  },
};

const kotatsu: PropDefinition = {
  kind: "kotatsu",
  tier: 4,
  zones: ["room"],
  weight: 1.2,
  build({ kit, random }) {
    const group = new THREE.Group();
    const quilt = kit.solid(pick(random, [0xd62828, 0x4361ee, 0xf77f00] as const));
    part(group, kit.box(), quilt, [2.4, 0.7, 2.4], [0, 0.35, 0]);
    part(group, kit.sphere(1), quilt, [2.6, 0.3, 2.6], [0, 0.55, 0]);
    part(group, kit.box(), kit.solid(0xa0522d), [2.1, 0.12, 2.1], [0, 0.8, 0]);
    for (let index = 0; index < 5; index += 1) {
      part(group, kit.sphere(1), kit.solid(0xff9f1c), [0.26, 0.26, 0.26], [Math.cos(index) * 0.3, 0.98, Math.sin(index) * 0.3]);
    }
    return group;
  },
};

const shoji: PropDefinition = {
  kind: "shoji-screen",
  tier: 4,
  zones: ["room"],
  build({ kit }) {
    const group = new THREE.Group();
    const frame = kit.solid(0x7a4e2d);
    part(group, kit.box(), kit.solid(0xfdf8ec), [0.08, 2.4, 1.4], [0, 1.2, 0]);
    for (let row = 0; row <= 4; row += 1) {
      part(group, kit.box(), frame, [0.1, 0.05, 1.42], [0, 0.05 + row * 0.59, 0]);
    }
    for (let column = 0; column <= 3; column += 1) {
      part(group, kit.box(), frame, [0.1, 2.4, 0.05], [0, 1.2, -0.7 + column * 0.467]);
    }
    return group;
  },
};

const hibiscus: PropDefinition = {
  kind: "hibiscus",
  tier: 2,
  zones: ["garden", "beach"],
  weight: 1.8,
  build({ kit, random }) {
    const group = new THREE.Group();
    const leaf = kit.solid(0x3f9a3a);
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      part(group, kit.sphere(1), leaf, [0.7, 0.1, 0.32], [Math.cos(angle) * 0.4, 0.25 + index * 0.06, Math.sin(angle) * 0.4], [0, -angle, 0.3]);
    }
    const petal = kit.solid(pick(random, [0xf48fb1, 0xef6f8f, 0xf7a6c4] as const));
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      part(group, kit.sphere(1), petal, [0.55, 0.12, 0.42], [Math.cos(angle) * 0.34, 0.95, Math.sin(angle) * 0.34], [0, -angle, -0.35]);
    }
    part(group, kit.cylinder(6), kit.solid(0xf2c230), [0.07, 0.5, 0.07], [0.05, 1.15, 0], [0, 0, -0.5]);
    part(group, kit.sphere(0), kit.solid(0xe8a317), [0.14, 0.14, 0.14], [0.18, 1.38, 0]);
    return group;
  },
};

export const PROP_CATALOG: readonly PropDefinition[] = [
  thumbtack, coin, button, candy, die, battery, eraser, mahjong, sushi,
  strawberry, seashell, starfish, pencil, rubberDuck, fruit, mug, cakeSlice,
  alarmClock, giftBox, lollipop, mushroom, crab, book, teapot, toyRobot,
  pottedFlower, trafficCone, beachBall, cat, penguin, sunflower, dog, person,
  mailbox, bench, bicycle, umbrella, snowman, vendingMachine, car, cow, tree,
  pineTree, palmTree, house, bus, windmill, lighthouse, pagoda, hotAirBalloon,
  whale, building, ferrisWheel, rocket, cupcake, candyCane, gingerbreadHouse, zabuton, chabudai, television, kotatsu,
  shoji, hibiscus,
];

const MAX_TIER = Math.max(...PROP_CATALOG.map((definition) => definition.tier));

/** Filtered once per zone and tier; callers share the result and only read it. */
const propsByZone = new Map<Zone, Map<number, readonly PropDefinition[]>>();

export function propsFor(zone: Zone, tier: number): readonly PropDefinition[] {
  const clamped = Math.min(Math.max(tier, 0), MAX_TIER);
  let byTier = propsByZone.get(zone);
  if (!byTier) {
    byTier = new Map();
    propsByZone.set(zone, byTier);
  }
  let definitions = byTier.get(clamped);
  if (!definitions) {
    definitions = PROP_CATALOG.filter(
      (definition) =>
        definition.tier === clamped &&
        (definition.zones === "all" || definition.zones.includes(zone)),
    );
    byTier.set(clamped, definitions);
  }
  return definitions;
}

export function pickWeighted(
  random: () => number,
  definitions: readonly PropDefinition[],
): PropDefinition | null {
  let total = 0;
  for (const definition of definitions) total += definition.weight ?? 1;
  if (total === 0) return null;
  let cursor = random() * total;
  for (const definition of definitions) {
    cursor -= definition.weight ?? 1;
    if (cursor <= 0) return definition;
  }
  return definitions.at(-1) ?? null;
}

/**
 * Bake a prop's static parts into one vertex-colored mesh so each prop is a
 * single draw call. Parts tagged with `userData.spin` stay live objects.
 */
export function bake(model: THREE.Group, kit: MaterialKit): THREE.Group {
  model.updateMatrixWorld(true);
  const spinners: THREE.Object3D[] = [];
  model.traverse((child) => {
    if (child !== model && child.userData.spin) spinners.push(child);
  });
  const inverseRoot = model.matrixWorld.clone().invert();
  const pieces: THREE.BufferGeometry[] = [];
  const color = new THREE.Color();
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    let ancestor: THREE.Object3D | null = child;
    while (ancestor && ancestor !== model) {
      if (spinners.includes(ancestor)) return;
      ancestor = ancestor.parent;
    }
    const source = child.geometry as THREE.BufferGeometry;
    const piece = (source.index ? source.toNonIndexed() : source.clone());
    piece.deleteAttribute("uv");
    piece.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverseRoot, child.matrixWorld));
    color.copy((child.material as THREE.Material & { color: THREE.Color }).color);
    const count = piece.getAttribute("position").count;
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) color.toArray(colors, index * 3);
    piece.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    pieces.push(piece);
  });
  const baked = new THREE.Group();
  const merged = pieces.length > 0 ? mergeGeometries(pieces) : null;
  for (const piece of pieces) piece.dispose();
  if (merged) {
    const mesh = new THREE.Mesh(merged, kit.vertexColored());
    mesh.userData.ownedGeometry = true;
    baked.add(mesh);
  }
  for (const spinner of spinners) baked.attach(spinner);
  return baked;
}

/** Color variants baked per prop kind; each is built once and cloned after. */
const VARIANTS = 3;

/**
 * A prop scaled to a unit bounding radius, standing on y = 0 and centered on
 * the origin, wrapped so the caller can scale it to size. Baked models are
 * cached per kind and variant, so spawning a prop is just a clone.
 */
export function buildProp(
  definition: PropDefinition,
  context: BuildContext,
): THREE.Group {
  const variant = Math.floor(context.random() * VARIANTS);
  const template = context.kit.template(`${definition.kind}:${variant}`, () => {
    const random = mulberry32(hashString(definition.kind) + variant * 7919);
    const model = bake(definition.build({ kit: context.kit, random }), context.kit);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const halfExtent = Math.max(size.x, size.y, size.z) / 2 || 1;
    model.position.set(-center.x, -bounds.min.y, -center.z);
    const normalizer = new THREE.Group();
    normalizer.scale.setScalar(1 / halfExtent);
    normalizer.add(model);
    const wrapper = new THREE.Group();
    wrapper.add(normalizer);
    return wrapper;
  });
  return template.clone(true);
}

/** Readable name for the pickup callout: "rubber-duck" becomes "Rubber duck". */
export function propName(definition: PropDefinition): string {
  const words = definition.kind.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
