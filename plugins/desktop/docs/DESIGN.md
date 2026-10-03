# Desktop design system

Desktop recreates Windows XP (Luna) on top of bb. Every new surface follows the rules below so the plugin reads as one product, not a pile of features.

## 1. Pick the layer first

Every surface belongs to exactly one layer. Decide which before designing anything.

| Layer | Surfaces | Looks like | Why |
| --- | --- | --- | --- |
| **XP layer** | The desktop, icons, windows, taskbar, Start menu, tray, balloons, context menus opened on the desktop | Windows XP Luna: blue title bars, green Start, bevelled buttons, yellow balloons, drawn icons | This is the plugin's whole point |
| **bb layer** | Anything the plugin renders inside bb's own chrome: the thread-header folder label, the note pad header button, settings | Native bb: bb tokens, bb typography, line glyphs, no XP chrome. The note pad header button is the one exception: it shows `NotePadArt` so it matches the note pads it creates | XP chrome inside bb's header would look broken, not nostalgic |

Note pads still float on every page, but share the programs’ glass title bar and menus. XP Notepad had a plain white editing surface; the spiral binding and rules belong to its icon, not its document.

## 2. Names

- Use the XP name when a feature maps to an XP thing: **Start menu**, **Recycle Bin**, **Quick Launch**, **Show desktop**, **Turn Off Desktop**, **balloon**. Drop the "Windows" brand: it is **Media Player**, not Windows Media Player. Where the XP name is itself a brand, bb takes its place: the start button reads **bb**, Internet Explorer is **bb Explorer**, and Command Prompt is **Terminal**.
- Use bb's words for bb concepts: **thread**, **section**, **project**, **archive**, **needs input**. Never rename a bb concept to an XP one (a thread is never a "document").
- Sentence case everywhere except XP proper names.
- Thread windows borrow AOL Instant Messenger (AIM 5, circa 2002), not MSN Messenger: the program is **bb Messenger** (no AOL or AIM wordmark, and the running figure is our own drawing), a thread window is an **Instant Message**, and its related threads are **<project>'s Buddy List**. Messages read as AIM transcript lines, `Me:` in blue and the agent's screen name in red, in Times New Roman with the names in bold, and wrapped lines running under the name. Screen names follow real 1997–2006 AIM conventions (3–16 letters and digits, starting with a letter: `xX…Xx`, birth years, `sk8r`, `4lyfe`, `b0i`, `babii`, alternating caps), always contain the agent's name, and are picked deterministically per thread. Timeline notices and tool calls are gray italic system lines, code blocks and the composer are XP fields, and the message is sent from **Send** at the right end of the bottom strip, as in AIM. The only sounds are recorded doors at turn start and end, played for threads with an open IM window: a latch and hinge creak for opening, a single wooden slam for closing. No AOL recording is shipped.

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
- A self-contained app (the games in `games/`) may keep its own palette, but only as scoped tokens declared once at the top of its CSS file (`--bbd-mine-*`, `--bbd-sol-*`). Game logic lives in a pure `*-core.ts` module with tests; the component renders only the window body and its entry in `programs/registry.tsx` wraps it in `WindowFrame`.

## 4. Icons

Icons follow Microsoft's own rules from [Creating Windows XP Icons](https://learn.microsoft.com/previous-versions/ms997636(v=msdn.10)) (MSDN, 2001) and the [Windows XP Visual Guidelines](https://www.retrospace.net/download/WebApplications/WindowsXPDesignGuidelines/icons.htm). The real icons, drawn by The Iconfactory, are the reference; compare against them before drawing ([upscaled set](https://github.com/softwarehistorysociety/XPIcons), [original sizes](https://github.com/ShizukuIchi/winXP/tree/master/src/assets/windowsIcons)).

### The rules (from Microsoft)

- **Style:** "fun, color, and energy". Rich color, soft slightly rounded corners, gradients for depth, and a modern consumer look for everyday objects.
- **Light:** from the upper left, with ambient light.
- **Angle:** 48 and 32 px objects sit at an angle in perspective. At 16 px, documents, symbols (warning, error, info), and single objects face straight on.
- **Outline:** every object has an outline so it reads on any background: a darker shade of the object's own color, never plain black.
- **Drop shadow:** down and to the right (Photoshop angle 135°, distance 2, size 2). Here: the shared `bbd-drop` filter, which `IconSvg` applies to every object icon. Toolbar icons have no shadow.
- **Avoid:** letters, words, hands, and faces (bb Explorer's "bb" is the one exception, standing in for IE's "e"); more than three objects in one icon; the Windows flag outside the Start button.

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
| Pinball | Pinball: a reflective silver ball with a deep blue rim and upper-left highlight | `PinballArt` |
| 3D Maze | A brick corridor in one-point perspective, stucco above and mustard below, with a yellow smiley at the vanishing point | `MazeArt` |
| Browser | bb Explorer: Internet Explorer's design with a blue glossy "bb" in place of the "e", inside the gold orbit | `InternetExplorerArt` |
| Drawing | Paint: a palette of paint blobs with a brush | `PaintArt` |
| Terminal | Command Prompt's icon: black window with a blue title bar and `C:\ _` | `CommandPromptArt` |
| Thread search | Search: straight-on magnifying glass with a gold handle | `SearchArt` |
| Command palette | Run: small window with a text field and speed lines | `RunArt` |
| Thread details | A window with a side pane | `DetailsArt` |
| Buddy List (bb Messenger) | AIM's running figure: yellow, dark outline, mid-stride facing right; no wordmark | `BuddyListArt` |
| Send (Instant Message) | AIM's Send: the running figure carrying an envelope, with speed lines | `SendArt` |
| Stop a running turn | A glossy red stop sign with a white rim and no lettering | `StopArt` |
| Needs input, error, idle | Warning (yellow triangle, black "!"), Critical (glossy red sphere, white X), and a matching green sphere with a white check for idle | `StatusIcon` |

### Line glyphs

Hugeicons line glyphs (`bbGlyph`) are allowed only for small controls inside a window (view toggles, title-bar buttons) and for the bb layer. They never stand in for an app, place, or object.

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
| A thread window | `ThreadWindow`, drawn as a bb Messenger instant message: bb's `ThreadChat` restyled only through the `.bbd-im-chat` rules in app.css's ThreadChat contract section, plus a `.bbd-im-actions` row (**Buddy List**, **Get Info**, **Browser**, **Terminal**) that docks the Buddy List on the left and thread info on the right, and opens `thread-tab` windows: a per-tab native browser view attached to the thread, or a terminal created with the `{ kind: "thread" }` target. `ThreadChat` uses `permissionPolicy="editable"`. The status bar is AIM's typing line: "<agent> is typing..." while working, otherwise waiting, error, signed off, or idle time |
| Threads related to one thread | `BuddyListWindow` ("<project>'s Buddy List"): the thread's project, or its environment when it has one; groups are folders, then unfiled **Buddies**, each counted AIM-style as (not archived/total), then **Offline** (archived, collapsed). Idle threads are dimmed with their idle time, as AIM showed idle buddies; unread and needs-input are bold |
| A right-click menu | `desktop.openMenu(event, entries)` with `MenuEntry` items, headings, and separators |
| A desktop icon | `.bbd-icon` with `.bbd-icon-art` and `.bbd-icon-label` |
| A status | `StatusIcon` plus the `describeStatus` text |
| A notification | The tray balloon (`page/balloon.tsx`), one at a time |
| Another plugin's own UI as a program | The desktop app bridge (`bridge.ts`, `window.bbDesktopApps` version 1): the plugin registers an app and portals its UI into `AppWindow`. Plugin authors follow `skills/desktop-apps` |
| Another plugin's sidebar footer panel | Nothing to build: with the sidebar collapsed, the tray shows any footer disclosure as an XP window (`usePanelWindows`). bb keeps rendering the panel; Desktop only restyles and repositions it |

### Bundled XP programs

Compare against [GUIdebook’s XP application captures](https://guidebookgallery.org/screenshots/winxppro/), [XP Solitaire and its deck picker](https://www.mobygames.com/game/21468/microsoft-windows-xp-included-games/screenshots/), [XP Paint](https://media.criticalhit.net/2017/07/ms-paint-xp.jpg), and [Media Player 9 on XP](https://sdfox7.com/xp/files/wmp9xp.jpg). These references distinguish the document from the program icon and WMP’s silver-blue skin from the ordinary XP control face.

All eight programs use `WindowFrame`/`WindowTitleBar`, `ProgramMenuBar` and `ProgramStatusBar` where the original has those rows. Keep the established split-the-difference treatment: frosted-glass frames, flat faintly blue title bars, and glass menu/status surfaces following bb’s theme and Ambient. Mark bodies `.bbd-program`; use `.bbd-program-note` for the persistent note. Inside that shared chrome, preserve the original program’s board, document, card or skin vocabulary with a modest modern twist. Menus are compact Tahoma with blue selection; status panes are inset, not floating pills. Unsupported commands are visibly disabled. Scope program rules away from IM, Buddy List and the host composer.

| Program | Reference details and implementation boundary |
| --- | --- |
| Minesweeper | Classic gray `#C0C0C0`, three-digit red seven-segment counters, raised yellow face, inset field; numbers blue, green, red, navy, maroon, teal, black, gray. Game contains New/F2 and difficulty checks. Preserve responsive cells and the tested core. |
| Solitaire | Flat `#008000` felt, white 71 × 96 proportioned cards, red/black corner ranks, rank-counted pips and mirrored court illustrations, blue geometric backs. Game/Help menus and bottom moves/time status. Artwork is an original vector adaptation; existing draw rules and move count remain. |
| Pinball | Match the Windows XP pinball table composition closely, titled just **Pinball** in the window, taskbar, and dialogs: a 600 × 416 client field, approximately 360 px perspective table / 202 px inset scoreboard with a black gutter, silver cabinet rails, dark blue printed playfield, asymmetric upper attack bumpers, violet left ramp and return bank, cyan/orange rank circle, low silver/red flippers, and the right launch lane. The panel has an original vector "Pinball" wordmark (one italic baseline, even spacing, hard drop shadow) over astral space art (nebula, ringed planet, moon, spiral galaxy, starfield; no figures), red ball label, lavender dotted digits, and separate player/status and instruction wells. Compare directly with original captures and repeat after corrections. Draw all artwork in source; never distribute original Microsoft/Maxis bitmaps, sounds, or fonts. Game/Options/Help use original labels; F2 starts, F3 pauses/resumes, and F8 opens an editable Player Controls dialog with OK/Cancel/Default. F1 shows the compact controls legend; unsupported original commands stay disabled. Pause and clear held controls on focus loss, hidden pages, or minimize; minimizing preserves the game. Guide rails meet the upper flipper pivots without a resting-ball pocket. Preserve solid black readout backgrounds, ball count, narrow-window controls, and theme-aware shared chrome. Current gameplay is a single-plane approximation with bumpers, targets, and lane bonuses; mission progression, raised ramp transport, multiplayer, and original audio are not implemented. These are remaining fidelity gaps, not permission to relax the visual target. |
| Paint | File/Edit/View/Image/Colors/Help; two columns of eight tools in XP's positions, gray workspace, 28-color box and inset status. All sixteen tools work as XP's did, with XP's options box: line widths, brush/eraser/airbrush sizes, outline / outline-and-fill / fill styles for the closed shapes (the fill is the secondary color), opaque/transparent for the selections and Text, and 1x/2x/6x/8x for the Magnifier. Picker and Magnifier hand back to the previous tool. Do not alter the raster core to make a cosmetic change. |
| 3D Maze | Match the Windows 95/98 OpenGL screen saver: thin wall partitions at eye-centred 90° horizontal perspective, corridors about 4:3 (wider than tall), four courses of mottled crimson brick, each rimmed dark on its lower and right edges, in broad lavender-white mortar; a flat mustard floor with faint flecks; and a white stippled square-tile ceiling. The view renders at about 400 × 300 and is stretched to the window, for the original's soft look. A few wall faces carry the original's one picture, redrawn in source rather than copied: a pale room with a ceiling light, a window onto a flowering garden, a big globe built of Lego studs, and Lego bricks on a round wooden table, with the original's chunky dithered finish. Keep the bright unlit textures; do not add distance fog or directional wall shading. Compare directly with [original footage](https://archive.org/details/3d-maze), the [screen-saver gallery](https://www.screensaversplanet.com/screensavers/3d-maze-461/), and [original rat footage](https://archive.org/details/twitter-1018649977608798208). The start sign is the original's turning Start button slab (khaki face, dark outline, bevel and underside, a little see-through) with bb's taskbar flag and bb's wordmark (`BB_MARK`) in place of the Windows flag and "Start". Stippled gray polyhedra (dodecahedron, cube, tetrahedron or octahedron, one per rock) float low over the floor and remain visible during the quick 180° roll, which fills the whole viewport, then disappear as walking resumes. The exit is a translucent yellow oval face with blue eyes and smile. One brown fur sprite walks independently along passages. The optional map uses unfilled white walls, a fixed blue viewer arrow and rotating explored layout, with red start, green exit, white rock and orange rat markers. All textures and sprites are original source drawings; never distribute or trace Microsoft bitmaps. Maze has New Maze/F2 and Pause/F3; Options retains persisted Overhead Map and Turbo Mode. Pausing, hiding or minimizing freezes movement and sprite animation, and with Reduce Motion on the maze holds a still frame. F2 and F3 act once per press; held keys do not repeat them. Remaining fidelity gaps: procedural textures and fur instead of the original bitmap patterns; a source-drawn redrawing of its photograph; no floating 3D text or torus objects; instant maze replacement instead of walls sinking/rising; no custom textures, image-quality, small-image or maze-size settings. Map style follows documented behaviour; original map screenshot comparison is still unverified. These gaps do not relax the visual target. |
| Media Player | WMP 9 silver-blue skin, Now Playing band, black visualization screen and circular blue playback control. Keep the real microphone input and three existing visualization presets; this is not a media-library or CD player. |
| Note pad | Plain white document, Lucida Console, File/Edit/Format/View/Help, shared glass title. Keep autosave, multiple notes, edge anchoring and deletion undo. Tone is a small frame accent selected from View; do not return ruled paper or a spiral to the document. |
| Terminal | Command Prompt reference. Shared glass frame, no program menu bar. [XP consoles originally kept Classic chrome under Luna](https://devblogs.microsoft.com/oldnewthing/20071231-00/?p=23983), but this plugin deliberately shares its modern glass frame across programs. Leave the embedded bb terminal’s rendering, theme, keyboard and session behavior untouched. |
| bb Explorer | Internet Explorer 6 reference. IE6 File/Edit/View/Favorites/Tools/Help, compact navigation toolbar, square address field and green-arrow Go button, inset status panes. Change only chrome; the native browser view and web-only placeholder remain untouched. |

Program kinds and Start/Quick Launch identifiers are stable even when a program's label changes: Terminal and bb Explorer keep the `command-prompt` and `internet-explorer` ids. Do not fold a rename into visual fidelity work. References are research evidence, not distributable assets; game and program drawings remain original source artwork.

### bb Messenger: AIM 4.x–5.x reference

The reference is Windows AIM around 2000–2004, rather than later AIM 6 or MSN. Compare the [AIM 4.7 Buddy List](https://en.wikipedia.org/wiki/AIM_(software)), the [contemporary AIM 4.8 release screenshot](https://internet.watch.impress.co.jp/www/article/2002/0617/aim.htm), and [AIM 5.1 running in an XP VM](https://notes.jordanscales.com/away-messages). The [AIM 4.8 away-message tutorial](https://www.awaymessages.com/guide/aim1.htm) shows its menu and editor. The [historical XP IM capture](https://s3.amazonaws.com/arena-attachments/796671/ccb89081566bc1468e50478ab407c6b4.pdf) shows red/blue serif dialogue and the grouped action strip. The [Buddy Info capture published in March 2006](https://repository.gatech.edu/bitstreams/607aabe2-7ef7-4d6b-a77f-86bf221308f5/download) corroborates the classic profile layout, but its exact client version is unverified. The [5.9 IM screenshot](https://www.kirsle.net/smarterchild-and-other-aim-bots) is a later corroborating reference, not an exact 2002 specimen.

- **Chrome and proportions:** use the same `WindowFrame` and Luna colors as every desktop program. Inside it, use compact Tahoma controls, square inset transcript/list fields, and a flat icon-and-caption action strip with relief on hover and press. Start IMs at 620 × 640 and Buddy Lists at 280 px wide; the larger IM size accommodates technical conversations. Controls wrap at narrow widths.
- **IM hierarchy:** thread title in the title bar, a compact **Thread** menu and **To:** screen name, transcript, existing composer, bottom actions, then the shared typing/status bar. Thread and the title-bar **…** open the same real thread actions. Historical File/Edit/Insert/People menus, formatting strips, and Warn/Block/Expressions/Games/Talk buttons are reference anatomy, not permission to add nonfunctional buttons. Keep the real **Buddy List**, **Get Info**, **Browser**, and **Terminal** actions, then AIM's **Send** at the far right behind a groove: a larger icon over a bold label, with AIM's red bar under it while the agent works. It reads **Stop** with a stop sign while bb offers Stop run (a turn is running and the draft is empty), and is disabled when bb's Send is (an empty draft), when the thread is archived, and when bb's chat markup no longer fits the restyle.
- **Transcript:** Times New Roman at 15 px, with 13 px system lines (`--bbd-im-text`, `--bbd-im-system-text`), with matching bold screen names, red `Me:` and blue agent labels, as AIM colored your own name and your buddy's, no truncated names. Code keeps bb's monospace and chips, with inline code one step smaller so it stays with the serif words around it. Messages sit 6 px apart. bb's hover actions (Copy, Add to chat and any plugin actions) take no room of their own: on hover, keyboard focus or an open actions menu they appear at bb's 20 px size over the bottom-left of the message's last line, on a solid paper fill that hugs just the buttons, fades out over 6 px above them, and fades in and out with them, so no text shows behind the icons, so the icons stay readable and never touch the next message. On a one-line message they start after the speaker label, as the text does. Hidden rows keep a 1 px sliver, since bb's windowed timeline (long threads) holds a 0 px row open at its 20 px guess. A windowed thread spaces its rows with bb's own 8 px gap, so there messages sit 8 px apart, and a hidden row between them still costs its 1 px plus another 8 px gap: a reply sits 17 px under your message. Wrapped text starts at the left edge. Code blocks keep the square XP field and wrap long lines. The composer area is opaque so the transcript never shows through it. Only what was said is shown: user and agent messages, user rows (including prompts sent by another agent or bb), and warnings and errors. Tool calls, thoughts, "Worked for" folds and the live Thinking/Working line are hidden, since the status bar already says the buddy is typing and **Open in bb** shows the full thread. Warning and error rows use the gray italic Tahoma system-line style. A message another agent or bb sent keeps bb's own layout (the "Message from <thread>" header as a system line, the message indented under bb's thread line, expand and collapse), with the message set in the transcript's Times instead of system-line type. A steer's label sits on its own system line above **Me:**.
- **Buddy List:** our own 48 px figure and **bb Messenger** name occupy the blue branding area. Put the project/environment identity beneath the name, online count below the banner, and scope tabs immediately above the inset tree. Groups retain disclosure triangles and `(available/total)` counts. Idle/offline names are muted and italic, unread/needs-input names bold, selection Luna blue. Offline starts collapsed. Keep real thread titles and status icons instead of inventing network presence or away messages. The bottom **IM** and **Info** controls open the selected thread or its details.
- **Buddy Info:** Get Info opens an adjacent window titled **<thread> - Buddy Info**, with screen name, current status, and inset thread details. Show real project, branch, PR, and folder data. AIM's away text and profile provide the layout reference; do not fabricate an away message or warning percentage.
- **Theme and art:** Messenger's paper, bevel, and system-text tokens are scoped to `.bbd-im`, `.bbd-buddies`, and `.bbd-im-info` and derive from the shared palette. Light mode has pale paper; dark mode uses lighter blue/red screen names so both labels exceed 4.5:1 contrast on dark paper. This is an explicit messenger type exception: Tahoma for controls and system lines, Times New Roman for conversation, Trebuchet MS for the brand, bb's monospace for code. An earlier transcript with Lucida Console code and a see-through composer was harder to read than bb's own threads. Keep our name and original art; no AOL logo, mascot asset, advertising, or ticker.
- **Composer boundary:** the prompt box and its formatting, reply, send and stop controls are host-owned. Desktop restyles only the field (square XP edge) and hides bb's own Send and Stop run button, because AIM had one Send, in the strip. The strip's **Send** clicks that hidden button in this window's message box and mirrors its state, so bb keeps steer and queue, attachments, permissions and Enter to send; it never sends through the SDK. bb's send-options chevron (Queue, Save draft, Send later) stays in the box once there is a draft, and voice input keeps bb's button. When the button is missing the window falls back to bb's own chat (see bb's markup below), so bb's Send is back in the box and the strip's is disabled. Do not apply the transcript typography rules to the composer. As in bb's own thread view, an archived thread hides the composer and shows **Thread is archived** with **Unarchive** in its place.
- **bb's markup:** the transcript and composer restyle keys on bb's private ThreadChat markup, so every rule that does lives in app.css's fenced **bb ThreadChat contract** section. `ThreadWindow` checks that markup with `programs/threads/chat-contract.ts` as bb renders, including the message box's submit button the strip's Send drives; when the markers the rules depend on are missing it warns once, drops `.bbd-im-chat`, and the window shows bb's own chat inside the AIM frame rather than half-styled lines. An archived thread then uses bb's composer-less timeline, so it never offers a message box. `chat-contract.test.ts` checks the guard and the key selectors against `programs/threads/__fixtures__/thread-chat.html`, real ThreadChat markup captured from bb; refresh that capture whenever bb's chat markup changes.
- **Sound provenance:** `door-sounds.ts` inlines two short mono MP3s trimmed from Gravity Sound's "Open squeaky door 2" and "Slam closet door" (https://www.gravitysound.studio/, CC BY 4.0, via Wikimedia Commons); keep that credit with the clips. They decode once and are cached. AIM used these cues for buddy sign-on/off; bb retains its existing open-IM turn-start/end mapping.

## 6. Layout and type

- Windows open with `defaultRect` sizes and stay inside the viewport (`clampRect`). List windows start at least 460 px wide so titles fit.
- The taskbar is a pill sized to its contents: Start, Quick Launch, window buttons, tray.
- Window buttons never shrink below a readable label (96 px). Buttons that don't fit move behind a » count button that lists them in a menu, and the focused window's button always stays visible.
- bb-facing text uses bb's sans font and typography tokens. Bundled XP programs use compact 11 px Tahoma menus and Lucida Console for Note pad; window titles keep the shared bb typography. Terminal retains the embedded terminal’s own type settings. The balloon also uses Tahoma; Messenger’s exceptions are specified above.

## 7. Motion

- Short and ease-out: 120 to 340 ms. Motion explains a change (a window sliding clear, a balloon rising); it never decorates.
- Only `transform` and `opacity` animate.
- Every animation has a `prefers-reduced-motion: reduce` fallback with no movement.

## 8. Behavior

- **XP metaphors must do real bb work.** The Recycle Bin is the archive and the balloon is needs-input. Do not add a metaphor that is only a costume.
- **Never lose work silently.** Destructive actions confirm (delete folders) or are recoverable (archive, from the Recycle Bin).
- **Move and resize:** primary mouse, touch and pen share pointer capture. Movement starts at 4 CSS px; clicks and title-bar double-click maximize/restore survive smaller motion. Dragging a maximized title bar restores the previous size under the pointer. Frames and note pads stay inside the work area below bb’s chrome and 6 px above the taskbar; a viewport shrink refits them. All eight frame edges respect the minimum size and hold the opposite edge fixed. Notes retain left/right anchoring.
- **Drag lifecycle:** follows bb's own split resizers: the pressed element captures the pointer and listens for move, up, cancel and lost capture. Release commits; a cancelled or lost pointer, or unmount, cancels the preview. Focus changes, viewport resizes and keys don't end a drag. Capture, text selection and the iframe shield are always released. Native browser views hide for the gesture and return afterward. Paint keeps already drawn freehand ink (Undo removes the stroke); cancelled shape previews and canvas resizes are discarded.
- **Desktop selection and drops:** modifier-click toggles selection; rubber-band selection previews without rebuilding the icon tree. Multi-icon drags retain spacing at boundaries. Recycle Bin accepts deletable folders, sections and saved notes; folders accept threads, not nested folders or notes. Thread rows use the same pointer lifecycle, including touch/pen. Taskbar and Quick Launch are launch controls, not draggable toolbars.
- **Drag performance and persistence:** visual updates run at most once per animation frame using transforms or direct dimensions. Read bounds before moving; commit React state and save positions once on a completed drag, never on each move or cancellation. Saved-note icon positions keep their `note:<id>` keys. Paint batches pointer samples without discarding stroke points; Alt + primary pointer uses the secondary color.
- **Hidden on phones.** The desktop, taskbar, and notes never render at 767 px and below. The plugin settings page holds only on/off and Quick Launch, in native bb controls; organize and sort stay on the desktop. On phones the sidebar button opens that page, which says the desktop isn't available there.
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
