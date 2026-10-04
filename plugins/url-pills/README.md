# URL Pills

## Use

Paste a website URL to create a compact favicon pill in the composer. Pills also appear in sent messages and agent replies. Click a pill to open the exact URL using bb's browser preference.

Copying and sending retain the original URL, including its query and fragment. Authored Markdown labels, code, quotes and native bb thread references keep their own presentation. Sent-message editing uses native text. A trailing streamed URL stays expanded when its completion cannot be established safely.

![Favicon pills in drafts and conversations](https://github.com/user-attachments/assets/9157a554-9245-4443-b28e-cd3f448925a3)

## Website icons

**Load website icons** is on by default in the plugin settings. It contacts public HTTPS websites using only their origin, without browser cookies or the pasted path, query or fragment. Private addresses, nonstandard ports and unsupported or missing images use a generic icon. Turning it off cancels lookups and removes cached icons from view.

The plugin caches only origin-level icons. It does not save prompts, message content or full pasted URLs. Disabling it restores native link presentation. DOM decoration depends on bb's rendered markup; unrecognized elements retain native rendering.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/url-pills --yes
```

## Develop

Install dependencies from the repository root with `npm ci`. CI runs `npm run check --workspace=bb-plugin-url-pills`. Use a path install in an isolated development bb for interaction checks:

```bash
bb plugin install "path:$PWD/plugins/url-pills" --yes
```
