# Endless

Frank Ocean's *Endless* as a bb theme family: `endless`, the achromatic
silver print, and `endless-color`, the same structure with rare pops sampled
from the film's painted stair.

Released August 19, 2016. This is the ten-year mark.

![The Endless palette, dark and light](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/endless --yes
```

## Use

Activate either palette:

```bash
bb theme set plugin:endless:endless          # the silver print
bb theme set plugin:endless:endless-color    # silver + the stair accents
```

The palette is app-wide and stored server-side; light/dark mode stays a separate
per-client setting that each stylesheet layers on top of, so one theme covers
both. `bb theme reset` returns to the default without touching your favicon
color.

## The family

`endless-color` is generated from the `endless` stylesheet plus one appended
light-only block (`src` in the authoring workspace), and a test asserts that
derivation byte-for-byte. Radius, type, dark mode, the sidebar noise and every
structural rule are therefore shared by construction — the variant can only
differ where it deliberately overrides: the silver field, the stair accents
(light blue, mustard, orange, red, olive), the foil violet, and the plywood
trim.

Type across the family follows the album's liner notes: Helvetica for the UI,
Courier for code, paths and terminals. Both are system faces — nothing is
embedded.

## The design

The album is a black-and-white visual record: a grainy near-black field, two
silver-gelatin photographs, printers' registration marks in the corners, a
greyscale step wedge down each edge, and a warehouse ceiling of fluorescent
tubes. Five moves carry that into a UI palette.

**Achromatic.** There is no accent hue. The neutral ramp is a warm-toned silver
print — the step wedge from the cover's edge strips — and every surface, border
and text tier is drawn from it.

**Light is the accent.** In dark mode `--primary` is pure `#ffffff`, the
fluorescent tube. Body text sits a step below at `#f4f1ec`, so a primary button
or a link reads as literally *lit* rather than merely tinted. Light mode inverts
the idea: `--primary` becomes `#0d0d10`, a slab of ink on paper.

**Squared.** `--radius` drops to `0`. Photographic prints, crop marks and
registration targets have no rounded corners.

**Two tones, not one.** Body text is warm-toned; file paths and the timeline are
cold (`#9fb8c4`). Two prints from the same negative, developed in different
chemistry. It is the only temperature shift in the theme, so it does an accent
color's job without adding one.

Semantics keep their hue but are toned rather than saturated, like a hand-tinted
print: destructive is the darkroom safelight, warning is sepia, success is
selenium, merged is a dusty violet. The ANSI terminal palette is deliberately
left at bb's defaults — a greyscale remap would erase the one place in the app
where color is load-bearing rather than decorative.

## Notes for anyone editing the stylesheet

**No grain.** Earlier builds carried a fractal-noise film grain, and both
`--canvas` anchors were set past their targets to compensate for the lift it
added. The grain is gone by request, so the anchors are now the field values
directly — `#161619` dark and `#f0efeb` light. Every contrast ratio in the
stylesheet is unchanged and still measured against the colour you actually see.

**Panels sit above the field.** In dark mode cards, popovers and code wells sit
a step above the canvas rather than below it — the cover's own logic, where the
photographs are the lit planes and the black is the surround.

**`:root` beats bb's `.dark`.** They have equal specificity and this sheet loads
last, so every token pinned in the light block is pinned again in the dark block.
Dropping one leaks its light value into dark mode.

Contrast floors held throughout: text ≥ 4.5:1, non-text UI ≥ 3:1, including the
tight cases (the secondary text tiers over the hover fill).

**Code colors are not part of this plugin.** bb's plugin manifest accepts only
`{ id, name, description, css }` per theme — there is no field for a Pierre /
VS Code code theme, and the plugin SDK's `ThemeArea` is read-and-activate only.
So `bb theme show` reports `pierre-dark / pierre-light` for this palette: diff
*line* colors still follow `--diff-added` / `--diff-removed` from the stylesheet,
but syntax highlighting inside code blocks uses bb's default hues rather than
this theme's toned monochrome. A matching pair exists and works when the palette
is installed the other way, as a custom theme folder under
`<bb-data-dir>/theme/endless/` alongside `pierre-dark.json` / `pierre-light.json`.

**Fonts are base64.** bb hands a theme's CSS to the client as an inline string,
so a relative `url()` resolves against the app document rather than this
directory, and an absolute path only exists on the machine that authored it.
Inlining is the only form that survives installation. `theme.test.ts` fails the
build if a machine-specific path reappears.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-endless
bb plugin install "path:$PWD/plugins/endless" --yes
```
