import * as THREE from "three";

import { BASE_RADIUS, hashString, mulberry32 } from "../katamari-math";
import type { MaterialKit } from "./materials";
import { buildProp, pickWeighted, type PropDefinition, type PropMotion, propsFor } from "./props";
import { angleOf, PICKUP_RATIO, smoothing, wrapAngle } from "./world-math";
import { zoneAt } from "./zones";

const CHUNK_RADII = 26;
const PROPS_PER_CHUNK = 5;
/** Milliseconds per frame spent spawning props, so a new scale level never stalls a frame. */
const SPAWN_BUDGET_MS = 4;

export interface WorldProp {
  id: string;
  object: THREE.Group;
  definition: PropDefinition;
  size: number;
  x: number;
  z: number;
  lift: number;
  heading: number;
  motion: PropMotion | null;
  vx: number;
  vz: number;
  vy: number;
  hop: number;
  wanderIn: number;
  phase: number;
  chunk: string | null;
  spinners: THREE.Object3D[];
}

interface SpawnSpec {
  id: string;
  chunk: string;
  definition: PropDefinition;
  x: number;
  z: number;
  size: number;
}

/** Where the on-stage katamari sits, for props that flee it or catch its eye. */
interface Ball {
  x: number;
  z: number;
  radius: number;
}

/**
 * The loose props on the ground: seeded chunks streamed in around the camera
 * at the current scale and its neighbors, plus everything sprinkled, shed, or
 * knocked off along the way.
 */
export class PropField {
  private readonly items = new Map<string, WorldProp>();
  private readonly chunks = new Set<string>();
  private readonly takenPropIds = new Set<string>();
  private spawnQueue: SpawnSpec[] = [];
  /** The level, then each neighbor level's cell under the focus, as of the last chunk pass. */
  private readonly lastCells = [Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN];

  constructor(
    private readonly scene: THREE.Scene,
    private readonly kit: MaterialKit,
    private readonly seed: number,
    private readonly random: () => number,
  ) {}

  get props(): ReadonlyMap<string, WorldProp> {
    return this.items;
  }

  /** Keep chunks of the current scale and its neighbors populated around the camera. */
  refresh(level: number, focus: THREE.Vector3, cameraRadius: number): void {
    // The needed chunks only change when the level or a cell under the focus does.
    if (this.cellsChanged(level, focus)) {
      const needed = new Set<string>();
      for (const chunkLevel of [level - 1, level, level + 1]) {
        if (chunkLevel < 0) continue;
        const size = this.chunkSize(chunkLevel);
        const span = chunkLevel === level ? 2 : 1;
        const centerX = Math.floor(focus.x / size);
        const centerZ = Math.floor(focus.z / size);
        for (let offsetX = -span; offsetX <= span; offsetX += 1) {
          for (let offsetZ = -span; offsetZ <= span; offsetZ += 1) {
            needed.add(`${chunkLevel}:${centerX + offsetX}:${centerZ + offsetZ}`);
          }
        }
      }
      for (const key of needed) {
        if (!this.chunks.has(key)) this.populateChunk(key, level);
      }
      for (const key of this.chunks) {
        if (!needed.has(key)) this.chunks.delete(key);
      }
    }
    if (this.spawnQueue.length > 0) {
      const deadline = performance.now() + SPAWN_BUDGET_MS;
      while (this.spawnQueue.length > 0 && performance.now() < deadline) {
        const spec = this.spawnQueue.shift();
        if (!spec || !this.chunks.has(spec.chunk) || this.takenPropIds.has(spec.id)) continue;
        this.add(spec.definition, spec.x, spec.z, spec.size, spec.chunk, spec.id);
      }
    }
    // `chunks` now holds exactly the needed keys.
    for (const prop of this.items.values()) {
      if (prop.chunk !== null && !this.chunks.has(prop.chunk)) this.remove(prop);
      else if (prop.size < cameraRadius * 0.035) this.remove(prop);
      else if (
        prop.chunk === null &&
        Math.hypot(prop.x - focus.x, prop.z - focus.z) > cameraRadius * 60
      ) {
        this.remove(prop);
      }
    }
  }

  add(
    definition: PropDefinition,
    x: number,
    z: number,
    size: number,
    chunk: string | null,
    id: string,
    existing?: THREE.Group,
  ): WorldProp {
    const object = existing ?? buildProp(definition, { kit: this.kit, random: this.random });
    object.quaternion.identity();
    object.scale.setScalar(size);
    const spinners: THREE.Object3D[] = [];
    object.traverse((child) => {
      if (child.userData.spin) spinners.push(child);
    });
    const prop: WorldProp = {
      id,
      object,
      definition,
      size,
      x,
      z,
      lift: definition.motion === "fly" ? size * 1.4 : 0,
      heading: this.random() * Math.PI * 2,
      motion: definition.motion ?? null,
      vx: 0,
      vz: 0,
      vy: 0,
      hop: 0,
      wanderIn: this.random() * 3,
      phase: this.random() * Math.PI * 2,
      chunk,
      spinners,
    };
    this.scene.add(object);
    this.items.set(id, prop);
    return prop;
  }

  remove(prop: WorldProp): void {
    this.scene.remove(prop.object);
    this.items.delete(prop.id);
  }

  /** Remove a prop that was rolled up, so its chunk never grows it back. */
  take(prop: WorldProp): void {
    this.remove(prop);
    this.takenPropIds.add(prop.id);
    if (this.takenPropIds.size > 6000) {
      const first = this.takenPropIds.values().next().value;
      if (first !== undefined) this.takenPropIds.delete(first);
    }
  }

  clear(): void {
    this.items.clear();
  }

  /** Walk, drive, hop, and bob every prop; small ones flee a `chaser` big enough to take them. */
  update(deltaSeconds: number, chaser: Ball | null): void {
    const friction = 1 - smoothing(3, deltaSeconds);
    for (const prop of this.items.values()) {
      let speed = 0;
      if (prop.motion === "walk" || prop.motion === "drive") {
        prop.wanderIn -= deltaSeconds;
        if (prop.wanderIn <= 0) {
          prop.wanderIn = 1.5 + this.random() * 4;
          prop.heading += (this.random() - 0.5) * (prop.motion === "drive" ? 0.8 : 2.4);
        }
        speed = prop.size * (prop.motion === "drive" ? 1.4 : 0.55);
        // Small things run from a katamari big enough to take them.
        if (chaser && prop.size <= chaser.radius * PICKUP_RATIO) {
          const awayX = prop.x - chaser.x;
          const awayZ = prop.z - chaser.z;
          const distance = Math.hypot(awayX, awayZ);
          if (distance < chaser.radius * 4) {
            prop.heading += wrapAngle(angleOf(awayX, awayZ) - prop.heading) * smoothing(5, deltaSeconds);
            speed *= 2.2;
          }
        }
        prop.x += Math.cos(prop.heading) * speed * deltaSeconds;
        prop.z += Math.sin(prop.heading) * speed * deltaSeconds;
      }
      prop.x += prop.vx * deltaSeconds;
      prop.z += prop.vz * deltaSeconds;
      prop.vx *= friction;
      prop.vz *= friction;
      if (prop.hop > 0 || prop.vy > 0) {
        prop.vy -= prop.size * 18 * deltaSeconds;
        prop.hop = Math.max(0, prop.hop + prop.vy * deltaSeconds);
        if (prop.hop === 0) prop.vy = 0;
      }
      prop.phase += deltaSeconds * (speed > 0 ? 10 : 2);
      let bob = 0;
      if (prop.motion === "walk" && speed > 0) bob = Math.abs(Math.sin(prop.phase)) * prop.size * 0.12;
      if (prop.motion === "fly") bob = Math.sin(prop.phase * 0.4) * prop.size * 0.3;
      if (prop.motion === "bob") bob = Math.max(0, Math.sin(prop.phase)) * prop.size * 0.08;
      prop.object.position.set(prop.x, prop.lift + prop.hop + bob, prop.z);
      prop.object.rotation.set(
        prop.hop > 0 ? prop.hop / prop.size : 0,
        -prop.heading,
        0,
      );
      for (const spinner of prop.spinners) {
        const spin = spinner.userData.spin as { axis: "x" | "y" | "z"; speed: number };
        spinner.rotation[spin.axis] += spin.speed * deltaSeconds;
      }
    }
  }

  /** The closest thing a hungry ball could roll up, favoring what lies ahead of it. */
  nearestPickup(ball: Ball & { heading: number }): WorldProp | null {
    let best: WorldProp | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const prop of this.items.values()) {
      if (prop.size > ball.radius * PICKUP_RATIO || prop.size < ball.radius * 0.06) continue;
      const distance = Math.hypot(prop.x - ball.x, prop.z - ball.z);
      if (distance > ball.radius * 14) continue;
      const bearing = Math.abs(wrapAngle(angleOf(prop.x - ball.x, prop.z - ball.z) - ball.heading));
      const score = distance * (1 + bearing);
      if (score < bestScore) {
        bestScore = score;
        best = prop;
      }
    }
    return best;
  }

  /** True when the level or any neighbor level's cell under the focus moved; records the new ones. */
  private cellsChanged(level: number, focus: THREE.Vector3): boolean {
    const cells = this.lastCells;
    let changed = cells[0] !== level;
    cells[0] = level;
    for (let offset = -1; offset <= 1; offset += 1) {
      const size = this.chunkSize(level + offset);
      const cellX = Math.floor(focus.x / size);
      const cellZ = Math.floor(focus.z / size);
      const index = 3 + offset * 2;
      if (cells[index] !== cellX || cells[index + 1] !== cellZ) changed = true;
      cells[index] = cellX;
      cells[index + 1] = cellZ;
    }
    return changed;
  }

  private chunkSize(level: number): number {
    return BASE_RADIUS * 2 ** level * CHUNK_RADII;
  }

  private populateChunk(key: string, groundLevel: number): void {
    this.chunks.add(key);
    const [levelText, chunkXText, chunkZText] = key.split(":");
    const level = Number(levelText);
    const chunkX = Number(chunkXText);
    const chunkZ = Number(chunkZText);
    const chunkSize = this.chunkSize(level);
    const random = mulberry32(hashString(`${this.seed}:${key}`));
    for (let index = 0; index < PROPS_PER_CHUNK; index += 1) {
      const id = `${key}:${index}`;
      const x = (chunkX + random()) * chunkSize;
      const z = (chunkZ + random()) * chunkSize;
      const tierRoll = random();
      const tier = level + (tierRoll < 0.3 ? -1 : tierRoll < 0.78 ? 0 : tierRoll < 0.94 ? 1 : 2);
      const zone = zoneAt(x, z, groundLevel, this.seed).zone;
      const definition =
        pickWeighted(random, propsFor(zone, tier)) ??
        pickWeighted(random, propsFor(zone, tier - 1)) ??
        pickWeighted(random, propsFor(zone, tier + 1));
      const scale = random();
      if (!definition || this.takenPropIds.has(id)) continue;
      const size = BASE_RADIUS * 2 ** Math.max(0, tier) * (0.42 + scale * 0.5);
      this.spawnQueue.push({ id, chunk: key, definition, x, z, size });
    }
  }
}
