import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, defineRpcContract, type BbPluginApi, type PluginCliContext, type PluginThreadEventPayloads } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { actionSchema, assertAction, bulkLabel, contentSchema, draftSchema, idSchema, itemSchema, tableContentSchema, tableSchema, tableViewSchema, type Item } from "./model.js";

const ref = z.object({ threadId: idSchema, id: idSchema }).strict();
const versioned = ref.extend({ revision: z.number().int().positive() });
export const rpcContract = defineRpcContract({
  get: { input: ref, output: itemSchema },
  save: { input: versioned.extend({ draft: draftSchema }), output: itemSchema },
  prepare: { input: versioned.extend({ action: actionSchema }), output: itemSchema },
  reopen: { input: versioned, output: itemSchema },
  table: { input: ref, output: tableViewSchema },
  prepareTable: { input: ref.extend({ items: z.array(z.object({ id: idSchema, revision: z.number().int().positive() }).strict()).min(1).max(20) }), output: z.array(itemSchema) },
  submitted: { input: ref.extend({ attemptId: z.string().uuid(), queued: z.boolean(), sendAt: z.number().int().positive().optional() }), output: itemSchema },
});
type QueueEntry = PluginThreadEventPayloads["message.queued"]["entry"];

export function createStore(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    "CREATE TABLE action_items (thread_id TEXT NOT NULL, item_id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (thread_id, item_id))",
    "CREATE TABLE action_tables (thread_id TEXT NOT NULL, table_id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (thread_id, table_id))",
  ]);
  const read = db.prepare("SELECT value FROM action_items WHERE thread_id = ? AND item_id = ?");
  const write = db.prepare("INSERT INTO action_items VALUES (?, ?, ?) ON CONFLICT(thread_id, item_id) DO UPDATE SET value=excluded.value");
  const readTable = db.prepare("SELECT value FROM action_tables WHERE thread_id = ? AND table_id = ?");
  const get = (threadId: string, id: string): Item => {
    const row = read.get(threadId, id) as { value: string } | undefined;
    if (!row) throw new Error("This card is unavailable. Ask the agent to recreate it with the same item ID.");
    return itemSchema.parse(JSON.parse(row.value));
  };
  const persist = (item: Item) => {
    const next = itemSchema.parse(item);
    write.run(next.threadId, next.id, JSON.stringify(next));
    return next;
  };
  const change = (threadId: string, id: string, revision: number | null, update: (item: Item) => void) => {
    const next = db.transaction(() => {
      const item = get(threadId, id);
      if (revision !== null && item.revision !== revision) throw new Error("This card changed elsewhere. Reload it before continuing; your unsaved text is still here.");
      update(item);
      item.revision++;
      item.updatedAt = new Date().toISOString();
      return persist(item);
    })();
    bb.realtime.publish("items", { threadId, id });
    return next;
  };
  const table = (threadId: string, id: string) => {
    const row = readTable.get(threadId, id) as { value: string } | undefined;
    if (!row) throw new Error("This table is unavailable. Ask the agent to recreate it.");
    const value = tableSchema.parse(JSON.parse(row.value));
    return { ...value, items: value.ids.map((itemId) => get(threadId, itemId)) };
  };
  const prepare = (item: Item, action: z.infer<typeof actionSchema>) => {
    if (item.state !== "ready" && !(item.state === "failed" && item.result?.retryable)) throw new Error("This card already has an action in progress or has finished.");
    assertAction(item, action);
    if (item.state === "failed" && action !== item.attempt?.action) throw new Error("Retry the original action, or reopen the card to choose another.");
    item.state = "pending";
    item.attempt = { id: randomUUID(), action, claimed: false };
    item.result = null;
  };
  return {
    get,
    table,
    createTable(threadId: string, id: string, raw: unknown) {
      const content = tableContentSchema.parse(raw);
      return db.transaction(() => {
        content.ids.forEach((itemId) => get(threadId, itemId));
        if (readTable.get(threadId, id)) throw new Error("That table ID already exists. Reuse its directive.");
        const value = { ...content, threadId, id };
        db.prepare("INSERT INTO action_tables VALUES (?, ?, ?)").run(threadId, id, JSON.stringify(value));
        return value;
      })();
    },
    prepareTable(input: z.infer<typeof rpcContract.prepareTable.input>) {
      const next = db.transaction(() => {
        const group = table(input.threadId, input.id);
        if (!bulkLabel(group.items)) throw new Error("These rows do not share one action. Choose each row separately.");
        const ready = group.items.filter((item) => item.state === "ready");
        if (!ready.length || ready.length !== input.items.length || new Set(input.items.map((item) => item.id)).size !== input.items.length || ready.some((item) => !input.items.some((candidate) => candidate.id === item.id && candidate.revision === item.revision))) throw new Error("This table changed. Review the remaining rows, then try again.");
        return ready.map((item) => {
          prepare(item, "yes"); item.revision++; item.updatedAt = new Date().toISOString();
          return persist(item);
        });
      })();
      bb.realtime.publish("items", { threadId: input.threadId });
      return next;
    },
    create(threadId: string, id: string, raw: unknown) {
      const content = contentSchema.parse(raw);
      return db.transaction(() => {
        if (read.get(threadId, id)) throw new Error("That item ID already exists. Read it and revise its draft instead of replacing the card.");
        return persist({ threadId, id, content, revision: 1, state: "ready", attempt: null, result: null, updatedAt: new Date().toISOString() });
      })();
    },
    save(input: z.infer<typeof rpcContract.save.input>) {
      return change(input.threadId, input.id, input.revision, (item) => {
        if (item.state !== "ready" || item.content.type !== "reply") throw new Error("This draft cannot be edited while an action is pending or completed.");
        item.content.draft = input.draft;
      });
    },
    prepare(input: z.infer<typeof rpcContract.prepare.input>) {
      return change(input.threadId, input.id, input.revision, (item) => {
        prepare(item, input.action);
      });
    },
    claim(threadId: string, id: string, attemptId: string) {
      return change(threadId, id, null, (item) => {
        if (item.state !== "pending" || item.attempt?.id !== attemptId || item.attempt.claimed) throw new Error("This attempt is stale or already claimed. Read its status and reconcile the external result; do not act again.");
        item.attempt.claimed = true;
        // A claim proves the request reached the agent, even if a queue event was missed.
        if (item.attempt.queued || !item.attempt.sentAt) sent(item);
      });
    },
    // The composer accepted the request. Queue events are authoritative, so only fill a gap.
    submitted(input: z.infer<typeof rpcContract.submitted.input>) {
      const item = get(input.threadId, input.id);
      if (item.state !== "pending" || item.attempt?.id !== input.attemptId || item.attempt.claimed || item.attempt.sentAt || item.attempt.queued) return item;
      return change(input.threadId, input.id, null, (next) => {
        if (input.queued) Object.assign(next.attempt!, { queued: true, sendAt: input.sendAt });
        else sent(next);
      });
    },
    queue(event: "queued" | "dispatched" | "cancelled", entry: QueueEntry) {
      for (const { threadId, id, attemptId } of attemptRefs(bb.pluginId, entry)) {
        const item = read.get(threadId, id) ? get(threadId, id) : null;
        if (item?.state !== "pending" || item.attempt?.id !== attemptId || item.attempt.claimed) continue;
        change(threadId, id, null, (next) => {
          // A request deleted from the queue was never sent; let the user choose again.
          if (event === "cancelled") { next.state = "ready"; next.attempt = null; }
          else if (event === "dispatched") sent(next);
          else { Object.assign(next.attempt!, { queued: true, sendAt: entry.sendAt ?? undefined }); delete next.attempt!.sentAt; }
        });
      }
    },
    report(threadId: string, id: string, attemptId: string, outcome: "succeeded" | "failed", message: string, retryable: boolean) {
      return change(threadId, id, null, (item) => {
        if (item.attempt?.id !== attemptId || !item.attempt.claimed || (item.state !== "pending" && item.state !== "failed")) throw new Error("Report the current claimed attempt only.");
        item.state = outcome;
        item.result = { message, retryable: outcome === "failed" && retryable };
      });
    },
    reopen(input: z.infer<typeof rpcContract.reopen.input>) {
      return change(input.threadId, input.id, input.revision, (item) => {
        const deferred = item.state === "succeeded" && ["later", "skip"].includes(item.attempt?.action ?? "");
        if (!deferred && !(item.state === "failed" && item.result?.retryable)) throw new Error("Check the outcome with the agent before reopening this card.");
        item.state = "ready"; item.result = null; item.attempt = null;
      });
    },
  };
}

function sent(item: Item) {
  item.attempt!.sentAt = new Date().toISOString();
  delete item.attempt!.queued; delete item.attempt!.sendAt;
}

// Card requests carry an action mention whose id is threadId:itemId:attemptId.
function attemptRefs(pluginId: string, entry: QueueEntry) {
  return entry.content.flatMap((block) => block.type === "text" ? block.mentions : []).flatMap(({ resource }) => {
    if (resource.kind !== "plugin" || resource.pluginId !== pluginId || !resource.itemId.startsWith("action:")) return [];
    const [threadId, id, attemptId, extra] = resource.itemId.slice("action:".length).split(":");
    const parsed = z.object({ threadId: idSchema, id: idSchema, attemptId: z.string().uuid() }).safeParse({ threadId, id, attemptId });
    return parsed.success && !extra && threadId === entry.threadId ? [parsed.data] : [];
  });
}

export default function plugin(bb: BbPluginApi): void {
  const store = createStore(bb);
  bb.rpc.register(rpcContract, {
    get: ({ threadId, id }) => store.get(threadId, id),
    save: store.save, prepare: store.prepare, reopen: store.reopen,
    table: ({ threadId, id }) => store.table(threadId, id), prepareTable: store.prepareTable, submitted: store.submitted,
  });
  for (const event of ["queued", "dispatched", "cancelled"] as const) {
    bb.events.on(`message.${event}`, ({ entry }) => {
      try { store.queue(event, entry); } catch (err) { bb.log.warn(`Could not update an action card from a queue event: ${err instanceof Error ? err.message : String(err)}`); }
    });
  }
  bb.ui.registerMentionProvider({
    id: "action", label: "Action cards", search: () => [],
    resolve(value) {
      const [thread, id, attempt, extra] = value.split(":");
      if (extra || !attempt) throw new Error("This action reference is incomplete. Use the card again.");
      const item = store.get(idSchema.parse(thread), idSchema.parse(id));
      const changes = attempt === "changes";
      if (!changes && item.attempt?.id !== attempt) throw new Error("This action was replaced. Use the latest card.");
      return { context: JSON.stringify({
        kind: "inline-action-card", threadId: item.threadId, itemId: item.id,
        intent: changes ? "request-changes" : item.state === "failed" ? "check-outcome" : "approved-action",
        attemptId: changes ? null : item.attempt!.id, action: changes ? null : item.attempt!.action,
        instruction: changes ? "Read the latest saved item and revise that same draft. This is not approval to act."
          : "Claim this exact attempt once with bb action-cards claim before acting. Use the returned latest saved content. A failed/claimed/completed attempt authorizes reconciliation only; never repeat its side effect. Report the verified result with bb action-cards report.",
      }) };
    },
  });
  const threadOption = { type: "string", description: "Owning thread; defaults to this thread" } as const;
  const itemPosition = [{ name: "id", required: true, description: "Stable item ID" }] as const;
  const scope = (ctx: PluginCliContext, thread?: string) => idSchema.parse(thread ?? ctx.threadId);
  const output = (item: Item) => ({ exitCode: 0, stdout: `${JSON.stringify(item, null, 2)}\n` });
  bb.cli.register(defineCli({
    name: "action-cards", summary: "Create inline cards, read saved drafts, and report action results",
    commands: {
      "create-table": cliCommand({
        summary: "Group existing items in an inline table", positionals: itemPosition,
        options: { thread: threadOption, table: { type: "string", required: true, stdin: true, description: "Table JSON with title and item ids; use --table-stdin" } },
        run({ options, positionals }, ctx) {
          const id = idSchema.parse(positionals.id);
          store.createTable(scope(ctx, options.thread), id, JSON.parse(options.table));
          return { exitCode: 0, stdout: `::actions{id="${id}"}\n` };
        },
      }),
      create: cliCommand({
        summary: "Create one card; prints its directive", positionals: itemPosition,
        options: { thread: threadOption, item: { type: "string", required: true, stdin: true, description: "Reply or Decide JSON; use --item-stdin" } },
        run({ options, positionals }, ctx) {
          const id = idSchema.parse(positionals.id);
          store.create(scope(ctx, options.thread), id, JSON.parse(options.item));
          return { exitCode: 0, stdout: `::action{id="${id}"}\n` };
        },
      }),
      get: cliCommand({
        summary: "Read the latest saved draft, action, and result", positionals: itemPosition,
        options: { thread: threadOption },
        run: ({ options, positionals }, ctx) => output(store.get(scope(ctx, options.thread), idSchema.parse(positionals.id))),
      }),
      revise: cliCommand({
        summary: "Update the same ready draft after Ask for changes", positionals: itemPosition,
        options: { thread: threadOption, revision: { type: "integer", min: 1, max: Number.MAX_SAFE_INTEGER, required: true, description: "Revision returned by get" }, draft: { type: "string", required: true, stdin: true, description: "Replacement draft; use --draft-stdin" } },
        run: ({ options, positionals }, ctx) => output(store.save({ threadId: scope(ctx, options.thread), id: idSchema.parse(positionals.id), revision: options.revision, draft: draftSchema.parse(options.draft) })),
      }),
      claim: cliCommand({
        summary: "Claim a clicked attempt once and read its saved draft", positionals: itemPosition,
        options: { thread: threadOption, attempt: { type: "string", required: true, description: "Attempt ID from the clicked message" } },
        run: ({ options, positionals }, ctx) => output(store.claim(scope(ctx, options.thread), idSchema.parse(positionals.id), z.string().uuid().parse(options.attempt))),
      }),
      report: cliCommand({
        summary: "Report the current attempt result; cards refresh in place", positionals: itemPosition,
        options: {
          thread: threadOption, attempt: { type: "string", required: true, description: "Claimed attempt ID" },
          outcome: { type: "enum", values: ["succeeded", "failed"], required: true, description: "Verified outcome" },
          message: { type: "string", required: true, description: "Short human-readable result or recovery instruction" },
          retryable: { type: "boolean", description: "Only after verifying the action did not happen and retry is safe" },
        },
        run: ({ options, positionals }, ctx) => output(store.report(scope(ctx, options.thread), idSchema.parse(positionals.id), z.string().uuid().parse(options.attempt), options.outcome, z.string().trim().min(1).max(500).parse(options.message), options.retryable)),
      }),
    },
  }));
}
