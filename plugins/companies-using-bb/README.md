# Companies using bb

See which companies use bb, from public GitHub and Discord activity, updated daily.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/companies-using-bb --yes
```

## Use

Open **Companies using bb** for a table of companies whose people open GitHub issues
or PRs, post in Discord, or share a Slack Connect channel. Filter by plan or region,
search for a company or person, and sort any column. Each count opens the people or
items behind it.

Load the first table from a snapshot file on the machine running the bb server:

```bash
bb companies-using-bb import ./snapshot.json
```

The table then updates every day at 6:00, and on startup when that run was missed.
An update reads GitHub issues and PRs with the GitHub CLI, Discord messages with a
read-only bot, and a Markdown census note that maps people to employers. It
recounts issues, PRs, Discord messages and users, and adds a person when a new
author maps to a company. A new GitHub author the census doesn't list joins an
existing company when the company on their GitHub profile names it (profiles are
cached for 30 days); a profile never adds a new company. Country, employees, plan and Slack Connect keep their
saved values.

The last complete table stays on screen while an update runs. A failed update
leaves it in place and shows the reason with a Retry button.

Settings: **Discord bot token** (secret), **Discord server ID**, **Census machine**
and **Census note path**, and **GitHub repositories** (`owner/*` reads every public
repository). Without Discord or the census, those parts keep their last values.
The plugin only reads from GitHub and Discord and never posts. Data stays in the
plugin's data directory on the bb server.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=plugins/companies-using-bb
```

Tests use fictional companies and people only.
