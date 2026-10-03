# File Pins

Keep local files within reach in each thread. Pins stay above the composer even
when the file viewer is closed, and are shared across clients.

![Persistent thread file pins](https://github.com/user-attachments/assets/5bd17727-04ad-4f61-8d9f-c1beb1b3db52)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/file-pins --yes
```

## Use

Choose **Pin to thread** in the composer's **+** menu, then search files on the
thread's machine. **Paste a path…** accepts an absolute or `~/` path. When more
than one machine is enrolled, the picker lets you choose the file's machine.

Pins read as quiet references above the composer, with extra files in **+N**.
Hover a filename for its full path and machine. Right-click a pin to **Unpin**;
the toast offers **Undo**. Missing files stay visible with a warning and offer
**Repin…** or **Unpin**. Availability refreshes on focus and every 30 seconds.
The strip disappears when the thread has no pins.

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
FileLink click behavior and opener choices. Pins have an Unpin context menu. Classification and launch run on the host; no Markdown or Moss parser
or renderer is included.

The SDK does not expose extensions for chat-file or file-tab context menus, or
a reusable composer @ picker. The fallback uses bb UI components and the same
host file-search API as mentions, scoped to the thread directory (or the chosen
machine's home directory for another host). No core or SDK APIs are added.

## Develop

Remote CI runs `npm run check --workspace=bb-plugin-file-pins`. For targeted UI
verification, build/install this package in an isolated bb development app.
