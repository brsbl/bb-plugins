import * as THREE from "three";

import {
  BASE_RADIUS,
  clampFill,
  fillForRadius,
  hashString,
  mulberry32,
  radiusForFill,
  scaleLevel,
} from "../katamari-math";
import { type Drive, IDLE_DRIVE, isIdle } from "../controls";
import type { KatamariAudio } from "../sound";
import { compactionChange, type StageMode } from "../stage";
import { CompactionMoons, dressCore } from "./core";
import { buildCousin, type CousinRig, MAX_DIZZY_STARS, poseCousin } from "./cousin";
import { Environment } from "./environment";
import { MaterialKit, pick, TOY_COLORS } from "./materials";
import {
  buildProp,
  pickWeighted,
  type PropDefinition,
  type PropMotion,
  propName,
  propsFor,
} from "./props";
import { type Zone, zoneAt } from "./zones";

/** A prop sticks only when it is at most this fraction of the ball's radius. */
const PICKUP_RATIO = 0.5;
/** Props at least this big stop the ball instead of getting knocked aside. */
const OBSTACLE_RATIO = 0.95;
const CHUNK_RADII = 26;
const PROPS_PER_CHUNK = 5;
const MAX_STUCK = 140;
/** Milliseconds per frame spent spawning props, so a new scale level never stalls a frame. */
const SPAWN_BUDGET_MS = 4;
const ACTOR_CACHE_LIMIT = 8;
const HUD_INTERVAL_SECONDS = 0.1;
/** Frame budgets: full speed while anything moves, half when the scene is idle. */
const ACTIVE_FRAME_MS = 1000 / 60;
const CALM_FRAME_MS = 1000 / 30;
/** After the player lets go, the cousin keeps still this long before wandering again. */
const MANUAL_HOLD_SECONDS = 4;
/** Top rolling speed and turn rate under the player's hands, in radii and radians per second. */
const MAX_PUSH_SPEED = 5.5;
const TURN_RATE = 2.8;
/** How long a new thread waits for its context before rolling in anyway. */
const READY_TIMEOUT_SECONDS = 2;
const POP_INFLATE_SECONDS = 0.35;
const POP_SHRINK_SECONDS = 1.1;
/** Seconds per chomp when the katamari swallows new context. */
const GULP_CHOMP_SECONDS = 0.2;
/** Share of the context window one heavy swallow has to take to shake the screen. */
const HEAVY_GULP_SHARE = 0.05;
/**
 * Past this many tokens every turn re-reads a costly context, and coins start
 * spilling behind the Prince; the trail thickens as the thread grows.
 */
export const COIN_TRAIL_TOKENS = 50_000;
const COIN_POOL = 72;
const COIN_LIFE_SECONDS = 9;
/** Below this share of the context the Prince towers over a speck of a katamari. */
const TINY_FILL = 0.18;
/** How often a still, hungry ball takes another mouthful. */
const IDLE_DIGEST_SECONDS = 1.4;

export interface WorldStage {
  threadId: string | null;
  mode: StageMode;
  fill: number;
  /** Null until the thread's compaction count has been read. */
  compactions: number | null;
  /** False until the thread's context has loaded at least once. */
  ready: boolean;
  /** Tokens the thread holds, for the coin trail; null while unknown. */
  usedTokens?: number | null;
}

export type WorldEvent =
  | { kind: "enter"; threadId: string }
  | { kind: "pickup"; fill: number }
  | { kind: "rolledUp"; name: string; size: number; image: string | null }
  | { kind: "compacted"; compactions: number }
  | { kind: "lookOut" }
  | { kind: "knockedOff"; count: number }
  | { kind: "sprinkle" }
  /** A thread just grew big enough that the Prince starts dropping coins. */
  | { kind: "coins"; usedTokens: number };

export interface HudSnapshot {
  radius: number;
  targetRadius: number;
  compactions: number;
  zone: Zone;
  hungry: boolean;
  steering: boolean;
  transitioning: boolean;
}

interface WorldProp {
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

interface StuckItem {
  object: THREE.Object3D;
  definition: PropDefinition;
  size: number;
  depth: number;
}

type ActorPhase = "enter" | "stage" | "exit";

interface PopState {
  time: number;
  fromRadius: number;
  compactions: number;
  burst: boolean;
  startScale: number;
}

interface GulpState {
  time: number;
  /** 0..1: a nibble up to a heavy, screen-shaking swallow. */
  strength: number;
  chomps: number;
}

interface Coin {
  mesh: THREE.Mesh;
  life: number;
  vy: number;
  spin: number;
  size: number;
}

interface Confetti {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
}

interface Actor {
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

function angleOf(x: number, z: number): number {
  return Math.atan2(z, x);
}

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function smoothing(rate: number, deltaSeconds: number): number {
  return 1 - Math.exp(-rate * deltaSeconds);
}

/** Each compaction leaves the cousin woozier: 0.25 after one, 0.76 after five. */
export function dizzinessFor(compactions: number): number {
  return 1 - 0.75 ** Math.max(0, compactions);
}

/** 1 for an all-but-empty context, easing to 0 as the ball grows into a real katamari. */
export function tininessFor(radius: number): number {
  const progress = Math.min(1, fillForRadius(radius) / TINY_FILL);
  return 1 - progress * progress * (3 - 2 * progress);
}

/** The cousin's height: towering over a speck of a ball, then dwarfed as it grows. */
export function cousinHeightFor(radius: number): number {
  return 0.58 * (radius / BASE_RADIUS) ** 0.42 * (1 + 2.6 * tininessFor(radius));
}

export class KatamariWorld {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(55, 4 / 3, 0.05, 200);
  private readonly kit = new MaterialKit();
  private readonly environment: Environment;
  private readonly seed: number;
  private readonly random: () => number;
  private readonly props = new Map<string, WorldProp>();
  private readonly chunks = new Set<string>();
  private readonly takenPropIds = new Set<string>();
  private spawnQueue: SpawnSpec[] = [];
  private readonly actorCache = new Map<string, Actor>();
  private readonly puffs: { mesh: THREE.Mesh; life: number; grow: number }[] = [];
  private active: Actor | null = null;
  private exiting: Actor[] = [];
  private mode: StageMode = "empty";
  private pendingEntry: {
    threadId: string;
    fill: number;
    compactions: number | null;
    ready: boolean;
    delay: number;
    waited: number;
  } | null = null;
  private readonly confetti: Confetti[] = [];
  /** The game's white glints that trail a rolling katamari. */
  private readonly glints: Confetti[] = [];
  private readonly glintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  private readonly shockwave: THREE.Mesh;
  private readonly shockwaveMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private shockwaveLife = 0;
  private shockwaveRadius = 1;
  private drive: Drive = IDLE_DRIVE;
  private manualSeconds = 0;
  private lastLookOut = -10;
  private readonly portraits = new Map<string, string | null>();
  private readonly cameraFocus = new THREE.Vector3();
  private cameraHeading = 0;
  private readonly cameraPosition = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3();
  private cameraRadius = BASE_RADIUS;
  /** How much the camera pulls back: the ball, or the Prince when he towers over it. */
  private cameraFrame = BASE_RADIUS;
  private usedTokens: number | null = null;
  private readonly coins: Coin[] = [];
  private cameraFrozen = false;
  private shake = 0;
  private time = 0;
  private hudIn = 0;
  private frame = 0;
  private lastFrameTime = 0;
  private running = false;
  private disposed = false;
  private lastFillMilestone = -1;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly audio: KatamariAudio,
    private readonly onHud: (snapshot: HudSnapshot) => void,
    private readonly onEvent: (event: WorldEvent) => void,
  ) {
    this.seed = hashString("context-katamari-world");
    this.random = mulberry32(this.seed ^ Date.now());
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "low-power",
    });
    this.scene.fog = new THREE.Fog(0xffffff, 10, 40);
    this.environment = new Environment(this.scene, this.kit, this.seed);
    for (let index = 0; index < 14; index += 1) {
      const mesh = new THREE.Mesh(
        this.kit.sphere(2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
      );
      mesh.visible = false;
      this.scene.add(mesh);
      this.puffs.push({ mesh, life: 0, grow: 0 });
    }
    for (let index = 0; index < 48; index += 1) {
      const mesh = new THREE.Mesh(this.kit.box(), this.kit.solid(TOY_COLORS[index % TOY_COLORS.length]));
      mesh.visible = false;
      this.scene.add(mesh);
      this.confetti.push({ mesh, velocity: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 });
    }
    for (let index = 0; index < 28; index += 1) {
      const mesh = new THREE.Mesh(
        this.kit.geometry("octahedron", () => new THREE.OctahedronGeometry(0.5, 0)),
        this.glintMaterial,
      );
      mesh.visible = false;
      this.scene.add(mesh);
      this.glints.push({ mesh, velocity: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 });
    }
    const coinMaterial = this.kit.solid(0xffc629);
    const coinGeometry = this.kit.cylinder(18);
    for (let index = 0; index < COIN_POOL; index += 1) {
      const mesh = new THREE.Mesh(coinGeometry, coinMaterial);
      mesh.visible = false;
      this.scene.add(mesh);
      this.coins.push({ mesh, life: 0, vy: 0, spin: 0, size: 0 });
    }
    const ring = new THREE.RingGeometry(0.8, 1, 48);
    ring.rotateX(-Math.PI / 2);
    this.shockwave = new THREE.Mesh(ring, this.shockwaveMaterial);
    this.shockwave.visible = false;
    this.scene.add(this.shockwave);
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (width <= 0 || height <= 0) return;
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** The arrow keys; any press takes over from the wandering. */
  setDrive(drive: Drive): void {
    this.drive = drive;
    if (!isIdle(drive)) this.manualSeconds = MANUAL_HOLD_SECONDS;
  }


  setStage(stage: WorldStage): void {
    this.mode = stage.mode;
    if (stage.usedTokens !== undefined) this.usedTokens = stage.usedTokens;
    const target = radiusForFill(stage.fill);
    if (stage.threadId === null) return;
    const current = this.active?.threadId ?? this.pendingEntry?.threadId ?? null;
    if (current !== stage.threadId) {
      this.handoff(stage);
      return;
    }
    if (this.pendingEntry) {
      this.pendingEntry.fill = stage.fill;
      this.pendingEntry.compactions = stage.compactions;
      this.pendingEntry.ready = stage.ready;
      return;
    }
    const actor = this.active;
    if (!actor || !stage.ready) return;
    if (!actor.synced) {
      // The first real reading replaces the placeholder size without drama.
      actor.synced = true;
      actor.radius = target;
      actor.targetRadius = target;
      this.showKnownCompactions(actor, stage.compactions);
      if (actor.stuck.length < 12) this.prefill(actor);
      return;
    }
    actor.targetRadius = target;
    if (actor.pop) return;
    const change = compactionChange(
      actor.compactionsKnown ? actor.compactions : null,
      stage.compactions,
    );
    if (change?.kind === "pop" && actor.phase === "stage") {
      actor.pop = {
        time: 0,
        fromRadius: actor.radius,
        compactions: change.compactions,
        burst: false,
        startScale: 1,
      };
    } else if (change) {
      this.showKnownCompactions(actor, change.compactions);
    }
  }

  /**
   * The thread just took in more context: the katamari chomps, pulls nearby
   * junk in like a vacuum, and a heavy turn shakes the whole screen.
   * `share` is the new context as a fraction of the window.
   */
  gulp(share: number): void {
    const actor = this.active;
    if (!actor || actor.phase !== "stage" || actor.pop || !(share > 0)) return;
    const strength = Math.min(1, Math.sqrt(share / HEAVY_GULP_SHARE) * 0.6);
    actor.gulp = {
      time: 0,
      strength,
      chomps: strength < 0.25 ? 1 : strength < 0.6 ? 2 : 3,
    };
    this.audio.gulp(strength);
    // Something to swallow, pulled in with everything nearby.
    this.sprinkle(actor, 3 + Math.round(strength * 7), true);
    const reach = actor.radius * (4 + strength * 8);
    for (const prop of this.props.values()) {
      if (prop.size > actor.radius * PICKUP_RATIO) continue;
      const offsetX = actor.x - prop.x;
      const offsetZ = actor.z - prop.z;
      const distance = Math.hypot(offsetX, offsetZ);
      if (distance > reach || distance === 0) continue;
      const pull = actor.radius * (2 + strength * 6);
      prop.vx = (offsetX / distance) * pull;
      prop.vz = (offsetZ / distance) * pull;
      prop.vy = prop.size * (2 + strength * 4);
    }
    if (strength >= 0.6) this.shake = Math.max(this.shake, 0.5);
    for (let index = 0; index < 3 + strength * 6; index += 1) this.puff(actor.x, actor.z, actor.radius * 1.4);
  }

  start(): void {
    if (this.running || this.disposed) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      // Cap by time so fast displays don't multiply the cost; idle fidgets
      // need even less.
      const interval = this.isCalm() ? CALM_FRAME_MS : ACTIVE_FRAME_MS;
      if (now - this.lastFrameTime < interval - 1) {
        this.frame = window.requestAnimationFrame(tick);
        return;
      }
      // Allow long steps so a slow machine rolls at real speed instead of in slow motion.
      const deltaSeconds = Math.min(0.1, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;
      this.update(deltaSeconds);
      this.renderer.render(this.scene, this.camera);
      this.frame = window.requestAnimationFrame(tick);
    };
    this.frame = window.requestAnimationFrame(tick);
  }

  private isCalm(): boolean {
    return (
      this.mode !== "rolling" &&
      this.exiting.length === 0 &&
      this.pendingEntry === null &&
      (this.active === null ||
        (this.active.phase === "stage" && this.active.pop === null && this.active.gulp === null)) &&
      this.coins.every((coin) => coin.life <= 0)
    );
  }

  stop(): void {
    this.running = false;
    window.cancelAnimationFrame(this.frame);
    this.audio.setRolling(false, 0);
  }

  dispose(): void {
    this.stop();
    this.disposed = true;
    this.props.clear();
    this.shockwave.geometry.dispose();
    for (const puff of this.puffs) (puff.mesh.material as THREE.Material).dispose();
    this.glintMaterial.dispose();
    this.shockwaveMaterial.dispose();
    this.environment.dispose();
    this.kit.dispose();
    this.renderer.dispose();
    // Browsers cap live WebGL contexts, so give this one back right away.
    this.renderer.forceContextLoss();
  }

  // ---------------------------------------------------------------- stage

  private handoff(stage: WorldStage): void {
    const leaving = this.active;
    this.active = null;
    if (leaving) {
      // Roll off toward screen right, the way the camera is not looking.
      const right = new THREE.Vector2(
        -Math.sin(this.cameraHeading),
        Math.cos(this.cameraHeading),
      );
      leaving.phase = "exit";
      leaving.phaseTime = 0;
      leaving.exitDirection.copy(right);
      this.exiting.push(leaving);
      this.cameraFrozen = true;
      this.audio.whoosh();
    }
    this.pendingEntry = {
      threadId: stage.threadId ?? "",
      fill: stage.fill,
      compactions: stage.compactions,
      ready: stage.ready,
      delay: leaving ? 0.45 : 0,
      waited: 0,
    };
  }

  private setCompactions(actor: Actor, compactions: number, animate: boolean): void {
    if (compactions === actor.compactions && actor.moons.total === compactions) return;
    actor.compactions = compactions;
    dressCore(actor.core, this.kit, actor.nubColor, compactions);
    actor.moons.setCount(compactions, animate);
  }

  /** Show a count read from bb without a pop; an unknown count leaves the core as it is. */
  private showKnownCompactions(actor: Actor, compactions: number | null): void {
    if (compactions === null) return;
    actor.compactionsKnown = true;
    this.setCompactions(actor, compactions, false);
  }

  private spawnEntering(
    threadId: string,
    fill: number,
    compactions: number | null,
    ready: boolean,
  ): void {
    // Switching straight back turns a departing cousin around.
    const returning = this.exiting.find((leaving) => leaving.threadId === threadId);
    if (returning) {
      this.exiting = this.exiting.filter((leaving) => leaving !== returning);
      returning.targetRadius = radiusForFill(fill);
      if (ready) this.showKnownCompactions(returning, compactions);
      returning.phase = "enter";
      returning.phaseTime = 0;
      this.active = returning;
      this.onEvent({ kind: "enter", threadId });
      return;
    }
    const cached = this.actorCache.get(threadId);
    this.actorCache.delete(threadId);
    const actor = cached ?? this.createActor(threadId, fill, compactions, ready);
    actor.targetRadius = radiusForFill(fill);
    if (cached && ready) this.showKnownCompactions(actor, compactions);
    // Enter from screen left and roll to where the camera is looking.
    const left = new THREE.Vector2(
      Math.sin(this.cameraHeading),
      -Math.cos(this.cameraHeading),
    );
    const distance = Math.max(actor.radius, this.cameraRadius) * 9;
    actor.x = this.cameraFocus.x + left.x * distance;
    actor.z = this.cameraFocus.z + left.y * distance;
    actor.heading = angleOf(-left.x, -left.y);
    actor.phase = this.exiting.length > 0 || this.hasOrigin ? "enter" : "stage";
    actor.phaseTime = 0;
    actor.speed = 0;
    actor.vx = 0;
    actor.vz = 0;
    if (actor.phase === "stage") {
      actor.x = this.cameraFocus.x;
      actor.z = this.cameraFocus.z;
    }
    this.hasOrigin = true;
    this.scene.add(actor.ball, actor.rig.root, actor.ballShadow, actor.cousinShadow);
    this.active = actor;
    this.lastFillMilestone = Math.floor(clampFill(fill) * 10);
    this.onEvent({ kind: "enter", threadId });
  }

  private hasOrigin = false;

  private createActor(
    threadId: string,
    fill: number,
    knownCompactions: number | null,
    ready: boolean,
  ): Actor {
    const compactions = knownCompactions ?? 0;
    const seed = hashString(threadId);
    const random = mulberry32(seed);
    const rig = buildCousin(this.kit, seed);
    const ball = new THREE.Group();
    const roll = new THREE.Group();
    ball.add(roll);
    const core = new THREE.Group();
    const nubColor = pick(random, TOY_COLORS);
    dressCore(core, this.kit, nubColor, compactions);
    roll.add(core);
    const moons = new CompactionMoons(this.kit);
    moons.setCount(compactions, false);
    ball.add(moons.group);
    const ballShadow = new THREE.Mesh(this.kit.shadowDisc(), this.kit.shadow());
    const cousinShadow = new THREE.Mesh(this.kit.shadowDisc(), this.kit.shadow());
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
    this.prefill(actor);
    return actor;
  }

  /** A thread that already holds context shows up with a ball to match. */
  private prefill(actor: Actor): void {
    const level = scaleLevel(actor.radius);
    // The PS2 katamari is packed with junk; only the start shows much bare core.
    const count = 16 + Math.round(fillForRadius(actor.radius) * 90);
    for (let index = 0; index < count; index += 1) {
      const tier = Math.max(0, level - (actor.random() < 0.6 ? 0 : 1));
      const zone = pick(actor.random, ["room", "garden", "town", "beach", "candy"] as const);
      const definition = pickWeighted(actor.random, propsFor(zone, tier));
      if (!definition) continue;
      const size = actor.radius * (0.14 + actor.random() * 0.26);
      this.attach(actor, definition, size, this.randomDirection(actor.random), actor.radius * 0.84);
    }
  }

  // --------------------------------------------------------------- update

  private update(deltaSeconds: number): void {
    this.time += deltaSeconds;
    this.manualSeconds = Math.max(0, this.manualSeconds - deltaSeconds);

    if (this.pendingEntry) {
      const entry = this.pendingEntry;
      entry.delay -= deltaSeconds;
      entry.waited += deltaSeconds;
      if (entry.delay <= 0 && (entry.ready || entry.waited > READY_TIMEOUT_SECONDS)) {
        this.pendingEntry = null;
        this.spawnEntering(entry.threadId, entry.fill, entry.compactions, entry.ready);
      }
    }

    const actor = this.active;
    if (actor) this.updateActor(actor, deltaSeconds);
    for (const leaving of this.exiting) this.updateActor(leaving, deltaSeconds);
    this.exiting = this.exiting.filter((leaving) => {
      const far = Math.hypot(leaving.x - this.cameraFocus.x, leaving.z - this.cameraFocus.z) >
        Math.max(leaving.radius, this.cameraRadius) * 14;
      if (leaving.phaseTime > 3.5 || far) {
        this.retire(leaving);
        return false;
      }
      return true;
    });

    this.updateCamera(deltaSeconds);
    const radius = this.cameraRadius;
    const level = scaleLevel(radius);
    this.refreshChunks(level);
    this.updateProps(deltaSeconds);
    this.updatePuffs(deltaSeconds);
    this.updateConfetti(deltaSeconds);
    this.updateCoins(deltaSeconds);
    this.environment.update(deltaSeconds, this.time, this.cameraFocus, radius, level, this.camera);

    const rolling =
      actor !== null &&
      actor.phase === "stage" &&
      (this.mode === "rolling" || this.manualSeconds > 0) &&
      actor.speed > actor.radius * 0.2;
    this.audio.setRolling(
      rolling,
      actor ? actor.speed / Math.max(actor.radius * 2.4, 0.001) : 0,
    );

    this.hudIn -= deltaSeconds;
    if (this.hudIn <= 0 && actor) {
      this.hudIn = HUD_INTERVAL_SECONDS;
      this.onHud({
        radius: actor.radius,
        targetRadius: actor.targetRadius,
        compactions: actor.compactions,
        zone: zoneAt(actor.x, actor.z, level, this.seed).zone,
        hungry: actor.radius < actor.targetRadius * 0.98,
        steering: this.manualSeconds > 0,
        transitioning: actor.phase !== "stage" || this.exiting.length > 0,
      });
    }
  }

  private retire(actor: Actor): void {
    this.scene.remove(actor.ball, actor.rig.root, actor.ballShadow, actor.cousinShadow);
    this.actorCache.set(actor.threadId, actor);
    while (this.actorCache.size > ACTOR_CACHE_LIMIT) {
      const oldest = this.actorCache.keys().next().value;
      if (oldest === undefined) break;
      this.actorCache.delete(oldest);
    }
    if (this.exiting.length <= 1) this.cameraFrozen = false;
  }

  private updateActor(actor: Actor, deltaSeconds: number): void {
    actor.phaseTime += deltaSeconds;
    const radius = actor.radius;
    // Where the ball wants to go (world velocity) and how briskly it gets there.
    let desiredX = 0;
    let desiredZ = 0;
    let response = 3;
    let turn = 0;
    const facingX = () => Math.cos(actor.heading);
    const facingZ = () => Math.sin(actor.heading);

    if (actor.pop) {
      // Hold still for the pop; the show is the ball, not the roll.
      this.updatePop(actor, deltaSeconds);
    } else if (actor.phase === "exit") {
      const desired = angleOf(actor.exitDirection.x, actor.exitDirection.y);
      turn = wrapAngle(desired - actor.heading) * 4;
      desiredX = facingX() * radius * 5;
      desiredZ = facingZ() * radius * 5;
    } else if (actor.phase === "enter") {
      const toFocusX = this.cameraFocus.x - actor.x;
      const toFocusZ = this.cameraFocus.z - actor.z;
      const distance = Math.hypot(toFocusX, toFocusZ);
      turn = wrapAngle(angleOf(toFocusX, toFocusZ) - actor.heading) * 4;
      const speed = Math.min(radius * 4.5, distance * 2.2);
      desiredX = facingX() * speed;
      desiredZ = facingZ() * speed;
      if (distance < radius * 0.6 || actor.phaseTime > 3) {
        actor.phase = "stage";
        actor.phaseTime = 0;
        this.cameraFrozen = false;
      }
    } else if (this.manualSeconds > 0 && actor === this.active) {
      // The arrow keys always roll the ball; only the cousin's own wandering
      // waits for the thread to be working.
      const drive = this.drive;
      turn = drive.turn * TURN_RATE;
      desiredX = facingX() * drive.forward * radius * MAX_PUSH_SPEED;
      desiredZ = facingZ() * drive.forward * radius * MAX_PUSH_SPEED;
      // Rolling has momentum: build up speed, coast when the keys let go.
      response = isIdle(drive) ? 0.9 : 1.8;
    } else if (this.mode === "rolling") {
      const plan = this.wander(actor, deltaSeconds);
      turn = plan.turn;
      desiredX = facingX() * plan.speed;
      desiredZ = facingZ() * plan.speed;
      response = 2.2;
    } else {
      response = 3.5;
    }

    // A dizzy cousin cannot quite keep a straight line, even under the player's hands.
    const dizziness = dizzinessFor(actor.compactions);
    if (actor.phase === "stage" && actor.speed > radius * 0.1) {
      const manual = this.manualSeconds > 0 && actor === this.active;
      turn += Math.sin(this.time * 2.1 + actor.stride * 0.13) * dizziness * (manual ? 0.7 : 1.4);
    }

    actor.heading = wrapAngle(actor.heading + turn * deltaSeconds);
    const blend = smoothing(response, deltaSeconds);
    actor.vx += (desiredX - actor.vx) * blend;
    actor.vz += (desiredZ - actor.vz) * blend;
    actor.speed = Math.hypot(actor.vx, actor.vz);
    if (actor.speed < radius * 0.01 && desiredX === 0 && desiredZ === 0) {
      actor.vx = 0;
      actor.vz = 0;
      actor.speed = 0;
    }

    const directionX = Math.cos(actor.heading);
    const directionZ = Math.sin(actor.heading);
    actor.x += actor.vx * deltaSeconds;
    actor.z += actor.vz * deltaSeconds;
    const distance = actor.speed * deltaSeconds;
    if (distance > 0) {
      const axis = new THREE.Vector3(actor.vz, 0, -actor.vx).normalize();
      actor.roll.quaternion.premultiply(
        new THREE.Quaternion().setFromAxisAngle(axis, distance / radius),
      );
      actor.idleSeconds = 0;
    } else {
      actor.idleSeconds += deltaSeconds;
    }

    if (actor.gulp && !actor.pop) this.updateGulp(actor, deltaSeconds);
    if (actor.phase === "stage" && !actor.pop) {
      this.collide(actor);
      if (actor === this.active) this.watchAhead(actor);
      this.growToward(actor, deltaSeconds);
    }

    // Place the ball, its shadow, and the cousin pushing from behind.
    actor.ball.position.set(actor.x, actor.radius * actor.roll.scale.y, actor.z);
    actor.core.scale.setScalar(actor.radius * 1.68);
    actor.ballShadow.position.set(actor.x, 0.002 * actor.radius, actor.z);
    actor.ballShadow.scale.setScalar(actor.radius * 0.95 * actor.roll.scale.x);
    actor.moons.update(deltaSeconds, actor.radius * actor.roll.scale.x, this.time);
    // Towering over a 5 mm speck, then shrinking against the ball as it grows.
    const tininess = tininessFor(actor.radius);
    const cousinHeight = cousinHeightFor(actor.radius);
    const behind = actor.radius + cousinHeight * THREE.MathUtils.lerp(0.28, 0.13, tininess);
    // Dizzy cousins stagger from side to side behind the ball.
    const stagger = Math.sin(this.time * 1.9) * dizziness * cousinHeight * 0.12;
    const cousinX = actor.x - directionX * behind - directionZ * stagger;
    const cousinZ = actor.z - directionZ * behind + directionX * stagger;
    const shoulder = cousinHeight * 0.58;
    const reach = Math.min(
      Math.PI / 2 - 0.2,
      Math.atan2(behind - actor.radius * 0.6, Math.max(0.001, shoulder - actor.radius)),
    );
    actor.rig.root.position.set(cousinX, 0, cousinZ);
    actor.rig.root.rotation.y = -actor.heading;
    actor.rig.root.scale.setScalar(cousinHeight);
    actor.cousinShadow.position.set(cousinX, 0.003 * actor.radius, cousinZ);
    actor.cousinShadow.scale.setScalar(cousinHeight * 0.3);
    actor.stride += (actor.speed / cousinHeight) * deltaSeconds * 3.2;
    poseCousin(actor.rig, {
      stride: actor.stride,
      speed: actor.speed / cousinHeight,
      idleSeconds: actor.idleSeconds,
      waiting: this.mode === "waiting" && actor === this.active && actor.phase === "stage",
      time: this.time,
      reach,
      dizziness,
      stars: Math.min(MAX_DIZZY_STARS, actor.compactions),
    });
    if (distance > 0) this.dropCoins(actor, distance, cousinX, cousinZ, cousinHeight);

    if (actor.speed > actor.radius * 0.8 && actor.random() < deltaSeconds * 10 * Math.min(2, actor.speed / actor.radius)) {
      this.glint(actor);
    }
    if (actor.speed > actor.radius * 1.5 && actor.random() < deltaSeconds * 6) {
      this.puff(cousinX, cousinZ, actor.radius);
    }
  }

  /**
   * Wandering mixes a drifting turn rate with short moods: cruising, a
   * swerve, a lazy loop, or making a beeline for something to roll up.
   */
  private wander(actor: Actor, deltaSeconds: number): { turn: number; speed: number } {
    const radius = actor.radius;
    actor.decisionIn -= deltaSeconds;
    const hungry = actor.radius < actor.targetRadius * 0.98;
    if (actor.decisionIn <= 0) {
      const roll = actor.random();
      actor.behaviorSign = actor.random() < 0.5 ? -1 : 1;
      if (hungry && roll < 0.6) {
        actor.behavior = "seek";
        actor.seekTarget = this.nearestPickup(actor);
      } else if (roll < 0.45) {
        actor.behavior = "cruise";
      } else if (roll < 0.75) {
        actor.behavior = "swerve";
      } else {
        actor.behavior = "loop";
      }
      actor.decisionIn =
        actor.behavior === "swerve" ? 0.6 + actor.random() * 0.8 : 1.5 + actor.random() * 3;
    }

    actor.turnRate += (actor.random() - 0.5) * deltaSeconds * 4;
    actor.turnRate *= 1 - smoothing(0.8, deltaSeconds);
    let turn = actor.turnRate + Math.sin(this.time * 0.9 + actor.x * 0.1) * 0.25;
    let speed = radius * (4 + Math.sin(this.time * 0.37) * 0.6);
    switch (actor.behavior) {
      case "swerve":
        turn += actor.behaviorSign * 1.7;
        break;
      case "loop":
        turn += actor.behaviorSign * 1.05;
        speed *= 0.85;
        break;
      case "seek": {
        const target = actor.seekTarget;
        if (target && this.props.has(target.id)) {
          const desired = angleOf(target.x - actor.x, target.z - actor.z);
          turn = wrapAngle(desired - actor.heading) * 2.6;
          speed *= 1.15;
        } else {
          actor.decisionIn = 0;
        }
        break;
      }
      default:
        break;
    }

    // Steer around anything too big to roll over.
    const lookAhead = radius * 3.2;
    const forwardX = Math.cos(actor.heading);
    const forwardZ = Math.sin(actor.heading);
    for (const prop of this.props.values()) {
      if (prop.size < radius * OBSTACLE_RATIO || prop.lift > radius * 2) continue;
      const offsetX = prop.x - actor.x;
      const offsetZ = prop.z - actor.z;
      const ahead = offsetX * forwardX + offsetZ * forwardZ;
      if (ahead <= 0 || ahead > lookAhead + prop.size) continue;
      const side = offsetX * -forwardZ + offsetZ * forwardX;
      if (Math.abs(side) < radius + prop.size * 0.8) {
        turn += (side > 0 ? -1 : 1) * 2.4 * (1 - ahead / (lookAhead + prop.size));
      }
    }
    return { turn: THREE.MathUtils.clamp(turn, -2.6, 2.6), speed };
  }

  private nearestPickup(actor: Actor): WorldProp | null {
    let best: WorldProp | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const prop of this.props.values()) {
      if (prop.size > actor.radius * PICKUP_RATIO || prop.size < actor.radius * 0.06) continue;
      const distance = Math.hypot(prop.x - actor.x, prop.z - actor.z);
      if (distance > actor.radius * 14) continue;
      const bearing = Math.abs(wrapAngle(angleOf(prop.x - actor.x, prop.z - actor.z) - actor.heading));
      const score = distance * (1 + bearing);
      if (score < bestScore) {
        bestScore = score;
        best = prop;
      }
    }
    return best;
  }

  private collide(actor: Actor): void {
    const hungry = actor.radius < actor.targetRadius * 0.995;
    for (const prop of [...this.props.values()]) {
      if (prop.lift + prop.hop > actor.radius * 1.6) continue;
      const offsetX = prop.x - actor.x;
      const offsetZ = prop.z - actor.z;
      const distance = Math.hypot(offsetX, offsetZ);
      const reach = actor.radius + prop.size * 0.7;
      if (distance >= reach) continue;
      const normalX = distance > 0 ? offsetX / distance : 1;
      const normalZ = distance > 0 ? offsetZ / distance : 0;

      if (hungry && prop.size <= actor.radius * PICKUP_RATIO) {
        this.rollUp(actor, prop);
        continue;
      }
      if (prop.size < actor.radius * OBSTACLE_RATIO) {
        // Too big to take yet, or the context has not grown: knock it aside.
        const push = Math.max(actor.speed, actor.radius) * 1.3;
        prop.vx = normalX * push;
        prop.vz = normalZ * push;
        if (prop.hop <= 0) prop.vy = prop.size * 3;
        prop.x = actor.x + normalX * reach;
        prop.z = actor.z + normalZ * reach;
        continue;
      }
      // A wall of a thing: bounce off it, and a hard hit shakes junk loose.
      actor.x = prop.x - normalX * reach;
      actor.z = prop.z - normalZ * reach;
      const impact = actor.vx * normalX + actor.vz * normalZ;
      if (impact > 0) {
        actor.vx -= normalX * impact * 1.4;
        actor.vz -= normalZ * impact * 1.4;
      }
      if (impact > actor.radius * 2.2) this.knockLoose(actor, impact, normalX, normalZ);
      if (this.manualSeconds <= 0) {
        actor.heading = wrapAngle(angleOf(-normalX, -normalZ) + (actor.random() - 0.5) * 1.2);
        actor.decisionIn = Math.min(actor.decisionIn, 0.3);
      }
      if (this.time - actor.lastBonk > 0.4) {
        actor.lastBonk = this.time;
        this.shake = 0.35;
        this.audio.bonk();
      }
    }
  }

  /**
   * A small picture of a prop for the HUD's "last rolled up" circle, rendered
   * once per kind into an offscreen target and cached.
   */
  private portrait(definition: PropDefinition): string | null {
    const cached = this.portraits.get(definition.kind);
    if (cached !== undefined) return cached;
    let image: string | null = null;
    try {
      const size = 96;
      const target = new THREE.WebGLRenderTarget(size, size);
      target.texture.colorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f9c, 1.6));
      const light = new THREE.DirectionalLight(0xffffff, 1.4);
      light.position.set(2, 3, 2);
      scene.add(light);
      const model = buildProp(definition, { kit: this.kit, random: () => 0 });
      model.rotation.y = -0.7;
      scene.add(model);
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
      camera.position.set(2.6, 2.4, 3.2);
      camera.lookAt(0, 0.8, 0);
      this.renderer.setRenderTarget(target);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.clear();
      this.renderer.render(scene, camera);
      const pixels = new Uint8Array(size * size * 4);
      this.renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
      this.renderer.setRenderTarget(null);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (context) {
        const data = context.createImageData(size, size);
        // WebGL rows run bottom-up; flip them for the 2D canvas.
        for (let row = 0; row < size; row += 1) {
          data.data.set(pixels.subarray((size - 1 - row) * size * 4, (size - row) * size * 4), row * size * 4);
        }
        context.putImageData(data, 0, 0);
        image = canvas.toDataURL("image/png");
      }
      target.dispose();
    } catch {
      image = null;
    }
    this.portraits.set(definition.kind, image);
    return image;
  }

  /** Katamari Damacy's crash: hit something big fast enough and items fly off. */
  private knockLoose(actor: Actor, impact: number, normalX: number, normalZ: number): void {
    const count = Math.min(actor.stuck.length - 4, 1 + Math.floor(impact / actor.radius - 2));
    if (count <= 0) return;
    const loose = actor.stuck.splice(actor.stuck.length - count, count);
    const position = new THREE.Vector3();
    for (const [index, item] of loose.entries()) {
      item.object.getWorldPosition(position);
      actor.roll.remove(item.object);
      const prop = this.addProp(
        item.definition,
        position.x,
        position.z,
        item.size,
        null,
        `loose:${this.time}:${index}`,
        item.object as THREE.Group,
      );
      const spread = (actor.random() - 0.5) * 2;
      prop.vx = (-normalX + -normalZ * spread) * actor.radius * 3;
      prop.vz = (-normalZ + normalX * spread) * actor.radius * 3;
      prop.hop = Math.max(0, position.y - item.size);
      prop.vy = actor.radius * 4;
    }
    this.onEvent({ kind: "knockedOff", count: loose.length });
  }

  /** Warn when the katamari is about to run into something it cannot take. */
  private watchAhead(actor: Actor): void {
    if (actor.speed < actor.radius || this.time - this.lastLookOut < 3) return;
    const headingX = actor.vx / actor.speed;
    const headingZ = actor.vz / actor.speed;
    for (const prop of this.props.values()) {
      if (prop.size < actor.radius * OBSTACLE_RATIO) continue;
      const offsetX = prop.x - actor.x;
      const offsetZ = prop.z - actor.z;
      const ahead = offsetX * headingX + offsetZ * headingZ;
      const side = Math.abs(offsetX * -headingZ + offsetZ * headingX);
      if (ahead > 0 && ahead < actor.radius * 2.5 + prop.size && side < actor.radius + prop.size * 0.6) {
        this.lastLookOut = this.time;
        this.onEvent({ kind: "lookOut" });
        return;
      }
    }
  }

  private rollUp(actor: Actor, prop: WorldProp): void {
    this.removeProp(prop);
    this.takenPropIds.add(prop.id);
    if (this.takenPropIds.size > 6000) {
      const first = this.takenPropIds.values().next().value;
      if (first !== undefined) this.takenPropIds.delete(first);
    }
    const worldDirection = new THREE.Vector3(
      prop.x - actor.x,
      prop.lift + prop.hop + prop.size * 0.5 - actor.radius,
      prop.z - actor.z,
    ).normalize();
    const local = worldDirection.applyQuaternion(actor.roll.quaternion.clone().invert());
    this.attach(actor, prop.definition, prop.size, local, actor.radius * 0.84, prop.object);
    const gain = Math.max(prop.size * 0.1, (actor.targetRadius - actor.radius) * 0.14);
    actor.radius = Math.min(actor.targetRadius, actor.radius + gain);
    actor.hungrySeconds = 0;
    this.audio.pickup(prop.size / actor.radius);
    this.onEvent({
      kind: "rolledUp",
      name: propName(prop.definition),
      size: prop.size,
      image: this.portrait(prop.definition),
    });
    const fill = fillForRadius(actor.radius);
    const milestone = Math.floor(fill * 10);
    if (milestone > this.lastFillMilestone) {
      this.lastFillMilestone = milestone;
      this.onEvent({ kind: "pickup", fill });
    }
  }

  private attach(
    actor: Actor,
    definition: PropDefinition,
    size: number,
    direction: THREE.Vector3,
    depth: number,
    existing?: THREE.Group,
  ): void {
    const object =
      existing ?? buildProp(definition, { kit: this.kit, random: actor.random });
    object.scale.setScalar(size);
    object.position.copy(direction).multiplyScalar(depth - size * 0.4);
    // Stick base-first with a random lean, the way junk jams into a katamari.
    object.quaternion
      .setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
      .multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
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

  /** Grow when fed, shed when the thread compacts, and help a hungry ball find food. */
  private growToward(actor: Actor, deltaSeconds: number): void {
    const coreRadius = actor.radius * 0.84;
    actor.stuck = actor.stuck.filter((item) => {
      const buried = item.depth + item.size * 0.9 < coreRadius;
      if (buried) {
        actor.roll.remove(item.object);
      }
      return !buried;
    });

    if (actor.targetRadius < actor.radius * 0.9) {
      this.shed(actor);
      return;
    }
    if (actor.radius < actor.targetRadius * 0.98) {
      actor.hungrySeconds += deltaSeconds;
      if (this.mode === "rolling" && actor.hungrySeconds > 5) {
        actor.hungrySeconds = 0;
        this.sprinkle(actor);
      } else if (this.mode !== "rolling" && actor.hungrySeconds > IDLE_DIGEST_SECONDS) {
        // A quick turn can end before the cousin rolls anywhere: the ball
        // still swallows what the thread took in, a mouthful at a time.
        actor.hungrySeconds = 0;
        this.sprinkle(actor, 5, true);
      }
    } else {
      actor.hungrySeconds = 0;
    }
  }

  /**
   * Split a shrinking ball's items: the oldest ones small enough for the new
   * size stay stuck, and everything else comes off.
   */
  private sortForShrink(actor: Actor, fromRadius: number, toRadius: number): StuckItem[] {
    const fits = actor.stuck.filter((item) => item.size <= toRadius * PICKUP_RATIO);
    const keepCount = Math.max(4, Math.round(actor.stuck.length * (toRadius / fromRadius) ** 2));
    const kept = new Set(fits.slice(0, keepCount));
    const leaving = actor.stuck.filter((item) => !kept.has(item));
    actor.stuck = actor.stuck.filter((item) => kept.has(item));
    return leaving;
  }

  private shed(actor: Actor): void {
    const shedding = this.sortForShrink(actor, actor.radius, actor.targetRadius);
    for (const item of shedding.slice(0, 24)) {
      actor.roll.remove(item.object);
      const angle = actor.random() * Math.PI * 2;
      const prop = this.addProp(
        item.definition,
        actor.x + Math.cos(angle) * actor.radius * 1.2,
        actor.z + Math.sin(angle) * actor.radius * 1.2,
        item.size,
        null,
        `shed:${this.time}:${Math.random()}`,
        item.object as THREE.Group,
      );
      prop.vx = Math.cos(angle) * actor.radius * 3;
      prop.vz = Math.sin(angle) * actor.radius * 3;
      prop.vy = actor.radius * 4;
    }
    for (const item of shedding.slice(24)) {
      actor.roll.remove(item.object);
    }
    actor.radius = actor.targetRadius;
    for (const item of actor.stuck) item.depth = Math.min(item.depth, actor.radius * 0.84);
    for (const item of actor.stuck) {
      item.object.position.setLength(item.depth - item.size * 0.4);
    }
    this.audio.shed();
  }

  /**
   * A compaction: the ball swells and wobbles, bursts its junk and a shower of
   * confetti outward, earns a new orbiting star, then shrinks to its new size.
   */
  private updatePop(actor: Actor, deltaSeconds: number): void {
    const pop = actor.pop;
    if (!pop) return;
    pop.time += deltaSeconds;
    if (pop.time < POP_INFLATE_SECONDS) {
      const progress = pop.time / POP_INFLATE_SECONDS;
      const swell = 1 + 0.32 * (1 - (1 - progress) ** 3);
      const wobble = Math.sin(pop.time * 48) * 0.07 * progress;
      actor.roll.scale.set(swell * (1 + wobble), swell * (1 - wobble), swell * (1 + wobble));
      this.shake = Math.max(this.shake, 0.12 * progress);
      return;
    }
    if (!pop.burst) {
      pop.burst = true;
      this.burst(actor, pop);
    }
    const progress = Math.min(1, (pop.time - POP_INFLATE_SECONDS) / POP_SHRINK_SECONDS);
    // Elastic settle: overshoot below the new size, then spring back.
    const elastic =
      progress >= 1
        ? 1
        : 1 - 2 ** (-9 * progress) * Math.cos(progress * Math.PI * 3.2);
    actor.roll.scale.setScalar(THREE.MathUtils.lerp(pop.startScale, 1, elastic));
    if (progress >= 1) {
      actor.roll.scale.setScalar(1);
      actor.pop = null;
    }
  }

  private burst(actor: Actor, pop: PopState): void {
    const newRadius = Math.min(actor.targetRadius, pop.fromRadius);
    pop.startScale = (pop.fromRadius * 1.32) / newRadius;
    const flung = this.sortForShrink(actor, pop.fromRadius, newRadius);
    const worldPosition = new THREE.Vector3();
    for (const [index, item] of flung.entries()) {
      item.object.getWorldPosition(worldPosition);
      actor.roll.remove(item.object);
      if (index >= 30) continue;
      const outX = worldPosition.x - actor.x;
      const outZ = worldPosition.z - actor.z;
      const length = Math.hypot(outX, outZ) || 1;
      const prop = this.addProp(
        item.definition,
        worldPosition.x,
        worldPosition.z,
        item.size,
        null,
        `pop:${this.time}:${index}`,
        item.object as THREE.Group,
      );
      const fling = pop.fromRadius * (3 + actor.random() * 3);
      prop.vx = (outX / length) * fling;
      prop.vz = (outZ / length) * fling;
      prop.hop = Math.max(0, worldPosition.y - item.size);
      prop.vy = pop.fromRadius * (5 + actor.random() * 4);
    }
    actor.radius = newRadius;
    for (const item of actor.stuck) {
      item.depth = Math.min(item.depth, newRadius * 0.84);
      item.object.position.setLength(item.depth - item.size * 0.4);
    }
    this.setCompactions(actor, pop.compactions, true);

    const center = new THREE.Vector3(actor.x, pop.fromRadius, actor.z);
    for (const piece of this.confetti) {
      const direction = this.randomDirection(this.random);
      direction.y = Math.abs(direction.y) + 0.3;
      piece.velocity.copy(direction.normalize()).multiplyScalar(pop.fromRadius * (4 + this.random() * 5));
      piece.spin.set(this.random() * 12, this.random() * 12, this.random() * 12);
      piece.life = 1.4 + this.random() * 0.8;
      piece.mesh.visible = true;
      piece.mesh.position.copy(center);
      piece.mesh.scale.set(pop.fromRadius * 0.14, pop.fromRadius * 0.05, pop.fromRadius * 0.09);
    }
    this.shockwaveLife = 1;
    this.shockwaveRadius = pop.fromRadius;
    this.shockwave.position.set(actor.x, pop.fromRadius * 0.02, actor.z);
    this.shockwave.visible = true;
    this.shake = 0.6;
    this.audio.pop();
    this.onEvent({ kind: "compacted", compactions: pop.compactions });
  }

  private glint(actor: Actor): void {
    const glint = this.glints.find((candidate) => candidate.life <= 0);
    if (!glint) return;
    const angle = actor.random() * Math.PI * 2;
    glint.life = 0.7;
    glint.mesh.visible = true;
    glint.mesh.position.set(
      actor.x + Math.cos(angle) * actor.radius * 0.9,
      actor.radius * (1 + actor.random() * 0.9),
      actor.z + Math.sin(angle) * actor.radius * 0.9,
    );
    glint.velocity.set(Math.cos(angle) * actor.radius * 1.2, actor.radius * 1.6, Math.sin(angle) * actor.radius * 1.2);
    glint.spin.set(0, 8, 4);
    glint.mesh.scale.setScalar(actor.radius * 0.12);
  }

  private updateConfetti(deltaSeconds: number): void {
    for (const glint of this.glints) {
      if (glint.life <= 0) continue;
      glint.life -= deltaSeconds;
      glint.mesh.position.addScaledVector(glint.velocity, deltaSeconds);
      glint.mesh.rotation.y += glint.spin.y * deltaSeconds;
      glint.mesh.scale.multiplyScalar(1 - deltaSeconds * 1.2);
      if (glint.life <= 0) glint.mesh.visible = false;
    }
    for (const piece of this.confetti) {
      if (piece.life <= 0) continue;
      piece.life -= deltaSeconds;
      const gravity = piece.mesh.scale.x * 40;
      piece.velocity.y -= gravity * deltaSeconds;
      piece.velocity.multiplyScalar(1 - smoothing(1.2, deltaSeconds));
      piece.mesh.position.addScaledVector(piece.velocity, deltaSeconds);
      if (piece.mesh.position.y < 0) {
        piece.mesh.position.y = 0;
        piece.velocity.set(0, 0, 0);
      }
      piece.mesh.rotation.x += piece.spin.x * deltaSeconds;
      piece.mesh.rotation.y += piece.spin.y * deltaSeconds;
      piece.mesh.rotation.z += piece.spin.z * deltaSeconds;
      if (piece.life <= 0) piece.mesh.visible = false;
    }
    if (this.shockwaveLife > 0) {
      this.shockwaveLife = Math.max(0, this.shockwaveLife - deltaSeconds * 1.3);
      const grow = 1 - this.shockwaveLife;
      this.shockwave.scale.setScalar(this.shockwaveRadius * (1.2 + grow * 5));
      this.shockwaveMaterial.opacity = this.shockwaveLife * 0.85;
      if (this.shockwaveLife === 0) this.shockwave.visible = false;
    }
  }

  /**
   * Rain a few snack-sized props ahead of a ball that has room to grow; a
   * heavy gulp drops them right onto it instead.
   */
  private sprinkle(actor: Actor, count = 5, gulping = false): void {
    const level = scaleLevel(actor.radius);
    const zone = zoneAt(actor.x, actor.z, level, this.seed).zone;
    for (let index = 0; index < count; index += 1) {
      const definition =
        pickWeighted(this.random, propsFor(zone, level)) ??
        pickWeighted(this.random, propsFor("room", Math.max(0, level - 1)));
      if (!definition) continue;
      const spread = gulping ? this.random() * Math.PI * 2 : (this.random() - 0.5) * 1.4;
      const distance = actor.radius * (gulping ? 1.1 + this.random() * 1.2 : 3 + this.random() * 4);
      const angle = actor.heading + spread;
      const prop = this.addProp(
        definition,
        actor.x + Math.cos(angle) * distance,
        actor.z + Math.sin(angle) * distance,
        actor.radius * (0.2 + this.random() * 0.25),
        null,
        `sprinkle:${this.time}:${index}`,
      );
      prop.hop = actor.radius * (gulping ? 3 + this.random() * 5 : 6);
      prop.vy = 0;
      if (gulping) {
        // Sucked in toward the ball as it lands.
        prop.vx = -Math.cos(angle) * actor.radius * 3;
        prop.vz = -Math.sin(angle) * actor.radius * 3;
      }
    }
    if (!gulping) this.onEvent({ kind: "sprinkle" });
  }

  /** Chomp, chomp, chomp: the ball squashes flat and springs back per bite. */
  private updateGulp(actor: Actor, deltaSeconds: number): void {
    const gulp = actor.gulp;
    if (!gulp) return;
    gulp.time += deltaSeconds;
    const chewing = gulp.chomps * GULP_CHOMP_SECONDS;
    if (gulp.time >= chewing) {
      actor.roll.scale.setScalar(1);
      actor.gulp = null;
      return;
    }
    const bite = Math.sin(((gulp.time % GULP_CHOMP_SECONDS) / GULP_CHOMP_SECONDS) * Math.PI);
    const squash = bite * (0.1 + gulp.strength * 0.22);
    actor.roll.scale.set(1 + squash * 0.7, 1 - squash, 1 + squash * 0.7);
    if (gulp.strength >= 0.6) this.shake = Math.max(this.shake, 0.3 * bite);
  }

  /**
   * A long thread re-reads its whole context every turn, so past a size the
   * Prince spills coins as he rolls, thicker as the thread grows.
   */
  private dropCoins(actor: Actor, distance: number, x: number, z: number, cousinHeight: number): void {
    const used = this.usedTokens;
    if (actor !== this.active || actor.phase !== "stage" || used === null || used < COIN_TRAIL_TOKENS) {
      return;
    }
    if (!actor.coinsAnnounced) {
      actor.coinsAnnounced = true;
      this.onEvent({ kind: "coins", usedTokens: used });
    }
    const coinsPerRadius = 0.35 * Math.min(6, used / COIN_TRAIL_TOKENS);
    actor.coinDistance += distance / actor.radius;
    while (actor.coinDistance >= 1 / coinsPerRadius) {
      actor.coinDistance -= 1 / coinsPerRadius;
      const coin = this.coins.find((candidate) => candidate.life <= 0) ?? this.coins[0];
      // Big enough to read as coins even behind a towering katamari.
      const size = Math.max(cousinHeight * 0.3, actor.radius * 0.22);
      coin.life = COIN_LIFE_SECONDS;
      coin.size = size;
      coin.vy = size * (9 + actor.random() * 5);
      coin.spin = 14 + actor.random() * 10;
      coin.mesh.visible = true;
      coin.mesh.position.set(
        x + (actor.random() - 0.5) * size * 3,
        cousinHeight * 0.35,
        z + (actor.random() - 0.5) * size * 3,
      );
      coin.mesh.rotation.set(Math.PI / 2, actor.random() * Math.PI, 0);
      coin.mesh.scale.set(size, size * 0.16, size);
      // Move the coin to the back of the pool so the oldest one is recycled first.
      this.coins.splice(this.coins.indexOf(coin), 1);
      this.coins.push(coin);
      if (actor.random() < 0.5) this.audio.coin();
    }
  }

  private updateCoins(deltaSeconds: number): void {
    for (const coin of this.coins) {
      if (coin.life <= 0) continue;
      coin.life -= deltaSeconds;
      const rest = coin.size * 0.08;
      const position = coin.mesh.position;
      if (position.y > rest || coin.vy > 0) {
        // Flipping through the air, then landing flat with a clink.
        coin.vy -= coin.size * 60 * deltaSeconds;
        position.y = Math.max(rest, position.y + coin.vy * deltaSeconds);
        coin.mesh.rotation.x += coin.spin * deltaSeconds;
        if (position.y === rest) {
          coin.vy = 0;
          coin.mesh.rotation.x = 0;
        }
      }
      const fade = Math.min(1, coin.life / 1.2);
      coin.mesh.scale.set(coin.size * fade, coin.size * 0.16 * fade, coin.size * fade);
      if (coin.life <= 0) coin.mesh.visible = false;
    }
  }

  private randomDirection(random: () => number): THREE.Vector3 {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return new THREE.Vector3(s * Math.cos(theta), u, s * Math.sin(theta));
  }

  // --------------------------------------------------------------- camera

  private updateCamera(deltaSeconds: number): void {
    const actor = this.active;
    const followRadius = actor?.radius ?? this.cameraRadius;
    this.cameraRadius += (followRadius - this.cameraRadius) * smoothing(1.6, deltaSeconds);
    // A towering Prince over a tiny ball needs the camera further back to fit him in.
    const followFrame = actor ? Math.max(actor.radius, actor.rig.root.scale.y * 0.42) : this.cameraFrame;
    this.cameraFrame += (followFrame - this.cameraFrame) * smoothing(1.6, deltaSeconds);
    const tininess = tininessFor(this.cameraRadius);
    if (actor && !this.cameraFrozen && actor.phase === "stage") {
      this.cameraFocus.x += (actor.x - this.cameraFocus.x) * smoothing(7, deltaSeconds);
      this.cameraFocus.z += (actor.z - this.cameraFocus.z) * smoothing(7, deltaSeconds);
      // The camera swings with the Prince, as it does in the game.
      this.cameraHeading += wrapAngle(actor.heading - this.cameraHeading) * smoothing(3.2, deltaSeconds);
    }
    const radius = this.cameraRadius;
    const forwardX = Math.cos(this.cameraHeading);
    const forwardZ = Math.sin(this.cameraHeading);
    // The PS2 framing: close behind the Prince, who stands big at the
    // bottom of the screen with the katamari just above center. While the
    // ball is a speck, swing round to a three-quarter view so the giant
    // Prince and his tiny katamari are both in the shot.
    const frame = this.cameraFrame;
    const swing = this.cameraHeading - 1.15 * tininess;
    const position = new THREE.Vector3(
      this.cameraFocus.x - Math.cos(swing) * frame * 3.9,
      frame * 2.7,
      this.cameraFocus.z - Math.sin(swing) * frame * 3.9,
    );
    const target = new THREE.Vector3(
      this.cameraFocus.x + forwardX * radius * 0.6,
      radius * 0.8 + (frame - radius) * 0.5,
      this.cameraFocus.z + forwardZ * radius * 0.6,
    );
    const blend = smoothing(5, deltaSeconds);
    this.cameraPosition.lerp(position, this.cameraPosition.lengthSq() === 0 ? 1 : blend);
    this.cameraTarget.lerp(target, this.cameraTarget.lengthSq() === 0 ? 1 : blend);
    this.shake = Math.max(0, this.shake - deltaSeconds);
    const jitter = this.shake * this.cameraFrame * 0.25;
    this.camera.position.set(
      this.cameraPosition.x + (Math.random() - 0.5) * jitter,
      this.cameraPosition.y + (Math.random() - 0.5) * jitter,
      this.cameraPosition.z,
    );
    this.camera.lookAt(this.cameraTarget);
    const near = Math.max(0.01, radius * 0.06);
    const far = radius * 260;
    if (Math.abs(this.camera.near - near) > near * 0.05 || Math.abs(this.camera.far - far) > far * 0.05) {
      this.camera.near = near;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();
    }
    this.clearSightLine(radius);
  }

  /** Anything between the camera and the katamari steps aside, so the Prince stays in view. */
  private clearSightLine(radius: number): void {
    const from = this.camera.position;
    const toX = this.cameraFocus.x - from.x;
    const toY = radius - from.y;
    const toZ = this.cameraFocus.z - from.z;
    const length = Math.hypot(toX, toY, toZ);
    for (const prop of this.props.values()) {
      const offsetX = prop.x - from.x;
      const offsetY = prop.lift + prop.hop + prop.size - from.y;
      const offsetZ = prop.z - from.z;
      const along = (offsetX * toX + offsetY * toY + offsetZ * toZ) / length;
      let blocking = false;
      if (along > 0 && along < length - radius) {
        const closestX = offsetX - (toX / length) * along;
        const closestY = offsetY - (toY / length) * along;
        const closestZ = offsetZ - (toZ / length) * along;
        blocking = Math.hypot(closestX, closestY, closestZ) < prop.size * 1.1 + radius * 0.3;
      }
      prop.object.visible = !blocking;
    }
  }

  // ---------------------------------------------------------------- props

  private chunkSize(level: number): number {
    return BASE_RADIUS * 2 ** level * CHUNK_RADII;
  }

  /** Keep chunks of the current scale and its neighbors populated around the camera. */
  private refreshChunks(level: number): void {
    const needed = new Set<string>();
    for (const chunkLevel of [level - 1, level, level + 1]) {
      if (chunkLevel < 0) continue;
      const size = this.chunkSize(chunkLevel);
      const span = chunkLevel === level ? 2 : 1;
      const centerX = Math.floor(this.cameraFocus.x / size);
      const centerZ = Math.floor(this.cameraFocus.z / size);
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
    const deadline = performance.now() + SPAWN_BUDGET_MS;
    while (this.spawnQueue.length > 0 && performance.now() < deadline) {
      const spec = this.spawnQueue.shift();
      if (!spec || !this.chunks.has(spec.chunk) || this.takenPropIds.has(spec.id)) continue;
      this.addProp(spec.definition, spec.x, spec.z, spec.size, spec.chunk, spec.id);
    }
    for (const prop of [...this.props.values()]) {
      if (prop.chunk !== null && !needed.has(prop.chunk)) this.removeProp(prop);
      else if (prop.size < this.cameraRadius * 0.035) this.removeProp(prop);
      else if (
        prop.chunk === null &&
        Math.hypot(prop.x - this.cameraFocus.x, prop.z - this.cameraFocus.z) > this.cameraRadius * 60
      ) {
        this.removeProp(prop);
      }
    }
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

  private addProp(
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
    this.props.set(id, prop);
    return prop;
  }

  private removeProp(prop: WorldProp): void {
    this.scene.remove(prop.object);
    this.props.delete(prop.id);
  }

  private updateProps(deltaSeconds: number): void {
    const actor = this.active;
    for (const prop of this.props.values()) {
      let speed = 0;
      if (prop.motion === "walk" || prop.motion === "drive") {
        prop.wanderIn -= deltaSeconds;
        if (prop.wanderIn <= 0) {
          prop.wanderIn = 1.5 + this.random() * 4;
          prop.heading += (this.random() - 0.5) * (prop.motion === "drive" ? 0.8 : 2.4);
        }
        speed = prop.size * (prop.motion === "drive" ? 1.4 : 0.55);
        // Small things run from a katamari big enough to take them.
        if (actor && actor.phase === "stage" && prop.size <= actor.radius * PICKUP_RATIO) {
          const awayX = prop.x - actor.x;
          const awayZ = prop.z - actor.z;
          const distance = Math.hypot(awayX, awayZ);
          if (distance < actor.radius * 4) {
            prop.heading += wrapAngle(angleOf(awayX, awayZ) - prop.heading) * smoothing(5, deltaSeconds);
            speed *= 2.2;
          }
        }
        prop.x += Math.cos(prop.heading) * speed * deltaSeconds;
        prop.z += Math.sin(prop.heading) * speed * deltaSeconds;
      }
      prop.x += prop.vx * deltaSeconds;
      prop.z += prop.vz * deltaSeconds;
      const friction = 1 - smoothing(3, deltaSeconds);
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

  private puff(x: number, z: number, radius: number): void {
    const puff = this.puffs.find((candidate) => candidate.life <= 0);
    if (!puff) return;
    puff.life = 0.6;
    puff.grow = radius * 0.28;
    puff.mesh.visible = true;
    puff.mesh.position.set(
      x + (Math.random() - 0.5) * radius * 0.6,
      radius * 0.1,
      z + (Math.random() - 0.5) * radius * 0.6,
    );
  }

  private updatePuffs(deltaSeconds: number): void {
    for (const puff of this.puffs) {
      if (puff.life <= 0) continue;
      puff.life -= deltaSeconds;
      const progress = 1 - Math.max(0, puff.life) / 0.6;
      puff.mesh.scale.setScalar(puff.grow * (0.4 + progress * 0.8));
      (puff.mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - progress);
      puff.mesh.position.y += deltaSeconds * puff.grow * 0.8;
      if (puff.life <= 0) puff.mesh.visible = false;
    }
  }
}
