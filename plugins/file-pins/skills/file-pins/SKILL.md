---
name: file-pins
description: Pin, unpin, or list local files attached to a bb thread.
---

Pins remain visible above the thread composer, independently of open viewer tabs.

- `bb file-pins pin <path> [--thread <id>] [--machine <host-id>] [--json]`
- `bb file-pins list [--thread <id>] [--json]`
- `bb file-pins unpin <pin-id> [--thread <id>] [--json]`

The thread defaults to the current thread. The file host defaults to the invoking
thread's host, then the target thread's host. Outside a thread, use an explicit
thread and an absolute path or quoted `~/` path. Use `--machine` when the file
lives elsewhere. Relative paths resolve only against a same-host invoking cwd.

The host validates each file and resolves `~/` and symlinks. Duplicate host/path
pairs are idempotent. There are at most 40 pins per thread. `list` supplies IDs;
unpinning works while the file host is offline and never deletes the file.
Pins retain their original host if the thread moves. Deleting the thread removes
its pins. Pins do not copy file contents or automatically add them to agent context.

A normal click on Markdown under the file host's `~/Moss/Notes/`, or Markdown
containing `moss-*` fences or `:::tabs`, opens the Moss Mac app on that host.
Other files retain bb's FileLink behavior. Right-click a pin to move it between the strip and the +N overflow list, or to Remove it; Remove's toast offers Undo. Missing files remain visible
with an accessible missing label and a small × to remove them. Use the composer's + → Pin to thread to search or paste a path. The picker offers recent thread files. Moss detection uses only distinctive markers; this plugin has no custom parser or renderer and does not depend on the Moss viewer plugin.
