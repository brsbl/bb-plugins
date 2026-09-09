# Writing narrative.json

The dashboard renders two kinds of block. Data blocks come from `report.json` and never change by hand. Narrative blocks are written once per run from the data, and this guide is their contract. Write `narrative.json` with exactly these keys.

```json
{
  "headlines": [["good" | "critical", "<claim>", ["<evidence bullet>", "..."], null | "sentiment-share"], ...],
  "recs": [["P1" | "P2" | "P3", "<recommendation>", "<area>", <people_pct>, <open_pct>, <close_pct>, ["Why: ...", "Status: ...", "What: ..."], <resolved_pct>], ...],
  "rec_rule": "<one or two sentences>",
  "asks": { "<area>": ["<top asks, semicolon separated>", "<status on asOf>"], ... },
  "untracked_note": "<one sentence>"
}
```

## Rules for every sentence

- Percentages, not fractions. Write "59% requests", never "34 of 58". Counts are allowed only for people ("12 people praised it") and for named items ("6 bugs").
- Each number must exist in `report.json` or follow from it by a rule stated in this guide. Do not compute new statistics.
- Say "feedback" for the unit. Do not say topic, thread, or issue unless you mean a GitHub issue specifically.
- Plain words for sentiment: "of the people who praised or complained, 88% praised". Never "people with a tone".
- Say "the two weeks after X compared with the two before"; never "fortnight over fortnight".
- No em dashes. No word salad: one claim per sentence.

## Headlines

Five to seven, in this order, so they read as a story. Pick from these candidates and keep only those the data supports; the first and the last are always present.

1. **State.** Steady or moving demand and sentiment. Evidence: weekly feedback within N% of the average (max deviation over mean); weekly reporters within N%; praise share range across weeks; resolved share overall with the GitHub close rate and median days; tracked and untracked shares.
2. **Community change.** Share of the latest half's reporters who first appeared in that half, when `report.json` carries it.
3. **What moved.** Any area whose two-period change is signal (`areas[].signal`). If none, say so in one line.
4. **Who moved it.** Only when the report carries cohort data for that area (engaged-core shares); otherwise omit.
5. **Where praise and complaints cluster.** Use theme `praise_share` and `complaint_share`; set the chart flag to `"sentiment-share"`.
6. **Least-served demand.** The area with the lowest close rate among areas reaching at least 9% of people, and what plan it points at.

Mark a headline "critical" when it names a problem, "good" otherwise.

## Recommendations

Compute priority mechanically from `areas[]` with the rule in the run contract and print that rule as `rec_rule`, with the totals it uses (people count, open count, overall close rate). One recommendation per area that qualifies as P1 or P2, plus at most two P3 fixes. Sort P1 before P2 before P3.

Each recommendation has:
- A verb-first title naming the product move, not the metric.
- "Why": the two or three numbers that put it here (people %, close rate, open %, aging %, bugs or requests %).
- "Status": what shipped against this area's asks since the window started, with dates, from `resolution.csv` and `github/issues.json`; name open issue numbers.
- "What": the specific asks, restricted to ones made independently by more than one person, or the bug clusters with their counts. If the cluster list is a single catch-all bin, say sizing is unavailable.

The chips come from `areas[]`: people_pct, open_pct, close_pct, res.resolved_pct.

## Asks

For each area with at least 25 feedback items, the top asks in the users' words (three to five, semicolon separated) and a status line: which shipped (with dates), which are open. Derive status from `resolution.csv` and issue states, never from memory.

## Untracked note

One sentence with the count and share of feedback that has no issue and no commit (`totals.res.untracked`, `untracked_pct`), and the process fix it implies.
