import * as THREE from "three";

import { type MaterialKit, TOY_COLORS } from "./materials";
import { bake } from "./props";

/**
 * A katamari core wears its thread's compaction history. Every compaction
 * earns an orbiting star, and the core itself ranks up: pearl with round
 * nubs, then candy colors, spiky stars, crystals, and finally a rainbow.
 */
interface CoreTier {
  core: number;
  /** The bullseye's center piece. */
  nub: "round" | "spike" | "crystal";
  rainbow: boolean;
}

const CORE_TIERS: readonly CoreTier[] = [
  { core: 0xf7f5ea, nub: "round", rainbow: false },
  { core: 0xffe7ef, nub: "round", rainbow: false },
  { core: 0xfff3b8, nub: "spike", rainbow: false },
  { core: 0xdff5e6, nub: "spike", rainbow: false },
  { core: 0xdcecff, nub: "crystal", rainbow: false },
  { core: 0xebe0ff, nub: "crystal", rainbow: false },
  { core: 0xfff8e6, nub: "crystal", rainbow: true },
];

/** Ring colors for the painted bullseye nubs: outer, middle, center. */
const BULLSEYES: readonly (readonly [number, number, number])[] = [
  [0xe8453c, 0xfaf6ec, 0xf7c93e],
  [0x3fae4a, 0xfaf6ec, 0xe8453c],
  [0x3a7fd6, 0xf7c93e, 0xe8453c],
  [0xf08a24, 0xfaf6ec, 0x3fae4a],
  [0xf7c93e, 0xe8453c, 0x3a7fd6],
];

export function coreTier(compactions: number): CoreTier {
  return CORE_TIERS[Math.min(Math.max(0, compactions), CORE_TIERS.length - 1)];
}

/** Stars shown individually; past this a golden halo stands in for the rest. */
export const MAX_MOONS = 8;
const MOON_COLORS = [0xfff275, 0xff8fab, 0x9bf6ff, 0xb9fbc0, 0xffc6ff, 0xffd6a5, 0xa0c4ff, 0xfdffb6];

function unitDirections(): THREE.Vector3[] {
  const positions = new THREE.IcosahedronGeometry(0.5, 0).getAttribute("position");
  const seen = new Set<string>();
  const directions: THREE.Vector3[] = [];
  for (let index = 0; index < positions.count; index += 1) {
    const direction = new THREE.Vector3().fromBufferAttribute(positions, index).normalize();
    const key = direction.toArray().map((value) => value.toFixed(2)).join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    directions.push(direction);
  }
  return directions;
}

const NUB_DIRECTIONS = unitDirections();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Fill a core group (unit diameter) for a compaction count, replacing its
 * contents: the game's pale core studded with nubs painted as bullseyes.
 */
export function dressCore(
  core: THREE.Group,
  kit: MaterialKit,
  nubColor: number,
  compactions: number,
): void {
  core.clear();
  const tier = coreTier(compactions);
  // Baked into one mesh, so a ball costs one draw for its core instead of dozens.
  const look = kit.template(`core:${nubColor}:${CORE_TIERS.indexOf(tier)}`, () => {
    const model = new THREE.Group();
    model.add(new THREE.Mesh(kit.sphere(2), kit.solid(tier.core)));
    const offset = TOY_COLORS.indexOf(nubColor as (typeof TOY_COLORS)[number]);
    NUB_DIRECTIONS.forEach((direction, index) => {
      const rings = tier.rainbow
        ? ([TOY_COLORS[index % TOY_COLORS.length], 0xfaf6ec, TOY_COLORS[(index + 5) % TOY_COLORS.length]] as const)
        : BULLSEYES[(index + Math.max(0, offset)) % BULLSEYES.length];
      const nub = new THREE.Group();
      nub.position.copy(direction).multiplyScalar(0.47);
      nub.quaternion.setFromUnitVectors(UP, direction);
      // Stacked domes read as painted rings from any angle.
      const dome = (color: number, width: number, height: number, lift: number) => {
        const mesh = new THREE.Mesh(kit.sphere(2), kit.solid(color));
        mesh.scale.set(width, height, width);
        mesh.position.y = lift;
        nub.add(mesh);
      };
      dome(rings[0], 0.3, 0.12, 0.02);
      dome(rings[1], 0.21, 0.12, 0.035);
      if (tier.nub === "round") {
        dome(rings[2], 0.11, 0.1, 0.06);
      } else {
        const geometry =
          tier.nub === "spike"
            ? kit.cone(6)
            : kit.geometry("octahedron", () => new THREE.OctahedronGeometry(0.5, 0));
        const center = new THREE.Mesh(geometry, kit.solid(rings[2]));
        center.scale.set(0.11, tier.nub === "spike" ? 0.18 : 0.2, 0.11);
        center.position.y = 0.1;
        nub.add(center);
      }
      model.add(nub);
    });
    return bake(model, kit);
  });
  core.add(look.clone(true));
}

interface Moon {
  mesh: THREE.Group;
  tilt: THREE.Quaternion;
  phase: number;
  speed: number;
  /** 0 while flying out of the burst, 1 once settled in orbit. */
  arrival: number;
}

/** One orbiting star per compaction, with a halo once there are too many to count. */
export class CompactionMoons {
  readonly group = new THREE.Group();
  private readonly moons: Moon[] = [];
  private readonly halo: THREE.Mesh;
  private count = 0;

  constructor(private readonly kit: MaterialKit) {
    this.halo = new THREE.Mesh(kit.torus(0.05), kit.glow(0xffd23f));
    this.halo.visible = false;
    this.group.add(this.halo);
  }

  get total(): number {
    return this.count;
  }

  setCount(count: number, animate: boolean): void {
    this.count = count;
    const shown = Math.min(count, MAX_MOONS);
    while (this.moons.length > shown) {
      const moon = this.moons.pop();
      if (moon) this.group.remove(moon.mesh);
    }
    while (this.moons.length < shown) {
      const index = this.moons.length;
      const star = new THREE.Group();
      const material = this.kit.glow(MOON_COLORS[index % MOON_COLORS.length]);
      const octahedron = this.kit.geometry("octahedron", () => new THREE.OctahedronGeometry(0.5, 0));
      const point = new THREE.Mesh(octahedron, material);
      point.scale.set(1, 1.6, 1);
      const cross = new THREE.Mesh(octahedron, material);
      cross.scale.set(1.6, 1, 1);
      star.add(point, cross);
      this.group.add(star);
      this.moons.push({
        mesh: star,
        tilt: new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0.35 + (index % 3) * 0.3, index * 0.9, (index % 2 === 0 ? 1 : -1) * 0.25),
        ),
        phase: (index / Math.max(1, shown)) * Math.PI * 2,
        speed: 1.1 + (index % 3) * 0.25,
        arrival: animate ? 0 : 1,
      });
    }
    this.halo.visible = count > MAX_MOONS;
  }

  update(deltaSeconds: number, radius: number, time: number): void {
    const orbit = radius * 1.45;
    // Big and bright enough to count at a glance: these stars are the thread's compaction history.
    const size = radius * 0.24;
    for (const moon of this.moons) {
      moon.arrival = Math.min(1, moon.arrival + deltaSeconds * 1.4);
      const ease = 1 - (1 - moon.arrival) ** 3;
      moon.phase += moon.speed * deltaSeconds;
      moon.mesh.position
        .set(Math.cos(moon.phase) * orbit * ease, Math.sin(time * 2 + moon.phase) * radius * 0.08, Math.sin(moon.phase) * orbit * ease)
        .applyQuaternion(moon.tilt);
      moon.mesh.scale.setScalar(size * (0.4 + ease * 0.6) * (1 + Math.sin(time * 6 + moon.phase) * 0.12));
      moon.mesh.rotation.y += deltaSeconds * 3;
    }
    this.halo.scale.setScalar(radius * 2.9);
    this.halo.rotation.set(Math.PI / 2 + 0.3, 0, time * 0.4);
  }
}
