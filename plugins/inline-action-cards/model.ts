import { z } from "zod";

export const idSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const line = z.string().trim().min(1).max(300).regex(/^[^\r\n]+$/);
const label = z.string().trim().min(1).max(80).regex(/^[^\r\n]+$/);
const address = z.string().trim().min(1).max(320).regex(/^[^\r\n]+$/);
export const noteSchema = z.string().trim().max(1000);
export const dismissReasonSchema = z.string().trim().min(1).max(200).regex(/^[^\r\n]+$/);
export const draftSchema = z.string().max(40_000);
// Optional evidence on any card: Markdown the host renders like a chat message, and up to four images.
const contextSchema = z.string().trim().min(1).max(20_000);
// An https URL, or an absolute path to an image on the thread's host (served through bb's host-files route).
// Paths must name an image file, so a card can never link the user to arbitrary host files.
export const mediaSrcSchema = z.string().trim().max(2000).refine((value) => /^https:\/\/\S+$/i.test(value) || /^\/[^\0\r\n]+\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(value),
  "Use an https URL or an absolute path to a .png, .jpg, .gif, .webp, .avif or .svg file on the thread's host");
export const mediaSchema = z.object({ src: mediaSrcSchema, alt: line, caption: line.optional() }).strict();
// Urgent items lead Waiting on you; omitted means normal.
export const prioritySchema = z.enum(["urgent", "normal", "low"]);
export type Priority = z.infer<typeof prioritySchema>;
const evidence = { context: contextSchema.optional(), media: z.array(mediaSchema).min(1).max(4).optional(), priority: prioritySchema.optional() };
export const contentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reply"),
    summary: line,
    to: z.array(address).min(1).max(30),
    cc: z.array(address).max(30).default([]),
    bcc: z.array(address).max(30).default([]),
    subject: line,
    original: z.object({ from: line, date: line.optional(), body: z.string().max(60_000) }).strict(),
    draft: draftSchema,
    ...evidence,
  }).strict(),
  z.object({
    type: z.literal("decide"), question: line, consequence: line,
    yesLabel: line.optional(), noLabel: line.optional(),
    // Explicit semantic key: matching button copy alone is not enough for bulk approval.
    actionKey: idSchema.optional(),
    // The agent's suggestion; a decision sheet's Accept recommended stages it, nothing sends it.
    recommended: z.enum(["yes", "no"]).optional(),
    ...evidence,
  }).strict(),
  z.object({
    type: z.literal("choice"), question: line,
    options: z.array(z.object({ id: idSchema, label, hint: line.optional() }).strict()).min(2).max(6),
    recommended: idSchema.optional(), consequence: line.optional(),
    ...evidence,
  }).strict().superRefine((value, ctx) => {
    const ids = value.options.map((option) => option.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Each option needs its own id" });
    if (value.recommended && !ids.includes(value.recommended)) ctx.addIssue({ code: "custom", path: ["recommended"], message: "Recommend one of the option ids" });
  }),
  // A plain question the user answers in their own words.
  z.object({ type: z.literal("ask"), question: line, ...evidence }).strict(),
]);
export const actionSchema = z.enum(["send", "save-draft", "yes", "no", "later", "skip", "choose", "answer"]);
export type Action = z.infer<typeof actionSchema>;
export const actionIcons: Record<Action, string> = {
  send: "Sent", "save-draft": "FileText", yes: "Check", no: "X", later: "Clock", skip: "inline-action-cards/skip-forward", choose: "Check", answer: "MessageSquare",
};
export const labels: Record<Action, string> = {
  send: "Send", "save-draft": "Save to Gmail drafts", yes: "Yes", no: "No", later: "Later", skip: "Skip", choose: "Use", answer: "Answer",
};
export const itemSchema = z.object({
  id: idSchema,
  threadId: idSchema,
  revision: z.number().int().positive(),
  content: contentSchema,
  state: z.enum(["ready", "pending", "succeeded", "failed"]),
  attempt: z.object({
    id: z.string().uuid(), action: actionSchema, claimed: z.boolean(), note: noteSchema.optional(),
    // When the composer accepted the request; the card's buttons are done after that.
    sentAt: z.iso.datetime().optional(),
    // The option a choice card's "choose" attempt approves.
    choice: z.object({ id: idSchema, label }).strict().optional(),
  }).strict().nullable(),
  result: z.object({ message: z.string().min(1).max(500), retryable: z.boolean() }).strict().nullable(),
  updatedAt: z.string(),
  // The user dismissed the item without answering: settled, nothing approved. Older builds drop this field on read.
  // notice: whether the owning thread was told. "sending" is claimed by one sender; only "failed" is retried.
  dismissed: z.object({
    at: z.iso.datetime(), reason: dismissReasonSchema.optional(),
    notice: z.enum(["pending", "sending", "sent", "failed"]).optional(), noticeError: z.string().max(300).optional(),
  }).strict().optional(),
}).strict();
export type Item = z.infer<typeof itemSchema>;
/** Whether the user can dismiss this item: unanswered, a safe failure, or an answer that never reached the agent. */
export function canDismiss(item: Item): boolean {
  if (item.state === "ready") return true;
  if (item.state === "failed") return !!item.result?.retryable && !["later", "skip"].includes(item.attempt?.action ?? "");
  return item.state === "pending" && !item.attempt?.claimed && !item.attempt?.sentAt;
}
// A newer build may have saved item types or fields this build doesn't know. Unknown fields are set aside on
// read and put back on write (storedItem), so a rollback never loses them; an item that still doesn't parse
// (for example an unknown type) reads as null, so it can't break the rest and can't be acted on.
type UnknownField = { path: PropertyKey[]; key: string; value: unknown };
// The attempt and result an item was read with: their unknown fields go back only while they are unchanged.
type ReadState = { fields: UnknownField[]; attempt: string | null; result: string };
const unknownFields = new WeakMap<Item, ReadState>();
const at = (value: unknown, path: PropertyKey[]) => path.reduce<unknown>((node, key) => node && typeof node === "object" ? (node as Record<PropertyKey, unknown>)[key] : undefined, value);
export function readItem(raw: string): Item | null {
  const value: unknown = JSON.parse(raw);
  const removed: UnknownField[] = [];
  for (let pass = 0; pass < 4; pass++) {
    const parsed = itemSchema.safeParse(value);
    if (parsed.success) {
      if (removed.length) unknownFields.set(parsed.data, { fields: removed, attempt: parsed.data.attempt?.id ?? null, result: JSON.stringify(parsed.data.result) });
      return parsed.data;
    }
    const issues = parsed.error.issues;
    if (!issues.every((issue) => issue.code === "unrecognized_keys")) return null;
    for (const issue of issues) {
      const target = at(value, issue.path);
      if (!target || typeof target !== "object") return null;
      for (const key of issue.keys) {
        removed.push({ path: issue.path, key, value: (target as Record<string, unknown>)[key] });
        delete (target as Record<string, unknown>)[key];
      }
    }
  }
  return null;
}
/** What to store for `next`, a validated copy of `source`: the fields `source` was read with that this build doesn't know go back in place. */
export function storedItem(source: Item, next: Item): unknown {
  const read = unknownFields.get(source);
  if (!read) return next;
  const stored: unknown = structuredClone(next);
  const kept = (path: PropertyKey[]) => path[0] === "attempt" ? read.attempt !== null && next.attempt?.id === read.attempt
    : path[0] === "result" ? JSON.stringify(next.result) === read.result : true;
  for (const { path, key, value } of read.fields.filter((field) => kept(field.path))) {
    const target = at(stored, path);
    if (target && typeof target === "object" && !(key in target)) (target as Record<string, unknown>)[key] = value;
  }
  return stored;
}
export type Content = z.infer<typeof contentSchema>;
export const tableContentSchema = z.object({
  title: line,
  ids: z.array(idSchema).min(1).max(20).refine((ids) => new Set(ids).size === ids.length, "Each item must appear once"),
}).strict();
export const tableSchema = tableContentSchema.extend({ id: idSchema, threadId: idSchema });
// A comment the user sent from a card, and the agent's answer once it replies on the card.
export const answerSchema = z.string().trim().min(1).max(8000);
export const followUpSchema = z.object({ commentId: z.string().uuid(), note: noteSchema, answer: answerSchema.nullable() }).strict();
export type FollowUp = z.infer<typeof followUpSchema>;
export const itemViewSchema = itemSchema.extend({
  followUps: z.array(followUpSchema),
  // Read-time attribution, never written into the saved card. Optional for older clients/servers.
  threadTitle: z.string().optional(), threadProjectId: z.string().nullable().optional(),
});
export type ItemView = z.infer<typeof itemViewSchema>;
export const tableViewSchema = tableSchema.extend({ items: z.array(itemViewSchema) });
export type TableView = z.infer<typeof tableViewSchema>;

export function actionLabel(item: Item, action: Action): string {
  if (item.content.type === "decide") {
    if (action === "yes") return item.content.yesLabel ?? "Yes";
    if (action === "no") return item.content.noLabel ?? "No";
  }
  if (action === "choose" && item.attempt?.action === "choose" && item.attempt.choice) return chooseLabel(item.attempt.choice.label);
  return labels[action];
}

export function chooseLabel(option: string): string {
  return `Use ${option}`;
}

export function bulkLabel(items: Item[]): string | null {
  const first = items[0]?.content;
  if (!first || first.type !== "decide" || !first.actionKey || !first.yesLabel) return null;
  return items.every(({ content }) => content.type === "decide" && content.actionKey === first.actionKey && content.yesLabel === first.yesLabel)
    ? `${first.yesLabel} all` : null;
}

export function mentionId(item: Item, changes = false): string {
  return `${item.threadId}:${item.id}:${changes ? "changes" : item.attempt!.id}`;
}

export function assertAction(item: Item, action: Action) {
  const allowed: Action[] = item.content.type === "reply" ? ["send", "save-draft", "later", "skip"]
    : item.content.type === "choice" ? ["choose", "later", "skip"] : item.content.type === "ask" ? ["answer"] : ["yes", "no", "later", "skip"];
  if (!allowed.includes(action)) throw new Error("That action does not belong to this card.");
  if ((action === "send" || action === "save-draft") && item.content.type === "reply" && !item.content.draft.trim()) {
    throw new Error("Write a draft before sending or saving it to Gmail.");
  }
}

export function title(item: Item): string {
  return item.content.type === "reply" ? item.content.summary : item.content.question;
}

export function actionMessage(item: Item): string {
  if (!item.attempt) throw new Error("Choose an action first.");
  return item.state === "failed" && !item.result?.retryable ? "Check outcome for " : `${actionLabel(item, item.attempt.action)} `;
}

const logEntrySchema = itemSchema.extend({ threadTitle: z.string(), threadProjectId: z.string().nullable() });
export const logSchema = z.object({ waiting: z.array(logEntrySchema), done: z.array(logEntrySchema) });
// earlier: what the user already answered to an earlier version of the same question in this thread.
const waitingItemSchema = logEntrySchema.extend({ earlier: z.string().optional() });
export const waitingSchema = z.array(waitingItemSchema);
export type WaitingItem = z.infer<typeof waitingItemSchema>;
export type ActionLog = z.infer<typeof logSchema>;
