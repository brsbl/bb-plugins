---
name: bb-theme-authoring
description: Create or edit a bb theme (the app's colour palette) as a custom CSS theme and verify it live in the Theme Preview panel. Use whenever the user asks for a new bb theme, a palette change, a light/dark variant, or wants to iterate on how bb looks.
---

# Authoring a bb theme

A bb theme is one CSS file that overrides the app's CSS custom properties. bb
discovers custom themes on disk and the **Theme Preview** panel shows every
token, its contrast, and an app mock that repaints as you edit. Work in a
split: your thread on one side, Theme Preview on the other. Nothing needs a
restart.

## Where themes live

```sh
bb theme dir          # the custom-theme directory, e.g. ~/.bb/theme
```

One directory per theme, one file inside it:

```
<theme dir>/<name>/theme.css
```

`<name>` is the theme id: lowercase, letters, digits and dashes, a single path
segment. Create the directory and the file and it is listed immediately — the
Theme Preview dropdown picks it up within a couple of seconds while the panel
is open, and `bb theme list` shows it at once.

## File shape

Two top-level blocks. Light values in `:root, .light`, dark values in `.dark`.
Every declaration is a `--token: value;` custom property.

```css
:root, .light {
  --canvas: #f4f4f4;          /* the app background */
  --ink: #0a0a0a;             /* body text */
  --primary: #2e6f95;         /* links, focus ring, accents */
  --primary-foreground: #ffffff;
  /* …more tokens… */
}

.dark {
  --canvas: #1a1a1a;
  --ink: #dbd8d1;
  --primary: #9db6c6;
  --primary-foreground: #0a0a0a;
}
```

You only need to declare what you change; everything else derives from bb's
base theme. The anchors that drive the most are `--canvas`, `--ink`,
`--primary` and `--sidebar`.

### Tokens worth knowing

| group | tokens |
| --- | --- |
| Surfaces | `--canvas` `--sidebar` `--card` `--popover` `--secondary` `--muted` `--surface-recessed-solid` `--surface-scrim` |
| Ink | `--ink` (body) `--foreground` `--muted-foreground` `--subtle-foreground` `--readback-foreground` `--sidebar-foreground` |
| Accent and state | `--primary` `--primary-foreground` `--file-accent` `--timeline-accent` `--surface-selected` `--state-hover` `--state-active` `--sidebar-accent` |
| Status | `--success` `--warning` `--warning-text` `--destructive` `--destructive-text` `--pr-merged` `--diff-added` `--diff-removed` |
| Lines | `--border` `--border-hairline` `--border-seam` `--sidebar-border` `--input` `--ring` |
| Type | `--font-sans` `--font-mono` (declare once in `:root`) |

How bb uses them (from bb's own components, so you can predict the result):
sidebar rows hover with `--sidebar-accent`, the open thread's row is
`--state-active`, the default button is `--foreground` on `--background`
(bb has no primary-filled button; `--primary` is links, focus and accents),
the composer sits on the canvas with a 1px `--border`, code blocks and message
bubbles are a faint recessed wash with `--border-seam`.

Element-scoped blocks are allowed — for example `.dark .fixed.bg-sidebar { … }`
to give only the sidebar a different value — but keep palette values in the
two top-level blocks so tooling can read them.

## Apply and iterate

```sh
bb theme set <name>   # activate it app-wide
bb theme show         # what is active now
```

Or pick it from the Theme Preview dropdown, which switches palette and
light/dark mode together. Once active, **every save of `theme.css` repaints
the app and the preview automatically** while the panel is open (the plugin
watches the active theme's file and re-applies it). Edit, glance at the split,
edit again.

## Verify before you call it done

In Theme Preview, read the right-hand rail:

- **Ink rows show a WCAG ratio** against the surface they sit on; the floor is
  4.5:1 for body text. Red numbers are failures — fix them.
- **Status rows** show their ratio against the canvas.
- **Surfaces** with an amber outline are overridden inside the sidebar scope —
  make sure that is intentional.
- Check both modes with the dropdown, and the Split and Settings views, not
  just Thread.

Keep dark-mode text below ~12:1 on near-black surfaces; higher blooms on OLED.

## Shipping a theme in a plugin

A plugin can contribute themes via its manifest instead of the theme dir:

```json
"bb": { "themes": [{ "id": "mine", "name": "Mine", "css": "./themes/mine.css" }] }
```

bb lists it as `plugin:<pluginId>:mine`. Theme Preview resolves the CSS through
the manifest, so chips and live reload work the same way. Install with
`bb plugin install path:<dir> --yes`, reload with `bb plugin reload <pluginId>`
after CSS edits.
