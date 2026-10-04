import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import { connectionScope, openBrowser } from "./browser";
import { ConnectionSchema } from "./model";

const dispose: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of dispose.splice(0)) await cleanup(); });

const connection = ConnectionSchema.parse({
  id: "gmail", name: "Gmail", url: "https://mail.google.com/", browserHostId: "host_browser",
});

describe("digest browser ownership", () => {
  it.each([
    { saved: "desktop_old", live: ["desktop_new"], expected: "desktop_new" },
    { saved: "desktop_selected", live: ["desktop_other", "desktop_selected"], expected: "desktop_selected" },
    { saved: "desktop_old", live: ["desktop_a", "desktop_b"], expected: null },
  ])("resolves a restarted browser safely: $saved -> $live", async ({ saved, live, expected }) => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "digests",
      sdk: { experimental_desktopBrowsers: {
        listInstances: async () => ({ instances: live.map((instanceId) => ({ instanceId, generation: "current_generation" })) }),
      } },
    });
    dispose.push(() => harness.lifecycle.dispose());
    const result = connectionScope(bb, { ...connection, desktopInstanceId: saved }, "thr_issue");
    if (expected) await expect(result).resolves.toEqual({
      hostId: "host_browser", instanceId: expected, generation: "current_generation", threadId: "thr_issue",
    });
    else await expect(result).rejects.toMatchObject({ status: "unavailable", recovery: "retry" });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.listInstances")).toEqual([[{ hostId: "host_browser" }]]);
  });

  it("closes an old isolated-profile tab before automation can control or navigate it", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "digests",
      sdk: {
        experimental_desktopBrowsers: {
          listInstances: async () => ({ instances: [{ instanceId: "desktop_1", generation: "generation_1" }] }),
          createTab: async () => ({ tab: { tabId: "tab_old", profile: "automation:old" } }),
          closeTab: async () => ({ ok: true }),
        },
      },
    });
    dispose.push(() => harness.lifecycle.dispose());

    await expect(openBrowser(bb, connection, "thr_issue")).rejects.toMatchObject({
      status: "upgrade-required", recovery: "upgrade", message: expect.stringContaining("Update bb"),
    });

    expect(harness.inspection.sdk.calls.map(({ path }) => path)).toEqual([
      "experimental_desktopBrowsers.listInstances",
      "experimental_desktopBrowsers.createTab",
      "experimental_desktopBrowsers.closeTab",
    ]);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")[0]?.[0]).toMatchObject({
      threadId: "thr_issue", url: "about:blank", presentation: "hidden",
    });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab")[0]?.[0]).toMatchObject({
      threadId: "thr_issue", tabId: "tab_old",
    });
  });

  it("reports an unavailable desktop without borrowing a tab or attempting cookie import", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "digests",
      sdk: { experimental_desktopBrowsers: { listInstances: async () => ({ instances: [] }) } },
    });
    dispose.push(() => harness.lifecycle.dispose());

    await expect(openBrowser(bb, connection, "thr_issue")).rejects.toMatchObject({
      status: "unavailable", recovery: "retry", message: expect.stringContaining("Open bb"),
    });
    expect(harness.inspection.sdk.calls.map(({ path }) => path)).toEqual(["experimental_desktopBrowsers.listInstances"]);
  });
});
