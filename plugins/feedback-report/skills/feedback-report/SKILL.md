---
name: feedback-report
description: Run the bb community feedback report for a period (Discord plus GitHub) and publish it as a dashboard in the Feedback Report plugin. Use when the user asks to run, rerun, refresh, or update the feedback report, the feedback dashboard, or community feedback trends for a date range, or when an automation invokes the feedback report.
---

# Feedback report

Produce one dated report run: collect public feedback, classify every record once, check what shipped, compute the report data, write the narrative, build the dashboard, and import the run into the plugin so it appears in the Feedback report panel.

Every script lives in this plugin's `scripts/` directory (`bb plugin list` shows the install path; the scripts run with Node 22). Every run lives in one directory that follows `docs/run-contract.md`. Read that contract before starting.

## Parameters

- `asOf`: the exclusive end of the window, ISO timestamp. Default: now, rounded down to the hour.
- `weeks`: 2, 4, or 8. Default 4. The window is `weeks` seven-day buckets ending at `asOf`.
- `repository`, `guildId`, `repoPath`, `collaborators`: from the plugin settings (`bb feedback-report config`), or from the prompt when supplied.

Record the effective parameters in `<run>/config.json` first. Never reuse an earlier run's collection as the current one; earlier runs are comparison baselines only.

## Steps

1. **Establish the run.** `runId = <asOf date>_<weeks>w`. Create `<run>/` and write `config.json` with runId, asOf, weeks, periodStart (asOf minus weeks × 7 days), guildId, repository, repoPath, taxonomyVersion `v2`, collaborators.
2. **Collect.** `node scripts/collect.mjs --output <run> --as-of <asOf> --detail-start <periodStart> --guild <guildId> --repo <repository>` with `DISCORD_BOT_TOKEN` in the environment (from the plugin's secret setting or the configured dotenv; never print it). Then `node scripts/prepare.mjs --run <run>`. Coverage failures block the run; report them and stop.
3. **Fetch development state.** `node scripts/github-state.mjs --run <run>` (needs an authenticated `gh`) and `node scripts/commit-ledger.mjs --run <run>` (needs `repoPath` to be a checkout with `origin/main` fetched).
4. **Classify.** `node scripts/make-batches.mjs --run <run> --mode classify`. For each batch file, run one reader worker in parallel with the prompt in `references/classify-prompt.md`, substituting the batch path and the results path. Then `node scripts/merge-batches.mjs --run <run> --mode classify`; fix any validation failure before continuing.
5. **Quality check the classification.** Take a deterministic 40-record sample (24 feedback-kind, 8 praise/question/showcase, 8 maintainer/chatter), label it yourself without looking at the results, and compare. Record agreement counts in `<run>/qc.json`. If area agreement is below 30 of 40, revise the reader prompt's boundary rules and rerun the affected batches.
6. **Resolution check.** `node scripts/make-batches.mjs --run <run> --mode resolve`. For each batch, run one reader worker with `references/resolve-prompt.md`. Then `node scripts/merge-batches.mjs --run <run> --mode resolve`; every rejected reference must be fixed or downgraded to `untracked` before continuing.
7. **Compute.** `node scripts/compute.mjs --run <run>` writes `report.json`. Read it fully.
8. **Write the narrative.** Write `<run>/narrative.json` following `references/narrative-guide.md`: headlines, recommendations, the priority rule text, top asks with status, and the untracked note. Every number in the narrative must appear in `report.json` or be derived from it by a stated rule; write no number you cannot point to. In the same step, fill the empty `meta.method` sentences in `report.json` (`instrumentation`, `qc`, `source`, `moved_note`) from the QC results and the run's context; leave a sentence empty rather than inventing one.
9. **Build and check the dashboard.** `node scripts/build-dashboard.mjs --run <run>`. Open `dashboard.html` (a headless render is enough) and confirm there is no render-error banner, the title shows the period, and every headline and recommendation reads without fractions or undefined values.
10. **Import.** `bb feedback-report import <run>` registers the run with the plugin, which serves the dashboard in the Feedback report panel and lets the user open an agent thread about it. Then `bb feedback-report show <runId>` to confirm.

## Worker rules

- Reader workers are independent: give each exactly one batch file, the taxonomy file, and the reference prompt; they write only their results file.
- Run batches in parallel (spawned bb threads or the provider's subagents). Wait for every result file before merging.
- Workers never use the network and never edit anything outside their results file.

## Completion report

Reply with: the run directory and id, coverage counts, classification QC agreement, resolution status counts (shipped, tracked open, untracked, unclear), the headline titles, and anything the user has to decide.
