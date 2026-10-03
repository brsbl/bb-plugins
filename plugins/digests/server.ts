import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { cliCommand, defineCli, type BbPluginApi, type PluginCliContext } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { rpcContract } from "./contracts.js";
import { createService } from "./service.js";
import { connectionSchema, digestDefinitionSchema, publishInputSchema, IdSchema, DigestIdSchema } from "./model.js";
import { DIGEST_RECIPES } from "./recipes.js";
import { directive } from "./prompts.js";
import { checkSignIn, closeBrowser, openBrowser, ConnectionError } from "./browser.js";

const json = { type: "boolean", description: "Print JSON" } as const;
const digest = { type: "string", required: true, description: "Digest ID, from bb digest list" } as const;
const file = { type: "string", required: true, description: "UTF-8 file on this thread's computer, at most 100 KB" } as const;
const output = (value: unknown) => ({ exitCode: 0, stdout: JSON.stringify(value, null, 2) });
const requireThread = (ctx: PluginCliContext) => {
  if (!ctx.threadId) throw new Error("Run this command from a bb thread so its computer and project are explicit.");
  return ctx.threadId;
};

export default function plugin(bb: BbPluginApi) {
  const service = createService(bb);
  async function readFile(path: string, ctx: PluginCliContext) {
    const thread = await bb.sdk.threads.get({ threadId: requireThread(ctx), include: "environment" });
    if (!("environment" in thread) || !thread.environment?.hostId || !thread.environment.path) throw new Error("The invoking thread needs an available workspace.");
    const rootPath = ctx.cwd || thread.environment.path;
    const result = await bb.sdk.files.read({ hostId: thread.environment.hostId, path: resolve(rootPath, path), rootPath });
    if (result.contentEncoding !== "utf8" || result.sizeBytes > 100_000) throw new Error("Use a UTF-8 file no larger than 100 KB.");
    return result.content;
  }
  async function define(raw: unknown) {
    const definition = digestDefinitionSchema.parse(raw);
    if (service.store.definitions.get(definition.id)) throw new Error("This digest already exists. Keep its definition and automation together; use a new ID for a different briefing.");
    if (definition.enabled || definition.automationId) throw new Error("New definitions must be disabled and cannot adopt an existing automation.");
    return service.store.definitions.put(definition);
  }
  bb.rpc.register(rpcContract, {
    overview: service.overview,
    recoveryIssue: ({ threadId }) => service.recoveryIssue(threadId),
    getIssue: ({ threadId, id }) => service.requiredIssue(threadId, id),
    setEnabled: ({ id, enabled }) => service.setEnabled(id, enabled),
    run: ({ id }) => service.run(id),
    retry: ({ threadId, id }) => service.retry(threadId, id),
    reconnect: ({ threadId, id }) => service.reconnect(threadId, id),
  });
  bb.cli.register(defineCli({
    name: "digest", summary: "Define private briefings, run them, or publish an issue in a native thread",
    commands: {
      list: cliCommand({ summary: "List digest definitions and their schedules", options: { json }, run: () => output(service.store.definitions.list()) }),
      templates: cliCommand({ summary: "Show the Unread email, Money, Reading, and X scorecard recipes", options: { json }, run: () => output(DIGEST_RECIPES) }),
      setup: cliCommand({
        summary: "Create disabled starter definitions and connection metadata; leaves existing automations untouched",
        options: {
          project: { type: "string", description: "Project for issue threads; defaults to this thread's project" },
          "browser-host": { type: "string", required: true, description: "Computer running your signed-in bb browser" },
          provider: { type: "string", required: true, description: "Agent provider for scheduled runs" },
          model: { type: "string", required: true, description: "Agent model for scheduled runs" }, json,
        },
        async run(input, ctx) {
          const projectId = input.options.project ?? ctx.projectId;
          if (!projectId) throw new Error("Pass --project with the project for digest issue threads.");
          for (const entry of [ { id: "gmail", name: "Gmail", url: "https://mail.google.com/mail/u/0/" }, { id: "x", name: "X", url: "https://x.com/home" }, { id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/feed/" } ]) {
            if (!service.store.connections.get(entry.id)) service.store.connections.put(connectionSchema.parse({ ...entry, browserHostId: input.options["browser-host"] }));
          }
          for (const recipe of DIGEST_RECIPES) {
            if (!service.store.definitions.get(recipe.id)) await define({ ...recipe, projectId, providerId: input.options.provider, model: input.options.model, createdAt: Date.now() });
          }
          await service.ensureSection();
          return output({ definitions: service.store.definitions.list(), next: "Review and enable schedules in Digests plugin settings. Enable the Thread Organizer section's Return after read option for Digests. Existing automations were not changed." });
        },
      }),
      define: cliCommand({ summary: "Create a disabled digest from a JSON definition", options: { file, json }, async run(input, ctx) { return output(await define(JSON.parse(await readFile(input.options.file, ctx)))); } }),
      run: cliCommand({ summary: "Run a digest now in its own issue thread", options: { digest, json }, async run(input) { return output(await service.run(input.options.digest)); } }),
      publish: cliCommand({
        summary: "Publish Markdown as a new issue from any thread, or finish this run's issue",
        options: { digest, file, json, headline: { type: "string", description: "Story headline; defaults to first Markdown line" }, lede: { type: "string", description: "One or two opening sentences, with important counts in bold" }, metrics: { type: "string", description: "Optional structured metrics retained with the issue; include visible numbers in the prose" }, sources: { type: "string", description: "JSON array of connectionId/messageId/threadId source references" }, key: { type: "string", description: "Idempotency key; defaults to the content SHA-256" } },
        async run(input, ctx) {
          const details = await readFile(input.options.file, ctx);
          const payload = publishInputSchema.parse({ headline: input.options.headline ?? details.split(/\r?\n/).find((line) => line.trim())?.replace(/^#+\s*/, "").slice(0, 240), lede: input.options.lede, details, metrics: JSON.parse(input.options.metrics ?? "[]"), sources: JSON.parse(input.options.sources ?? "[]") });
          const current = service.store.issues.getByThread(requireThread(ctx));
          if (current && current.digestId !== input.options.digest) throw new Error("This run belongs to a different digest. Publish from another thread.");
          const result = current ? await service.publishCurrent(ctx.threadId!, payload) : await service.publishExternal(input.options.digest, payload, input.options.key ?? createHash("sha256").update(JSON.stringify(payload)).digest("hex"));
          return output(result);
        },
      }),
      "connections set": cliCommand({ summary: "Save connection metadata from JSON, without copying credentials", options: { file, json }, async run(input, ctx) {
        const connection = connectionSchema.parse(JSON.parse(await readFile(input.options.file, ctx)));
        return output(service.store.connections.put({ ...connection, status: "unknown", checkedAt: null, detail: null }));
      } }),
      "connections status": cliCommand({ summary: "Show saved connection checks, or check now using fresh signed-in tabs", options: { json, check: { type: "boolean", description: "Perform live read-only checks from this thread" } }, async run(input, ctx) {
        if (input.options.check) {
          for (const connection of service.store.connections.list()) {
            let lease;
            try {
              lease = await openBrowser(bb, connection, requireThread(ctx));
              await checkSignIn(bb, connection, lease);
              service.store.connections.put({ ...connection, status: "signed-in", checkedAt: Date.now(), detail: null });
            } catch (error) {
              service.store.connections.put({ ...connection, status: error instanceof ConnectionError ? error.status : "unavailable", checkedAt: Date.now(), detail: error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000) });
            } finally { if (lease) await closeBrowser(bb, lease).catch((error: unknown) => bb.log.warn(String(error))); }
          }
        }
        return output(service.store.connections.list());
      } }),
    },
  }));
  bb.agents.registerTool({
    name: "digest_begin", description: "Begin this scheduled Digests issue, check its connections, and acquire fresh browser sessions. Emit a returned failure directive and stop if complete is true.",
    parameters: z.object({ digestId: DigestIdSchema }).strict(),
    execute: async ({ digestId }, ctx) => JSON.stringify(await service.begin(digestId, ctx.threadId)),
  });
  bb.agents.registerTool({
    name: "digest_publish", description: "Publish this run's visual summary and atomically record its source message IDs. Emit the returned directive first in your final reply.",
    parameters: publishInputSchema,
    execute: async (input, ctx) => JSON.stringify(await service.publishCurrent(ctx.threadId, input)),
  });
  bb.agents.registerTool({
    name: "digest_fail", description: "Show an honest in-place failure with Retry or Reconnect and release this issue's browser sessions.",
    parameters: z.object({ message: z.string().min(1).max(2000), recovery: z.enum(["retry", "reconnect"]).default("retry") }).strict(),
    execute: async (input, ctx) => {
      const issue = await service.fail(service.requiredIssue(ctx.threadId), input.message, input.recovery);
      return JSON.stringify({ issue, directive: directive(issue) });
    },
  });
  bb.agents.registerTool({
    name: "digest_processed", description: "Check which candidate Gmail message IDs this digest already summarized. This never marks Gmail messages read.",
    parameters: z.object({ connectionId: DigestIdSchema, messageIds: z.array(IdSchema).max(1000) }).strict(),
    execute: (input, ctx) => {
      const issue = service.requiredIssue(ctx.threadId);
      const definition = service.requiredDefinition(issue.digestId);
      if (!definition.connectionIds.includes(input.connectionId)) throw new Error("This connection is not declared by the digest.");
      return JSON.stringify(service.store.processed(issue.digestId, input.connectionId, input.messageIds));
    },
  });
  bb.agents.configure(() => ({ tools: ["digest_begin", "digest_publish", "digest_fail", "digest_processed"], skills: ["digests"] }));
  bb.events.on("thread.idle", ({ thread }) => service.settled(thread.id, false));
  bb.events.on("thread.failed", ({ thread }) => service.settled(thread.id, true));
  for (const event of ["thread.archived", "thread.deleted"] as const) bb.events.on(event, async ({ thread }) => {
    const issue = service.store.issues.getByThread(thread.id);
    if (issue) await service.closeIssueBrowsers(issue);
  });
  bb.background.service("issue-lifecycle", {
    async start(signal) {
      while (!signal.aborted) {
        try { await service.reconcile(); } catch (error) { bb.log.warn(`Digest reconciliation failed: ${String(error)}`); }
        await new Promise<void>((resolveWait) => {
          if (signal.aborted) { resolveWait(); return; }
          const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); resolveWait(); };
          const timer = setTimeout(done, 30000);
          signal.addEventListener("abort", done, { once: true });
        });
      }
    },
  });
}
