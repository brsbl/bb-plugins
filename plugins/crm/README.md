# CRM

Keep customer and investor conversations, people, and next steps together.

![Customer and investor tracks grouped by company, with an independent angel](https://github.com/user-attachments/assets/c730cdcb-8e12-464b-9d29-65e521a20367)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/crm --yes
```

## Use

Open **CRM** for two independent pipelines. Customers are grouped by impact
tier, with a milestone showing progress. Investors are people in one stack
ranked by value. Both heatmap tables show four numeric criterion scores,
the total, rationale and next step or ask. Select a tier or rank to override it.

Agents maintain records through `bb crm add/update/list/log --json`, set scores
with `score customer` / `score investor`, and adjust priority with `tier
set/auto` and `rank set/move/auto`. See the [CRM skill](skills/crm/SKILL.md) for
examples, scoring rules, stable import IDs and pagination.

Each criterion is 0–5, equally weighted. Customer totals out of 20 produce
Tier 1 (15+), Tier 2 (8+) or Tier 3; unscored companies start in Tier 3. Investor
ranks follow totals with stable ties and optional manual positions. Neither
track changes the other.

Customer milestones remain **Champion identified → M1 · Relationship → M2 ·
Value → M3 · Team → M4 · Team usage + expansion**. Upgrades preserve every track,
person and note, and retain old investor stages in History. Existing CLI record
commands remain available; investor stages are legacy metadata.

Records stay in CRM's private plugin database on the machine running the bb
server. There is no external sync or message sending. Scores and records are edited through
the CLI; the view also supports rank and tier overrides. There is no deletion.

## Develop

From the monorepo root:

```bash
npm ci
```

Run `npm run check --workspace=bb-plugin-crm` in remote CI. Use the CI-built
artifact for an isolated bb dev server and verify the view with fictional data.
