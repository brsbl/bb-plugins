---
name: thread-phase-organizer
description: Keep the current root bb thread in the configured workflow stage matching its present primary activity. Use at every substantive task start, after resolving an indirect kickoff, after scope changes, before implementation, at implementation/validation transitions, and when handoff becomes primary. Classify the thread itself, never subjects merely mentioned inside it.
---

# Thread Phase Organizer

Keep this root thread in the workflow stage matching the work you are doing.
Thread Organizer supplies the user’s current saved workflow in this session’s
dynamic instructions whenever the agent starts or resumes. The table below is
the default workflow; when the dynamic instructions differ, use their live
stage keys, titles, and rules.

## Understand the remembered stage

Thread Organizer does not classify prompts. A new manageable root thread
mechanically remembers the first configured non-Inbox workflow stage; with the
default workflow below, that is Planning. This default or remembered value is
storage state, not a semantic decision that the current work is planning.

The remembered stage changes when the user moves the thread or when you run
`bb organizer phase <stage-key>`. `update_plan` and other internal task plans do
not move the bb workflow stage. Only `bb organizer phase` performs an
agent-driven stage update. Re-running it with the already-remembered key leaves
the row in place and queues a title refresh.

## Current workflow

**Inbox** is the protected Inbox section. Idle unread threads go there automatically and stay until work resumes. This routing behavior can’t be customized; never choose Inbox yourself.

| Key            | Section          | What belongs here                                                                |
| -------------- | ---------------- | -------------------------------------------------------------------------------- |
| planning       | Planning         | Defining scope, requirements, or approach before a reviewable spec exists.       |
| spec-review    | Spec Review      | A spec or implementation plan is ready for, awaiting, or undergoing user review. |
| building       | Building         | Implementing or changing approved work.                                          |
| testing-deploy | Testing / Deploy | Validating, packaging, releasing, or deploying completed work.                   |
| handoff        | Handoff          | Packaging work and context so a colleague can continue it.                       |
| on-hold        | On Hold          | Work intentionally paused until a later time or external condition.              |

## Choose the subject correctly

A stage describes the current primary activity of this root thread as a whole.
It does not describe the lifecycle of every idea, task, artifact, quotation, or
future plan mentioned inside the thread.

- Recording a deferred or paused feature while continuing to edit a spec is
  still spec or planning work. The root thread is not on hold.
- Writing about a handoff is not Handoff. Use a handoff-like stage only when
  the current work is actually packaging context and evidence for another
  owner.
- Use an on-hold-like stage only when the whole root thread is intentionally
  paused until later or until an external condition changes, with no other
  meaningful work continuing now.

Do not infer a transition from stage words in a title, old message, quoted
text, document, task list, or plan item. Completing one bounded step or waiting
for the user’s next message is not itself a stage change.

## Re-evaluate at workflow checkpoints

Re-evaluate the root thread’s primary activity at each of these checkpoints:

1. At the start of every substantive task.
2. Immediately after resolving an indirect kickoff such as “read this
   brief/spec/issue/thread.” Read the referenced artifact first, then classify
   the resolved next concrete action—not isolated words in the kickoff or the
   artifact.
3. After the user changes scope or direction.
4. Before implementation begins. Move to the matching building-like stage
   before changing code or product artifacts.
5. When implementation transitions to testing, packaging a deliverable,
   releasing, or deploying. Move to the matching testing/deploy-like stage.
6. When failed validation makes implementation the next concrete action again.
   Move from the testing/deploy-like stage back to the building-like stage
   before fixing the failure.
7. When packaging context and evidence for another owner becomes the primary
   activity. Move to the matching handoff-like stage.

At a checkpoint, use the stage whose rule describes the resolved next concrete
action. When the task or scope changed substantively, run `bb organizer phase`
with that key even if it is already remembered. Thread Organizer batches that
same-stage refresh with other title reassessments. Do not refresh again for
minor progress within unchanged work.

## Update when the work changes

When the root thread genuinely changes its primary activity—or its concrete
work changes substantially within the current stage—run the matching stage
command before starting that work:

```bash
bb organizer phase <stage-key>
```

This is routine agent bookkeeping. Run it autonomously; never ask the user for
confirmation or permission to update or refresh the stage.

Choose only a key from the current workflow table when the work you are about
to do clearly matches that stage’s rule. Inbox is system-managed and can’t be
selected.

If several stages seem relevant, use the one describing the next concrete
action. If you lack sufficient context, leave the remembered stage unchanged
rather than inventing a transition. Do not move the thread merely to record an
end state after finishing a step. If the user corrects a move, apply the
correct stage immediately.

Do not create, rename, or delete native sections; the plugin reconciles them
from the user’s settings.
