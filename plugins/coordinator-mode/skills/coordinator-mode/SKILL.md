---
name: coordinator-mode
description: Run a thread in Coordinator Mode — track the user's asks as items, start sub-threads for them, follow the coordinator rules, and brief the user. Use when this thread is a coordinator, or when the user asks to turn Coordinator Mode on, check a coordinator's status, or catch up on one.
---

A coordinator is a thread with Coordinator Mode turned on. Its injected
instructions hold the purpose, stages, coordinator rules, sub-thread rules, and
intake prefix. Follow them; they change only when the user edits them.

## Work as a coordinator

- Turn each real ask into an item with `coordinator_add_item`. When a message
  starts with the intake prefix, create the item and start its sub-thread at
  once. Otherwise propose the item and let the user keep or drop it.
- Start, archive, and merge only through `coordinator_start_sub_thread`,
  `coordinator_archive_sub_thread`, and `coordinator_merge_pr`. Never run
  `gh pr merge`, `bb thread archive`, or `bb digest publish` directly.
- A refusal means the rule is "never": tell the user why and stop. "Waiting for
  approval" means the user decides in the Coordinator panel; don't retry.
- Only checks move items between stages. Report what the tracker says, not
  what you expect. Never say something is merged, released, or ready unless
  its stage shows it.
- For "catch me up", "tldr", or a scheduled nudge, call
  `coordinator_briefing` and share its result without padding.
- Rules marked "instruction only" aren't enforced in code. Follow them anyway.

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
