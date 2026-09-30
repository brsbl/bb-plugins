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
  const spawns: unknown[] = [];
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
        spawn: async (args: unknown) => {
          spawns.push(args);
          await new Promise((resolve) => setTimeout(resolve, 5));
          return makeThreadResponse({ id: `thr_spawned${spawns.length}` });
        },
        update: async (args: { threadId: string; visibility?: string; sectionId?: string | null }) => {
          updates.push(args);
          return makeThreadResponse({ id: args.threadId });
        },
      },
    } as never,
  });
  await plugin(host.bb);
  return { ...host, updates, spawns };
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

  it("moves a thread between folders without showing it unless it leaves a hiding folder", async () => {
    const { harness, updates } = await setup();
    const create = async (name: string, hideFromSidebar: boolean) =>
      (await harness.callRpc("createFolder", { name, hideFromSidebar, position: null })) as { id: string };
    const first = await create("First", false);
    const second = await create("Second", false);
    const hiding = await create("Hidden", true);
    await harness.callRpc("addToFolder", { folderId: first.id, threadIds: ["thr_a"], fromFolderId: null });
    await harness.callRpc("addToFolder", { folderId: second.id, threadIds: ["thr_a"], fromFolderId: first.id });
    expect(updates.filter((update) => update.visibility !== undefined)).toEqual([]);
    await harness.callRpc("addToFolder", { folderId: hiding.id, threadIds: ["thr_a"], fromFolderId: second.id });
    expect(updates.at(-1)).toEqual({ threadId: "thr_a", visibility: "hidden" });
    await harness.callRpc("addToFolder", { folderId: first.id, threadIds: ["thr_a"], fromFolderId: hiding.id });
    expect(updates.at(-1)).toEqual({ threadId: "thr_a", visibility: "visible" });
    expect(await harness.callRpc("threadFolders", { threadId: "thr_a" })).toEqual({
      folders: [{ id: first.id, name: "First" }],
    });
  });

  it("keeps every layout and preference save when several land at once", async () => {
    const { harness } = await setup();
    const program = `app:${"p".repeat(64)}/${"i".repeat(64)}`;
    await Promise.all([
      harness.callRpc("setLayout", { entries: { "thread:thr_a": { x: 10, y: 20 } } }),
      harness.callRpc("setLayout", { entries: { "note:n1": { x: 30, y: 40 } } }),
      harness.callRpc("setPreferences", { sort: "alpha" }),
      harness.callRpc("setPreferences", { quickLaunch: [program] }),
    ]);
    await harness.callRpc("setLayout", { entries: { "note:n1": null } });
    const snapshot = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(snapshot.layout).toEqual({ "thread:thr_a": { x: 10, y: 20 } });
    expect(snapshot.preferences).toMatchObject({ sort: "alpha", quickLaunch: [program] });
  });

  it("keeps Quick Launch when a later save changes only the organization", async () => {
    const { harness } = await setup();
    await harness.callRpc("setPreferences", { quickLaunch: ["pinball"] });
    await harness.callRpc("setPreferences", { organize: "project" });
    const snapshot = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(snapshot.preferences).toMatchObject({ organize: "project", quickLaunch: ["pinball"] });
  });

  it("starts one hidden bb Explorer thread when two windows ask at once", async () => {
    const { harness, spawns } = await setup();
    const [first, second] = await Promise.all([
      harness.callRpc("browserThread", {}),
      harness.callRpc("browserThread", {}),
    ]);
    expect(spawns).toHaveLength(1);
    expect(second).toEqual(first);
    expect(await harness.callRpc("browserThread", {})).toEqual(first);
  });
});
