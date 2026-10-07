import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { createFakePluginHost, makePluginAgentConfigurationContext } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import type { SpaceSnapshot } from "./contract";
import { MEMBER_INSTRUCTION_MAX, memberInstruction } from "./model";
import plugin from "./server";

type ThreadRow = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["list"]>>[number];
interface Section {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}
interface StoredTabs {
  revision: number;
  tabs: unknown[];
}

const SPACE_TAB = {
  id: "plugin-panel:spaces%3Aspace%3A:none",
  kind: "plugin-panel",
  pluginId: "spaces",
  actionId: "space",
  title: "Space",
  paramsJson: null,
};

const running = { status: "active", runtime: { displayStatus: "active", hostReconnectGraceExpiresAt: null } } as const;

function thread(id: string, overrides: Partial<ThreadRow> = {}): ThreadRow {
  return {
    activity: {
      activeBackgroundAgentCount: 0,
      activeBackgroundCommandCount: 0,
      activeGoalCount: 0,
      activePlanModeCount: 0,
      activeWorkflowCount: 0,
    },
    archivedAt: null,
    createdAt: 1,
    deletedAt: null,
    environmentBranchName: null,
    environmentHostId: null,
    environmentId: null,
    environmentIsWorktree: null,
    environmentName: null,
    environmentPath: null,
    environmentProviderId: null,
    environmentWorkspaceDisplayKind: "other",
    hasPendingInteraction: false,
    id,
    lastReadAt: 100,
    latestAttentionAt: 100,
    lifecycleOwnerThreadId: null,
    originKind: null,
    originPluginId: null,
    parentThreadId: null,
    pinSortKey: null,
    pinnedAt: null,
    projectId: "proj_bb",
    providerId: "claude-code",
    queuedWork: "none",
    runtime: { displayStatus: "idle", hostReconnectGraceExpiresAt: null },
    sectionId: null,
    sourceThreadId: null,
    status: "idle",
    title: id,
    titleFallback: null,
    updatedAt: 100,
    visibility: "visible",
    ...overrides,
  };
}

function section(id: string, name: string): Section {
  return { id, name, createdAt: 1, updatedAt: 1 };
}

function createSpaces(options: {
  threads?: ThreadRow[];
  archived?: ThreadRow[];
  sections?: Section[];
  outputs?: Record<string, string>;
  organizer?: { version: number; inboxSectionIds: string[] };
  hiddenGroups?: string[];
} = {}) {
  const threads = new Map((options.threads ?? []).map((row) => [row.id, row]));
  const archived = options.archived ?? [];
  const sections = [...(options.sections ?? [])];
  const hidden = { value: [...(options.hiddenGroups ?? [])] };
  const tabs = new Map<string, StoredTabs>();

  const send = vi.fn<(args: { threadId: string }) => Promise<{ ok: true; delivery: "sent" | "queued" }>>(
    async () => ({ ok: true, delivery: "sent" }),
  );
  const updateTabs = vi.fn(async (args: { threadId: string; expectedRevision: number; tabs: unknown[] }) => {
    const next = { revision: args.expectedRevision + 1, tabs: args.tabs };
    tabs.set(args.threadId, next);
    return next;
  });
  const callRpc = vi.fn(async (args: { pluginId: string; method: string; input?: unknown }) => {
    if (args.pluginId === "thread-organizer") {
      if (!options.organizer) throw new Error("HTTP 404: plugin not found");
      return options.organizer;
    }
    if (args.method === "listPreferences") return { preferences: { hiddenGroups: [...hidden.value] } };
    if (args.method === "setPreference") {
      hidden.value = [...(args.input as { value: string[] }).value];
      return { key: "hiddenGroups", value: [...hidden.value] };
    }
    throw new Error(`unexpected ${args.pluginId}.${args.method}`);
  });

  const host = createFakePluginHost({
    pluginId: "spaces",
    agentSkillIds: ["spaces"],
    sdk: {
      subscribe: () => () => undefined,
      threads: {
        list: async (args) =>
          args?.archived
            ? archived.filter((row) => row.sectionId === args.sectionId).slice(0, args.limit)
            : [...threads.values()].filter((row) => row.visibility === "visible" || args?.includeHidden),
        get: async ({ threadId }) => {
          const row = threads.get(threadId) ?? archived.find((candidate) => candidate.id === threadId);
          if (!row) throw new Error(`HTTP 404: thread ${threadId} not found`);
          return row;
        },
        update: async ({ threadId, sectionId }) => {
          const row = threads.get(threadId);
          if (!row) throw new Error(`HTTP 404: thread ${threadId} not found`);
          const next = { ...row, ...(sectionId !== undefined ? { sectionId } : {}) };
          threads.set(threadId, next);
          return next;
        },
        output: async ({ threadId }) => ({ output: options.outputs?.[threadId] ?? null }),
        send,
        tabs: {
          get: async ({ threadId }) => tabs.get(threadId) ?? { revision: 0, tabs: [] },
          update: updateTabs,
        },
      },
      threadSections: {
        list: async () => sections.map((entry) => ({ ...entry })),
        create: async ({ name }) => {
          const created = section(`sec_new_${sections.length}`, name);
          sections.push(created);
          return created;
        },
      },
      projects: {
        list: async () => [
          { id: "proj_bb", name: "bb" },
          { id: "proj_site", name: "site" },
        ],
      },
      plugins: { callRpc: callRpc as never, list: async () => ({ plugins: [] }) },
    },
  });
  plugin(host.bb);
  return { ...host, threads, hidden, tabs, send, updateTabs, callRpc };
}

describe("Spaces server", () => {
  it("groups members the way the sidebar reads them and rolls up their subthreads", async () => {
    const content = "sec_content";
    const spaces = createSpaces({
      sections: [section(content, "Content"), section("sec_other", "Other")],
      threads: [
        thread("thr_new", { sectionId: content, lastReadAt: 1 }),
        thread("thr_working", { sectionId: content, ...running, lastReadAt: 1, latestAttentionAt: 110, updatedAt: 110 }),
        thread("thr_failed", { sectionId: content, status: "error", lastReadAt: 1, latestAttentionAt: 120, updatedAt: 120, projectId: "proj_site" }),
        thread("thr_asking", { sectionId: content, hasPendingInteraction: true, updatedAt: 130 }),
        thread("thr_idle", { sectionId: content, latestAttentionAt: 90, updatedAt: 90, titleFallback: "Draft the launch post" }),
        thread("thr_read_failure", { sectionId: content, status: "error", latestAttentionAt: 80, updatedAt: 80 }),
        thread("thr_sub", { sectionId: content, parentThreadId: "thr_new", ...running }),
        thread("thr_hidden", { sectionId: content, visibility: "hidden" }),
        thread("thr_elsewhere", { sectionId: "sec_other" }),
      ],
      archived: [thread("thr_done", { sectionId: content, archivedAt: 50, updatedAt: 50 })],
      outputs: { thr_new: "## Done\nShipped the **draft**." },
    });
    const { behavior } = spaces.harness;

    await behavior.callRpc("makeSpace", { sectionId: content });
    const snapshot = (await behavior.callRpc("snapshot", { sectionId: content })) as SpaceSnapshot;

    expect(snapshot.members.map((member) => [member.id, member.group])).toEqual([
      ["thr_asking", "needs-you"],
      ["thr_failed", "needs-you"],
      ["thr_working", "working"],
      ["thr_new", "new"],
      ["thr_idle", "idle"],
      ["thr_read_failure", "idle"],
      ["thr_done", "archived"],
    ]);
    const byId = new Map(snapshot.members.map((member) => [member.id, member]));
    expect(byId.get("thr_new")).toMatchObject({
      isUnread: true,
      excerpt: "Done Shipped the draft.",
      firstPrompt: null,
      subthreads: { total: 1, working: 1, needsYou: 0 },
    });
    expect(byId.get("thr_working")).toMatchObject({ isUnread: true, running: true });
    expect(byId.get("thr_failed")).toMatchObject({ failed: true, isUnread: true, projectName: "site" });
    expect(byId.get("thr_idle")).toMatchObject({ excerpt: null, firstPrompt: "Draft the launch post" });
    expect(byId.get("thr_read_failure")).toMatchObject({ failed: true, isUnread: false });
    expect(snapshot.projects).toEqual(["bb", "site"]);
    expect(snapshot.organizer).toBe("absent");
    await spaces.harness.lifecycle.dispose();
  });

  it("adds the Space tab to members that lack it and retries a tab revision conflict", async () => {
    const content = "sec_content";
    const spaces = createSpaces({
      sections: [section(content, "Content")],
      threads: [thread("thr_a", { sectionId: content }), thread("thr_b", { sectionId: content })],
    });
    spaces.tabs.set("thr_b", { revision: 4, tabs: [SPACE_TAB] });
    spaces.updateTabs.mockRejectedValueOnce(
      Object.assign(new Error("HTTP 409: Thread tabs changed on another client"), { status: 409, code: "thread_tabs_conflict" }),
    );

    await spaces.harness.behavior.callRpc("makeSpace", { sectionId: content });
    await vi.waitFor(() => expect(spaces.updateTabs).toHaveBeenCalledTimes(2));
    await spaces.harness.lifecycle.dispose();

    expect(spaces.updateTabs.mock.calls.map(([args]) => args.threadId)).toEqual(["thr_a", "thr_a"]);
    expect(spaces.tabs.get("thr_a")).toEqual({ revision: 1, tabs: [SPACE_TAB] });
    expect(spaces.harness.inspection.realtimeSignals).toContainEqual({ channel: "spaces", payload: { sectionIds: [content] } });
  });

  it("refuses to make a Thread Organizer inbox a Space", async () => {
    const spaces = createSpaces({
      sections: [section("sec_inbox", "Agent Inbox"), section("sec_content", "Content")],
      threads: [thread("thr_a", { sectionId: "sec_inbox" })],
      organizer: { version: 1, inboxSectionIds: ["sec_inbox"] },
    });
    const { behavior } = spaces.harness;

    await expect(behavior.callRpc("makeSpace", { sectionId: "sec_inbox" })).rejects.toThrow(/Thread Organizer inbox/);
    expect(await behavior.callRpc("listSpaceSectionIds", null)).toEqual({ sectionIds: [] });
    expect(await behavior.callRpc("panelState", { threadId: "thr_a" })).toEqual({
      kind: "outside",
      section: { id: "sec_inbox", name: "Agent Inbox", eligible: false, hasEntryPrompt: false },
      spaces: [],
      isSubthread: false,
    });

    const first = await behavior.callRpc("makeSpace", { sectionId: "sec_content" });
    expect(await behavior.callRpc("makeSpace", { sectionId: "sec_content" })).toEqual(first);
    expect(await behavior.callRpc("listSpaceSectionIds", null)).toEqual({ sectionIds: ["sec_content"] });
    await spaces.harness.lifecycle.dispose();
  });

  it("only puts a Space back into More after bringing it out itself", async () => {
    const spaces = createSpaces({
      sections: [section("sec_a", "A"), section("sec_b", "B"), section("sec_plain", "Plain")],
      hiddenGroups: ["section:sec_a", "project:proj_bb", "section:sec_plain"],
    });
    const { behavior } = spaces.harness;
    await behavior.callRpc("makeSpace", { sectionId: "sec_a" });
    await behavior.callRpc("makeSpace", { sectionId: "sec_b" });
    const visibility = (sectionId: string, show: boolean) => behavior.callRpc("setSidebarVisibility", { sectionId, show });
    const writes = () => spaces.callRpc.mock.calls.filter(([args]) => args.method === "setPreference").length;

    expect(await visibility("sec_a", true)).toEqual({ changed: true });
    expect(spaces.hidden.value).toEqual(["project:proj_bb", "section:sec_plain"]);

    // B was already in the sidebar, so it isn't Spaces' to put away.
    expect(await visibility("sec_b", true)).toEqual({ changed: false });
    expect(await visibility("sec_b", false)).toEqual({ changed: false });
    // Not a Space at all.
    expect(await visibility("sec_plain", true)).toEqual({ changed: false });
    expect(writes()).toBe(1);

    expect(await visibility("sec_a", false)).toEqual({ changed: true });
    expect(spaces.hidden.value).toEqual(["project:proj_bb", "section:sec_plain", "section:sec_a"]);
    expect(await visibility("sec_a", false)).toEqual({ changed: false });

    // Calls run one at a time, so a quick out-and-back still lands in order.
    expect(await Promise.all([visibility("sec_a", true), visibility("sec_a", false)])).toEqual([
      { changed: true },
      { changed: true },
    ]);
    expect(spaces.hidden.value).toEqual(["project:proj_bb", "section:sec_plain", "section:sec_a"]);
    expect(writes()).toBe(4);
    await spaces.harness.lifecycle.dispose();
  });

  it("tells every selected thread as the user and reports each one, even when one fails", async () => {
    const spaces = createSpaces();
    spaces.send.mockImplementation(async ({ threadId }) => {
      if (threadId === "thr_b") throw new Error("Thread not found");
      return { ok: true, delivery: threadId === "thr_c" ? "queued" : "sent" };
    });

    expect(await spaces.harness.behavior.callRpc("tell", { threadIds: ["thr_a", "thr_b", "thr_c"], message: "Ship it" })).toEqual({
      results: [
        { threadId: "thr_a", ok: true, queued: false, error: null },
        { threadId: "thr_b", ok: false, queued: false, error: "Thread not found" },
        { threadId: "thr_c", ok: true, queued: true, error: null },
      ],
    });
    expect(spaces.send).toHaveBeenCalledTimes(3);
    for (const [args] of spaces.send.mock.calls) {
      expect(args).toMatchObject({ mode: "queue-if-active", input: [{ type: "text", text: "Ship it", mentions: [] }] });
      expect(args).not.toHaveProperty("senderThreadId");
    }
    await spaces.harness.lifecycle.dispose();
  });

  it("prints one line per member for bb space status and asks which Space when a name matches two", async () => {
    const spaces = createSpaces({
      sections: [section("sec_content", "Content"), section("sec_dup", "content")],
      threads: [
        thread("thr_asking", { sectionId: "sec_content", title: "Plugins blog post", hasPendingInteraction: true, updatedAt: 130 }),
        thread("thr_idle", { sectionId: "sec_content", title: "Comparison pages", updatedAt: 90 }),
      ],
      outputs: { thr_asking: "Which **headline** should I use?" },
    });
    const { behavior } = spaces.harness;
    await behavior.callRpc("makeSpace", { sectionId: "sec_content" });
    await behavior.callRpc("makeSpace", { sectionId: "sec_dup" });

    const ambiguous = await behavior.runCli(["status", "Content"]);
    expect(ambiguous.exitCode).toBe(1);
    expect(ambiguous.stderr).toContain('"Content" matches 2 Spaces');

    const status = await behavior.runCli(["status", "sec_content"]);
    expect(status.exitCode).toBe(0);
    expect(status.stdout).toBe([
      "Content · sec_content · 2 threads · bb",
      "thr_asking · needs you · Plugins blog post — Which headline should I use?",
      "thr_idle · idle · Comparison pages — no output yet",
      "",
    ].join("\n"));
    expect((await behavior.runCli(["list"])).stdout).toContain("Content · sec_content · 2 threads");
    await spaces.harness.lifecycle.dispose();
  });

  it("gives each member one short line about its Space while the setting is on", async () => {
    expect(memberInstruction({ name: "Content", sectionId: "sec_content" }, 8)).toBe(
      'This thread is in the Space "Content" with 8 other threads. Run `bb space status "Content"` to see their status and latest output. To message one, use `bb thread tell <id> --mode queue`. Don\'t send status pings.',
    );
    const long = memberInstruction({ name: "Quarterly launch planning ".repeat(6), sectionId: "sec_long" }, 1);
    expect(long.length).toBeLessThanOrEqual(MEMBER_INSTRUCTION_MAX);
    expect(long).toContain("with 1 other thread.");
    expect(long).toContain("`bb space status sec_long`");

    const content = "sec_content";
    const spaces = createSpaces({
      sections: [section(content, "Content")],
      threads: [
        thread("thr_a", { sectionId: content }),
        thread("thr_b", { sectionId: content }),
        thread("thr_c", { sectionId: content }),
        thread("thr_outside"),
      ],
    });
    const { behavior } = spaces.harness;
    await behavior.callRpc("makeSpace", { sectionId: content });
    const configure = (threadId: string) =>
      behavior.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: threadId } }));

    const member = await configure("thr_a");
    expect(member.skills).toEqual(["spaces"]);
    expect(member.instructions).toBe(memberInstruction({ name: "Content", sectionId: content }, 2));
    expect((await configure("thr_outside")).instructions).toBeNull();

    await behavior.setSettings({ membersKnowSpace: false });
    const quiet = await configure("thr_a");
    expect(quiet.instructions).toBeNull();
    expect(quiet.skills).toEqual(["spaces"]);
    await spaces.harness.lifecycle.dispose();
  });
});
