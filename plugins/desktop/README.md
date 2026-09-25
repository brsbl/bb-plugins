# Desktop

Desktop turns bb's new-thread page into an operating system for your agents. Threads live in folders and open in draggable windows. The page itself is the wallpaper, so it pairs well with the Ambient plugin.

![Desktop with a folder finder, a thread window, and its detached details panel](docs/screenshot.png)

## Use

- **Folders.** Desktop folders mirror the sidebar's organization: your sections plus the loose Threads bucket, your projects, or your machines. By default they follow the sidebar's own setting; change it by right-clicking the desktop. New folder creates either a real sidebar section or a desktop-only folder, and desktop-only folders can hide their threads from the sidebar.
- **Show filter.** Active, Archived, or All is a filter on every folder, not a folder of its own. It also defaults to the sidebar's setting.
- **Finder.** Double-click a folder to open it. Switch between icon and list views, search, and drag threads between folders. Dropping a thread on a section folder moves it into that bb section.
- **Thread windows.** Double-click a thread to open it in its own window. Open as many as you like; drag them by the title bar, resize them from any edge, minimize to the taskbar, or double-click the title bar to maximize. The details button in each title bar opens that thread's side panel as a separate window beside it.
- **Taskbar.** An XP-style taskbar sits at the bottom of the new-thread page, sized to its buttons and capped at the page column. Its green **New thread** button and quick-launch icons open new threads, folders, and Windows Media Player; every open window gets a taskbar button, and clicking the focused one minimizes it. The tray holds the Media Player mini-player and a clock.
- **Windows Media Player.** Press play to visualize your microphone with classic visualizations (Bars, Scope, and Ambience); use the arrows or double-click the screen to switch. Audio never leaves the browser, and pressing stop releases the microphone.
- **Desktop menu.** Right-click the desktop or any empty part of the new-thread page to set Show, Organize by, and Sort by, to Arrange icons into a grid, or to Tile windows, both in sort order.
- **Sticky notes.** Add one from the note button in a thread's header, or choose New sticky note from the desktop menu to place it where you clicked. Notes stay in the screen margins and follow you across every page, pinned to the nearer side. Drag the top strip to move, the corner to resize, the dot to change color, and × to delete (with Undo). Notes are saved on this device and hide when Desktop is off.
- **On/off.** The Desktop button in the sidebar footer turns the whole desktop on or off on this device. Turning it on takes you to the new-thread page. When it is off, the new-thread page shows no desktop, windows, or taskbar.

Agents and scripts can use the same features from the `bb desktop` CLI; see [the skill](skills/desktop/SKILL.md).

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
