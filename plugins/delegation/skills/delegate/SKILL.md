---
name: delegate
description: Decide whether to hand a task to another bb thread, then launch and parent the worker with a self-contained prompt and the user's Agent Channels settings, or propose it first when the spawn policy requires. Use when the user says "launch an agent for this", "spin up a worker", "parent it", "have another thread do X", or when a separable task would block this thread. Optional spawn and handoff skills can extend the native bb workflow below; this skill owns the lead–worker contract.
---

# Delegate

A lead thread starts a worker, the worker does one bounded job, and the lead
passes only what matters back to the user. This skill covers the start.

## Read the settings first

```sh
bb delegation settings --json
```

Use the values it prints. The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them, but only on the machine its `host` names, or this machine when `host` is null (this machine is `thread.environment.hostId` in `bb status --json`). On any other machine, use the recorded values as they are: its files aren't the ones they came from. Anything the user says in the current request overrides a setting.
Don't restate the values to the user.

## Delegate, propose, or do it yourself

Do it yourself when the job takes a few minutes, needs context from this
conversation that is hard to write down, or the user is waiting on the answer
in this turn.

Delegation helps when:

- the user asks for an agent, worker, or another thread;
- the work can run while this thread keeps going;
- it needs its own worktree, another machine, or a different provider;
- it is long, mechanical follow-through, such as QA, a smoke test, or driving
  CI to green.

Then apply `spawnPolicy`:

| `spawnPolicy` | Spawn without asking | Otherwise |
| --- | --- | --- |
| `ask` | Only when the user asks for this worker in the current request | Propose |
| `followthrough` | When the user asked, or for follow-through on work the user already approved: QA, review, CI repair, and checks | Propose |
| `approved` | For anything inside scope the user approved | Propose |
| `free` | Whenever delegation helps | — |

To propose, name the job, the worker's role and configuration, and what it
would change, then wait for approval. Use `inline-action-cards` if installed;
otherwise ask one concise question in the conversation. New
scope, including a follow-up the user didn't ask for, is always a proposal.

To transfer existing work, use `handoff` if installed. Otherwise include the
current branch, environment, completed work, remaining steps, evidence, and
blockers in the successor prompt. Wait for the old worker to be idle, attach
the successor to that environment, and confirm it has taken over before
following `thread-lifecycle`.

## Choose the worker's configuration

Pick the worker's role first; it decides the tier.

| Role | Tier |
| --- | --- |
| Team lead | `leadProvider`, `leadModel`, `leadReasoningLevel` |
| Parent: will have reports of its own | `parentProvider`, `parentModel`, `parentReasoningLevel` |
| Leaf: one bounded job, no reports | `provider`, `model`, `reasoningLevel` |
| QA or smoke test that only exercises the product | `qaProvider` (blank: the leaf provider), `qaModel` (blank: the leaf model; `cheapest`: the cheapest generally available model in `bb provider models <provider> --json`; if that fails, add `--machine <host>` with this thread's host from `bb status --json`), `qaReasoningLevel` |

A blank role field falls back to the leaf value. If `spawn` is installed,
use its configuration and capacity guidance for remaining blanks. Otherwise
read the lead with `bb thread show "$BB_THREAD_ID" --json` and inherit its
provider, model, and reasoning where compatible. Verify available models with
`bb provider models <provider> --json`; never invent model IDs or price ranks.
If `cheapest` cannot be established from available metadata, ask which model
to use. Pass resolved provider/model values explicitly; omit a reasoning flag
when the provider has no such option. If no compatible configuration can be
resolved, ask before spawning. A worker that will have reports should use the
parent role from the start.

| Choice | Rule |
| --- | --- |
| Models to avoid | Never spawn a model listed in `avoidModels`. |
| Machine | The one the user names, else `machine`. When blank, use the lead's machine unless an installed capacity skill recommends another connected machine. |
| Environment | `environment`: `worktree` → `--new-environment worktree`; `personal` → `--new-environment personal`; `lead` → `--environment "$BB_ENVIRONMENT_ID"`; blank → a worktree for code changes or the lead environment for read-only work. Review or QA of another thread's change attaches to that thread's environment. Personal workspaces only work in the personal project: elsewhere, `personal` fails, so give research-only workers the lead's environment and code workers a worktree, and say so in one line. |
| Parent | When `parentWorkers` is true, pass `--parent-thread "$BB_THREAD_ID"` so bb tells the lead when the worker finishes. |
| Section | When `section` is set, pass `--section <id>`. When blank, use the lead's section from `bb thread show "$BB_THREAD_ID" --json` (`.thread.sectionId`), and omit the flag when that is null. |
| Permissions | Follow explicit user instructions or an installed spawn skill; otherwise omit `--permission-mode` and use bb’s default. Never infer broader permissions from delegation approval. |
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

## Coordination
- You report to <lead thread reference>. <Your reports, if any.>
- State which threads may be contacted and who owns decisions.

## Constraints
- Scope: <what to touch and what not to>. Build only what is approved here;
  for a design change, mock or propose it before building.
- Never act on another thread's PRs, branches, or threads, including closing
  or rebasing them.
- Don't archive or stop any thread.
- Follow the repository's required checks, review, and QA rules on the final
  revision. Include evidence the reviewer needs. Never merge without explicit
  user approval.

## Done when
- [ ] <Observable condition, such as "PR open in the target repository with CI green".>

## Report
Your final reply is your report; bb shows it to <the lead | the user>. Don't
send progress messages with `bb thread tell`. Reply once, when done or
blocked, in <workerReportLines> lines or fewer: the result, a PR link if any,
and the blocker. <Decisions line>
```

Fill it from the settings:

- `<workerReportLines>`: the setting.
- With `reportTo` set to `lead`, the report goes to the lead. Set the decisions
  line to: "Put any decision you need in your report; the lead raises it with
  the user. Don't create action cards yourself."
- With `reportTo` set to `user`, the report goes to the user. Set the decisions
  line to: "Ask for decisions in your own thread; use action cards if installed, otherwise one concise question."
- Keep the "Don't archive or stop" line in every prompt: archiving belongs to
  the lead (`thread-lifecycle`).

If spawn's "completion pings" step conflicts with the user's instructions on
cross-thread messages, their instructions win; leave pings out.

## Spawn it

Pass the prompt through stdin so the shell can't rewrite it:

```sh
bb thread spawn \
  --project "$BB_PROJECT_ID" \
  --provider '<provider>' --model '<model>' --reasoning-level '<level>' \
  --title "<title>" \
  --new-environment worktree \
  --parent-thread "$BB_THREAD_ID" \
  --prompt-file - --json <<'PROMPT'
<prompt>
PROMPT
```

Confirm current flags with `bb thread spawn --help` first. Replace the
example’s environment, parent, and configuration flags with the resolved
settings above; omit blank reasoning. Add `--machine`, `--section`, `--file`,
or `--image` as needed. Do not copy placeholders literally.

Then tell the user in one line which worker started, its tier, and what it will
do, as `@thread:<id>`. Keep working or end the turn; `collect-results` covers
waiting for it.
