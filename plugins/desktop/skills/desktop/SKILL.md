---
name: desktop
description: Manage the user's bb Desktop folders. Use when filing threads into desktop folders or hiding a folder's threads from the sidebar.
---

# Desktop

The Desktop plugin shows bb threads as an operating system: folders of threads on the new-thread page, a finder window per folder, and draggable thread windows.

## Folders from the CLI

```bash
bb desktop folders
bb desktop folder create "Launch" --hide-from-sidebar
bb desktop folder add <folder-id> <thread-id>...
bb desktop folder remove <folder-id> <thread-id>
bb desktop folder delete <folder-id>
```

- Desktop folders mirror the sidebar's sections, projects, or machines; filing a thread into a section is an ordinary bb section change. `folder create` makes an extra desktop-only folder that holds chosen threads.
- With `--hide-from-sidebar`, a desktop-only folder's threads are hidden from the sidebar thread list until they leave the folder or the folder is deleted.

## Making another plugin a Desktop program

Use the `desktop-apps` skill: it gives the copy-paste helper and the steps for a plugin to open as an XP window with a Start menu entry.
