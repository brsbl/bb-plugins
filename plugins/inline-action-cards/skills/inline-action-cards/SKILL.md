---
name: inline-action-cards
description: Put editable email replies or Yes/No decisions inline in a bb reply, handle action-card clicks, and update each card with its result. Use when triaging individual items, preparing email replies, reading [action:...] choices, or reporting action outcomes.
---

# Inline Action Cards

One item per card. Create the item first, then emit the returned `::action{id="..."}` directive on its own line, outside code fences. Cards appear only inside assistant messages. IDs are unique within the owning thread; never reuse one for another email or decision. Use concise, task-specific IDs.

All item data and drafts live in the plugin's SQLite storage. Never put them in thread storage. CLI JSON travels to the server; local paths do not.

## Create

Run from the owning thread (or add `--thread <id>`). `--item-stdin` avoids shell escaping and supports multiline text:

```sh
bb action-cards create esc-1 --item-stdin <<'JSON'
{"type":"reply","summary":"Follow up on the missing escrow refund","subject":"Re: Refund check","to":["escrow@example.com"],"cc":[],"bcc":[],"original":{"from":"Escrow team <escrow@example.com>","body":"We mailed your refund on June 8."},"draft":"Hello,\n\nCould you confirm the status of my refund check?\n\nThank you."}
JSON
bb action-cards create receipts-1 --item-stdin <<'JSON'
{"type":"decide","question":"File DigitalOcean under Receipts?","consequence":"Add the Receipts label to this invoice; it stays in your inbox."}
JSON
```

Use the actual recipients and show every To/Cc/Bcc recipient. Include enough original context to understand the reply. A Reply draft is plain text; Markdown characters remain literal when sent. For a Decide card, state the exact consequence of Yes. No means do not perform the proposed action. Never invent approval from the presence of a card.

## Handle a click

A submitted message such as `Send: escrow follow-up [action:esc-1] [attempt:<uuid>]` is approval for exactly that action and item. The button submits through the existing composer pipeline (and can queue while the thread is busy). Do not ask the user to type another confirmation.

1. Claim the exact attempt before acting:
   `bb action-cards claim esc-1 --attempt <uuid>`
2. Use the returned content, especially its latest saved `draft`, `to`, `cc`, `bcc`, and `subject`. Do not use the initial draft from chat or memory. The card locks editing during the action.
3. Execute only the claimed action using the user's connected tool. Send sends the reply; Save to Gmail drafts creates/updates the Gmail draft without sending. Yes performs the stated consequence; No declines it. Later and Skip require no external action; report `Later` or `Skipped` immediately. Later does not create a reminder.
4. Report the result on the same card:

```sh
bb action-cards report esc-1 --attempt <uuid> --outcome succeeded --message 'Sent'
bb action-cards report receipts-1 --attempt <uuid> --outcome succeeded --message 'Added to Receipts'
```

The card adds the local time. Put useful result detail in the message when needed. Read persisted state any time with `bb action-cards get esc-1`.

A rejected claim is not approval to try again. It means the attempt is stale, already claimed, or finished. Read its state and reconcile the external service result; never repeat the side effect. The claim is durable across reloads. Retain the external service's receipt in the thread when available. This prevents duplicate execution from repeated clicks/messages but cannot make external APIs exactly-once.

## Failure and retry

Report a short, user-facing failure with recovery in the same place. Mark it retryable only after verifying the external action did **not** happen:

```sh
bb action-cards report esc-1 --attempt <uuid> --outcome failed --message 'Gmail is disconnected. Reconnect it, then retry.' --retryable
```

The card shows Retry. A new click creates a new attempt, which must be claimed again. If a timeout or crash leaves the outcome unknown, omit `--retryable`. The card offers Check outcome; inspect the service before reporting success or safe failure. Do not send again to discover whether the earlier send worked. A `Check outcome:` message authorizes reconciliation only, not repeating the action. A pending Resend request uses the original attempt ID, so it cannot be claimed twice.

## Ask for changes

This button saves current edits, fills the composer, and focuses it without submitting. Wait for the user's requested changes. Read the current item, then update the **same** draft using its revision:

```sh
bb action-cards get esc-1
bb action-cards revise esc-1 --revision 2 --draft-stdin <<'TEXT'
Hello,

Could you confirm when my refund check was mailed?
TEXT
```

A revision conflict means the user edited the draft meanwhile. Re-read and incorporate their edit rather than overwriting it. A revision is not approval to send. The original card refreshes in place; do not create another card for the revised draft. Failed actions must be reconciled or safely reopened before editing. Later/Skip cards have Resume.

## Limits

Reply and Decide only; inline only. No Gmail credentials, Gmail transport, autonomous send, scheduled reminder, batch card, or side panel is included. Agents supply the connected service and must report outcomes. The editor is a small autosaving plain-text field; it does not implement Docs rich text or proposal acceptance. Docs' private editor cannot be embedded or flushed safely by another plugin through the public SDK.
