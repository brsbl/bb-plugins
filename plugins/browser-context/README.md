# Browser Context

Select an element or drag over a region in BB's Browser, annotate the captured preview, then add it to the current thread composer.

![Browser context staged in the current bb composer](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/browser-context --yes
```

## Use

Open a Browser tab and click the Browser Context action to enter selection mode. Click an element or drag over a region, add an optional comment, and hover the numbered target to verify the association. Choose **Add to prompt** to stage the screenshot and a concise Markdown context file while preserving the existing draft. The Markdown card can be opened, edited, or removed before the standard Send or Queue flow.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-browser-context
bb plugin install "path:$PWD/plugins/browser-context" --yes
```
