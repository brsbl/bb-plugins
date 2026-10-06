# Emoji Picker

Type `:` in a composer to open the emoji picker. Pick an emoji to replace that colon, keeping the rest of your draft. Search by name, keyword, shortcode, or emoji; browse eight categories; choose a skin tone; and return to recently used emojis.

![Emoji picker with category browsing and skin tone selection](https://github.com/user-attachments/assets/a74d890d-9ad9-46e5-a7a0-2995b386e054)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/emoji-picker --yes
```

## Use

Type `:` wherever you want an emoji in your draft, then search or browse the picker and select one. The chosen emoji replaces the colon. Dismiss the picker to keep the colon as punctuation. Picking never sends a message.

On desktop, the picker opens above the colon, or below it when space is tight. On mobile, it opens in a drawer.

Use the arrow keys to browse. Return (Enter) or Space dismisses the picker and returns to your draft without selecting an emoji or sending a message. Click an emoji to insert it. From search, Down focuses the first result. Skin tone and the last 24 choices are remembered in this browser.

The [Emoji Mart](https://github.com/missive/emoji-mart) Unicode 15 dataset is bundled for offline use. Emoji appearance and support depend on your operating system. The plugin sends no search or usage data to a server.

## Develop

From the monorepo root, install dependencies with `npm ci`. Remote CI runs `npm run check --workspace=bb-plugin-emoji-picker`. For an isolated development bb instance, build and install `plugins/emoji-picker` with the bb plugin CLI.
