# Briefs

Private briefings delivered as threads: one clear headline, a few numbered
items with compact review buttons, and a flat “No action needed” email table collapsed. Briefs arrive in a
Briefs inbox. Archive them when done and find old briefs with thread search.

![A brief with numbered priorities and review buttons](https://github.com/user-attachments/assets/6d6f4f82-9f51-475a-b5e7-356a1e43459f)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/digests --yes
```

## Use

Open **Settings → Plugins → Briefs**. Import logins through bb’s own Browser
settings if needed. Sign-ins are checked automatically when Settings opens and before every run. Under a signed-in site, choose **Add
digest**, give it a name, describe what it should tell you, and choose when.
Create turns it on; **Run now to preview** opens the first brief. Click a digest’s
name to edit it in place. Runs use a Personal workspace on the computer with your browser sign-ins. If needed, choose a project and computer under **Where it runs**.

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
additional inboxes. Setup creates a Briefs inbox that catches this plugin’s
briefs. Read and unread briefs stay there until you move or archive them.

Browser collection requires **bb 0.45.0 or later** on the browser desktop and
connected server. Fresh brief-owned tabs reuse your existing BB Browser sign-ins.
No cookie copying or permanently open tab is needed. A computer or workspace that cannot start a run shows a persistent error with Retry on its digest card. Older runtimes show an
update-needed brief. Signed-out connections show Reconnect; unavailable or
interrupted runs show Retry. A missed run is reported when bb resumes.

Gmail collection reads the full email and needed reply-chain context. **After reading** defaults to **Keep unread**: each originally unread message is restored and checked immediately after reading. Choose **Mark as read** to leave opened mail read. Already-read mail stays read. The only explicit Gmail write allowed is restoring unread state; Briefs never sends, archives, labels, or deletes mail. A saved per-message journal makes failed or unverified restoration visible in the brief, including after interruption. Other sites are read-only. Reading records Gmail message
IDs in plugin-owned SQLite only after successful publication, so newsletters
are summarized once without marking them read. Emails are read in full; the brief reports any unread state it could not restore.
Optional Inline Action Cards provide click-approved proposals; without that
plugin, actions are plain text and nothing is executed.

Other threads can publish a prepared report:

```bash
bb digest publish --digest x-scorecard --file brief.md --key 2026-10-05
```

Use `bb digest --help` for setup, custom definitions, connection checks, and
publishing options. Brief content, definitions, and processed IDs stay in
Briefs' private storage, never thread storage. External publication uses a
brief native agent turn to put the visual summary into its new thread.

## Develop

From the monorepo root:

```bash
npm ci
bb plugin install "path:$PWD/plugins/digests" --yes
```

CI runs `npm run check --workspace=bb-plugin-digests` remotely. Use an isolated
bb development app with fixture accounts for browser and screenshot verification.

Digest cards keep the name prominent, with a muted schedule at the bottom-left opposite Run now. Edit your own prompt in place; collection rules and Gmail searches live in the runtime, never in the prompt preview. A small emoji field beside the name controls the prefix on new brief thread titles. Saved definitions fall back to their starter emoji when none is set.
