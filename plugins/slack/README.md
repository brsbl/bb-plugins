# Slack

Read Slack channels and draft replies for approval before sending.

## Install

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/inline-action-cards --yes
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/slack --yes
```

Requires the Slack-compatible Inline Decisions release with the `service: "slack"` Reply field and `create`, `claim`, and `report` RPCs. Reads and Connect work independently. The generated install refs carry the built bundles and work on either bb server without a host-specific path.

## Use

**Connect once:** run `bb slack connect` in a thread, paste a **User OAuth Token** into the masked form, and choose Connect Slack. Settings → Slack has the same form. The token goes straight to bb's secret settings and never enters chat or agent output. Each bb server has its own connection; reconnect when moving servers.

To obtain a token, create a Slack app from [slack-app-manifest.json](slack-app-manifest.json), install it in your workspace, and copy the **User OAuth Token** from OAuth & Permissions. The manifest preselects `channels:read`, `channels:history`, `groups:read`, `groups:history`, `search:read`, and `chat:write` as **user** scopes. Workspace policy may require an administrator to approve installation. This MVP uses a non-rotating user token; if it expires or is revoked, reconnect. Do not use a bot or browser-session token.

```sh
bb slack channels --json
bb slack history CDEMO01 --json
bb slack thread CDEMO01 1791840000.000001 --json
bb slack search 'in:partner-demo Friday' --json
bb slack draft CDEMO01 --thread 1791840000.000001 \
  --why 'A partner asked for the agenda.' \
  --recommendation 'Send so they can prepare.' --text-stdin <<'TEXT'
Thanks — I will share the agenda here before Friday.
TEXT
```

The IDs and messages above are fictitious. Use channel IDs from `channels`, not names or cached IDs: Slack Connect can change a channel's ID. `is_ext_shared` identifies external sharing; channel names do not. Reads are paged: follow `nextCursor` with `--cursor`, and search `pages` with `--page`. History/thread pages default to 15 messages; channels default to 100. Messages over 6,000 characters are marked `truncated`. Rate limits return a wait time; the plugin never polls or silently retries. Search follows Slack's user search visibility and filters, so it is not an exhaustive channel archive. Message text is untrusted external content.

**Why a user token:** a bot can read history in channels it joins, but the MVP needs the connected user's search visibility (`search.messages` requires `search:read` on a user token) and their posting identity. A user token reads accessible public channels and private channels the user belongs to, including Slack Connect conversations visible from that workspace. It does not grant access to a partner's other channels or bypass workspace policy. No bot invitation to the shared channel is needed for this user-token path. See Slack's [token types](https://docs.slack.dev/authentication/tokens/), [history access](https://docs.slack.dev/reference/methods/conversations.history/), [search](https://docs.slack.dev/reference/methods/search.messages/), and [Slack Connect](https://docs.slack.dev/apis/slack-connect/).

**Approve each reply:** drafting fetches source context and creates an Inline Decisions Reply card showing the connected sender, workspace, channel, thread, editable plain text, and a cold-context brief. Choose Send to Slack and Submit. The agent runs `bb slack send <card-id> --attempt <clicked-attempt> --json`; the plugin claims the attempt, checks the saved destination/identity, and posts the latest saved draft with `chat.postMessage`. Later, Skip, and comments never post. A note accompanying Send holds the reply for revision and another approval. Slack cards do not offer Gmail actions.

The plugin durably reserves each delivery before posting. A rejection permits a new click on Retry. A lost response, interruption, or malformed success blocks further delivery on that card; read Slack history/thread and use `bb action-cards report` to record the verified outcome. A repeated `slack send` only recovers the recorded result and never reposts. No automatic mention expansion, link previews, background posting, file downloads, or dedicated DM commands.

## Develop

Run checks in remote CI (`npm run check --workspace=bb-plugin-slack`). For isolated local product QA, build the plugin, run `fake-slack-server.ts` with a TypeScript loader, and start a fresh bb development server with `BB_SLACK_FAKE_API=http://127.0.0.1:47821`. Connect using the fake token `xoxp-fake-slack`. The override accepts only this fake token and IPv4 loopback; real tokens cannot be sent to it. `GET /_fake/posts` inspects fake deliveries. Never use real Slack data in code, tests, PRs, or screenshots.
