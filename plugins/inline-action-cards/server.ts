import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, defineRpcContract, type BbPluginApi, type PluginCliContext, type PluginThreadEventPayloads } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { actionLabel, actionMessage, mentionId, title, logSchema, actionSchema, answerSchema, assertAction, bulkLabel, contentSchema, draftSchema, followUpSchema, idSchema, itemSchema, itemViewSchema, noteSchema, tableContentSchema, tableSchema, tableViewSchema, type FollowUp, type Item } from "./model.js";

const ref = z.object({ threadId: idSchema, id: idSchema }).strict();
const versioned = ref.extend({ revision: z.number().int().positive() });
export const rpcContract = defineRpcContract({
  log: { input: z.object({ threadId: idSchema.optional() }).strict(), output: logSchema },
  decideFromLog: { input: versioned.extend({ action: actionSchema.optional() }), output: itemSchema },
  get: { input: ref, output: itemViewSchema },
  save: { input: versioned.extend({ draft: draftSchema }), output: itemSchema },
  prepare: { input: versioned.extend({ action: actionSchema, note: noteSchema.optional() }), output: itemSchema },
  comment: { input: versioned.extend({ note: noteSchema.refine((value) => value.length > 0, "Write a comment first.") }), output: z.object({ item: itemSchema, commentId: z.string().uuid(), note: noteSchema }).strict() },
  reopen: { input: versioned, output: itemSchema },
  choose: { input: versioned.extend({ choice: idSchema, note: noteSchema.optional() }), output: itemSchema },
  table: { input: ref, output: tableViewSchema },
  prepareTable: { input: ref.extend({ items: z.array(z.object({ id: idSchema, revision: z.number().int().positive(), note: noteSchema.optional() }).strict()).min(1).max(20) }), output: z.array(itemSchema) },
  submitted: { input: ref.extend({ attemptId: z.string().uuid() }), output: itemSchema },
  // A decision sheet sends every staged row in one message: each row gets its own attempt.
  prepareBatch: { input: ref.extend({ items: z.array(z.object({
    id: idSchema, revision: z.number().int().positive(), action: z.enum(["send", "save-draft", "yes", "no", "skip", "choose"]),
    choice: idSchema.optional(), note: noteSchema.optional(),
  }).strict()).min(1).max(20) }), output: z.array(itemSchema) },
});
type QueueEntry = PluginThreadEventPayloads["message.cancelled"]["entry"];

export function createStore(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    "CREATE TABLE action_items (thread_id TEXT NOT NULL, item_id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (thread_id, item_id))",
    "CREATE TABLE action_tables (thread_id TEXT NOT NULL, table_id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (thread_id, table_id))",
    "CREATE TABLE action_comments (thread_id TEXT NOT NULL, item_id TEXT NOT NULL, comment_id TEXT NOT NULL, note TEXT NOT NULL, PRIMARY KEY (thread_id, item_id, comment_id))",
    // The agent's answer to a follow-up, shown on the card under the question.
    "ALTER TABLE action_comments ADD COLUMN answer TEXT",
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
  const readFollowUps = db.prepare("SELECT comment_id AS commentId, note, answer FROM action_comments WHERE thread_id = ? AND item_id = ? ORDER BY rowid");
  const followUps = (threadId: string, id: string): FollowUp[] =>
    (readFollowUps.all(threadId, id) as FollowUp[]).map((row) => followUpSchema.parse(row));
  const view = (item: Item) => ({ ...item, followUps: followUps(item.threadId, item.id) });
  const table = (threadId: string, id: string) => {
    const row = readTable.get(threadId, id) as { value: string } | undefined;
    if (!row) throw new Error("This table is unavailable. Ask the agent to recreate it.");
    const value = tableSchema.parse(JSON.parse(row.value));
    return { ...value, items: value.ids.map((itemId) => view(get(threadId, itemId))) };
  };
  const prepare = (item: Item, action: z.infer<typeof actionSchema>, note?: string) => {
    if (item.state !== "ready" && !(item.state === "failed" && item.result?.retryable)) throw new Error("This card already has an action in progress or has finished.");
    assertAction(item, action);
    if (item.state === "failed" && action !== item.attempt?.action) throw new Error("Retry the original action, or reopen the card to choose another.");
    const attemptNote = noteSchema.parse(note ?? (item.state === "failed" ? item.attempt?.note : undefined) ?? "");
    item.state = "pending";
    item.attempt = { id: randomUUID(), action, claimed: false, ...(attemptNote ? { note: attemptNote } : {}) };
    item.result = null;
  };
  return {
    get,
    view: (threadId: string, id: string) => view(get(threadId, id)),
    async log(threadId?: string) {
      const rows = (threadId
        ? db.prepare("SELECT value FROM action_items WHERE thread_id = ?").all(threadId)
        : db.prepare("SELECT value FROM action_items").all()) as { value: string }[];
      const items = rows.map((row) => itemSchema.parse(JSON.parse(row.value)));
      const titles = new Map<string, { title: string; projectId: string | null }>(await Promise.all([...new Set(items.map((item) => item.threadId))].map(async (id) => {
        try { const thread = await bb.sdk.threads.get({ threadId: id }); return [id, { title: thread.title ?? "Untitled thread", projectId: thread.projectId }] as const; }
        catch { return [id, { title: "Unavailable thread", projectId: null }] as const; }
      })));
      const sorted = items.map((item) => ({ ...item, threadTitle: titles.get(item.threadId)!.title, threadProjectId: titles.get(item.threadId)!.projectId }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.threadId.localeCompare(b.threadId) || a.id.localeCompare(b.id));
      // Failures need a retry and Later cards need a Resume, so both stay in Waiting on you; Later sorts last.
      const later = (item: Item) => item.state === "succeeded" && item.attempt?.action === "later";
      return { waiting: [...sorted.filter((item) => item.state !== "succeeded"), ...sorted.filter(later)],
        done: sorted.filter((item) => item.state === "succeeded" && !later(item)) };
    },
    table,
    comment(input: z.infer<typeof rpcContract.comment.input>) {
      return db.transaction(() => {
        const item = get(input.threadId, input.id);
        if (item.revision !== input.revision || item.state !== "ready") throw new Error("This card changed. Review it before commenting.");
        const note = rpcContract.comment.input.parse(input).note;
        const commentId = randomUUID();
        db.prepare("INSERT INTO action_comments VALUES (?, ?, ?, ?)").run(item.threadId, item.id, commentId, note);
        return { item, commentId, note };
      })();
    },
    getComment(threadId: string, id: string, commentId: string) {
      const row = db.prepare("SELECT note FROM action_comments WHERE thread_id = ? AND item_id = ? AND comment_id = ?").get(threadId, id, z.string().uuid().parse(commentId)) as { note: string } | undefined;
      if (!row) throw new Error("This comment is unavailable. Use the card again.");
      return noteSchema.parse(row.note);
    },
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
          prepare(item, "yes", input.items.find((candidate) => candidate.id === item.id)?.note); item.revision++; item.updatedAt = new Date().toISOString();
          return persist(item);
        });
      })();
      bb.realtime.publish("items", { threadId: input.threadId });
      return next;
    },
    prepareBatch(input: z.infer<typeof rpcContract.prepareBatch.input>) {
      const next = db.transaction(() => {
        const group = tableSchema.parse(JSON.parse((readTable.get(input.threadId, input.id) as { value: string } | undefined)?.value ?? "null"));
        if (new Set(input.items.map((entry) => entry.id)).size !== input.items.length) throw new Error("Each row can be sent once.");
        return input.items.map((entry) => {
          if (!group.ids.includes(entry.id)) throw new Error("That row does not belong to this table.");
          const item = get(input.threadId, entry.id);
          if (item.revision !== entry.revision) throw new Error("This table changed. Review the remaining rows, then try again.");
          if (entry.action === "choose") {
            const option = item.content.type === "choice" ? item.content.options.find((candidate) => candidate.id === entry.choice) : undefined;
            if (!option) throw new Error("Pick an option for each choice row first.");
            prepare(item, "choose", entry.note);
            item.attempt!.choice = { id: option.id, label: option.label };
          } else prepare(item, entry.action, entry.note);
          item.revision++; item.updatedAt = new Date().toISOString();
          return persist(item);
        });
      })();
      bb.realtime.publish("items", { threadId: input.threadId });
      return next;
    },
    answer(threadId: string, id: string, commentId: string, message: string) {
      const answer = answerSchema.parse(message);
      const result = db.prepare("UPDATE action_comments SET answer = ? WHERE thread_id = ? AND item_id = ? AND comment_id = ?").run(answer, threadId, id, z.string().uuid().parse(commentId));
      if (!result.changes) throw new Error("That follow-up is unavailable. Read the card's follow-ups with bb action-cards get.");
      bb.realtime.publish("items", { threadId, id });
      return view(get(threadId, id));
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
      if (input.action === "choose") throw new Error("Pick an option on the card first.");
      return change(input.threadId, input.id, input.revision, (item) => {
        prepare(item, input.action, input.note);
      });
    },
    choose(input: z.infer<typeof rpcContract.choose.input>) {
      return change(input.threadId, input.id, input.revision, (item) => {
        const option = item.content.type === "choice" ? item.content.options.find((candidate) => candidate.id === input.choice) : undefined;
        if (!option) throw new Error("That option does not belong to this card.");
        if (item.state === "failed" && item.attempt?.choice?.id !== option.id) throw new Error("Retry the original option, or reopen the card to choose another.");
        prepare(item, "choose", input.note);
        item.attempt!.choice = { id: option.id, label: option.label };
      });
    },
    claim(threadId: string, id: string, attemptId: string) {
      return change(threadId, id, null, (item) => {
        if (item.state !== "pending" || item.attempt?.id !== attemptId || item.attempt.claimed) throw new Error("This attempt is stale or already claimed. Read its status and reconcile the external result; do not act again.");
        item.attempt.claimed = true;
        // A claim proves the request was sent, even if the composer's acknowledgement was lost.
        item.attempt.sentAt ??= new Date().toISOString();
      });
    },
    // The composer accepted the request (sent now, or queued behind a busy agent).
    submitted(input: z.infer<typeof rpcContract.submitted.input>) {
      const item = get(input.threadId, input.id);
      if (item.state !== "pending" || item.attempt?.id !== input.attemptId || item.attempt.claimed || item.attempt.sentAt) return item;
      return change(input.threadId, input.id, null, (next) => { next.attempt!.sentAt = new Date().toISOString(); });
    },
    // A request deleted from the thread's queue never reached the agent; let the user choose again.
    cancelled(entry: QueueEntry) {
      for (const { threadId, id, attemptId } of attemptRefs(bb.pluginId, entry)) {
        const item = read.get(threadId, id) ? get(threadId, id) : null;
        if (item?.state !== "pending" || item.attempt?.id !== attemptId || item.attempt.claimed) continue;
        change(threadId, id, null, (next) => { next.state = "ready"; next.attempt = null; });
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
    log: ({ threadId }) => store.log(threadId),
    async decideFromLog(input) {
      const item = input.action ? store.prepare({ ...input, action: input.action }) : store.get(input.threadId, input.id);
      if (!input.action && (item.revision !== input.revision || item.state !== "pending")) throw new Error("This card changed. Reload the log before resending.");
      const label = title(item).replace(/[?\s]+$/, "");
      const prefix = actionMessage(item);
      await bb.sdk.threads.send({ threadId: item.threadId, mode: "queue-if-active", input: [{
        type: "text", text: prefix + label, mentions: [{ start: prefix.length, end: prefix.length + label.length,
          resource: { kind: "plugin", pluginId: "inline-action-cards", itemId: `action:${mentionId(item)}`, label } }],
      }] });
      // Record the send like an inline card does, so the card settles in its thread.
      return store.submitted({ threadId: item.threadId, id: item.id, attemptId: item.attempt!.id });
    },
    get: ({ threadId, id }) => store.view(threadId, id),
    save: store.save, prepare: store.prepare, comment: store.comment, reopen: store.reopen, choose: store.choose,
    table: ({ threadId, id }) => store.table(threadId, id), prepareTable: store.prepareTable, submitted: store.submitted, prepareBatch: store.prepareBatch,
  });
  bb.events.on("message.cancelled", ({ entry }) => {
    try { store.cancelled(entry); } catch (err) { bb.log.warn(`Could not reopen an action card after its queued request was deleted: ${err instanceof Error ? err.message : String(err)}`); }
  });
  bb.ui.registerMentionProvider({
    id: "action", label: "Action Cards", search: () => [],
    resolve(value) {
      const [thread, id, attempt, extra] = value.split(":");
      if (extra || !attempt) throw new Error("This action reference is incomplete. Use the card again.");
      const item = store.get(idSchema.parse(thread), idSchema.parse(id));
      if (attempt.startsWith("comment_")) {
        const note = store.getComment(item.threadId, item.id, attempt.slice("comment_".length));
        return { context: JSON.stringify({
          kind: "inline-action-card", threadId: item.threadId, itemId: item.id, intent: "comment", note, commentId: attempt.slice("comment_".length),
          instruction: "This is a comment or follow-up question, not approval for an action. Answer it on the card with bb action-cards answer <itemId> --comment <commentId> --message-stdin, and keep any chat reply to one short line. If it requests a change, revise the same Reply draft using its latest revision. For Decide and Choice cards, explain the requested change; question/consequence updates are not supported. Do not execute an action or create/claim an attempt. Other cards in the same table stay as the user left them.",
        }) };
      }
      const changes = attempt === "changes";
      if (!changes && item.attempt?.id !== attempt) throw new Error("This action was replaced. Use the latest card.");
      return { context: JSON.stringify({
        kind: "inline-action-card", threadId: item.threadId, itemId: item.id,
        intent: changes ? "request-changes" : item.state === "failed" ? "check-outcome" : "approved-action",
        attemptId: changes ? null : item.attempt!.id, action: changes ? null : item.attempt!.action,
        ...(!changes && item.attempt?.note ? { note: item.attempt.note } : {}),
        ...(!changes && item.attempt?.choice ? { choice: item.attempt.choice } : {}),
        instruction: changes ? "Read the latest saved item and revise that same draft. This is not approval to act."
          : "Claim this exact attempt once with bb action-cards claim before acting. Use the returned latest saved content and note. The note is part of the approval: follow it. If it conflicts with the action (for example Yes, but do not send yet), do not perform the action; report --outcome failed --retryable with a message saying what you held and why, so the user can choose again. A failed/claimed/completed attempt authorizes reconciliation only; never repeat its side effect. Report the verified result with bb action-cards report.",
      }) };
    },
  });
  const threadOption = { type: "string", description: "Owning thread; defaults to this thread" } as const;
  const itemPosition = [{ name: "id", required: true, description: "Stable item ID" }] as const;
  const scope = (ctx: PluginCliContext, thread?: string) => idSchema.parse(thread ?? ctx.threadId);
  const output = (item: Item | z.infer<typeof itemViewSchema>) => ({ exitCode: 0, stdout: `${JSON.stringify(item, null, 2)}\n` });
  bb.cli.register(defineCli({
    name: "action-cards", summary: "Create inline cards, read saved drafts, and report action results",
    commands: {
      log: cliCommand({
        summary: "Read the Action log: waiting cards and results across threads",
        options: { thread: { type: "string", description: "Filter to this thread ID; defaults to all threads" }, json: { type: "boolean", description: "Print structured JSON" } },
        async run({ options }) {
          const log = await store.log(options.thread === undefined ? undefined : idSchema.parse(options.thread));
          if (options.json) return { exitCode: 0, stdout: `${JSON.stringify(log, null, 2)}\n` };
          const line = (item: typeof log.waiting[number]) => [title(item), item.threadTitle, item.threadId,
            item.attempt ? actionLabel(item, item.attempt.action) : "Awaiting choice", item.result?.message ?? item.state,
            item.attempt?.note, item.updatedAt].filter(Boolean).join(" · ").replace(/[\r\n\t]+/g, " ");
          return { exitCode: 0, stdout: `Waiting on you\n${log.waiting.map(line).join("\n")}\n\nDone\n${log.done.map(line).join("\n")}\n` };
        },
      }),
      "create-table": cliCommand({
        summary: "Group existing items in an inline table", positionals: itemPosition,
        options: { thread: threadOption, table: { type: "string", required: true, stdin: true, description: "Table JSON with title and up to 20 item ids (Reply, Decide, or Choice); use --table-stdin" } },
        run({ options, positionals }, ctx) {
          const id = idSchema.parse(positionals.id);
          store.createTable(scope(ctx, options.thread), id, JSON.parse(options.table));
          return { exitCode: 0, stdout: `::actions{id="${id}"}\n` };
        },
      }),
      create: cliCommand({
        summary: "Create one card; prints its directive", positionals: itemPosition,
        options: { thread: threadOption, item: { type: "string", required: true, stdin: true, description: "Reply, Decide, or Choice JSON; use --item-stdin" } },
        run({ options, positionals }, ctx) {
          const id = idSchema.parse(positionals.id);
          store.create(scope(ctx, options.thread), id, JSON.parse(options.item));
          return { exitCode: 0, stdout: `::action{id="${id}"}\n` };
        },
      }),
      get: cliCommand({
        summary: "Read the latest saved draft, action, result, and follow-ups", positionals: itemPosition,
        options: { thread: threadOption },
        run: ({ options, positionals }, ctx) => output(store.view(scope(ctx, options.thread), idSchema.parse(positionals.id))),
      }),
      answer: cliCommand({
        summary: "Answer a follow-up question on its card", positionals: itemPosition,
        options: {
          thread: threadOption, comment: { type: "string", required: true, description: "commentId from the follow-up's context" },
          message: { type: "string", required: true, stdin: true, description: "Markdown answer shown on the card; use --message-stdin" },
        },
        run: ({ options, positionals }, ctx) => output(store.answer(scope(ctx, options.thread), idSchema.parse(positionals.id), options.comment, options.message)),
      }),
      revise: cliCommand({
        summary: "Update the same ready draft after a comment", positionals: itemPosition,
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
