# Browser Context

Select an element or drag over a region in BB's Browser, then stage screenshot-backed page context in the current thread composer.

![Browser context staged in the current bb composer](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/browser-context --yes
```

## Use

Open a Browser tab and click the Browser Context action to enter selection mode. Click an element or drag over a region; click the action again to cancel. BB adds a screenshot preview and bounded JSON metadata attachment to the existing composer while preserving its text. Remove either preview or keep typing before using the standard Send or Queue flow.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-browser-context
bb plugin install "path:$PWD/plugins/browser-context" --yes
```
