import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin, { devGoogleEndpoints } from "./server";

describe("Calendar plugin", () => {
  it("loads with its CLI", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "calendar" });
    plugin(bb);
    expect(harness.inspection.registrations.cli?.name).toBe("calendar");
    expect(harness.inspection.registrations.services.map((service) => service.name)).toEqual(["sync"]);
    await harness.lifecycle.dispose();
  });

  it("only reads a fake Google over loopback", () => {
    expect(devGoogleEndpoints("http://127.0.0.1:47812")).toEqual({ apiBase: "http://127.0.0.1:47812/calendar/v3", tokenUrl: "http://127.0.0.1:47812/token" });
    expect(devGoogleEndpoints("https://evil.example")).toBeUndefined();
    expect(devGoogleEndpoints(undefined)).toBeUndefined();
  });
});
