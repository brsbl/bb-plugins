# Thread Hover Cards

Busy sidebars make it hard to remember what every thread is doing. Thread Hover Cards gives you the useful context—status, latest agent message, execution details, repository, and pull request—without making you open each one.

![A bb thread hover card showing live worker context](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes
```

## Use

Hover over a thread row, or focus it with the keyboard. Its card opens beside the row while your active thread stays put.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-hover-cards
bb plugin install "path:$PWD/plugins/thread-hover-cards" --yes
```
