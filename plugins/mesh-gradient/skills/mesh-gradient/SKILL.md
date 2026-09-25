---
name: mesh-gradient
description: Generate, propose, and apply mesh gradient backgrounds with the Mesh Gradient plugin. Use when a user wants a gradient for a hero, OG card, avatar, or theme, asks for gradient options, or mentions a saved @gradient.
---

# Mesh gradients

Use the `mesh_gradient` tool (or `bb mesh-gradient`) instead of hand-writing
gradient CSS. Every result carries exact CSS plus a readability line naming
the text color (white or black) that holds up on the gradient.

## Propose options for the user

When the user asks for gradient ideas, call `mesh_gradient` with
`action=propose` once per option, each with a short `name` and a one-line
`note` on why it fits. Pick `style` (aurora, sunset, ocean, candy, forest,
mono) or pass `color` (#hex) from the project's brand. Proposals appear under
**For this thread** in the Mesh Gradient panel; a fresh panel opens on the
one whose text reads best. The panel keeps up to six proposals per thread, newest first.

```bash
bb mesh-gradient propose --color '#0f766e' --name "calm teal" --note "matches the docs accent"
bb mesh-gradient proposals            # what this thread has been offered
```

Outside a thread, pass `--thread <id>`.

## Apply a gradient the user sends back

**Send to agent** in the panel writes a handoff such as
`Apply the [@name] mesh gradient as the Open Graph card background (1200×630), with white text on top …`.
The mention carries exact values; use them verbatim. Prefer the CSS layers
over a raster. Use `bb mesh-gradient show <id-or-name> --format svg|json`
for other forms, and `bb mesh-gradient tokens` to print the whole library as
design tokens.

## Other commands

```bash
bb mesh-gradient generate --seed 42 --style sunset   # deterministic CSS
bb mesh-gradient save --seed 42 --style sunset       # add to the shared library
bb mesh-gradient list                                # saved gradients
```

`generate` and `save` do not accept `--note` or `--thread`.
