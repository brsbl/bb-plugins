# Run directory contract

Every report run lives in one directory. Scripts read and write only these paths. `runId` is `<asOf date>_<weeks>w`, for example `2026-09-02_4w`.

```
<run>/
  config.json                  runId, asOf (ISO, exclusive end), weeks, periodStart, guildId, repository, repoPath, taxonomyVersion, collaborators[]
  raw/discord.json             scripts/collect.mjs
  raw/github.json              scripts/collect.mjs
  working/normalized-observations.json   scripts/prepare.mjs (one record per Discord message, GitHub issue, GitHub comment)
  classification/batches/batch-N.jsonl   scripts/make-batches.mjs --mode classify
  classification/results/batch-N.jsonl   written by reader agents (see skill)
  classification.jsonl         scripts/merge-batches.mjs --mode classify  (one line per record: id, kind, area, cluster, sentiment, confidence)
  github/issues.json           scripts/github-state.mjs  (issues updated since periodStart minus 60 days: number, title, state, createdAt, closedAt, authorAssociation, author, body, closedByPullRequestsReferences count)
  github/prs.json              scripts/github-state.mjs  (merged PRs in the window: number, title, mergedAt, mergeCommit, closingIssuesReferences numbers)
  commits/ledger.csv           scripts/commit-ledger.mjs --repo <repoPath> (first-parent commits on origin/main in the window, one v1 area each by path map, closes_issues joined from prs.json)
  resolution/batches/batch-N.jsonl       scripts/make-batches.mjs --mode resolve  (Discord feedback topics with text, plus commits.txt and issues.txt reference files)
  resolution/results/batch-N.jsonl       written by reader agents
  resolution.csv               scripts/merge-batches.mjs --mode resolve  (one line per feedback topic: status shipped | closed-no-pr | tracked-open | untracked | unclear, ref, ref_date, confidence)
  report.json                  scripts/compute.mjs  (data blocks: meta, weeks, weekly, areas, themes, totals)
  narrative.json               written by the report agent from report.json (headlines, recs, rec_rule, asks, untracked_note)
  dashboard.html               scripts/build-dashboard.mjs  (template + report.json + narrative.json)
```

Definitions the scripts implement (unchanged from the 2026-09-02 reanalysis):

- Feedback unit (topic): one GitHub issue with its comments (`gh#<n>`), one Discord thread (`dc-thread-<threadId>`), or one standalone channel message (`dc-msg-<messageId>`), counted once. A record is feedback when its kind is bug, request, or complaint.
- Community filter: records by configured collaborators (GitHub login or Discord username) are excluded from feedback, sentiment, and issue series.
- Agent-filed: GitHub records whose body contains `AGENT GENERATED`; kept inside feedback, exposed as a column.
- Weeks: seven-day buckets anchored to `asOf`, counting back `weeks` buckets. Week index 0 is the earliest.
- People: unique reporter ids with a feedback record. People % is of all such people in the window.
- Open: community GitHub issues opened in the window and still open at asOf (a close after asOf counts as open). Aging = open more than 14 days at asOf.
- Close rate: share of an area's community issues opened in the window that closed by asOf. Median days to close over the closed ones. Closed-by-PR uses `closedByPullRequestsReferences`.
- Resolved: share of an area's feedback topics whose status is shipped or closed-no-pr.
- Sentiment: unique authors per week with a positive or negative record of any kind; praise share = positive / (positive + negative).
- Noise band: a two-period change (latest half of the window vs the earlier half) is signal when |delta| > 2·sqrt(prior + latest).
- Taxonomy v2: each record's `area_v2` and `theme` come from its v1 area and cluster through the map in `taxonomy-v2.json`; records with an empty cluster map to `<theme>: unspecified`.
- Development: first-parent commits on origin/main by committer date; one v1 area per commit by lines changed through an ordered path-prefix map, at least 50% of product lines in one area or `Cross-cutting`; shared packages do not vote. Reported per theme.
- Priority rule for recommendations: P1 = People % at least 14 and close rate under 60; P2 = People % at least 9 and (rising outside noise or aging share at least 40); P3 otherwise.

`report.json` also carries the fields the dashboard template fills into its Method tab and tiles:

- `meta`: `runId`, `asOf`, `periodStart`, `weeks`, `repository`, copied from `config.json`.
- `meta.method`: free-text sentences `sources` and `development` filled by `compute.mjs` from the raw counts and the ledger; `instrumentation`, `qc`, `source`, and `moved_note` start empty and are filled by the report agent alongside `narrative.json`. Empty strings render as nothing.
- `totals.closed_by_pr_pct`: share of closed community issues closed by a merged PR.
- `totals.res.discord_resolved_pct`: share of Discord feedback whose status is shipped or closed-no-pr.
