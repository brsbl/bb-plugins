# Thread Hover Cards

Thread Hover Cards previews a sidebar thread's status, latest agent message, execution context, repository, and pull request.

![A bb thread hover card showing live worker context](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes
```

## Use

Hover or keyboard-focus a thread row in the bb sidebar. The card appears beside the row without changing threads.

The current Plugin SDK has no thread-row hover slot, so the small frontend bridge anchors to bb's `data-sidebar-thread-id` attribute.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-thread-hover-cards
bb plugin install "path:$PWD/plugins/thread-hover-cards" --yes
```
