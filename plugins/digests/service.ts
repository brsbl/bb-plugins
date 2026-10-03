import { randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { createStore } from "./store.js";
import { issueSchema, type DigestDefinition, type Issue, type PublishInput } from "./model.js";
import { checkSignIn, closeBrowser, connectionScope, openBrowser, ConnectionError, type BrowserLease } from "./browser.js";
import { deliveryPrompt, directive, issueTitle, runPrompt, collectionInstructions } from "./prompts.js";

const automationSchema = z.object({ id: z.string(), enabled: z.boolean(), nextRunAt: z.number().nullable() }).passthrough();
const runSchema = z.object({ id: z.string(), threadId: z.string().nullable(), status: z.string(), scheduledFor: z.number(), startedAt: z.number(), error: z.string().nullable(), skipReason: z.string().nullable() }).passthrough();
const organizerSchema = z.object({ version: z.number(), revision: z.number().optional(), stages: z.array(z.object({ key: z.string(), title: z.string(), role: z.string(), rule: z.string(), sectionId: z.string().nullable(), clearFromInboxAfterRead: z.boolean().optional() }).passthrough()) }).passthrough();
const DAY = 24 * 60 * 60 * 1000;

export function createService(bb: BbPluginApi) {
  const store = createStore(bb);
  const locks = new Map<string, Promise<unknown>>();
  const changed = (issue: Issue) => { bb.realtime.publish("issues", { id: issue.id, threadId: issue.threadId }); return issue; };
  const requiredDefinition = (id: string) => {
    const value = store.definitions.get(id);
    if (!value) throw new Error(`Unknown digest ${id}. Run bb digest list.`);
    return value;
  };
  const requiredIssue = (threadId: string, id?: string) => {
    const value = id ? store.issues.get(id) : store.issues.getByThread(threadId);
    if (!value || value.threadId !== threadId) throw new Error("This issue does not belong to this thread.");
    return value;
  };
  async function exclusive<T>(key: string, work: () => Promise<T>): Promise<T> {
    const previous = locks.get(key) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(work);
    locks.set(key, next);
    try { return await next; } finally { if (locks.get(key) === next) locks.delete(key); }
  }
  async function automation<T>(method: string, input: Record<string, unknown>, outputSchema: z.ZodType<T>): Promise<T> {
    return bb.sdk.plugins.callRpc({ pluginId: "automations", method, input: JSON.parse(JSON.stringify(input)), outputSchema });
  }
  async function organizer() {
    return bb.sdk.plugins.callRpc({ pluginId: "thread-organizer", method: "getConfig", input: {}, outputSchema: organizerSchema });
  }
  async function ensureSection() {
    const config = await organizer();
    const stage = config.stages.find((entry) => entry.key === "digests");
    if (stage) {
      if (stage.role !== "stage") throw new Error("The digests key belongs to Inbox. Choose a different Organizer key before setup.");
      return stage;
    }
    const { revision, stages, ...base } = config;
    const next = await bb.sdk.plugins.callRpc({
      pluginId: "thread-organizer", method: "saveConfig",
      input: JSON.parse(JSON.stringify({ ...base, baseRevision: revision ?? 0, stages: [...stages.map(({ sectionId: _id, ...entry }) => entry), {
        key: "digests", role: "stage", title: "Digests", clearFromInboxAfterRead: true, rule: "Private scheduled briefings and issues published by other threads.",
      }] })), outputSchema: organizerSchema,
    });
    return next.stages.find((entry) => entry.key === "digests")!;
  }
  async function place(threadId: string, projectId: string) {
    // Organizer owns remembered stages and the protected Inbox. Its public CLI
    // has thread-scoped context; direct section updates would bypass that state.
    const response = await fetch(`${bb.server.loopbackBaseUrl}/api/v1/plugins/thread-organizer/cli`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ argv: ["phase", "digests"], threadId, projectId }), signal: AbortSignal.timeout(15000),
    });
    const result = z.object({ exitCode: z.number(), stderr: z.string().optional() }).passthrough().parse(await response.json());
    if (!response.ok || result.exitCode !== 0) throw new Error(result.stderr || "Could not file this issue through Thread Organizer.");
  }
  async function closeIssueBrowsers(issue: Issue) {
    const key = `browsers:${issue.id}`;
    const leases = await bb.storage.kv.get<BrowserLease[]>(key) ?? [];
    const failed: BrowserLease[] = [];
    for (const lease of leases) {
      try { await closeBrowser(bb, lease); } catch { failed.push(lease); }
    }
    if (failed.length) await bb.storage.kv.set(key, failed);
    else await bb.storage.kv.delete(key);
  }
  function newIssue(definition: DigestDefinition, threadId: string | null, key: string | null, now = Date.now()) {
    return store.issues.create(issueSchema.parse({ id: randomUUID(), digestId: definition.id, threadId, headline: `Preparing ${definition.name}`, metrics: [], details: "The briefing is being prepared.", state: "collecting", recovery: null, createdAt: now, publishedAt: null, readAt: null, dedupeKey: key, sources: [] }));
  }
  async function fail(issue: Issue, message: string, recovery: "retry" | "reconnect" | "upgrade" = "retry", banner = false) {
    issue = store.issues.get(issue.id) ?? issue;
    if (issue.state === "ready") return issue;
    if (banner) await bb.storage.kv.set(`recovery:${issue.id}`, true);
    const failed = changed(store.issues.update(issue.id, { state: "failed", headline: "This digest needs your attention", details: message, recovery }));
    await closeIssueBrowsers(failed);
    return failed;
  }
  async function spawnDelivery(definition: DigestDefinition, issue: Issue) {
    if (issue.threadId) return issue;
    const stage = await ensureSection();
    const thread = await bb.sdk.threads.spawn({
      projectId: definition.projectId, environment: definition.environment,
      ...(definition.providerId ? { providerId: definition.providerId } : {}),
      ...(definition.model ? { model: definition.model } : {}),
      permissionMode: definition.permissionMode,
      title: issueTitle(definition, issue.createdAt), input: [{ type: "text", text: deliveryPrompt(issue), mentions: [], visibility: "agent-only" }],
      sectionId: stage.sectionId, pluginMetadata: { issueId: issue.id, digestId: definition.id },
    });
    const bound = changed(store.issues.update(issue.id, { threadId: thread.id }));
    await place(thread.id, definition.projectId);
    await bb.sdk.threads.markUnread({ threadId: thread.id });
    return bound;
  }
  async function ensureAutomation(definition: DigestDefinition) {
    if (definition.automationId) return definition;
    if (!definition.schedule) throw new Error("This digest accepts published issues and has no schedule.");
    if (!definition.providerId || !definition.model) throw new Error("Choose a provider and model when defining this digest before enabling its schedule.");
    const created = await automation("automations_create", {
      projectId: definition.projectId, name: `Digests · ${definition.name}`, enabled: false,
      trigger: { triggerType: "schedule", ...definition.schedule }, origin: "agent",
      execution: { mode: "agent", prompt: runPrompt(definition), providerId: definition.providerId, model: definition.model,
        reasoningLevel: definition.reasoningLevel ?? "medium", permissionMode: definition.permissionMode, environment: definition.environment },
    }, automationSchema);
    return store.definitions.put({ ...definition, automationId: created.id });
  }
  async function begin(digestId: string, threadId: string) {
    return exclusive(`begin:${threadId}`, async () => {
      const definition = requiredDefinition(digestId);
      const thread = await bb.sdk.threads.get({ threadId });
      if (thread.projectId !== definition.projectId) throw new Error("Run this digest in its configured project.");
      let issue = store.issues.getByThread(threadId) ?? newIssue(definition, threadId, `thread:${threadId}`);
      if (issue.digestId !== digestId) throw new Error("This thread already belongs to another digest.");
      if (issue.state === "ready") return { issue, directive: directive(issue), sessions: [], complete: true };
      await closeIssueBrowsers(issue);
      issue = changed(store.issues.update(issue.id, { state: "collecting", headline: `Preparing ${definition.name}`, details: "The briefing is being prepared.", recovery: null }));
      const sessions: BrowserLease[] = [];
      try {
        await bb.storage.kv.delete(`recovery:${issue.id}`);
        const requestedRetry = await bb.storage.kv.get<boolean>(`retry:${issue.id}`);
        await bb.storage.kv.delete(`retry:${issue.id}`);
        if (definition.automationId && !requestedRetry) {
          const recent = await automation("automations_runs", { projectId: definition.projectId, automationId: definition.automationId, limit: 100 }, z.object({ runs: z.array(runSchema) }).passthrough());
          const run = recent.runs.find((entry) => entry.threadId === threadId);
          if (run && Date.now() - run.scheduledFor > 15 * 60 * 1000) {
            throw new Error("bb was unavailable or this run was delayed at the scheduled time. Retry to prepare this issue now.");
          }
        }
        await ensureSection();
        await bb.sdk.threads.update({ threadId, title: issueTitle(definition, issue.createdAt) });
        await place(threadId, definition.projectId);
        for (const connectionId of definition.connectionIds) {
          const connection = store.connections.get(connectionId);
          if (!connection) throw new Error(`Connection ${connectionId} is missing. Configure it in Digests, then Retry.`);
          try {
            const lease = await openBrowser(bb, connection, threadId);
            sessions.push(lease);
            await bb.storage.kv.set(`browsers:${issue.id}`, sessions);
            await checkSignIn(bb, connection, lease);
            store.connections.put({ ...connection, status: "signed-in", checkedAt: Date.now(), detail: null });
          } catch (error) {
            store.connections.put({ ...connection, status: error instanceof ConnectionError ? error.status : "unavailable", checkedAt: Date.now(), detail: (error instanceof Error ? error.message : String(error)).slice(0, 2000) });
            throw error;
          }
        }
        return { issue, directive: directive(issue), sessions, instructions: collectionInstructions(definition), complete: false };
      } catch (error) {
        issue = await fail(issue, error instanceof Error ? error.message : String(error), error instanceof ConnectionError ? error.recovery : "retry");
        return { issue, directive: directive(issue), sessions: [], complete: true };
      }
    });
  }
  async function publishCurrent(threadId: string, payload: PublishInput) {
    const issue = requiredIssue(threadId);
    if (issue.state === "ready") return { issue, directive: directive(issue) };
    if (issue.state === "failed") throw new Error("This run failed its connection check. Retry before publishing account data.");
    const definition = requiredDefinition(issue.digestId);
    for (const source of payload.sources) {
      if (!definition.connectionIds.includes(source.connectionId)) throw new Error("The source is outside this digest's declared connections.");
    }
    const published = changed(store.issues.publish(issue.id, payload, Date.now()));
    await bb.storage.kv.delete(`recovery:${issue.id}`);
    await closeIssueBrowsers(published);
    await bb.sdk.threads.markUnread({ threadId });
    return { issue: published, directive: directive(published) };
  }
  async function publishExternal(digestId: string, payload: PublishInput, key: string) {
    return exclusive(`publish:${digestId}`, async () => {
      const definition = requiredDefinition(digestId);
      let issue = store.issues.getByKey(digestId, key);
      if (issue?.state === "ready") return { issue, directive: directive(issue) };
      for (const source of payload.sources) {
        if (!definition.connectionIds.includes(source.connectionId)) throw new Error("The source is outside this digest's declared connections.");
        if (store.processed(digestId, source.connectionId, [source.messageId]).length) throw new Error(`Message ${source.messageId} was already digested. Revise the report before publishing.`);
      }
      issue ??= newIssue(definition, null, key);
      // Create the searchable native thread before committing processed IDs.
      if (!issue.threadId) {
        issue = store.issues.update(issue.id, { headline: payload.headline, details: payload.details, metrics: payload.metrics });
        issue = await spawnDelivery(definition, issue);
      }
      // External publishers may retry a failed delivery with the same key.
      if (issue.state === "failed") issue = store.issues.update(issue.id, { state: "collecting", recovery: null });
      return publishCurrent(issue.threadId!, payload);
    });
  }
  async function run(id: string) {
    return exclusive(`definition:${id}`, async () => {
      const definition = await ensureAutomation(requiredDefinition(id));
      await ensureSection();
      const result = await automation("automations_run", { projectId: definition.projectId, automationId: definition.automationId }, z.object({ run: runSchema }).passthrough());
      if (result.run.threadId) {
        const issue = store.issues.getByThread(result.run.threadId) ?? newIssue(definition, result.run.threadId, `run:${result.run.id}`, result.run.scheduledFor);
        await bb.sdk.threads.update({ threadId: result.run.threadId, title: issueTitle(definition, issue.createdAt) });
        await place(result.run.threadId, definition.projectId);
      }
      return { threadId: result.run.threadId };
    });
  }
  async function setEnabled(id: string, enabled: boolean) {
    return exclusive(`definition:${id}`, async () => {
      let definition = requiredDefinition(id);
      if (enabled) { await ensureSection(); definition = await ensureAutomation(definition); }
      if (definition.automationId) await automation(enabled ? "automations_resume" : "automations_pause", { projectId: definition.projectId, automationId: definition.automationId }, automationSchema);
      definition = store.definitions.put({ ...definition, enabled });
      bb.realtime.publish("issues", {});
      return definition;
    });
  }
  async function retry(threadId: string, id: string) {
    return exclusive(`retry:${id}`, async () => {
      const issue = requiredIssue(threadId, id);
      const deliveryFailed = issue.state === "ready" && await bb.storage.kv.get<boolean>(`recovery:${id}`);
      if (issue.state !== "failed" && !deliveryFailed) throw new Error("Only a failed issue can be retried.");
      if (await bb.storage.kv.get<boolean>(`retry:${id}`)) throw new Error("This issue already has a retry queued.");
      const previousManualRetry = await bb.storage.kv.get<boolean>(`manual-retry:${id}`);
      // Native automation results describe the first turn and never reopen.
      // From this point the issue's own settlement events own its recovery.
      await bb.storage.kv.set(`manual-retry:${id}`, true);
      await bb.storage.kv.set(`retry:${id}`, true);
      try {
        await bb.sdk.threads.send({ threadId, mode: "queue-if-active", input: [{ type: "text", mentions: [],
          text: deliveryFailed ? deliveryPrompt(issue) : runPrompt(requiredDefinition(issue.digestId)),
          ...(deliveryFailed ? { visibility: "agent-only" as const } : {}),
        }] });
      } catch (error) {
        await bb.storage.kv.delete(`retry:${id}`);
        if (!previousManualRetry) await bb.storage.kv.delete(`manual-retry:${id}`);
        throw error;
      }
      return { threadId };
    });
  }
  async function reconnect(threadId: string, id: string) {
    const issue = requiredIssue(threadId, id);
    const definition = requiredDefinition(issue.digestId);
    const connection = definition.connectionIds.map((value) => store.connections.get(value)).find((value) => value && value.status !== "signed-in");
    if (!connection) throw new Error("No connection needs reconnecting. Retry the issue.");
    const scope = await connectionScope(bb, connection, threadId);
    const tab = await bb.sdk.experimental_desktopBrowsers.createTab({ ...scope, url: connection.url, presentation: "reveal" });
    if (Object.hasOwn(tab.tab, "profile")) {
      await bb.sdk.experimental_desktopBrowsers.closeTab({ ...scope, tabId: tab.tab.tabId });
      throw new Error("Update bb to 0.45 or later first, then Retry. Your existing BB Browser sign-ins will be used.");
    }
    return { message: `Opened ${connection.name} in this issue's bb browser. Complete sign-in there, then Retry.` };
  }
  async function overview() {
    const plugins = await bb.sdk.plugins.list();
    let organizerReady = false;
    try { organizerReady = (await organizer()).stages.some((entry) => entry.key === "digests" && entry.clearFromInboxAfterRead === true); } catch { /* Settings shows setup guidance. */ }
    return { definitions: store.definitions.list(), connections: store.connections.list(), actionCardsAvailable: plugins.plugins.some((entry) => entry.id === "inline-action-cards" && entry.enabled && entry.status === "running"), organizerReady };
  }
  async function reconcile() {
    for (const definition of store.definitions.list()) {
      if (!definition.automationId) continue;
      try {
        const result = await automation("automations_runs", { projectId: definition.projectId, automationId: definition.automationId, limit: 100 }, z.object({ runs: z.array(runSchema), nextCursor: z.string().nullable() }));
        for (const run of result.runs.reverse()) {
          let issue = run.threadId ? store.issues.getByThread(run.threadId) : store.issues.getByKey(definition.id, `run:${run.id}`);
          if (issue?.state === "ready") continue;
          if (issue && await bb.storage.kv.get<boolean>(`manual-retry:${issue.id}`)) continue;
          const created = !issue;
          if (!issue) issue = newIssue(definition, run.threadId, `run:${run.id}`, run.scheduledFor);
          if (run.threadId && created) {
            await bb.sdk.threads.update({ threadId: run.threadId, title: issueTitle(definition, issue.createdAt) });
            await place(run.threadId, definition.projectId);
          }
          const late = run.startedAt - run.scheduledFor > 15 * 60 * 1000;
          if (["failed", "skipped"].includes(run.status) || (run.status === "succeeded" && issue.state === "collecting")) {
            issue = await fail(issue, late ? "bb was unavailable at the scheduled time. Retry to prepare this issue now." : run.error || run.skipReason || "The run ended before publishing a digest. Retry to prepare it.", "retry", !!run.threadId);
            if (!issue.threadId) await spawnDelivery(definition, issue);
          }
        }
      } catch (error) { bb.log.warn(`Digest ${definition.id}: ${error instanceof Error ? error.message : String(error)}`); }
    }
    for (let offset = 0; ; offset += 100) {
      const issues = store.issues.list({ limit: 100, offset });
      for (const issue of issues) {
        if (!issue.threadId) continue;
        try {
          const thread = await bb.sdk.threads.get({ threadId: issue.threadId });
          if (thread.archivedAt !== null || thread.deletedAt !== null) continue;
          if ((thread.lastReadAt ?? 0) < thread.latestAttentionAt || !["idle", "error"].includes(thread.status)) {
            if (issue.readAt !== null) store.issues.update(issue.id, { readAt: null });
            continue;
          }
          if (issue.readAt === null) store.issues.update(issue.id, { readAt: thread.lastReadAt ?? Date.now() });
          else if (Date.now() - issue.readAt >= 7 * DAY) await bb.sdk.threads.archive({ threadId: issue.threadId });
        } catch (error) { bb.log.warn(`Issue ${issue.id}: ${error instanceof Error ? error.message : String(error)}`); }
      }
      if (issues.length < 100) break;
    }
  }
  async function settled(threadId: string, failed: boolean) {
    const issue = store.issues.getByThread(threadId);
    if (!issue) return;
    if (issue.state === "collecting") await fail(issue, failed ? "The agent stopped before this issue was ready. Retry to finish it." : "The run ended without publishing a digest. Retry to prepare it.", "retry", true);
    if (issue.state === "failed") {
      await bb.storage.kv.set(`recovery:${issue.id}`, true);
      changed(issue);
    }
    if (issue.state === "ready") {
      if (failed) await bb.storage.kv.set(`recovery:${issue.id}`, true);
      else await bb.storage.kv.delete(`recovery:${issue.id}`);
      changed(issue);
    }
    await bb.storage.kv.delete(`retry:${issue.id}`);
    await closeIssueBrowsers(issue);
  }
  async function recoveryIssue(threadId: string) {
    const issue = store.issues.getByThread(threadId);
    if (!issue || !await bb.storage.kv.get<boolean>(`recovery:${issue.id}`)) return null;
    if (issue.state === "failed") return issue;
    if (issue.state === "ready") return { ...issue, state: "failed" as const, recovery: "retry" as const,
      details: `Your issue was saved, but its delivery turn failed. Retry to display it without collecting again.\n\n${issue.details}` };
    return null;
  }
  return { store, recoveryIssue, begin, publishCurrent, publishExternal, fail, requiredIssue, requiredDefinition, run, setEnabled, retry, reconnect, overview, reconcile, settled, ensureSection, ensureAutomation, closeIssueBrowsers };
}
