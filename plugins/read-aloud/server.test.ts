import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Read Aloud plugin", () => {
  it("serves the Kokoro playback settings to the frontend", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "read-aloud" });
    plugin(bb);
    const response = await harness.fetchHttp("GET", "/settings");
    expect(await response.json()).toEqual({
      voice: "af_heart",
      speed: 1,
      device: "auto",
    });
    await harness.lifecycle.dispose();
  });
});
