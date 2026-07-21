# Thread Hover Cards

Busy sidebars make it hard to remember what every thread is doing. Thread Hover Cards gives you the useful context—status, latest agent message, execution details, repository, and pull request—without making you open each one.

![A bb thread hover card showing live worker context](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes
```

## Use

Hover over a thread row, or focus it with the keyboard. Its card opens beside the row while your active thread stays put.

## How it was built

The card asks a server RPC for a small thread summary only when it needs one. On the frontend, it finds the matching sidebar row through bb's `data-sidebar-thread-id` attribute and positions itself alongside it.

That DOM bridge is necessary because the Plugin SDK does not yet offer a thread-row hover slot. It is deliberately narrow and covered by focused tests, leaving one obvious place to update if the sidebar markup changes.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-hover-cards
bb plugin install "path:$PWD/plugins/thread-hover-cards" --yes
```
