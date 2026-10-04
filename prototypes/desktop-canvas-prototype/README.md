# Canvas Desktop

A standalone **prototype** of a spatial bb workspace. Open `/plugins/desktop-canvas-prototype/desktop` from the sidebar.

Project folders collect your existing threads. Create canvas folders in Launcher and move membership with the folder selector in Find threads. Arrange folders and conversation windows by dragging their title bars, or focus a title and use arrow keys (Shift moves farther). These changes stay in this plugin; they never change a thread's project or section.

Launcher opens the floating composer. Drag its title bar or use arrow keys to move it in screen space; its position is remembered. Center is an explicit action.

The real bb composer stays mounted as you center, float, hide, and restore it. Creation uses bb's normal submission behavior. Conversations use `ThreadChat`; choose Read at 100%, Focus, or Open in bb for readable editing. Minimize restores from the bottom taskbar; close removes only the window. Fit all and Find threads recover offscreen items. Scroll pans; Ctrl/⌘ + scroll zooms. Focus the canvas for arrow-key pan and +/−/0 zoom controls. Escape closes the launcher or focused view.

Layout and folders persist per browser in a separate plugin namespace; the host owns thread drafts. This prototype does not replace the global home page or shortcuts, install Desktop, or add browser/terminal integrations. It is intended for a desktop-sized viewport. Only the selected conversation renders a live chat; the others remain lightweight overview windows.

## Develop and install

From this repository, install package dependencies with `npm ci --prefix prototypes/desktop-canvas-prototype`. The dedicated Canvas Desktop Prototype workflow runs checks remotely. The build script uses the repository's pinned SDK builder; bb's Git/path installer bundles the same entry points automatically.

Install only into an isolated development bb first. Production installation is a separate user action:

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@<tested-commit> --subdirectory prototypes/desktop-canvas-prototype --yes
```

Uninstall `desktop-canvas-prototype` to remove its page. The prototype owns no server-side thread organization. Requires bb with `experimental_NewThreadComposer`, `ThreadChat`, sidebar data hooks, and nav panels; verified against core `1e2cee69ade40d437e169f712bd6599dfa1d58db`. Vendored button and motion primitives come from that core's `packages/shared-ui/src`; the SDK/build dependencies remain the repository's pinned releases.
