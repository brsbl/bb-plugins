# Claims card: next waiver estimate

Show **Next window · Est. N of 12**, using the next unprocessed waiver window.
The candidate has a meaningful signal: it matches every observable relative
ordering in two processed rounds and all 12 published positions after the third
completed week, allowing a range for a tied pair. This is an as-it-stands
first-round estimate, not a forecast of remaining fixtures or a confirmed queue.

## Evidence

League 24738, captured September 9, 2026. The last three completed weeks are
GW1–GW3. Only existing product endpoints were used: bootstrap, league details,
transactions, event live scores, and entry picks.

Historical starting-XI totals match official scores for all 12 managers in each
week: **36 of 36**. These are settled scores, not saved live snapshots.
The candidate sorts cumulative head-to-head points ascending, then cumulative
fantasy points ascending. Exact ties retain a range. Lowest-ranked-first follows
the [official FPL Draft guide](https://www.premierleague.com/en/news/1245444/fpl-draft-what-you-need-to-know).

| Score cutoff | Next window | Independent comparison | Result |
| --- | --- | --- | --- |
| GW1 | GW2 | First processed request for 8 managers | 28/28 comparable pairs |
| GW2 | GW3 | First processed request for 9 managers | 36/36 comparable pairs |
| GW3 | GW4 | Current published queue for all 12 managers | 12/12 positions within estimated ranges |

For the seven managers observed in both processed rounds, carrying forward the
previous order gets 15/21 pairs right; the candidate gets 21/21. Pairs share
managers and are not independent trials. The third row compares FPL's independently
published `waiver_pick` values with scores through GW3. It is **not** a completed
GW4 transaction round; those waivers have not run. Ten ranks are exact; two
managers tied on both scores occupy the estimated range 9–10. Banana Breath's
estimate is **6 of 12**, matching its published position.

The earlier decision withheld the estimate because three full *processed*
orders were unavailable. That was stricter than the requested meaningful-signal
gate and overlooked the current published queue as a separate comparison after
GW3. Do not reuse it as historical ground truth for GW1 or GW2.

[Recorded evidence](waiver-order-evidence.json) includes score cutoffs, first
processing indices, lineup checks, and the independently captured current queue.
`waiver-order.test.ts` reruns the same production calculation against these
observations remotely. Missing requests are not filled in with invented ranks.

## Product behavior and limits

- The estimate is limited to the evaluated head-to-head waiver rules. Unknown
  rules, preseason, missing match coverage, missing live lineups/scores, or a
  passed next-window deadline retain **Last published** or **Order unavailable**.
- Completed weeks use official match totals. Live weeks sum the locked starting
  XI from existing picks and live scores, refreshing once a minute. They do not
  predict remaining fixtures, bonus changes, or automatic substitutions. No
  historical live snapshots exist to measure that forecast accuracy.
- Projected rival demand uses current rosters and estimated next-order ranges;
  tied positions can produce a range of rivals ahead. Missing rival rosters show
  demand unavailable. Existing published-pick RPC fields retain their meaning;
  a separate additive RPC supplies the estimate.
- Accessible labels identify the target gameweek and score basis. Detailed
  limitations stay in the agent context. There is no confidence
  percentage or claim that GW4 processing has already been validated.
- Cards retain equal widths bounded by the available column. Open FPL Draft
  takes the user to the site to enter claims manually.

Coverage exercises historical/missing fallbacks, tied and live estimates,
projected demand, the server RPC, and the three cutoff comparisons. Browser
verification covers the real card at 1400×900 and 900×900, including expansion,
reload, and estimate/fallback states.
