---
name: report-results
description: Turn delegated workers' results into a short report for the user, with batched bullets, evidence shown inline, decisions as action cards, and factual concerns flagged once. Use when passing on what workers found or built, when a batch of workers finishes, or when the user asks for the outcome of delegated work. comms owns general writing style and inline-action-cards owns card mechanics; this skill owns what a lead passes on from its workers.
---

# Report results

## Read the settings first

```sh
bb delegation settings --json
```

The values come from the user's own instructions first. If `bb delegation sources --json` shows `checkedAt` as null, or `~/.bb/AGENTS.md`, `~/.claude/CLAUDE.md`, or a memory note changed after it, refresh them with `delegation-defaults` before using them.

This skill uses `reportStyle`, `reportMaxBullets`, `decisionsAsActionCards`,
`evidenceInline`, and `workerReportLines` from its output.

## When to report

Report when a set of related workers is done, or when one needs a decision
from the user. A worker that finishes while others still run doesn't need its
own report unless it changes what the user should do now.

## Shape

With `reportStyle` set to `bullets`:

1. One line with the outcome, following `comms`.
2. At most `reportMaxBullets` flat bullets, one per result, phrased as its
   effect. Link each worker as `@thread:<id>` and each PR as a Markdown link.
3. Evidence, then decisions, last.

With `prose`, write one short paragraph in the same order.

## Show the evidence

When `evidenceInline` is true, render the worker's screenshots and videos in
the message with `![What it shows](/absolute/path.png)`, instead of describing
them or hiding them behind links. Use each file where the worker left it;
never move, overwrite, or delete a screenshot that has been shown.

## Decisions

When `decisionsAsActionCards` is true, every decision the user owes becomes
an action card through `inline-action-cards`. Put the options and your
recommendation in a line or two before the card. Don't also ask in prose.

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

```markdown
Both fixes are up for review; one needs your call on the icon.

- Sidebar dots now match thread status: [PR #412](https://github.com/brsbl/bb-plugins/pull/412), CI green (@thread:thr_abc123)
- The empty-state copy is updated, but CI is red on an unrelated lint step: [PR #413](https://github.com/brsbl/bb-plugins/pull/413) (@thread:thr_def456)

![Sidebar with status dots on three threads](/path/from/worker/after.png)

Pick the icon for the empty state. I recommend the outline one; it matches the sidebar.

::action{id="empty-state-icon"}
```
