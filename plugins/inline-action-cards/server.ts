import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, defineRpcContract, type BbPluginApi, type PluginCliContext, type PluginThreadEventPayloads } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { canDismiss, dismissReasonSchema, actionIcons, actionLabel, actionMessage, mentionId, readItem, storedItem, title, logSchema, actionSchema, answerSchema, assertAction, bulkLabel, contentSchema, draftSchema, followUpSchema, idSchema, itemSchema, itemViewSchema, noteSchema, tableContentSchema, tableSchema, tableViewSchema, waitingSchema, type FollowUp, type Item, type Priority } from "./model.js";

const ref = z.object({ threadId: idSchema, id: idSchema }).strict();
const versioned = ref.extend({ revision: z.number().int().positive() });
const dispatchEntry = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("action"), id: idSchema, attemptId: z.string().uuid() }).strict(),
  z.object({ kind: z.literal("comment"), id: idSchema, commentId: z.string().uuid() }).strict(),
]);
// Older sheets persisted itemIds; normalize only on read, keeping current writes and RPCs on ids.
const persistedTableSchema = z.union([
  tableSchema,
  tableSchema.omit({ ids: true }).extend({ itemIds: tableContentSchema.shape.ids })
    .transform(({ itemIds, ...value }) => ({ ...value, ids: itemIds })),
]);
export const rpcContract = defineRpcContract({
  log: { input: z.object({ threadId: idSchema.optional() }).strict(), output: logSchema },
  // What one thread is still waiting on the user for, for the drawer above its prompt box.
  waiting: { input: z.object({ threadId: idSchema }).strict(), output: waitingSchema },
  // Threads with anything waiting on the user, for the sidebar's question glyph.
  waitingThreads: { input: z.object({}).strict(), output: z.array(idSchema) },
  decideFromLog: { input: versioned.extend({ action: actionSchema.optional() }), output: itemSchema },
  get: { input: ref, output: itemViewSchema },
  save: { input: versioned.extend({ draft: draftSchema }), output: itemSchema },
  prepare: { input: versioned.extend({ action: actionSchema, note: noteSchema.optional() }), output: itemSchema },
  comment: { input: versioned.extend({ note: noteSchema.refine((value) => value.length > 0, "Write a comment first.") }), output: z.object({ item: itemSchema, commentId: z.string().uuid(), note: noteSchema }).strict() },
  reopen: { input: versioned, output: itemSchema },
  // Settle a waiting item without answering it, and tell its thread.
  dismiss: { input: versioned.extend({ reason: dismissReasonSchema.optional() }), output: itemSchema },
  // Tell the thread again after a known failed notice. Never sends twice.
  notifyDismissed: { input: ref, output: itemSchema },
  choose: { input: versioned.extend({ choice: idSchema, note: noteSchema.optional() }), output: itemSchema },
  table: { input: ref, output: tableViewSchema },
  prepareTable: { input: ref.extend({ items: z.array(z.object({ id: idSchema, revision: z.number().int().positive(), note: noteSchema.optional() }).strict()).min(1).max(20) }), output: z.array(itemSchema) },
  submitted: { input: ref.extend({ attemptId: z.string().uuid() }), output: itemSchema },
  dispatch: { input: z.object({ threadId: idSchema, entries: z.array(dispatchEntry).min(1).max(20) }).strict(), output: z.array(itemSchema) },
  // A decision sheet sends every staged row in one message: each row gets its own attempt.
  prepareBatch: { input: ref.extend({ items: z.array(z.object({
    id: idSchema, revision: z.number().int().positive(), action: z.enum(["send", "save-draft", "yes", "no", "skip", "choose"]),
    choice: idSchema.optional(), note: noteSchema.optional(),
  }).strict()).min(1).max(20) }), output: z.array(itemSchema) },
});
type QueueEntry = PluginThreadEventPayloads["message.cancelled"]["entry"];

async function threadSource(bb: BbPluginApi, threadId: string) {
  try {
    const thread = await bb.sdk.threads.get({ threadId });
    return { threadTitle: thread.title ?? "Untitled thread", threadProjectId: thread.projectId };
  } catch { return { threadTitle: "Unavailable thread", threadProjectId: null }; }
}

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
    const item = readItem(row.value);
    if (!item) throw new Error("This card needs a newer version of Inline Decisions.");
    return item;
  };
  const persist = (item: Item) => {
    const next = itemSchema.parse(item);
    write.run(next.threadId, next.id, JSON.stringify(storedItem(item, next)));
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
    const value = persistedTableSchema.parse(JSON.parse(row.value));
    const items = value.ids.flatMap((itemId) => {
      const row = read.get(threadId, itemId) as { value: string } | undefined;
      const item = row && readItem(row.value);
      return item ? [item] : row ? [] : [get(threadId, itemId)];
    });
    return { ...value, items };
  };
  const prepare = (item: Item, action: z.infer<typeof actionSchema>, note?: string) => {
    if (item.state !== "ready" && !(item.state === "failed" && item.result?.retryable)) throw new Error("This card already has an action in progress or has finished.");
    assertAction(item, action);
    if (item.state === "failed" && action !== item.attempt?.action) throw new Error("Retry the original action, or reopen the card to choose another.");
    const attemptNote = noteSchema.parse(note ?? (item.state === "failed" ? item.attempt?.note : undefined) ?? "");
    // An ask's answer is the user's own words, carried as the attempt note.
    if (action === "answer" && !attemptNote) throw new Error("Write an answer first.");
    item.state = "pending";
    item.attempt = { id: randomUUID(), action, claimed: false, ...(attemptNote ? { note: attemptNote } : {}) };
    item.result = null;
  };
  const withSources = async <T extends Item>(items: T[]) => {
    const sources = new Map(await Promise.all([...new Set(items.map((item) => item.threadId))].map(async (id) => [id, await threadSource(bb, id)] as const)));
    return items.map((item) => ({ ...item, ...sources.get(item.threadId)! }));
  };
  return {
    get,
    view: (threadId: string, id: string) => view(get(threadId, id)),
    // One thread's open items, one per question: urgent first, then oldest; low priority last.
    async waiting(threadId: string) {
      const rows = db.prepare("SELECT value FROM action_items WHERE thread_id = ?").all(threadId) as { value: string }[];
      const items = rows.flatMap((row) => readItem(row.value) ?? []);
      const open = distinctOpen(items).map((item) => {
        const earlier = items.filter((other) => !isOpen(other) && other.attempt && !other.dismissed && other.updatedAt < item.updatedAt && sameQuestion(other, item))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
        return earlier ? { ...item, earlier: answeredLabel(earlier) } : item;
      });
      return (await withSources(open)).sort((a, b) => rank(a.content.priority) - rank(b.content.priority)
        || a.updatedAt.localeCompare(b.updatedAt) || a.threadId.localeCompare(b.threadId) || a.id.localeCompare(b.id));
    },
    waitingThreads() {
      return (db.prepare(`SELECT DISTINCT thread_id AS threadId FROM action_items WHERE json_extract(value, '$.state') IN ('ready', 'failed')
        OR (json_extract(value, '$.state') = 'pending' AND json_extract(value, '$.attempt.claimed') = 0 AND json_extract(value, '$.attempt.sentAt') IS NULL)`).all() as { threadId: string }[])
        .map((row) => row.threadId);
    },
    // A newer version of the same question in the same thread replaces the older unanswered ones.
    // Also replaces the item named by --replaces, and reports open items that ask much the same thing.
    supersede(threadId: string, id: string, replaces?: string) {
      const latest = get(threadId, id);
      const rows = db.prepare("SELECT value FROM action_items WHERE thread_id = ?").all(threadId) as { value: string }[];
      const open = rows.flatMap((row) => readItem(row.value) ?? []).filter((item) => item.id !== id && item.state === "ready");
      const older = open.filter((item) => item.id === replaces || sameQuestion(item, latest));
      for (const item of older) change(threadId, item.id, null, (next) => { next.state = "succeeded"; next.result = { message: `Superseded by ${id}`, retryable: false }; });
      return { superseded: older.map((item) => item.id), overlapping: open.filter((item) => !older.includes(item) && overlaps(item, latest)) };
    },
    // An item --replaces may name: unanswered, in the same thread.
    assertReplaceable(threadId: string, id: string) {
      if (get(threadId, id).state !== "ready") throw new Error(`${id} is already answered or settled; only an unanswered item can be replaced.`);
    },
    async log(threadId?: string) {
      const rows = (threadId
        ? db.prepare("SELECT value FROM action_items WHERE thread_id = ?").all(threadId)
        : db.prepare("SELECT value FROM action_items").all()) as { value: string }[];
      const sorted = (await withSources(rows.flatMap((row) => readItem(row.value) ?? [])))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.threadId.localeCompare(b.threadId) || a.id.localeCompare(b.id));
      // Failures need a retry and Later cards need a Resume, so both stay in Waiting on you; Later sorts last.
      const later = (item: Item) => item.state === "succeeded" && !item.dismissed && item.attempt?.action === "later";
      return { waiting: [...sorted.filter((item) => item.state !== "succeeded"), ...sorted.filter(later)],
        done: sorted.filter((item) => item.state === "succeeded" && !later(item)) };
    },
    table: (threadId: string, id: string) => { const value = table(threadId, id); return { ...value, items: value.items.map(view) }; },
    comment(input: z.infer<typeof rpcContract.comment.input>) {
      return db.transaction(() => {
        const item = get(input.threadId, input.id);
        if (item.revision !== input.revision || item.state !== "ready") throw new Error("This card changed. Review it before commenting.");
        const note = rpcContract.comment.input.parse(input).note;
        const commentId = randomUUID();
        db.prepare("INSERT INTO action_comments (thread_id, item_id, comment_id, note) VALUES (?, ?, ?, ?)").run(item.threadId, item.id, commentId, note);
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
        const group = persistedTableSchema.parse(JSON.parse((readTable.get(input.threadId, input.id) as { value: string } | undefined)?.value ?? "null"));
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
    // Settle a moot question or a known-safe failure without authorizing another attempt.
    // Retain a failed attempt as history; pending or uncertain outcomes still need reconciliation.
    resolve(threadId: string, id: string, message: string) {
      return change(threadId, id, null, (item) => {
        if (item.state !== "ready" && !(item.state === "failed" && item.result?.retryable)) {
          throw new Error("Only an unanswered card or a retryable failure can be resolved. Reconcile and report an in-progress or uncertain attempt first.");
        }
        // A settled legacy Later/Skip attempt would read as deferred and keep offering Resume.
        if (item.state === "failed" && ["later", "skip"].includes(item.attempt?.action ?? "")) {
          throw new Error("A failed Later or Skip card can't be resolved. Ask the user to choose again on the card.");
        }
        item.state = "succeeded";
        item.result = { message, retryable: false };
      });
    },
    // Dismissed by the user: settled with no approval. A failed attempt stays as history; nothing can claim it.
    dismiss(input: z.infer<typeof rpcContract.dismiss.input>) {
      return change(input.threadId, input.id, input.revision, (item) => {
        if (!canDismiss(item)) throw new Error("This item is in progress or already settled, so it can't be dismissed.");
        item.state = "succeeded";
        item.result = { message: input.reason ? `Dismissed · ${input.reason}` : "Dismissed", retryable: false };
        item.dismissed = { at: new Date().toISOString(), ...(input.reason ? { reason: input.reason } : {}), notice: "pending" };
      });
    },
    // Claims the right to send a dismissal notice: pending (never tried) or failed (known undelivered). One caller wins.
    claimNotice(threadId: string, id: string) {
      try {
        return change(threadId, id, null, (item) => {
          if (!item.dismissed || (item.dismissed.notice !== "pending" && item.dismissed.notice !== "failed")) throw new Error("not claimable");
          item.dismissed.notice = "sending";
          delete item.dismissed.noticeError;
        });
      } catch { return null; }
    },
    finishNotice(threadId: string, id: string, error?: string) {
      return change(threadId, id, null, (item) => {
        if (item.dismissed?.notice !== "sending") return;
        item.dismissed.notice = error ? "failed" : "sent";
        if (error) item.dismissed.noticeError = error.slice(0, 300);
      });
    },
    // The thread went idle with nothing queued, yet a sent request was never claimed: the agent never got it
    // (for example bb refused a competing turn). Clearing sentAt shows the card as not sent, with Resend.
    undelivered(threadId: string) {
      const rows = db.prepare("SELECT value FROM action_items WHERE thread_id = ?").all(threadId) as { value: string }[];
      const cutoff = Date.now() - 5000;
      for (const row of rows) {
        const item = readItem(row.value);
        if (!item) continue;
        const sentAt = item.attempt?.sentAt;
        if (item.state !== "pending" || !sentAt || item.attempt!.claimed || Date.parse(sentAt) > cutoff) continue;
        change(threadId, item.id, null, (next) => { if (next.attempt && !next.attempt.claimed) delete next.attempt.sentAt; });
      }
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
        // A claim proves the request was sent, even if the send acknowledgement was lost.
        item.attempt.sentAt ??= new Date().toISOString();
      });
    },
    // An ask needs no claim: it settles once its answer reaches the agent, which is when bb resolves the
    // answer's mention. Queued is not delivered. Settling twice is a no-op, so a re-drained message can't repeat it.
    answered(threadId: string, id: string, attemptId: string) {
      const item = get(threadId, id);
      if (item.attempt?.id !== attemptId || item.attempt.action !== "answer" || item.state !== "pending") return item;
      return change(threadId, id, null, (next) => {
        next.attempt!.claimed = true;
        next.attempt!.sentAt ??= new Date().toISOString();
        next.state = "succeeded";
        next.result = { message: "Answered", retryable: false };
      });
    },
    // Reserve each pending attempt before its message is sent, so a second client resending the same attempt
    // is refused instead of delivering it twice. Returns the attempts it reserved.
    reserve(threadId: string, entries: { id: string; attemptId: string }[]) {
      const reserved = db.transaction(() => entries.flatMap(({ id, attemptId }) => {
        const item = get(threadId, id);
        if (item.state !== "pending" || item.attempt?.id !== attemptId) return [];
        if (item.attempt.sentAt || item.attempt.claimed) throw new Error("This answer was already sent. It reaches the agent when the thread is free.");
        change(threadId, id, null, (next) => { next.attempt!.sentAt = new Date().toISOString(); });
        return [{ id, attemptId }];
      }))();
      return reserved;
    },
    // The send failed: the reserved attempts were never sent, so they can be sent again.
    release(threadId: string, entries: { id: string; attemptId: string }[]) {
      for (const { id, attemptId } of entries) {
        const item = get(threadId, id);
        if (item.state === "pending" && item.attempt?.id === attemptId && !item.attempt.claimed) change(threadId, id, null, (next) => { delete next.attempt!.sentAt; });
      }
    },
    // The host accepted the request (sent now, or queued behind a busy agent).
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
        // An ask keeps its written answer: it shows as not sent, with Resend, instead of losing the text.
        if (item.attempt.action === "answer") change(threadId, id, null, (next) => { delete next.attempt!.sentAt; });
        else change(threadId, id, null, (next) => { next.state = "ready"; next.attempt = null; });
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
        const deferred = item.state === "succeeded" && !item.dismissed && ["later", "skip"].includes(item.attempt?.action ?? "");
        if (!deferred && !(item.state === "failed" && item.result?.retryable)) throw new Error("Check the outcome with the agent before reopening this card.");
        item.state = "ready"; item.result = null; item.attempt = null;
      });
    },
  };
}

const rank = (priority: Priority | undefined) => priority === "urgent" ? 0 : priority === "low" ? 2 : 1;

// Unanswered, answered but never delivered to the agent (it needs Resend), or failed (it needs Retry or a check).
const isOpen = (item: Item) => item.state === "ready" || item.state === "failed" || (item.state === "pending" && !item.attempt?.claimed && !item.attempt?.sentAt);
const questionKey = (item: Item) => title(item).toLowerCase().replace(/\s+/g, " ").replace(/[\s?.!]+$/, "").trim();
const idBase = (id: string) => id.replace(/-v\d+$/i, "");
// Questions that share most of their meaningful words, such as "OK to spend $300 on the Reddit ad test?"
// and "Approve $500 for the Reddit ad test?", ask the user the same thing twice.
const STOP_WORDS = new Set("the and for you your our are can should could would will does what which when how who why with from this that into about any ok okay".split(" "));
const words = (item: Item) => new Set(title(item).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
  .filter((word) => word.length > 1 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)).map((word) => word.replace(/s$/, "")));
const overlaps = (a: Item, b: Item) => {
  const left = words(a), right = words(b);
  const shared = [...left].filter((word) => right.has(word)).length;
  return shared >= 2 && shared / Math.min(left.size, right.size) >= 0.6;
};
const sameQuestion = (a: Item, b: Item) => a.threadId === b.threadId && (questionKey(a) === questionKey(b) || idBase(a.id) === idBase(b.id));
const answeredLabel = (item: Item) => item.attempt!.action === "answer" ? item.attempt!.note ?? "an answer" : item.attempt!.choice?.label ?? actionLabel(item, item.attempt!.action);
// Newest first, keeping only the newest item for each question.
function distinctOpen(items: Item[]): Item[] {
  const kept: Item[] = [];
  for (const item of items.filter(isOpen).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    if (!kept.some((other) => sameQuestion(other, item))) kept.push(item);
  }
  return kept;
}

// Cards stay small and plain: context is at most one short sentence, never a labelled or bulleted brief.
const CONTEXT_WORDS = 40;
// Horizontal whitespace only: \s would let long runs of newlines make each line start rescan the rest.
const BRIEF_PATTERN = /\*\*[ \t]*(what|why|options?|recommend|next)|^[ \t]*(?:[-*+]|\d{1,3}[.)])[ \t]|why now/im;
export function contextWarning(context: string | undefined): string {
  if (!context) return "";
  const words = context.trim().split(/\s+/).length;
  return words > CONTEXT_WORDS || BRIEF_PATTERN.test(context)
    ? "Warning: keep context to one plain sentence (25 words or fewer, no lists or labels such as What/Why now/Next). The question says what is decided, option labels say what each choice does, and recommended tags the pick. Link evidence instead of pasting it.\n"
    : "";
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
  // Sends a dismissal notice at most once: only the caller that claims it sends, and a failure is stored for retry.
  const notifyDismissed = async (threadId: string, id: string) => {
    const item = store.claimNotice(threadId, id);
    if (!item) return store.get(threadId, id);
    const label = title(item).replace(/[?\s]+$/, "");
    const prefix = "Dismissed: ";
    const reason = item.dismissed?.reason;
    try {
      await bb.sdk.threads.send({ threadId, mode: "queue-if-active", input: [{
        type: "text", text: `${prefix}${label}${reason ? ` · ${reason}` : ""}`,
        mentions: [{ start: prefix.length, end: prefix.length + label.length, resource: { kind: "plugin", pluginId: "inline-action-cards", itemId: `action:${threadId}:${id}:dismissed`, label, icon: "X" } }],
      }] });
      return store.finishNotice(threadId, id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      bb.log.warn(`Dismissed ${id} but could not tell its thread: ${message}`);
      return store.finishNotice(threadId, id, message);
    }
  };
  // Sends card answers and comments to their thread as one message. Never accepts arbitrary message text from the client.
  const sendEntries = async (threadId: string, entries: z.infer<typeof rpcContract.dispatch.input>["entries"]) => {
    if (new Set(entries.map((entry) => entry.id)).size !== entries.length) throw new Error("Each card can appear only once in a message.");
    // Resolve every durable reference before sending anything.
    const checked = entries.map((entry) => {
      const item = store.get(threadId, entry.id);
      if (entry.kind === "action" && ((item.state !== "pending" && !(item.state === "failed" && !item.result?.retryable)) || item.attempt?.id !== entry.attemptId)) throw new Error("This action changed. Use the latest card.");
      return { item, entry };
    });
    const reserved = store.reserve(threadId, entries.flatMap((entry) => entry.kind === "action" ? [{ id: entry.id, attemptId: entry.attemptId }] : []));
    const rows = checked.map(({ item, entry }) => {
      const label = title(item).replace(/[?\s]+$/, "");
      const prefix = entry.kind === "action" ? actionMessage(item) : "";
      const note = entry.kind === "action" ? item.attempt?.note : store.getComment(threadId, item.id, entry.commentId);
      const reference = entry.kind === "action" ? mentionId(item) : `${threadId}:${item.id}:comment_${entry.commentId}`;
      return { label, prefix, reference, icon: entry.kind === "action" ? actionIcons[item.attempt!.action] : "MessageSquare", suffix: note ? `${entry.kind === "action" ? " — " : " "}${note}` : "" };
    });
    let text = "";
    const mentions = rows.map(({ label, prefix, reference, suffix, icon }, index) => {
      text += `${index ? "\n" : ""}${prefix}`;
      const start = text.length;
      text += label + suffix;
      return { start, end: start + label.length, resource: { kind: "plugin" as const, pluginId: "inline-action-cards", itemId: `action:${reference}`, label, icon } };
    });
    // This API owns queueing and dispatch; the user's composer, attachments and queued drafts are never edited.
    try { await bb.sdk.threads.send({ threadId, mode: "queue-if-active", input: [{ type: "text", text, mentions }] }); }
    catch (err) { store.release(threadId, reserved); throw err; }
    return checked.map(({ item, entry }) => entry.kind === "action" ? store.get(threadId, item.id) : item);
  };
  bb.rpc.register(rpcContract, {
    log: ({ threadId }) => store.log(threadId),
    waiting: ({ threadId }) => store.waiting(threadId),
    waitingThreads: () => store.waitingThreads(),
    dispatch: ({ threadId, entries }) => sendEntries(threadId, entries),
    async decideFromLog(input) {
      const item = input.action ? store.prepare({ ...input, action: input.action }) : store.get(input.threadId, input.id);
      if (!input.action && (item.revision !== input.revision || item.state !== "pending")) throw new Error("This card changed. Reload the log before resending.");
      // The same path as an inline card, so a resent ask settles once, when it reaches the agent.
      const [sent] = await sendEntries(item.threadId, [{ kind: "action", id: item.id, attemptId: item.attempt!.id }]);
      return sent!;
    },
    get: async ({ threadId, id }) => ({ ...store.view(threadId, id), ...await threadSource(bb, threadId) }),
    // Settle first (it approves nothing), then tell the owning thread so its agent stops waiting.
    dismiss: async (input) => { const item = store.dismiss(input); return notifyDismissed(item.threadId, item.id); },
    notifyDismissed: ({ threadId, id }) => notifyDismissed(threadId, id),
    save: store.save, prepare: store.prepare, comment: store.comment, reopen: store.reopen, choose: store.choose,
    table: async ({ threadId, id }) => {
      const table = store.table(threadId, id);
      const source = await threadSource(bb, threadId);
      return { ...table, items: table.items.map((item) => ({ ...item, ...source })) };
    }, prepareTable: store.prepareTable, submitted: store.submitted, prepareBatch: store.prepareBatch,
  });
  // The idle payload can lag a queued message that is already starting, so settle first and re-read the thread.
  bb.events.on("thread.idle", ({ thread }) => {
    if (thread.queuedMessageCount > 0) return;
    setTimeout(() => void (async () => {
      try {
        const latest = await bb.sdk.threads.get({ threadId: thread.id });
        if (latest.status !== "idle" || latest.queuedMessageCount > 0) return;
        store.undelivered(thread.id);
      } catch (err) { bb.log.warn(`Could not check an idle thread for undelivered card requests: ${err instanceof Error ? err.message : String(err)}`); }
    })(), 3000);
  });
  bb.events.on("message.cancelled", ({ entry }) => {
    try { store.cancelled(entry); } catch (err) { bb.log.warn(`Could not reopen an action card after its queued request was deleted: ${err instanceof Error ? err.message : String(err)}`); }
  });
  bb.ui.registerMentionProvider({
    id: "action", label: "Inline Decisions", search: () => [],
    resolve(value) {
      const [thread, id, attempt, extra] = value.split(":");
      if (extra || !attempt) throw new Error("This action reference is incomplete. Use the card again.");
      const item = store.get(idSchema.parse(thread), idSchema.parse(id));
      if (attempt.startsWith("comment_")) {
        const note = store.getComment(item.threadId, item.id, attempt.slice("comment_".length));
        return { context: JSON.stringify({
          kind: "inline-action-card", threadId: item.threadId, itemId: item.id, intent: "comment", note, commentId: attempt.slice("comment_".length),
          instruction: "This is the user's comment on the card, not a click: it never approves the card's own action, so do not create or claim an attempt. Treat it like a chat message from the user. Answer a question on the card with bb action-cards answer <itemId> --comment <commentId> --message-stdin and keep any chat reply to one short line. Follow a clear instruction only as you would the same instruction typed in chat, under the user's existing authorization; when the request is ambiguous or the card's own action needs approval, ask the user to use the card's buttons instead. If it requests a change to a Reply, revise the same draft using its latest revision; Decide and Choice question/consequence updates are not supported, so explain the change. If what you did makes the card moot (for example the user said 'close this' and you closed the PR, or they withdrew the question), settle it with bb action-cards resolve <itemId> --message '<what happened>'. Other cards in the same table stay as the user left them.",
        }) };
      }
      if (attempt === "dismissed") return { context: JSON.stringify({
        kind: "inline-action-card", threadId: item.threadId, itemId: item.id, intent: "dismissed", question: title(item),
        ...(item.dismissed?.reason ? { reason: item.dismissed.reason } : {}),
        instruction: "The user dismissed this item without answering it. Nothing was approved, and it is already settled: do not claim, report, resolve or act on it. Stop waiting on it and carry on without it. Do not ask it again, as a card, an ask or in prose, unless something material changes; then say what changed.",
      }) };
      const changes = attempt === "changes";
      if (!changes && item.attempt?.id !== attempt) throw new Error("This action was replaced. Use the latest card.");
      if (!changes && item.attempt?.action === "answer") {
        // bb resolves this when the message reaches the agent, never while it waits in the queue.
        store.answered(item.threadId, item.id, attempt);
        return { context: JSON.stringify({
          kind: "inline-action-card", threadId: item.threadId, itemId: item.id, intent: "answer", question: title(item), answer: item.attempt.note,
          instruction: "This is the user's answer to your ask, in their own words. The ask is already settled: do not claim, report or resolve it. Act on the answer as you would the same reply typed in chat, under the user's existing authorization.",
        }) };
      }
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
  const askPositions = [...itemPosition, { name: "question", required: true, description: "One-line question the user answers in their own words" }] as const;
  const scope = (ctx: PluginCliContext, thread?: string) => idSchema.parse(thread ?? ctx.threadId);
  const output = (item: Item | z.infer<typeof itemViewSchema>) => ({ exitCode: 0, stdout: `${JSON.stringify(item, null, 2)}\n` });
  // Settle older versions of the same question.
  const afterCreate = (item: Item, replaces?: string) => {
    const { superseded, overlapping } = store.supersede(item.threadId, item.id, replaces);
    return (superseded.length ? `Marked as superseded by ${item.id}: ${superseded.join(", ")}.\n` : "")
      + (overlapping.length ? `Warning: this overlaps ${overlapping.map((other) => `${other.id} (“${title(other)}”)`).join(", ")}, still waiting on the user. Don't stack questions: resolve the old one with bb action-cards resolve <id> --message '…', or create the new one with --replaces <id>.\n` : "");
  };
  const replacesOption = { type: "string", description: "ID of an unanswered item in this thread that this one replaces; it is marked superseded" } as const;
  bb.cli.register(defineCli({
    name: "action-cards", summary: "Create inline cards, read saved drafts, and report action results",
    commands: {
      log: cliCommand({
        summary: "Read the Decision log: waiting cards and results across threads",
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
      ask: cliCommand({
        summary: "Add a plain question to Waiting on you; it clears when the user answers or you resolve it",
        positionals: askPositions,
        options: {
          thread: threadOption, urgent: { type: "boolean", description: "List it first in Waiting on you" },
          context: { type: "string", description: "Optional: one plain sentence the question can't carry" },
          replaces: replacesOption,
        },
        run({ options, positionals }, ctx) {
          const id = idSchema.parse(positionals.id);
          const replaces = options.replaces === undefined ? undefined : idSchema.parse(options.replaces);
          if (replaces) store.assertReplaceable(scope(ctx, options.thread), replaces);
          const item = store.create(scope(ctx, options.thread), id, { type: "ask", question: positionals.question, ...(options.urgent ? { priority: "urgent" } : {}), ...(options.context ? { context: options.context } : {}) });
          const notes = contextWarning(item.content.context) + afterCreate(item, replaces);
          return { ...output(item), ...(notes ? { stderr: notes } : {}) };
        },
      }),
      create: cliCommand({
        summary: "Create one card; prints its directive", positionals: itemPosition,
        options: { thread: threadOption, item: { type: "string", required: true, stdin: true, description: "Reply, Decide, Choice, or Ask JSON, with optional priority; use --item-stdin" }, replaces: replacesOption },
        run({ options, positionals }, ctx) {
          const id = idSchema.parse(positionals.id);
          const replaces = options.replaces === undefined ? undefined : idSchema.parse(options.replaces);
          if (replaces) store.assertReplaceable(scope(ctx, options.thread), replaces);
          const item = store.create(scope(ctx, options.thread), id, JSON.parse(options.item));
          const notes = contextWarning(item.content.context) + afterCreate(item, replaces);
          return { exitCode: 0, stdout: `::action{id="${id}"}\n`, ...(notes ? { stderr: notes } : {}) };
        },
      }),
      get: cliCommand({
        summary: "Read the latest saved draft, action, result, and follow-ups", positionals: itemPosition,
        options: { thread: threadOption },
        run: ({ options, positionals }, ctx) => output(store.view(scope(ctx, options.thread), idSchema.parse(positionals.id))),
      }),
      resolve: cliCommand({
        summary: "Settle an unanswered or superseded retryable card without approving another action", positionals: itemPosition,
        options: { thread: threadOption, message: { type: "string", required: true, description: "Short result shown on the card, for example 'Closed the PR'" } },
        run: ({ options, positionals }, ctx) => output(store.resolve(scope(ctx, options.thread), idSchema.parse(positionals.id), z.string().trim().min(1).max(500).parse(options.message))),
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
