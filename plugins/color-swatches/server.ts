import type { BbPluginApi } from "@get-bb/plugin-sdk";

/**
 * All of the behaviour lives in the frontend content script; a plugin still
 * needs a backend entry, so this one only announces itself.
 */
export default async function plugin(bb: BbPluginApi) {
  bb.log.info("color-swatches ready");
}
