import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublishInputSchema } from "./model";
import { createService } from "./service";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 12, 18);
const dispose: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of dispose.splice(0)) await cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function setup(options: { runs?: Array<{
  id: string; threadId: string | null; status: string; scheduledFor: number; startedAt: number;
  error: string | null; skipReason: string | null;
}>; stageSection?: boolean } = {}) {
  let signIn = { signedIn: true, signedOut: false };
  let tabCount = 0;
  let deliveryCount = 0;
  const threads = new Map<string, ReturnType<typeof makeThreadResponse>>();
  const { bb, harness } = createFakePluginHost({
    pluginId: "digests",
    sdk: {
      threads: {
        get: async ({ threadId }) => threads.get(threadId) ?? makeThreadResponse({ id: threadId, projectId: "proj_digest" }),
        update: async () => ({ ok: true }),
        markUnread: async () => ({ ok: true }),
        updatePluginMetadata: async ({ set }) => set ?? {},
        send: async () => ({ ok: true }),
        archive: async () => ({ ok: true }),
        spawn: async () => ({ id: `thr_delivery_${++deliveryCount}` }),
      },
      experimental_desktopBrowsers: {
        listInstances: async () => ({ instances: [{ instanceId: "desktop_1", generation: "generation_1" }] }),
        createTab: async () => ({ tab: { tabId: `tab_${++tabCount}` } }),
        closeTab: async (input) => {
          // The real desktop tab endpoint rejects extra internal lease fields.
          expect(Object.keys(input).sort()).toEqual(["generation", "hostId", "instanceId", "tabId", "threadId"]);
          return { ok: true };
        },
      },
      plugins: {
        callRpc: async ({ pluginId, method, input, outputSchema }) => {
          let result: unknown;
          if (pluginId === "thread-organizer" && method === "getConfig") {
            result = { version: 1, revision: 1, stages: [{ key: "digests", title: "Digests", role: options.stageSection ? "stage" : "inbox", rule: "Private briefings.", sectionId: "section_digests", ...(options.stageSection ? {} : { catchesPluginId: "digests" }) }] };
          } else if (pluginId === "thread-organizer" && method === "saveConfig") {
            result = { ...input as object, revision: 2, stages: (input as { stages: object[] }).stages.map((stage) => ({ ...stage, sectionId: "section_digests" })) };
          } else if (pluginId === "browser-automation" && method === "open") {
            const selection = (input as { selection: { tabId: string } }).selection;
            result = { id: `session_${selection.tabId}` };
          } else if (pluginId === "browser-automation" && method === "run") {
            result = { text: `DIGEST_CONNECTION:${JSON.stringify(signIn)}`, exitCode: 0 };
          } else if (pluginId === "browser-automation" && method === "close") {
            result = { ok: true };
          } else if (pluginId === "automations" && ["automations_create", "automations_pause", "automations_resume", "automations_update"].includes(method)) {
            result = { id: "auto_digest_new", enabled: method === "automations_resume", nextRunAt: null };
          } else if (pluginId === "automations" && method === "automations_runs") {
            result = { runs: options.runs ?? [], nextCursor: null };
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
  return { bb, harness, service, threads, setSignIn: (value: typeof signIn) => { signIn = value; } };
}

const payload = () => PublishInputSchema.parse({
  headline: "One worthwhile read", metrics: [{ label: "Newsletters", value: "1" }],
  details: "A useful product essay, summarized from its preview snippet.",
  sources: [{ connectionId: "gmail", messageId: "message_1" }],
});

describe("digest issue lifecycle", () => {
  it("creates an enabled custom digest and updates that same automation without enabling migrated definitions", async () => {
    const { service, harness } = setup();
    const input = { connectionId: "gmail", name: "Replies", instructions: "Only messages needing a reply.", schedule: { cron: "0 10 * * 1-5", timezone: "America/Los_Angeles" } };
    const created = await service.saveDigest(input);
    expect(created).toMatchObject({ enabled: true, automationId: "auto_digest_new", connectionIds: ["gmail"] });
    expect(service.requiredDefinition("reading").enabled).toBe(false);
    const updated = await service.saveDigest({ ...input, id: created.id, name: "Reply list", schedule: { cron: "0 11 * * 1-5", timezone: "America/Los_Angeles" } });
    expect(updated).toMatchObject({ id: created.id, automationId: created.automationId, enabled: true, name: "Reply list" });
    const calls = harness.inspection.sdk.callsTo("plugins.callRpc").map(([value]) => value as { method: string; input: unknown });
    expect(calls.filter((call) => call.method === "automations_create")).toHaveLength(1);
    expect(calls.find((call) => call.method === "automations_update")?.input).toMatchObject({ automationId: created.automationId, name: "Digests · Reply list", trigger: { cron: "0 11 * * 1-5" } });
    await service.saveDigest({ ...input, id: "reading", name: "Reading", schedule: service.requiredDefinition("reading").schedule });
    expect(service.requiredDefinition("reading").enabled).toBe(false);
  });

  it("creates a dormant settings owner when its previous owner no longer exists", async () => {
    const { service, harness } = setup();
    await service.checkConnections("gmail");
    expect(harness.inspection.sdk.callsTo("threads.spawn")[0]?.[0]).toMatchObject({ input: [], visibility: "hidden", title: "Digests browser checks" });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab")).toHaveLength(1);
  });

  it("turns an existing Digests section into an inbox without replacing its rule", async () => {
    const { service, harness } = setup({ stageSection: true });
    await service.ensureSection(true);
    const saves = harness.inspection.sdk.callsTo("plugins.callRpc").map(([value]) => value as { method: string; input: Record<string, unknown> }).filter((value) => value.method === "saveConfig");
    expect(saves).toHaveLength(1);
    expect(saves[0]?.input).toMatchObject({ baseRevision: 1, stages: [{ key: "digests", title: "Digests", rule: "Private briefings.", role: "inbox", catchesPluginId: "digests" }] });
    expect(saves[0]?.input).not.toHaveProperty("stages.0.sectionId");
  });

  it("checks Settings connections in fresh setup-owned tabs and releases them on success or failure", async () => {
    const { bb, service, harness, setSignIn } = setup();
    await bb.storage.kv.set("connection-settings-thread", "thr_setup");
    expect(await service.checkConnections("gmail")).toMatchObject([{ status: "signed-in" }]);
    setSignIn({ signedIn: false, signedOut: true });
    expect(await service.checkConnections("gmail")).toMatchObject([{ status: "signed-out" }]);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toHaveLength(2);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab")).toHaveLength(2);
    expect(harness.inspection.sdk.callsTo("threads.spawn")).toHaveLength(0);
    expect(await service.reconnectConnection("gmail")).toMatchObject({ threadId: "thr_setup" });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab").at(-1)?.[0]).toMatchObject({ threadId: "thr_setup", presentation: "reveal", url: "https://mail.google.com/" });
  });

  it("falls back from an archived setup owner to a digest issue, without borrowing a tab", async () => {
    const { bb, service, threads, harness } = setup();
    await service.begin("reading", "thr_issue");
    await bb.storage.kv.set("connection-settings-thread", "thr_old_setup");
    threads.set("thr_old_setup", makeThreadResponse({ id: "thr_old_setup", archivedAt: NOW }));
    await service.checkConnections("gmail");
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab").at(-1)?.[0]).toMatchObject({ threadId: "thr_issue", url: "about:blank" });
  });

  it("begins with fresh issue-owned tabs and trusts only a positive sign-in marker", async () => {
    const { service, harness, threads, setSignIn } = setup();
    threads.set("thr_first", makeThreadResponse({ id: "thr_first", projectId: "proj_digest", originPluginId: "automations" }));
    const first = await service.begin("reading", "thr_first");
    expect(first).toMatchObject({ complete: false, issue: { state: "collecting", threadId: "thr_first" } });
    expect(harness.inspection.sdk.callsTo("threads.updatePluginMetadata")[0]?.[0]).toMatchObject({ threadId: "thr_first", pluginId: "digests", set: { inbox: true, issueId: first.issue.id, digestId: "reading" } });
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
    expect(harness.inspection.sdk.callsTo("threads.send")[0]?.[0]).toMatchObject({ threadId: "thr_retry", input: [{ type: "text", mentions: [], text: expect.stringContaining("digest_begin") }] });
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
      projectId: "proj_digest", title: expect.stringContaining("Reading ·"), input: [expect.objectContaining({ text: expect.stringContaining(payload().details), visibility: "agent-only" })],
    });
    expect(service.store.issues.list()).toHaveLength(1);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toEqual([]);
  });

  it("shows a delayed scheduled run in place and opens its connection only after the user retries", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service, harness } = setup({ runs: [{
      id: "run_late", threadId: "thr_late", status: "running", scheduledFor: NOW - 20 * 60_000,
      startedAt: NOW, error: null, skipReason: null,
    }] });
    service.store.definitions.put({ ...service.requiredDefinition("reading"), automationId: "auto_digest_new" });

    const delayed = await service.begin("reading", "thr_late");
    expect(delayed).toMatchObject({
      complete: true, sessions: [], issue: { threadId: "thr_late", state: "failed", recovery: "retry", details: expect.stringContaining("delayed") },
    });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toEqual([]);
    expect(harness.inspection.sdk.callsTo("threads.updatePluginMetadata")[0]?.[0]).toMatchObject({ threadId: "thr_late", set: { inbox: true, issueId: delayed.issue.id } });
    expect(service.store.connections.get("gmail")?.status).toBe("unknown");

    await service.retry("thr_late", delayed.issue.id);
    const retried = await service.begin("reading", "thr_late");
    expect(retried).toMatchObject({ complete: false, issue: { id: delayed.issue.id, threadId: "thr_late", state: "collecting" } });
    expect(retried.sessions[0]).toMatchObject({ threadId: "thr_late", tabId: "tab_1" });
    expect(service.store.issues.list()).toHaveLength(1);
    expect(harness.inspection.sdk.callsTo("plugins.callRpc").filter(([value]) =>
      (value as { method: string }).method === "automations_runs",
    )).toHaveLength(1);
  });

  it("retries a failed delivery in the same thread without changing the saved issue or collecting again", async () => {
    const { service, harness } = setup();
    const published = await service.publishExternal("reading", payload(), "delivery-recovery");
    const threadId = published.issue.threadId!;
    await service.settled(threadId, true);

    expect(await service.recoveryIssue(threadId)).toMatchObject({
      id: published.issue.id, state: "failed", recovery: "retry", details: expect.stringContaining("delivery turn failed"),
    });
    expect(service.store.issues.get(published.issue.id)).toEqual(published.issue);
    expect(service.store.processed("reading", "gmail", ["message_1"])).toEqual(["message_1"]);

    await expect(service.retry(threadId, published.issue.id)).resolves.toEqual({ threadId });
    const sent = harness.inspection.sdk.callsTo("threads.send")[0]?.[0] as {
      threadId: string; input: Array<{ type: string; text: string; visibility?: string }>;
    };
    expect(sent).toMatchObject({
      threadId, input: [{ type: "text", visibility: "agent-only", text: expect.stringContaining("::digest-issue[") }],
    });
    expect(sent.input[0]?.text).toContain("Do not browse");
    expect(sent.input[0]?.text).not.toContain("digest_begin");
    expect(harness.inspection.sdk.callsTo("threads.spawn")).toHaveLength(1);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toEqual([]);

    await service.settled(threadId, false);
    expect(await service.recoveryIssue(threadId)).toBeNull();
    expect(service.store.issues.get(published.issue.id)).toEqual(published.issue);
    expect(service.store.processed("reading", "gmail", ["message_1"])).toEqual(["message_1"]);
    expect(service.store.issues.list()).toHaveLength(1);
  });

  it.each(["failed", "skipped", "succeeded"])("keeps a manual retry collecting when the original run remains %s", async (status) => {
    const { service } = setup({ runs: [{
      id: "run_terminal", threadId: "thr_retry", status, scheduledFor: Date.now(), startedAt: Date.now(), error: null, skipReason: null,
    }] });
    service.store.definitions.put({ ...service.requiredDefinition("reading"), automationId: "auto_digest_new" });
    const first = await service.begin("reading", "thr_retry");
    await service.settled("thr_retry", true);
    await service.retry("thr_retry", first.issue.id);
    await service.begin("reading", "thr_retry");
    await service.reconcile();
    expect(service.store.issues.get(first.issue.id)?.state).toBe("collecting");
    const published = await service.publishCurrent("thr_retry", payload());
    expect(published.issue.state).toBe("ready");
  });

  it.each([false, true])("keeps recovery visible when an already-failed turn settles (failed=%s)", async (failedTurn) => {
    const { service, setSignIn } = setup();
    setSignIn({ signedIn: false, signedOut: true });
    const result = await service.begin("reading", "thr_no_directive");
    await service.settled("thr_no_directive", failedTurn);
    expect(await service.recoveryIssue("thr_no_directive")).toMatchObject({
      id: result.issue.id, state: "failed", recovery: "reconnect", details: expect.stringContaining("signed out"),
    });
  });

  it("keeps old read issues until the user archives them", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service, harness, threads } = setup();
    service.store.issues.create({ id: "old_read", digestId: "reading", threadId: "thr_old_read", headline: "A digest", createdAt: NOW - 30 * DAY, readAt: NOW - 20 * DAY });
    threads.set("thr_old_read", makeThreadResponse({ id: "thr_old_read", projectId: "proj_digest", status: "idle", lastReadAt: NOW - 20 * DAY, latestAttentionAt: NOW - 21 * DAY }));
    await service.reconcile();
    expect(harness.inspection.sdk.callsTo("threads.archive")).toEqual([]);
    expect(service.store.issues.get("old_read")).not.toBeNull();
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
