# FPL Draft

FPL Draft adds a BB sidebar panel for a Fantasy Premier League Draft league: a
live view of every head-to-head matchup and the table, and a recommended waiver
plan that pairs your weakest players against the best available replacements.

![Every matchup in a gameweek, opening into both squads laid out in formation with club colours](docs/matches.png)

## Use

Set your league in plugin settings — the league id, or the whole league URL from
`draft.premierleague.com` — then your team, manager or short name.

**Matches** lists every matchup by the higher team score, highest first. Equal
scores keep their existing order. Open any of them —
several at once if you like — by clicking the row to see both squads in formation,
each player's card headed by their club's colours and carrying that week's
points. **Ask agent** opens a draft with a gameweek mention pill; its scores and
current table resolve from the plugin when you send. You can also find gameweeks
through `@FPL Draft` in the composer.

**Table** gives the standings their own page: league points, played, won, drawn,
lost, fantasy points scored, and the last five results. Cells are centered, and
your row is highlighted. The table fills the panel: rank stays narrow, Team and
Form get more room, and stats share the remaining width. Narrow panels scroll
horizontally. Rank arrows appear only after movement.

![League standings with centered stats and recent form](docs/table.png)

![Your weakest spots numbered on the pitch and listed with reasons, beside the claims to submit in order, each with the rivals ahead of you in the waiver order and its fallbacks](docs/waivers.png)

**Waivers** answers two questions. *Weakest spots* numbers the problems in
your squad, worst first — injured, suspended, doubtful, barely playing, or
simply outscored by someone free — and marks each on the pitch. *Suggested
waivers* lists possible swaps in priority order, because Draft only permits
like-for-like positional swaps. Each card leads with the position and shows the
outgoing player → incoming player, with their clubs. Position and priority sit
in the header; points, minutes and fixtures share a separate footer. Points and
minutes read in that same order. Cards show the two players'
published FPL points per match and total minutes, and the fallbacks to name if the first choice is
taken. Cards fill the Suggested waivers column.
The next-window waiver estimate uses league points and fantasy points, with
ranges for ties. Rival demand uses those projected positions. Click anywhere on a
claim card, or focus it and press Enter or Space, to expand or collapse
the full comparison, including Form, xG, xA, clean sheets and defensive contributions.
Card stats use published FPL values; missing values display a dash. The weak-spot
list shows total season points and minutes.
Suggestions use [programmatic evidence rules](docs/waiver-rules.md) across the
full squad. Supported upgrades precede depth options; higher points or Form alone
do not establish an upgrade. Fallbacks pass the same rules. Reserve upgrades count,
and weakness ranks do not favor the latest starting lineup. The plan covers one
replacement per position, and rival demand is estimated. Enter claims manually in FPL Draft.
On narrow screens, claims appear first.
The pitch shows your gameweek team total, each player’s points, and the red weakness ranks.
All views share the same content frame, with Ask agent and Refresh aligned at
its right edge. Content scrolls within that frame. Labels have no tooltips. Pitches stack on narrower screens
to preserve the formation, and navigation and actions share compact control sizes.
Failed refreshes keep the previous suggestions visible with a Retry action.

The [three-week evaluation](docs/waiver-order-evaluation.md) matches two processed
rounds' observable order and the third week's published queue. Live estimates
assume current starting-XI scores hold; missing data keeps a labeled historical view.

The squad shown here is the one you hold *today*. Draft publishes no lineup for
a gameweek that has not started, so any waiver or trade settled since the last
one is replayed over it — otherwise the plugin would suggest dropping players
you no longer own.

A player's availability and their playing time are separate signals: an
exclamation marks someone injured or suspended, a warning triangle marks a
doubt, and a muted card marks anyone averaging under 30 minutes a game. A
player can carry both.

Nothing is submitted for you. The plugin cannot see anyone's pending claims —
nobody can — so competition is inferred from who has a hole, never asserted.

*Ask agent* adds a short question and a context pill, preserving your existing draft.
Waiver pills keep the selected league and team; the current plan, fallbacks, and
order estimate resolve when you send. Gameweek pills work the same way for matches and standings.

## Install

From this repository:

```bash
npm ci
bb plugin install "path:$PWD/plugins/fpl-draft" --yes
```

No credentials are needed. Draft league data is public given the league id.

Opening the plugin or switching pages refreshes upstream data before loading the view.
Live scores also refresh every minute while a live view is open.

## Develop

Run the focused package check from the repository root:

```bash
npm run check --workspace=bb-plugin-fpl-draft
```
