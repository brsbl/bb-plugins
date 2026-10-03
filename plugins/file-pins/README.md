# File Pins

Keep local files within reach in each thread. Pins stay above the composer even
when the file viewer is closed, and are shared across clients.

![Persistent thread file pins](https://github.com/user-attachments/assets/6e33e4f9-e0e5-4db6-892f-631bf0567b35)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/file-pins --yes
```

## Use

Choose **Pin to thread** in the composer's **+** menu, then search files on the
thread's machine. Type an absolute or `~/` path in the same search field to pin it directly. When more
than one machine is enrolled, the search row lets you choose the file's machine. Its options menu contains
**Paste a path…**.

Pins read as quiet references above the composer, with extra files in **+N**.
Hover a filename for its full path and machine. The strip shows pins in order, as many as fit.
Right-click a pin on the strip for **Move to overflow** or **Remove**, or a pin in the **+N** list
for **Move to strip** or **Remove**. **Remove**'s toast offers **Undo**. Missing filenames and icons have a light red tint and are labeled for assistive technology;
only their small **×** removes them. Availability refreshes on focus and every
30 seconds.

Before typing, the compact picker shows **Recent in this thread**. When there
are no pins, up to three recent files appear as one-click suggestions; otherwise
the empty strip disappears. Suggestions come from the last 100 relevant SDK
thread events: completed file additions/edits, user file mentions/attachments,
and Markdown links in agent/user messages. An existing Markdown lexer extracts
link destinations; it does not render content or parse Moss notes. The thread's
current host resolves paths, checks availability and removes canonical duplicates
and existing pins. History without a current environment, missing files and
unavailable hosts produce no suggestions. Shell command text is not inspected.

```bash
bb file-pins pin '~/Moss/Notes/Tweets/Tweets.md' --machine host_37m3sgpq59
bb file-pins list --thread thr_example --json
bb file-pins unpin <pin-id> --thread thr_example
```

`--thread` defaults to the current thread. The file host defaults to the invoking
thread's host, then the target thread's host. Relative CLI paths use the invoking
thread's directory only when it belongs to that same host. Duplicate paths on
the same host produce one pin; each thread supports 40 pins.

Paths resolve on the selected machine through the plugin's host entry. File
contents never enter pin storage. Pins survive reloads and thread environment
changes and can be removed while a machine is offline. Deleting the thread
removes its pins. Pinning does not send file content to the agent.

A normal click on a Markdown note under the file host's `~/Moss/Notes/`, or a
Markdown file containing a `moss-*` fence or `:::tabs` marker, opens the **Moss
Mac app** on that host. Moss must be installed there. This explicit Moss rule
overrides the default opener for the normal click. Other files retain bb's
FileLink click behavior and opener choices. Pins have their own Move and Remove context menu. Classification and launch run on the host; no custom Markdown/Moss parser or renderer is included.

The SDK does not expose extensions for chat-file or file-tab context menus, or
a reusable composer @ picker. The fallback uses bb UI components and the same
host file-search API as mentions, scoped to the thread directory (or the chosen
machine's home directory for another host). No core or SDK APIs are added.

## Develop

Remote CI runs `npm run check --workspace=bb-plugin-file-pins`. For targeted UI
verification, build/install this package in an isolated bb development app.
