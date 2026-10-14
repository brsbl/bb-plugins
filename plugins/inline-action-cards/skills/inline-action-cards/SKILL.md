---
name: inline-action-cards
description: Use whenever you need a user decision or approval in any thread, including merges or shipping, sending emails, applying changes, switching settings, or choosing between options. Create inline action cards instead of prose confirmation questions, handle card clicks, and report outcomes on the cards.
---

# Inline Decisions

Whenever you need the user's decision or approval, create an action card instead of asking in prose. This applies in any thread: merge or ship a prepared PR, send an email, apply a proposed change, switch a setting, or choose between two options. Put the proposed action and tradeoffs in the card itself so someone switching from another thread can decide without reading earlier messages. Existing authorization still applies; do not add a new approval step to work the user already authorized.

Use a single card for one important item. When the user picks one of several options, use one choice card, never a table of yes/no rows. When you need three or more decisions at once, put them all in **one table** (a decision sheet, up to 20 rows of any type) instead of several cards or messages: the user answers every row, then sends all answers together. Create the item first, then emit the returned `::action{id="..."}` directive on its own line, outside code fences. Cards appear only inside assistant messages. IDs are unique within the owning thread; never reuse one for another email or decision. Use concise, task-specific IDs.

**Don't nag about waiting cards.** A waiting card is your open question, and the user may simply not have answered yet. By default, don't mention it at all: it stays in the thread and in the Decision log. Reshare a card only when: (1) your next step is blocked on that answer, (2) the user asks about it, or (3) the card changed (for example a revised draft). To reshare, emit the same `::action{id="..."}` (or `::actions{id="..."}`) directive again; the same live card renders in both places, so reuse the ID and don't create a new item. Reshare a card at most once per user reply, and never in two of your messages in a row without the user replying in between. Don't write "the card above is still waiting on your choice."

All item data and drafts live in the plugin's SQLite storage. Never put them in thread storage. CLI JSON travels to the server; local paths do not.

## Create

Run from the owning thread (or add `--thread <id>`). `--item-stdin` avoids shell escaping and supports multiline text:

```sh
bb action-cards create esc-1 --item-stdin <<'JSON'
{"type":"reply","summary":"Follow up on the missing billing refund","subject":"Re: Refund check","to":["billing@example.com"],"cc":[],"bcc":[],"original":{"from":"Billing team <billing@example.com>","date":"Jun 8","body":"We mailed your refund on June 8."},"draft":"Hello,\n\nCould you confirm the status of my refund check?\n\nThank you.","context":"- **What:** a follow-up to Billing about your missing refund check.\n- **Why now:** Billing says it mailed the check; you haven't received it.\n- **Options:** ask for an update now, or keep it as a Gmail draft.\n- **Recommendation:** send, to find out where the check is.\n- **Next:** I send this exact text or save it to Gmail, then report here."}
JSON
bb action-cards create receipts-1 --item-stdin <<'JSON'
{"type":"decide","question":"File DigitalOcean under Receipts?","consequence":"Add the Receipts label to this invoice; it stays in your inbox.","context":"- **What:** your DigitalOcean invoice, still in the inbox.\n- **Why now:** it came up during inbox review.\n- **Options:** label it for easier lookup, or leave it untouched.\n- **Recommendation:** label it, so it's easy to find later.\n- **Next:** I apply the label or leave it, then report here."}
JSON
```

Use the actual recipients and show every To/Cc/Bcc recipient. Include enough original context to understand the reply. A Reply draft is plain text; Markdown characters remain literal when sent. For a Decide card, state the exact consequence of Yes. No means do not perform the proposed action. Never invent approval from the presence of a card.

To approve or decline one proposed action, use Decide. A No click declines the proposed action; it does not approve a different side effect. Use `yesLabel`/`noLabel` to make the choice clear while preserving those meanings. When the user picks between alternatives, use a choice card (below).

```sh
bb action-cards create merge-pr --item-stdin <<'JSON'
{"type":"decide","question":"Merge the reviewed PR?","consequence":"Squash-merge PR #123 into main at the reviewed head.","yesLabel":"Merge","noLabel":"Keep open","context":"- **What:** Workflow Inbox fix that keeps your draft when you submit a decision.\n- **Why now:** the reviewed head is ready; [CI, review and QA](https://example.com/checks) passed.\n- **Options:** release the fix, or keep the current release installed.\n- **Recommendation:** merge; it removes a draft-loss bug.\n- **Next:** I merge that head and watch release CI, or leave the PR open."}
JSON
```

Replace example identifiers with the actual target and include the exact reviewed head when approval depends on a revision. After a click, claim and report the attempt using the flow below, whatever service or setting the action affects.

## Give the decision its context

**Every card needs a `context` brief**, including Reply cards and each row in a decision sheet. Assume the user just switched from another thread. A PR number, “as discussed,” a recommendation tag, a link, or prose above the card is not enough. When bringing another agent's decision to a lead, name that agent or org in the brief and preserve its concrete proposal.

Write the brief as **five short lines**, a Markdown list with one item per part. Each line is a fragment of about 15 words or fewer, so the whole brief is about 50–80 words:

1. **What this is:** name the project or plugin and describe the proposal in plain words.
2. **Why it's on you now:** name who asked, what triggered this, or what is waiting for the answer.
3. **Options and what each does:** explain every offered answer, including declining or keeping the current state. Name the material tradeoff or risk.
4. **Recommendation and why:** state the preferred answer and its reason. If there is no clear preference, say why.
5. **What happens next:** say what the agent will do after **each** answer. Declining an action never authorizes a different side effect.

Keep `question` and `consequence` short, and don't restate them, the option labels or hints in the brief. Don't paste reports, logs, tables, diffs or check lists; link them instead. The only exception is exact text the user must approve. If the brief doesn't fit in five short lines, the decision is too big: split it into smaller decisions, or link a note that holds the detail.

`context` is Markdown (up to 20,000 characters), rendered like a chat message, with lists, code, tables and links. The CLI warns on stderr when it is absent, but still creates the card for compatibility. That is a warning to improve your next card, not permission to omit the brief. Do not recreate an existing card just to silence the warning.

Examples adapted from real cards; details below are illustrative:

**Bad:** “Approve the Ops Tools goals draft?” No brief. The user had to ask “what is this”.

**Good:** question “Use this direction for Ops Tools?”; consequence “Set the direction for the tooling plan.”

> - **What:** Ops Tools' goals for the internal plugins agent teams share.
> - **Why now:** the planning lead needs each team's direction before finalizing.
> - **Options:** whole workflows first, or hold the [draft](https://example.com/draft) for revision.
> - **Recommendation:** use it; it fixes cross-team handoffs, not one plugin.
> - **Next:** I finish the draft for review, or revise it from your note.

**Bad:** “Merge #123?” with context “CI green, review and QA passed.” This names checks but never says what the product change does.

**Good:** question “Merge the Workflow Inbox fix?”; consequence “Merge the reviewed head into main.”

> - **What:** Workflow Inbox keeps your unfinished message when you submit a decision.
> - **Why now:** you approved the preview; checks passed on [this head](https://example.com/head).
> - **Options:** release the fix now, or keep the current release installed.
> - **Recommendation:** merge; decisions stop discarding drafts.
> - **Next:** I merge, watch release CI and install it; or leave the PR open.

Replace illustrative claims with verified facts and include the exact head when approval depends on a revision. Never claim a gate passed just because an example says so.

Optional evidence:

- `media`: up to 4 images, each `{"src","alt","caption"?}`. `src` is an `https://` URL or an **absolute path** to a `.png`, `.jpg`, `.gif`, `.webp`, `.avif` or `.svg` file on the thread's host. Relative paths, `http:`, and `data:` URLs are rejected.
- Decide cards accept `recommended: "yes" | "no"`; Choice cards accept `recommended: "<option id>"`. This tags the option without preselecting it; still explain why in the brief.

## Choose one option

A choice card asks one question and lists 2–6 options as a compact single-select list. The user picks one and presses Submit. Give each option a stable `id`, a short `label` (80 characters at most; aim for a few words), and an optional one-line `hint`; the card truncates long hints. Set `recommended` to an option id to tag it; nothing is ever preselected. Add `consequence` only when it applies to every option.

```sh
bb action-cards create account-setup --item-stdin <<'JSON'
{"type":"choice","question":"Which account setup should bb use?","recommended":"multi","options":[{"id":"single","label":"UserSingle","hint":"One account for every thread"},{"id":"multi","label":"UserMultiple","hint":"Pick an account per thread"},{"id":"pool","label":"Pool","hint":"Rotate accounts by quota"}],"context":"- **What:** which account new bb threads run on.\n- **Why now:** you asked to pick a default for new threads.\n- **Options:** simplest setup, per-thread control, or automatic quota rotation.\n- **Recommendation:** UserMultiple, for explicit control without quota rotation.\n- **Next:** I apply your pick to new threads; existing threads keep theirs."}
JSON
```

Explain tradeoffs in the card’s `context` brief rather than relying on hints or messages above it. A click carries `action: "choose"` and `choice: {"id","label"}` in its hidden context; act on that option only. Claim and report like Decide, for example `--message 'UserMultiple chosen'`. Comments work as on other cards. Choice cards can also be rows in a table.

## Group many decisions in a table (decision sheet)

Create the items first, then create a table that references those same IDs. Emit its returned `::actions{id="..."}` directive on its own line. Rows keep their order as results arrive. Order rows by importance and keep each `question` scannable.

Every card renders as a plain form. It names the source thread, then shows the question, `consequence`, and the full `context` brief. The answer is a radio group (Decide shows your Yes/No labels, Choice shows its options, Reply shows Send / Save to Gmail drafts under the full draft), followed by **Add note** and a **Submit** button. A table is one form with one Submit at the end: it sends one message with a mention per answered row, each with its own attempt and note. Rows the user left unanswered send nothing, so don't assume an answer for them. Keep `consequence` short and put long detail in `context`.

```sh
bb action-cards create news-1 --item-stdin <<'JSON'
{"type":"decide","question":"DigitalOcean · September newsletter","consequence":"Archive this newsletter from the inbox.","yesLabel":"Archive","noLabel":"Keep","actionKey":"archive-email","context":"- **What:** DigitalOcean's September newsletter, with no pending task.\n- **Why now:** it came up during inbox review.\n- **Options:** clear it from the inbox (still searchable), or leave it.\n- **Recommendation:** archive; it's finished reading.\n- **Next:** I archive it or leave it, then report here."}
JSON
# Create news-2 and news-3 for the other messages, then:
bb action-cards create-table newsletters --table-stdin <<'JSON'
{"title":"3 newsletters","ids":["news-1","news-2","news-3"]}
JSON
```

Tables accept up to 20 existing items from the same thread, of any type. For mixed rows, include Reply, Decide, and Choice IDs in the same list. A Decide item can supply `yesLabel`/`noLabel` for precise verbs. They still map to the existing `yes`/`no` actions. Use `actionKey` only when rows perform the **same operation** (for example `archive-email`); matching keys and affirmative labels enable Archive all. Do not give archive, delete, or differently scoped actions the same key. The bulk button stages Yes on the currently ready rows; the user still presses Send. Failed rows require their own retry. Each sent row gets its own attempt and outcome, so partial failures remain visible.

When a sheet message arrives, handle every reference in it: claim each attempt, act on it, and report each result on its own row before replying. Summarize the batch in one short message (what succeeded, what failed and why); don't restate each row.

## Handle a click

A click submits readable text such as “Send billing follow-up” with a named mention pill. Its user-hidden context contains `kind: inline-action-card`, `threadId`, `itemId`, `attemptId`, `action`, and `intent`, plus `note` when the user attached a comment. `approved-action` is approval for exactly that attempt. A bulk message contains one such reference per selected row. Read those IDs from context, never guess them from the label. Keep them in tool calls; do not repeat hidden IDs in user-facing replies. Legacy messages containing `[action:...] [attempt:...]` remain valid references to their existing attempts. The button submits its own message without changing the composer draft, and can queue while the thread is busy. Do not ask the user to type another confirmation.

1. Claim the exact attempt before acting:
   `bb action-cards claim esc-1 --attempt <uuid>`
2. Treat the returned attempt’s `note` (the user’s comment) as part of the approval and follow it. If it conflicts with the chosen action (for example “Yes, but don’t send yet”), do not perform that action. Report `--outcome failed --retryable` with a message saying what you held and why, such as “Held the reply; not sent yet.” Do not report success for an action you held. Tell the user to use Edit draft or Choose again when they’re ready; Retry repeats the same comment. Do not discard a comment on retry or reconciliation. Use the returned content, especially its latest saved `draft`, `to`, `cc`, `bcc`, and `subject`. Do not use the initial draft from chat or memory. The card locks editing during the action.
3. Execute only the claimed action using the user's connected tool. Send sends the reply; Save to Gmail drafts creates/updates the Gmail draft without sending. Yes performs the stated consequence; No declines it. Skip requires no external action; report `Skipped` immediately. Cards no longer offer Later; do not offer or suggest it. A legacy `later` attempt still needs no external action; report `Later`.
4. Report the result on the same card:

```sh
bb action-cards report esc-1 --attempt <uuid> --outcome succeeded --message 'Sent'
bb action-cards report receipts-1 --attempt <uuid> --outcome succeeded --message 'Added to Receipts'
```

The card collapses to a result line and adds the local time. Use “Sent to Billing team”, “Archived”, or “Filed under Receipts” as appropriate. The draft stays reachable through View. Do not promise Undo: this plugin has no reversible service action. Put useful result detail in the message when needed. Read persisted state any time with `bb action-cards get esc-1`.

If bb could not deliver a click (for example it refused a competing turn), the card notices once the thread is idle with nothing queued and shows “Not sent” with Resend. Resend reuses the same attempt ID, so claim it as usual; it can never be claimed twice.

A rejected claim is not approval to try again. It means the attempt is stale, already claimed, or finished. Read its state and reconcile the external service result; never repeat the side effect. The claim is durable across reloads. Retain the external service's receipt in the thread when available. This prevents duplicate execution from repeated clicks/messages but cannot make external APIs exactly-once.

## Failure and retry

Report a short, user-facing failure with recovery in the same place. Mark it retryable only after verifying the external action did **not** happen:

```sh
bb action-cards report esc-1 --attempt <uuid> --outcome failed --message 'Gmail is disconnected. Reconnect it, then retry.' --retryable
```

The card shows Retry. A new click creates a new attempt, which must be claimed again. If a timeout or crash leaves the outcome unknown, omit `--retryable`. The card offers Check outcome; inspect the service before reporting success or safe failure. Do not send again to discover whether the earlier send worked. A message with `check-outcome` context (or a legacy `Check outcome:` message) authorizes reconciliation only, not repeating the action. A pending Resend request uses the original attempt ID, so it cannot be claimed twice.

## Comments with a choice

**Add note** opens the user's note under the answer; they can cancel it or save it before submitting. When Submit carries an answer, the note goes after the mention pill and is included as `note` in hidden context.

## Comment without choosing

When the user writes a note but picks no answer, Submit sends just the note as a follow-up question, with a speech-bubble pill. Hidden context contains `intent: comment`, `note`, `commentId`, `threadId`, and `itemId`; it has no action or attempt. A comment never approves the card's own action: never claim or create an attempt for it. Treat it as a chat message from the user. Answer questions, and follow a clear instruction only as you would the same instruction typed in chat, under the user's existing authorization. If it is ambiguous, or the card's own action needs approval, ask the user to submit an answer on the card. The card stays ready, and other rows in the same table keep their answers.

Answer the follow-up **on the card** so the answer sits next to the decision it is about:

```sh
bb action-cards answer rotate-key --comment <commentId> --message-stdin <<'MD'
Three CI secrets use it: **deploy**, **e2e**, and **nightly**. I rotate all three in the same step.
MD
```

When what you did makes the card moot, settle it so it stops waiting. For example, the user commented “close this” on a Close PR card and you closed the PR, or they withdrew the question:

```sh
bb action-cards resolve pr-412 --message 'Closed the PR'
```

`resolve` works on an unanswered card or a retryable failure that is now superseded. For example, use `bb action-cards resolve old-merge --message 'Superseded by the current merge decision'` after an old merge safely failed. It records no new approval, retains the failed attempt for history, and removes the card from waiting. Never use it to hide an in-progress or unknown outcome: reconcile and report that claimed attempt first.

The answer renders as Markdown under the question on the card; `bb action-cards get` returns the card's `followUps`. Keep your chat reply to one short line (or none), and do not re-emit the table. If the follow-up asks for a change, read the latest item and revise the **same** Reply draft using its revision. Decide question/consequence updates are not supported; explain the requested change instead of creating a replacement card.

Comment replaces Reply’s Ask for changes button. Existing `request-changes` messages remain valid requests to revise, never approval. For a Reply change:

```sh
bb action-cards get esc-1
bb action-cards revise esc-1 --revision 2 --draft-stdin <<'TEXT'
Hello,

Could you confirm when my refund check was mailed?
TEXT
```

A revision conflict means the user edited the draft meanwhile. Re-read and incorporate their edit rather than overwriting it. A revision is not approval to send. The original card refreshes in place; do not create another card for the revised draft. Failed actions must be reconciled or safely reopened before editing. Skipped (and legacy Later) cards offer Resume beside View. Safe failures offer Edit draft or Choose again there too.

## Decision log

Point users to **Decision log** in the sidebar for waiting cards and past choices across threads. Read the log with `bb action-cards log --json`, or add `--thread <id>` to scope it to one thread.

## Limits

Reply, Decide, and Choice cards, inline, plus the Decision log. No Gmail credentials, Gmail transport, autonomous send, scheduled reminder, or Undo is included. Agents supply the connected service and must report outcomes. The editor is a small autosaving plain-text field; it does not implement Docs rich text or proposal acceptance. Docs' private editor cannot be embedded or flushed safely by another plugin through the public SDK.
