# Browser Context

Select an element or drag over a region in BB's Browser, annotate the captured preview, then add it to the current thread composer.

![Browser context staged in the current bb composer](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/browser-context --yes
```

## Use

Open a Browser tab and click the Browser Context action to enter selection mode. Click an element or drag over a region, then add an optional comment. Choose **Add to prompt** to preserve the existing draft, attach the screenshot, and append the comment followed by a compact quoted summary of the page, target, DOM, relevant styles, and available framework or accessibility hints. The user request stays primary while supporting context can collapse naturally, and the standard Send or Queue flow remains in control.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-browser-context
bb plugin install "path:$PWD/plugins/browser-context" --yes
```
