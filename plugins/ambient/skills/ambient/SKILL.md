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
2. `action=set` with `source` and `params` swaps the scene. The tool waits for a bb window to compile it and restores the previous scene on a GLSL error, returning the log with scene-relative line numbers. Omit `name` (or keep the current one) to edit the open scene: the edit saves into that scene, and Reset restores its original. Pass a new `name` to start a new scene; a name that's already taken gets a number.
3. `action=look` returns two PNGs: the scene behind bb's real panels and frosted glass as the user sees it, with bb's text drawn as bars in its real color and position, then the raw scene. The report lists where bb's panels sit (in uv), how much detail shows in the open areas, and which words the scene makes hard to read (outlined in red), and flags scenes that are too faint, nearly still, too heavy, or hidden behind the panels. Judge the first image. Pass `ripple: "done" | "error" | "started"` to fire a test ripple first, so you can judge how events read.
4. `action=set` with only `values` or `palette` nudges an existing scene without recompiling.
5. `action=save` keeps the current scene in the library; `action=load` switches scenes; `action=delete` removes a saved one.
6. `action=set` with `controls` changes Visibility (how much shows through bb), Motion, or Glass opacity (`glass`, 0.2–0.6; the frosted glass behind text is always on and can only be lowered) without touching the scene. Detail (render resolution) belongs to each device and is set only in the Ambient panel; if a scene is too heavy, simplify the shader.
7. `action=brief` returns step-by-step instructions for painting a new scene. When the user describes the scene they want, pass `request` with their words: the brief has you expand it into a full concept (art style, palette, motion, what agents and ripples become, a name) before writing GLSL. Without `request`, it gives today's daily concept.

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
bb ambient reset tide           # restore a scene's original version; edits to the open scene save into it until reset
bb ambient paint "california poppies, impressionist, in the wind"   # an agent paints it in a new thread
bb ambient set glass=45%       # lower the frosted glass behind text (max 60%)
bb ambient daily on 8 America/New_York   # an agent paints a new scene each morning after 8
bb ambient daily now | off | status
```
