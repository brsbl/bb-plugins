import { z } from "zod";

export const idSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
const line = z.string().trim().min(1).max(300).regex(/^[^\r\n]+$/);
const address = z.string().trim().min(1).max(320).regex(/^[^\r\n]+$/);
export const draftSchema = z.string().max(40_000);
export const contentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reply"),
    summary: line,
    to: z.array(address).min(1).max(30),
    cc: z.array(address).max(30).default([]),
    bcc: z.array(address).max(30).default([]),
    subject: line,
    original: z.object({ from: line, body: z.string().max(60_000) }).strict(),
    draft: draftSchema,
  }).strict(),
  z.object({ type: z.literal("decide"), question: line, consequence: line }).strict(),
]);
export const actionSchema = z.enum(["send", "save-draft", "yes", "no", "later", "skip"]);
export type Action = z.infer<typeof actionSchema>;
export const labels: Record<Action, string> = {
  send: "Send", "save-draft": "Save to Gmail drafts", yes: "Yes", no: "No", later: "Later", skip: "Skip",
};
export const itemSchema = z.object({
  id: idSchema,
  threadId: idSchema,
  revision: z.number().int().positive(),
  content: contentSchema,
  state: z.enum(["ready", "pending", "succeeded", "failed"]),
  attempt: z.object({
    id: z.string().uuid(), action: actionSchema, claimed: z.boolean(),
  }).strict().nullable(),
  result: z.object({ message: z.string().min(1).max(500), retryable: z.boolean() }).strict().nullable(),
  updatedAt: z.string(),
}).strict();
export type Item = z.infer<typeof itemSchema>;
export type Content = z.infer<typeof contentSchema>;

export function assertAction(item: Item, action: Action) {
  const allowed: Action[] = item.content.type === "reply"
    ? ["send", "save-draft", "later", "skip"] : ["yes", "no", "later", "skip"];
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
  return `${labels[item.attempt.action]}: ${title(item)} [action:${item.id}] [attempt:${item.attempt.id}]`;
}
