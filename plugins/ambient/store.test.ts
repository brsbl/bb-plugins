import { afterEach, expect, it, vi } from "vitest";

import { sceneOf } from "./builtins.js";
import { DEFAULT_CONTROLS } from "./contract.js";
import type { AmbientState } from "./rpc.js";
import { fuzzyDots } from "./scenes/fuzzy-dots.js";
import { AmbientStore } from "./store.js";

afterEach(() => vi.useRealTimers());

it("keeps pending zoom when another slider changes before a slow save finishes", () => {
  vi.useFakeTimers();
  const store = new AmbientStore();
  const initial: AmbientState = {
    revision: 1,
    sceneRevision: 1,
    scene: sceneOf(fuzzyDots),
    ref: { kind: "builtIn", id: "fuzzy-dots" },
    controls: DEFAULT_CONTROLS,
  };
  const zoom = () => store.getSnapshot().state!.scene.params.find((entry) => entry.id === "size")!.value;
  store.receive(initial);
  store.setValue("size", 40);
  vi.advanceTimersByTime(2_000);
  store.setValue("fuzz", 1.1);
  expect(zoom()).toBe(40);

  // Another control's reply still has the last saved zoom.
  store.receive({ ...initial, revision: 2 });
  expect(zoom()).toBe(40);
  const acknowledged = {
    ...initial,
    revision: 3,
    scene: { ...initial.scene, params: initial.scene.params.map((entry) => entry.id === "size" ? { ...entry, value: 40 } : entry) },
  };
  store.receive(acknowledged);
  // Once acknowledged, a later edit from another window must be visible.
  store.receive({ ...acknowledged, revision: 4, scene: initial.scene });
  expect(zoom()).toBe(0.65);
});
