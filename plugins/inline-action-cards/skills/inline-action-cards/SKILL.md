---
name: inline-action-cards
description: Use before asking the user anything, in any thread. It decides whether to ask at all (routine steps and tasks agents can do never get a card) and how to ask when the user must decide, approve or answer, such as merges or releases, sending or publishing in their name, spending money, changing settings, choosing between options, reviewing a spec or document, or a plain question. Create decision cards or asks in Waiting on you instead of prose questions, handle answers, and report outcomes on the cards.
---

# Inline Decisions

When a thread needs a decision only the user can make, create an action card instead of asking in prose. Make the card answerable cold, in its own words: the question says what is being decided and the option labels say what each choice does. Existing authorization still applies; never add an approval step to work the user already authorized, and never invent approval from the presence of a card.

## Ask only what the user must decide

Every card or ask costs the user attention, so most work needs neither. Before you create one, check the user's instructions (AGENTS.md, project instructions, their skills and memory). If they already describe the step, or it is a routine part of getting the work done, do it and mention it in one line afterward only if it matters.

Don't ask about the normal working process:

- Running or rerunning CI, tests, code review, QA or end-to-end checks, including a retry after a fix or a flaky failure.
- Fixing what those checks require, then checking again, including follow-up fixes for problems you found.
- Opening, updating or rebasing a PR, resolving its conflicts, updating its branch, or filing the issue that tracks your work.
- Starting, restarting or retrying your own dev servers, workers and QA runs, or switching a worker's model after a capacity error.
- Cleaning up what you created: branches, worktrees, temporary files, QA data, screenshots and finished worker threads.
- Coordinating your own workers and sub-threads. Messaging other threads still follows bb's rules: only when the user asked, or to answer a thread that messaged you.
- The order and priority of your own work, and names, file locations and implementation details that have a sensible default.
- The next step of work the user or your lead already approved.
- Facts you can find yourself. Check their records, accounts you can reach, notes and thread history before asking.

Ask when the decision is the user's:

- Sending, posting, publishing or listing anything in their name. Propose it in the channel and thread where that conversation already lives.
- A merge or release their process reserves for them, once the checks that process requires have passed.
- Spending money, or changing production, their accounts, their data or their settings.
- Breaking something already shipped, or starting new scope nobody approved.
- A real product, design or strategy choice with no clear default.

When unsure and the step is reversible, take the default and say what you chose in one line.

**Reviews aren't cards.** If deciding means reading an artifact carefully (a spec, document, design, copy or a long draft), a one-click card invites approval without review. Hand off the artifact where the user reviews it (a pinned note, the document itself, a PR) and ask for the review in one plain line, as an ask (below). Act on their review wherever they give it. A card fits only after the review, when what remains is a glance-sized choice, such as publishing the reviewed version. A short email draft shown in full on a Reply card is fine; the card is the review.

**Do the work; the user approves.** Agents do every task they can. Before handing the user anything to do, try every route: browser automation in their signed-in browser, CLIs and APIs, plugins, and other agents. If agents still can't do it, work on removing the blocker: fix its cause (such as a sign-in that keeps expiring), or ask for the tool that's missing. Loop the user in on what would unblock agents (access to grant, a permission, a tool to approve), not on doing the task. Hand the user a step only when no agent could ever take it (their own sign-in or a legal signature) or the work can't wait for the fix. Then make it an approval if you can, or else the single smallest step, with everything else done and the exact place to take it.

**One decision per message.** Bring only the decision that blocks your next step right now. Hold the rest, and bring the next one after the user answers. Use a single card for it; when the user picks one of several options, use one choice card, never a table of yes/no rows. A table (decision sheet) is the exception: at most 3 tightly linked rows that only make sense answered together, never a way to clear a backlog.

## Keep the card small and plain

The user decides from the card alone, at a glance. Each part has one job:

- **`question`** says what is being decided, specifically enough to answer cold: name the thing, not “as discussed” or a bare PR number.
- **Option labels** say what each choice does (`yesLabel`/`noLabel`, or a Choice option's `label` and one-line `hint`). Put consequences there, not in prose.
- **`recommended`** tags the pick. Don't argue for it in text.
- **`context`** is optional: at most **one plain sentence of 25 words or fewer**, for the one fact the question and labels can't carry (what started this, a deadline, a blocker, who asked). No Markdown labels, lists or “What/Why/Next” sections. Link evidence (checks, a report, a diff) instead of pasting it. Exact text the user must approve goes in a Reply draft, not here.

If a card needs more than that, the decision is too big: split it, or, when the detail is an artifact to read, ask for a review instead (see “Reviews aren't cards”). The CLI warns (it still creates the card) when `context` runs past about 40 words or uses list or label patterns; rewrite the next card, don't recreate this one.

**Start from what the user knows.** If the situation is new to them, the question or `context` says what happened and who asked; never refer to an event, request or thing they haven't heard of as if they had.

**Show options they must compare.** When options differ in how they look, attach each one as an image in `media` (up to 4) and match the labels to the images. When they differ in numbers such as prices, dates or sizes, put each option's numbers in its hint. If the options can't be compared at a glance, the choice isn't ready for a card: build the comparison first, then ask for a review.

**Check the facts the choice rests on.** Verify details such as who is involved, dates and amounts against the source before proposing. If one is unknown, ask that plain question first.

Bad cards:

- “Run the code review on the Live Markdown stack?” A routine step; just do it.
- “Approve the claim lines on the comparison page?” It needs a careful read, so ask for a review instead.
- “Cancel the stray trial yourself, then reply done.” An agent with browser access can do it.
- “Unlist the theme after the takedown request?” when the user has never heard of the request.
- “Which type direction should we use?” with four names and no images of them.
- “Move the trip two days later?” with no fares for either option and the wrong number of travelers.
- “Approve?” with a five-bullet What/Why now/Options/Recommendation/Next brief: busy, and the user doesn't read it.

**Good (fictional example):** question “Use the Moonbase Garden Club’s draft as the planting plan?”; labels “Use this plan” / “Revise it first”; `recommended: "yes"`; context “The club needs the plan by Friday.”

Every example in this skill is illustrative. Use verified facts, include the exact head when approval depends on a revision, and never claim a gate passed because an example says so.

## Share cards at the end of your turn

Cards appear only inside assistant messages. bb rolls up the messages and tool calls in the middle of a turn, so a card shared there is folded away where the user may never see it. Create every item with tool calls first, then emit each returned `::action{id="..."}` (or `::actions{id="..."}`) directive once, on its own line outside code fences, as the last thing in the turn's final message. Don't put a directive in an earlier message of the turn, and don't follow it with more tool calls or text.

**Don't nag about waiting cards.** A waiting card is your open question, and the user may simply not have answered yet. By default, don't mention it at all: it stays in the thread and in the Decision log. Reshare a card only when: (1) your next step is blocked on that answer, (2) the user asks about it, or (3) the card changed (for example a revised draft). To reshare, emit the same `::action{id="..."}` (or `::actions{id="..."}`) directive again; the same live card renders in both places, so reuse the ID and don't create a new item. Reshare a card at most once per user reply, and never in two of your messages in a row without the user replying in between. Don't write "the card above is still waiting on your choice."

## Waiting on you

Every unanswered card and ask appears in **Waiting on you**, a drawer above the prompt box of the thread that owns it. It lists only that thread's items, urgent first and then oldest, and is absent when the thread has none. The user answers there. In the timeline, an unanswered card is one line that opens it in the drawer, and an answered card shows its result line. You still emit the directive so the thread records the decision and its result.

Creating an item whose question matches an open one in the same thread, or whose ID adds a `-v2`/`-v3` style suffix to it, marks the older one superseded; the CLI says which. Revise by creating the new version, never by adding a second copy, and keep to one decision at a time. Before you add an item, check what is already waiting in your thread (`bb action-cards log --thread <id>`). If the new question changes or replaces an open one (a new amount, a new head, a narrower ask), pass `--replaces <old-id>` to `create` or `ask` so the old one is marked superseded; if the old one no longer matters, resolve it. The CLI warns when a new item overlaps an open one; act on that warning instead of leaving both waiting.

Mark something urgent only when work is blocked on it now: add `"priority":"urgent"` to the item JSON (or `"low"` for anything that can wait).

## Dismissed items

The user can dismiss any waiting card or ask from Waiting on you or the Decision log, with an optional reason. A dismissal approves nothing and the item is already settled; its thread gets a message like “Dismissed: <pill> · reason” with `intent: dismissed` in hidden context. Don't claim, report, resolve or act on it. Stop waiting and carry on without it. **Never ask a dismissed question again**, as a card, an ask or in prose, unless something material changed; if it did, say what changed in the new item's brief. `bb action-cards log --thread <id> --json` shows dismissed items with `dismissed` set.

## Ask a plain question

The same bar applies to asks. The same bar applies to asks. Anything waiting on the user that isn't a card goes in Waiting on you as an ask, never only in prose. Leads add an ask for every question waiting on the user and resolve it as soon as the user answers it anywhere else:

```sh
bb action-cards ask feedback-channel "Which channel should the weekly feedback report post to?" --urgent
bb action-cards resolve feedback-channel --message 'Answered in chat: #feedback'
```

`--context` adds at most one plain sentence (see below). The user's answer arrives as a message like “Answer <pill> — their words”, with `intent: answer` in hidden context. The ask is already settled: don't claim, report or resolve it; act on the answer as you would the same reply typed in chat. An ask needs no directive.

All item data and drafts live in the plugin's SQLite storage. Never put them in thread storage. CLI JSON travels to the server; local paths do not.

## Create

Run from the owning thread (or add `--thread <id>`). IDs are unique within the owning thread; use concise, task-specific IDs and never reuse one for another email or decision. `--item-stdin` avoids shell escaping and supports multiline text:

```sh
bb action-cards create esc-1 --item-stdin <<'JSON'
{"type":"reply","summary":"Follow up on the missing billing refund","subject":"Re: Refund check","to":["billing@example.com"],"cc":[],"bcc":[],"original":{"from":"Billing team <billing@example.com>","date":"Jun 8","body":"We mailed your refund on June 8."},"draft":"Hello,\n\nCould you confirm the status of my refund check?\n\nThank you.","context":"Billing says it mailed the check on June 8; it hasn't arrived."}
JSON
bb action-cards create receipts-1 --item-stdin <<'JSON'
{"type":"decide","question":"File the DigitalOcean invoice under Receipts?","consequence":"Add the Receipts label; it stays in your inbox.","yesLabel":"Add Receipts label","noLabel":"Leave it","recommended":"yes"}
JSON
```

Use the actual recipients and show every To/Cc/Bcc recipient. Include enough original context to understand the reply. A Reply draft is plain text; Markdown characters remain literal when sent. For a Decide card, state the exact consequence of Yes. No means do not perform the proposed action.

To approve or decline one proposed action, use Decide. A No click declines the proposed action; it does not approve a different side effect. Use `yesLabel`/`noLabel` to make the choice clear while preserving those meanings. When the user picks between alternatives, use a choice card (below).

```sh
bb action-cards create merge-pr --item-stdin <<'JSON'
{"type":"decide","question":"Merge the Workflow Inbox draft-loss fix (#123)?","consequence":"Squash-merge the reviewed head and release it.","yesLabel":"Merge and release","noLabel":"Keep the PR open","recommended":"yes","context":"[CI, review and QA](https://example.com/checks) passed on the reviewed head."}
JSON
```

After a click, claim and report the attempt using the flow below, whatever service or setting the action affects.

Optional evidence:

- `media`: up to 4 images, each `{"src","alt","caption"?}`. `src` is an `https://` URL or an **absolute path** to a `.png`, `.jpg`, `.gif`, `.webp`, `.avif` or `.svg` file on the thread's host. Relative paths, `http:`, and `data:` URLs are rejected.
- Decide cards accept `recommended: "yes" | "no"`; Choice cards accept `recommended: "<option id>"`. This tags the option without preselecting it.

## Choose one option

A choice card asks one question and lists 2–6 options as a compact single-select list. The user picks one and presses Submit. Give each option a stable `id`, a short `label` (80 characters at most; aim for a few words), and an optional one-line `hint`; the card truncates long hints. Set `recommended` to an option id to tag it; nothing is ever preselected. Add `consequence` only when it applies to every option.

```sh
bb action-cards create account-setup --item-stdin <<'JSON'
{"type":"choice","question":"Which account should new bb threads use?","recommended":"multi","options":[{"id":"single","label":"UserSingle","hint":"One account for every thread"},{"id":"multi","label":"UserMultiple","hint":"Pick an account per thread"},{"id":"pool","label":"Pool","hint":"Rotate accounts by quota"}],"context":"Existing threads keep their current account."}
JSON
```

Put each option's tradeoff in its hint. A click carries `action: "choose"` and `choice: {"id","label"}` in its hidden context; act on that option only. Claim and report like Decide, for example `--message 'UserMultiple chosen'`. Comments work as on other cards. Choice cards can also be rows in a table.

## Link up to 3 decisions in a table (decision sheet)

Use a table only for at most 3 decisions that only make sense answered together, such as an action and the announcement that depends on it. Never use one to batch unrelated or backlog decisions; bring those one at a time. Create the items first, then create a table that references those same IDs. Emit its returned `::actions{id="..."}` directive on its own line. Rows keep their order as results arrive. Order rows by importance and keep each `question` scannable.

In Waiting on you, each card opens as a form: the question with its one-line context, then a radio group (Decide shows your Yes/No labels, Choice shows its options, Reply shows Send / Save to Gmail drafts under the full draft) and **Submit**. Each table row is its own item there and is answered on its own, so don't assume an answer for rows the user hasn't reached. Keep `consequence` to one short line.

```sh
bb action-cards create price-change --item-stdin <<'JSON'
{"type":"decide","question":"Raise the Team plan to $12 for new signups?","consequence":"New signups pay $12 from Monday.","yesLabel":"Raise to $12","noLabel":"Keep $10","recommended":"yes","context":"Billing needs the answer by Friday; see the [pricing review](https://example.com/review)."}
JSON
bb action-cards create price-email --item-stdin <<'JSON'
{"type":"decide","question":"Email Team admins that current customers keep $10?","consequence":"Send the linked notice on Monday.","yesLabel":"Send the notice","noLabel":"Don't email","recommended":"yes","context":"Uses the [notice](https://example.com/notice) you reviewed yesterday."}
JSON
bb action-cards create-table team-price --table-stdin <<'JSON'
{"title":"Team plan price","ids":["price-change","price-email"]}
JSON
```

Tables take at most 3 existing items from the same thread, of any type. For mixed rows, include Reply, Decide, and Choice IDs in the same list. A Decide item can supply `yesLabel`/`noLabel` for precise verbs. They still map to the existing `yes`/`no` actions. Use `actionKey` only when rows perform the **same operation** (for example `archive-email`); matching keys and affirmative labels enable Archive all. Do not give archive, delete, or differently scoped actions the same key. The bulk button stages Yes on the currently ready rows; the user still presses Send. Failed rows require their own retry. Each sent row gets its own attempt and outcome, so partial failures remain visible.

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

## Notes and comments on older cards

Waiting on you has no note field. Answers from older card versions can still carry a `note` after the mention pill; treat it as part of the approval. A note an older card sent with no answer picked arrives on its own as a follow-up question, with a speech-bubble pill. Hidden context contains `intent: comment`, `note`, `commentId`, `threadId`, and `itemId`; it has no action or attempt. A comment never approves the card's own action: never claim or create an attempt for it. Treat it as a chat message from the user. Answer questions, and follow a clear instruction only as you would the same instruction typed in chat, under the user's existing authorization. If it is ambiguous, or the card's own action needs approval, ask the user to answer it in Waiting on you. The card stays ready.

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

Point users to **Waiting on you** above the prompt box for open items, and to **Decision log** in the sidebar for past choices across threads. Read the log with `bb action-cards log --json`, or add `--thread <id>` to scope it to one thread.

## Limits

Reply, Decide, Choice and Ask items, answered in Waiting on you, plus the Decision log. No Gmail credentials, Gmail transport, autonomous send, scheduled reminder, or Undo is included. Agents supply the connected service and must report outcomes. The editor is a small autosaving plain-text field; it does not implement Docs rich text or proposal acceptance. Docs' private editor cannot be embedded or flushed safely by another plugin through the public SDK.
