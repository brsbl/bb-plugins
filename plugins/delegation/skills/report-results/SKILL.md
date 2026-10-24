---
name: report-results
description: Turn delegated workers' results into a short report for the user, with batched bullets, evidence shown inline, decisions as action cards, and factual concerns flagged once. Use when passing on what workers found or built, when a batch of workers finishes, or when the user asks for the outcome of delegated work. Optional comms and inline-action-cards skills extend writing style and card mechanics; this skill owns what a lead passes on from its workers.
---

# Report results

## Read the settings first

```sh
bb delegation settings --json
```

The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them, but only on the machine its `host` names, or this machine when `host` is null (this machine is `thread.environment.hostId` in `bb status --json`). On any other machine, use the recorded values as they are: its files aren't the ones they came from.

This skill uses `reportStyle`, `reportMaxBullets`, `decisionsAsActionCards`,
`evidenceInline`, and `workerReportLines` from its output.

## When to report

Report when a set of related workers is done, or when one needs a decision
from the user. A worker that finishes while others still run doesn't need its
own report unless it changes what the user should do now.

## Who reports what

With `reportTo` set to `lead`, workers put decisions in their reports and the
lead raises them. Gather every pending decision from your reports into one set
of questions in your own thread. When action cards are installed, use them
and resolve duplicate cards (`bb action-cards resolve <id> --thread <worker>`).
Otherwise ask each decision once in plain text and relay the answer.

With `reportTo` set to `user`, workers report to the user directly and keep
their own cards. Don't re-summarize their reports. Report only what crosses
teams and the decisions that need you to coordinate.

## Shape

With `reportStyle` set to `bullets`:

1. Lead with the single next decision when there is one; otherwise one line
   with the outcome. Follow `comms` if installed; otherwise use plain language,
   concrete results, and short sentences.
2. At most `reportMaxBullets` flat bullets, one per result, phrased as its
   effect. Link each worker as `@thread:<id>` and each PR as a Markdown link.
3. Evidence, then decisions, last.

With `prose`, write one short paragraph in the same order.

Name a PR by what it does, with its number only as the link, such as "[the
sidebar dots fix](https://github.com/…/pull/412)", never "PR #412". Batch
updates into short executive briefs at natural milestones rather than one
message per worker event.

## Show the evidence

When `evidenceInline` is true, render the worker's screenshots and videos in
the message with `![What it shows](/absolute/path.png)`, instead of describing
them or hiding them behind links. Use each file where the worker left it;
never move, overwrite, or delete a screenshot that has been shown.

## Decisions

When `decisionsAsActionCards` is true and `inline-action-cards` is installed,
use a card with the options and recommendation. Otherwise ask one concise
question in the conversation and wait for the answer. Never emit a card
directive without a tool-created card.

## Flag concerns once

When a worker's claim doesn't match the evidence, such as "CI green" on a red
PR or a screenshot that doesn't show the fix, say so in one bullet with the
evidence. Don't repeat it in later reports unless it changes.

## Leave out

- The worker's full output, its process, or anything it already showed the
  user.
- Workers the user didn't ask about.
- A repeat of an earlier report.

## As a worker

When you are the worker, your final reply is your report: at most
`workerReportLines` lines with the result, a PR link if any, and the blocker.

## Example

```text
The export update is ready for review.

- CSV export now includes column headers; link the verified PR and its checks.
- A second worker needs a decision on which date format to support.

Which date format should exports use? I recommend ISO dates for sorting.
```
