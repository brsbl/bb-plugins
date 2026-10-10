---
name: anatomy
description: Create illustrated learning playgrounds that explain a concept through a working physical object, using Anatomy by Ryan (@wheresryan22). Use when asked for Anatomy, an isometric explainer, or an interactive science lesson with controls, equations, measurements, and guided experiments.
---

# Anatomy for Playgrounds

Create a playground the reader can learn by changing. **[Ryan (@wheresryan22)](https://github.com/wheresryan22)**
created [Anatomy](https://skills.wheresryan.sh/anatomy), its drawing kit, and the
original examples. The teaching approach also draws inspiration from
[The Bugged Dev's interactive lever demo](https://x.com/thebuggeddev/status/2108720133422395590).
This bb integration and its lever example are independently authored.

## Choose the explanation

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

## Start with the lever lab

`lever-lab/` is the bb-specific example: an illustrated beam balance with
mass and distance sliders, torque readouts, a tilt trace, and guided experiments.
It uses Ryan's SVG kit, without external assets or runtime dependencies.

From this skill directory, generate the HTML playground payload into a new
file in the user's workspace (the path must not already exist):

```sh
node lever-lab/build.mjs --out /absolute/workspace/lever.json
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

## Connect to Playgrounds

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

## Verify and credit

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
