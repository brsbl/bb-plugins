import * as THREE from "three";

import { BASE_RADIUS, fillForRadius } from "../katamari-math";

/** A prop sticks only when it is at most this fraction of the ball's radius. */
export const PICKUP_RATIO = 0.5;
/** Below this share of the context the Prince towers over a speck of a katamari. */
const TINY_FILL = 0.18;

export function angleOf(x: number, z: number): number {
  return Math.atan2(z, x);
}

export function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function smoothing(rate: number, deltaSeconds: number): number {
  return 1 - Math.exp(-rate * deltaSeconds);
}

/** A uniformly random unit vector, written into `target`. */
export function randomDirection(random: () => number, target: THREE.Vector3): THREE.Vector3 {
  const u = random() * 2 - 1;
  const theta = random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return target.set(s * Math.cos(theta), u, s * Math.sin(theta));
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
