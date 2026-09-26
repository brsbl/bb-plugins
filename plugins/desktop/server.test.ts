import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin, { type DesktopSnapshot } from "./server";

function listedThread(id: string, overrides: Record<string, unknown> = {}) {
  return {
    ...makeThreadResponse({ id, title: id }),
    activity: {
      activeBackgroundAgentCount: 0,
      activeBackgroundCommandCount: 0,
      activeGoalCount: 0,
    },
    environmentBranchName: null,
    environmentHostId: "host_1",
    environmentName: null,
    environmentWorkspaceDisplayKind: "checkout",
    hasPendingInteraction: false,
    pinSortKey: null,
    ...overrides,
  };
}

async function setup() {
  const updates: Array<{ threadId: string; visibility?: string; sectionId?: string | null }> = [];
  const host = createFakePluginHost({
    pluginId: "desktop",
    sdk: {
      threadSections: {
        list: async () => [{ id: "sec_1", name: "Review", createdAt: 0, updatedAt: 0 }],
      },
      projects: { list: async () => [{ id: "proj", name: "bb" }] },
      hosts: { list: async () => [{ id: "host_1", name: "Laptop" }] },
      threads: {
        list: async (args?: { archived?: boolean; includeHidden?: boolean }) =>
          args?.includeHidden
            ? [listedThread("thr_automation", { visibility: "hidden" })]
            : args?.archived ? [listedThread("thr_old", { archivedAt: 5 })] : [listedThread("thr_a")],
        get: async ({ threadId }: { threadId: string }) => makeThreadResponse({ id: threadId }),
        update: async (args: { threadId: string; visibility?: string; sectionId?: string | null }) => {
          updates.push(args);
          return makeThreadResponse({ id: args.threadId });
        },
      },
    } as never,
  });
  await plugin(host.bb);
  return { ...host, updates };
}

describe("desktop server", () => {
  it("returns threads with their organization and no lifecycle folders", async () => {
    const { harness } = await setup();
    const snapshot = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(snapshot.folders).toEqual([]);
    expect(snapshot.sections).toEqual([{ id: "sec_1", name: "Review" }]);
    expect(snapshot.machines).toEqual([{ id: "host_1", name: "Laptop" }]);
    expect(snapshot.preferences).toEqual({
      sort: "sidebar",
      organize: "sidebar",
      lifecycle: "sidebar",
      quickLaunch: ["show-desktop", "new-thread", "threads"],
    });
    expect(snapshot.threads.map((thread) => [thread.id, thread.isArchived, thread.hostId])).toEqual([
      ["thr_a", false, "host_1"],
      ["thr_old", true, "host_1"],
    ]);
  });

  it("keeps preferences saved before Quick Launch existed", async () => {
    const { harness, bb } = await setup();
    await bb.storage.kv.set("preferences", { sort: "alpha", organize: "project", lifecycle: "all" });
    const snapshot = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(snapshot.preferences).toEqual({
      sort: "alpha",
      organize: "project",
      lifecycle: "all",
      quickLaunch: ["show-desktop", "new-thread", "threads"],
    });
  });

  it("leaves out hidden threads unless a desktop folder hid them", async () => {
    const { harness } = await setup();
    const folder = (await harness.callRpc("createFolder", {
      name: "Launch",
      hideFromSidebar: true,
      position: null,
    })) as { id: string };
    await harness.callRpc("addToFolder", { folderId: folder.id, threadIds: ["thr_filed"], fromFolderId: null });
    const snapshot = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(snapshot.threads.map((thread) => thread.id).sort()).toEqual(["thr_a", "thr_filed", "thr_old"]);
  });

  it("moves threads into a real sidebar section", async () => {
    const { harness, updates } = await setup();
    await harness.callRpc("moveToSection", { threadIds: ["thr_a"], sectionId: "sec_1" });
    expect(updates.at(-1)).toMatchObject({ threadId: "thr_a", sectionId: "sec_1" });
  });

  it("hides filed threads from the sidebar and restores them only when no hiding folder holds them", async () => {
    const { harness, updates } = await setup();
    const hiding = (await harness.callRpc("createFolder", {
      name: "Launch",
      hideFromSidebar: true,
      position: null,
    })) as { id: string };
    const other = (await harness.callRpc("createFolder", {
      name: "Also hidden",
      hideFromSidebar: true,
      position: null,
    })) as { id: string };
    await harness.callRpc("addToFolder", { folderId: hiding.id, threadIds: ["thr_a"], fromFolderId: null });
    await harness.callRpc("addToFolder", { folderId: other.id, threadIds: ["thr_a"], fromFolderId: null });
    await harness.callRpc("deleteFolder", { id: hiding.id });
    expect(updates.filter((update) => update.visibility === "visible")).toEqual([]);
    await harness.callRpc("removeFromFolder", { folderId: other.id, threadId: "thr_a" });
    expect(updates.at(-1)).toEqual({ threadId: "thr_a", visibility: "visible" });
  });
});
