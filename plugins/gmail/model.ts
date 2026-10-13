import { z } from "zod";

export const id = z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/);
const line = z.string().trim().min(1).max(500).regex(/^[^\r\n\x00-\x1f\x7f]+$/);
// One mailbox per entry. Display names are encoded by the MIME writer.
export const address = line.refine((value) => /^(?:[^<>]+\s*<)?[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:>)?$/.test(value) && value.includes("<") === value.endsWith(">"), "Use one email address, optionally Name <address>, per entry");
export const draftInput = z.object({
  to: z.array(address).min(1).max(30), cc: z.array(address).max(30).default([]), bcc: z.array(address).max(30).default([]),
  subject: line, body: z.string().min(1).max(40_000), replyTo: id.optional(), draftId: id.optional(),
}).strict();
export type DraftInput = z.infer<typeof draftInput>;
export const cardSchema = z.object({
  id, threadId: id, revision: z.number().int(), state: z.enum(["ready", "pending", "succeeded", "failed"]),
  content: z.object({ type: z.literal("reply"), to: z.array(address), cc: z.array(address).default([]), bcc: z.array(address).default([]), subject: line, draft: z.string().min(1).max(40_000), context: z.string().trim().min(1) }),
  attempt: z.object({ id: z.string().uuid(), action: z.enum(["send", "save-draft"]), claimed: z.boolean(), note: z.string().optional() }).nullable(),
});
export type Card = z.infer<typeof cardSchema>;
export interface GmailPart { mimeType?: string; filename?: string; headers?: { name: string; value: string }[]; body?: { data?: string; size?: number; attachmentId?: string }; parts?: GmailPart[] }
export interface GmailMessage { id: string; threadId: string; labelIds?: string[]; snippet?: string; internalDate?: string; payload?: GmailPart }
export function header(message: GmailMessage, name: string): string {
  return message.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}
export function messageView(message: GmailMessage) {
  const text: string[] = [], html: string[] = [], attachments: { filename: string; mimeType: string; size: number }[] = [];
  let remaining = 32_000, truncated = false;
  const walk = (part: GmailPart, depth = 0) => {
    if (depth > 20) { truncated = true; return; }
    if (part.filename) { attachments.push({ filename: part.filename.slice(0, 300), mimeType: part.mimeType ?? "", size: part.body?.size ?? 0 }); return; }
    if (part.body?.data && ["text/plain", "text/html"].includes(part.mimeType ?? "")) {
      const decoded = Buffer.from(part.body.data, "base64url").toString("utf8");
      const value = decoded.slice(0, remaining); remaining -= value.length;
      truncated ||= value.length < decoded.length;
      (part.mimeType === "text/html" ? html : text).push(value);
    }
    for (const child of part.parts ?? []) walk(child, depth + 1);
  };
  if (message.payload) walk(message.payload);
  return { id: message.id, threadId: message.threadId, labelIds: message.labelIds ?? [], from: header(message, "From").slice(0, 1000), to: header(message, "To").slice(0, 4000), subject: header(message, "Subject").slice(0, 1000), date: header(message, "Date"), messageId: header(message, "Message-ID"), snippet: message.snippet?.slice(0, 500) ?? "", text: text.join("\n"), html: html.join("\n"), attachments: attachments.slice(0, 50), truncated, untrusted: true };
}
function encoded(value: string) {
  const chunks: string[] = []; let chunk = "";
  for (const char of value) { if (Buffer.byteLength(chunk + char) > 42) { chunks.push(chunk); chunk = ""; } chunk += char; }
  if (chunk) chunks.push(chunk);
  return chunks.map((v) => `=?UTF-8?B?${Buffer.from(v).toString("base64")}?=`).join("\r\n ");
}
function mailbox(value: string) {
  const index = value.indexOf("<");
  return index < 0 ? value : `${encoded(value.slice(0, index).trim())} ${value.slice(index)}`;
}
export function mime(input: DraftInput, messageId: string, parent?: GmailMessage) {
  const headers = [`To: ${input.to.map(mailbox).join(",\r\n ")}`];
  if (input.cc.length) headers.push(`Cc: ${input.cc.map(mailbox).join(",\r\n ")}`);
  if (input.bcc.length) headers.push(`Bcc: ${input.bcc.map(mailbox).join(",\r\n ")}`);
  headers.push(`Subject: ${encoded(input.subject)}`, `Message-ID: <${messageId}>`);
  if (parent) {
    const parentId = header(parent, "Message-ID");
    if (!/^<[^<>\s]+>$/.test(parentId)) throw new Error("The original message has no usable Message-ID; prepare a new email instead.");
    if (header(parent, "Subject").replace(/^re:\s*/i, "").trim() !== input.subject.replace(/^re:\s*/i, "").trim()) throw new Error("A threaded reply must keep the original subject.");
    const refs = header(parent, "References").match(/<[^<>\s]+>/g) ?? [];
    headers.push(`In-Reply-To: ${parentId}`, `References: ${[...refs.slice(-15), parentId].join("\r\n ")}`);
  }
  headers.push("MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64");
  const body = Buffer.from(input.body.replace(/\r?\n/g, "\r\n"), "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? "";
  return { raw: Buffer.from(`${headers.join("\r\n")}\r\n\r\n${body}\r\n`).toString("base64url"), ...(parent ? { threadId: parent.threadId } : {}) };
}
