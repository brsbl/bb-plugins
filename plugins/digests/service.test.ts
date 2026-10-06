import { createFakePluginHost, makeHostResponse, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
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
}>; personal?: boolean; offline?: boolean; stageSection?: boolean; dispatchFailure?: boolean; dispatchPending?: boolean } = {}) {
  let signIn: { signedIn: boolean; signedOut: boolean; accountName?: string | null } = { signedIn: true, signedOut: false };
  let tabCount = 0;
  let deliveryCount = 0;
  const threads = new Map<string, ReturnType<typeof makeThreadResponse>>();
  const { bb, harness } = createFakePluginHost({
    pluginId: "digests",
    sdk: {
      hosts: { get: async () => ({ ...makeHostResponse({ id: "host_browser", status: options.offline ? "disconnected" : "connected", name: "My Mac" }), connectMachineId: null }) },
      projects: { list: async () => options.personal ? [{ id: "proj_personal", kind: "personal", name: "Personal", sources: [], gitRemoteUrl: null, createdAt: 1, updatedAt: 1 }] : [{ id: "proj_digest", kind: "standard", name: "Digest project", gitRemoteUrl: null, createdAt: 1, updatedAt: 1,
        sources: [{ id: "source_browser", projectId: "proj_digest", type: "local_path", hostId: "host_browser", path: "/digest-workspace", isDefault: true, createdAt: 1, updatedAt: 1 }] }] },
      environments: { listProviders: async () => options.personal ? [{ id: "personal-workspace", displayName: "Personal workspace", description: "", icon: "Folder", logoUrl: null, pluginId: "environment-personal-workspace", machineProviderId: null, requires: { projectCheckout: false, gitCheckout: false, gitRemote: false, projectless: true }, inputs: null, acceptsEmptyInputs: true, availability: null, machineAvailability: {} }] : [] },
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
        list: async () => ({ plugins: [] }),
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
          } else if (pluginId === "automations" && method === "automations_run") {
            result = { run: { id: "run_manual", threadId: options.dispatchFailure || options.dispatchPending ? null : "thr_manual", status: options.dispatchFailure ? "failed" : "running", scheduledFor: Date.now(), startedAt: Date.now(), error: options.dispatchFailure ? "HTTP 404: Project has no local-path source for host" : null, skipReason: null } };
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
  it("waits for another Gmail collection before exposing a browser or observing unread state", async () => {
    const { service, harness } = setup();
    await service.begin("reading", "thr_first");
    const waiting = await service.begin("reading", "thr_second");
    expect(waiting.complete).toBe(false);
    expect(waiting.sessions).toEqual([]);
    expect(waiting.instructions).toContain("Do not inspect or open any email");
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toHaveLength(1);
    await service.publishCurrent("thr_first", payload());
    const next = await service.begin("reading", "thr_second");
    expect(next.sessions).toHaveLength(1);
  });

  it("journals unread state before opening and retains it across retry and publication", async () => {
    const { service } = setup();
    const { issue } = await service.begin("reading", "thr_journal");
    const initial = service.emailRead("thr_journal", { messageId: "mail1", status: "opening", wasUnread: true });
    expect(initial.afterReading).toBe("keep-unread");
    expect(() => service.emailRead("thr_journal", { messageId: "mail1", status: "left-read" })).toThrow("Restore");
    await service.fail(issue, "Browser connection lost.");
    expect(service.requiredIssue("thr_journal").emailReads?.[0]).toMatchObject({ wasUnread: true, status: "opening" });
    await service.begin("reading", "thr_journal");
    service.emailRead("thr_journal", { messageId: "mail1", status: "opening", wasUnread: false });
    expect(service.requiredIssue("thr_journal").emailReads?.[0]?.wasUnread).toBe(true);
    service.emailRead("thr_journal", { messageId: "mail1", status: "restored-unread" });
    const result = await service.publishCurrent("thr_journal", payload());
    expect(result.issue.emailReads?.[0]?.status).toBe("restored-unread");
  });

  it("permits leaving opened mail read only by explicit preference and never changes originally read state", async () => {
    const { service } = setup();
    service.store.definitions.put({ ...service.requiredDefinition("reading"), afterReading: "mark-read" });
    await service.begin("reading", "thr_mark_read");
    service.emailRead("thr_mark_read", { messageId: "mail1", status: "opening", wasUnread: true });
    expect(service.emailRead("thr_mark_read", { messageId: "mail1", status: "left-read" }).status).toBe("left-read");
    service.emailRead("thr_mark_read", { messageId: "mail2", status: "opening", wasUnread: false });
    expect(() => service.emailRead("thr_mark_read", { messageId: "mail2", status: "restored-unread" })).toThrow("originally read");
    expect(service.emailRead("thr_mark_read", { messageId: "mail2", status: "unchanged-read" }).status).toBe("unchanged-read");
    expect(() => service.emailRead("thr_mark_read", { messageId: "unrecorded", status: "left-read" })).toThrow("Record");
  });

  it("dispatches on the browser host in Personal rather than the server project default", async () => {
    const { service, harness } = setup({ personal: true });
    await service.ensureAutomation(service.requiredDefinition("reading"));
    const create = harness.inspection.sdk.callsTo("plugins.callRpc").map(([call]) => call as { method: string; input: unknown }).find((call) => call.method === "automations_create");
    expect(create?.input).toMatchObject({ projectId: "proj_personal", enabled: false, execution: { environment: { type: "host", hostId: "host_browser", workspace: { type: "personal" } } } });
    expect(service.requiredDefinition("reading").enabled).toBe(false);
  });

  it("keeps a dispatch failure visible across Settings reloads and retries the run", async () => {
    const options = { dispatchFailure: true };
    const { service, harness } = setup(options);
    await expect(service.run("reading")).rejects.toThrow("Couldn’t open this brief’s workspace");
    expect((await service.overview()).runErrors.reading).toContain("Retry");
    expect((await service.overview()).runErrors.reading).not.toContain("HTTP 404");
    options.dispatchFailure = false;
    expect(await service.run("reading")).toEqual({ threadId: "thr_manual" });
    expect((await service.overview()).runErrors).toEqual({});
    expect(service.requiredDefinition("reading").enabled).toBe(false);
    expect(harness.inspection.sdk.callsTo("plugins.callRpc").filter(([call]) => (call as { method: string }).method === "automations_resume")).toEqual([]);
  });

  it("waits for an asynchronous dispatch and repeated clicks join the same run", async () => {
    const options = { dispatchPending: true, runs: [{ id: "run_manual", threadId: null as string | null, status: "running", scheduledFor: Date.now(), startedAt: Date.now(), error: null, skipReason: null }] };
    const { service, harness } = setup(options);
    expect(await service.run("reading")).toEqual({ threadId: null, pending: true });
    expect(await service.run("reading")).toEqual({ threadId: null, pending: true });
    expect((await service.overview()).runErrors).toEqual({});
    options.runs[0]!.threadId = "thr_manual";
    expect(await service.runStatus("reading")).toEqual({ threadId: "thr_manual" });
    expect((await service.overview()).startingIds).toEqual([]);
    expect(harness.inspection.sdk.callsTo("plugins.callRpc").filter(([call]) => (call as { method: string }).method === "automations_run")).toHaveLength(1);
  });

  it("binds disabled legacy definitions and retries a Personal delivery without changing its automation", async () => {
    const { service, threads, harness } = setup({ personal: true });
    const legacy = service.requiredDefinition("reading");
    service.store.definitions.put({ ...legacy, automationId: "auto_old" });
    const bound = await service.bindDefinition(service.requiredDefinition("reading"));
    expect(bound).toMatchObject({ projectId: "proj_personal", enabled: false, automationId: "auto_old", automationProjectId: "proj_digest",
      environment: { type: "host", hostId: "host_browser", workspace: { type: "personal" } } });
    threads.set("thr_personal", makeThreadResponse({ id: "thr_personal", projectId: "proj_personal" }));
    const started = await service.begin("reading", "thr_personal");
    expect(started).toMatchObject({ complete: false, issue: { state: "collecting" } });
    expect(harness.inspection.sdk.callsTo("plugins.callRpc").filter(([value]) => ["automations_create", "automations_update", "automations_resume", "automations_pause"].includes((value as { method: string }).method))).toEqual([]);
  });

  it("never gives a rejected thread issue ownership on a later attempt", async () => {
    const { service, threads, harness } = setup({ personal: true });
    threads.set("thr_other", makeThreadResponse({ id: "thr_other", projectId: "proj_other" }));
    for (let attempt = 0; attempt < 2; attempt++) await expect(service.begin("reading", "thr_other")).rejects.toThrow("Open Briefs settings");
    expect(service.store.issues.getByThread("thr_other")).toBeNull();
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toEqual([]);
  });

  it("reports an offline execution host before dispatching an agent", async () => {
    const { service, harness } = setup({ offline: true });
    await expect(service.run("reading")).rejects.toThrow("My Mac is offline");
    expect((await service.overview()).runErrors.reading).toContain("My Mac is offline");
    expect(harness.inspection.sdk.callsTo("threads.spawn")).toEqual([]);
    expect(harness.inspection.sdk.callsTo("plugins.callRpc").filter(([call]) => (call as { pluginId: string }).pluginId === "automations")).toEqual([]);
  });

  it("creates an enabled custom digest and updates that same automation without enabling migrated definitions", async () => {
    const { service, harness } = setup();
    const input = { connectionId: "gmail", name: "Replies", emoji: "💌", instructions: "Only messages needing a reply.", schedule: { cron: "0 10 * * 1-5", timezone: "America/Los_Angeles" } };
    const created = await service.saveDigest(input);
    expect(created).toMatchObject({ enabled: true, emoji: "💌", instructions: input.instructions, automationId: "auto_digest_new", connectionIds: ["gmail"] });
    expect(service.requiredDefinition("reading").enabled).toBe(false);
    const updated = await service.saveDigest({ ...input, id: created.id, name: "Reply list", emoji: "📮", schedule: { cron: "0 11 * * 1-5", timezone: "America/Los_Angeles" } });
    expect(updated).toMatchObject({ id: created.id, automationId: created.automationId, enabled: true, name: "Reply list", emoji: "📮", instructions: input.instructions });
    const { emoji: _legacyEmoji, ...withoutEmoji } = input;
    const edited = await service.saveDigest({ ...withoutEmoji, id: created.id, name: "Reply list" });
    expect(edited.emoji).toBe("📮");
    const calls = harness.inspection.sdk.callsTo("plugins.callRpc").map(([value]) => value as { method: string; input: unknown });
    expect(calls.filter((call) => call.method === "automations_create")).toHaveLength(1);
    expect(calls.find((call) => call.method === "automations_update")?.input).toMatchObject({ automationId: created.automationId, name: "Briefs · Reply list", trigger: { cron: "0 11 * * 1-5" } });
    await service.saveDigest({ ...input, id: "reading", name: "Reading", schedule: service.requiredDefinition("reading").schedule });
    expect(service.requiredDefinition("reading").enabled).toBe(false);
  });

  it("creates a dormant settings owner when its previous owner no longer exists", async () => {
    const { service, harness } = setup();
    await service.checkConnections("gmail");
    expect(harness.inspection.sdk.callsTo("threads.spawn")[0]?.[0]).toMatchObject({ input: [], visibility: "hidden", title: "Briefs browser checks" });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab")).toHaveLength(1);
  });

  it("returns JSON-safe definitions when restoring the default workspace", async () => {
    const { service } = setup();
    const definition = service.requiredDefinition("reading");
    const input = { id: definition.id, connectionId: "gmail", name: definition.name, instructions: definition.instructions, schedule: definition.schedule };
    await service.saveDigest({ ...input, execution: { projectId: "proj_digest", hostId: "host_browser" } });
    const restored = await service.saveDigest({ ...input, execution: null });
    expect(restored).not.toHaveProperty("execution");
    expect(restored).toStrictEqual(JSON.parse(JSON.stringify(restored)));
    expect(service.requiredDefinition("reading").enabled).toBe(false);
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

  it("checks, reconnects and collects after the saved browser window restarts", async () => {
    const { bb, service, harness } = setup();
    service.store.connections.put({ ...service.store.connections.get("gmail")!, desktopInstanceId: "desktop_before_restart" });
    await bb.storage.kv.set("connection-settings-thread", "thr_setup");
    expect(await service.checkConnections("gmail")).toMatchObject([{ status: "signed-in" }]);
    await service.reconnectConnection("gmail");
    expect(await service.begin("reading", "thr_after_restart")).toMatchObject({ complete: false, sessions: [{ instanceId: "desktop_1" }] });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toHaveLength(3);
  });

  it("coalesces Settings checks but always checks each run, and persists banner dismissal", async () => {
    const { service, harness, setSignIn } = setup();
    const first = service.checkSettingsConnections();
    const second = service.checkSettingsConnections();
    expect(first).toBe(second);
    await first;
    const checked = harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab").length;
    expect(checked).toBe(3);
    await service.checkSettingsConnections();
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toHaveLength(checked);
    setSignIn({ signedIn: false, signedOut: true });
    expect(await service.begin("reading", "thr_fresh")).toMatchObject({ complete: true, issue: { state: "failed", recovery: "reconnect" } });
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toHaveLength(checked + 1);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 31_000);
    expect(await service.checkSettingsConnections()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "gmail", status: "signed-out" })]));
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab")).toHaveLength(checked + 4);
    expect(await service.settingsPreferences()).toEqual({ importBannerDismissed: false });
    await service.dismissImportBanner();
    expect(await service.settingsPreferences()).toEqual({ importBannerDismissed: true });
    vi.restoreAllMocks();
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

    await service.publishCurrent("thr_first", payload());
    setSignIn({ signedIn: false, signedOut: false });
    const challenged = await service.begin("reading", "thr_second");
    expect(challenged).toMatchObject({ complete: true, sessions: [], issue: { state: "failed", recovery: "reconnect" } });
    expect(service.store.connections.get("gmail")?.status).toBe("expired");
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.createTab").map(([value]) => value)).toEqual([
      expect.objectContaining({ threadId: "thr_first", url: "about:blank" }),
      expect.objectContaining({ threadId: "thr_second", url: "about:blank" }),
    ]);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab").at(-1)?.[0]).toMatchObject({ threadId: "thr_second", tabId: "tab_2" });
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
    expect(harness.inspection.sdk.callsTo("threads.send")[0]?.[0]).toMatchObject({ threadId: "thr_retry", input: [{ type: "text", mentions: [], text: expect.stringContaining("digest_begin"), visibility: "agent-only" }] });
    expect(service.requiredIssue("thr_retry")).toMatchObject({ state: "collecting", recovery: null });
    expect(await service.recoveryIssue("thr_retry")).toMatchObject({ state: "collecting" });
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

  it("publishes a later successful run into its own failed issue without a manual Retry", async () => {
    const { service, setSignIn } = setup();
    setSignIn({ signedIn: false, signedOut: true });
    const failed = await service.begin("reading", "thr_recover");
    expect(failed.issue).toMatchObject({ state: "failed", recovery: "reconnect" });
    await expect(service.publishCurrent("thr_recover", payload())).rejects.toThrow("digest_begin again");

    setSignIn({ signedIn: true, signedOut: false });
    expect(await service.begin("reading", "thr_recover")).toMatchObject({ complete: false, issue: { id: failed.issue.id, state: "collecting" } });
    await service.fail(service.requiredIssue("thr_recover"), "Browser session closed.");
    await expect(service.publishCurrent("thr_other", payload())).rejects.toThrow("does not belong");
    const published = await service.publishCurrent("thr_recover", payload());
    expect(published.issue).toMatchObject({ id: failed.issue.id, state: "ready", headline: "One worthwhile read" });
    expect(await service.recoveryIssue("thr_recover")).toBeNull();
    expect(service.store.issues.list()).toHaveLength(1);
  });

  it("lets an on-time scheduled run begin again later in its own thread", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service } = setup({ runs: [{
      id: "run_on_time", threadId: "thr_on_time", status: "running", scheduledFor: NOW - 30 * 60_000,
      startedAt: NOW - 30 * 60_000, error: null, skipReason: null,
    }] });
    service.store.definitions.put({ ...service.requiredDefinition("reading"), automationId: "auto_digest_new" });
    expect(await service.begin("reading", "thr_on_time")).toMatchObject({ complete: false, issue: { state: "collecting" } });
  });

  it("reads only the Gmail account its URL names and reports a mismatch", async () => {
    const { service, setSignIn } = setup();
    service.store.connections.put({ ...service.store.connections.get("gmail")!, url: "https://mail.google.com/mail/u/me@example.com/" });
    setSignIn({ signedIn: true, signedOut: false, accountName: "work@example.com" });
    const mismatched = await service.begin("reading", "thr_account");
    expect(mismatched.issue).toMatchObject({ state: "failed", recovery: "reconnect", details: "Signed in as work@example.com, expected me@example.com. Switch Gmail to me@example.com in the bb browser, then Retry." });
    expect(service.store.connections.get("gmail")).toMatchObject({ status: "expired", accountName: "work@example.com" });
    expect(await service.checkConnections("gmail")).toMatchObject([{ status: "expired", accountName: "work@example.com" }]);

    setSignIn({ signedIn: true, signedOut: false, accountName: "Me@Example.com" });
    const begun = await service.begin("reading", "thr_account");
    expect(begun).toMatchObject({ complete: false, issue: { state: "collecting" } });
    expect(begun.instructions).toContain("https://mail.google.com/mail/u/me@example.com/#inbox/<id>");
    expect(begun.instructions).toContain("never use /u/0/");
    expect(service.store.connections.get("gmail")).toMatchObject({ status: "signed-in", accountName: "Me@Example.com" });
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
    const { service, threads } = setup({ runs: [{
      id: "run_terminal", threadId: "thr_retry", status, scheduledFor: Date.now(), startedAt: Date.now(), error: null, skipReason: null,
    }] });
    service.store.definitions.put({ ...service.requiredDefinition("reading"), automationId: "auto_digest_new" });
    const first = await service.begin("reading", "thr_retry");
    await service.settled("thr_retry", true);
    await service.retry("thr_retry", first.issue.id);
    await service.begin("reading", "thr_retry");
    threads.set("thr_retry", makeThreadResponse({ id: "thr_retry", status: "active" }));
    await service.reconcile();
    expect(service.store.issues.get(first.issue.id)?.state).toBe("collecting");
    const published = await service.publishCurrent("thr_retry", payload());
    expect(published.issue.state).toBe("ready");
  });

  it.each(["idle", "error"] as const)("recovers a retried Gmail collector after reload misses its %s settlement", async (status) => {
    const { bb, service, threads } = setup();
    const { issue } = await service.begin("reading", "thr_retry_reload");
    await service.settled("thr_retry_reload", true);
    await service.retry("thr_retry_reload", issue.id);
    await service.begin("reading", "thr_retry_reload");
    service.emailRead("thr_retry_reload", { messageId: "mail1", status: "opening", wasUnread: true });
    const restarted = createService(bb);
    threads.set("thr_retry_reload", makeThreadResponse({ id: "thr_retry_reload", status }));
    await restarted.reconcile();
    expect(await restarted.recoveryIssue("thr_retry_reload")).toMatchObject({ state: "failed", recovery: "retry", emailReads: [{ messageId: "mail1", wasUnread: true, status: "opening" }] });
    expect(await bb.storage.kv.get(`browsers:${issue.id}`)).toBeUndefined();
    expect(await bb.storage.kv.get("gmail-collector")).toBeUndefined();
    expect((await restarted.begin("reading", "thr_next")).sessions).toHaveLength(1);
  });

  it.each([
    { status: "active" as const },
    { status: "idle" as const, queuedMessageCount: 1 },
    { status: "idle" as const, activeBackgroundAgentCount: 1 },
    { status: "idle" as const, runtime: { displayStatus: "host-reconnecting" as const, hostReconnectGraceExpiresAt: NOW + DAY } },
  ])("preserves a retry with native work still pending: %j", async (state) => {
    const { bb, service, threads } = setup();
    const { issue } = await service.begin("reading", "thr_retry_busy");
    await service.settled("thr_retry_busy", true);
    await service.retry("thr_retry_busy", issue.id);
    await service.begin("reading", "thr_retry_busy");
    threads.set("thr_retry_busy", makeThreadResponse({ id: "thr_retry_busy", ...state }));
    await createService(bb).reconcile();
    expect(service.store.issues.get(issue.id)?.state).toBe("collecting");
    expect(await bb.storage.kv.get("gmail-collector")).toBe(issue.id);
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
    expect(automationCalls.map(({ method }) => method)).toEqual(["automations_create", "automations_update", "automations_resume", "automations_pause"]);
    expect(automationCalls[0]?.input).toMatchObject({ enabled: false, execution: { mode: "agent" }, trigger: { cron: "0 11 * * 0" } });
    expect(automationCalls[0]?.input.execution).not.toHaveProperty("targetThreadId");
    expect(automationCalls.slice(1).map(({ input }) => input.automationId)).toEqual(["auto_digest_new", "auto_digest_new", "auto_digest_new"]);
    expect(JSON.stringify(automationCalls.map(({ input }) => input))).not.toMatch(/auto_zto0dtbcxme|auto_fffup3wj2me|auto_l_llrtabhlw/u);
  });
});
