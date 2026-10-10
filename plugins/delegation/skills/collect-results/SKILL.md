---
name: collect-results
description: Wait for delegated bb workers without polling, read their final replies and artifacts, and catch stalls and errors such as provider 429s and retry them. Use after delegating, when bb tells the lead that a worker finished, failed, or needs input, or when the user asks whether workers are done or what one found. report-results owns what reaches the user; bb-thread-status-report owns status reports across every running thread.
---

# Collect results

## Read the settings first

```sh
bb plugin config delegation --json
```

This skill uses `retryLimit` from `values`.

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

## Handle stalls and errors

| State | What to do |
| --- | --- |
| `needs-input` | Read it with `bb thread interactions list <id>`. If the user's instructions already answer it, answer it. Otherwise it becomes a decision for the user through `report-results`. |
| `error` | Find the cause in `bb thread log <id> --limit 3`. For a transient provider failure (429, overloaded, 5xx, dropped connection), run `bb thread retry <id> --reason "<cause>"`, up to `retryLimit` times per worker. Don't retry auth, configuration, or task failures; report them as blocked. |
| `retry-queued` | The Provider Retry plugin already queued a retry for after a subscription limit resets. Leave it; `bb thread queue list <id>` shows when. |
| `host-offline` | The worker's machine is asleep or disconnected. Retrying won't help. Mention it once if it blocks the user. |
| `working` with no new events for 30 minutes or more | Read the last turn with `bb thread log <id> --limit 1`. If it is stuck on a hung command or a wrong path, steer it once with `relay`. |

After `retryLimit` retries, stop retrying and report the worker as blocked,
with the error.

## Keep it to what the user needs

Collect results to act on them. Pass on only what the user asked about or
must decide, through `report-results`. Don't summarize workers the user didn't
ask about, and don't retell messages already visible in the thread.
