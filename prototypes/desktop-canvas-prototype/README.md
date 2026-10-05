# Canvas Desktop

A spatial bb workspace: Desktop's folders and windows on an infinite, zoomable canvas, without the Windows XP skin. Open `/plugins/desktop-canvas-prototype/desktop` from the sidebar.

## Use

- **Folders are your real organization.** Like Desktop, the canvas shows your sidebar sections and the loose Threads bucket, or your projects or machines, plus Pinned and any desktop-only folders. It follows the sidebar's organize and sort choices until you pick your own from the canvas's right-click menu. Groups you moved into More in the sidebar live in a More folder. Dropping a thread on a section moves it into that bb section; dropping it on a desktop folder files it there. Archived threads live in the Recycle Bin: drag a thread onto it to archive, right-click inside it to restore.
- **Arrange the canvas like Desktop.** Drag across empty canvas to select several folders, or ⌘/Ctrl/Shift-click to add and remove. Drag any selected folder to move them together, arrow keys nudge them (Shift moves a full slot), Delete removes selected desktop folders and sections after a confirmation, and ⌘/Ctrl-A selects everything. Drop folders on the Recycle Bin to delete them. Right-click the canvas for New folder (where you clicked), Arrange icons (in sort order, where you're looking), Tile windows, Cascade windows, Show desktop, Next and Previous window, Zoom to 100%, Fit all, Organize by and Sort by. Icon positions are saved by the plugin, so they follow you to other browsers.
- **Move around.** Scroll or two-finger swipe pans; hold Space and drag, or drag with the middle button, to pan with a mouse. Pinch, or ⌘/Ctrl-scroll, zooms around the pointer, including over windows; ordinary scrolling inside a window stays in the window. With the canvas focused, arrow keys pan, + and − zoom, 0 returns to 100% and ⇧1 fits everything. The zoom controls sit at the top right.
- **Windows.** Folders open as Finder windows with Back and Forward, search, icon and list views, and a New thread button; threads open as bb conversations. Windows are translucent glass that follows bb's theme and Ambient. Drag a title bar to move a window, drag any edge or corner to resize it, double-click the title bar to maximize it to the screen, and drag a maximized window to pull it back onto the canvas. Focus a title and use arrow keys to move it without a pointer. Opening a window brings it into view at 100%. Each window has a dock button: click to bring it forward, click again to minimize; right-click for Minimize, Maximize and Close. Buttons that don't fit collapse into a +N button. Thread and mention links inside a window open that thread as another window.
- **Thread actions.** Right-click a thread, or use a thread window's … button, for Open in bb, Open in split, Move to, Remove from folder, Copy thread link, Mark as read or unread, Pin, Rename, Archive or Restore, and Delete.
- **Composer.** The dock's Launcher offers Composer, My Threads and New folder. Composer opens bb's native prompt with no extra chrome; its placement menu offers Center, Float and Hide, and the draft stays put across all three. Drag a floating composer by its top edge, or focus that edge and use arrow keys. A folder's New thread files the thread into that section, project or desktop folder.

The first version kept desktop folders in this browser only; they are moved to the plugin's storage the first time this version loads. Layout and windows are per browser; folders and icon positions are shared. The canvas is meant for desktop-sized viewports.

## Develop and install

From this repository, install package dependencies with `npm ci --prefix prototypes/desktop-canvas-prototype`. The dedicated Canvas Desktop Prototype workflow runs checks remotely. The build script uses the repository's pinned SDK builder; bb's Git/path installer bundles the same entry points automatically.

Install only into an isolated development bb first. Production installation is a separate user action:

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@<tested-commit> --subdirectory prototypes/desktop-canvas-prototype --yes
```

Uninstall `desktop-canvas-prototype` to remove its page. Desktop folders and icon positions are kept in the plugin's own storage; sections it creates or renames are ordinary bb sections. Requires bb with `experimental_NewThreadComposer`, `ThreadChat`, sidebar data hooks and nav panels. Vendored button and motion primitives come from bb core's `packages/shared-ui/src`; the SDK and build dependencies are the repository's pinned releases.
