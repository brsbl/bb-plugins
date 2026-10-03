# Desktop architecture

How the plugin's code is organized. [DESIGN.md](DESIGN.md) covers how it should look and behave; this document covers where code lives and which way dependencies point.

## Layers

Imports only point down this list. A module never imports from a layer above it.

| Layer | Directory | Owns |
| --- | --- | --- |
| Leaves | `core.ts`, `art.tsx`, `bridge.ts`, `enabled.ts`, `slots.ts`, `screen-names.ts`, `door-sounds.ts`, `server.ts`, `apps/xp-chrome.tsx`, `services/` | Pure logic, icon drawings, the third-party app bridge, the on/off switch, bb slot ids, persisted server state, and the native resources windows hold: browser views, terminal sessions, the microphone |
| Window system | `windows/` | Window specs, the window reducer and its persistence, geometry, pointer capture, `WindowFrame` |
| Page | `page/` | The note pads and the needs-input balloon |
| Shell services | `shell/data.tsx`, `shell/menu.tsx`, `shell/menus.tsx`, `shell/links.ts`, `shell/commands.ts`, `shell/thread-drag.ts` | Desktop data and actions, context menus, in-desktop link routing, bb keyboard commands, thread drag and drop |
| Programs | `programs/`, `games/`, `apps/` | Everything that renders inside a window |
| Registry | `programs/registry.tsx`, `programs/launcher-ids.ts`, `programs/launchers.tsx` | Which program renders each window kind, and the catalog of things a person can launch |
| Chrome | `shell/canvas.tsx`, `shell/page-menu.ts`, `taskbar/`, `shell/window-layer.tsx`, `shell/folder-chip.tsx` | The icon canvas, the taskbar and Start menu, the portal that stacks windows over bb |
| Composition | `shell/desktop.tsx` | Wires the providers and chrome together |
| Entry | `app.tsx` | Registers the homepage section, footer action, thread header action and content script |

The note pads and the needs-input balloon (`page/`) render on every bb page, not only the desktop, so they depend only on leaves and `windows/`. Services are leaves for the same reason: `enabled.ts` stops the microphone when the desktop turns off in any tab or bb narrows to its compact layout, without importing a program.

## Window system (`windows/`)

| File | Contents |
| --- | --- |
| `specs.ts` | `WindowSpec`, `WindowKind`, `windowId`, `threadIdOf`, `parseSpec` |
| `state.ts` | `windowReducer`, and `parseWindows`/`serializeWindows` for `bb-desktop:windows:v1` |
| `geometry.ts` | `chromeTop`, `viewportRect`, `workAreaRect`, `fitDragRect`, `resizeInArea`, `defaultRect` |
| `pointer.ts` | `trackPointer`, `usePointerTracker`, `crossedDragThreshold`, `previewRect` |
| `focus.ts` | `windowOwnsKeys` and `typingElsewhere`, so window-wide shortcuts and focus-on-open leave bb's composer alone |
| `manager.tsx` | `WindowManagerProvider` and `useWindowManager`, including `closeWhere` |
| `frame.tsx` | `WindowTitleBar`, `WindowFrame` |
| `index.ts` | The public surface other layers import |

`windows/` knows nothing about programs. The provider takes two functions from the registry: `sizeOf(spec)` for a new window's default size, and `onDispose(spec)`, which runs on every close path so a window's native resources are released even when archiving a thread closes it.

## Programs

Every window kind has exactly one `ProgramDefinition` in `programs/registry.tsx`:

```ts
interface ProgramDefinition<K extends WindowKind> {
  size(spec: SpecOf<K>): Size;
  title(spec: SpecOf<K>, desktop: DesktopContextValue): string;
  art(spec: SpecOf<K>, desktop: DesktopContextValue, size: number): ReactNode;
  Window: ComponentType<{ window: DesktopWindow & { spec: SpecOf<K> } }>;
  dispose?(spec: SpecOf<K>): void;
}
```

The registry is typed as `{ [K in WindowKind]: ProgramDefinition<K> }`, so adding a kind to `WindowSpec` fails to compile until the program is registered. Taskbar buttons, tiling, window titles and the window layer all read the registry; nothing else switches on `spec.kind`.

Each `Window` component renders its own `WindowFrame`, so a program controls its status bar, title actions and `keepMounted`. Cleanup belongs in `dispose`, not in a frame `onClose`, which only runs when the close button is used.

| Directory | Programs |
| --- | --- |
| `programs/threads/` | Instant Message, Buddy List, Buddy Info, thread tabs, explorer windows (folder, My Threads, More, Recycle Bin), New folder, New thread |
| `programs/` | bb Explorer (`internet-explorer.tsx`), Terminal (`command-prompt.tsx`), Media Player, third-party app windows |
| `games/`, `apps/` | Minesweeper, Solitaire, Pinball, 3D Maze, Paint |

Thread status wording and ranking (`statusTone`, `folderSummary`, `statusKind`, `describeStatus`, `typingLine`, `buddyRank`) live in `programs/threads/status.ts` as pure functions with tests; `status-ui.tsx` renders them.

## Launchers

`programs/launchers.tsx` is the single catalog of launchable things. Each launcher has a stable id, a label, art, and an action: open a window spec, run a bb command, navigate, or a custom handler. The Start menu, Quick Launch and the taskbar all read it:

- Quick Launch persists launcher ids through the `setPreferences` RPC. The ids live in `programs/launcher-ids.ts` and are a stored contract; add new ones, never rename or remove one. Programs other plugins register use `app:<key>`.
- The Start menu lists launcher ids by column and section. Adding a program to the Start menu is one line.
- Show Desktop remembers which windows it minimized in a module-level store, so the second click restores exactly those.

## Shell

| File | Contents |
| --- | --- |
| `data.tsx` | The snapshot fetch (realtime refresh, stale responses dropped, sidebar preferences at most every 15 seconds), `DesktopDataProvider`, `useDesktop`, and actions: `openThread`, `dropThread`, `restoreThread`, `archiveThread`, `setPreferences` |
| `menu.tsx` | `MenuEntry`, `MenuProvider`, `useMenu().open(event, entries)` |
| `menus.tsx` | Shared entry builders: `threadMenu`, `groupMenu`, `viewMenuEntries` |
| `canvas.tsx`, `canvas-icons.tsx` | The icon canvas (layout, selection, marquee, multi-drag, arrange, tile) and its icons: folders, More, note pads, the Recycle Bin |
| `page-menu.ts` | The background right-click menu on the rest of the homepage |
| `window-layer.tsx` | The `document.body` portal: windows from the registry, link capture |
| `links.ts` | Thread-link and chat web-link routing |
| `commands.ts` | `runAppCommand` (bb keybindings), `navigateInApp` |
| `thread-drag.ts` | Pointer thread drags onto `[data-thread-drop]` targets, which set `data-drop-target` while hovered |
| `folder-chip.tsx` | The thread-header folder label, loaded with the `threadFolders` RPC rather than the whole snapshot |
| `desktop.tsx` | `Desktop`: the providers, `DesktopShell`, and the taskbar's dock frame |

## Taskbar (`taskbar/`)

`taskbar.tsx` composes the **bb** start button, Quick Launch, task buttons and the tray. `capacity.ts` measures how many buttons fit. `start-menu.tsx` and `quick-launch.tsx` render launchers. `tray.tsx` holds the clock and mirrored footer icons; `footer-panels.ts` restyles collapsed-sidebar footer panels as XP windows.

## CSS

All CSS lives in one root `app.css`, the first import in `app.tsx`, including each program's styles and a copy of xterm.js's stylesheet. It stays a single file because the install-ref publisher (`tooling/publish-install-refs.mjs`) copies the plugin's root `app.css` into git-install releases and drops every stylesheet a component imports, so never import CSS from anywhere else. The `.bbd-root` tokens and shared primitives (`.bbd-glass`, `.bbd-bevel`, `.bbd-sunken`, `.bbd-button`) come first, and later rules override earlier ones at equal specificity, so add a rule next to the other rules for its surface and move one only after checking that no rule it passes shares its specificity. Class names are part of the visual contract; renaming one is a visual change. The build scans every source file for Tailwind classes, so new directories need no configuration.

The Instant Message window restyles bb's `ThreadChat` through bb's private markup, which bb may change in any release. Every rule that depends on it sits in the fenced **bb ThreadChat contract** section of `app.css`, scoped by the `.bbd-im-chat` class; nothing outside that section names the class. `ThreadWindow` runs `checkChatContract` (`programs/threads/chat-contract.ts`) from a layout effect and a throttled `MutationObserver` and records the result in `data-bbd-chat-contract` (`pending`, `ok`, or `mismatch`). On a mismatch it warns once, drops `.bbd-im-chat` so bb's own chat shows inside the AIM frame, and renders an archived thread with bb's composer-less `variant="timeline"`, since the rule hiding its message box is part of the contract. A mismatch lasts until the window reopens. `programs/threads/.ignore` keeps the captured bb markup in `__fixtures__/` and the test that queries it out of the Tailwind scan.

## Stored and public contracts

These outlive a release. Changing one needs a migration.

| Contract | Where |
| --- | --- |
| Open windows, `bb-desktop:windows:v1` in `localStorage` | `windows/specs.ts`, `windows/state.ts` |
| Other `localStorage` keys: `bb-desktop:enabled`, `bb-desktop:notes:v1`, `bb-desktop:visualization`, `bb-desktop:minesweeper:difficulty`, `bb-desktop:pinball:*`, `bb-desktop:maze:options:v1`, and the browser and terminal keys | `enabled.ts`, `page/sticky-notes.tsx`, `programs/media-player.tsx`, `games/`, `services/` |
| Native tab ids: `bb-desktop-internet-explorer`, `bb-desktop-thread-browser-<tab>`, `bb-desktop:command-prompt`, `bb-desktop:thread-terminal:<tab>` | `services/browser.ts`, `services/terminal.ts` |
| Quick Launch launcher ids, defaulting to `DEFAULT_QUICK_LAUNCH`; the server accepts at most 24 ids of 160 characters | `programs/launcher-ids.ts`, `core.ts`, `server.ts` |
| Desktop icon layout keys: `recycle-bin`, `more`, `note:<id>`, group keys | `shell/canvas.tsx`, `server.ts` |
| Draft keys `desktop:new-thread:<group>` | `programs/threads/new-thread.tsx` |
| `window.bbDesktopApps` version 1 and the `bb-desktop-apps:ready` event | `bridge.ts`, `skills/desktop-apps` |
| Server RPC and storage, and the `thread-list` plugin's `listPreferences` RPC it reads for sidebar order | `server.ts`, `shell/data.tsx`, `skills/desktop` |

## Tests

Pure modules have co-located `*.test.ts` files. `windows/state.test.ts` loads a stored v1 fixture so an incompatible change to window persistence fails CI, `programs/launcher-ids.test.ts` pins the Quick Launch ids, and `programs/threads/status.test.ts` pins thread status wording. `programs/threads/chat-contract.test.ts` runs the contract check and the key contract selectors from `app.css` against `programs/threads/__fixtures__/thread-chat.html`, real `ThreadChat` markup captured from the bb web app with the bb commit it came from noted at its top; recapture it whenever bb's chat markup changes, then update the contract rules to match. Tests run in Node without a DOM unless they opt into jsdom, as the window and chat contract tests do, so a module a test imports must not import a browser-only dependency.
