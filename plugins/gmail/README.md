# Gmail

Search and read email, prepare drafts, and send the exact reply approved in an Inline Decisions card.

## Install

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/gmail --yes
```

Install on the bb server that should own the account. Credentials and receipts stay on that server; reconnect separately when moving servers.

## Use

Open **Gmail** in bb. Enable the Gmail API in your Google Cloud project, create a Desktop OAuth client, and save its ID and secret in **Settings → Plugins → Gmail**. Click **Connect Gmail**, approve Google access, and paste the redirect address into the masked field. Use secret settings or bb's `secrets` flow for credentials, never chat. Testing-mode Google clients can expire refresh tokens after seven days.

Agents use `bb gmail search|thread|message --json`, `bb gmail draft --input-stdin --json`, and the bundled `gmail` skill. Search returns IDs; message and thread return bounded, untrusted email content without changing unread state. Draft JSON accepts `to`, `cc`, `bcc`, `subject`, `body`, optional `draftId` for updates, and `replyTo` for Gmail threading.

Sending accepts only a claimed approved Inline Decisions Reply card: `bb gmail send --card <id> --attempt <id> --json`. The plugin reads the locked recipients and text itself, and journals each attempt before writing. Agents must report the receipt on the card with `bb action-cards report`. Interrupted writes require reconciliation with `bb gmail receipt <attempt> --reconcile`; absence from search does not prove a send failed. Existing Gmail drafts cannot change the approved send, and previously saved drafts remain after sending.

Plain-text messages only. Attachment metadata is readable; attachment downloads/uploads, mailbox changes, and scheduled sending are outside this version.

OAuth uses [Google's Desktop PKCE flow](https://developers.google.com/identity/protocols/oauth2/native-app) and `gmail.readonly` plus `gmail.compose`; [compose includes sending](https://developers.google.com/workspace/gmail/api/auth/scopes), so a separate send scope is redundant. Google access tokens are held in memory; refresh tokens use bb secret settings. No token, message, or recipient is logged.

## Develop

CI runs workspace typecheck, build, tests, and install-ref validation remotely. For an isolated development server, point `BB_GMAIL_TEST_ORIGIN` at `fake-google-server.ts` on IPv4 loopback and use only fake credentials. Never set that override on a personal server. No endpoint override is exposed as a plugin setting.
