# Canvas Desktop

A standalone **prototype** of a spatial bb workspace. Open `/plugins/desktop-canvas-prototype/desktop` from the sidebar.

Project folders and section collections show your existing threads, using bb’s filled Folder and Section icons. Section collections reflect the live section assignment. Like Desktop, click a folder to select it, double-click or press Enter to open it, and drag it to arrange the canvas. Each folder opens a movable Finder-style window with search, list/icon views, and thread selection. Double-click a thread (or select it and press Open) to open its native bb conversation. Drag threads into canvas folders or use Move to; this never changes their underlying project or section. Right-click a custom canvas folder to rename it.

The launcher contains Composer, Threads, and New folder. Composer opens the native bb prompt directly above the taskbar, with its grip and × inside one rounded frame. Drag its top grip to move it, or focus the grip and use arrow keys. The top-right × minimizes it; Composer in the taskbar reopens it above the taskbar. The same editor and draft remain mounted while minimized.

The canvas uses a quiet grid and a muted bb mark. Pinch anywhere over the canvas, including folder and conversation content, to zoom around the gesture. Trackpad pinch, Ctrl/⌘ + scroll, and two-finger touch are supported. Ordinary scrolling inside a window stays inside that window; scrolling elsewhere pans the canvas. Fit all recovers offscreen items. Focus the canvas for arrow-key pan and +/−/0 zoom. Focus a folder or window title for arrow-key movement (Shift moves farther).

Drag a window title to either edge, or use its Position menu to dock left or right. Each side holds one window; replacing it returns the previous window to the canvas. Docked windows stay flush to bb’s panel edges when panels expand or collapse, and stay readable while the canvas pans or zooms. Drag the title away or choose Undock to return to the canvas. Docking and minimized slots persist per browser.

Conversations use `ThreadChat`; choose Read at 100%, Focus, or Open in bb for readable editing. Minimize restores from the taskbar; close removes only the window. Layout and folders persist per browser in a separate plugin namespace, including layouts saved before folder windows were added. The host owns thread drafts. This prototype does not replace the global home page or shortcuts. It is intended for a desktop-sized viewport. The selected floating conversation and up to two docked conversations render live chats; other floating windows remain lightweight overviews.

## Develop and install

From this repository, install package dependencies with `npm ci --prefix prototypes/desktop-canvas-prototype`. The dedicated Canvas Desktop Prototype workflow runs checks remotely. The build script uses the repository's pinned SDK builder; bb's Git/path installer bundles the same entry points automatically.

Install only into an isolated development bb first. Production installation is a separate user action:

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@<tested-commit> --subdirectory prototypes/desktop-canvas-prototype --yes
```

Uninstall `desktop-canvas-prototype` to remove its page. The prototype owns no server-side thread organization. Requires bb with `experimental_NewThreadComposer`, `ThreadChat`, sidebar data hooks, and nav panels; verified against core `1e2cee69ade40d437e169f712bd6599dfa1d58db`. Vendored button and motion primitives come from that core's `packages/shared-ui/src`; the SDK/build dependencies remain the repository's pinned releases.
