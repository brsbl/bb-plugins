---
name: content-calendar
description: Read and change brsbl's content schedule (tweets, bb blog posts, essays, site pages) with `bb content-calendar`, show it inline in chat, or set up its Google Calendar connection. Use when the user asks what's scheduled, to add, move, check off, gate, or attach files to a deliverable, to show the calendar, or to connect Google Calendar.
---

## Show the calendar inline

When the user asks to see the schedule, and right after you change it:

1. Run `bb content-calendar view --week <any date in the week>` or `--month <YYYY-MM>`.
2. Paste the line it prints, such as `::content-calendar{view="week" start="2026-10-05"}`,
   **once, on its own line**. It renders a live, editable calendar that always shows current data.
3. Describe what you changed in words. Don't re-list the schedule; the calendar shows it.

## Rules

- **The checkbox means posted.** `--status posted` checks an item; any other status unchecks it.
  Never describe or mark posted items with strikethrough.
- **Essays are brsbl's.** Items have no owner or assignee. Never add one, ask who owns
  something, or call anything "unowned".
- An item has a date **or** a tray (`evergreen` or `later`), never both. Dates are
  YYYY-MM-DD in America/Los_Angeles.
- Formats: `tweet`, `blog` (bb blog post), `essay`, `site` (site page), or `none`.
  Statuses: `idea`, `drafting`, `ready`, `posted`.
- An item with an open gate ("Waits on") is blocked. Checking an item clears the item
  gates that point to it.

## Commands

Every command takes `--json`. Errors print `{"ok":false,"error":{"code","message","hint"}}`.

| Command | Does |
| --- | --- |
| `list [--month YYYY-MM \| --week DATE \| --from DATE --to DATE] [--format F] [--status S] [--tray T] [--limit N] [--cursor C]` | Lists items, 200 per page; continue with `--cursor` |
| `show <id>` | One item with gates (`[g…]`), attachments (`[a…]`), and sync state |
| `add <title> --format F (--date D \| --tray T) [--status S] [--target T] [--notes-file P]` | Creates an item |
| `update <id> [--title] [--format] [--status] [--target] [--notes-file] [--time HH:MM\|none]` | Edits fields; `--target ""` clears the target |
| `move <id> (--date D \| --tray T) [--before ID \| --after ID]` | Same as dragging |
| `gate add <id> (--pr owner/repo#n \| --item ID \| --text "…" [--url URL])` | Adds a gate |
| `gate clear <id> <gateId> [--reopen]`, `gate remove <id> <gateId>` | Clears, reopens, or removes a gate |
| `attach <id> (--file PATH [--machine ID] \| --url URL [--title T] \| --pr owner/repo#n \| --thread thr_… [--title T])` | Attaches a reference, never a copy |
| `detach <id> <attachmentId>` | Removes an attachment |
| `delete <id>` | Deletes the item and its Google event. Final; confirm with the user first. |
| `reapply <id>` | After a conflict, writes bb's values over Google's |
| `view (--week DATE \| --month YYYY-MM)` | Prints the inline directive |
| `export [--out PATH]` | Every item, including both trays, as JSON |
| `status`, `sync`, `connect [--calendar-id ID]`, `connect --paste URL`, `disconnect`, `restore-calendar` | Connection state and setup |

`--file`, `--notes-file`, and `--out` are paths on the machine this thread runs on
(absolute, `~/`, or relative to the working directory). Pass `--machine <host-id>` for
another machine. A Moss note attachment opens in Moss on that Mac.

Human output is one line per item:

```
cc_7k2m9q  2026-10-28  ☐ Orchestration blog post  (bb blog post · Ready)
```

### Item shape (`show --json`)

```json
{
  "id": "cc_7k2m9q", "title": "Orchestration blog post", "format": "blog", "status": "ready",
  "date": "2026-10-28", "time": null, "days": 1, "tray": null, "target": "Downloads baseline",
  "notes": "…", "waitsOn": [{ "id": "g1", "kind": "pr", "repo": "get-bb/bb", "number": 4772, "cleared": false }],
  "attachments": [{ "id": "a1", "kind": "file", "machineId": "…", "path": "/Users/brsbl/Moss/Notes/…", "name": "….md" }],
  "sync": "synced", "conflict": null, "updatedAt": "2026-10-03T22:10:00Z"
}
```

### Write results

- A write returns once Google Calendar confirms it (`"sync": "synced"`).
- If Google is unreachable, the write is queued: exit 0 with `"sync": "queued"`. Tell the user
  it will sync when Google is back.
- If Google kept a same-field change made elsewhere, the command **exits non-zero with code
  `conflict`** and names the fields. The write did not happen. Tell the user, and run
  `reapply <id>` only if they want bb's value.
- If Google refuses a write outright, the command **exits non-zero with code `rejected`**.
  Nothing changed in Google. Run `show <id>` to see the current item before retrying.
- A queued write that later conflicts shows `"sync": "conflict"` in `list`, `show`, and `status`.
- `not_connected` or `needs_client` means Google isn't set up; follow the setup below.

## Connect Google Calendar (one time)

The user does steps 1–6 in their browser; never ask them to paste the client secret into chat.

1. In the Google Cloud console, create a project (or choose one).
2. **APIs & Services → Library:** enable the **Google Calendar API**.
3. **OAuth consent screen:** user type **External**. Set the publishing status to
   **In production**, not Testing; Google expires refresh tokens after 7 days in Testing.
   With a Google Workspace account, choose **Internal** instead: it skips both the
   unverified-app warning and the 7-day token expiry.
4. Add the scope `https://www.googleapis.com/auth/calendar.app.created`, and no other.
   It lets bb create and edit only its own calendar.
5. **Credentials → Create credentials → OAuth client ID**, application type **Desktop app**.
6. Save the client ID and secret in **Settings → Content Calendar**. Or run
   `bb content-calendar connect` in a thread: it shows a masked form that saves them straight
   to secret settings, and the values never pass through the agent.
7. `bb content-calendar connect` prints Google's sign-in address. The user opens it and approves.
   With an External consent screen, Google shows a one-time "unverified app" warning; continue past it.
8. The browser lands on a `127.0.0.1` address that doesn't load. The user copies that whole
   address, and you run `bb content-calendar connect --paste '<url>'`.

bb then creates one calendar named **Content**. Keep the same OAuth client and Cloud project
afterwards; the calendar may be tied to it. If bb's data was lost but the calendar still
exists, run `connect --calendar-id <ID>` with the ID from Google Calendar's settings instead
of creating a second calendar. If `status` says the calendar was deleted, `restore-calendar`
recreates it from bb's copy.
