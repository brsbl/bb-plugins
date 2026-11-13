import type { BbPluginApi } from "@get-bb/plugin-sdk";

export default function prismFrame(bb: BbPluginApi) {
  const settings = bb.settings.define({
    enabled: { type: "boolean", label: "Animated frame", default: true },
    pills: { type: "boolean", label: "Theme-derived mention pills", default: true },
    motion: { type: "select", label: "Motion", options: ["still", "slow", "flowing"], default: "slow" },
    strength: { type: "select", label: "Iridescence", options: ["subtle", "balanced", "vivid"], default: "balanced" },
  });
  bb.cli.register({
    name: "prism-frame",
    summary: "Control the theme-derived shader frame and mention pills",
    commands: [
      { name: "status", summary: "Show settings", usage: "bb prism-frame status" },
      { name: "on", summary: "Enable Prism Frame", usage: "bb prism-frame on" },
      { name: "off", summary: "Restore the active theme", usage: "bb prism-frame off" },
    ],
    async run(argv) {
      const [command = "status", ...extra] = argv;
      if (extra.length || !["status", "on", "off"].includes(command)) {
        return { exitCode: 1, stderr: "Usage: bb prism-frame status|on|off. Controls: bb plugin config prism-frame set motion slow|flowing|still; set strength subtle|balanced|vivid; set pills true|false." };
      }
      if (command !== "status") await settings.experimental_set({ enabled: command === "on" });
      return { exitCode: 0, stdout: JSON.stringify(await settings.get(), null, 2) };
    },
  });
}
