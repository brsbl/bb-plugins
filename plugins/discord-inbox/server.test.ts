import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin, { devDiscordApi, insertAfter } from "./server";

describe("Discord plugin", () => {
  it("loads with its CLI", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "discord-inbox" });
    plugin(bb);
    expect(harness.inspection.registrations.cli?.name).toBe("discord-inbox");
    expect(harness.inspection.registrations.services.map((service) => service.name)).toEqual(["poll"]);
    await harness.lifecycle.dispose();
  });

  it("only reads a fake Discord over loopback", () => {
    expect(devDiscordApi("http://127.0.0.1:47813")).toBe("http://127.0.0.1:47813/api/v10");
    expect(devDiscordApi("https://evil.example")).toBeUndefined();
    expect(devDiscordApi(undefined)).toBeUndefined();
  });

  it("goes right after Calendar, before anything installed later or earlier, or first without Calendar", () => {
    const calendar = "section:cal";
    expect(insertAfter([calendar, "section:email", "pinned"], "section:discord", (entry) => entry === calendar)).toEqual([calendar, "section:discord", "section:email", "pinned"]);
    expect(insertAfter(["section:email", "pinned"], "section:discord", (entry) => entry === calendar)).toEqual(["section:discord", "section:email", "pinned"]);
  });
});
