# Server Switcher

Shows the bb server you are on in a strip above the sidebar footer and switches
to any other server on your bb account with one click.

![The current server in the sidebar strip, with the other servers on the account listed below it](docs/switcher.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/server-switcher --yes
```

Requires a bb that is signed in to a bb account (`bb account login`) with the
bundled connect plugin enabled.

## Use

- The strip shows the current server's name, address, your GitHub avatar, and
  its colored ring. Click it to list the other servers on your account; offline
  servers are disabled.
  The strip is open by default; opening another plugin's footer panel takes its
  place, and clicking your avatar in the footer brings it back.
- In a browser or on a `*.getbb.app` URL, choosing a server opens it in the same
  tab. In the desktop app, the list follows the app's server menu and switches
  through it. In the bb mobile app the list is read-only.
- Click any server's avatar to change its ring: a preset or custom color, a
  two-color gradient (click the bar to add the second stop), no ring, or Reset
  to return to the server's default gradient.

```bash
bb server-switcher ring list
bb server-switcher ring set <server> <color> [<color>]
bb server-switcher ring clear <server>
bb server-switcher ring reset <server>
```

Rings are saved on the server you are viewing.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-server-switcher
bb plugin install "path:$PWD/plugins/server-switcher" --yes
```
