---
name: thread-status
description: Keep this bb thread's sidebar status pill current with `bb thread-status`. Use when the state of your work changes in a way the user would want to see at a glance, and when moving Thread Organizer stages.
---

# Thread Status

Each thread row in the sidebar can show one short status pill beside its title.
Agents own it; keep it true.

## Commands

```bash
bb thread-status set "CI red" --tone danger
bb thread-status set "Needs input" --tone warning
bb thread-status clear
bb thread-status get [--json]
```

All commands target the thread running them. Pass `--thread <thread-id>` to
target another thread, for example a worker you own.

Labels are 1-2 words and at most 18 characters. Longer labels are rejected,
not truncated.

## Tones

| Tone      | Use for                                   |
| --------- | ----------------------------------------- |
| `danger`  | broken, failing, or blocked               |
| `warning` | needs attention or a decision soon        |
| `success` | done, passing, or merged                  |
| `info`    | active work in progress                   |
| `neutral` | anything else (default)                   |

## With Thread Organizer

Thread Organizer's section already names the workflow stage. The pill says
what is true inside that stage, never the stage itself: in Building, write
"CI red" or "Tests pass", not "Building". When you move a thread with
`bb organizer phase`, update or clear the pill in the same step so the two
never disagree.

## Lifetime

The pill stays until an agent changes or clears it. Archiving or deleting the
thread clears it.
