# Desktop design system

Desktop recreates Windows XP (Luna) on top of bb. Every new surface follows the rules below so the plugin reads as one product, not a pile of features.

## 1. Pick the layer first

Every surface belongs to exactly one layer. Decide which before designing anything.

| Layer | Surfaces | Looks like | Why |
| --- | --- | --- | --- |
| **XP layer** | The desktop, icons, windows, taskbar, Start menu, tray, balloons, context menus opened on the desktop | Windows XP Luna: blue title bars, green Start, bevelled buttons, yellow balloons, drawn icons | This is the plugin's whole point |
| **bb layer** | Anything the plugin renders inside bb's own chrome: the thread-header folder label, the sticky-note header button, settings | Native bb: bb tokens, bb typography, line glyphs, no XP chrome | XP chrome inside bb's header would look broken, not nostalgic |

Sticky notes are the one floating exception: they live on every page, so they use their own paper style rather than XP window chrome.

## 2. Names

- Use the XP name when a feature maps to an XP thing: **Start**, **Recycle Bin**, **Quick Launch**, **Show desktop**, **Windows Media Player**, **Turn Off Desktop**, **balloon**.
- Use bb's words for bb concepts: **thread**, **section**, **project**, **archive**, **needs input**. Never rename a bb concept to an XP one (a thread is never a "document").
- Sentence case everywhere except XP proper names.

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

## 4. Icons

There are two icon families. Never mix them in one place.

### Object icons (drawn, XP style)

For things a user can open or hold: folders, threads, the Recycle Bin, apps, status. They live in `art.tsx` as `<Name>Art` components.

- **Grid:** a `48 × 48` viewBox for new object icons, rendered at 48, 40, 32, 18, or 16 px through a `size` prop. Status icons use a `16 × 16` viewBox.
- **View:** three-quarter view from slightly above, as XP drew them. Flat front views only for flat objects (a page, a note).
- **Light:** from the top left. Gradient body that is lighter at top left, darker at bottom right, plus a thin light rim highlight.
- **Outline:** a darker shade of the object's own hue (`ICON.outline` for neutral objects), never black.
- **Shadow:** a soft ellipse under freestanding objects (`ICON.shadow`).
- **State by drawing, not by badge:** an empty folder has no papers, a full bin has crumpled papers. Use the `.bbd-dot` badge only for thread status that rolls up.
- **Legibility:** check every icon at 16 px. Drop detail that turns to mush; keep the silhouette.
- **Palette:** colors come from `ICON`, `FOLDER_*`, or `PAPER` at the top of `art.tsx`.

### Action glyphs (line icons in a tile)

For actions with no XP object: New thread, Threads, Plugins, Skills, Show desktop. Use `bbGlyph(...)` with a Hugeicons icon inside `GlyphTile` (blue, or green for create). Mirrored tray icons keep the plugin's own icon from bb's sidebar footer.

## 5. Components

Reuse these before building anything new.

| Need | Use |
| --- | --- |
| A window | `WindowFrame` (title bar, minimize, maximize, close, status bar, resize) |
| A toolbar row in a window | `.bbd-menubar` |
| A button in a window | `.bbd-button .bbd-bevel` |
| A text field or select | `.bbd-field .bbd-sunken` |
| A grouped form section | `.bbd-fieldset` with a `<legend>` |
| A list of threads | `ThreadCollection` (icon or list view, status icons, folders line) |
| A right-click menu | `desktop.openMenu(event, entries)` with `MenuEntry` items, headings, and separators |
| A desktop icon | `.bbd-icon` with `.bbd-icon-art` and `.bbd-icon-label` |
| A status | `StatusIcon` plus the `describeStatus` text |
| A notification | The tray balloon (`balloon.tsx`), one at a time |

## 6. Layout and type

- Windows open with `defaultRect` sizes and stay inside the viewport (`clampRect`). List windows start at least 460 px wide so titles fit.
- The taskbar is a pill sized to its contents: Start, Quick Launch, window buttons, tray.
- Text uses bb's sans font and typography tokens (`--text-xs`, and so on). The only XP typeface exception is the balloon (Tahoma first), which is a quoted XP artifact.

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

## Known gaps

These predate this document and should be brought in line when touched:

- `StickyNoteArt` and `MediaPlayerArt` are flat with no gradient, light, or outline shade. Redraw them to section 4.
- `FolderArt` and `ThreadArt` use older `40 × 34` and `36 × 32` viewBoxes. Move them to the 48 grid when they are next changed.
