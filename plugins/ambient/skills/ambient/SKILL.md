---
name: ambient
description: Paint, tune, or inspect bb's Ambient background — the live GLSL scene behind the bb UI that reacts to running agents, finished turns, errors, and threads waiting on the user. Use when the user asks to change, restyle, create, or look at the ambient background, its palette, or its sliders.
---

# Ambient

Ambient renders one GLSL scene behind bb's UI. bb's surfaces sit over it with a
translucent veil, so the scene reads as a soft, living backdrop.

- Each working agent is a drifting point (`u_agents`), and threads waiting on the user pulse.
- A finished turn sends out a ripple from that agent (`u_ripples`); an error ripple is kind 1.
- The user tunes the scene with sliders, palette swatches, show-through, speed, and resolution in the sidebar footer's Ambient panel.

## Collaborate through the `ambient` tool

1. `action=get` returns the shader contract, the current source, params, and palette. Read it before writing.
2. `action=set` with `source` and `params` swaps the scene. The tool waits for a bb window to compile it and restores the previous scene on a GLSL error, returning the log with scene-relative line numbers.
3. `action=look` returns a PNG of the raw scene and how far it differs from bb's background; it flags scenes that will be too faint behind the veil. Pass `ripple: "done" | "error" | "started"` to fire a test ripple first, so you can judge how events read.
4. `action=set` with only `values` or `palette` nudges an existing scene without recompiling.
5. `action=save` keeps the current scene in the library; `action=load` switches scenes.

Declare every aesthetic choice a person might want to feel out as a param (scale, glow,
drift, contrast) instead of hard-coding it. Params become sliders immediately. Keep one
`color` param that mixes toward `u_canvas` so the user can fade the scene. Render the palette at full strength in both light and dark mode; the veil already follows bb's theme, so don't dim the scene for `u_dark`.

Keep scenes calm enough to sit behind text: low-frequency shapes, slow motion,
and event responses that are noticeable without being alarming. Loop over
agents and ripples with a constant bound and `break` on the count.

## CLI

```bash
bb ambient status              # active scene, params, controls
bb ambient list                # built-in and saved scenes
bb ambient load <id-or-name>
bb ambient set glow=1.2 scale=3
bb ambient save [name]
bb ambient delete <id>
bb ambient on | off
bb ambient daily on 8 America/New_York   # an agent paints a new scene each morning after 8
bb ambient daily now | off | status
```
