import assert from "node:assert/strict";
import test from "node:test";

import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";

import sceneSeedPlugin from "./dist/server.js";

test("the built server bundle registers and serves its initial state", async (t) => {
  const host = createFakePluginHost({
    pluginId: "sceneseed",
    agentSkillIds: ["sceneseed-interpreter"],
    sdk: {
      subscribe: () => () => undefined,
    },
  });
  t.after(() => host.harness.lifecycle.dispose());

  await sceneSeedPlugin(host.bb);

  assert.deepEqual(await host.harness.callRpc("listCanvases", null), {
    canvases: [],
    disclosureAcknowledged: false,
  });
});
