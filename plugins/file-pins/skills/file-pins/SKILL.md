---
name: file-pins
description: Pin, remove, or list local files attached to a bb thread.
---

Pins remain visible above the thread composer, independently of open viewer tabs.

- `bb file-pins pin <path> [--thread <id>] [--machine <host-id>] [--json]`
- `bb file-pins list [--thread <id>] [--json]`
- `bb file-pins remove <pin-id> [--thread <id>] [--json]`

The thread defaults to the current thread. The file host defaults to the invoking
thread's host, then the target thread's host. Outside a thread, use an explicit
thread and an absolute path or quoted `~/` path. Use `--machine` when the file
lives elsewhere. Relative paths resolve only against a same-host invoking cwd.

The host validates each file and resolves `~/` and symlinks. Duplicate host/path
pairs are idempotent. There are at most 40 pins per thread. `list` supplies IDs;
`remove` works while the file host is offline and never deletes the file itself.
Pins retain their original host if the thread moves. Deleting the thread removes
its pins. Pins do not copy file contents or automatically add them to agent context.

A normal click follows bb's FileLink behavior. In the UI, Unpin moves a file from the strip to the ⋯ list and Pin moves it back while the strip has room; Remove deletes it with an Undo toast. The CLI `remove` command matches the UI's Remove, without the Undo toast. Missing files remain visible
with an accessible missing label and a small × to remove them. Use the pin button in the composer's action row to search one chosen folder or paste a path; the folder defaults to the thread workspace and is remembered per thread.
