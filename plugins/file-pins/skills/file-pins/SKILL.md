---
name: file-pins
description: Pin, remove, or list local files and web links in a bb thread's Pinned Files. Use when the user asks to pin a file or a URL, and proactively, without being asked, when you open or start driving a PR, start work on an issue or ticket, rely on a spec or design doc, or hand the user a dev server, story server, shared preview, deployed preview, or dashboard they will revisit.
---

## Pin the files and links the user names

Pin every file and link the user names, one or many.

1. Resolve each file: an absolute path, a `~/` path, or a path relative to the
   workspace or this thread's files. Look it up by name when that is all they give.
2. If several files match a name or none does, ask about that one only. Never pin a guess.
3. Run `bb file-pins pin <path>` once per file in this thread, passing an absolute or `~/` path.
4. Run `bb file-pins pin <url>` once per web link, passing the full `http://` or
   `https://` URL. Add `--title "<page title>"` only when you already know the
   page's title; don't fetch the page to find it.
5. Confirm briefly with what you pinned, such as "Pinned `notes.md` and the PR link."

## Pin the thread's key links without being asked

Pin the few URLs central to this thread's work as soon as they exist:

- the PR you open or are driving;
- the issue or ticket being worked;
- the spec or design doc the work follows;
- a dev site you hand the user: a local dev or story server you started
  (`http://localhost:<port>/…` or `http://127.0.0.1:<port>/…`), its BB Connect
  shared URL, or a deployed preview;
- a dashboard the user will revisit.

Guardrails:

- Pin only those key artifacts, not every link mentioned: at most a handful per thread.
- Always pass a clear `--title`, such as `--title "PR #351: URL pins"`.
- Skip a link that is already pinned; `bb file-pins list` shows them, and
  pinning the same URL again is a no-op.
- Never pin a URL that carries a secret, token, signature, or credential.
- When a link is superseded, such as a closed PR replaced by a new one,
  `bb file-pins remove` the old pin and pin the new one instead of piling up.
- When you retire a dev server or its share, remove its pins too.
- Mention it in one short line, such as "Pinned the PR.", with no further chatter.

## Commands

- `bb file-pins pin <path-or-url> [--thread <id>] [--machine <host-id>] [--title <text>] [--json]`
- `bb file-pins list [--thread <id>] [--json]`
- `bb file-pins remove <pin-id> [--thread <id>] [--json]`

The thread defaults to the current thread. The file host defaults to the invoking
thread's host, then the target thread's host. Outside a thread, use an explicit
thread and an absolute path or quoted `~/` path. Use `--machine` when the file
lives elsewhere. Relative paths resolve only against a same-host invoking cwd.

The host validates each file and resolves `~/` and symlinks. Only `http` and
`https` URLs can be pinned; `--machine` doesn't apply to them, and without
`--title` a link shows its site and a short path. Duplicate host/path pairs and
identical URLs are idempotent. There are at most 40 pins per thread, files and
links together. `list` supplies IDs; `remove` works while the file host is
offline and never deletes the file itself. Pins retain their original host if
the thread moves. Deleting the thread removes its pins. Pins do not copy file or
page contents or automatically add them to agent context.

Pins show above the thread composer; links show their site's icon and open the
way bb opens links. In the UI, Unpin moves a pin from the strip to the ⋯ list
and Pin moves it back while the strip has room; Remove deletes it with an Undo
toast. The CLI `remove` command matches the UI's Remove, without the Undo toast.
Missing files stay visible with a small × to remove them. The composer's pin
button adds a "Pin files" pill for the user to follow with the files or links to
pin; the pill sends this skill to you.
