# CRM

Keep customer and investor conversations, people, and next steps together.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/crm --yes
```

## Use

Open **CRM** in bb to see customer and investor conversations grouped by company,
with people, stages, owners and dated next steps. Independent angels appear in
the same list. Search by company or person, filter by track, and expand History
for messages, calls and introductions.

Agents keep the pipeline current through `bb crm add`, `update`, `list` and
`log`. Every command supports `--json`. See the [CRM skill](skills/crm/SKILL.md)
for command examples, stage names, stable import IDs and pagination.

Records stay in CRM's private plugin database on the machine running the bb
server. There is no external sync or message sending. The MVP uses the CLI for
editing and does not include deleting records.

## Develop

From the monorepo root:

```bash
npm ci
```

Run `npm run check --workspace=bb-plugin-crm` in remote CI. Use the CI-built
artifact for an isolated bb dev server and verify the view with fictional data.
