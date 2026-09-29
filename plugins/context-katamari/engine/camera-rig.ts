import * as THREE from "three";

import { BASE_RADIUS } from "../katamari-math";
import type { Actor } from "./actor";
import type { WorldProp } from "./prop-field";
import { smoothing, tininessFor, wrapAngle } from "./world-math";

/**
 * The follow camera: close behind the on-stage Prince the way the PS2 game
 * frames him, pulled back to fit him while he towers over a speck of a ball,
 * shaken by bumps and pops, and clearing props out of its line of sight.
 */
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(55, 4 / 3, 0.05, 200);
  /** The ground point the camera trails: the on-stage ball. */
  readonly focus = new THREE.Vector3();
  /** Held in place while one cousin rolls off and the next rolls in. */
  frozen = false;
  /** Screen shake, fading by one per second. */
  shake = 0;
  private followHeading = 0;
  private followRadius = BASE_RADIUS;
  /** How much the camera pulls back: the ball, or the Prince when he towers over it. */
  private frame = BASE_RADIUS;
  private readonly position = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredTarget = new THREE.Vector3();

  /** The way the camera faces across the ground. */
  get heading(): number {
    return this.followHeading;
  }

  /** The ball size the camera frames, easing toward the on-stage ball's. */
  get radius(): number {
    return this.followRadius;
  }

  update(deltaSeconds: number, actor: Actor | null, props: ReadonlyMap<string, WorldProp>): void {
    const followRadius = actor?.radius ?? this.followRadius;
    this.followRadius += (followRadius - this.followRadius) * smoothing(1.6, deltaSeconds);
    // A towering Prince over a tiny ball needs the camera further back to fit him in.
    const followFrame = actor ? Math.max(actor.radius, actor.rig.root.scale.y * 0.42) : this.frame;
    this.frame += (followFrame - this.frame) * smoothing(1.6, deltaSeconds);
    const tininess = tininessFor(this.followRadius);
    if (actor && !this.frozen && actor.phase === "stage") {
      this.focus.x += (actor.x - this.focus.x) * smoothing(7, deltaSeconds);
      this.focus.z += (actor.z - this.focus.z) * smoothing(7, deltaSeconds);
      // The camera swings with the Prince, as it does in the game.
      this.followHeading += wrapAngle(actor.heading - this.followHeading) * smoothing(3.2, deltaSeconds);
    }
    const radius = this.followRadius;
    const forwardX = Math.cos(this.followHeading);
    const forwardZ = Math.sin(this.followHeading);
    // The PS2 framing: close behind the Prince, who stands big at the
    // bottom of the screen with the katamari just above center. While the
    // ball is a speck, swing round to a three-quarter view so the giant
    // Prince and his tiny katamari are both in the shot.
    const frame = this.frame;
    const swing = this.followHeading - 1.15 * tininess;
    const position = this.desiredPosition.set(
      this.focus.x - Math.cos(swing) * frame * 3.9,
      frame * 2.7,
      this.focus.z - Math.sin(swing) * frame * 3.9,
    );
    const target = this.desiredTarget.set(
      this.focus.x + forwardX * radius * 0.6,
      radius * 0.8 + (frame - radius) * 0.5,
      this.focus.z + forwardZ * radius * 0.6,
    );
    const blend = smoothing(5, deltaSeconds);
    this.position.lerp(position, this.position.lengthSq() === 0 ? 1 : blend);
    this.target.lerp(target, this.target.lengthSq() === 0 ? 1 : blend);
    this.shake = Math.max(0, this.shake - deltaSeconds);
    const jitter = this.shake * this.frame * 0.25;
    this.camera.position.set(
      this.position.x + (Math.random() - 0.5) * jitter,
      this.position.y + (Math.random() - 0.5) * jitter,
      this.position.z,
    );
    this.camera.lookAt(this.target);
    const near = Math.max(0.01, radius * 0.06);
    const far = radius * 260;
    if (Math.abs(this.camera.near - near) > near * 0.05 || Math.abs(this.camera.far - far) > far * 0.05) {
      this.camera.near = near;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();
    }
    this.clearSightLine(radius, props);
  }

  /** Anything between the camera and the katamari steps aside, so the Prince stays in view. */
  private clearSightLine(radius: number, props: ReadonlyMap<string, WorldProp>): void {
    const from = this.camera.position;
    const toX = this.focus.x - from.x;
    const toY = radius - from.y;
    const toZ = this.focus.z - from.z;
    const length = Math.hypot(toX, toY, toZ);
    for (const prop of props.values()) {
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
}
