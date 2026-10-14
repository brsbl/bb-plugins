import { useEffect } from "react";
import { definePluginApp, useSettings } from "@get-bb/plugin-sdk/app";
import { mountFrame } from "./frame.js";

function PrismFrame() {
  const { values } = useSettings();
  const enabled = values?.enabled === true;
  const pills = values?.pills === true;
  const motion = values?.motion;
  const strength = values?.strength;
  useEffect(() => {
    if (!enabled || !["still", "slow", "flowing"].includes(String(motion)) || !["subtle", "balanced", "vivid"].includes(String(strength))) return;
    return mountFrame({ pills, speed: motion === "still" ? 0 : motion === "slow" ? 0.35 : 0.8, strength: strength === "subtle" ? 0.55 : strength === "vivid" ? 1 : 0.78 });
  }, [enabled, pills, motion, strength]);
  return null;
}

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: "prism-frame", component: PrismFrame });
});
