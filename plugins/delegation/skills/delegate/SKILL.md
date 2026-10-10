---
name: delegate
description: Decide whether to hand a task to another bb thread, then launch and parent the worker with a self-contained prompt and the user's Delegation settings. Use when the user says "launch an agent for this", "spin up a worker", "parent it", "have another thread do X", or when a separable task would block this thread. spawn owns machine capacity and model tiers, and handoff owns transferring work already in progress; this skill owns the lead–worker contract.
---

# Delegate

A lead thread starts a worker, the worker does one bounded job, and the lead
passes only what matters back to the user. This skill covers the start.

## Read the settings first

```sh
bb plugin config delegation --json
```

Use `values` from that output. Anything the user says in the current request
overrides a setting. Don't restate the values to the user.

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
| Provider | The one the user names, else `provider`. |
| Model | The one the user names. For QA, smoke tests, and other mechanical checks, `qaModel`; when it is `cheapest`, pick the cheapest generally available model in `bb provider models <provider> --json`. Otherwise `model`; when blank, follow spawn's normal tier. |
| Machine | The one the user names, else `machine`. When blank, use the lead's machine unless spawn's capacity check offloads the job. |
| Environment | `environment`: `worktree` → `--new-environment worktree`; `personal` → `--new-environment personal`; `lead` → `--environment "$BB_ENVIRONMENT_ID"`. Review or QA of another thread's change attaches to that thread's environment, as spawn describes. |
| Parent | When `parentWorkers` is true, pass `--parent-thread "$BB_THREAD_ID"` so bb tells the lead when the worker finishes. Follow spawn's caveat for remote personal workspaces. |
| Section | When `section` is set, pass `--section <id>`. When blank, use the lead's section from `bb thread show "$BB_THREAD_ID" --json` (`.thread.sectionId`), and omit the flag when that is null. |
| Permissions and reasoning | spawn's defaults. |
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
line whenever `mayArchiveOrStop` is false.

spawn's "completion pings" instruction conflicts with the user's rule that a
worker's final reply is its report. Leave pings out.

## Spawn it

Pass the prompt through stdin so the shell can't rewrite it:

```sh
bb thread spawn \
  --project "$BB_PROJECT_ID" \
  --provider <provider> --model <model> \
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
