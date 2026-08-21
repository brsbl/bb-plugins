# Open in Moss

Makes local Markdown links in bb open directly in Moss.

![A Markdown file link from bb open in Moss](docs/screenshot.png)

## Install

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/open-in-moss --yes
```

## Use

Click any local `.md` or `.markdown` link in bb. It opens in Moss instead of
bb's file viewer.

Right-click still uses bb's normal menu. If Moss or the local file is
unavailable, bb opens its own viewer and shows a notice.

## Develop

```sh
npm install
npm run check --workspace=bb-plugin-open-in-moss
```
