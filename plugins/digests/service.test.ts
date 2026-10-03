import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublishInputSchema, type Issue } from "./model";
import { createService } from "./service";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 12, 18);
const dispose: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of dispose.splice(0)) await cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function setup() {
  let signIn = { signedIn: true, signedOut: false };
  let tabCount = 0;
  let deliveryCount = 0;
  const threads = new Map<string, ReturnType<typeof makeThreadResponse>>();
  const request = vi.fn(async (url: string, init?: RequestInit) => {
    expect(url).toBe("http://127.0.0.1:38886/api/v1/plugins/thread-organizer/cli");
    expect(JSON.parse(String(init?.body))).toMatchObject({ argv: ["phase", "digests"], projectId: "proj_digest" });
    return new Response(JSON.stringify({ exitCode: 0, stdout: "", stderr: "" }), { status: 200 });
  });
  vi.stubGlobal("fetch", request);
  const { bb, harness } = createFakePluginHost({
    pluginId: "digests",
    sdk: {
      threads: {
        get: async ({ threadId }) => threads.get(threadId) ?? makeThreadResponse({ id: threadId, projectId: "proj_digest" }),
        update: async () => ({ ok: true }),
        markUnread: async () => ({ ok: true }),
        send: async () => ({ ok: true }),
        archive: async () => ({ ok: true }),
        spawn: async () => ({ id: `thr_delivery_${++deliveryCount}` }),
      },
      experimental_desktopBrowsers: {
        listInstances: async () => ({ instances: [{ instanceId: "desktop_1", generation: "generation_1" }] }),
        createTab: async () => ({ tab: { tabId: `tab_${++tabCount}` } }),
        closeTab: async () => ({ ok: true }),
      },
      plugins: {
        callRpc: async ({ pluginId, method, input, outputSchema }) => {
          let result: unknown;
          if (pluginId === "thread-organizer" && method === "getConfig") {
            result = { version: 1, revision: 1, stages: [{ key: "digests", title: "Digests", role: "stage", rule: "Private briefings.", sectionId: "section_digests", clearFromInboxAfterRead: true }] };
          } else if (pluginId === "browser-automation" && method === "open") {
            const selection = (input as { selection: { tabId: string } }).selection;
            result = { id: `session_${selection.tabId}` };
          } else if (pluginId === "browser-automation" && method === "run") {
            result = { text: `DIGEST_CONNECTION:${JSON.stringify(signIn)}`, exitCode: 0 };
          } else if (pluginId === "browser-automation" && method === "close") {
            result = { ok: true };
          } else if (pluginId === "automations" && ["automations_create", "automations_pause", "automations_resume"].includes(method)) {
            result = { id: "auto_digest_new", enabled: method === "automations_resume", nextRunAt: null };
          } else if (pluginId === "automations" && method === "automations_runs") {
            result = { runs: [], nextCursor: null };
          } else {
            throw new Error(`Unexpected cross-plugin request: ${pluginId}/${method}`);
          }
          return outputSchema.parse(result);
        },
      },
    },
  });
  dispose.push(() => harness.lifecycle.dispose());
  const service = createService(bb);
  service.store.definitions.put({
    id: "reading", name: "Reading", projectId: "proj_digest", instructions: "Read newsletters without changing Gmail.",
    connectionIds: ["gmail"], schedule: { cron: "0 11 * * 0", timezone: "America/Los_Angeles" },
    providerId: "codex", model: "model-test", createdAt: NOW,
  });
  service.store.connections.put({ id: "gmail", name: "Gmail", url: "https://mail.google.com/", browserHostId: "host_browser" });
  return { bb, harness, service, threads, request, setSignIn: (value: typeof signIn) => { signIn = value; } };
}

const payload = () => PublishInputSchema.parse({
  headline: "One worthwhile read", metrics: [{ label: "Newsletters", value: "1" }],
  details: "A useful product essay, summarized from its preview snippet.",
  sources: [{ connectionId: "gmail", messageId: "message_1" }],
});

describe("digest issue lifecycle", () => {
  it("begins with fresh issue-owned tabs and trusts only a positive sign-in marker", async () => {
    const { service, harness, setSignIn } = setup();
    const first = await service.begin("reading", "thr_first");
    expect(first).toMatchObject({ complete: false, issue: { state: "collecting", threadId: "thr_first" } });
    expect(first.sessions[0]).toMatchObject({ threadId: "thr_first", tabId: "tab_1", sessionId: "session_tab_1" });
    expect(service.store.connections.get("gmail")).toMatchObject({ status: "signed-in", detail: null });

    setSignIn({ signedIn: false, signedOut: false });
    const challenged = await service.begin("reading", "thr_second");
    expect(challenged).toMatchObject({ complete: true, sessions: [], issue: { state: "failed", recovery: "reconnect" } });
    expect(service.store.connections.get("gmail")?.status).toBe("expired");
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab").map(([value]) => value)).toEqual([
      expect.objectContaining({ threadId: "thr_first", url: "about:blank" }),
      expect.objectContaining({ threadId: "thr_second", url: "about:blank" }),
    ]);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab")[0]?.[0]).toMatchObject({ threadId: "thr_second", tabId: "tab_2" });
    await expect(service.publishCurrent("thr_second", payload())).rejects.toThrow("failed its connection check");
  });

  it("publishes only the calling thread's issue and declared sources, then releases its browser", async () => {
    const { bb, service, harness } = setup();
    const started = await service.begin("reading", "thr_owner");
    await expect(service.publishCurrent("thr_other", payload())).rejects.toThrow("does not belong");
    await expect(service.publishCurrent("thr_owner", { ...payload(), sources: [{ connectionId: "linkedin", messageId: "m1" }] })).rejects.toThrow("declared connections");
    expect(service.store.processed("reading", "gmail", ["message_1"])).toEqual([]);
    const published = await service.publishCurrent("thr_owner", payload());
    expect(published.issue).toMatchObject({ id: started.issue.id, state: "ready", threadId: "thr_owner" });
    expect(service.store.processed("reading", "gmail", ["message_1"])).toEqual(["message_1"]);
    expect(await bb.storage.kv.list()).toEqual([]);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab")[0]?.[0]).toMatchObject({ threadId: "thr_owner", tabId: "tab_1" });
    expect(harness.inspection.sdk.callsTo("threads.markUnread")).toEqual([[{ threadId: "thr_owner" }]]);
    expect(harness.inspection.sdk.calls.some(({ path }) => /storage|filesystem|files\./u.test(path))).toBe(false);
    expect(service.store.issues.get(started.issue.id)?.details).toBe(payload().details);
  });

  it("retries a failed issue in the same thread without consuming sources or creating another issue", async () => {
    const { service, harness, setSignIn } = setup();
    setSignIn({ signedIn: false, signedOut: true });
    const failed = await service.begin("reading", "thr_retry");
    expect(failed.issue).toMatchObject({ state: "failed", recovery: "reconnect" });
    await expect(service.retry("thr_intruder", failed.issue.id)).rejects.toThrow("does not belong");
    await expect(service.retry("thr_retry", failed.issue.id)).resolves.toEqual({ threadId: "thr_retry" });
    expect(harness.inspection.sdk.callsTo("threads.send")[0]?.[0]).toMatchObject({ threadId: "thr_retry", input: [{ type: "text", text: expect.stringContaining("digest_begin") }] });
    setSignIn({ signedIn: true, signedOut: false });
    const retried = await service.begin("reading", "thr_retry");
    expect(retried.issue.id).toBe(failed.issue.id);
    expect(retried.sessions[0]?.tabId).toBe("tab_2");
    expect(service.store.issues.list()).toHaveLength(1);
    expect(service.store.processed("reading", "gmail", ["message_1"])).toEqual([]);
    expect(harness.inspection.sdk.callsTo("threads.spawn")).toEqual([]);
  });

  it("creates one searchable thread for repeated external publication with the same key", async () => {
    const { service, harness } = setup();
    const [first, second] = await Promise.all([
      service.publishExternal("reading", payload(), "week-2026-41"),
      service.publishExternal("reading", payload(), "week-2026-41"),
    ]);
    expect(second.issue).toEqual(first.issue);
    expect(first.issue).toMatchObject({ state: "ready", threadId: "thr_delivery_1", dedupeKey: "week-2026-41" });
    expect(harness.inspection.sdk.callsTo("threads.spawn")).toHaveLength(1);
    expect(harness.inspection.sdk.callsTo("threads.spawn")[0]?.[0]).toMatchObject({
      projectId: "proj_digest", title: expect.stringContaining("Reading ·"), prompt: expect.stringContaining(payload().details),
    });
    expect(service.store.issues.list()).toHaveLength(1);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toEqual([]);
  });

  it("archives only read and settled issues after seven days, preserving unread and running threads", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service, harness, threads } = setup();
    function add(id: string, state: "idle" | "error" | "active", readAt: number | null, latestAttentionAt: number, lastReadAt: number | null, archivedAt: number | null = null) {
      const issue: Issue = service.store.issues.create({
        id, digestId: "reading", threadId: `thr_${id}`, headline: "A digest", createdAt: NOW - 10 * DAY, readAt,
      });
      threads.set(issue.threadId!, makeThreadResponse({
        id: issue.threadId!, projectId: "proj_digest", status: state, lastReadAt, latestAttentionAt, archivedAt, deletedAt: null,
      }));
    }
    add("old_read", "idle", NOW - 8 * DAY, NOW - 9 * DAY, NOW - 8 * DAY);
    add("old_error", "error", NOW - 8 * DAY, NOW - 9 * DAY, NOW - 8 * DAY);
    add("unread", "idle", NOW - 8 * DAY, NOW - DAY, NOW - 8 * DAY);
    add("running", "active", NOW - 8 * DAY, NOW - 9 * DAY, NOW - 8 * DAY);
    add("recent", "idle", NOW - DAY, NOW - 9 * DAY, NOW - DAY);
    add("archived", "idle", NOW - 8 * DAY, NOW - 9 * DAY, NOW - 8 * DAY, NOW - DAY);
    await service.reconcile();
    expect(harness.inspection.sdk.callsTo("threads.archive").map(([arg]) => arg)).toEqual([
      { threadId: "thr_old_error" }, { threadId: "thr_old_read" },
    ]);
    expect(service.store.issues.get("unread")?.readAt).toBeNull();
    expect(service.store.issues.get("running")?.readAt).toBeNull();
    expect(service.store.issues.get("recent")?.readAt).toBe(NOW - DAY);
  });

  it("creates a disabled replacement and enables only its own automation", async () => {
    const { service, harness } = setup();
    await service.ensureAutomation(service.requiredDefinition("reading"));
    const enabled = await service.setEnabled("reading", true);
    await service.setEnabled("reading", false);
    expect(enabled.automationId).toBe("auto_digest_new");
    const calls = harness.inspection.sdk.callsTo("plugins.callRpc").map(([value]) => value as { pluginId: string; method: string; input: Record<string, unknown> });
    const automationCalls = calls.filter(({ pluginId }) => pluginId === "automations");
    expect(automationCalls.map(({ method }) => method)).toEqual(["automations_create", "automations_resume", "automations_pause"]);
    expect(automationCalls[0]?.input).toMatchObject({ enabled: false, execution: { mode: "agent" }, trigger: { cron: "0 11 * * 0" } });
    expect(automationCalls[0]?.input.execution).not.toHaveProperty("targetThreadId");
    expect(automationCalls.slice(1).map(({ input }) => input.automationId)).toEqual(["auto_digest_new", "auto_digest_new"]);
    expect(JSON.stringify(automationCalls.map(({ input }) => input))).not.toMatch(/auto_zto0dtbcxme|auto_fffup3wj2me|auto_l_llrtabhlw/u);
  });
});
