---
name: thread-phase-organizer
description: Keep the current root bb thread in the workflow stage defined by the user’s live Thread Organizer settings. Use at substantive task starts, after scope changes, and at genuine workflow-stage transitions. Classify the thread itself, never subjects merely mentioned inside it.
---

# Thread Phase Organizer

This skill is the stable movement protocol. It intentionally contains no
section taxonomy. Thread Organizer injects a block headed “Thread Organizer’s
current workflow for this session” from the user’s plugin settings whenever a
session starts or resumes. Treat that live block as the sole source of stage
keys, titles, and rules. If it is absent, do not guess a stage or run the
organizer command.

## Understand the remembered stage

Thread Organizer does not classify prompts. A new manageable root thread
mechanically remembers the first configured non-Inbox workflow stage. That
remembered value is storage state, not a semantic decision about the work.

The remembered stage changes when the user moves the thread or when you run
`bb organizer phase <stage-key>`. `update_plan` and other internal task plans do
not move the bb workflow stage. Only `bb organizer phase` performs an
agent-driven stage update.

## Choose the subject correctly

A stage describes the current primary activity of this root thread as a whole.
It does not describe the lifecycle of every idea, task, artifact, quotation, or
future plan mentioned inside the thread.

- A stage rule that requires an explicit user decision is ineligible without a
  current, explicit statement from the user. Adjacent or implied activity does
  not satisfy such a rule.

Do not infer a transition from stage words in a title, old message, quoted
text, document, task list, or plan item. Completing one bounded step or waiting
for the user’s next message is not itself a stage change.

## Re-evaluate at workflow checkpoints

Re-evaluate the root thread’s primary activity at each of these checkpoints:

1. At the start of a substantive task.
2. Immediately after resolving an indirect kickoff such as “read this
   brief/spec/issue/thread.” Read the referenced artifact first, then classify
   the resolved next concrete action—not isolated words in the kickoff or the
   artifact.
3. After the user changes scope or direction.
4. Before implementation, validation, release, or another major activity
   transition begins.

At a checkpoint, compare the whole thread’s primary activity with the live
rules. A checkpoint is an opportunity to reassess, not a reason to move.

## Update when the work changes

When the root thread genuinely changes to a different configured stage, run the
matching command before starting that work:

```bash
bb organizer phase <stage-key>
```

This is routine agent bookkeeping. Run it autonomously when the live rule
clearly applies, except when that rule itself requires explicit user intent.

Choose only a key from the live settings block. Inbox is system-managed and
can’t be selected.

Re-run the already-remembered stage only when the durable core job of the
entire thread changed enough that its current title is materially inaccurate.
Do not refresh for the latest turn, a new subtask, a method or approach change,
ordinary progress, implementation versus validation, or completion of one
step. This keeps titles anchored to the thread’s identity instead of its most
recent activity.

If several stages seem relevant, use the one describing the next concrete
action. If you lack sufficient context, leave the remembered stage unchanged
rather than inventing a transition. Do not move the thread merely to record an
end state after finishing a step. If the user corrects a move, apply the
correct stage immediately.

Do not create, rename, or delete native sections; the plugin reconciles them
from the user’s settings.
