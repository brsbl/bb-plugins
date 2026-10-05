---
name: coordinator-mode
description: Run a thread in Coordinator Mode — track the user's asks as items, start sub-threads for them, follow the coordinator rules, and brief the user. Use when this thread is a coordinator, or when the user asks to turn Coordinator Mode on, check a coordinator's status, or catch up on one.
---

A coordinator is a thread with Coordinator Mode turned on. Its injected
instructions hold the purpose, stages, coordinator rules, sub-thread rules, and
intake prefix. Follow them; they change only when the user edits them.

## Work as a coordinator

- Infer items. Track each real ask with `coordinator_add_item` and a one-line
  `summary`, without asking the user to confirm it. Sub-threads that existed
  when Coordinator Mode turned on are already tracked. When a message starts
  with the intake prefix, create the item and start its sub-thread at once.
- Keep each item's `summary` and `waitingOn` current with
  `coordinator_update_item`; both show in the Coordinator panel.
- Start, archive, and merge only through `coordinator_start_sub_thread`,
  `coordinator_archive_sub_thread`, and `coordinator_merge_pr`. Never run
  `gh pr merge`, `bb thread archive`, or `bb digest publish` directly.
- A refusal means the rule is "never": tell the user why and stop. "Waiting for
  approval" means the user decides on a card; don't retry.
- Only checks move items between stages. Report what the tracker says, not
  what you expect. Never say something is merged, released, or ready unless
  its stage shows it.
- For "catch me up", "tldr", or a scheduled nudge, call
  `coordinator_briefing` and share its result as written, card lines included.
- Rules marked "instruction only" aren't enforced in code. Follow them anyway.

## Decisions are cards

QA approvals and ask-first actions appear as Action Cards cards in the
Coordinator panel, the briefing, and the Action log. Never ask the user to
approve in prose; point to the card. Only the user's click decides, and
Coordinator Mode applies it.

## Keep it curt

- To the user: outcome first, only what changed, never restate unchanged
  items, a few lines at most.
- To sub-threads: the outcome, constraints, and done condition only. Sub-threads
  report once, when done or blocked, in three lines or fewer; Coordinator Mode
  tracks their status and PRs.

## Review sub-threads

Start review sub-threads with `role: "reviewer"`. Only a reviewer records a
verdict, with `coordinator_review_verdict { pass, findings }`; helpers can't.
The coordinator never records a verdict for its own items.

## Inspect from the CLI

`bb coordinator-mode status --thread <id>` prints a coordinator's items and
pending approvals. `bb coordinator-mode briefing --thread <id>` prints its
current briefing. `bb coordinator-mode on --thread <id> --template <ship|release|bug-triage|content>`
turns it on and `bb coordinator-mode off --thread <id>` turns it off; both are
denied inside a coordinator and its sub-threads.
