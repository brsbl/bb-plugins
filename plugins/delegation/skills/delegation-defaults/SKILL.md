---
name: delegation-defaults
description: Read the user's own instructions (AGENTS.md, CLAUDE.md, their skills, and their memory) and record what they say about each Delegation setting, with the file and an exact quote. Use when the user asks to refresh, update, or explain the delegation defaults, when `bb delegation sources` says nothing is recorded, or when an instruction file changed after the recorded check time. delegate and the other Delegation skills read the result; this skill owns deriving it.
---

# Delegation defaults

Delegation keeps no rules of its own. Each setting takes, in order:

1. what the user's instructions say, recorded here with a quote;
2. the override they set in Settings → Delegation;
3. a neutral fallback that defers to bb or the spawn skill.

## When to refresh

```sh
bb delegation sources --json
```

Refresh when `checkedAt` is null, or when any file below changed after it
(`stat -f %m <file>` on macOS, `stat -c %Y <file>` on Linux; `checkedAt` is in
milliseconds).

## Read these, highest precedence first

1. `~/.bb/AGENTS.md` and `~/.claude/CLAUDE.md`: the user's instruction files.
2. Memory: `~/.claude/projects/*/memory/*.md` notes of type `feedback` about
   workers, models, reports, or threads. A memory note can override a skill
   when it says so, such as "override the spawn skill's Codex defaults".
3. Skills: `spawn`, `comms`, `inline-action-cards`, and `handoff` in
   `~/.bb/skills/` or the installed skill catalog.

When two sources disagree, the higher one wins. Record the winner, and put the
loser and why in `--note`. When a memory note is newer and explicitly narrows
an instruction file for one case, such as QA threads, record it for the
setting that covers that case.

## Map what you find to settings

| Setting | Look for |
| --- | --- |
| `provider`, `model`, `reasoningLevel` | The default provider, model, and reasoning level for spawned workers |
| `avoidModels` | Models the user says never to spawn; record model IDs, comma-separated, from `bb provider models <provider> --json` |
| `qaProvider`, `qaModel`, `qaReasoningLevel` | Models for QA, smoke tests, or test-only threads; `cheapest` when they ask for the cheapest |
| `machine`, `environment`, `section` | Where workers run, worktree versus personal, sidebar filing |
| `parentWorkers` | Whether a coordinating thread parents its workers |
| `workerReportLines` | How long a worker's final report may be |
| `reportMaxBullets`, `reportStyle` | How reports to the user are shaped |
| `decisionsAsActionCards`, `evidenceInline` | How decisions and screenshot evidence reach the user |
| `relayBatching` | Rules about keeping cross-thread messages to a minimum |
| `retryLimit` | Retry rules for failed worker turns |
| `mayArchiveOrStop` | Whether finished workers are stopped and archived |

Record a setting only when a source actually addresses it. Leave the rest
unrecorded so the user's override or the fallback applies. Don't infer a
number that no source states.

## Record

Start clean, then record each value with the user's exact words:

```sh
bb delegation forget --all
bb delegation record workerReportLines 3 \
  --from '~/.claude/CLAUDE.md' \
  --quote 'Report once, when done or blocked, in three lines or fewer'
```

Quote with single quotes; if the quote contains one, close and reopen the
string (`'it'\''s'`). Keep each quote to the sentence that sets the value.

Finish with `bb delegation settings` and tell the user in one line how many
settings now come from their instructions, plus any conflict you noted.
