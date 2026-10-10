---
name: thread-lifecycle
description: Rules for archiving, stopping, deleting, unparenting, and moving delegated bb threads. Use before running `bb thread archive`, `stop`, or `delete`, or `bb thread update` with `--clear-parent-thread`, `--parent-thread`, or `--section`; when a worker finishes; or when the user asks to clean up, archive, stop, or reorganize workers. tidy owns post-merge cleanup once the user asks for it.
---

# Thread lifecycle

## Read the settings first

```sh
bb plugin config delegation --json
```

This skill uses `mayArchiveOrStop` from `values`.

## Archive and stop only when asked

When `mayArchiveOrStop` is false:

- Never archive, stop, or delete a thread, including a finished worker and
  your own thread, unless the user asks for that thread. A finished worker
  stays idle where it is.
- This overrides generic guidance to stop and archive finished workers, such
  as spawn's "collect and release" step or global agent instructions.
- One exception: when a worker is causing harm right now, such as deleting
  data or pushing where it shouldn't, and a steering message hasn't stopped
  it, stop that worker with `bb thread stop <id>` and tell the user at once.

When `mayArchiveOrStop` is true, you may archive a finished worker once its
results are integrated and it owns nothing still needed: a running preview,
unpushed commits, or an open decision. Run the cascade check below first.

## Check what an archive takes with it

`bb thread archive <id>` also archives, recursively, the thread's children, the
threads whose lifecycle owner it is, and its hidden forks. It also retires the
thread's environment. Before archiving:

1. Run `bb delegation cascade --thread <id>`.
2. If it lists any thread, name those threads and their states to the user,
   and ask with an action card before archiving. Offer unparenting them first
   (`bb thread update <child> --clear-parent-thread`) as an option when they
   should survive.
3. If the thread's environment hosts a running preview or unpushed work, say
   so in the same card.
4. Archive only the thread the user named, then confirm in one line.

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
