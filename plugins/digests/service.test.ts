import { createFakePluginHost, makeHostResponse, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublishInputSchema } from "./model";
import { createService } from "./service";
import plugin from "./server";
import type { Owner } from "./store";
import type { SignInPage } from "./signin";

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
}>; personal?: boolean; offline?: boolean; stageSection?: boolean; dispatchFailure?: boolean; dispatchPending?: boolean;
  automations?: Record<string, { enabled: boolean; nextRunAt: number | null }> } = {}) {
  let signIn: { page: SignInPage; accountName?: string | null } = { page: "signed-in" };
  let tabCount = 0;
  let deliveryCount = 0;
  const threads = new Map<string, ReturnType<typeof makeThreadResponse>>();
  const { bb, harness } = createFakePluginHost({
    pluginId: "digests",
    sdk: {
      hosts: { get: async () => ({ ...makeHostResponse({ id: "host_browser", status: options.offline ? "disconnected" : "connected", name: "Fixture computer" }), connectMachineId: null }) },
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
          } else if (pluginId === "automations" && method === "automations_get") {
            const { automationId } = input as { automationId: string };
            const found = options.automations?.[automationId];
            if (!found) throw new Error(`No automation ${automationId}`);
            result = { id: automationId, ...found };
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
  sources: [{ connectionId: "gmail", messageId: "message_1", placement: "shown", class: "other", from: "Essays <essays@example.com>", subject: "A product essay" }],
});

function withTwoInboxes(service: ReturnType<typeof setup>["service"], money?: { enabled: boolean }) {
  service.store.connections.put({ id: "gmail-brsabel", name: "Gmail (brsabel)", url: "https://mail.google.com/mail/u/1/", browserHostId: "host_browser" });
  service.store.definitions.put({ ...service.requiredDefinition("reading"), connectionIds: ["gmail", "gmail-brsabel"] });
  if (money) service.store.definitions.put({
    id: "money", name: "Money", projectId: "proj_digest", instructions: "Bills and receipts.", connectionIds: ["gmail", "gmail-brsabel"],
    schedule: { cron: "0 9 * * *", timezone: "America/Los_Angeles" }, automationId: "auto_money", enabled: money.enabled,
    providerId: "codex", model: "model-test", createdAt: NOW,
  });
}
const moneyMail = (messageId: string, connectionId = "gmail-brsabel") => ({ connectionId, messageId, class: "money" as const, from: "Bills <bills@example.com>", subject: "Your bill" });

describe("digest issue lifecycle", () => {
  it("sets up neutral system-timezone starters without replacing saved prompts or schedules", async () => {
    const { bb, service, harness } = setup();
    const saved = { ...service.requiredDefinition("reading"), instructions: "Only my chosen topics; keep this saved filter.", automationId: "auto_saved" };
    service.store.definitions.put(saved);
    plugin(bb);
    const args = ["setup", "--project", "proj_digest", "--browser-host", "host_browser", "--provider", "codex", "--model", "model-test"];
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await harness.behavior.runCli(args, { threadId: "thr_setup", projectId: "proj_digest" });
      expect(result.exitCode, result.stderr).toBe(0);
      expect(service.requiredDefinition("reading")).toMatchObject({
        instructions: saved.instructions, schedule: saved.schedule, automationId: "auto_saved", enabled: false,
      });
      for (const id of ["unread-email", "money"]) {
        expect(service.requiredDefinition(id)).toMatchObject({ enabled: false, schedule: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } });
      }
      expect(service.store.definitions.list()).toHaveLength(4);
    }
    expect(harness.inspection.sdk.callsTo("plugins.callRpc").some(([call]) => (call as { pluginId: string }).pluginId === "automations")).toBe(false);
  });

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

  it.each(["keep-unread", "mark-read"] as const)("preserves a mixed reply chain in %s mode with a synthetic mailbox", async (afterReading) => {
    const { service } = setup();
    service.store.definitions.put({ ...service.requiredDefinition("reading"), afterReading });
    const begun = await service.begin("reading", "thr_fixture");
    expect(begun.instructions).toContain("preserve mixed read/unread states per message");
    expect(begun.instructions).toContain("without reopening it");
    // The mailbox models opening and restoration separately from the journal.
    // The production agent performs those browser actions; emailRead does not.
    const mailbox = new Map([["fixture_unread", true], ["fixture_read", false]]);
    for (const [messageId, wasUnread] of mailbox) {
      service.emailRead("thr_fixture", { messageId, threadId: "fixture_chain", wasUnread, status: "opening" });
      expect(mailbox.get(messageId)).toBe(wasUnread);
      mailbox.set(messageId, false); // Opening the synthetic message marks it read.
      if (wasUnread && afterReading === "keep-unread") mailbox.set(messageId, true);
      const observedUnread = mailbox.get(messageId);
      service.emailRead("thr_fixture", { messageId, status: observedUnread ? "restored-unread" : wasUnread ? "left-read" : "unchanged-read" });
    }
    const published = await service.publishCurrent("thr_fixture", payload());
    expect(mailbox.get("fixture_read")).toBe(false);
    expect(mailbox.get("fixture_unread")).toBe(afterReading === "keep-unread");
    expect(published.issue.emailReads).toMatchObject([
      { messageId: "fixture_unread", wasUnread: true, afterReading, status: afterReading === "keep-unread" ? "restored-unread" : "left-read" },
      { messageId: "fixture_read", wasUnread: false, status: "unchanged-read" },
    ]);
  });

  it.each(["opening", "restore-failed"] as const)("retains %s after an interrupted scheduled run and repairs the same journal on retry", async (status) => {
    const runs = [{ id: "run_fixture", threadId: "thr_fixture", status: "running", scheduledFor: Date.now(), startedAt: Date.now(), error: null, skipReason: null }];
    const { service, bb, harness } = setup({ runs });
    service.store.definitions.put({ ...service.requiredDefinition("reading"), automationId: "auto_fixture" });
    const { issue } = await service.begin("reading", "thr_fixture");
    service.emailRead("thr_fixture", { messageId: "fixture_unread", wasUnread: true, status: "opening" });
    if (status === "restore-failed") service.emailRead("thr_fixture", { messageId: "fixture_unread", status });
    runs[0]!.status = "failed";
    const restarted = createService(bb);
    await restarted.reconcile();
    expect(await restarted.recoveryIssue("thr_fixture")).toMatchObject({ id: issue.id, state: "failed", recovery: "retry", emailReads: [{ status, wasUnread: true }] });
    expect(await bb.storage.kv.get("gmail-collector")).toBeUndefined();
    expect(await bb.storage.kv.get(`browsers:${issue.id}`)).toBeUndefined();
    expect(restarted.store.processed("reading", "gmail", ["message_1"])).toEqual([]);
    // A preference change must not rewrite the original message's obligation.
    restarted.store.definitions.put({ ...restarted.requiredDefinition("reading"), afterReading: "mark-read" });
    await restarted.retry("thr_fixture", issue.id);
    const resumed = await restarted.begin("reading", "thr_fixture");
    expect(resumed.issue.id).toBe(issue.id);
    expect(resumed.instructions).toContain("repair any opening/restore-failed records");
    expect(resumed.sessions[0]?.tabId).toBe("tab_2");
    restarted.emailRead("thr_fixture", { messageId: "fixture_unread", wasUnread: false, status: "opening" });
    expect(() => restarted.emailRead("thr_fixture", { messageId: "fixture_unread", status: "left-read" })).toThrow("Restore");
    restarted.emailRead("thr_fixture", { messageId: "fixture_unread", status: "restored-unread" });
    const published = await restarted.publishCurrent("thr_fixture", payload());
    expect(published.issue.emailReads).toMatchObject([{ wasUnread: true, afterReading: "keep-unread", status: "restored-unread" }]);
    expect(restarted.store.issues.list()).toHaveLength(1);
    expect(restarted.store.processed("reading", "gmail", ["message_1"])).toEqual(["message_1"]);
    expect(harness.inspection.sdk.callsTo("experimental_desktopBrowsers.closeTab")).toHaveLength(2);
  });

  it("preserves an unverified restoration in a partial published brief", async () => {
    const { service, bb } = setup();
    await service.begin("reading", "thr_fixture");
    service.emailRead("thr_fixture", { messageId: "fixture_unread", wasUnread: true, status: "opening" });
    service.emailRead("thr_fixture", { messageId: "fixture_unread", status: "restore-failed" });
    const result = await service.publishCurrent("thr_fixture", { ...payload(), details: "Partial coverage: unread restoration could not be verified." });
    const restarted = createService(bb);
    expect(restarted.requiredIssue("thr_fixture")).toMatchObject({ id: result.issue.id, state: "ready", emailReads: [{ status: "restore-failed", wasUnread: true }] });
    expect(result.issue.details).toContain("could not be verified");
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
    await expect(service.run("reading")).rejects.toThrow("Fixture computer is offline");
    expect((await service.overview()).runErrors.reading).toContain("Fixture computer is offline");
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
    setSignIn({ page: "login" });
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
    setSignIn({ page: "login" });
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
    setSignIn({ page: "challenge" });
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
    setSignIn({ page: "login" });
    const failed = await service.begin("reading", "thr_retry");
    expect(failed.issue).toMatchObject({ state: "failed", recovery: "reconnect" });
    await expect(service.retry("thr_intruder", failed.issue.id)).rejects.toThrow("does not belong");
    await expect(service.retry("thr_retry", failed.issue.id)).resolves.toEqual({ threadId: "thr_retry" });
    expect(harness.inspection.sdk.callsTo("threads.send")[0]?.[0]).toMatchObject({ threadId: "thr_retry", input: [{ type: "text", mentions: [], text: expect.stringContaining("digest_begin"), visibility: "agent-only" }] });
    expect(service.requiredIssue("thr_retry")).toMatchObject({ state: "collecting", recovery: null });
    expect(await service.recoveryIssue("thr_retry")).toMatchObject({ state: "collecting" });
    setSignIn({ page: "signed-in" });
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
    setSignIn({ page: "login" });
    const failed = await service.begin("reading", "thr_recover");
    expect(failed.issue).toMatchObject({ state: "failed", recovery: "reconnect" });
    await expect(service.publishCurrent("thr_recover", payload())).rejects.toThrow("digest_begin again");
    // Another thread's passing check does not verify this run.
    setSignIn({ page: "signed-in" });
    expect(await service.checkConnections("gmail")).toMatchObject([{ status: "signed-in" }]);
    await expect(service.publishCurrent("thr_recover", payload())).rejects.toThrow("digest_begin again");

    expect(await service.begin("reading", "thr_recover")).toMatchObject({ complete: false, issue: { id: failed.issue.id, state: "collecting" } });
    await service.settled("thr_recover", true);
    expect(service.requiredIssue("thr_recover").state).toBe("failed");
    await expect(service.publishCurrent("thr_other", payload())).rejects.toThrow("does not belong");
    const published = await service.publishCurrent("thr_recover", payload());
    expect(published.issue).toMatchObject({ id: failed.issue.id, state: "ready", headline: "One worthwhile read" });
    expect(await service.recoveryIssue("thr_recover")).toBeNull();
    expect(service.store.issues.list()).toHaveLength(1);

    // An explicit failure from the run itself stays failed.
    await service.begin("reading", "thr_explicit");
    await service.fail(service.requiredIssue("thr_explicit"), "Couldn’t verify unread state.");
    await expect(service.publishCurrent("thr_explicit", payload())).rejects.toThrow("digest_begin again");
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

  it("lets a retried late run begin again, as when it waits for the Gmail lock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service } = setup({ runs: [{
      id: "run_late_retry", threadId: "thr_late_retry", status: "running", scheduledFor: NOW - 30 * 60_000,
      startedAt: NOW - 10 * 60_000, error: null, skipReason: null,
    }] });
    service.store.definitions.put({ ...service.requiredDefinition("reading"), automationId: "auto_digest_new" });
    const delayed = await service.begin("reading", "thr_late_retry");
    expect(delayed.issue.state).toBe("failed");
    await service.retry("thr_late_retry", delayed.issue.id);
    expect(await service.begin("reading", "thr_late_retry")).toMatchObject({ complete: false, issue: { state: "collecting" } });
    expect(await service.begin("reading", "thr_late_retry")).toMatchObject({ complete: false, issue: { state: "collecting" } });
  });

  it("reads only the Gmail account its URL names and reports a mismatch", async () => {
    const { service, harness, setSignIn } = setup();
    service.store.connections.put({ ...service.store.connections.get("gmail")!, url: "https://mail.google.com/mail/u/me@example.com/" });
    setSignIn({ page: "signed-in", accountName: "work@example.com" });
    const mismatched = await service.begin("reading", "thr_account");
    expect(mismatched.issue).toMatchObject({ state: "failed", recovery: "reconnect", details: "Signed in as work@example.com, expected me@example.com. Switch Gmail to me@example.com in the bb browser, then Retry." });
    expect(service.store.connections.get("gmail")).toMatchObject({ status: "expired", accountName: "work@example.com" });
    expect(await service.checkConnections("gmail")).toMatchObject([{ status: "expired", accountName: "work@example.com" }]);

    setSignIn({ page: "signed-in", accountName: "Me@Example.com" });
    const begun = await service.begin("reading", "thr_account");
    expect(begun).toMatchObject({ complete: false, issue: { state: "collecting" } });
    expect(begun.instructions).toContain("https://mail.google.com/mail/?authuser=me@example.com#inbox/<id>");
    expect(begun.instructions).toContain("never use /mail/u/0/");
    const probe = harness.inspection.sdk.callsTo("plugins.callRpc").map(([value]) => value as { method: string; input: { script?: string } })
      .filter((value) => value.method === "run").at(-1)?.input.script;
    expect(probe).toContain('await p.goto("https://mail.google.com/mail/?authuser=me@example.com")');
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
    setSignIn({ page: "login" });
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
    expect(automationCalls.slice(1).every(({ input }) => input.automationId === "auto_digest_new")).toBe(true);
  });
});

describe("email ownership across briefs", () => {
  it("takes the Gmail lock for any Gmail inbox and returns owners and handoffs", async () => {
    const nextRunAt = Date.now() + DAY;
    const { bb, service } = setup({ automations: { auto_money: { enabled: true, nextRunAt } } });
    withTwoInboxes(service, { enabled: true });
    service.store.definitions.put({ id: "replies", name: "Replies", projectId: "proj_digest", instructions: "Replies only.", connectionIds: ["gmail-brsabel"], providerId: "codex", model: "model-test", createdAt: NOW });
    const reading = await service.begin("reading", "thr_reading");
    expect(reading).toMatchObject({ complete: false, handoffs: [],
      owners: [{ class: "money", digestId: "money", name: "Money", connectionIds: ["gmail", "gmail-brsabel"], nextRunAt }] });
    expect(await bb.storage.kv.get("gmail-collector")).toBe(reading.issue.id);
    expect((await service.begin("replies", "thr_replies")).instructions).toContain("Another brief is reading Gmail");

    await expect(service.publishCurrent("thr_reading", { ...payload(), sources: [{ ...moneyMail("bill_1"), placement: "shown" }] })).rejects.toThrow("Money owns money mail");
    await service.publishCurrent("thr_reading", { ...payload(), sources: [{ ...moneyMail("bill_1"), placement: "handoff" }] });
    const money = await service.begin("money", "thr_money");
    expect(money.handoffs).toEqual([expect.objectContaining({ connectionId: "gmail-brsabel", messageId: "bill_1", ownerDigestId: "money", handedOffBy: "reading" })]);
    expect(await bb.storage.kv.get(`handoffs:${money.issue.id}`)).toEqual([money.handoffs![0]!.emailId]);
    expect(await service.emailStatus("thr_money", [{ connectionId: "gmail-brsabel", messageId: "bill_1" }])).toMatchObject([{ status: "handed-to-you" }]);
    await expect(service.publishCurrent("thr_money", { ...payload(), sources: [] })).rejects.toThrow("Show or release");
    await service.publishCurrent("thr_money", { ...payload(), sources: [{ ...moneyMail("bill_1"), placement: "shown" }] });
    expect(await bb.storage.kv.get(`begun:${money.issue.id}`)).toBeUndefined();
    expect(await bb.storage.kv.get(`handoffs:${money.issue.id}`)).toBeUndefined();
  });

  it.each([
    { name: "Money is off", enabled: false, automation: { enabled: true, nextRunAt: Date.now() + DAY } },
    { name: "its automation has no next run", enabled: true, automation: { enabled: true, nextRunAt: null } },
    { name: "its automation is paused", enabled: true, automation: { enabled: false, nextRunAt: Date.now() + DAY } },
  ])("lets another brief show money mail when $name", async ({ enabled, automation }) => {
    const { service } = setup({ automations: { auto_money: automation } });
    withTwoInboxes(service, { enabled });
    expect(await service.begin("reading", "thr_reading")).toMatchObject({ owners: [] });
    const published = await service.publishCurrent("thr_reading", { ...payload(), sources: [{ ...moneyMail("bill_2"), placement: "shown" }] });
    expect(published.issue.state).toBe("ready");
  });

  it("fails a brief closed when an owner's schedule can't be read, without taking its handoffs", async () => {
    const { service } = setup({ automations: {} });
    withTwoInboxes(service, { enabled: true });
    const money: Owner = { class: "money", digestId: "money", name: "Money", connectionIds: ["gmail", "gmail-brsabel"], nextRunAt: NOW };
    service.store.issues.create({ id: "iss_handoff", digestId: "reading", headline: "Preparing", createdAt: NOW });
    service.store.issues.publish("iss_handoff", { ...payload(), sources: [{ ...moneyMail("bill_9"), placement: "handoff" }] }, NOW, { strict: true, owners: [money] });
    const result = await service.begin("reading", "thr_owner_check");
    expect(result).toMatchObject({ complete: true, issue: { state: "failed", recovery: "retry", details: "Couldn't check Money's schedule. Retry this brief." } });
    expect(result).not.toHaveProperty("handoffs");
    expect(service.store.emailStatus("reading", [{ connectionId: "gmail-brsabel", messageId: "bill_9" }], [money], []))
      .toMatchObject([{ status: "handed-off", ownerDigestId: "money" }]);
  });

  it("downgrades a strict run's unverifiable task link to its email", async () => {
    const { service } = setup();
    await service.begin("reading", "thr_links");
    const gmailUrl = "https://mail.google.com/mail/u/0/#inbox/message_1";
    const published = await service.publishCurrent("thr_links", PublishInputSchema.parse({ ...payload(),
      sources: [{ connectionId: "gmail", messageId: "message_1", placement: "shown", class: "other", from: "Bills <bills@example.com>", subject: "Your bill", signedBy: "example.com" }],
      brief: { heading: "Today", items: [{ title: "Pay the bill", text: "Due Friday", messageId: "message_1",
        action: { label: "Pay now", url: "https://u123.ct.sendgrid.net/ls/click?upn=abc" }, secondaryAction: { label: "Email", url: gmailUrl } }] },
    }));
    expect(published.issue.brief?.items[0]?.action).toEqual({ label: "Open email", url: gmailUrl });
    expect(published.issue.brief?.items[0]).not.toHaveProperty("secondaryAction");
  });

  it("keeps external publishing non-strict", async () => {
    const { service, harness } = setup();
    const action = { label: "Read on site", url: "https://example.com/essay" };
    const published = await service.publishExternal("reading", PublishInputSchema.parse({ ...payload(),
      sources: [{ connectionId: "gmail", messageId: "message_external" }],
      brief: { heading: "Reading", items: [{ title: "An essay", text: "Worth it", action }] },
    }), "external-1");
    expect(published.issue).toMatchObject({ state: "ready", brief: { items: [{ action }] } });

    // Another brief can't show it again, and the rejected publish creates no thread.
    service.store.definitions.put({ ...service.requiredDefinition("reading"), id: "inbox", name: "Inbox" });
    const spawned = harness.inspection.sdk.callsTo("threads.spawn").length;
    await expect(service.publishExternal("inbox", PublishInputSchema.parse({ ...payload(),
      sources: [{ connectionId: "gmail", messageId: "message_external" }] }), "external-2"))
      .rejects.toThrow("Message message_external from gmail was already shown in Reading. Remove it and publish again.");
    expect(harness.inspection.sdk.callsTo("threads.spawn")).toHaveLength(spawned);
  });

  it("adds connections and sets owned classes while keeping the brief's automation and switch", async () => {
    const { service, harness } = setup();
    service.store.connections.put({ id: "gmail-brsabel", name: "Gmail (brsabel)", url: "https://mail.google.com/mail/u/1/", browserHostId: "host_browser" });
    const before = service.store.definitions.put({ ...service.requiredDefinition("reading"), enabled: true, automationId: "auto_reading" });
    const updated = await service.updateDigest("reading", { addConnectionIds: ["gmail-brsabel", "gmail"] });
    expect(updated).toMatchObject({ id: "reading", automationId: "auto_reading", enabled: true, schedule: before.schedule, connectionIds: ["gmail", "gmail-brsabel"] });
    const calls = harness.inspection.sdk.callsTo("plugins.callRpc").map(([value]) => value as { method: string; input: { automationId?: string } });
    expect(calls.filter((call) => call.method === "automations_create")).toEqual([]);
    expect(calls.find((call) => call.method === "automations_update")?.input.automationId).toBe("auto_reading");
    await expect(service.updateDigest("reading", { addConnectionIds: ["nope"] })).rejects.toThrow("Unknown connection nope. Run bb digest connections status.");
    expect((await service.updateDigest("reading", { owns: ["money"] })).owns).toEqual(["money"]);
    expect(await service.updateDigest("reading", { owns: null })).not.toHaveProperty("owns");

    service.store.definitions.put({ ...service.requiredDefinition("reading"), enabled: false, automationId: null, connectionIds: ["gmail"] });
    const saved = await service.saveDigest({ id: "reading", connectionId: "gmail-brsabel", name: "Reading", instructions: before.instructions, schedule: before.schedule });
    expect(saved).toMatchObject({ id: "reading", connectionIds: ["gmail", "gmail-brsabel"], enabled: false });
  });
});
