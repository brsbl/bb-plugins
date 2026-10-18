---
name: thread-lifecycle
description: Rules for archiving, stopping, deleting, unparenting, and moving delegated bb threads, following the user's own instructions as recorded in the Agent Channels settings. Use before running `bb thread archive`, `stop`, or `delete`, or `bb thread update` with `--clear-parent-thread`, `--parent-thread`, or `--section`; when a worker finishes or its final report has been read; or when the user asks to clean up, archive, stop, or reorganize workers. Use tidy if installed for requested post-merge cleanup; otherwise limit cleanup to the verified thread lifecycle steps below and leave repository, branch, and environment deletion to a separate explicit request.
---

# Thread lifecycle

## Read the settings first

```sh
bb delegation settings --json
```

The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them, but only on the machine its `host` names (this machine is `thread.environment.hostId` in `bb status --json`). On any other machine, use the recorded values as they are: its files aren't the ones they came from.

This skill uses `mayArchiveOrStop` from its output.

## Optional integrations

Use `inline-action-cards` if installed for decisions below; otherwise ask one
concise question in the conversation and wait for an explicit answer. For
evidence, use `screenshots` if installed, otherwise verify a durable artifact
link before archiving. If no persistent copy is possible, leave the thread
and its environment intact and report the blocker.

## Finished workers

`mayArchiveOrStop` covers only workers a lead spawned for one bounded job.
It never covers a thread with a standing role: one assigned ongoing coordination work, a
report assigned to the lead, or any thread that has returned more than one
report for ongoing work. Those stay until the user asks.

When `mayArchiveOrStop` is true, the lead stops and archives a bounded worker
it started once the worker's results are handed back and integrated, and only
if it owns nothing still needed: a running preview, unpushed or unmerged work,
or a decision still waiting on the user. Stop its runtime with
`bb thread stop <id>`, run the cascade and evidence checks below, then archive
it. Never archive a thread you didn't start, or your own, unless the user asks
or it's the predecessor in a handoff below.

When `mayArchiveOrStop` is false, archive, stop, or delete a thread only when
the user asks for that thread. A finished worker stays idle where it is.

Either way, when a worker is causing harm right now, such as deleting data or
pushing where it shouldn't, and a steering message hasn't stopped it, stop it
with `bb thread stop <id>` and tell the user at once.

## Hand off to a successor

When the user moves a thread to a new owner, for example to switch its model
or provider:

1. Wait until the old thread is idle (`bb thread wait <id>`).
2. Use `handoff` if installed, otherwise the bundled `delegate` skill’s
   transfer procedure. Start the successor in the same environment with the
   old thread’s history, current work, evidence, and remaining steps.
3. Move the old thread's children to the successor
   (`bb thread update <child> --parent-thread <successor>`), and re-pin its
   pinned files and links there.
4. Confirm the successor has taken over: it replied, and its children list
   matches.
5. Run the cascade and evidence checks below, then archive the predecessor.

## Check what an archive takes with it

`bb thread archive <id>` also archives, recursively, the thread's children, the
threads whose lifecycle owner it is, and its hidden forks. It also retires the
thread's environment. Before archiving:

1. Run `bb delegation cascade --thread <id>`.
2. If it lists any thread that isn't itself a finished worker you may
   archive, name those threads and their states to the user, and ask with an
   action card before archiving. Offer unparenting them first
   (`bb thread update <child> --clear-parent-thread`) as an option when they
   should survive.
3. If the thread's environment hosts a running preview or unpushed work, say
   so in the same card.
4. Check shown evidence. Archiving retires the environment, so screenshots or
   videos already shown inline from its worktree stop rendering. Before
   archiving, confirm each is in the PR (uploaded through `screenshots`) or
   copy it somewhere that outlives the worktree. If neither is possible,
   say so in the card.
5. Archive only that thread, then confirm in one line.

## Unparent and move only on request

Change a thread's parent or section only when the user asks:

| Change | Command |
| --- | --- |
| Unparent | `bb thread update <id> --clear-parent-thread`. The thread takes its former parent's section unless you also pass `--section` or `--clear-section`. |
| Reparent | `bb thread update <id> --parent-thread <lead-id>` |
| Move to a section | `bb thread update <id> --section <section-id>`; find IDs with `bb thread section list`. |
| Leave a section | `bb thread update <id> --clear-section` |

Deleting is permanent. Do it only for a thread the user names, after
confirming with an action card.
