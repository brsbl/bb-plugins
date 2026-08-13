# GitHub Activity

GitHub Activity adds a BB sidebar panel for comments, mentions, and reviews on pull requests and issues you authored.

![GitHub Activity in BB](docs/screenshot.png)

## Use

The feed uses the account already authenticated in the GitHub CLI. It keeps only incoming comment and review activity on resources authored by that account, then presents one searchable, filterable, and sortable table with resource type, repository, title, activity, actor, and recency.

Opening a row uses BB Desktop's native in-app browser. On web clients, the same row remains a normal GitHub link.

## Install

From this repository:

```bash
npm ci
bb plugin install "path:$PWD/plugins/github-notifications" --yes
```

The plugin needs an authenticated GitHub CLI session:

```bash
gh auth status
```

## Develop

Run the focused package check from the repository root:

```bash
npm run check --workspace=bb-plugin-github-notifications
```
