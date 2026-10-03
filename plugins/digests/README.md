# Digests

Private briefings delivered as threads: one clear headline, a few numbered
items with review buttons, and routine details collapsed. Issues arrive in a
Digests inbox. Archive them when done and find old issues with thread search.

![A Digests newsletter in its native thread](https://github.com/user-attachments/assets/c06749c0-c715-427d-84e6-c5a7c4c5e4ca)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/digests --yes
```

## Use

Open **Settings → Plugins → Digests**. Import logins through bb’s own Browser
settings if needed, then press Refresh. Under a signed-in site, choose **Add
digest**, give it a name, describe what it should tell you, and choose when.
Create turns it on; **Run now to preview** opens the first issue. Click a digest’s
name to edit it in place. Schedules use your existing project agent defaults.

Agent setup can prefill the following ordinary prompt digests from the existing
recipes. These start disabled until you confirm migration. Existing automations
are never adopted or changed.

| Starter digest | Default time |
| --- | --- |
| Unread email | Weekdays, 10am PT |
| Money | Monday, 10am PT |
| Reading | Sunday, 11am PT |
| X scorecard | Published by another thread |

Requires Automations, Browser Automation, and Thread Organizer with support for
additional inboxes. Setup creates a Digests inbox that catches this plugin’s
issues. Read and unread issues stay there until you move or archive them.

Browser collection requires **bb 0.45.0 or later** on the browser desktop and
connected server. Fresh issue-owned tabs reuse your existing BB Browser sign-ins.
No cookie copying or permanently open tab is needed. Older runtimes show an
update-needed issue. Signed-out connections show Reconnect; unavailable or
interrupted runs show Retry. A missed run is reported when bb resumes.

Collection never changes Gmail or other accounts. Reading records Gmail message
IDs in plugin-owned SQLite only after successful publication, so newsletters
are summarized once without marking them read. Snippet-only coverage is labeled.
Optional Inline Action Cards provide click-approved proposals; without that
plugin, actions are plain text and nothing is executed.

Other threads can publish a prepared report:

```bash
bb digest publish --digest x-scorecard --file brief.md --key 2026-10-05
```

Use `bb digest --help` for setup, custom definitions, connection checks, and
publishing options. Issue content, definitions, and processed IDs stay in
Digests' private storage, never thread storage. External publication uses a
brief native agent turn to put the visual summary into its new thread.

## Develop

From the monorepo root:

```bash
npm ci
bb plugin install "path:$PWD/plugins/digests" --yes
```

CI runs `npm run check --workspace=bb-plugin-digests` remotely. Use an isolated
bb development app with fixture accounts for browser and screenshot verification.
