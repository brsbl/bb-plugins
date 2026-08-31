# @Plugin

Adds installed and Community plugins to bb's existing `@` menu.

![Plugin mentions in bb](docs/screenshot.png)

## Install

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/at-plugin --yes
```

## Use

Type `@`, search for a plugin, and select it.

- An installed plugin mention tells the agent which available plugin to prefer
  when it is relevant.
- A Community plugin mention tells the agent that the plugin exists but must be
  installed before it can be used.

A mention never installs, enables, configures, authenticates, or invokes a
plugin by itself.

## Develop

```sh
npm install
npm run check --workspace=bb-plugin-at-plugin
```
