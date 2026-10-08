---
name: interactive-answers
description: Compose interactive answers directly in a bb message: native calculators, charts, and comparisons, or custom HTML interfaces such as illustrated step-by-step guides, maps with photos, and visual previews. Use when exploring, comparing, or following along would help more than prose.
---

# Interactive Answers

Use `interactive_answer` with `action: "guide"` for the current schema, the
HTML kit, and examples. Then call `action: "publish"` with either `document`
(a native JSON document) or `html` plus `title` (and optional `width`). Copy
the returned directive exactly once onto its own line in your response.

With the CLI, read `bb interactive-answers guide`, or print a starter with
`bb interactive-answers example savings` (also `bill`, and `stepper` for an
HTML answer). Publish with `bb interactive-answers publish --document-stdin`
or `--answer-stdin`, each taking one line of JSON. Plugin CLI stdin is capped
at 16 KiB; pass larger HTML answers as `--answer '<json>'`.

## Choose the form

- **Native document** for calculators, scenario comparisons, charts, and
  tables. Bounded arithmetic, no code, accessible by construction.
- **HTML answer** when the answer needs its own layout or illustration: an
  assembly guide with an exploded diagram, a map with places and photos, a
  paint or product preview, folding or cooking steps, a visual plan.

- Start with the user's question and choose useful inputs. Name units and
  assumptions. Use plain prose if interaction would not improve the answer.
- Native controls: `number`, `range`, and `select`. Supply valid bounds,
  a positive step, and a default on that step. Numeric expressions can refer
  to numeric controls and earlier calculations, never select controls.
- Blocks: `text`, `metrics`, line/bar `chart`, `table`, expandable `details`, and interactive vector `diagram` blocks.
  An optional `when: {control, equals}` shows a block for one control value.
- Expressions: a number, `{ref: "name"}`, or `{op, args}`. Operations are
  `add`, `subtract`, `multiply`, `divide`, `power`, `min`, `max`, and `round`.
  Round takes one operand; subtract/divide/power take two; others take 2–12.
  Native documents run no JavaScript, HTML, Markdown, or network requests.
- Keep charts small, label series, and make every series match its labels.
  Tables must have one cell per column. Numeric output formats accept
  `prefix`, `suffix`, and `decimals` (0–6). Chart data is also accessible as a table.
- Show sources and consequential assumptions in accompanying prose. Do not
  imply a scenario is a prediction or that sample values are live data.
- Inputs update immediately and persist in that browser. They are not sent
  to the agent, shared across devices, or approvals to take action.
- Answers render after publication, not progressively during generation.
  Published documents are immutable; publish a fresh answer for a revision.
  Old answers retain their original content. Do not reuse another thread's ID.

Use action cards for approvals or actions that need to reach an agent.

## HTML answers

Write body markup with inline `<style>` and `<script>`. It renders in a
sandboxed, opaque-origin frame inside a rounded bb card that sizes itself to
the content; `width` (320–1200) caps the card width.

- Follow bb's theme with `--background`, `--foreground`, `--card`, `--muted`,
  `--muted-foreground`, `--border`, `--ring`, and `--font`. Fixed colors are
  fine inside illustrations, photos, maps, and swatches.
- Kit classes: `.ia-title`, `.ia-subtitle`, `.ia-eyebrow`, `.ia-panel`,
  `.ia-seg` (buttons with `aria-pressed`), `.ia-chip`, `.ia-btn`,
  `.ia-btn-primary`, `.ia-check`, `.ia-dots`, `.ia-reveal` (set `--i` to
  stagger an entrance).
- `window.answer.state` holds the last value passed to `window.answer.save()`
  in this browser. Save after each meaningful change so a reload restores it.
  `window.answer.onTheme(callback)` reports theme changes.
- Draw illustrations as inline SVG. Remote images, map tiles, and scripts load
  normally; use stable public sources and credit them in your prose.
- Use real buttons, visible focus, and `prefers-reduced-motion`. Animate
  changes so users can see what moved, and never rely on motion alone.
- The frame cannot reach bb, cookies, or the conversation, and inputs are not
  sent to the agent. Its scripts can use the network, so never send what the
  user enters to any server. `demos/` in the plugin holds complete examples.

## Interactive diagrams

A `diagram` has a title, an accessible description, a width/height viewBox,
and up to 240 drawing elements: `path`, `rect`, `ellipse`, `line`, or `text`.
Elements accept numeric expressions for
position, size, opacity, scale, and rotation. SVG paths are fixed geometry;
there is no raw SVG markup, HTML, script, or external asset loading.

- `x` and `y` translate an element. `rotate` is degrees around `originX` and
  `originY`; `scale` is clamped to 0–10. Ellipses are centered on their origin.
  A line runs from its origin to local `x2`, `y2`.
- Paint accepts hex colors, `none`, or `currentColor`. To bind paint to a
  select, use `{control, colors: [{value, color}]}`, covering each choice once.
- `when: {control, equals}` shows a shape for one input value.
- `choose: {control, value}` makes a shape update an existing control. Supply
  a meaningful `label` and at least a 24×24 visible target. Keyboard users can
  press Enter or Space; retain the native control as an alternative.
- Include a useful description of the illustration. Explain schematic maps,
  illustrative growth, and simplified mechanics rather than implying live
  geographic data, precise predictions, or complete repair instructions.
- Transitions follow reduced-motion preferences. Do not use motion as the only
  way to convey a change.
