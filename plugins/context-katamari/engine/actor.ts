import * as THREE from "three";

import { fillForRadius, hashString, mulberry32, radiusForFill, scaleLevel } from "../katamari-math";
import { CompactionMoons, dressCore } from "./core";
import { buildCousin, type CousinRig } from "./cousin";
import { type MaterialKit, pick, TOY_COLORS } from "./materials";
import type { WorldProp } from "./prop-field";
import { buildProp, pickWeighted, type PropDefinition, propsFor } from "./props";
import { PICKUP_RATIO, randomDirection } from "./world-math";

const MAX_STUCK = 140;

export interface StuckItem {
  object: THREE.Object3D;
  definition: PropDefinition;
  size: number;
  depth: number;
}

export type ActorPhase = "enter" | "stage" | "exit";

export interface PopState {
  time: number;
  fromRadius: number;
  compactions: number;
  burst: boolean;
  startScale: number;
}

export interface GulpState {
  time: number;
  /** 0..1: a nibble up to a heavy, screen-shaking swallow. */
  strength: number;
  chomps: number;
}

/** One thread's cousin and katamari. */
export interface Actor {
  threadId: string;
  rig: CousinRig;
  ball: THREE.Group;
  roll: THREE.Group;
  core: THREE.Group;
  nubColor: number;
  moons: CompactionMoons;
  compactions: number;
  /** False while the thread's real count is unknown and the core shows a guess. */
  compactionsKnown: boolean;
  /** The announced compaction this cousin has already shown; only a newer one pops. */
  compactedSeq: number | null;
  synced: boolean;
  pop: PopState | null;
  gulp: GulpState | null;
  /** Distance rolled since the last coin fell, in radii. */
  coinDistance: number;
  coinsAnnounced: boolean;
  ballShadow: THREE.Mesh;
  cousinShadow: THREE.Mesh;
  x: number;
  z: number;
  heading: number;
  speed: number;
  vx: number;
  vz: number;
  radius: number;
  targetRadius: number;
  stuck: StuckItem[];
  phase: ActorPhase;
  phaseTime: number;
  exitDirection: THREE.Vector2;
  stride: number;
  idleSeconds: number;
  turnRate: number;
  decisionIn: number;
  behavior: "cruise" | "swerve" | "loop" | "seek";
  behaviorSign: number;
  seekTarget: WorldProp | null;
  hungrySeconds: number;
  lastBonk: number;
  random: () => number;
}

const UP = new THREE.Vector3(0, 1, 0);
const lean = new THREE.Euler();
const leanTurn = new THREE.Quaternion();
const prefillDirection = new THREE.Vector3();

export function createActor(
  kit: MaterialKit,
  threadId: string,
  fill: number,
  knownCompactions: number | null,
  ready: boolean,
): Actor {
  const compactions = knownCompactions ?? 0;
  const seed = hashString(threadId);
  const random = mulberry32(seed);
  const rig = buildCousin(kit, seed);
  const ball = new THREE.Group();
  const roll = new THREE.Group();
  ball.add(roll);
  const core = new THREE.Group();
  const nubColor = pick(random, TOY_COLORS);
  dressCore(core, kit, nubColor, compactions);
  roll.add(core);
  const moons = new CompactionMoons(kit);
  moons.setCount(compactions, false);
  ball.add(moons.group);
  const ballShadow = new THREE.Mesh(kit.shadowDisc(), kit.shadow());
  const cousinShadow = new THREE.Mesh(kit.shadowDisc(), kit.shadow());
  ballShadow.renderOrder = -1;
  cousinShadow.renderOrder = -1;
  const radius = radiusForFill(fill);
  const actor: Actor = {
    threadId,
    rig,
    ball,
    roll,
    core,
    nubColor,
    moons,
    compactions,
    compactionsKnown: ready && knownCompactions !== null,
    compactedSeq: null,
    synced: ready,
    pop: null,
    gulp: null,
    coinDistance: 0,
    coinsAnnounced: false,
    ballShadow,
    cousinShadow,
    x: 0,
    z: 0,
    heading: random() * Math.PI * 2,
    speed: 0,
    vx: 0,
    vz: 0,
    radius,
    targetRadius: radius,
    stuck: [],
    phase: "stage",
    phaseTime: 0,
    exitDirection: new THREE.Vector2(1, 0),
    stride: 0,
    idleSeconds: 0,
    turnRate: 0,
    decisionIn: 1,
    behavior: "cruise",
    behaviorSign: 1,
    seekTarget: null,
    hungrySeconds: 0,
    lastBonk: 0,
    random,
  };
  prefill(kit, actor);
  return actor;
}

/** A thread that already holds context shows up with a ball to match. */
export function prefill(kit: MaterialKit, actor: Actor): void {
  const level = scaleLevel(actor.radius);
  // The PS2 katamari is packed with junk; only the start shows much bare core.
  const count = 16 + Math.round(fillForRadius(actor.radius) * 90);
  for (let index = 0; index < count; index += 1) {
    const tier = Math.max(0, level - (actor.random() < 0.6 ? 0 : 1));
    const zone = pick(actor.random, ["room", "garden", "town", "beach", "candy"] as const);
    const definition = pickWeighted(actor.random, propsFor(zone, tier));
    if (!definition) continue;
    const size = actor.radius * (0.14 + actor.random() * 0.26);
    attach(kit, actor, definition, size, randomDirection(actor.random, prefillDirection), actor.radius * 0.84);
  }
}

/** Stick a prop onto the ball along `direction`, in the ball's rolling frame. */
export function attach(
  kit: MaterialKit,
  actor: Actor,
  definition: PropDefinition,
  size: number,
  direction: THREE.Vector3,
  depth: number,
  existing?: THREE.Group,
): void {
  const object =
    existing ?? buildProp(definition, { kit, random: actor.random });
  object.scale.setScalar(size);
  object.position.copy(direction).multiplyScalar(depth - size * 0.4);
  // Stick base-first with a random lean, the way junk jams into a katamari.
  object.quaternion
    .setFromUnitVectors(UP, direction)
    .multiply(
      leanTurn.setFromEuler(
        lean.set(
          (actor.random() - 0.5) * 1.8,
          actor.random() * Math.PI * 2,
          (actor.random() - 0.5) * 1.8,
        ),
      ),
    );
  actor.roll.add(object);
  actor.stuck.push({ object, definition, size, depth });
  if (actor.stuck.length > MAX_STUCK) {
    const buried = actor.stuck.shift();
    if (buried) {
      actor.roll.remove(buried.object);
    }
  }
}

/** Drop the items the growing core has swallowed, keeping the rest in order. */
export function pruneBuried(actor: Actor): void {
  const coreRadius = actor.radius * 0.84;
  const stuck = actor.stuck;
  let kept = 0;
  for (let index = 0; index < stuck.length; index += 1) {
    const item = stuck[index];
    if (item.depth + item.size * 0.9 < coreRadius) actor.roll.remove(item.object);
    else stuck[kept++] = item;
  }
  stuck.length = kept;
}

/**
 * Split a shrinking ball's items: the oldest ones small enough for the new
 * size stay stuck, and everything else comes off.
 */
export function sortForShrink(actor: Actor, fromRadius: number, toRadius: number): StuckItem[] {
  const fits = actor.stuck.filter((item) => item.size <= toRadius * PICKUP_RATIO);
  const keepCount = Math.max(4, Math.round(actor.stuck.length * (toRadius / fromRadius) ** 2));
  const kept = new Set(fits.slice(0, keepCount));
  const leaving = actor.stuck.filter((item) => !kept.has(item));
  actor.stuck = actor.stuck.filter((item) => kept.has(item));
  return leaving;
}

export function setCompactions(kit: MaterialKit, actor: Actor, compactions: number, animate: boolean): void {
  if (compactions === actor.compactions && actor.moons.total === compactions) return;
  actor.compactions = compactions;
  dressCore(actor.core, kit, actor.nubColor, compactions);
  actor.moons.setCount(compactions, animate);
}

/** Show a count read from bb without a pop; an unknown count leaves the core as it is. */
export function showKnownCompactions(kit: MaterialKit, actor: Actor, compactions: number | null): void {
  if (compactions === null) return;
  actor.compactionsKnown = true;
  setCompactions(kit, actor, compactions, false);
}
