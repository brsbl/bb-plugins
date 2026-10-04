# Emoji Picker

Find, copy, and insert emojis without leaving bb. Search by name, keyword, shortcode, or emoji; browse eight categories; choose a skin tone; and return to recently used emojis.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/emoji-picker --yes
```

## Use

Open **Emoji Picker** in the sidebar and click an emoji to copy it. Use the smile button in a message composer to append an emoji to that draft. Picking never sends a message.

Use the arrow keys to browse and Enter to select. From search, Down focuses the first result. Skin tone and the last 24 choices are remembered in this browser. If clipboard access is denied, the picker offers a selectable emoji for manual copying.

The Emoji Mart Unicode 15 dataset is bundled for offline use. Emoji appearance and support depend on your operating system. The plugin sends no search or usage data to a server.

## Develop

From the monorepo root, install dependencies with `npm ci`. Remote CI runs `npm run check --workspace=bb-plugin-emoji-picker`. For an isolated development bb instance, build and install `plugins/emoji-picker` with the bb plugin CLI.
