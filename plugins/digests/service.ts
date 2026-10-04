import { randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { createStore } from "./store.js";
import { issueSchema, type DigestDefinition, type Issue, type PublishInput, type Connection, type SaveDigest } from "./model.js";
import { checkSignIn, closeBrowser, connectionScope, openBrowser, ConnectionError, type BrowserLease } from "./browser.js";
import { executionTarget, executionFailure, ExecutionError } from "./execution.js";
import { SITES } from "./sites.js";
import { deliveryPrompt, directive, issueTitle, runPrompt, collectionInstructions } from "./prompts.js";

const automationSchema = z.object({ id: z.string(), enabled: z.boolean(), nextRunAt: z.number().nullable() }).passthrough();
const runSchema = z.object({ id: z.string(), threadId: z.string().nullable(), status: z.string(), scheduledFor: z.number(), startedAt: z.number(), error: z.string().nullable(), skipReason: z.string().nullable() }).passthrough();
const organizerSchema = z.object({ version: z.number(), revision: z.number().optional(), stages: z.array(z.object({ key: z.string(), title: z.string(), role: z.string(), rule: z.string(), sectionId: z.string().nullable(), catchesPluginId: z.string().optional() }).passthrough()) }).passthrough();

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
  async function ensureSection(configureExisting = false) {
    const config = await organizer();
    const stage = config.stages.find((entry) => entry.key === "digests");
    if (stage?.role === "inbox" && stage.catchesPluginId === "digests") return stage;
    if (stage && !configureExisting) throw new Error("Run Digests setup to configure its inbox in Thread Organizer.");
    if (stage?.entryPrompt) throw new Error("Remove the Digests section entry prompt before converting it to an inbox.");
    const { revision, stages, ...base } = config;
    const nextStages = stages.map(({ sectionId: _id, ...entry }) => entry.key === "digests" ? { ...entry, role: "inbox", catchesPluginId: "digests" } : entry);
    if (!stage) nextStages.push({ key: "digests", role: "inbox", title: "Digests", catchesPluginId: "digests", rule: "Private scheduled briefings and issues published by other threads." });
    const next = await bb.sdk.plugins.callRpc({
      pluginId: "thread-organizer", method: "saveConfig",
      input: JSON.parse(JSON.stringify({ ...base, baseRevision: revision ?? 0, stages: nextStages })), outputSchema: organizerSchema,
    });
    const saved = next.stages.find((entry) => entry.key === "digests");
    if (saved?.role !== "inbox" || saved.catchesPluginId !== "digests") throw new Error("Update Thread Organizer to a version with additional inboxes, then run Digests setup again.");
    return saved;
  }

  async function claimInbox(issue: Issue) {
    if (!issue.threadId) return;
    // Native automation threads retain their Automations origin. A durable
    // plugin metadata marker lets Organizer route them without rewriting it.
    await bb.sdk.threads.updatePluginMetadata({ threadId: issue.threadId, set: { inbox: true, issueId: issue.id, digestId: issue.digestId } });
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
  const automationProject = (definition: DigestDefinition) => definition.automationProjectId ?? definition.projectId;
  const targetFor = (definition: Pick<DigestDefinition, "projectId" | "environment" | "execution" | "connectionIds">) => executionTarget(bb, definition,
    definition.connectionIds.map((id) => store.connections.get(id)).filter((value): value is Connection => value !== null));
  async function bindDefinition(definition: DigestDefinition) {
    const target = await targetFor(definition);
    return store.definitions.put({ ...definition, projectId: target.projectId, environment: target.environment,
      ...(definition.automationId ? { automationProjectId: automationProject(definition) } : {}) });
  }
  async function runError(id: string, error: unknown) {
    const message = executionFailure(error);
    await bb.storage.kv.set(`run-error:${id}`, message);
    bb.realtime.publish("issues", {});
    return message;
  }
  async function spawnDelivery(definition: DigestDefinition, issue: Issue) {
    if (issue.threadId) return issue;
    definition = await bindDefinition(definition);
    const stage = await ensureSection();
    const target = await targetFor(definition);
    const thread = await bb.sdk.threads.spawn({
      ...target,
      ...(definition.providerId ? { providerId: definition.providerId } : {}),
      ...(definition.model ? { model: definition.model } : {}),
      permissionMode: definition.permissionMode,
      title: issueTitle(definition, issue.createdAt), input: [{ type: "text", text: deliveryPrompt(issue), mentions: [], visibility: "agent-only" }],
      sectionId: stage.sectionId, pluginMetadata: { inbox: true, issueId: issue.id, digestId: definition.id },
    });
    const bound = changed(store.issues.update(issue.id, { threadId: thread.id }));
    await claimInbox(bound);
    await bb.sdk.threads.markUnread({ threadId: thread.id });
    return bound;
  }
  async function ensureAutomation(definition: DigestDefinition) {
    if (!definition.schedule) throw new Error("This digest accepts published issues and has no schedule.");
    if (!definition.providerId || !definition.model) throw new Error("Choose a provider and model when defining this digest before enabling its schedule.");
    definition = await bindDefinition(definition);
    const target = await targetFor(definition);
    if (definition.automationId && automationProject(definition) === target.projectId) {
      if (JSON.stringify(definition.automationEnvironment) !== JSON.stringify(target.environment)) {
        await automation("automations_update", { projectId: automationProject(definition), automationId: definition.automationId,
          agent: { target: { type: "environment", environment: target.environment } } }, automationSchema);
        definition = store.definitions.put({ ...definition, automationProjectId: target.projectId, automationEnvironment: target.environment });
      }
      return definition;
    }
    // Only this definition's automation can be replaced. Keep the old paused
    // record and its run history; user automations are never adopted.
    if (definition.automationId) await automation("automations_pause", { projectId: automationProject(definition), automationId: definition.automationId }, automationSchema);
    const created = await automation("automations_create", {
      projectId: target.projectId, name: `Digests · ${definition.name}`, enabled: false,
      trigger: { triggerType: "schedule", ...definition.schedule }, origin: "agent",
      execution: { mode: "agent", prompt: runPrompt(definition), providerId: definition.providerId, model: definition.model,
        reasoningLevel: definition.reasoningLevel ?? "medium", permissionMode: definition.permissionMode, environment: target.environment },
    }, automationSchema);
    const saved = store.definitions.put({ ...definition, automationId: created.id, automationProjectId: target.projectId, automationEnvironment: target.environment });
    if (saved.enabled) await automation("automations_resume", { projectId: target.projectId, automationId: created.id }, automationSchema);
    return saved;
  }
  async function settingsDefaults(connectionId?: string) {
    const definitions = store.definitions.list();
    const existing = definitions.find((entry) => connectionId && entry.connectionIds.includes(connectionId)) ?? definitions[0];
    if (existing) return { projectId: existing.projectId, providerId: existing.providerId, model: existing.model, reasoningLevel: existing.reasoningLevel, environment: existing.environment };
    const projects = await bb.sdk.projects.list({ includePersonal: true });
    const personal = projects.find((project) => project.kind === "personal");
    if (!personal) throw new Error("Open your personal project in bb before adding a digest.");
    const defaults = await bb.sdk.projects.defaultExecutionOptions({ projectId: personal.id });
    return { projectId: personal.id, providerId: defaults?.providerId ?? null, model: defaults?.model ?? null, reasoningLevel: defaults?.reasoningLevel ?? null, environment: { type: "project-default" as const } };
  }
  async function saveDigest(input: SaveDigest) {
    return exclusive(`definition:${input.id ?? "new"}`, async () => {
      const previous = input.id ? requiredDefinition(input.id) : null;
      if (!store.connections.get(input.connectionId)) throw new Error("Reopen Settings to check your sites before adding a digest.");
      if (previous && !previous.connectionIds.includes(input.connectionId)) throw new Error("Edit this digest under its original site.");
      if (!previous && !input.schedule) throw new Error("Choose when this digest should run.");
      // Existing publishers keep their mode; editing a prompt does not convert
      // a publishing contract or silently pause an enabled automation.
      if (previous && Boolean(previous.schedule) !== Boolean(input.schedule)) throw new Error("Keep this digest's existing scheduled or published mode.");
      const defaults = previous ?? await settingsDefaults(input.connectionId);
      if (input.schedule && (!defaults.providerId || !defaults.model)) throw new Error("Choose a default agent and model in this digest's bb project, then save again.");
      await ensureSection(true);
      let definition: DigestDefinition = { ...defaults, ...previous, id: previous?.id ?? `digest-${randomUUID()}`, name: input.name, ...(input.emoji !== undefined ? { emoji: input.emoji } : {}), instructions: input.instructions,
        connectionIds: previous?.connectionIds ?? [input.connectionId], ...(input.execution ? { execution: input.execution } : {}), schedule: input.schedule, enabled: previous?.enabled ?? false,
        automationId: previous?.automationId ?? null, permissionMode: previous?.permissionMode ?? "auto" as const, createdAt: previous?.createdAt ?? Date.now() };
      if (input.execution === null) delete definition.execution;
      if (previous?.automationId) {
        await automation("automations_update", { projectId: automationProject(previous), automationId: previous.automationId,
          name: `Digests · ${input.name}`, trigger: { triggerType: "schedule", ...input.schedule! },
          agent: { prompt: runPrompt(definition) } }, automationSchema);
      }
      definition = store.definitions.put(definition);
      if (!previous) {
        definition = await ensureAutomation(definition);
        try {
          await automation("automations_resume", { projectId: automationProject(definition), automationId: definition.automationId }, automationSchema);
          definition = store.definitions.put({ ...definition, enabled: true });
        } catch (error) {
          // Preserve a discoverable paused definition for retry, rather than
          // losing the association with the automation already created.
          bb.realtime.publish("issues", {});
          throw new Error(`Saved ${definition.name}, but could not turn it on. Try its switch again. ${error instanceof Error ? error.message : ""}`);
        }
      }
      if (previous?.automationId) definition = await ensureAutomation(definition);
      bb.realtime.publish("issues", {});
      return definition;
    });
  }

  async function executionOptions() {
    const [projects, hosts, environments] = await Promise.all([bb.sdk.projects.list({ includePersonal: true }), bb.sdk.hosts.list(), bb.sdk.environments.list()]);
    return { projects: projects.map(({ id, name, kind }) => ({ id, name, kind })), hosts: hosts.map(({ id, name }) => ({ id, name })),
      environments: environments.filter((environment) => environment.status === "ready" && environment.lifecycle.phase === "active")
        .map(({ id, name, projectId, hostId }) => ({ id, name: name ?? "Existing workspace", projectId, hostId })) };
  }

  async function discoverSites() {
    const configured = store.connections.list().find((entry) => entry.browserHostId);
    let browserHostId = configured?.browserHostId;
    let desktopInstanceId = configured?.desktopInstanceId;
    if (!browserHostId) {
      const candidates: Array<{ hostId: string; instanceId: string }> = [];
      for (const host of await bb.sdk.hosts.list()) {
        try {
          const { instances } = await bb.sdk.experimental_desktopBrowsers.listInstances({ hostId: host.id });
          candidates.push(...instances.map((instance) => ({ hostId: host.id, instanceId: instance.instanceId })));
        } catch { /* Offline hosts cannot supply the browser. */ }
      }
      if (candidates.length !== 1) throw new Error(candidates.length ? "More than one bb browser is available. Ask an agent to set Digests' browser computer, then reopen Settings." : "Open bb on the computer with your browser sign-ins, then reopen Settings.");
      browserHostId = candidates[0]!.hostId;
      desktopInstanceId = candidates[0]!.instanceId;
    }
    for (const site of SITES) {
      if (!store.connections.get(site.id)) store.connections.put({ ...site, browserHostId, desktopInstanceId });
    }
  }

  async function begin(digestId: string, threadId: string) {
    return exclusive(`begin:${threadId}`, async () => {
      const definition = await bindDefinition(requiredDefinition(digestId));
      const thread = await bb.sdk.threads.get({ threadId });
      const existing = store.issues.getByThread(threadId);
      if (!existing && thread.projectId !== definition.projectId && thread.projectId !== automationProject(definition)) {
        throw new Error("This thread isn’t a digest issue. Open Digests settings and choose Run now to create one.");
      }
      let issue = existing ?? newIssue(definition, threadId, `thread:${threadId}`);
      if (issue.digestId !== digestId) throw new Error("This thread already belongs to another digest.");
      if (issue.state === "ready") return { issue, directive: directive(issue), sessions: [], complete: true };
      await closeIssueBrowsers(issue);
      issue = changed(store.issues.update(issue.id, { state: "collecting", headline: `Preparing ${definition.name}`, details: "The briefing is being prepared.", recovery: null }));
      const sessions: BrowserLease[] = [];
      try {
        await bb.storage.kv.delete(`recovery:${issue.id}`);
        const requestedRetry = await bb.storage.kv.get<boolean>(`retry:${issue.id}`);
        await bb.storage.kv.delete(`retry:${issue.id}`);
        await ensureSection();
        await claimInbox(issue);
        if (definition.automationId && !requestedRetry) {
          const recent = await automation("automations_runs", { projectId: automationProject(definition), automationId: definition.automationId, limit: 100 }, z.object({ runs: z.array(runSchema) }).passthrough());
          const run = recent.runs.find((entry) => entry.threadId === threadId);
          if (run && Date.now() - run.scheduledFor > 15 * 60 * 1000) {
            throw new Error("bb was unavailable or this run was delayed at the scheduled time. Retry to prepare this issue now.");
          }
        }
        await bb.sdk.threads.update({ threadId, title: issueTitle(definition, issue.createdAt) });
        for (const connectionId of definition.connectionIds) {
          const connection = store.connections.get(connectionId);
          if (!connection) throw new Error(`Connection ${connectionId} is missing. Configure it in Digests, then Retry.`);
          try {
            const lease = await openBrowser(bb, connection, threadId);
            sessions.push(lease);
            await bb.storage.kv.set(`browsers:${issue.id}`, sessions);
            const accountName = await checkSignIn(bb, connection, lease);
            store.connections.put({ ...connection, accountName, status: "signed-in", checkedAt: Date.now(), detail: null });
          } catch (error) {
            store.connections.put({ ...connection, accountName: null, status: error instanceof ConnectionError ? error.status : "unavailable", checkedAt: Date.now(), detail: (error instanceof Error ? error.message : String(error)).slice(0, 2000) });
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
        issue = store.issues.update(issue.id, { headline: payload.headline, lede: payload.lede, details: payload.details, metrics: payload.metrics, brief: payload.brief });
        issue = await spawnDelivery(definition, issue);
      }
      // External publishers may retry a failed delivery with the same key.
      if (issue.state === "failed") issue = store.issues.update(issue.id, { state: "collecting", recovery: null });
      return publishCurrent(issue.threadId!, payload);
    });
  }
  type Dispatch = { projectId: string; automationId: string; runId: string };
  async function finishDispatch(id: string, run: z.infer<typeof runSchema>) {
    if (!run.threadId) {
      if (run.status === "running") return { threadId: null, pending: true };
      await bb.storage.kv.delete(`dispatch:${id}`);
      throw new ExecutionError(await runError(id, new Error(run.error ?? "No issue thread was created")));
    }
    const definition = requiredDefinition(id);
    const issue = store.issues.getByThread(run.threadId) ?? newIssue(definition, run.threadId, `run:${run.id}`, run.scheduledFor);
    await bb.sdk.threads.update({ threadId: run.threadId, title: issueTitle(definition, issue.createdAt) });
    await claimInbox(issue);
    await bb.storage.kv.delete(`dispatch:${id}`);
    await bb.storage.kv.delete(`run-error:${id}`);
    bb.realtime.publish("issues", {});
    return { threadId: run.threadId };
  }
  async function runStatus(id: string) {
    const dispatch = await bb.storage.kv.get<Dispatch>(`dispatch:${id}`);
    if (!dispatch) return { threadId: null };
    const { runs } = await automation("automations_runs", { projectId: dispatch.projectId, automationId: dispatch.automationId, limit: 100 }, z.object({ runs: z.array(runSchema) }).passthrough());
    const run = runs.find((run) => run.id === dispatch.runId);
    return run ? finishDispatch(id, run) : { threadId: null, pending: true };
  }
  async function run(id: string) {
    return exclusive(`definition:${id}`, async () => {
      // Automations dispatch is asynchronous. Repeated clicks join that run
      // until it has a thread or an actual terminal failure.
      if (await bb.storage.kv.get<Dispatch>(`dispatch:${id}`)) return runStatus(id);
      try {
        const definition = await ensureAutomation(requiredDefinition(id));
        await ensureSection();
        const result = await automation("automations_run", { projectId: automationProject(definition), automationId: definition.automationId }, z.object({ run: runSchema }).passthrough());
        await bb.storage.kv.set(`dispatch:${id}`, { projectId: automationProject(definition), automationId: definition.automationId, runId: result.run.id });
        const status = await finishDispatch(id, result.run);
        bb.realtime.publish("issues", {});
        return status;
      } catch (error) {
        const message = await runError(id, error);
        throw new Error(message);
      }
    });
  }
  async function setEnabled(id: string, enabled: boolean) {
    return exclusive(`definition:${id}`, async () => {
      let definition = requiredDefinition(id);
      if (enabled) { await ensureSection(); definition = await ensureAutomation(definition); }
      if (definition.automationId) await automation(enabled ? "automations_resume" : "automations_pause", { projectId: automationProject(definition), automationId: definition.automationId }, automationSchema);
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
      if (!deliveryFailed) changed(store.issues.update(id, { state: "collecting", headline: `Preparing ${requiredDefinition(issue.digestId).name}`, lede: "", details: "The briefing is being prepared.", recovery: null }));
      try {
        await bb.sdk.threads.send({ threadId, mode: "queue-if-active", input: [{ type: "text", mentions: [],
          text: deliveryFailed ? deliveryPrompt(issue) : runPrompt(requiredDefinition(issue.digestId)),
          visibility: "agent-only",
        }] });
      } catch (error) {
        await bb.storage.kv.delete(`retry:${id}`);
        if (!previousManualRetry) await bb.storage.kv.delete(`manual-retry:${id}`);
        if (!deliveryFailed) changed(store.issues.update(id, { state: issue.state, headline: issue.headline, lede: issue.lede, details: issue.details, recovery: issue.recovery }));
        throw new Error("Couldn’t start the retry. Check that bb is connected on your browser’s computer, then Retry.");
      }
      return { threadId };
    });
  }
  async function reconnect(threadId: string, id: string) {
    const issue = requiredIssue(threadId, id);
    const definition = requiredDefinition(issue.digestId);
    const connection = definition.connectionIds.map((value) => store.connections.get(value)).find((value) => value && value.status !== "signed-in");
    if (!connection) throw new Error("No connection needs reconnecting. Retry the issue.");
    const result = await revealConnection(connection, threadId);
    return { message: result.message };
  }
  async function revealConnection(connection: Connection, threadId: string) {
    const scope = await connectionScope(bb, connection, threadId);
    const tab = await bb.sdk.experimental_desktopBrowsers.createTab({ ...scope, url: connection.url, presentation: "reveal" });
    if (Object.hasOwn(tab.tab, "profile")) {
      await bb.sdk.experimental_desktopBrowsers.closeTab({ ...scope, tabId: tab.tab.tabId });
      throw new Error("Update bb to 0.45 or later first, then Retry. Your existing BB Browser sign-ins will be used.");
    }
    return { message: `Opened ${connection.name} in bb Browser. Complete sign-in there, then check the connection again.`, threadId };
  }
  async function settingsConnectionThread(connectionId: string): Promise<string> {
    // Setup is explicitly invoked from a thread. Reuse that ownership, never
    // borrow one of its tabs. Existing installations can use a digest issue.
    const setupThreadId = await bb.storage.kv.get<string>("connection-settings-thread");
    const issues = store.issues.list({ limit: 100 }).filter((issue) =>
      issue.threadId && store.definitions.get(issue.digestId)?.connectionIds.includes(connectionId));
    const candidates = [...new Set([setupThreadId, ...issues.map((issue) => issue.threadId)])];
    for (const threadId of candidates) {
      if (!threadId) continue;
      try {
        const thread = await bb.sdk.threads.get({ threadId });
        if (!thread.archivedAt) return threadId;
      } catch { /* A deleted owner cannot own a fresh browser tab. */ }
    }
    const defaults = await settingsDefaults(connectionId);
    // Empty input is a supported dormant thread: no agent turn or account work.
    // It owns new check tabs only, never borrows an open user tab.
    const target = await targetFor({ ...defaults, connectionIds: [connectionId] });
    const thread = await bb.sdk.threads.spawn({ ...target,
      title: "Digests browser checks", visibility: "hidden", input: [], pluginMetadata: { purpose: "connection-checks" } });
    await bb.storage.kv.set("connection-settings-thread", thread.id);
    return thread.id;
  }
  async function checkConnections(id?: string, ownerThreadId?: string) {
    return exclusive("connection-settings", async () => {
      if (!id) await discoverSites();
      const selected = id ? [store.connections.get(id)] : store.connections.list();
      for (const connection of selected) {
        if (!connection) throw new Error("Unknown connection.");
        let lease: BrowserLease | undefined;
        try {
          const threadId = ownerThreadId ?? await settingsConnectionThread(connection.id);
          lease = await openBrowser(bb, connection, threadId);
          const accountName = await checkSignIn(bb, connection, lease);
          store.connections.put({ ...connection, accountName, status: "signed-in", checkedAt: Date.now(), detail: null });
        } catch (error) {
          store.connections.put({ ...connection, accountName: null, status: error instanceof ConnectionError ? error.status : "unavailable", checkedAt: Date.now(), detail: error instanceof ConnectionError ? error.message : `Couldn’t reach ${connection.name} on its browser computer. Check that bb is connected, then Retry.` });
        } finally {
          if (lease) await closeBrowser(bb, lease).catch((error: unknown) => bb.log.warn(String(error)));
        }
      }
      return store.connections.list();
    });
  }
  let settingsCheck: Promise<Connection[]> | undefined;
  let settingsCheckedAt: number | undefined;
  function checkSettingsConnections(): Promise<Connection[]> {
    if (settingsCheck) return settingsCheck;
    if (settingsCheckedAt !== undefined && Date.now() - settingsCheckedAt < 30_000) return Promise.resolve(store.connections.list());
    settingsCheck = checkConnections().then((connections) => {
      settingsCheckedAt = Date.now();
      return connections;
    }).finally(() => { settingsCheck = undefined; });
    return settingsCheck;
  }
  async function settingsPreferences() {
    return { importBannerDismissed: await bb.storage.kv.get<boolean>("import-banner-dismissed") === true };
  }
  async function dismissImportBanner() {
    await bb.storage.kv.set("import-banner-dismissed", true);
    return true;
  }
  async function reconnectConnection(id: string) {
    const connection = store.connections.get(id);
    if (!connection) throw new Error("Unknown connection.");
    return revealConnection(connection, await settingsConnectionThread(id));
  }
  async function overview() {
    const plugins = await bb.sdk.plugins.list();
    let organizerReady = false;
    try { organizerReady = (await organizer()).stages.some((entry) => entry.key === "digests" && entry.role === "inbox" && entry.catchesPluginId === "digests"); } catch { /* Settings shows setup guidance. */ }
    const runErrors: Record<string, string> = {};
    const startingIds: string[] = [];
    for (const definition of store.definitions.list()) {
      const message = await bb.storage.kv.get<string>(`run-error:${definition.id}`);
      if (message) runErrors[definition.id] = message;
      if (await bb.storage.kv.get(`dispatch:${definition.id}`)) startingIds.push(definition.id);
    }
    return { startingIds, runErrors, definitions: store.definitions.list(), connections: store.connections.list(), actionCardsAvailable: plugins.plugins.some((entry) => entry.id === "inline-action-cards" && entry.enabled && entry.status === "running"), organizerReady };
  }
  async function reconcile() {
    for (const definition of store.definitions.list()) {
      if (!definition.automationId) continue;
      try {
        const result = await automation("automations_runs", { projectId: automationProject(definition), automationId: definition.automationId, limit: 100 }, z.object({ runs: z.array(runSchema), nextCursor: z.string().nullable() }));
        for (const run of result.runs.reverse()) {
          let issue = run.threadId ? store.issues.getByThread(run.threadId) : store.issues.getByKey(definition.id, `run:${run.id}`);
          if (issue?.state === "ready") continue;
          if (issue && await bb.storage.kv.get<boolean>(`manual-retry:${issue.id}`)) continue;
          const created = !issue;
          if (!issue) issue = newIssue(definition, run.threadId, `run:${run.id}`, run.scheduledFor);
          if (run.threadId && created) {
            await bb.sdk.threads.update({ threadId: run.threadId, title: issueTitle(definition, issue.createdAt) });
            await claimInbox(issue);
          }
          const late = run.startedAt - run.scheduledFor > 15 * 60 * 1000;
          if (["failed", "skipped"].includes(run.status) || (run.status === "succeeded" && issue.state === "collecting")) {
            issue = await fail(issue, late ? "bb was unavailable at the scheduled time. Retry to prepare this issue now." : !run.threadId ? executionFailure(new Error(run.error ?? "No issue thread")) : run.error || run.skipReason || "The run ended before publishing a digest. Retry to prepare it.", "retry", !!run.threadId);
            if (!issue.threadId) {
              try { await spawnDelivery(definition, issue); }
              catch (error) { await runError(definition.id, error); }
            }
          }
        }
      } catch (error) { bb.log.warn(`Digest ${definition.id}: ${error instanceof Error ? error.message : String(error)}`); }
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
    if (!issue) return null;
    if (issue.state === "failed" || issue.state === "collecting") return issue;
    if (!await bb.storage.kv.get<boolean>(`recovery:${issue.id}`)) return null;
    if (issue.state === "ready") return { ...issue, state: "failed" as const, recovery: "retry" as const,
      details: `Your issue was saved, but its delivery turn failed. Retry to display it without collecting again.\n\n${issue.details}` };
    return null;
  }
  return { store, bindDefinition, executionOptions, saveDigest, recoveryIssue, begin, publishCurrent, publishExternal, fail, requiredIssue, requiredDefinition, run, runStatus, setEnabled, retry, reconnect, checkConnections, checkSettingsConnections, settingsPreferences, dismissImportBanner, reconnectConnection, overview, reconcile, settled, ensureSection, ensureAutomation, closeIssueBrowsers };
}
