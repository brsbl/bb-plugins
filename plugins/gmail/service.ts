import { createHash, randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { cardSchema, draftInput, mime, type DraftInput } from "./model.js";
import { GmailError, type createGoogle } from "./google.js";

export interface Receipt { state: "started" | "succeeded" | "failed"; action: "send" | "save-draft"; messageId: string; gmailId?: string; draftId?: string; threadId?: string; retryable?: boolean; error?: string }
export function createActions(bb: BbPluginApi, google: ReturnType<typeof createGoogle>) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    "CREATE TABLE gmail_attempts (attempt_id TEXT PRIMARY KEY, card_thread TEXT NOT NULL, card_id TEXT NOT NULL, receipt TEXT NOT NULL)",
    "CREATE TABLE gmail_card_drafts (card_thread TEXT NOT NULL, card_id TEXT NOT NULL, draft_id TEXT NOT NULL, PRIMARY KEY (card_thread, card_id))",
  ]);
  const get = (attempt: string): Receipt | null => {
    const row = db.prepare("SELECT receipt FROM gmail_attempts WHERE attempt_id = ?").get(attempt) as { receipt: string } | undefined;
    return row ? JSON.parse(row.receipt) as Receipt : null;
  };
  const update = (attempt: string, receipt: Receipt) => db.prepare("UPDATE gmail_attempts SET receipt = ? WHERE attempt_id = ?").run(JSON.stringify(receipt), attempt);
  return {
    receipt: get,
    async draft(input: DraftInput) {
      const parent = input.replyTo ? await google.message(input.replyTo) : undefined;
      return google.draft(mime(input, `${randomUUID()}@bb-gmail.invalid`, parent), input.draftId);
    },
    async execute(input: { threadId: string; cardId: string; attemptId: string; action: "send" | "save-draft"; replyTo?: string; noteReviewed?: boolean }) {
      // Fetch authoritative card content. Caller-supplied message text is never accepted here.
      const card = await bb.sdk.plugins.callRpc({ pluginId: "inline-action-cards", method: "get", input: { threadId: input.threadId, id: input.cardId }, outputSchema: cardSchema });
      if (card.threadId !== input.threadId || card.id !== input.cardId || card.state !== "pending" || !card.attempt?.claimed || card.attempt.id !== input.attemptId || card.attempt.action !== input.action) throw new GmailError("not_approved", "Claim this exact approved Reply card attempt before using Gmail.");
      if (card.attempt.note?.trim() && !input.noteReviewed) throw new GmailError("review_note", "Read and follow the approved attempt's note first. Use --note-reviewed only if it permits this exact action now.");
      const previous = get(input.attemptId);
      if (previous) return { ...previous, repeated: true, reportRequired: true };
      const content = draftInput.parse({ to: card.content.to, cc: card.content.cc, bcc: card.content.bcc, subject: card.content.subject, body: card.content.draft, replyTo: input.replyTo });
      const parent = content.replyTo ? await google.message(content.replyTo) : undefined;
      const messageId = `${createHash("sha256").update(input.attemptId).digest("hex")}@bb-gmail.invalid`;
      const message = mime(content, messageId, parent);
      const receipt: Receipt = { state: "started", action: input.action, messageId };
      // This synchronous unique insert is the durable boundary before any external write.
      const inserted = db.prepare("INSERT OR IGNORE INTO gmail_attempts (attempt_id, card_thread, card_id, receipt) VALUES (?, ?, ?, ?)").run(input.attemptId, input.threadId, input.cardId, JSON.stringify(receipt));
      if (!inserted.changes) return { ...get(input.attemptId)!, repeated: true, reportRequired: true };
      try {
        if (input.action === "send") {
          const sent = await google.send(message);
          if (!sent.id) throw new GmailError("unknown", "Gmail did not return a send receipt.", true);
          Object.assign(receipt, { state: "succeeded", gmailId: sent.id, threadId: sent.threadId });
        } else {
          const existing = db.prepare("SELECT draft_id FROM gmail_card_drafts WHERE card_thread = ? AND card_id = ?").get(input.threadId, input.cardId) as { draft_id: string } | undefined;
          const saved = await google.draft(message, existing?.draft_id);
          if (!saved.id || !saved.message?.id) throw new GmailError("unknown", "Gmail did not return a draft receipt.", true);
          Object.assign(receipt, { state: "succeeded", draftId: saved.id, gmailId: saved.message.id, threadId: saved.message.threadId });
          db.prepare("INSERT INTO gmail_card_drafts (card_thread, card_id, draft_id) VALUES (?, ?, ?) ON CONFLICT(card_thread, card_id) DO UPDATE SET draft_id=excluded.draft_id").run(input.threadId, input.cardId, saved.id);
        }
      } catch (error) {
        // Unknown failures include process/network interruptions after Gmail may have accepted a write.
        const safe = error instanceof GmailError && !error.uncertain;
        Object.assign(receipt, { state: "failed", retryable: safe, error: error instanceof GmailError ? error.message : "The Gmail outcome is unknown. Check it before retrying." });
      }
      update(input.attemptId, receipt);
      return { ...receipt, repeated: false, reportRequired: true };
    },
    async reconcile(attempt: string) {
      const receipt = get(attempt);
      if (!receipt) throw new GmailError("not_found", "No Gmail receipt exists for this attempt.");
      if (receipt.state === "succeeded") return receipt;
      const found = await google.search(`in:anywhere rfc822msgid:${receipt.messageId}`, 10);
      for (const ref of found.messages ?? []) {
        const message = await google.message(ref.id);
        if (receipt.action === "send" && message.labelIds?.includes("SENT")) {
          Object.assign(receipt, { state: "succeeded", gmailId: message.id, threadId: message.threadId, retryable: false });
          update(attempt, receipt); return receipt;
        }
      }
      return { ...receipt, matches: found.messages ?? [], warning: "No verified send receipt found. Search can lag; absence does not authorize another send." };
    },
  };
}
