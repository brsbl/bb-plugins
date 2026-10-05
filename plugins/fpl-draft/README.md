# FPL Draft

Follow your Fantasy Premier League Draft league’s matches and standings, compare
waiver options, and ask an agent about the current view without copying a report.

![FPL Draft waiver suggestion with expanded player comparison](https://github.com/user-attachments/assets/ea04832a-1a7f-4fdc-bcf7-66b85b951611)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/fpl-draft --yes
```

Set your league ID or league URL from `draft.premierleague.com` in plugin settings,
then your team, manager name, or initials. No credentials are needed: league data
is public given the league ID.

## Use

- **Matches:** open a matchup to see both squads in formation and each player’s
  gameweek points. Live views refresh every minute; Refresh updates scores on demand.
- **Table:** see league points, results, fantasy points, and recent form, with your
  team highlighted. Tied league points are ordered by fantasy points.
- **Waivers:** compare suggested replacements, fallbacks, and an estimated claim
  order. Expand a claim to compare player stats. Suggestions consider the full
  squad, including settled transfers since the last published lineup.
- **Ask agent:** append a short question and a native context pill while preserving
  your draft. Gameweek scores and standings resolve when you send. Waiver pills
  retain their league and team and resolve the current plan, fallbacks, and order
  estimate. You can also find gameweeks through `@FPL Draft` in the composer.

Waiver suggestions use [evidence rules](docs/waiver-rules.md), not points or Form
alone. Rival demand and future order are estimates; pending claims are unavailable.
Enter claims manually in FPL Draft. Failed refreshes preserve the previous view
with a Retry action.

See the [waiver-order evaluation](docs/waiver-order-evaluation.md) for the estimate’s
observed results and limitations.

## Develop

From the repository root, the focused package check is:

```bash
npm run check --workspace=bb-plugin-fpl-draft
```
