# Next waiver order: behavior and limits

The estimate sorts cumulative head-to-head points ascending, then cumulative
fantasy points ascending. Exact ties retain a range. It describes the first
round if current scores hold; it does not predict remaining fixtures or reveal
pending claims.

## Synthetic regression coverage

[The fixture](../fixtures/waiver-order.json) invents four managers and three
weeks of scores. One manager loses each week, one wins, and two remain tied.
The tests check ordering at each cutoff, tied ranges, locked starting-XI live
points, missing results, unsupported rules and expired windows.

These invented cases verify calculation behavior. They are not empirical
validation against a live league, evidence of forecast accuracy or a confirmed
future processing order.

## Product limits

- Unsupported rules, preseason, missing match coverage, missing live lineups or
  scores, and a passed next-window deadline fall back to the last published
  position or an unavailable state.
- Completed weeks use match totals. Live weeks sum the locked starting XI and
  refresh every minute. Bonus changes and automatic substitutions may change
  the final result.
- Rival demand uses current rosters and estimated order ranges. Missing rival
  rosters leave demand unavailable.
- Enter claims manually on the Fantasy Premier League Draft website.
