# Pinned Files & Links

Keep local files and web links within reach in each thread. Pins stay above the
composer even when the file viewer is closed, and are shared across clients.

![A pull request, a Markdown file, a localhost dev server, a Linear issue and a Figma link pinned above the composer](docs/strip.png)

![Overflowing files and links in the overflow list above the strip](docs/more-list.png)

![The Pin pill in the composer, followed by the files and link to pin](docs/pin-files-pill.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/file-pins --yes
```

## Use

Click the pin button in the composer's action row. It adds a **Pin** pill at the cursor;
type one or more paths, file names or URLs after it and send. The pill carries this plugin's
[skill](skills/file-pins/SKILL.md) to the agent, which finds each file (absolute, `~/`, or relative
to the workspace or the thread's files), asks about any that are ambiguous, pins them and any
http(s) links with `bb file-pins pin`, and confirms.

Agents also pin a thread's few key links without being asked: the PR they open or drive, the
issue or ticket, the spec or design doc, and a dev site or dashboard they hand you (a local dev or
story server, its BB Connect URL, or a deployed preview). Each gets a clear title; secret-bearing
URLs are never pinned, superseded links are replaced rather than piling up, and a dev site's pin is
removed when its server is retired. A short always-on instruction points every thread at the skill's rule.

Pinned files read as quiet raised chips above the composer. At every window width, pins stay
in order with whole labels while they fit; the first that does not fit and all later pins go
into a **+N** count chip immediately after the last visible pin. The chip appears only when it has pins. A lone first pin wider than the row
shortens to fit. The strip does not scroll sideways or shrink several labels to make room.
Long names and addresses still use the label rules in [`pin-label.ts`](pin-label.ts).
Previously hand-hidden pins participate in the same layout again; saved hiding preferences
are ignored. Hover cards open once the preview and its image have loaded (prefetched as the
pointer arrives), or after 800 ms with what has arrived.
File icons mark code, documents and images in the theme's file color. Hover or focus a pin for a preview card with its URL or path in a subtle header. Web links use Moss’s rich-card layout: a thumbnail or site-icon fallback, site name, title, and description. Files show their title, availability, and machine when needed.
Right-click a strip file for **Open preview**, **Open externally**, **Copy file path** and
**Copy file name**, then **Unpin**. In the overflow list, click a row to open its pin. Its **×** unpins the item; it appears on row hover or keyboard focus and stays visible on touch screens. **Unpin** removes the
item from the thread and offers **Undo**. Missing files keep their light red tint and
assistive labels, and their **×** also unpins them. Availability refreshes on focus and every
30 seconds.

Pinned links share the same strip context menus and Undo behavior. Clicking a link follows bb's browser
preference; its menu offers **Open**, **Copy link**, and **Unpin**.

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
removes its pins. Pinning does not send file content to the agent. Web preview metadata and PNG/JPEG/WebP thumbnails are fetched on hover from public HTTPS destinations, without cookies or credentials, and cached in memory for up to an hour. Direct raster image links show the image itself. Local URLs, PDFs, and unavailable pages keep the site-icon fallback. Redirects and resolved addresses are checked before connecting; previews never load remote images in the browser. Icons are looked up only for a
pinned link's public HTTPS origin, never its path or query, and cached in the plugin's database. For a
pinned GitHub pull request, the bb server sends the PR's owner, repository and number to GitHub's public
API, without credentials, and caches its state. GitHub answers only for public repositories, so a private
PR keeps the site icon unless it is the thread's own PR, whose state comes from bb. A rate limit from
GitHub pauses every lookup until it resets, and the last known state stays meanwhile.

A normal click on a pinned file follows bb's FileLink click behavior and opener
choices. Strip context menus start with bb's open and copy items, then Unpin.
The pill is a plugin mention whose content is the shipped skill, read when the
message is sent, so the button and the agent share one set of instructions. Placing
it at the cursor needs bb 0.45 or later; older bb adds it at the end of the draft.

## Develop

Remote CI runs `npm run check --workspace=bb-plugin-file-pins`. For targeted UI
verification, build/install this package in an isolated bb development app.
