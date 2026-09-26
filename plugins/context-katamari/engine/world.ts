import * as THREE from "three";

import {
  clampFill,
  fillForRadius,
  hashString,
  mulberry32,
  radiusForFill,
  scaleLevel,
} from "../katamari-math";
import { type Drive, IDLE_DRIVE, isIdle } from "../controls";
import type { KatamariAudio } from "../sound";
import { quietCompactions, type StageMode } from "../stage";
import {
  type Actor,
  attach,
  createActor,
  type PopState,
  prefill,
  pruneBuried,
  setCompactions,
  showKnownCompactions,
  sortForShrink,
  stuckWorldPosition,
} from "./actor";
import { CameraRig } from "./camera-rig";
import { type CousinPose, MAX_DIZZY_STARS, poseCousin } from "./cousin";
import { createEffectMaterials, Effects } from "./effects";
import { Environment } from "./environment";
import { MaterialKit } from "./materials";
import { PropPortraits } from "./portrait";
import { PropField, type WorldProp } from "./prop-field";
import { pickWeighted, propName, propsFor } from "./props";
import {
  angleOf,
  cousinHeightFor,
  dizzinessFor,
  PICKUP_RATIO,
  smoothing,
  tininessFor,
  wrapAngle,
} from "./world-math";
import { type Zone, zoneAt } from "./zones";

export { cousinHeightFor, dizzinessFor, tininessFor } from "./world-math";

/** Props at least this big stop the ball instead of getting knocked aside. */
const OBSTACLE_RATIO = 0.95;
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
/** How often a still, hungry ball takes another mouthful. */
const IDLE_DIGEST_SECONDS = 1.4;

export interface WorldStage {
  threadId: string | null;
  mode: StageMode;
  fill: number;
  /** Null until the thread's compaction count has been read. */
  compactions: number | null;
  /** The newest compaction bb announced for the thread; a new one pops the ball. */
  compactedSeq?: number | null;
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

// Per-frame scratch, filled and used within a single call.
const rollAxis = new THREE.Vector3();
const rollTurn = new THREE.Quaternion();
const wanderPlan = { turn: 0, speed: 0 };
const pose: CousinPose = {
  stride: 0,
  speed: 0,
  idleSeconds: 0,
  waiting: false,
  time: 0,
  reach: 0,
  dizziness: 0,
  stars: 0,
};

export class KatamariWorld {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly cameraRig = new CameraRig();
  private readonly kit = new MaterialKit();
  private readonly environment: Environment;
  private readonly seed: number;
  private readonly random: () => number;
  private readonly field: PropField;
  private readonly actorCache = new Map<string, Actor>();
  private active: Actor | null = null;
  private exiting: Actor[] = [];
  private mode: StageMode = "empty";
  /** The on-stage thread's latest announced compaction and count. */
  private compacted: { seq: number | null; compactions: number | null } = {
    seq: null,
    compactions: null,
  };
  private pendingEntry: {
    threadId: string;
    fill: number;
    compactions: number | null;
    compactedSeq: number | null;
    ready: boolean;
    delay: number;
    waited: number;
  } | null = null;
  private readonly effectMaterials = createEffectMaterials();
  private readonly effects: Effects;
  private readonly portraits: PropPortraits;
  private drive: Drive = IDLE_DRIVE;
  private manualSeconds = 0;
  private lastLookOut = -10;
  private usedTokens: number | null = null;
  private time = 0;
  private hudIn = 0;
  /** The last snapshot sent to onHud; null sends the next one regardless. */
  private lastHud: HudSnapshot | null = null;
  private frame = 0;
  private lastFrameTime = 0;
  private running = false;
  private disposed = false;
  private lastFillMilestone = -1;
  private hasOrigin = false;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly audio: KatamariAudio,
    private readonly onHud: (snapshot: HudSnapshot) => void,
    private readonly onEvent: (event: WorldEvent) => void,
  ) {
    this.seed = hashString("context-katamari-world");
    this.random = mulberry32(this.seed ^ Date.now());
    this.field = new PropField(this.scene, this.kit, this.seed, this.random);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "low-power",
    });
    this.portraits = new PropPortraits(this.renderer, this.kit);
    this.scene.fog = new THREE.Fog(0xffffff, 10, 40);
    this.environment = new Environment(this.scene, this.kit, this.seed);
    this.effects = new Effects(this.scene, this.kit, this.effectMaterials);
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (width <= 0 || height <= 0) return;
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
    this.renderer.setSize(width, height, false);
    const camera = this.cameraRig.camera;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  /** The arrow keys; any press takes over from the wandering. */
  setDrive(drive: Drive): void {
    this.drive = drive;
    if (!isIdle(drive)) this.manualSeconds = MANUAL_HOLD_SECONDS;
  }


  setStage(stage: WorldStage): void {
    this.mode = stage.mode;
    this.compacted = { seq: stage.compactedSeq ?? null, compactions: stage.compactions };
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
      this.pendingEntry.compactedSeq = stage.compactedSeq ?? null;
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
      actor.compactedSeq = stage.compactedSeq ?? null;
      showKnownCompactions(this.kit, actor, stage.compactions);
      if (actor.stuck.length < 12) prefill(this.kit, actor);
      return;
    }
    actor.targetRadius = target;
    if (this.popIfCompacted(actor) || actor.pop) return;
    const quiet = quietCompactions(
      actor.compactionsKnown ? actor.compactions : null,
      stage.compactions,
    );
    if (quiet !== null) showKnownCompactions(this.kit, actor, quiet);
  }

  /**
   * Pop when bb has announced a compaction this cousin has not shown yet. A
   * pop in progress or a cousin still rolling in waits; the update loop
   * retries each frame.
   */
  private popIfCompacted(actor: Actor): boolean {
    const { seq, compactions } = this.compacted;
    if (seq === null || seq === actor.compactedSeq) return false;
    if (!actor.synced || actor.pop || actor.phase !== "stage") return false;
    actor.compactedSeq = seq;
    actor.pop = {
      time: 0,
      fromRadius: actor.radius,
      compactions: Math.max(compactions ?? 0, actor.compactions),
      burst: false,
      startScale: 1,
    };
    return true;
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
    for (const prop of this.field.props.values()) {
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
    if (strength >= 0.6) this.cameraRig.shake = Math.max(this.cameraRig.shake, 0.5);
    for (let index = 0; index < 3 + strength * 6; index += 1) this.effects.puff(actor.x, actor.z, actor.radius * 1.4);
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
      this.renderer.render(this.scene, this.cameraRig.camera);
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
      !this.effects.coinsFlying()
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
    this.field.dispose();
    this.effects.dispose();
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
    // The next cousin's first HUD reading always goes out.
    this.lastHud = null;
    if (leaving) {
      // Roll off toward screen right, the way the camera is not looking.
      const right = new THREE.Vector2(
        -Math.sin(this.cameraRig.heading),
        Math.cos(this.cameraRig.heading),
      );
      leaving.phase = "exit";
      leaving.phaseTime = 0;
      leaving.exitDirection.copy(right);
      this.exiting.push(leaving);
      this.cameraRig.frozen = true;
      this.audio.whoosh();
    }
    this.pendingEntry = {
      threadId: stage.threadId ?? "",
      fill: stage.fill,
      compactions: stage.compactions,
      compactedSeq: stage.compactedSeq ?? null,
      ready: stage.ready,
      delay: leaving ? 0.45 : 0,
      waited: 0,
    };
  }

  private spawnEntering(
    threadId: string,
    fill: number,
    compactions: number | null,
    compactedSeq: number | null,
    ready: boolean,
  ): void {
    // Switching straight back turns a departing cousin around.
    const returning = this.exiting.find((leaving) => leaving.threadId === threadId);
    if (returning) {
      this.exiting = this.exiting.filter((leaving) => leaving !== returning);
      returning.targetRadius = radiusForFill(fill);
      if (ready) showKnownCompactions(this.kit, returning, compactions);
      // Compactions announced while the cousin was away are shown, not popped.
      returning.compactedSeq = compactedSeq;
      returning.phase = "enter";
      returning.phaseTime = 0;
      this.active = returning;
      this.onEvent({ kind: "enter", threadId });
      return;
    }
    const cached = this.actorCache.get(threadId);
    this.actorCache.delete(threadId);
    cached?.items.restore();
    const actor = cached ?? createActor(this.kit, threadId, fill, compactions, ready);
    actor.targetRadius = radiusForFill(fill);
    if (cached && ready) showKnownCompactions(this.kit, actor, compactions);
    actor.compactedSeq = compactedSeq;
    // Enter from screen left and roll to where the camera is looking.
    const camera = this.cameraRig;
    const left = new THREE.Vector2(
      Math.sin(camera.heading),
      -Math.cos(camera.heading),
    );
    const distance = Math.max(actor.radius, camera.radius) * 9;
    actor.x = camera.focus.x + left.x * distance;
    actor.z = camera.focus.z + left.y * distance;
    actor.heading = angleOf(-left.x, -left.y);
    actor.phase = this.exiting.length > 0 || this.hasOrigin ? "enter" : "stage";
    actor.phaseTime = 0;
    actor.speed = 0;
    actor.vx = 0;
    actor.vz = 0;
    if (actor.phase === "stage") {
      actor.x = camera.focus.x;
      actor.z = camera.focus.z;
    }
    this.hasOrigin = true;
    this.scene.add(actor.ball, actor.rig.root, actor.ballShadow, actor.cousinShadow);
    this.active = actor;
    this.lastFillMilestone = Math.floor(clampFill(fill) * 10);
    this.onEvent({ kind: "enter", threadId });
  }

  // --------------------------------------------------------------- update

  private update(deltaSeconds: number): void {
    this.time += deltaSeconds;
    // Held keys keep the player in charge, even when setDrive is not called again.
    if (!isIdle(this.drive)) this.manualSeconds = MANUAL_HOLD_SECONDS;
    this.manualSeconds = Math.max(0, this.manualSeconds - deltaSeconds);

    if (this.pendingEntry) {
      const entry = this.pendingEntry;
      entry.delay -= deltaSeconds;
      entry.waited += deltaSeconds;
      if (entry.delay <= 0 && (entry.ready || entry.waited > READY_TIMEOUT_SECONDS)) {
        this.pendingEntry = null;
        this.spawnEntering(
          entry.threadId,
          entry.fill,
          entry.compactions,
          entry.compactedSeq,
          entry.ready,
        );
      }
    }

    const actor = this.active;
    if (actor) {
      this.popIfCompacted(actor);
      this.updateActor(actor, deltaSeconds);
    }
    for (const leaving of this.exiting) this.updateActor(leaving, deltaSeconds);
    this.retireDeparted();

    const camera = this.cameraRig;
    camera.update(deltaSeconds, this.active, this.field);
    const radius = camera.radius;
    const level = scaleLevel(radius);
    this.field.refresh(level, camera.focus, radius);
    this.field.update(deltaSeconds, actor && actor.phase === "stage" ? actor : null);
    this.effects.update(deltaSeconds);
    this.environment.update(deltaSeconds, this.time, camera.focus, radius, level, camera.camera);

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
      this.reportHud(actor, level);
    }
  }

  /** Send the HUD a snapshot, but only when something on it has changed. */
  private reportHud(actor: Actor, level: number): void {
    const zone = zoneAt(actor.x, actor.z, level, this.seed).zone;
    const hungry = actor.radius < actor.targetRadius * 0.98;
    const steering = this.manualSeconds > 0;
    const transitioning = actor.phase !== "stage" || this.exiting.length > 0;
    const last = this.lastHud;
    if (
      last !== null &&
      last.radius === actor.radius &&
      last.targetRadius === actor.targetRadius &&
      last.compactions === actor.compactions &&
      last.zone === zone &&
      last.hungry === hungry &&
      last.steering === steering &&
      last.transitioning === transitioning
    ) {
      return;
    }
    this.lastHud = {
      radius: actor.radius,
      targetRadius: actor.targetRadius,
      compactions: actor.compactions,
      zone,
      hungry,
      steering,
      transitioning,
    };
    this.onHud(this.lastHud);
  }

  /** Retire cousins that have rolled far enough away, keeping the rest in order. */
  private retireDeparted(): void {
    const exiting = this.exiting;
    const focus = this.cameraRig.focus;
    const cameraRadius = this.cameraRig.radius;
    let kept = 0;
    for (let index = 0; index < exiting.length; index += 1) {
      const leaving = exiting[index];
      const far = Math.hypot(leaving.x - focus.x, leaving.z - focus.z) >
        Math.max(leaving.radius, cameraRadius) * 14;
      if (leaving.phaseTime > 3.5 || far) this.retire(leaving);
      else exiting[kept++] = leaving;
    }
    // Trim only now: retire() reads how many were leaving before this pass.
    exiting.length = kept;
  }

  private retire(actor: Actor): void {
    this.scene.remove(actor.ball, actor.rig.root, actor.ballShadow, actor.cousinShadow);
    // Benched cousins keep their items but not the GPU copy of them.
    actor.items.release();
    this.actorCache.set(actor.threadId, actor);
    while (this.actorCache.size > ACTOR_CACHE_LIMIT) {
      const oldest = this.actorCache.keys().next().value;
      if (oldest === undefined) break;
      this.actorCache.delete(oldest);
    }
    if (this.exiting.length <= 1) this.cameraRig.frozen = false;
  }

  private updateActor(actor: Actor, deltaSeconds: number): void {
    actor.phaseTime += deltaSeconds;
    const radius = actor.radius;
    // Where the ball wants to go (world velocity) and how briskly it gets there.
    let desiredX = 0;
    let desiredZ = 0;
    let response = 3;
    let turn = 0;
    // Nothing below turns the ball before reading which way it faces.
    const facingX = Math.cos(actor.heading);
    const facingZ = Math.sin(actor.heading);

    if (actor.pop) {
      // Hold still for the pop; the show is the ball, not the roll.
      this.updatePop(actor, deltaSeconds);
    } else if (actor.phase === "exit") {
      const desired = angleOf(actor.exitDirection.x, actor.exitDirection.y);
      turn = wrapAngle(desired - actor.heading) * 4;
      desiredX = facingX * radius * 5;
      desiredZ = facingZ * radius * 5;
    } else if (actor.phase === "enter") {
      const toFocusX = this.cameraRig.focus.x - actor.x;
      const toFocusZ = this.cameraRig.focus.z - actor.z;
      const distance = Math.hypot(toFocusX, toFocusZ);
      turn = wrapAngle(angleOf(toFocusX, toFocusZ) - actor.heading) * 4;
      const speed = Math.min(radius * 4.5, distance * 2.2);
      desiredX = facingX * speed;
      desiredZ = facingZ * speed;
      if (distance < radius * 0.6 || actor.phaseTime > 3) {
        actor.phase = "stage";
        actor.phaseTime = 0;
        this.cameraRig.frozen = false;
      }
    } else if (this.manualSeconds > 0 && actor === this.active) {
      // The arrow keys always roll the ball; only the cousin's own wandering
      // waits for the thread to be working.
      const drive = this.drive;
      turn = drive.turn * TURN_RATE;
      desiredX = facingX * drive.forward * radius * MAX_PUSH_SPEED;
      desiredZ = facingZ * drive.forward * radius * MAX_PUSH_SPEED;
      // Rolling has momentum: build up speed, coast when the keys let go.
      response = isIdle(drive) ? 0.9 : 1.8;
    } else if (this.mode === "rolling") {
      const plan = this.wander(actor, deltaSeconds);
      turn = plan.turn;
      desiredX = facingX * plan.speed;
      desiredZ = facingZ * plan.speed;
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
      rollAxis.set(actor.vz, 0, -actor.vx).normalize();
      actor.roll.quaternion.premultiply(rollTurn.setFromAxisAngle(rollAxis, distance / radius));
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
    pose.stride = actor.stride;
    pose.speed = actor.speed / cousinHeight;
    pose.idleSeconds = actor.idleSeconds;
    pose.waiting = this.mode === "waiting" && actor === this.active && actor.phase === "stage";
    pose.time = this.time;
    pose.reach = reach;
    pose.dizziness = dizziness;
    pose.stars = Math.min(MAX_DIZZY_STARS, actor.compactions);
    poseCousin(actor.rig, pose);
    if (distance > 0) this.dropCoins(actor, distance, cousinX, cousinZ, cousinHeight);

    if (actor.speed > actor.radius * 0.8 && actor.random() < deltaSeconds * 10 * Math.min(2, actor.speed / actor.radius)) {
      this.effects.glint(actor.x, actor.z, actor.radius, actor.random);
    }
    if (actor.speed > actor.radius * 1.5 && actor.random() < deltaSeconds * 6) {
      this.effects.puff(cousinX, cousinZ, actor.radius);
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
        actor.seekTarget = this.field.nearestPickup(actor);
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
    const props = this.field.props;
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
        if (target && props.has(target.id)) {
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
    for (const prop of props.values()) {
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
    wanderPlan.turn = THREE.MathUtils.clamp(turn, -2.6, 2.6);
    wanderPlan.speed = speed;
    return wanderPlan;
  }

  private collide(actor: Actor): void {
    const hungry = actor.radius < actor.targetRadius * 0.995;
    const props = this.field.props;
    // Only the props here now: ones knocked loose below join the end of the map.
    let remaining = props.size;
    for (const prop of props.values()) {
      if (remaining-- <= 0) break;
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
        this.cameraRig.shake = 0.35;
        this.audio.bonk();
      }
    }
  }

  /** Katamari Damacy's crash: hit something big fast enough and items fly off. */
  private knockLoose(actor: Actor, impact: number, normalX: number, normalZ: number): void {
    const count = Math.min(actor.stuck.length - 4, 1 + Math.floor(impact / actor.radius - 2));
    if (count <= 0) return;
    const loose = actor.stuck.splice(actor.stuck.length - count, count);
    const position = new THREE.Vector3();
    for (const [index, item] of loose.entries()) {
      stuckWorldPosition(actor, item, position);
      actor.items.remove(item.object);
      const prop = this.field.add(
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
    for (const prop of this.field.props.values()) {
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
    this.field.take(prop);
    const worldDirection = new THREE.Vector3(
      prop.x - actor.x,
      prop.lift + prop.hop + prop.size * 0.5 - actor.radius,
      prop.z - actor.z,
    ).normalize();
    const local = worldDirection.applyQuaternion(actor.roll.quaternion.clone().invert());
    attach(this.kit, actor, prop.definition, prop.size, local, actor.radius * 0.84, prop.object);
    const gain = Math.max(prop.size * 0.1, (actor.targetRadius - actor.radius) * 0.14);
    actor.radius = Math.min(actor.targetRadius, actor.radius + gain);
    actor.hungrySeconds = 0;
    this.audio.pickup(prop.size / actor.radius);
    this.onEvent({
      kind: "rolledUp",
      name: propName(prop.definition),
      size: prop.size,
      image: this.portraits.get(prop.definition),
    });
    const fill = fillForRadius(actor.radius);
    const milestone = Math.floor(fill * 10);
    if (milestone > this.lastFillMilestone) {
      this.lastFillMilestone = milestone;
      this.onEvent({ kind: "pickup", fill });
    }
  }

  /** Grow when fed, shed when the thread compacts, and help a hungry ball find food. */
  private growToward(actor: Actor, deltaSeconds: number): void {
    pruneBuried(actor);

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

  private shed(actor: Actor): void {
    const shedding = sortForShrink(actor, actor.radius, actor.targetRadius);
    for (const item of shedding.slice(0, 24)) {
      actor.items.remove(item.object);
      const angle = actor.random() * Math.PI * 2;
      const prop = this.field.add(
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
      actor.items.remove(item.object);
    }
    actor.radius = actor.targetRadius;
    for (const item of actor.stuck) item.depth = Math.min(item.depth, actor.radius * 0.84);
    for (const item of actor.stuck) {
      item.object.position.setLength(item.depth - item.size * 0.4);
      actor.items.update(item.object);
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
      this.cameraRig.shake = Math.max(this.cameraRig.shake, 0.12 * progress);
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
    const flung = sortForShrink(actor, pop.fromRadius, newRadius);
    const worldPosition = new THREE.Vector3();
    for (const [index, item] of flung.entries()) {
      stuckWorldPosition(actor, item, worldPosition);
      actor.items.remove(item.object);
      if (index >= 30) continue;
      const outX = worldPosition.x - actor.x;
      const outZ = worldPosition.z - actor.z;
      const length = Math.hypot(outX, outZ) || 1;
      const prop = this.field.add(
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
      actor.items.update(item.object);
    }
    setCompactions(this.kit, actor, pop.compactions, true);
    this.effects.burst(actor.x, actor.z, pop.fromRadius, this.random);
    this.cameraRig.shake = 0.6;
    this.audio.pop();
    this.onEvent({ kind: "compacted", compactions: pop.compactions });
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
      const prop = this.field.add(
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
    if (gulp.strength >= 0.6) this.cameraRig.shake = Math.max(this.cameraRig.shake, 0.3 * bite);
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
      // Big enough to read as coins even behind a towering katamari.
      const size = Math.max(cousinHeight * 0.3, actor.radius * 0.22);
      this.effects.coin(x, cousinHeight * 0.35, z, size, actor.random);
      if (actor.random() < 0.5) this.audio.coin();
    }
  }
}
