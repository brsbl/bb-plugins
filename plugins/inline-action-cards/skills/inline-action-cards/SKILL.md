---
name: inline-action-cards
description: Use whenever you need a user decision or approval in any thread, including merges or shipping, sending emails, applying changes, switching settings, or choosing between options. Create inline action cards instead of prose confirmation questions, handle card clicks, and report outcomes on the cards.
---

# Inline Action Cards

Whenever you need the user's decision or approval, create an action card instead of asking in prose. This applies in any thread: merge or ship a prepared PR, send an email, apply a proposed change, switch a setting, or choose between two options. Explain the proposed action and tradeoffs before the card so the user can approve a concrete result. Existing authorization still applies; do not add a new approval step to work the user already authorized.

Use a single card for one important item. When the user picks one of several options, use one choice card, never a table of yes/no rows. Use a table for three or more independent yes/no items, or a mixed group that should stay together. Create the item first, then emit the returned `::action{id="..."}` directive on its own line, outside code fences. Cards appear only inside assistant messages. IDs are unique within the owning thread; never reuse one for another email or decision. Use concise, task-specific IDs.

All item data and drafts live in the plugin's SQLite storage. Never put them in thread storage. CLI JSON travels to the server; local paths do not.

## Create

Run from the owning thread (or add `--thread <id>`). `--item-stdin` avoids shell escaping and supports multiline text:

```sh
bb action-cards create esc-1 --item-stdin <<'JSON'
{"type":"reply","summary":"Follow up on the missing escrow refund","subject":"Re: Refund check","to":["escrow@example.com"],"cc":[],"bcc":[],"original":{"from":"Escrow team <escrow@example.com>","date":"Jun 8","body":"We mailed your refund on June 8."},"draft":"Hello,\n\nCould you confirm the status of my refund check?\n\nThank you."}
JSON
bb action-cards create receipts-1 --item-stdin <<'JSON'
{"type":"decide","question":"File DigitalOcean under Receipts?","consequence":"Add the Receipts label to this invoice; it stays in your inbox."}
JSON
```

Use the actual recipients and show every To/Cc/Bcc recipient. Include enough original context to understand the reply. A Reply draft is plain text; Markdown characters remain literal when sent. For a Decide card, state the exact consequence of Yes. No means do not perform the proposed action. Never invent approval from the presence of a card.

To approve or decline one proposed action, use Decide. A No click declines the proposed action; it does not approve a different side effect. Use `yesLabel`/`noLabel` to make the choice clear while preserving those meanings. When the user picks between alternatives, use a choice card (below).

```sh
bb action-cards create merge-pr --item-stdin <<'JSON'
{"type":"decide","question":"Merge the reviewed PR?","consequence":"Squash-merge PR #123 into main at the reviewed head.","yesLabel":"Merge","noLabel":"Keep open"}
JSON
```

Replace example identifiers with the actual target and include the exact reviewed head when approval depends on a revision. After a click, claim and report the attempt using the flow below, whatever service or setting the action affects.

## Choose one option

A choice card asks one question and lists 2–6 options as a compact single-select list. The user picks one and clicks “Use <option>”. Give each option a stable `id`, a short `label` (80 characters at most; aim for a few words), and an optional one-line `hint`; the card truncates long hints. Set `recommended` to an option id to mark it and preselect it; otherwise nothing is selected. Add `consequence` only when it applies to every option.

```sh
bb action-cards create account-setup --item-stdin <<'JSON'
{"type":"choice","question":"Which account setup should bb use?","recommended":"multi","options":[{"id":"single","label":"UserSingle","hint":"One account for every thread"},{"id":"multi","label":"UserMultiple","hint":"Pick an account per thread"},{"id":"pool","label":"Pool","hint":"Rotate accounts by quota"}]}
JSON
```

Explain tradeoffs before the card rather than in hints. A click carries `action: "choose"` and `choice: {"id","label"}` in its hidden context; act on that option only. Claim and report like Decide, for example `--message 'UserMultiple chosen'`. Later and Skip live in the card's ⋯ menu. Choice cards stand alone; tables do not accept them.

## Group items in a table

Create the items first, then create a table that references those same IDs. Emit its returned `::actions{id="..."}` directive on its own line. Rows keep their order as results arrive. Reply rows open their full editor with Review; only one is open at a time.

```sh
bb action-cards create news-1 --item-stdin <<'JSON'
{"type":"decide","question":"DigitalOcean · September newsletter","consequence":"Archive this newsletter from the inbox.","yesLabel":"Archive","noLabel":"Keep","actionKey":"archive-email"}
JSON
# Create news-2 and news-3 for the other messages, then:
bb action-cards create-table newsletters --table-stdin <<'JSON'
{"title":"3 newsletters","ids":["news-1","news-2","news-3"]}
JSON
```

Tables accept up to 20 existing items from the same thread. For mixed rows, include Reply and Decide IDs in the same list. A Decide item can supply `yesLabel`/`noLabel` for precise verbs. They still map to the existing `yes`/`no` actions. Use `actionKey` only when rows perform the **same operation** (for example `archive-email`); matching keys and affirmative labels enable Archive all. Do not give archive, delete, or differently scoped actions the same key. The bulk button approves only the currently ready rows; failed rows require their own retry. Each selected item gets its own attempt and outcome, so partial failures remain visible.

## Handle a click

A click submits readable text such as “Send escrow follow-up” with a named mention pill. Its user-hidden context contains `kind: inline-action-card`, `threadId`, `itemId`, `attemptId`, `action`, and `intent`, plus `note` when supplied. `approved-action` is approval for exactly that attempt. A bulk message contains one such reference per selected row. Read those IDs from context, never guess them from the label. Keep them in tool calls; do not repeat hidden IDs in user-facing replies. Legacy messages containing `[action:...] [attempt:...]` remain valid references to their existing attempts. The button submits through the existing composer pipeline (and can queue while the thread is busy). Do not ask the user to type another confirmation.

1. Claim the exact attempt before acting:
   `bb action-cards claim esc-1 --attempt <uuid>`
2. Treat the returned attempt’s `note` as part of the approval and follow it. If it conflicts with the chosen action (for example “Yes, but don’t send yet”), do not perform that action. Report `--outcome failed --retryable` with a message saying what you held and why, such as “Held the reply; not sent yet.” Do not report success for an action you held. Tell the user to use Edit draft or Choose again when they’re ready; Retry repeats the same note. Do not discard a note on retry or reconciliation. Use the returned content, especially its latest saved `draft`, `to`, `cc`, `bcc`, and `subject`. Do not use the initial draft from chat or memory. The card locks editing during the action.
3. Execute only the claimed action using the user's connected tool. Send sends the reply; Save to Gmail drafts creates/updates the Gmail draft without sending. Yes performs the stated consequence; No declines it. Later and Skip require no external action; report `Later` or `Skipped` immediately. Later does not create a reminder.
4. Report the result on the same card:

```sh
bb action-cards report esc-1 --attempt <uuid> --outcome succeeded --message 'Sent'
bb action-cards report receipts-1 --attempt <uuid> --outcome succeeded --message 'Added to Receipts'
```

The card collapses to a result line and adds the local time. Use “Sent to Escrow team”, “Archived”, or “Filed under Receipts” as appropriate. The draft stays reachable through View. Do not promise Undo: this plugin has no reversible service action. Put useful result detail in the message when needed. Read persisted state any time with `bb action-cards get esc-1`.

A rejected claim is not approval to try again. It means the attempt is stale, already claimed, or finished. Read its state and reconcile the external service result; never repeat the side effect. The claim is durable across reloads. Retain the external service's receipt in the thread when available. This prevents duplicate execution from repeated clicks/messages but cannot make external APIs exactly-once.

## Failure and retry

Report a short, user-facing failure with recovery in the same place. Mark it retryable only after verifying the external action did **not** happen:

```sh
bb action-cards report esc-1 --attempt <uuid> --outcome failed --message 'Gmail is disconnected. Reconnect it, then retry.' --retryable
```

The card shows Retry. A new click creates a new attempt, which must be claimed again. If a timeout or crash leaves the outcome unknown, omit `--retryable`. The card offers Check outcome; inspect the service before reporting success or safe failure. Do not send again to discover whether the earlier send worked. A message with `check-outcome` context (or a legacy `Check outcome:` message) authorizes reconciliation only, not repeating the action. A pending Resend request uses the original attempt ID, so it cannot be claimed twice.

## Add a note

Every ready card offers Add note as a speech-bubble button next to Remind me later and Skip; table rows offer it in their ⋯ menu. It focuses a short field above the buttons. Choosing an action submits the note visibly after the mention pill and includes it as `note` in hidden context. The note is saved on the attempt, returned by claim/get, and shown under the result. Empty notes keep the usual behavior; Escape or clearing the field dismisses it. Bulk approval carries each row’s own note.

## Comment without choosing

When the note field contains text, Comment sends just the note with a speech-bubble pill. Hidden context contains `intent: comment`, `note`, `threadId`, and `itemId`; it has no action or attempt. This is not approval. The card stays ready and its choices remain usable. Reply to the comment; if it asks for a change, read the latest item and revise the **same** Reply draft using its revision. Decide question/consequence updates are not supported; explain the requested change instead of creating a replacement card or acting.

Comment replaces Reply’s Ask for changes button. Existing `request-changes` messages remain valid requests to revise, never approval. For a Reply change:

```sh
bb action-cards get esc-1
bb action-cards revise esc-1 --revision 2 --draft-stdin <<'TEXT'
Hello,

Could you confirm when my refund check was mailed?
TEXT
```

A revision conflict means the user edited the draft meanwhile. Re-read and incorporate their edit rather than overwriting it. A revision is not approval to send. The original card refreshes in place; do not create another card for the revised draft. Failed actions must be reconciled or safely reopened before editing. Later/Skip cards have Resume in their ⋯ menu. Safe failures put Edit draft / Choose again there too.

## Action log

Point users to **Action log** in the sidebar for waiting cards and past choices across threads. Read the log with `bb action-cards log --json`, or add `--thread <id>` to scope it to one thread.

## Limits

Reply, Decide, and Choice cards, inline, plus the Action log. No Gmail credentials, Gmail transport, autonomous send, scheduled reminder, or Undo is included. Agents supply the connected service and must report outcomes. The editor is a small autosaving plain-text field; it does not implement Docs rich text or proposal acceptance. Docs' private editor cannot be embedded or flushed safely by another plugin through the public SDK.
