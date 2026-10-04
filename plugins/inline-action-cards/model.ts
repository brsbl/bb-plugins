import { z } from "zod";

export const idSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const line = z.string().trim().min(1).max(300).regex(/^[^\r\n]+$/);
const label = z.string().trim().min(1).max(80).regex(/^[^\r\n]+$/);
const address = z.string().trim().min(1).max(320).regex(/^[^\r\n]+$/);
export const noteSchema = z.string().trim().max(1000);
export const draftSchema = z.string().max(40_000);
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
  }).strict(),
  z.object({
    type: z.literal("decide"), question: line, consequence: line,
    yesLabel: line.optional(), noLabel: line.optional(),
    // Explicit semantic key: matching button copy alone is not enough for bulk approval.
    actionKey: idSchema.optional(),
  }).strict(),
  z.object({
    type: z.literal("choice"), question: line,
    options: z.array(z.object({ id: idSchema, label, hint: line.optional() }).strict()).min(2).max(6),
    recommended: idSchema.optional(), consequence: line.optional(),
  }).strict().superRefine((value, ctx) => {
    const ids = value.options.map((option) => option.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Each option needs its own id" });
    if (value.recommended && !ids.includes(value.recommended)) ctx.addIssue({ code: "custom", path: ["recommended"], message: "Recommend one of the option ids" });
  }),
]);
export const actionSchema = z.enum(["send", "save-draft", "yes", "no", "later", "skip", "choose"]);
export type Action = z.infer<typeof actionSchema>;
export const labels: Record<Action, string> = {
  send: "Send", "save-draft": "Save to Gmail drafts", yes: "Yes", no: "No", later: "Later", skip: "Skip", choose: "Use",
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
}).strict();
export type Item = z.infer<typeof itemSchema>;
export type Content = z.infer<typeof contentSchema>;
export const tableContentSchema = z.object({
  title: line,
  ids: z.array(idSchema).min(1).max(20).refine((ids) => new Set(ids).size === ids.length, "Each item must appear once"),
}).strict();
export const tableSchema = tableContentSchema.extend({ id: idSchema, threadId: idSchema });
export const tableViewSchema = tableSchema.extend({ items: z.array(itemSchema) });
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
    : item.content.type === "choice" ? ["choose", "later", "skip"] : ["yes", "no", "later", "skip"];
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
export type ActionLog = z.infer<typeof logSchema>;
