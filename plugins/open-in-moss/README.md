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

With a remote bb server, the file is checked and opened by the connected Mac's
host daemon. Path-only links must match exactly one connected Mac. If more than
one Mac has that path, or a connected host cannot be checked, the plugin falls
back to bb instead of guessing. A disconnected Mac must reconnect first.

The existing `POST /api/v1/plugins/open-in-moss/http/open` endpoint also accepts
`{"path":"/absolute/note.md","hostId":"host_…"}` to target the file's host directly.
Omit `hostId` for automatic discovery. On older bb versions without plugin host
RPC, path-only requests retain the original local-Mac behavior.

Right-click still uses bb's normal menu. If Moss or the local file is
unavailable, bb opens its own viewer and shows a notice.

## Develop

```sh
npm install
npm run check --workspace=bb-plugin-open-in-moss
```
