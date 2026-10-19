---
name: delegation-defaults
description: Read the user's own instructions (AGENTS.md, CLAUDE.md, their skills, and their memory) and record what they say about each Agent Channels setting, with the file and an exact quote. Use when the user asks to refresh, update, or explain the delegation defaults, when `bb delegation sources` says nothing is recorded, or when an instruction file changed after the recorded check time. delegate and the other Agent Channels skills read the result; this skill owns deriving it.
---

# Agent Channels defaults

Agent Channels resolves each setting from the user’s instructions. Each setting takes, in order:

1. what the user's instructions say, recorded here with a quote;
2. the override they set in Settings → Agent Channels;
3. a fallback that defers to bb or an optional spawn skill.

## When to refresh

```sh
bb delegation sources --json
```

Refresh when `checkedAt` is null, or when any file below changed after it
(`stat -f %m <file>` on macOS, `stat -c %Y <file>` on Linux; `checkedAt` is in
milliseconds).

When `host` is null, refresh on this machine and record its host ID. Otherwise
refresh only on the machine `host` names. This machine is
`thread.environment.hostId` in `bb status --json`. Every machine reads the same
recorded sources, but the files live on one: rebuilding on a machine without
the user's memory notes would erase what those notes set. If `host` is another
machine, use the recorded values as they are, unless the user asks you to read
this machine's files instead.

## Read available instructions

Read the user's global instruction files (`~/.bb/AGENTS.md` and
`~/.claude/CLAUDE.md`) if they exist. Then read relevant user memory and
installed skills if available. No Claude setup, memory plugin, or separate
personal skills are required. Missing optional files mean no source for that
setting; use the override or fallback. If a previously recorded source cannot
be read because of a permissions or host error, preserve it and report the gap.
Agent memory notes may live under `~/.claude/projects/*/memory/`; check those
notes when deciding whether memory changed since the last refresh.

Settings apply across this bb. Record only rules the user intends globally;
keep project- or task-specific instructions in the current worker prompt.
Do not promote another project's memory into a global setting. When scope is
unclear, ask before recording it. Explicit user instructions outrank skill
suggestions; between equally scoped user instructions, use the latest explicit
one. Record the winning quote and explain any conflict in `--note`.

Keep an existing recorded source whose note states a broader scope, such as
org-wide or "all agents", even when stored under a project directory. Ask the
user before removing any existing recorded source, and keep it until they
confirm removal.

Read optional `spawn`, `comms`, `inline-action-cards`, and `handoff` skills
only if installed. Their absence is not an error. Current user decisions are
sources too: quote their words and identify the originating conversation in
`--from`, for example `--from 'User instruction in the current conversation'`.

## Map what you find to settings

| Setting | Look for |
| --- | --- |
| `provider`, `model`, `reasoningLevel` | Provider, model, and reasoning for leaf workers, or for all workers when the sources don't split them by role |
| `leadProvider`, `leadModel`, `leadReasoningLevel` | The configuration for team leads |
| `parentProvider`, `parentModel`, `parentReasoningLevel` | The tier for threads that have reports |
| `avoidModels` | Models the user says never to spawn; record model IDs, comma-separated, from `bb provider models <provider> --json` (add `--machine <host>` from `bb status --json` if it fails) |
| `qaProvider`, `qaModel`, `qaReasoningLevel` | Models for QA, smoke tests, or test-only threads; `cheapest` when they ask for the cheapest |
| `machine`, `environment`, `section` | Where workers run, worktree versus personal, sidebar filing |
| `parentWorkers` | Whether a coordinating thread parents its workers |
| `workerReportLines` | How long a worker's final report may be |
| `reportMaxBullets`, `reportStyle` | How reports to the user are shaped |
| `decisionsAsActionCards`, `evidenceInline` | How decisions and screenshot evidence reach the user |
| `relayBatching` | Rules about keeping cross-thread messages to a minimum |
| `retryLimit` | Retry rules for failed worker turns |
| `mayArchiveOrStop` | Whether finished workers are stopped and archived |
| `spawnPolicy` | When a lead may spawn without asking: `ask` (never), `followthrough` (QA, review, CI repair, and checks on approved work), `approved` (anything inside approved scope), or `free` |
| `reportTo` | Whether workers report to their lead or straight to the user |

Record a setting only when a source actually addresses it. Leave the rest
unrecorded so the user's override or the fallback applies. Don't infer a
number that no source states.

## Record

After reading the sources, remove only user-confirmed stale records and record each value with
the user's exact words. Use `forget --all` only when every previous source
was checked and its removal confirmed; otherwise preserve existing sources
and forget only individual confirmed keys. Pass this machine's host ID with every command:

```sh
bb delegation forget --all --host <host id>
bb delegation record <key> <value> --host <host id> \
  --from '<instruction source>' --quote '<exact user instruction>'
```

Quote with single quotes; if the quote contains one, close and reopen the
string (`'it'\''s'`). Keep each quote to the sentence that sets the value.

Finish with `bb delegation settings` and tell the user in one line how many
settings now come from their instructions, plus any conflict you noted.
