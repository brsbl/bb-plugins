# Desktop design system

Desktop recreates Windows XP (Luna) on top of bb. Every new surface follows the rules below so the plugin reads as one product, not a pile of features.

## 1. Pick the layer first

Every surface belongs to exactly one layer. Decide which before designing anything.

| Layer | Surfaces | Looks like | Why |
| --- | --- | --- | --- |
| **XP layer** | The desktop, icons, windows, taskbar, Start menu, tray, balloons, context menus opened on the desktop | Windows XP Luna: blue title bars, green Start, bevelled buttons, yellow balloons, drawn icons | This is the plugin's whole point |
| **bb layer** | Anything the plugin renders inside bb's own chrome: the thread-header folder label, the note pad header button, settings | Native bb: bb tokens, bb typography, line glyphs, no XP chrome | XP chrome inside bb's header would look broken, not nostalgic |

Note pads are the one floating exception: they live on every page, so they are drawn as XP Notepad paper (spiral binding, ruled page, Lucida Console) rather than full XP window chrome.

## 2. Names

- Use the XP name when a feature maps to an XP thing: **Start**, **Recycle Bin**, **Quick Launch**, **Show desktop**, **Turn Off Desktop**, **balloon**. Drop the "Windows" brand: it is **Media Player**, not Windows Media Player.
- Use bb's words for bb concepts: **thread**, **section**, **project**, **archive**, **needs input**. Never rename a bb concept to an XP one (a thread is never a "document").
- Sentence case everywhere except XP proper names.
- Thread windows borrow AOL Instant Messenger (AIM 5, circa 2002), not MSN Messenger: the program is **bb Messenger** (no AOL or AIM wordmark, and the running figure is our own drawing), a thread window is an **Instant Message**, and its related threads are **<project>'s Buddy List**. Messages read as AIM transcript lines, `Me:` in red and the agent's screen name (its provider, e.g. `ClaudeCode:`) in blue, in Times New Roman; diffs, tool calls, and the composer stay bb-styled. No sounds.

## 3. Color

All colors are tokens on `.bbd-root` in `app.css` (Luna palette, `--bbd-*`) or constants at the top of `art.tsx` (icon palette). Components never introduce a new color literal.

| Token | Use |
| --- | --- |
| `--bbd-blue`, `--bbd-blue-deep`, `--bbd-blue-bright`, `--bbd-blue-sky` | Title bars, taskbar, selection, links, focus |
| `--bbd-green`, `--bbd-green-deep` | Start button and "create" actions only |
| `--bbd-orange` | Attention accents (needs input, Start menu rule) |
| `--bbd-close`, `--bbd-close-deep` | The close button and destructive actions only |
| `--bbd-white` | Text and highlights on Luna blue or green |
| `--bbd-glass`, `--bbd-glass-solid` | Window and menu surfaces; follows bb's theme and Ambient |
| `--bbd-hairline`, `--bbd-hover`, `--bbd-press`, `--bbd-well`, `--bbd-select` | Borders, hover, pressed, inset wells, selected rows |

Rules:

- Luna hues are fixed, like XP's. Surfaces behind content derive from bb's `--canvas`/`--ink`/`--background` so light, dark, and Ambient all work.
- Mix translucent steps in `oklab`, opaque steps in `oklch`. No achromatic `oklch(L 0 0)` literals.
- New shared colors are added as a token first, then used.
- A self-contained app (the games in `games/`) may keep its own palette, but only as scoped tokens declared once at the top of its CSS file (`--bbd-mine-*`, `--bbd-sol-*`). Game logic lives in a pure `*-core.ts` module with tests; the component renders only the window body and `desktop.tsx` wraps it in `WindowFrame`.

## 4. Icons

Icons follow Microsoft's own rules from [Creating Windows XP Icons](https://learn.microsoft.com/previous-versions/ms997636(v=msdn.10)) (MSDN, 2001) and the [Windows XP Visual Guidelines](https://www.retrospace.net/download/WebApplications/WindowsXPDesignGuidelines/icons.htm). The real icons, drawn by The Iconfactory, are the reference; compare against them before drawing ([upscaled set](https://github.com/softwarehistorysociety/XPIcons), [original sizes](https://github.com/ShizukuIchi/winXP/tree/master/src/assets/windowsIcons)).

### The rules (from Microsoft)

- **Style:** "fun, color, and energy". Rich color, soft slightly rounded corners, gradients for depth, and a modern consumer look for everyday objects.
- **Light:** from the upper left, with ambient light.
- **Angle:** 48 and 32 px objects sit at an angle in perspective. At 16 px, documents, symbols (warning, error, info), and single objects face straight on.
- **Outline:** every object has an outline so it reads on any background: a darker shade of the object's own color, never plain black.
- **Drop shadow:** down and to the right (Photoshop angle 135°, distance 2, size 2). Here: the shared `bbd-drop` filter, which `IconSvg` applies to every object icon. Toolbar icons have no shadow.
- **Avoid:** letters, words, hands, and faces; more than three objects in one icon; the Windows flag outside the Start button.

### How it works in this plugin

- Object icons are `<Name>Art` components in `art.tsx`, drawn on a `48 × 48` viewBox inside `IconSvg`. Status icons use `16 × 16` inside `SmallSvg`.
- Colors come only from the `ICON` palette at the top of `art.tsx`. Gradients are defined once in `IconDefs`.
- Reuse the shared parts: `FolderShape`, `Bubble`, `Sparkle`, `Pencil`, `MiniWindow`.
- **"New" is the XP starburst** (`Sparkle`), as on XP's Make a new folder icon. Never a plus sign.
- Check every icon at 48, 32, and 16 px before shipping.

### Mapping bb to XP

Use the real XP icon when bb has an XP counterpart. When it does not, build from XP's vocabulary (the glossy speech bubble, the manila folder, the starburst, windows with a blue title bar) rather than inventing a style.

| bb thing | XP source | Icon |
| --- | --- | --- |
| Archive | Recycle Bin: frosted blue glass bin, two green curved arrows; full adds crumpled paper | `RecycleBinArt` |
| Folder, section, project | Folder: manila, angled, front flap; papers when it holds something | `FolderArt` |
| New folder | Make a new folder: folder plus starburst | `NewFolderArt` |
| Show desktop | Show Desktop: navy desk blotter with a sheet and a blue pencil | `ShowDesktopArt` |
| Media Player | Windows Media Player 10: ring in four colors, white disc, blue play triangle | `MediaPlayerArt` |
| Note pad | Notepad: spiral-bound pad with a pale-blue page and green ruled lines | `NotePadArt` |
| New thread | XP speech bubble (as on Information) plus starburst | `NewThreadArt` |
| My Threads (every thread) | My Documents: folder with the item tucked in, here a speech bubble; named "My …" like XP's personal folders | `ThreadsArt` |
| Plugins | Add or Remove Programs pattern: software box with a CD | `PluginsArt` |
| Skills | No XP counterpart; a glossy bolt in XP style | `SkillsArt` |
| Minesweeper | Minesweeper: a spiked black mine with a red flag | `MinesweeperArt` |
| Solitaire | Solitaire: two fanned cards, a spade behind a heart | `SolitaireArt` |
| Browser | Internet Explorer: blue glossy "e" with a gold orbit | `InternetExplorerArt` |
| Drawing | Paint: a palette of paint blobs with a brush | `PaintArt` |
| Terminal | Command Prompt: black window with a blue title bar and `C:\ _` | `CommandPromptArt` |
| Thread search | Search: straight-on magnifying glass with a gold handle | `SearchArt` |
| Command palette | Run: small window with a text field and speed lines | `RunArt` |
| Thread details | A window with a side pane | `DetailsArt` |
| Buddy List (bb Messenger) | AIM's running figure: yellow, dark outline, mid-stride facing right; no wordmark | `BuddyListArt` |
| Needs input, error, idle | Warning (yellow triangle, black "!"), Critical (glossy red sphere, white X), and a matching green sphere with a white check for idle | `StatusIcon` |

### Line glyphs

Hugeicons line glyphs (`bbGlyph`) are allowed only for small controls inside a window (view toggles, title-bar buttons) and for the bb layer (the note pad header button). They never stand in for an app, place, or object.

## 5. Components

Reuse these before building anything new.

| Need | Use |
| --- | --- |
| A Start menu entry | `programs` (left column, with a detail line) or `places` (right column, grouped by section) in `StartMenu`; every entry can be added to Quick Launch by id |
| A window | `WindowFrame` (title bar, minimize, maximize, close, status bar, resize) |
| A toolbar row in a window | `.bbd-menubar` |
| A button in a window | `.bbd-button .bbd-bevel` |
| A text field or select | `.bbd-field .bbd-sunken` |
| A grouped form section | `.bbd-fieldset` with a `<legend>` |
| A list of threads | `ThreadCollection` (icon or list view, status icons, folders line) |
| A thread window | `ThreadWindow`, drawn as a bb Messenger instant message: bb's `ThreadChat` restyled only through `.bbd-im-chat` CSS, plus a `.bbd-im-actions` row (**Buddy List**, **Get Info**) that docks the Buddy List on the left and thread info on the right. The status bar is AIM's typing line: "<agent> is typing..." while working, otherwise waiting, error, signed off, or idle time |
| Threads related to one thread | `BuddyListWindow` ("<project>'s Buddy List"): the thread's project, or its environment when it has one; groups are folders, then unfiled **Buddies**, each counted AIM-style as (not archived/total), then **Offline** (archived, collapsed). Idle threads are dimmed with their idle time, as AIM showed idle buddies; unread and needs-input are bold |
| A right-click menu | `desktop.openMenu(event, entries)` with `MenuEntry` items, headings, and separators |
| A desktop icon | `.bbd-icon` with `.bbd-icon-art` and `.bbd-icon-label` |
| A status | `StatusIcon` plus the `describeStatus` text |
| A notification | The tray balloon (`balloon.tsx`), one at a time |
| Another plugin's own UI as a program | The desktop app bridge (`bridge.ts`, `window.bbDesktopApps` version 1): the plugin registers an app and portals its UI into `AppWindow`. Plugin authors follow `skills/desktop-apps` |
| Another plugin's sidebar footer panel | Nothing to build: with the sidebar collapsed, the tray shows any footer disclosure as an XP window (`usePanelWindows`). bb keeps rendering the panel; Desktop only restyles and repositions it |

## 6. Layout and type

- Windows open with `defaultRect` sizes and stay inside the viewport (`clampRect`). List windows start at least 460 px wide so titles fit.
- The taskbar is a pill sized to its contents: Start, Quick Launch, window buttons, tray.
- Window buttons never shrink below a readable label (96 px). Buttons that don't fit move behind a » count button that lists them in a menu, and the focused window's button always stays visible.
- Text uses bb's sans font and typography tokens (`--text-xs`, and so on). The XP typeface exceptions are quoted XP artifacts: the balloon (Tahoma), Minesweeper numbers (Tahoma), note pads, and Command Prompt (Lucida Console, the XP console font).

## 7. Motion

- Short and ease-out: 120 to 340 ms. Motion explains a change (a window sliding clear, a balloon rising); it never decorates.
- Only `transform` and `opacity` animate.
- Every animation has a `prefers-reduced-motion: reduce` fallback with no movement.

## 8. Behavior

- **XP metaphors must do real bb work.** The Recycle Bin is the archive and the balloon is needs-input. Do not add a metaphor that is only a costume.
- **Never lose work silently.** Destructive actions confirm (delete folders) or are recoverable (archive, from the Recycle Bin).
- **Hidden on phones.** The desktop, taskbar, and notes never render at 767 px and below.
- **Accessible names.** Every icon button has an `aria-label` and a `title`. Keyboard: Enter opens, Delete deletes, Escape clears selection.

## 9. Adding a feature

1. Pick the layer (section 1) and the name (section 2).
2. Reuse components (section 5). If none fits, add the new one here in the same change.
3. Draw any new object icon to section 4, check it at 16 px, and put its colors in the `art.tsx` palette.
4. Add any new color as a token (section 3).
5. Give motion a reduced-motion fallback (section 7).
6. Update the README feature list.

## Luna reference values

Measured values for when a surface should match XP exactly. Sources: the [Visual Guidelines](https://www.retrospace.net/download/WebApplications/WindowsXPDesignGuidelines/controls.htm) and two faithful recreations, [XP.css](https://github.com/botoxparty/XP.css) and [winXP](https://github.com/ShizukuIchi/winXP).

| Element | XP value |
| --- | --- |
| Selection highlight | `#316AC5` with white text |
| Tooltip and balloon background | `#FFFFE1` |
| Title bar | Blue gradient `#0054E3` to `#3D95FF` (system colors); Trebuchet MS Bold 10 pt |
| System text | Tahoma 8 pt |
| Command button | 3 px radius, white to `#D8D0C4`, orange glow on hover |
| Close button | Red means high impact (Close); blue means neutral (minimize, maximize) |
| Start menu | Blue header with user picture, orange rule, white left and `#CBE3FF` right columns, blue footer |

### Deliberate departures

These differ from XP on purpose; keep them unless the owner decides otherwise.

- Window and menu surfaces are translucent glass that follows bb's theme and Ambient, instead of XP's opaque `#ECE9D8`.
- The taskbar is a floating pill sized to its contents, not a full-width bar.
- Text uses bb's sans font; only the balloon quotes Tahoma.
- The busy hourglass flips; XP's default hourglass was static. The motion shows that an agent is working.

## Known gaps

These predate this document and should be brought in line when touched:

- `ThreadArt` still uses the older `36 × 32` viewBox without the shared drop shadow. Move it to `IconSvg` when it is next changed.
