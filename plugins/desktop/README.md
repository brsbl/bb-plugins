# Desktop

Desktop turns bb's new-thread page into an operating system for your agents. Threads live in folders, open in draggable windows, and reach you through an unread bell and webhook icons, so a team of agents can work like your calendar and inbox. The page itself is the wallpaper, so it pairs well with the Ambient plugin.

![Desktop with a notification center, a folder finder, a thread window, and its detached details panel](docs/screenshot.png)

## Use

- **Folders.** Desktop folders mirror the sidebar's organization: your sections plus the loose Threads bucket, your projects, or your machines. By default they follow the sidebar's own setting; change it by right-clicking the desktop. New folder creates either a real sidebar section or a desktop-only folder, and desktop-only folders can hide their threads from the sidebar.
- **Show filter.** Active, Archived, or All is a filter on every folder, not a folder of its own. It also defaults to the sidebar's setting.
- **Finder.** Double-click a folder to open it. Switch between icon and list views, search, and drag threads between folders. Dropping a thread on a section folder moves it into that bb section.
- **Thread windows.** Double-click a thread to open it in its own window. Open as many as you like; drag them by the title bar, resize them from any edge, minimize to the dock, or double-click the title bar to maximize. The details button in each title bar opens that thread's side panel as a separate window beside it.
- **Dock.** A floating dock launches new threads, folders, webhooks, and the Threads list, and holds every open window; minimize a window to park it there. Right-click the desktop to set Show, Organize by, and Sort by, to Arrange icons into a grid, or to Tile windows, both in sort order.
- **Notifications.** The Notifications bell in the dock counts threads with agent replies you haven't read, using bb's own unread state. Open it to see those threads, or Mark all read. Folder icons show how many threads inside are unread. Opening a thread marks it read.
- **Webhooks.** New webhook binds a URL to a new or existing thread. Each POST is delivered to that thread as a message and badges the webhook icon; double-click the icon to open the thread.

Agents and scripts can use the same features from the `bb desktop` CLI; see [the skill](skills/desktop/SKILL.md).

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| Public base URL for webhooks | empty | Origin external services use to reach bb. Empty shows the server's loopback URL. |

## Install

From this repository:

```bash
npm ci
bb plugin install "path:$PWD/plugins/desktop" --yes
```

## Develop

Run the focused package check from the repository root:

```bash
npm run check --workspace=bb-plugin-desktop
```
