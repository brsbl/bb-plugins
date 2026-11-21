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

Refresh only on the machine `host` names. This machine is
`thread.environment.hostId` in `bb status --json`. Every machine reads the same
recorded sources, but the files live on one: rebuilding on a machine without
the user's memory notes would erase what those notes set. If `host` is another
machine, use the recorded values as they are, unless the user asks you to read
this machine's files instead.

## Find the memory notes

Rebuild from the files every time; don't start from what's already recorded.
List the candidate notes newest first, then read every one it prints:

```sh
rg -l -i '^description:.*(spawn|worker|model|tier|report to|reports|archiv|relay|delegat|sub-?thread|child thread|QA thread)' \
  ~/.claude/projects/*/memory/*.md | xargs ls -t
```

## Read these, highest precedence first

1. `~/.bb/AGENTS.md` and `~/.claude/CLAUDE.md`: the user's instruction files.
2. Memory: `~/.claude/projects/*/memory/*.md` notes of type `feedback` about
   workers, models, reports, threads, or spawning. A memory note can override
   a skill when it says so, such as "override the spawn skill's Codex
   defaults".
3. Skills: `spawn`, `comms`, `inline-action-cards`, and `handoff` in
   `~/.bb/skills/` or the installed skill catalog.

Memory is not one pool. Each project directory under `~/.claude/projects/`
holds notes for that project; a note can also name its scope, such as "the
Growth, Ops Tools, and Strategy & Fundraising orgs". Delegation settings apply
to every thread on this bb, and the threads that delegate are the user's org
leads and the threads under them, wherever this refresh runs. So read every project's
notes, and resolve them in this order:

1. A note scoped to the user's orgs, or to the project they delegate in, beats
   a general note on the same setting. Record it and put its scope in
   `--note`. Don't skip a note because this refresh runs in another project.
2. Between two notes at the same scope, the newer one (`modified` in the
   frontmatter, else the file's mtime) wins.
3. A newer note that narrows an older one to one case, such as QA threads,
   sets only the setting for that case.

When two sources disagree, the higher one wins. Record the winner, and put the
loser and why in `--note`.

Decisions the user makes on an action card or relays through a lead are
sources too, until they land in a memory note: quote their words and name the
thread they came from, such as `--from 'brsbl via 🧰 Ops Tools (thr_…)'`.

## Map what you find to settings

| Setting | Look for |
| --- | --- |
| `provider`, `model`, `reasoningLevel` | Provider, model, and reasoning for leaf workers, or for all workers when the sources don't split them by role |
| `leadProvider`, `leadModel`, `leadReasoningLevel` | The tier for org leads |
| `parentProvider`, `parentModel`, `parentReasoningLevel` | The tier for leads with threads under them |
| `avoidModels` | Models the user says never to spawn; record model IDs, comma-separated, from `bb provider models <provider> --json` (add `--machine <host>` from `bb status --json` if it fails) |
| `qaProvider`, `qaModel`, `qaReasoningLevel` | Models for QA, smoke tests, or test-only threads; `cheapest` when they ask for the cheapest |
| `machine`, `environment`, `section` | Where workers run, worktree versus personal, sidebar filing |
| `parentWorkers` | Whether workers are placed under their lead |
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

Start clean, then record each value with the user's exact words. Pass this
machine's host id with every command so other machines know where the files
were read:

```sh
bb delegation forget --all --host <host id>
bb delegation record workerReportLines 3 --host <host id> \
  --from '~/.claude/CLAUDE.md' \
  --quote 'Report once, when done or blocked, in three lines or fewer'
```

Quote with single quotes; if the quote contains one, close and reopen the
string (`'it'\''s'`). Keep each quote to the sentence that sets the value.

Finish with `bb delegation settings` and tell the user in one line how many
settings now come from their instructions, plus any conflict you noted.
