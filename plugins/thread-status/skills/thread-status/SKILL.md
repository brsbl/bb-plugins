---
name: thread-status
description: Keep this bb thread's sidebar status pill current with `bb thread-status`. Use when the state of your work changes in a way the user would want to see at a glance, and when moving Thread Organizer stages.
---

# Thread Status

Each thread row in the sidebar can show one short status pill beside its title.
Agents own it; keep it true.

## Presets

Prefer a preset. Each one carries its own color, so `--tone` is not needed.

| Label         | Color     | Use when                                              |
| ------------- | --------- | ----------------------------------------------------- |
| `Blocked`     | `danger`  | cannot continue without something outside this thread |
| `Failing`     | `danger`  | tests, CI, or the build are red                       |
| `Needs input` | `warning` | waiting on a user decision or answer                  |
| `In review`   | `info`    | work is done and under review                         |
| `Working`     | `info`    | actively implementing or investigating                |
| `Passing`     | `success` | tests and checks are green                            |
| `Done`        | `success` | the thread's work is complete                         |
| `Paused`      | `neutral` | intentionally on hold                                 |

`bb thread-status presets` prints this list.

## Custom labels

When no preset fits, write your own 1-2 word label (at most 18 characters) and
choose its color with `--tone`:

| Tone      | Use for                            |
| --------- | ---------------------------------- |
| `danger`  | broken, failing, or blocked        |
| `warning` | needs attention or a decision soon |
| `success` | done, passing, or merged           |
| `info`    | active work in progress            |
| `neutral` | anything else                      |

A custom label without `--tone` is rejected, and so is a preset with a
different color.

## Commands

```bash
bb thread-status set "Needs input"
bb thread-status set "Lint red" --tone danger
bb thread-status clear
bb thread-status get [--json]
bb thread-status presets [--json]
```

All commands target the thread running them. Pass `--thread <thread-id>` to
target another thread, for example a worker you own.

## With Thread Organizer

Thread Organizer's section already names the workflow stage. The pill says
what is true inside that stage, never the stage itself: in Building, write
"Failing" or "Lint red", not "Building". When you move a thread with
`bb organizer phase`, update or clear the pill in the same step so the two
never disagree.

## Lifetime

The pill stays until an agent changes or clears it. Archiving or deleting the
thread clears it.
