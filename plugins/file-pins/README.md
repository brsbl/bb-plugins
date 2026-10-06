# Pinned Files

Keep local files and web links within reach in each thread. Pins stay above the
composer even when the file viewer is closed, and are shared across clients.

![Persistent thread file pins](https://github.com/user-attachments/assets/6e33e4f9-e0e5-4db6-892f-631bf0567b35)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/file-pins --yes
```

## Use

Click the pin button in the composer's action row. It adds a **Pin files** pill at the cursor;
type one or more paths, file names or URLs after it and send. The pill carries this plugin's
[skill](skills/file-pins/SKILL.md) to the agent, which finds each file (absolute, `~/`, or relative
to the workspace or the thread's files), asks about any that are ambiguous, pins them and any
http(s) links with `bb file-pins pin`, and confirms.

Agents also pin a thread's few key links without being asked: the PR they open or drive, the
issue or ticket, the spec or design doc, and a dev site or dashboard they hand you (a local dev or
story server, its BB Connect URL, or a deployed preview). Each gets a clear title; secret-bearing
URLs are never pinned, superseded links are replaced rather than piling up, and a dev site's pin is
removed when its server is retired. A short always-on instruction points every thread at the skill's rule.

Pinned files read as quiet file chips above the composer, in order, as many as fit; the strip never
scrolls. Files that aren't pinned sit in the **⋯** list. File icons follow bb's file panel. Hover a filename for its full path and machine.
Right-click a strip file for bb's **Open preview**, **Open externally**, **Copy file path** and
**Copy file name**, then **Unpin** (moves it to the **⋯** list) or **Remove**. In the **⋯** list, a
row's hover **⋯** button or right-click offers the same file options, then **Pin** or **Remove**;
**Pin** is unavailable when the strip has no room. If the window narrows, pinned files that no longer fit lead the **⋯** list until
there is room again. **Remove**'s toast offers **Undo**. Missing filenames and icons have a light red tint and are labeled for assistive technology;
only their small **×** removes them. Availability refreshes on focus and every
30 seconds.

Pinned links sit in the same strip and **⋯** list, with the same order, capacity, Pin/Unpin,
Remove and Undo. A link chip shows its site's icon (the same origin-only lookup as Compact Links,
falling back to a generic link icon) and the page title the agent supplied, otherwise the site and a
short path. Clicking it opens the URL the way bb opens links; its menu offers **Open** and
**Copy link**, then **Unpin**/**Pin** and **Remove**. Links have no missing state.

A thread without pins shows no strip; the pin button is always in the action row.

```bash
bb file-pins pin '~/Moss/Notes/Tweets/Tweets.md' --machine host_37m3sgpq59
bb file-pins pin https://github.com/brsbl/bb-plugins/pull/343 --title 'Quiet raised pins'
bb file-pins list --thread thr_example --json
bb file-pins remove <pin-id> --thread thr_example
```

`--thread` defaults to the current thread. The file host defaults to the invoking
thread's host, then the target thread's host. Relative CLI paths use the invoking
thread's directory only when it belongs to that same host. Duplicate paths on
the same host, and identical URLs, produce one pin; each thread supports 40 pins, files and links
together. Only `http` and `https` URLs without credentials can be pinned.

Paths resolve on the selected machine through the plugin's host entry. File
contents never enter pin storage. Pins survive reloads and thread environment
changes and can be removed while a machine is offline. Deleting the thread
removes its pins. Pinning does not send file content to the agent. Icons are looked up only for a
pinned link's public HTTPS origin, never its path or query, and cached in the plugin's database.

A normal click on a pinned file follows bb's FileLink click behavior and opener
choices. Pin menus start with bb's open and copy items, then Pin/Unpin and Remove.

The pill is a plugin mention whose content is the shipped skill, read when the
message is sent, so the button and the agent share one set of instructions. Placing
it at the cursor needs bb 0.45 or later; older bb adds it at the end of the draft.

## Develop

Remote CI runs `npm run check --workspace=bb-plugin-file-pins`. For targeted UI
verification, build/install this package in an isolated bb development app.
