---
name: delegate
description: Decide whether to hand a task to another bb thread, then launch and parent the worker with a self-contained prompt and the user's Delegation settings. Use when the user says "launch an agent for this", "spin up a worker", "parent it", "have another thread do X", or when a separable task would block this thread. spawn owns machine capacity and model tiers, and handoff owns transferring work already in progress; this skill owns the lead–worker contract.
---

# Delegate

A lead thread starts a worker, the worker does one bounded job, and the lead
passes only what matters back to the user. This skill covers the start.

## Read the settings first

```sh
bb delegation settings --json
```

Use the values it prints. The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them. Anything the user says in the current request overrides a setting.
Don't restate the values to the user.

## Delegate or do it yourself

Do it yourself when the job takes a few minutes, needs context from this
conversation that is hard to write down, or the user is waiting on the answer
in this turn.

Delegate when:

- the user asks for an agent, worker, or another thread;
- the work can run while this thread keeps going;
- it needs its own worktree, another machine, or a different provider;
- it is long, mechanical follow-through, such as QA, a smoke test, or driving
  CI to green.

To move work already in progress to a new owner, use `handoff` instead.

## Choose the worker's configuration

| Choice | Rule |
| --- | --- |
| Provider and model | The ones the user names. Otherwise `provider`, `model`, and `--reasoning-level <reasoningLevel>`; leave out any that is blank so bb or spawn's normal tier decides. |
| QA and smoke tests | For threads that only exercise the product, use `qaProvider` (blank: the worker provider), `qaModel` (blank: the worker model; `cheapest`: the cheapest generally available model in `bb provider models <provider> --json`), and `qaReasoningLevel`. |
| Models to avoid | Never spawn a model listed in `avoidModels`, even when a tier or catalog default would pick it. |
| Machine | The one the user names, else `machine`. When blank, use the lead's machine unless spawn's capacity check offloads the job. |
| Environment | `environment`: `worktree` → `--new-environment worktree`; `personal` → `--new-environment personal`; `lead` → `--environment "$BB_ENVIRONMENT_ID"`; blank → spawn's choice for the job. Review or QA of another thread's change attaches to that thread's environment, as spawn describes. |
| Parent | When `parentWorkers` is true, pass `--parent-thread "$BB_THREAD_ID"` so bb tells the lead when the worker finishes. Follow spawn's caveat for remote personal workspaces. |
| Section | When `section` is set, pass `--section <id>`. When blank, use the lead's section from `bb thread show "$BB_THREAD_ID" --json` (`.thread.sectionId`), and omit the flag when that is null. |
| Permissions | spawn's defaults. |
| Title | A short, human-facing name for the job, such as "Fix timeline scroll arrow cursor". No bracketed prefixes or suffixes, model names, or roles. |

## Write a self-contained prompt

The worker sees none of this conversation. Give it everything it needs in this
shape, and nothing it doesn't:

```markdown
## Goal
<One imperative sentence naming the deliverable.>

## Context
- <@thread:thr_… links, PR URLs, file paths, notes, attached screenshots>
- <Decisions already made, quoting the user where their wording matters>

## Constraints
- <Scope: what to touch and what not to.>
- <Authority: whether it may push, open a PR, or merge. Never merge unless the user said so.>
- Don't archive or stop any thread.

## Done when
- [ ] <Observable condition, such as "PR open on brsbl/bb-plugins with CI green".>

## Report
Your final reply is your report; bb shows it to the lead. Don't send progress
messages with `bb thread tell`. Reply once, when done or blocked, in
<workerReportLines> lines or fewer: the result, a PR link if any, and the
blocker. Message the lead mid-task only when it must decide something to
unblock you.
```

Fill `<workerReportLines>` from the settings. Keep the "Don't archive or stop"
line in every worker prompt: archiving belongs to the lead (`thread-lifecycle`).

If spawn's "completion pings" step conflicts with the user's instructions on
cross-thread messages, their instructions win; leave pings out.

## Spawn it

Pass the prompt through stdin so the shell can't rewrite it:

```sh
bb thread spawn \
  --project "$BB_PROJECT_ID" \
  --provider '<provider>' --model '<model>' \
  --permission-mode auto \
  --title "<title>" \
  --new-environment worktree \
  --parent-thread "$BB_THREAD_ID" \
  --prompt-file - --json <<'PROMPT'
<prompt>
PROMPT
```

Add `--machine`, `--section`, `--file`, or `--image` as the table above
requires.

Then tell the user in one line which worker started and what it will do, as
`@thread:<id>`. Keep working or end the turn; `collect-results` covers waiting
for it.
