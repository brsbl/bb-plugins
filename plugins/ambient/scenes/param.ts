import type { Scene, SceneParam } from "../contract.js";

export interface BuiltInScene extends Scene {
  id: string;
  /** Earlier names this scene shipped under; loads and saved states that use them still resolve. */
  aliases?: string[];
}

export function param(
  id: string,
  label: string,
  min: number,
  max: number,
  value: number,
  step = 0.01,
): SceneParam {
  return { id, label, min, max, step, value };
}
