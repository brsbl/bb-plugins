---
name: crm
description: Read or update private customer milestones, impact tiers and investor value rankings with bb crm.
---

# CRM

Two independent pipelines share companies, people and interaction notes.
Customers are companies, grouped by potential-impact tier, with a separate
milestone ladder. Investors are people in one value-ranked list, including
company contacts and independent angels. One person can be on both tracks.

Records stay in this plugin's private SQLite database on the bb server's
machine. Never copy real records into a repository, tests, screenshots, public
issues or PRs. Logging an interaction does not send a message.

## Add and update

List existing records first. Use stable import IDs; duplicate IDs fail without
changing anything. All commands support `--json`; failures return a nonzero
exit code and `{ok:false,error:{code,message}}`. Use `--help` for all flags.

```sh
bb crm add company "Acme Example" --id acme --json
bb crm add person "Alex Example" --id alex --company acme --role "Engineering lead" --json
bb crm add track --id acme-customer --company acme --kind customer --person alex --stage "M1 · Relationship" --next "Start a shared channel" --json
bb crm add investor alex --id alex-investor --ask "Introduce the fictional team" --json
bb crm update track alex-investor --next "Arrange a demo introduction" --owner "Sam Demo" --date 2026-10-20 --json
```

A company has at most one customer track. Creating an investor or changing its
rank never starts or advances a customer track. Multiple people at one company
can be investors, with one entry per person. Omit `--company` when adding an
independent angel. An investor entry's `track.id` is its ID for updates and rank
operations. New investors need an existing person; legacy unassigned company
investor tracks remain readable until a contact is assigned.

Customer milestones: **Champion identified → M1 · Relationship → M2 · Value →
M3 · Team → M4 · Team usage + expansion**. Use the full label with
`update track ID --stage …`. Capture monetization signals at M3 in the next step
or interaction notes. Investor progress is rank; there is no investor milestone
ladder in the view.

## Score and prioritize

Each criterion is an equally weighted integer **0–5**: 0 means no current
signal, 5 means strongest potential. `active-people` is a strength score, not a
headcount. Store evidence and judgment in `--why`; do not invent evidence.
Omitted fields are preserved; unset scores display as — and contribute zero.
Totals are out of 20. `--clear-scores` clears all four before applying any
supplied scores. It does not clear a manual rank/tier override.

```sh
bb crm score customer acme --champion-strength 5 --room-to-grow 4 --case-study-value 5 --active-people 3 --why "Fictional team has room to expand" --json
bb crm score investor alex-investor --company-scale 3 --social-proof 4 --introductions 5 --co-marketing 2 --why "Fictional warm introductions" --json
```

Customer tiers derive from the total: **Tier 1 ≥15, Tier 2 ≥8, Tier 3 <8**.
Unscored customer companies start in Tier 3 and remain visibly unscored.
Milestones do not change when a tier changes. `tier set COMPANY_ID --tier 1|2|3
--why "…"` overrides the tier; `tier auto COMPANY_ID` restores the derived tier
and preserves the rationale. Add the company's customer track before scoring.

Investor ranks follow descending totals. Ties retain the initial order; new
entries start at the end. A manual rank pins an entry to a position; other
unpinned people continue to follow totals. Moving an entry shifts intervening
positions, including other manual positions. The view labels overrides Manual.

```sh
bb crm list --type investors --json
bb crm rank set alex-investor --rank 1 --why "Fictional time-sensitive opportunity" --json
bb crm rank move alex-investor --direction down --why "Another fictional contact is more valuable now" --json
bb crm rank auto alex-investor --json
```

Use `rank set` in top-to-bottom order to import an existing judgment-based
ranking. Use `rank auto` on entries that should follow scores again. The view
lets brsbl select a rank or tier, provide a reason, Save, or restore score order.

## Park an investor

Parking hides an entry from the ranking and heatmap by default. It preserves
scores, rationale, asks, notes and the person; customer visibility is unchanged.
Use the entry's `track.id`, not the person's ID. The view's **Show parked (N)**
toggle reveals parked entries and their history.

```sh
bb crm park alex-investor --reason "Outside the fictional top ten" --json
bb crm list --type investors --status parked --json
bb crm list --type investors --status all --json
bb crm unpark alex-investor --reason "Fictional conversation resumed" --json
```

`--reason` is optional, up to 2000 characters; omitting it keeps the last
status reason. Parking clears that entry's manual rank. Unparking returns it
to score order among unpinned entries; other manual positions remain in force.
Repeated park/unpark requests are safe. Scoring a parked entry keeps it parked;
unpark before using rank commands. `statusReason` is separate from score `why`.

Investor lists default to `--status active`. Active ranks run from 1 to N;
parked rows have `parked:true` and `rank:0` (unranked), and follow active rows in
`--status all`. `rankCount` counts all active entries and `parkedCount` counts
all parked entries, independent of pagination or search. Original people,
tracks and interaction lists always retain parked investors' records.

## Migration and compatibility

Upgrade retains all companies, people, track IDs, contacts, asks, owners,
dates and notes. Existing investor tracks become ranked entries in their
previous CRM display order until scores or CLI rank operations establish an
order. Previous investor stages, including unknown values, are preserved in
History. No real scores or reasons are inferred during migration. Upgrading from
4a05713 leaves every existing investor active and preserves its scores and
manual position; parking is always an explicit action.

Existing `add track --kind investor`, `update track`, `list --type tracks` and
`view` RPC remain available for existing agents. Investor `--stage` is legacy
metadata, not rank; new workflows should use `add investor`, scores and ranks.
Legacy company investor tracks retain their company association and stable IDs.
For person-based investor entries, changing the person's company preserves the
entry and old notes. Clear any company-track contact assignments before moving
a person; a person entry must continue to use that person as its contact.

The earlier customer migration remains: Shared channel / Champion engaged →
M1 · Relationship; Usage deep-dive → M2 · Value; Expanding / Case study → M4 · Team
usage + expansion. Unknown stored milestones stay readable.

## Read and log

`list --type companies|people|tracks|interactions|customers|investors` returns
`{items,nextOffset}` (priority lists also include totals). Follow `--offset`
until `nextOffset` is null; default 50, maximum `--limit 100`. Investor ranks
are global even on later pages. Original record types accept `--company` and
`--person` filters. Priority lists expose the criterion scores, total, current
rank/tier, manual override and rationale.

`log` needs `--company` or `--person`, `--kind message|call|intro`, `--date
YYYY-MM-DD` and `--note` (1–2000 characters). A person's current company is
recorded automatically. Optional `--track customer|investor` adds context.
Use stable `--id` values on imported notes to prevent duplicates.

`update company ID --name …` renames a company; `update person ID --name …
--role … --company …` changes a person. `--clear-company` makes them independent
when company-track assignments permit it. `update track ID --clear-date`
clears a deadline; empty `--next ""` / `--owner ""` clears that field.
`--note-stdin`, `--next-stdin` and `--ask-stdin` accept multiline input.
