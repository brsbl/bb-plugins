import type { Scene } from "./contract.js";
import { contour } from "./scenes/contour.js";
import { fireflies } from "./scenes/fireflies.js";
import { jellyfishTidepool } from "./scenes/jellyfish-tidepool.js";
import { koiPond } from "./scenes/koi-pond.js";
import type { BuiltInScene } from "./scenes/param.js";
import { plasticineCove } from "./scenes/plasticine-cove.js";
import { poppyHill } from "./scenes/poppy-hill.js";
import { redAlarm } from "./scenes/red-alarm.js";
import { risographMap } from "./scenes/risograph-map.js";
import { screamingFjord } from "./scenes/screaming-fjord.js";
import { tide } from "./scenes/tide.js";

export type { BuiltInScene } from "./scenes/param.js";
export { POPPY_HILL_SOURCE } from "./scenes/poppy-hill.js";

/** In panel order. Each scene's shader and params live in its own module under scenes/. */
export const BUILT_IN_SCENES: BuiltInScene[] = [
  tide,
  fireflies,
  contour,
  risographMap,
  poppyHill,
  plasticineCove,
  screamingFjord,
  jellyfishTidepool,
  koiPond,
  redAlarm,
];

/** Whether a name refers to this built-in, including the longer names some scenes shipped with. */
export function matchesBuiltInName(builtIn: BuiltInScene, name: string): boolean {
  const wanted = name.trim().toLowerCase();
  return [builtIn.name, ...(builtIn.aliases ?? [])].some((entry) => entry.toLowerCase() === wanted);
}

export const DEFAULT_SCENE: Scene = sceneOf(BUILT_IN_SCENES[0]!);

export function sceneOf(builtIn: BuiltInScene): Scene {
  return {
    name: builtIn.name,
    source: builtIn.source,
    palette: [...builtIn.palette],
    params: builtIn.params.map((entry) => ({ ...entry })),
    baseId: builtIn.id,
  };
}

export function rebuildBuiltIn(scene: Scene): Scene {
  const builtIn = BUILT_IN_SCENES.find((entry) => entry.id === scene.baseId);
  if (!builtIn) return scene;
  const values = new Map(scene.params.map((entry) => [entry.id, entry.value]));
  return {
    ...sceneOf(builtIn),
    name: scene.name,
    palette: scene.palette,
    params: builtIn.params.map((entry) => {
      const value = values.get(entry.id);
      return value === undefined
        ? { ...entry }
        : { ...entry, value: Math.min(entry.max, Math.max(entry.min, value)) };
    }),
  };
}
