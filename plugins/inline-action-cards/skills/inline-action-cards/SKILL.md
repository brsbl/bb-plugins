---
name: inline-action-cards
description: Use whenever you need a user decision or approval in any thread, including merges or shipping, sending emails, applying changes, switching settings, or choosing between options. Create inline action cards instead of prose confirmation questions, handle card clicks, and report outcomes on the cards.
---

# Inline Action Cards

Whenever you need the user's decision or approval, create an action card instead of asking in prose. This applies in any thread: merge or ship a prepared PR, send an email, apply a proposed change, switch a setting, or choose between two options. Explain the proposed action and tradeoffs before the card so the user can approve a concrete result. Existing authorization still applies; do not add a new approval step to work the user already authorized.

Use a single card for one important item. When the user picks one of several options, use one choice card, never a table of yes/no rows. When you need three or more decisions at once, put them all in **one table** (a decision sheet, up to 20 rows of any type) instead of several cards or messages: the user answers every row, then sends all answers together. Create the item first, then emit the returned `::action{id="..."}` directive on its own line, outside code fences. Cards appear only inside assistant messages. IDs are unique within the owning thread; never reuse one for another email or decision. Use concise, task-specific IDs.

**Don't nag about waiting cards.** A waiting card is your open question, and the user may simply not have answered yet. By default, don't mention it at all: it stays in the thread and in the Action log. Reshare a card only when: (1) your next step is blocked on that answer, (2) the user asks about it, or (3) the card changed (for example a revised draft). To reshare, emit the same `::action{id="..."}` (or `::actions{id="..."}`) directive again; the same live card renders in both places, so reuse the ID and don't create a new item. Reshare a card at most once per user reply, and never in two of your messages in a row without the user replying in between. Don't write "the card above is still waiting on your choice."

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

## Give the decision its context

Any card (Reply, Decide, or Choice) accepts optional evidence so the user can decide without leaving the card:

- `context`: Markdown, up to 20,000 characters, rendered like a chat message (headings, lists, code blocks, tables, links). Lead with what changes and the risk; long context is clipped until the user opens it.
- `media`: up to 4 images, each `{"src","alt","caption"?}`. `src` is an `https://` URL or an **absolute path** to a `.png`, `.jpg`, `.gif`, `.webp`, `.avif` or `.svg` file on the thread's host (for example a screenshot you just captured). Relative paths, `http:`, and `data:` URLs are rejected.
- Decide cards also accept `recommended: "yes" | "no"`; Choice cards keep `recommended: "<option id>"`. In a table, Accept recommended stages these for the user to review; nothing is sent until they press Send.

```sh
bb action-cards create merge-412 --item-stdin <<'JSON'
{"type":"decide","question":"Merge PR #412 — shorten sessions to 7 days?","consequence":"Squash-merge #412 into main at 3f2a1c9.","yesLabel":"Merge","noLabel":"Keep open","recommended":"yes",
 "context":"Sessions expire after **7 days** instead of 30.\n\n```diff\n- SESSION_TTL = days(30)\n+ SESSION_TTL = days(7)\n```\n\n| Check | Result |\n| --- | --- |\n| CI | ✅ 214 passed |",
 "media":[{"src":"/Users/me/project/.shots/login.png","alt":"Sign-in screen after the change","caption":"Sign-in after expiry"}]}
JSON
```

Keep `question` and `consequence` short; they are what the user scans in a table. Put detail in `context`, not in the question.

## Choose one option

A choice card asks one question and lists 2–6 options as a compact single-select list. The user picks one and clicks “Use <option>”. Give each option a stable `id`, a short `label` (80 characters at most; aim for a few words), and an optional one-line `hint`; the card truncates long hints. Set `recommended` to an option id to mark it and preselect it; otherwise nothing is selected. Add `consequence` only when it applies to every option.

```sh
bb action-cards create account-setup --item-stdin <<'JSON'
{"type":"choice","question":"Which account setup should bb use?","recommended":"multi","options":[{"id":"single","label":"UserSingle","hint":"One account for every thread"},{"id":"multi","label":"UserMultiple","hint":"Pick an account per thread"},{"id":"pool","label":"Pool","hint":"Rotate accounts by quota"}]}
JSON
```

Explain tradeoffs in `context` or before the card rather than in hints. A click carries `action: "choose"` and `choice: {"id","label"}` in its hidden context; act on that option only. Claim and report like Decide, for example `--message 'UserMultiple chosen'`. Comment and Skip work as on other cards. Choice cards can also be rows in a table.

## Group many decisions in a table (decision sheet)

Create the items first, then create a table that references those same IDs. Emit its returned `::actions{id="..."}` directive on its own line. Rows keep their order as results arrive. Order rows by importance and keep each `question` scannable.

In a table, each row answers inline: Decide rows show your Yes/No labels, Choice rows show their options, and Reply rows open their full draft with Review before Send can be staged. Answers are **staged**, not sent; the user can add a per-row comment, open a row for its context, ask about it, and then press **Send N answers**. That one message carries one mention per answered row, each with its own attempt and comment. Rows the user left unanswered send nothing; don't assume an answer for them. Only one row is open at a time.

```sh
bb action-cards create news-1 --item-stdin <<'JSON'
{"type":"decide","question":"DigitalOcean · September newsletter","consequence":"Archive this newsletter from the inbox.","yesLabel":"Archive","noLabel":"Keep","actionKey":"archive-email"}
JSON
# Create news-2 and news-3 for the other messages, then:
bb action-cards create-table newsletters --table-stdin <<'JSON'
{"title":"3 newsletters","ids":["news-1","news-2","news-3"]}
JSON
```

Tables accept up to 20 existing items from the same thread, of any type. For mixed rows, include Reply, Decide, and Choice IDs in the same list. A Decide item can supply `yesLabel`/`noLabel` for precise verbs. They still map to the existing `yes`/`no` actions. Use `actionKey` only when rows perform the **same operation** (for example `archive-email`); matching keys and affirmative labels enable Archive all. Do not give archive, delete, or differently scoped actions the same key. The bulk button stages Yes on the currently ready rows; the user still presses Send. Failed rows require their own retry. Each sent row gets its own attempt and outcome, so partial failures remain visible.

When a sheet message arrives, handle every reference in it: claim each attempt, act on it, and report each result on its own row before replying. Summarize the batch in one short message (what succeeded, what failed and why); don't restate each row.

## Handle a click

A click submits readable text such as “Send escrow follow-up” with a named mention pill. Its user-hidden context contains `kind: inline-action-card`, `threadId`, `itemId`, `attemptId`, `action`, and `intent`, plus `note` when the user attached a comment. `approved-action` is approval for exactly that attempt. A bulk message contains one such reference per selected row. Read those IDs from context, never guess them from the label. Keep them in tool calls; do not repeat hidden IDs in user-facing replies. Legacy messages containing `[action:...] [attempt:...]` remain valid references to their existing attempts. The button submits through the existing composer pipeline (and can queue while the thread is busy). Do not ask the user to type another confirmation.

1. Claim the exact attempt before acting:
   `bb action-cards claim esc-1 --attempt <uuid>`
2. Treat the returned attempt’s `note` (the user’s comment) as part of the approval and follow it. If it conflicts with the chosen action (for example “Yes, but don’t send yet”), do not perform that action. Report `--outcome failed --retryable` with a message saying what you held and why, such as “Held the reply; not sent yet.” Do not report success for an action you held. Tell the user to use Edit draft or Choose again when they’re ready; Retry repeats the same comment. Do not discard a comment on retry or reconciliation. Use the returned content, especially its latest saved `draft`, `to`, `cc`, `bcc`, and `subject`. Do not use the initial draft from chat or memory. The card locks editing during the action.
3. Execute only the claimed action using the user's connected tool. Send sends the reply; Save to Gmail drafts creates/updates the Gmail draft without sending. Yes performs the stated consequence; No declines it. Skip requires no external action; report `Skipped` immediately. Cards no longer offer Later; do not offer or suggest it. A legacy `later` attempt still needs no external action; report `Later`.
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

## Comments with a choice

Every ready card has a Comment button (speech bubble) beside its question; a table row shows its comment field whenever the row is open. The field sits under the card's context, above the answer buttons. Choosing an action while the field has text submits the comment visibly after the mention pill and includes it as `note` in hidden context; the primary button shows a small speech bubble when a comment goes along. The comment is saved on the attempt as `note`, returned by claim/get, and shown under the result. Empty comments keep the usual behavior; Escape or clearing the field dismisses it. Sending a table carries each row’s own comment.

## Comment without choosing

When the comment field contains text, **Ask** sends just the comment as a follow-up question with a speech-bubble pill. Hidden context contains `intent: comment`, `note`, `commentId`, `threadId`, and `itemId`; it has no action or attempt. This is not approval. The card stays ready, its choices remain usable, and other rows in the same table keep their staged answers.

Answer the follow-up **on the card** so the answer sits next to the decision it is about:

```sh
bb action-cards answer rotate-key --comment <commentId> --message-stdin <<'MD'
Three CI secrets use it: **deploy**, **e2e**, and **nightly**. I rotate all three in the same step.
MD
```

The answer renders as Markdown under the question on the card; `bb action-cards get` returns the card's `followUps`. Keep your chat reply to one short line (or none), and do not re-emit the table. If the follow-up asks for a change, read the latest item and revise the **same** Reply draft using its revision. Decide question/consequence updates are not supported; explain the requested change instead of creating a replacement card or acting.

Comment replaces Reply’s Ask for changes button. Existing `request-changes` messages remain valid requests to revise, never approval. For a Reply change:

```sh
bb action-cards get esc-1
bb action-cards revise esc-1 --revision 2 --draft-stdin <<'TEXT'
Hello,

Could you confirm when my refund check was mailed?
TEXT
```

A revision conflict means the user edited the draft meanwhile. Re-read and incorporate their edit rather than overwriting it. A revision is not approval to send. The original card refreshes in place; do not create another card for the revised draft. Failed actions must be reconciled or safely reopened before editing. Skipped (and legacy Later) cards offer Resume beside View. Safe failures offer Edit draft or Choose again there too.

## Action log

Point users to **Action log** in the sidebar for waiting cards and past choices across threads. Read the log with `bb action-cards log --json`, or add `--thread <id>` to scope it to one thread.

## Limits

Reply, Decide, and Choice cards, inline, plus the Action log. No Gmail credentials, Gmail transport, autonomous send, scheduled reminder, or Undo is included. Agents supply the connected service and must report outcomes. The editor is a small autosaving plain-text field; it does not implement Docs rich text or proposal acceptance. Docs' private editor cannot be embedded or flushed safely by another plugin through the public SDK.
