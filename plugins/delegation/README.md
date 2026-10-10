# Delegation

Skills for handing work to other bb threads and bringing back only what matters.

![Delegation's settings form, with values quoted from AGENTS.md, CLAUDE.md, and memory, and an ignored override flagged](docs/settings.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/delegation --yes
```

## Use

Ask a thread to "launch an agent for this and parent it". The lead starts a worker, the worker does the job and replies once, and the lead passes on only what you need. Each job has one skill:

| Skill | Owns |
| --- | --- |
| `delegate` | Whether to spawn, the worker's self-contained prompt, and its provider, model, machine, environment, parent, section, and title |
| `relay` | Passing your decision or request to an existing thread in one batched message that quotes you |
| `collect-results` | Waiting on workers without polling, reading their reports and artifacts, and retrying stalls and provider errors |
| `report-results` | Short, batched reports with evidence inline and decisions as action cards |
| `thread-lifecycle` | Archiving, stopping, unparenting, and section moves, following your instructions |
| `delegation-defaults` | Reading your AGENTS.md, CLAUDE.md, skills, and memory into the settings, with quotes |

The skills build on existing ones rather than repeating them: `spawn` for machine capacity and model tiers, `handoff` for transferring work in progress, `comms` for writing style, `inline-action-cards` for cards, `bb-thread-status-report` for every running thread, and `tidy` for post-merge cleanup.

### Settings

Delegation keeps no rules of its own. Each setting resolves in this order:

1. **Your instructions.** The `delegation-defaults` skill reads `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, your memory notes, and your skills, then records what they say about each setting with the file and your exact words. These win.
2. **Your override**, from Settings → Delegation or `bb delegation set`. It applies only where your instructions are silent; the form marks an override your instructions outrank as ignored.
3. **A fallback** that defers to bb or the spawn skill.

Settings → Delegation shows every setting's value and where it came from, with provider, machine, and section dropdowns filled from your bb and bb's own model picker. Rows your instructions set are locked and quote them. Agents read the effective values with `bb delegation settings --json`. Ask any thread to "refresh the delegation defaults" after you change your instructions.

| Setting | Fallback | What it controls |
| --- | --- | --- |
| `provider`, `model`, `reasoningLevel` | blank | Provider, model, and reasoning level for new workers; blank lets bb or spawn's normal tier decide. Changing the provider clears the model. |
| `avoidModels` | blank | Model IDs no worker should run, comma-separated. |
| `qaProvider`, `qaModel`, `qaReasoningLevel` | blank | The same for QA and smoke-test threads; blank uses the worker values, and `cheapest` picks the cheapest model the provider lists. |
| `machine` | blank | Machine for new workers; blank uses the lead's machine unless spawn's capacity check moves the job. |
| `environment` | blank | `worktree`, `personal`, `lead` to share the lead's environment, or blank for spawn's choice. |
| `section` | blank | Sidebar section for new workers; blank uses the lead's section. |
| `parentWorkers` | on | Parents workers to the lead so bb tells it when they finish, fail, or need input. |
| `workerReportLines` | `3` | Most lines in a worker's final reply (1–20). |
| `reportMaxBullets` | `5` | Most bullets in a report to you (1–20). |
| `reportStyle` | `bullets` | `bullets` for an outcome line and bullets, or `prose` for one short paragraph. |
| `decisionsAsActionCards` | on | Asks for every decision with an inline action card. |
| `evidenceInline` | on | Shows screenshots and videos in the report instead of describing them. |
| `relayBatching` | `batch` | `batch` sends each thread one combined message; `each` sends requests as they come. |
| `retryLimit` | `2` | Retries of a worker's failed turn, such as a provider 429, before it's reported as blocked (0–10). |
| `mayArchiveOrStop` | off | On: a lead stops and archives the workers it started once their work is handed back. Off: only when you ask. |

### Commands

```bash
bb delegation settings [--json] [--explain]
bb delegation set <key> <value>
bb delegation reset <key>
bb delegation sources [--json]
bb delegation record <key> <value> --from <file> --quote <words> [--note <text>]
bb delegation forget <key> | --all
bb delegation children [--thread <lead-id>] [--json]
bb delegation cascade [--thread <id>] [--json]
```

`settings` prints the effective values and where each comes from; `set` and `reset` change your override. `sources`, `record`, and `forget` manage the values read from your instructions. `children` lists a lead's workers, most urgent first: `needs-input`, `error`, `host-offline`, `retry-queued`, `working`, or `idle`. `cascade` lists every thread that `bb thread archive` would also archive: children, threads it is the lifecycle owner of, and hidden forks, recursively. Both default to the current thread.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-delegation
bb plugin install "path:$PWD/plugins/delegation" --yes
```
