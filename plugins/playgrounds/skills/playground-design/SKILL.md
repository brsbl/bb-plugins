---
name: playground-design
description: Make HTML playgrounds that look and teach like finished products, built around a working object in the spirit of Anatomy by Ryan (@wheresryan22). Use for every HTML playground — product design instruments, product-building simulators, learning explainers, and collaborative boards, games and instruments — for choosing the hero, drawing it with the Anatomy kit or a bundled instrument, the card budget, controls, motion, and the pre-publish check.
---

# Playground design

One authoring system for HTML playgrounds. Read the `playgrounds` skill and
`bb playgrounds guide` first for what the frame allows; this skill covers what
the playground shows and how it looks.

**The object is the explanation.** Every playground is built around one hero:
a recognisable, well-made working thing whose behaviour *is* the idea, driven
by one small model that also feeds every readout. The reader learns by
changing it. Text, tables and forms support the hero; they never replace it.
A row of labelled boxes, a lone chart, or a form with a result is not a hero.

## 1. Pick the hero

| Use case | The hero | Example |
| --- | --- | --- |
| **Product design** — type, color, motion, spacing, layout, interaction feel | An instrument that makes the property physical, next to the real product surface it changes, both driven by the same values | Spring stiffness → the motion rig moving a real drawer UI; a color ramp → a swatch rack whose chips carry live text samples and pass/fail badges |
| **Product building** — systems, APIs, flows, rollouts, capacity | The system as a machine that runs: tokens dripping into a bucket, requests queuing at a gate, a shuttle moving between stations, a dial that opens stage by stage. At most one time-axis chart under it, with the threshold drawn as a line | Token bucket → a tank with a refill tap, an overflow lip and a request gate; a checkout state machine → a track with stations the order rides along |
| **Learning** — how something works | The real object or a lab instrument that demonstrates it, with the governing equation in one line and two or three experiment chips | A lever → a beam on a knife-edge fulcrum with hanging masses and a balance pointer; an engine → a cutaway piston, crank and valves |
| **Collaborative play and tooling** — things the user and the agent do together | The real object, crafted: a board, a pad deck, a corkboard. A visible `.pg-agent` area shows what the agent did or will do, and every move is an exposed action | Connect Four → a molded board on feet with discs that drop; a retro → a corkboard with seeded sample notes and an agent column for groups and actions |

Native documents are only for a plain calculator with no moving parts (a bill
split, a loan payment). Everything in this table — including plans, schedules
and capacity sizing — is an HTML playground with a hero.

## 2. Draw the hero

Choose the first path that fits:

1. **A bundled instrument.** For type size, line length, leading or margins,
   start from the typography press; for springs, damping or interface easing,
   start from the motion rig. Generate it, then adjust copy or defaults. Keep
   the width the build sets; the instruments are laid out for it:

   ```sh
   node typography-press/build.mjs --out /absolute/workspace/typography.json
   node motion-rig/build.mjs --out /absolute/workspace/motion.json
   ```

2. **A new Anatomy figure** for any physical or mechanical hero (learning
   objects, machines that stand for systems, crafted boards and instruments).
   Copy `figure/starter/` into a new directory in the workspace, rebuild the
   parts in `figure.mjs` as your object, wire `live.js`, and build:

   ```sh
   cp -R <this skill>/figure/starter /absolute/workspace/lever
   node <this skill>/figure/build.mjs /absolute/workspace/lever --out /absolute/workspace/lever.json
   ```

   Any machine, mechanism, apparatus or crafted physical object goes through
   this builder; never hand-draw one as flat SVG. Keep the starter's base,
   feet, screws, ruler and label plate where they fit, and build the object
   from at least 40 kit solids; the check counts them. Hang things from real
   hooks and rods, seat parts on other parts, and fill 55–65% of the figure.

   The builder inlines the kit, frames the figure (Fig n and name on top, hint
   and live readout below), follows bb's theme, adds the credit and license, and
   runs the check. `figure.mjs` exports `meta`, `initial`, `projection(k)` and
   `draw(k, state)` plus any model functions; it must not import anything.
   `live.js` receives `k`, `P`, `figure` (`svg`, `readout`, `hint`), `reduced`
   and every export of `figure.mjs`. Build the static parts once in `draw`; put
   each moving part in a `<g id>` built at rest and move it with
   `k.translateAlong`, or redraw one path (a needle, a spring) by id. Use the
   starter's `solid`, `cyl`, `screw`, `line` helpers and the kit's `coil`,
   `knurl`, `topTicks`, `radialTicks`, `sideArc`, `planOutline` and `haloOf`.
   Expect a figure to take several minutes; for learning and design that is
   worth it. Read [ANATOMY.md](ANATOMY.md) "The one idea that matters" and
   "Craft rules", and open the closest example, before you invent the object.

3. **A product surface or a data instrument** when the hero is a screen, a
   board game, a chart over time, or a map: draw it as clean inline SVG or
   HTML inside a `figure.pg-fig` frame, flat and precise like real UI, using
   the card tokens. Charts get labelled axes, threshold lines and a moving
   "now" marker, never a repeated pattern standing in for data.

Anatomy rules that apply to every hero:

- A recognisable object built from many small purposeful parts: bases on
  feet, rails, bushings, screws as dots, ticks hung from a ruler edge, knurled
  knobs. At 1× it reads as one thing; up close every region has a real part.
- Words stay out of the drawing: at most one tiny engraved label. Name parts
  in a `.pg-legend` under the figure or in the readout. No leader lines,
  arrows, or floating labels.
- Tone hierarchy: base and feet low, structure mid, the subject high, exactly
  one lit part — the one to watch. Color only where color is the subject.
- Everything the figure shows comes from the model that moves it.

## 3. The card

Structure, top to bottom: `.pg-title` (one short line, sentence case) and a
`.pg-subtitle` saying what to do; the hero in `figure.pg-fig`; the controls;
an optional `dl.pg-readouts` row; at most one `<details>`.

**Budget** (bundled instruments keep their own layout).

- About 700 CSS px tall at width 520. Publish `width` 440–560; wider only for
  a side-by-side or a map.
- At most 70 words of visible prose outside the figure. Explanations,
  assumptions, equations beyond one line, and sources belong in your chat
  reply, which sits right above the card.
- One accent per card (`--pg-accent`), used by sliders and the lit part.

**First state.** The card opens already showing the idea: a posed problem (an
unbalanced lever, a burst that overflows the bucket), seeded sample content
(three example retro notes, a starter beat), or a short idle tour. Never an
empty board or chart, and never a disabled primary button as the main action.

**Controls.**

- Continuous values: `label.pg-field` with an `<output>` and
  `input[type=range]`. Group several in `.pg-fields`.
- Modes and up to six choices: `.pg-seg`. Presets and experiments: chips.
- Exact numbers the user already knows (a price, a limit): `.pg-input` with
  the unit in a `<span>`. Avoid native `<select>`.
- Do not restyle the kit's sliders or buttons; set `--pg-accent` instead.

**Collaboration.** For boards, games and tools used with the agent, include a
`.pg-agent` area that shows the agent's last move, grouping or answer (seed it
with an example). Expose one action per move (`drop`, `group`, `addNote`) and
`read`, save state after every move, and use `window.playground.send` from a
click for "Send to agent".

## 4. Type, space, color

| Role | Size / line height | Weight | Ink |
| --- | --- | --- | --- |
| Card title | 20px / 1.2, tracking −0.02em | 500 | `--pg-ink` |
| Item title | 15px / 1.3 | 500 | `--pg-ink` |
| Section heading, field label | 12–13px / 1.3 | 500 | `--pg-ink` |
| Body | 12px / 1.45 | 400 | `--pg-body` |
| Subtitle, meta, caption, hint | 10.5–12px / 1.4 | 400 | `--pg-meta` |
| Readout value | 20px / 1.2, tabular numbers | 500 | `--pg-ink` |

- Headings, labels and values are ink; paragraphs body gray; only captions,
  units and hints meta gray. No other grays, no weights above 600, nothing
  below 10.5px. Short labels never wrap mid-word.
- Numbers read the way a person writes them, with one precision per list:
  money to cents, measurements as whole units, counts as counts, no trailing
  zeros.
- Body padding 20–22px; title→subtitle 3px; header→hero 16px; sections
  16–20px apart; grid gaps 8–12px. Radii: panels 16px, stage and photos 12px,
  inputs 8px, pills round. Borders 1px `--pg-hairline` or none; no shadows on
  content.
- Photos only from `https://upload.wikimedia.org` (`.pg-photos`). Maps are
  inline SVG schematics with your own labels; live tiles are blocked.

## 5. Motion

- Stream the card in with `.pg-reveal` (`--i` to stagger); the hero is
  readable by 0.5 s and nothing waits on downloads.
- Every interaction visibly changes the hero, with calm exponential follow or
  real springs. Stop animating offscreen or when settled.
- Respect `prefers-reduced-motion` (the builder passes `reduced`) and never
  use motion as the only signal.

## 6. Check before you publish

- The figure builder runs the check. For hand-written HTML, save the payload
  JSON and run `node <this skill>/figure/check.mjs payload.json`. Fix every
  error and every warning you cannot justify.
- Read your first frame as the user will see it. An empty tank, an empty
  trace, a blank board row, or a readout of 0 means the card opens before the
  idea starts: begin mid-run (tokens already flowing, the first comparison
  made, an opening move played).
- If Browser Automation is available, render the frame at 2× and look: no
  clipped or wrapped labels, the hero is the largest element, and one
  interaction changes it.

## Connect to Playgrounds

- Inline all code, styles and SVG. No CDN imports, fetch, remote fonts,
  workers, or new sandbox permissions.
- `window.playground.save` small validated input state after meaningful
  changes; restore `state` and apply `onState` without saving again. Never
  save frames or unbounded history.
- Expose the verbs a person would use (`set`, `reset`, `experiment`, a move),
  routed through the same code as the UI, returning small JSON.
- Follow `window.playground.theme` (the builder does this for Anatomy figures).
- Publish through the `playground` tool's `html`, `title` and `width` fields,
  or `bb playgrounds publish --playground <JSON>`. Built payloads exceed the
  16 KiB stdin cap, and their source contains `$` and backticks: pass the JSON
  as one argument without shell interpolation, for example Node's
  `execFileSync('bb', ['playgrounds', 'publish', '--playground', json])`.
  Emit the returned directive exactly once. Publish each revision as a new
  playground.

## Credit and license

**[Ryan (@wheresryan22)](https://github.com/wheresryan22)** created
[Anatomy](https://skills.wheresryan.sh/anatomy), its drawing kit, and the
original examples. The teaching approach also draws on
[The Bugged Dev's interactive lever demo](https://x.com/thebuggeddev/status/2108720133422395590).
This bb integration, the figure builder and the product-design instruments are
independently authored. [upstream.json](upstream.json) pins the original
commit and file hashes; [LICENSE](LICENSE) preserves Ryan's MIT notice. Treat
the installed skill as read-only and work on copies.

- Keep Ryan's MIT notice with copied kit code; the builder embeds it.
- Every figure built with the kit shows "Drawing kit: Anatomy by Ryan"; a
  learning lesson modeled on the lever demo also credits The Bugged Dev.
  Credit them in your reply too, and never imply they authored or endorsed
  the result.
- Do not run upstream standalone browser drivers (`capture.mjs`, `drive.mjs`,
  `lines.mjs`, `turn-check.mjs`, `turn-fidelity.mjs`); use bb Browser
  Automation. Never relax the sandbox to make a figure work.
- When inlining kit source into a script tag yourself, escape `</script` as
  `<\/script`.
