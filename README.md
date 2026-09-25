# GitHub Activity

GitHub Activity adds a BB sidebar panel for comments and mentions on pull requests and issues you authored.

![GitHub Activity in BB](docs/screenshot.png)

## Use

The feed uses the account already authenticated in the GitHub CLI. It keeps only incoming comments and mentions on resources authored by that account, then presents one searchable, filterable, and sortable table with separate resource and activity icons, repository, title, actor, and recency.

BB hosts the page beside its native Browser and Terminal tools. Each row remains a normal GitHub link, so standard link behavior and modifiers are preserved.

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
