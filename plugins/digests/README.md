# Digests

Private briefings delivered as threads, as short newsletters with a story headline, a lede,
and compact written sections. Supporting detail can expand in place. Unread issues stay in the Digests section, which works as its own inbox.
Archive issues yourself when done. Find old issues with native thread search.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/digests --yes
```

## Use

Ask an agent to set up Digests in the project where you want the issues. Setup
creates disabled definitions; enable schedules in **Settings → Plugins → Digests**
after reviewing them. Existing automations are never adopted or changed.

| Template | Default time |
| --- | --- |
| Unread email | Weekdays, 10am PT |
| Money | Monday, 10am PT |
| Reading | Sunday, 11am PT |
| X scorecard | Published by another thread |

Requires Automations, Browser Automation, and Thread Organizer with its optional
**Skip Inbox** section rule. Setup creates or updates the Digests section
with that rule so unread issues stay there.

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
