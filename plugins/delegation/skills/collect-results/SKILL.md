---
name: collect-results
description: Wait for delegated bb workers without polling, read their final replies and artifacts, and catch stalls and errors such as provider 429s and retry them. Use after delegating, when bb tells the lead that a worker finished, failed, or needs input, or when the user asks whether workers are done or what one found. report-results owns what reaches the user; bb-thread-status-report owns status reports across every running thread.
---

# Collect results

## Read the settings first

```sh
bb delegation settings --json
```

The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them, but only on the machine its `host` names (this machine is `thread.environment.hostId` in `bb status --json`). On any other machine, use the recorded values as they are: its files aren't the ones they came from.

This skill uses `retryLimit` from its output.

## Wait without polling

- bb tells a parent when its worker finishes, fails, or is interrupted. If
  nothing else needs doing, end the turn and let that notification wake you.
- Only when your next step needs a result in this turn, block on it once:
  `bb thread wait <id> --timeout 20m`.
- Never loop on `sleep`, `bb thread show`, or `bb thread log`, and never message
  a worker to ask how it's going.

## See every worker at once

```sh
bb delegation children          # or --json, or --thread <lead-id>
```

It lists the lead's workers, most urgent first, as `needs-input`, `error`,
`host-offline`, `retry-queued`, `working`, or `idle`.

## Read a finished worker

1. `bb thread output <id>` is the worker's report.
2. `bb thread show <id> --json` gives its branch, environment, and PR status.
3. Before passing a claim on, check the ones the user will act on: the PR
   exists, its CI state, and that the screenshots or files it names exist and
   show what it says.
4. Read `bb thread log <id>` only when the output is missing, contradicts
   itself, or the worker errored.
5. In the same turn, report through `report-results`, then follow
   `thread-lifecycle` for the finished worker: with `mayArchiveOrStop` on, it
   stops and archives the worker once nothing it owns is still needed.

## Handle stalls and errors

| State | What to do |
| --- | --- |
| `needs-input` | Read it with `bb thread interactions list <id>`. You may `answer` a question only when the user's own words already answer it. Never `approve`, `grant`, `deny`, or `respond` to a command, file change, plan, permission, or plugin form yourself: each one is a decision for the user through `report-results`, resolved with `relay` after they decide. |
| `error` | First check `bb thread queue list <id>`: if a retry is already queued, treat it as `retry-queued`. Otherwise find the cause in `bb thread log <id> --limit 3`. For a transient provider failure (429, overloaded, 5xx, dropped connection), run `bb thread retry <id> --reason "<cause>"`, up to `retryLimit` times per worker. Don't retry auth, configuration, or task failures; report them as blocked. |
| `error`: Account Pooler 429, "No Account Pooler account eligible … next available at <time>" | Not a failure to count: wait once in the background until that time (`bb thread retry <id> --send-at <time> --reason "pooler window"`), and don't count it against `retryLimit`. |
| `error`: "504 bb connect: timed out waiting for the tunnel client" | Retry after a pause of a few minutes. After `retryLimit` such retries on one thread, don't just report it as blocked: suggest a host check or a handoff to a fresh thread. Remember the host's concurrency limit queues sends, so a burst of relays can look stalled. |
| `retry-queued` | A retry is already queued, usually by the Provider Retry plugin after a provider limit or overload. Leave it and don't run `bb thread retry` too; `bb thread queue list <id>` shows when it runs. |
| `host-offline` | The worker's machine is asleep or disconnected. Retrying won't help. Mention it once if it blocks the user. |
| `working` with no new events for 30 minutes or more | Read the last turn with `bb thread log <id> --limit 1`. If it is stuck on a hung command or a wrong path, steer it once with `relay`. |

After `retryLimit` retries, stop retrying and report the worker as blocked,
with the error.

## Keep it to what the user needs

Collect results to act on them. Pass on only what the user asked about or
must decide, through `report-results`. Don't summarize workers the user didn't
ask about, and don't retell messages already visible in the thread.
