# Desktop design system

Desktop recreates Windows XP (Luna) on top of bb. Every new surface follows the rules below so the plugin reads as one product, not a pile of features.

## 1. Pick the layer first

Every surface belongs to exactly one layer. Decide which before designing anything.

| Layer | Surfaces | Looks like | Why |
| --- | --- | --- | --- |
| **XP layer** | The desktop, icons, windows, taskbar, Start menu, tray, balloons, context menus opened on the desktop | Windows XP Luna: blue title bars, green Start, bevelled buttons, yellow balloons, drawn icons | This is the plugin's whole point |
| **bb layer** | Anything the plugin renders inside bb's own chrome: the thread-header folder label, the note pad header button, settings | Native bb: bb tokens, bb typography, line glyphs, no XP chrome | XP chrome inside bb's header would look broken, not nostalgic |

Note pads still float on every page, but share the programs’ glass title bar and menus. XP Notepad had a plain white editing surface; the spiral binding and rules belong to its icon, not its document.

## 2. Names

- Use the XP name when a feature maps to an XP thing: **Start**, **Recycle Bin**, **Quick Launch**, **Show desktop**, **Turn Off Desktop**, **balloon**. Drop the "Windows" brand: it is **Media Player**, not Windows Media Player.
- Use bb's words for bb concepts: **thread**, **section**, **project**, **archive**, **needs input**. Never rename a bb concept to an XP one (a thread is never a "document").
- Sentence case everywhere except XP proper names.
- Thread windows borrow AOL Instant Messenger (AIM 5, circa 2002), not MSN Messenger: the program is **bb Messenger** (no AOL or AIM wordmark, and the running figure is our own drawing), a thread window is an **Instant Message**, and its related threads are **<project>'s Buddy List**. Messages read as AIM transcript lines, `Me:` in blue and the agent's screen name in red, in Times New Roman, with wrapped lines running under the name. Screen names follow real 1997–2006 AIM conventions (3–16 letters and digits, starting with a letter: `xX…Xx`, birth years, `sk8r`, `4lyfe`, `b0i`, `babii`, alternating caps), always contain the agent's name, and are picked deterministically per thread. Timeline notices and tool calls are gray italic system lines, code and the composer are XP fields, and the send button reads **Send**. The only sounds are original procedural door Foley at turn start and end, played for threads with an open IM window: handle release and an irregular hinge creak for opening, a shorter hinge motion followed by a wooden slam and latch rattle for closing. No AOL recording or third-party sample is shipped.

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

- Luna hues are fixed, like XP's. bb-facing surfaces derive from bb's `--canvas`/`--ink`/`--background`. Bundled XP program chrome uses the same glass tokens. Their documents, boards, cards and skins can use fixed `--bbd-xp-*` or app-scoped colors where the original content is the reference.
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
| Pinball | Pinball: a navy table with two bumpers, flippers, and a silver ball | `PinballArt` |
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
| An XP program menu | `ProgramMenuBar` in `apps/xp-chrome.tsx`: compact Tahoma labels, separators, checks, shortcuts, disabled commands, arrow-key navigation and Escape |
| An XP program status bar | `ProgramStatusBar`, or the `WindowFrame` status slot, with the same `.bbd-statusbar` styling |
| A floating note title bar | `WindowTitleBar`, also used by `WindowFrame`; preserve the note’s separate persistence and drag lifecycle |
| A button in a window | `.bbd-button .bbd-bevel` |
| A text field or select | `.bbd-field .bbd-sunken` |
| A grouped form section | `.bbd-fieldset` with a `<legend>` |
| A list of threads | `ThreadCollection` (icon or list view, status icons, folders line) |
| A thread window | `ThreadWindow`, drawn as a bb Messenger instant message: bb's `ThreadChat` restyled only through `.bbd-im-chat` CSS, plus a `.bbd-im-actions` row (**Buddy List**, **Get Info**, **Browser**, **Terminal**) that docks the Buddy List on the left and thread info on the right, and opens `thread-tab` windows: a per-tab native browser view attached to the thread, or a terminal created with the `{ kind: "thread" }` target. `ThreadChat` uses `permissionPolicy="editable"`. The status bar is AIM's typing line: "<agent> is typing..." while working, otherwise waiting, error, signed off, or idle time |
| Threads related to one thread | `BuddyListWindow` ("<project>'s Buddy List"): the thread's project, or its environment when it has one; groups are folders, then unfiled **Buddies**, each counted AIM-style as (not archived/total), then **Offline** (archived, collapsed). Idle threads are dimmed with their idle time, as AIM showed idle buddies; unread and needs-input are bold |
| A right-click menu | `desktop.openMenu(event, entries)` with `MenuEntry` items, headings, and separators |
| A desktop icon | `.bbd-icon` with `.bbd-icon-art` and `.bbd-icon-label` |
| A status | `StatusIcon` plus the `describeStatus` text |
| A notification | The tray balloon (`balloon.tsx`), one at a time |
| Another plugin's own UI as a program | The desktop app bridge (`bridge.ts`, `window.bbDesktopApps` version 1): the plugin registers an app and portals its UI into `AppWindow`. Plugin authors follow `skills/desktop-apps` |
| Another plugin's sidebar footer panel | Nothing to build: with the sidebar collapsed, the tray shows any footer disclosure as an XP window (`usePanelWindows`). bb keeps rendering the panel; Desktop only restyles and repositions it |

### Bundled XP programs

Compare against [GUIdebook’s XP application captures](https://guidebookgallery.org/screenshots/winxppro/), [XP Solitaire and its deck picker](https://www.mobygames.com/game/21468/microsoft-windows-xp-included-games/screenshots/), [XP Paint](https://media.criticalhit.net/2017/07/ms-paint-xp.jpg), and [Media Player 9 on XP](https://sdfox7.com/xp/files/wmp9xp.jpg). These references distinguish the document from the program icon and WMP’s silver-blue skin from the ordinary XP control face.

All eight programs use `WindowFrame`/`WindowTitleBar`, `ProgramMenuBar` and `ProgramStatusBar` where the original has those rows. Keep the established split-the-difference treatment: frosted-glass frames, flat faintly blue title bars, and glass menu/status surfaces following bb’s theme and Ambient. Mark bodies `.bbd-program`; use `.bbd-program-note` for the persistent note. Inside that shared chrome, preserve the original program’s board, document, card or skin vocabulary with a modest modern twist. Menus are compact Tahoma with blue selection; status panes are inset, not floating pills. Unsupported commands are visibly disabled. Scope program rules away from IM, Buddy List and the host composer.

| Program | Reference details and implementation boundary |
| --- | --- |
| Minesweeper | Classic gray `#C0C0C0`, three-digit red seven-segment counters, raised yellow face, inset field; numbers blue, green, red, navy, maroon, teal, black, gray. Game contains New/F2 and difficulty checks. Preserve responsive cells and the tested core. |
| Solitaire | Flat `#008000` felt, white 71 × 96 proportioned cards, red/black corner ranks, rank-counted pips and mirrored court illustrations, blue geometric backs. Game/Help menus and bottom moves/time status. Artwork is an original vector adaptation; existing draw rules and move count remain. |
| Pinball | Black cabinet, silver/red mechanisms, space-themed printed table art, purple score lettering, red ball label and silver inset side panel. Game/Options/Help rows; keyboard controls in Options. Artwork follows Space Cadet’s visual vocabulary but remains aligned with this plugin’s existing collision geometry; do not imply it reproduces the original mission table. |
| Paint | File/Edit/View/Image/Colors/Help; two columns of eight tool positions, gray workspace, 28-color box and inset status. Eight existing tools remain active; unimplemented selection/text/curve/polygon tools occupy their original positions but are disabled. Do not alter the raster core to make a cosmetic change. |
| Media Player | WMP 9 silver-blue skin, Now Playing band, black visualization screen and circular blue playback control. Keep the real microphone input and three existing visualization presets; this is not a media-library or CD player. |
| Note pad | Plain white document, Lucida Console, File/Edit/Format/View/Help, shared glass title. Keep autosave, multiple notes, edge anchoring and deletion undo. Tone is a small frame accent selected from View; do not return ruled paper or a spiral to the document. |
| Command Prompt | Shared glass frame, no program menu bar. [XP consoles originally kept Classic chrome under Luna](https://devblogs.microsoft.com/oldnewthing/20071231-00/?p=23983), but this plugin deliberately shares its modern glass frame across programs. Leave the embedded bb terminal’s rendering, theme, keyboard and session behavior untouched. |
| Internet Explorer | IE6 File/Edit/View/Favorites/Tools/Help, compact navigation toolbar, square address field and green-arrow Go button, inset status panes. Change only chrome; the native browser view and web-only placeholder remain untouched. |

Program names and Start/Quick Launch identifiers and icons are stable. Do not fold a pending rename into visual fidelity work. References are research evidence, not distributable assets; game and program drawings remain original source artwork.

### bb Messenger: AIM 4.x–5.x reference

The reference is Windows AIM around 2000–2004, rather than later AIM 6 or MSN. Compare the [AIM 4.7 Buddy List](https://en.wikipedia.org/wiki/AIM_(software)), the [contemporary AIM 4.8 release screenshot](https://internet.watch.impress.co.jp/www/article/2002/0617/aim.htm), and [AIM 5.1 running in an XP VM](https://notes.jordanscales.com/away-messages). The [AIM 4.8 away-message tutorial](https://www.awaymessages.com/guide/aim1.htm) shows its menu and editor. The [historical XP IM capture](https://s3.amazonaws.com/arena-attachments/796671/ccb89081566bc1468e50478ab407c6b4.pdf) shows red/blue serif dialogue and the grouped action strip. The [Buddy Info capture published in March 2006](https://repository.gatech.edu/bitstreams/607aabe2-7ef7-4d6b-a77f-86bf221308f5/download) corroborates the classic profile layout, but its exact client version is unverified. The [5.9 IM screenshot](https://www.kirsle.net/smarterchild-and-other-aim-bots) is a later corroborating reference, not an exact 2002 specimen.

- **Chrome and proportions:** use the same `WindowFrame` and Luna colors as every desktop program. Inside it, use compact Tahoma controls, square inset transcript/list fields, and a flat icon-and-caption action strip with relief on hover and press. Start IMs at 620 × 640 and Buddy Lists at 280 px wide; the larger IM size accommodates technical conversations. Controls wrap at narrow widths.
- **IM hierarchy:** thread title in the title bar, a compact **Thread** menu and **To:** screen name, transcript, existing composer, bottom actions, then the shared typing/status bar. Thread and the title-bar **…** open the same real thread actions. Historical File/Edit/Insert/People menus, formatting strips, and Warn/Block/Expressions/Games/Talk/Send rows are reference anatomy, not permission to add nonfunctional buttons. Keep the real **Buddy List**, **Get Info**, **Browser**, and **Terminal** actions.
- **Transcript:** Times New Roman at 15 px with 21 px line height, matching bold screen-name metrics, blue `Me:` and red agent labels, no truncated names, 3 px between timeline rows. Wrapped text starts at the left edge. Message actions remain available without reserving a blank row. Code stays Lucida Console and wraps long lines. Tool calls and timeline notices use 12 px italic Tahoma with readable gray text and square edges; preserve their real disclosure, result, and error behavior.
- **Buddy List:** our own 48 px figure and **bb Messenger** name occupy the blue branding area. Put the project/environment identity beneath the name, online count below the banner, and scope tabs immediately above the inset tree. Groups retain disclosure triangles and `(available/total)` counts. Idle/offline names are muted and italic, unread/needs-input names bold, selection Luna blue. Offline starts collapsed. Keep real thread titles and status icons instead of inventing network presence or away messages. The bottom **IM** and **Info** controls open the selected thread or its details.
- **Buddy Info:** Get Info opens an adjacent window titled **<thread> - Buddy Info**, with screen name, current status, and inset thread details. Show real project, branch, PR, and folder data. AIM's away text and profile provide the layout reference; do not fabricate an away message or warning percentage.
- **Theme and art:** Messenger's paper, bevel, and system-text tokens are scoped to `.bbd-im`, `.bbd-buddies`, and `.bbd-im-info` and derive from the shared palette. Light mode has pale paper; dark mode uses lighter blue/red screen names so both labels exceed 4.5:1 contrast on dark paper. This is an explicit messenger type exception: Tahoma for controls and system lines, Times New Roman for conversation, Trebuchet MS for the brand, Lucida Console for code. Keep our name and original art; no AOL logo, mascot asset, advertising, or ticker.
- **Composer boundary:** the prompt box and its formatting/reply/send/stop controls are host-owned and unchanged by this Messenger pass, including their placement and current Send/Stop presentation. Do not apply the transcript typography rules to the composer.
- **Sound provenance:** `door-sounds.ts` generates and caches two short PCM buffers from seeded noise and resonances. Opening has latch release before hinge friction; closing has a broad wooden impact followed by a latch. This is original synthesis under the plugin's license, with no external asset attribution required. AIM used these cues for buddy sign-on/off; bb retains its existing open-IM turn-start/end mapping.

## 6. Layout and type

- Windows open with `defaultRect` sizes and stay inside the viewport (`clampRect`). List windows start at least 460 px wide so titles fit.
- The taskbar is a pill sized to its contents: Start, Quick Launch, window buttons, tray.
- Window buttons never shrink below a readable label (96 px). Buttons that don't fit move behind a » count button that lists them in a menu, and the focused window's button always stays visible.
- bb-facing text uses bb's sans font and typography tokens. Bundled XP programs use compact 11 px Tahoma menus and Lucida Console for Note pad; window titles keep the shared bb typography. Command Prompt retains the embedded terminal’s own type settings. The balloon also uses Tahoma; Messenger’s exceptions are specified above.

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

- Window and menu surfaces are translucent glass that follows bb's theme and Ambient, instead of XP's opaque `#ECE9D8`. This includes the bundled programs’ outer frames, flat title bars, menus and status bars. Their inner documents and game fields may retain authentic fixed colors.
- The taskbar is a floating pill sized to its contents, not a full-width bar.
- bb-facing text uses bb's sans font; programs and the balloon quote XP typography.
- The busy hourglass flips; XP's default hourglass was static. The motion shows that an agent is working.

## Known gaps

These predate this document and should be brought in line when touched:

- `ThreadArt` still uses the older `36 × 32` viewBox without the shared drop shadow. Move it to `IconSvg` when it is next changed.
