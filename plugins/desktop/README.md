# Desktop

Desktop turns bb's new-thread page into an operating system for your agents. Threads live in folders and open in draggable windows. The page itself is the wallpaper, so it pairs well with the Ambient plugin.

![Desktop with a folder finder, a thread window, and its detached details panel](docs/screenshot.png)

## Use

- **Folders.** Desktop folders mirror the sidebar's organization: your sections plus the loose Threads bucket, your projects, or your machines. By default they follow the sidebar's own setting; change it by right-clicking the desktop. New folder creates either a real sidebar section or a desktop-only folder, and desktop-only folders can hide their threads from the sidebar.
- **More.** Groups you move into More in the sidebar live inside a More folder on the desktop instead of cluttering it. Its icon rolls up their status.
- **Which folder is this thread in?** My Threads lists each thread's folders under its title, every thread's tooltip and details panel name its folders, and a thread page shows a folder label next to the note pad button when the thread is in a Desktop folder.
- **Recycle Bin.** Archived threads live in the Recycle Bin, and folders show only active threads. Drag a thread onto the bin to archive it; right-click it inside the bin to restore it, or drag it onto a folder. Dropping desktop folders or sections on the bin deletes them after a confirmation.
- **Selecting icons.** Drag across the desktop to select several icons, or Cmd/Ctrl/Shift-click to add and remove them. Drag any selected icon to move them together, press Delete to delete the selected folders and sections, and Cmd/Ctrl-A to select everything.
- **Finder.** Double-click a folder to open it. Switch between icon and list views, search, and drag threads between folders. Dropping a thread on a section folder moves it into that bb section.
- **Thread windows.** Double-click a thread to open it in its own window. Open as many as you like; drag them by the title bar, resize them from any edge, minimize to the taskbar, or double-click the title bar to maximize. The details button in each title bar opens that thread's side panel as a separate window beside it.
- **Taskbar.** An XP taskbar floats as a glassy pill at the bottom of the new-thread page, just wide enough for start, the clock, and a button per open window. The green **start** button opens XP's two-column Start menu: programs on the left (Internet Explorer, New thread, New folder, Media Player, Note pad), and on the right Accessories (Paint, Command Prompt), Games (Minesweeper, Solitaire), Search (thread search in the quick palette), and Run… (the command palette), with Turn Off Desktop at the bottom. Search and Run… follow your keyboard shortcut settings. Each open window gets a taskbar button; click it to bring the window forward, or click again to minimize it. The tray shows the clock, plus the Media Player mini-player while music is playing.
- **Room to type.** Clicking into the prompt box slides any window covering it the shortest distance that clears it, and slides it back when you click away. Grab a moved window and it stays where it is.
- **Tray icons.** The tray mirrors the sidebar footer (Settings, Report a bug, and every plugin's footer button) so the desktop works with the sidebars fully collapsed. Clicking an icon runs the real footer button; buttons that open a panel in the sidebar expand the sidebar first.
- **Quick Launch.** Small launchers sit next to start: Show desktop, New thread, and My Threads by default. Click the » at its end to tick launchers on or off, right-click any Start menu item to add it, and right-click a launcher to remove it or move it left or right. Show desktop minimizes every window, and a second click brings them back.
- **Needs-input balloon.** When a thread starts waiting for your input, a yellow XP balloon pops up from the tray clock, or from the bottom-right corner on thread pages. It names the thread; click to open it. Several waiting threads share one balloon. It hides after ten seconds or when dismissed, and returns only when another thread starts waiting. It never shows for the thread you're looking at.
- **Paint.** XP Paint on a canvas: pencil, brush, eraser, fill, line, rectangle, ellipse, and color picker; left and right mouse buttons paint with the primary and secondary colors from the 28-color palette. Undo with Cmd/Ctrl+Z, resize the canvas from its corner, and Save downloads a PNG.
- **Internet Explorer.** Opens bb's browser (following your "open links in bb" setting; in a web tab it opens a new tab).
- **Command Prompt.** Opens a real bb terminal on your machine in an XP console window (Start menu or Quick Launch). It is the same kind of session as bb's Terminal panel, so it keeps running if you leave the page and reattaches when you come back; closing the window ends it.
- **Games.** Minesweeper (Beginner, Intermediate, Expert; first click is always safe, right-click to flag, click a number to open around it) and Solitaire (Klondike, draw one; drag cards, click the stock to draw, double-click to send a card home) live under Games in the Start menu and can be added to Quick Launch.
- **Media Player.** Opening it starts visualizing your microphone right away with classic visualizations (Bars, Scope, and Ambience); pick one from the Visualization menu, or double-click the screen to switch. If it is stopped or blocked, click the screen to start. It keeps playing while you move around bb; minimized, it swaps its taskbar button for a mini-player in the tray; close it, press stop, or turn off the desktop to release the microphone. Audio never leaves the browser.
- **Desktop menu.** Right-click the desktop or any empty part of the new-thread page to set Organize by and Sort by, to Arrange icons into a grid, or to Tile windows, both in sort order.
- **Note pads.** Small spiral-bound pads in the style of XP Notepad. Add one from the note pad button in a thread's header, the Start menu, or New note pad in the desktop menu to place it where you clicked. Notes stay in the screen margins and follow you across every page, pinned to the nearer side. Drag the top strip to move, the corner to resize, the dot to change color, and × to delete (with Undo). Notes are saved on this device and hide when Desktop is off.
- **On/off.** The Desktop button in the sidebar footer turns the whole desktop on or off on this device. Turning it on takes you to the new-thread page. When it is off, the new-thread page shows no desktop, windows, or taskbar. The desktop, taskbar, and note pads never appear on phone-sized screens.

Agents and scripts can use the same features from the `bb desktop` CLI; see [the skill](skills/desktop/SKILL.md).

## Install

From this repository:

```bash
npm ci
bb plugin install "path:$PWD/plugins/desktop" --yes
```

## Develop

Before adding a feature, read the [design system](docs/DESIGN.md): which surfaces are Windows XP and which are bb, the color tokens, how icons are drawn, and the components to reuse.

Run the focused package check from the repository root:

```bash
npm run check --workspace=bb-plugin-desktop
```
