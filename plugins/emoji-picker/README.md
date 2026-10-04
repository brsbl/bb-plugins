# Emoji Picker

Type `:` in a composer to open the emoji picker. Pick an emoji to replace that colon, keeping the rest of your draft. Search by name, keyword, shortcode, or emoji; browse eight categories; choose a skin tone; and return to recently used emojis.

![Browse emoji categories](https://github.com/user-attachments/assets/0ae6cd21-7e7a-4538-8229-c41f40aace13)

![Search a shortcode and copy the selected skin tone](https://github.com/user-attachments/assets/fcd3982e-dddb-44c2-a2ec-85d9cc808107)

![Recently used emojis after reload](https://github.com/user-attachments/assets/f3efaf29-fea3-4ba8-989a-309c887e7157)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/emoji-picker --yes
```

## Use

Type `:` wherever you want an emoji in your draft, then search or browse the picker and select one. The chosen emoji replaces the colon. Dismiss the picker to keep the colon as punctuation. Picking never sends a message.

Use the arrow keys to browse and Enter to select. From search, Down focuses the first result. Skin tone and the last 24 choices are remembered in this browser.

The [Emoji Mart](https://github.com/missive/emoji-mart) Unicode 15 dataset is bundled for offline use. Emoji appearance and support depend on your operating system. The plugin sends no search or usage data to a server.

## Develop

From the monorepo root, install dependencies with `npm ci`. Remote CI runs `npm run check --workspace=bb-plugin-emoji-picker`. For an isolated development bb instance, build and install `plugins/emoji-picker` with the bb plugin CLI.
