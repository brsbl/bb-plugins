import type { BbPluginApi } from "@get-bb/plugin-sdk";

export default function plugin(bb: BbPluginApi): void {
  bb.log.info("Endless loaded");
}
