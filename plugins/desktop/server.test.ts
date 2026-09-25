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
  const sends: Array<{ threadId: string; text: string }> = [];
  const host = createFakePluginHost({
    pluginId: "desktop",
    sdk: {
      threadSections: {
        list: async () => [{ id: "sec_1", name: "Review", createdAt: 0, updatedAt: 0 }],
      },
      projects: { list: async () => [{ id: "proj", name: "bb" }] },
      hosts: { list: async () => [{ id: "host_1", name: "Laptop" }] },
      threads: {
        list: async (args?: { archived?: boolean }) =>
          args?.archived ? [listedThread("thr_old", { archivedAt: 5 })] : [listedThread("thr_a")],
        get: async ({ threadId }: { threadId: string }) => makeThreadResponse({ id: threadId }),
        update: async (args: { threadId: string; visibility?: string; sectionId?: string | null }) => {
          updates.push(args);
          return makeThreadResponse({ id: args.threadId });
        },
        send: async (args: { threadId: string; input: Array<{ text?: string }> }) => {
          sends.push({ threadId: args.threadId, text: args.input[0]?.text ?? "" });
          return {};
        },
      },
    } as never,
  });
  await plugin(host.bb);
  return { ...host, updates, sends };
}

describe("desktop server", () => {
  it("returns threads with their organization and no lifecycle folders", async () => {
    const { harness } = await setup();
    const snapshot = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(snapshot.folders).toEqual([]);
    expect(snapshot.sections).toEqual([{ id: "sec_1", name: "Review" }]);
    expect(snapshot.machines).toEqual([{ id: "host_1", name: "Laptop" }]);
    expect(snapshot.preferences).toEqual({ sort: "sidebar", organize: "sidebar", lifecycle: "sidebar" });
    expect(snapshot.threads.map((thread) => [thread.id, thread.isArchived, thread.hostId])).toEqual([
      ["thr_a", false, "host_1"],
      ["thr_old", true, "host_1"],
    ]);
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

  it("rejects webhook calls with a wrong secret and delivers valid ones to the bound thread", async () => {
    const { harness, sends } = await setup();
    const webhook = (await harness.callRpc("createWebhook", {
      name: "Deploys",
      threadId: "thr_a",
      position: null,
    })) as { id: string; secret: string };

    const denied = await harness.fetchHttp("POST", `/hook?id=${webhook.id}`, {
      headers: { "x-desktop-secret": "wrong" },
      body: "{}",
    });
    expect(denied.status).toBe(401);
    expect(sends).toHaveLength(0);

    const accepted = await harness.fetchHttp("POST", `/hook?id=${webhook.id}`, {
      headers: { "x-desktop-secret": webhook.secret, "content-type": "application/json" },
      body: JSON.stringify({ status: "deployed" }),
    });
    expect(accepted.status).toBe(202);
    expect(sends[0]?.threadId).toBe("thr_a");
    expect(sends[0]?.text).toContain('"status": "deployed"');

    const snapshot = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(snapshot.webhooks[0]?.unread).toBe(1);

    await harness.callRpc("markRead", { threadId: "thr_a", webhookId: null });
    const read = (await harness.callRpc("snapshot", null)) as DesktopSnapshot;
    expect(read.webhooks[0]?.unread).toBe(0);
  });
});
