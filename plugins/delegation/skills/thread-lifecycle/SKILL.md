---
name: thread-lifecycle
description: Rules for archiving, stopping, deleting, unparenting, and moving delegated bb threads, following the user's own instructions as recorded in the Delegation settings. Use before running `bb thread archive`, `stop`, or `delete`, or `bb thread update` with `--clear-parent-thread`, `--parent-thread`, or `--section`; when a worker finishes; or when the user asks to clean up, archive, stop, or reorganize workers. tidy owns post-merge cleanup once the user asks for it.
---

# Thread lifecycle

## Read the settings first

```sh
bb delegation settings --json
```

The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them.

This skill uses `mayArchiveOrStop` from its output.

## Finished workers

When `mayArchiveOrStop` is true, the lead stops and archives a worker it
started once the worker's results are handed back and integrated, and only if
it owns nothing still needed: a running preview, unpushed or unmerged work, or
a decision still waiting on the user. Stop its runtime with
`bb thread stop <id>`, run the cascade check below, then archive it. Never
archive a thread you didn't start, or your own, unless the user asks.

When `mayArchiveOrStop` is false, archive, stop, or delete a thread only when
the user asks for that thread. A finished worker stays idle where it is.

Either way, when a worker is causing harm right now, such as deleting data or
pushing where it shouldn't, and a steering message hasn't stopped it, stop it
with `bb thread stop <id>` and tell the user at once.

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
4. Archive only that thread, then confirm in one line.

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
