---
name: playground-design
description: Make playgrounds look and teach like finished products. Use for any HTML playground (card structure, type, space, illustration, motion, and the pre-publish check) and for crafted explainers that teach through a working object with Anatomy by Ryan (@wheresryan22), such as an isometric instrument or an interactive product-design lesson.
---

# Playground design

One authoring system for playgrounds: the card design rules every HTML
playground follows, and Anatomy for lessons that teach through a working
object. Read the `playgrounds` skill and `bb playgrounds guide` first for what
the frame allows; this skill covers how the result should look and teach.

## Card design

The target look is a finished product card, not a web page: quiet, compact,
black-on-white type, one accent, a large illustration or photo set, and calm
motion. Most failures are small: gray headings, washed-out body text, bold
weights, thick borders, icon-sized illustrations, or nothing moving. Follow the
numbers below; they are measured from cards that read as high fidelity.

### Card structure

1. **Header**: `.pg-title` (one short line, sentence case, no emoji), then
   `.pg-subtitle` saying what to do ("Tap a swatch to repaint the room.").
   A segmented control may sit top-right of the header.
2. **Hero**: the main visual inside `.pg-stage` (or a photo row / map),
   200–320px tall, full width. It is the largest thing in the card.
3. **Controls** directly under the hero: `.pg-seg`, swatches, chips, tiles.
4. **Detail**: `.pg-item-title`, a `.pg-meta` line, `.pg-h` headings with
   `.pg-body` paragraphs, an optional tip in `.pg-stage` with `.pg-meta` text.
5. **Footer**: progress (`.pg-dots` or a dashed bar) on the left, actions on
   the right (`.pg-btn` Back, `.pg-btn-primary` Next →), or `.pg-link` text
   buttons ("← Previous step", "Next step →").

Put grouped detail in one `.pg-panel`. Never nest panels more than once.
Publish a single column with `width` 440–540; go wider only for maps or
side-by-side comparisons that need it.

### Type and ink

Use only these steps (Inter is bb's font; keep `var(--font)`):

| Role                     | Size / line height           | Weight | Ink                       |
| ------------------------ | ---------------------------- | ------ | ------------------------- |
| Card title               | 20px / 1.2, tracking −0.02em | 500    | `--pg-ink`                |
| Item title (step, place) | 15px / 1.3, tracking −0.01em | 500    | `--pg-ink`                |
| Section heading          | 13px / 1.3                   | 500    | `--pg-ink`                |
| Body                     | 12px / 1.45                  | 400    | `--pg-body`               |
| Subtitle, meta, caption  | 11–12px / 1.4                | 400    | `--pg-meta`               |
| Eyebrow, step counter    | 10.5px caps, tracking 0.04em | 500    | `--pg-meta` or the accent |
| Buttons, pills, labels   | 11.5–12px                    | 500    | `--pg-ink`                |

- Headings, labels and selected values are always `--pg-ink`, never gray.
  Paragraphs are always `--pg-body`; only subtitles, captions, durations,
  hex values and hints use `--pg-meta`. Do not invent other grays.
- Never use weights above 600, all-caps headings, or text below 10.5px.
- On a tinted surface, tint the text toward that hue instead of gray (dark
  green text on a pale green tile).

### Space, shape, color

- Body padding stays 20–22px. Title→subtitle 3px; header→hero 16px; between
  sections 16–20px; inside panels 14–16px; grid gaps 8–10px.
- Radii: panels 16px, stage and photos 12px, tiles 10–12px, pills fully
  round. Borders are 1px `--pg-hairline` or none; no drop shadows on content.
- Surfaces: `--card` for the card, `--pg-stage` behind illustrations and tips.
- One accent per card, used for the step counter, progress, and the active
  element. Selected controls are solid `--pg-ink` with `--card` text.
- Use fixed colors only for depicted things (paint, map water, plants).
- Visual choices (colors, materials, photos, products) are large tiles: the
  swatch or image fills the tile (~4:3, 10–12px radius) with the name in ink
  and the code or price in meta underneath. Show selection with a 1.5px ink
  ring and a small ✓, never an inverted fill. Solid ink fill is only for
  text controls (`.pg-seg`, chips, primary buttons).

### Illustrations, photos, maps

- Draw the subject itself as a detailed inline SVG, not an icon: realistic
  proportions, secondary parts present (spokes, tread, cables, knobs,
  baseboards, folds), centered in the stage with ~10% margin.
- Draw only what the playground is about. Keep scenes sparse (an empty room for
  paint, the bike alone for assembly) so the part that changes dominates.
- Flat vector style: no outlines except hairlines, no gradients except soft
  lighting on large planes, 2–3 tones per material (base, shade, highlight).
- Show state on the drawing: inactive parts light gray (#c9c9c9), the active
  part near-black or the accent; numbered callouts as 18px circles (white with
  hairline, filled `--pg-ink` when active). Caption simplifications under the
  stage in `.pg-meta` ("Illustrative schematic, not to scale.").
- Use real photos for real places and things: `.pg-photos` (three square
  tiles) or a bento of one tall plus two stacked, 6–8px gaps, 12px radius.
  Photos must come from `https://upload.wikimedia.org`; bb blocks other hosts.
- Draw places as an inline SVG schematic map (pale land, sky-blue water, green
  parks, white roads), with your own labels, white circular markers, and a
  dashed ink route. Live map tiles are blocked.
- For space or material under light (a room to repaint, a product to turn),
  draw it in inline SVG or a `<canvas>` with your own code. Remote libraries
  such as Three.js cannot load.

### Motion

- Stream the card in on load: title, then each section top to bottom,
  opacity 0→1 and translateY 6px→0 over ~380ms with `--pg-ease`, staggered
  40–60ms (`.pg-reveal` with `--i`). Grids and swatches pop in one by one.
  The whole entrance finishes within about 1 s, and the hero is readable by
  0.5 s. Never wait on photos, fonts or downloads before starting it; let late
  images fade in where they land.
- Every interaction visibly changes the hero: crossfade or slide content
  (250–350ms), transition colors (500–600ms), morph or move drawn parts
  (600–800ms), draw lines with `stroke-dashoffset`.
- Respect `prefers-reduced-motion` (the kit shortens animations) and never use
  motion as the only signal.

### Check before you publish

If you can, write the HTML to a file, render it at 2× (Browser Automation)
inside a 500px-wide white card, and check: headings black, body one gray,
nothing below 10.5px, hero is the largest element, no overflow or clipped
text, entrance plays, and one interaction changes the hero. Fix, then publish.

## Teach with a working object

Create a playground the reader can learn by changing. **[Ryan (@wheresryan22)](https://github.com/wheresryan22)**
created [Anatomy](https://skills.wheresryan.sh/anatomy), its drawing kit, and the
original examples. The teaching approach also draws inspiration from
[The Bugged Dev's interactive lever demo](https://x.com/thebuggeddev/status/2108720133422395590).
This bb integration and its product-design instruments are independently authored.

### Choose the explanation

Read the `playgrounds` skill and current `bb playgrounds guide`, then
[ANATOMY.md](ANATOMY.md) for Ryan's craft guidance and the closest example.
All kit and example source lives beside this skill. [upstream.json](upstream.json)
pins the original commit and file hashes; [LICENSE](LICENSE) preserves Ryan's
MIT notice. Treat the installed skill as read-only.

Use native playground controls and charts when they explain the concept well.
Use Anatomy when the reader needs to see what the parts physically do. Tell
the user which object you will use and what changing it demonstrates. Keep the
first version to one mechanism. Add WebGL or free 3D movement only when needed
and requested. Do not promise unsubstantiated build times.

For a learning playground, compose:

1. A large, legible working object, built from purposeful parts.
2. A short explanation and the governing equation, including units and assumptions.
3. A few meaningful controls, a reset, and live measurements.
4. Two or three guided experiments: predict a result, change a variable,
   observe it, and explain why it happened. Presets must operate the same model
   as manual input. Keep an open exploration path.
5. A chart only when change over time or a relationship helps understanding.
   Label axes and distinguish measured simulation state from schematic motion.

One pure model owns the calculations, motion, readouts, and chart. Distinguish
idealized behavior, numerical simulation, and decorative easing. Cite reliable
sources for the concept. Do not present animation as a physically accurate
simulation unless its assumptions and equations support that claim.

### Start with a design instrument

Two bb-specific examples turn product-design decisions into working instruments:

- **Typography printing press** (`typography-press/`): adjust type size, line
  length, leading, and margins, then print a real text layout. Compare hierarchy
  and wrapping without inventing a readability score.
- **Interface motion rig** (`motion-rig/`): drag and release a spring-mounted
  carriage, tune spring and damping, and interrupt an interface drawer in flight.
  The rig and the interface share one motion model.

From this skill directory, generate either HTML playground payload into a new
file in the user's workspace (the path must not already exist):

```sh
node typography-press/build.mjs --out /absolute/workspace/typography.json
node motion-rig/build.mjs --out /absolute/workspace/motion.json
```

Publish its JSON through the `playground` tool's `html`, `title`, and `width`
fields, or `bb playgrounds publish --playground <JSON>`. The CLI stdin cap is
16 KiB: do not pipe a larger payload into `--playground-stdin`. Pass arguments
without shell interpolation, for example with Node's `execFileSync` argument
array. Keep generated HTML below the current guide/schema limit (400,000
characters when this integration was written); read the live contract rather
than changing it to fit an example. Emit the returned directive exactly once.

For a new figure, copy the kit, required inline helpers, and chosen example
source into a collision-safe directory in the current workspace, preserving
relative imports. Work on the copy. Standalone upstream examples generate full
HTML documents; convert them to body markup with inline styles and scripts for
Playgrounds. Do not wrap another full page/card around bb's existing card.

### Connect to Playgrounds

- Inline all required code, styles, SVG, and shaders. No CDN imports, fetch,
  remote fonts, workers, or new sandbox permissions. The kit is an authoring
  dependency; only the resulting figure belongs in each published playground.
- Use `window.playground.save` for small, validated input state after meaningful
  changes. Restore `state` and apply `onState` updates without saving again.
  Do not save frames or unbounded chart history.
- Expose a few useful actions, such as `set`, `reset`, and `experiment`, through
  `window.playground.expose`. Route those actions through the same input logic
  as the UI. Return small measurements and state, not SVG or source.
- Follow `window.playground.theme` and `onTheme`; use Playgrounds tokens for
  surrounding controls and copy. Keep Anatomy shading on the illustrated object.
- Use labeled keyboard-operable controls. Stop animation offscreen or when
  hidden; honor reduced motion. Never communicate a result only through motion
  or color. Avoid viewport-based body height in the auto-sizing iframe.
- Let Playgrounds own the viewer, saving, and library. Publish each revised
  explanation as a new playground; do not add another gallery or storage layer.

### Verify and credit

The bb integration rules here replace upstream installation, browser-driver,
output-location, and delivery assumptions. Use **bb Browser Automation** for
browser work, following its skill. Do not run upstream standalone browser
drivers (`capture.mjs`, `drive.mjs`, `lines.mjs`, `turn-check.mjs`, or
`turn-fidelity.mjs`). They are preserved reference sources. Report a missing
driver or failed audit honestly; never relax the sandbox to make a figure work.

Verify inside the actual Playgrounds frame: initial rendering, control bounds,
keyboard input, reset and presets, a full motion cycle, saved input restoration,
agent actions, narrow layouts, themes, and reduced motion. Inspect 2× captures
and close-ups of the mechanism. Run model tests and geometry checks in the
project's authorized test environment, honoring remote-only CI policies.

Keep Ryan's MIT notice with copied kit code, including inline distributions.
Add a small visible footer linking “Drawing kit: Anatomy by Ryan” and
“Learning-demo inspiration: The Bugged Dev” to the sources above. Credit them
in the handoff too. Do not imply either creator authored or endorsed the new
lesson, and do not copy media or code from the X demo without a reuse license.

When inlining kit source into a script tag, escape literal closing-script sequences (`</script`) as `<\/script` before embedding it. The kit includes a page generator whose source itself contains a script tag.
