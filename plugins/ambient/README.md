# Ambient

A living generative background for bb, driven by what your agents are doing.

Ambient paints a GLSL scene behind the bb UI. Working agents drift through it as
points of light, threads waiting on you pulse, finished turns send out ripples,
and errors ripple red. Open **Ambient** in the sidebar footer to switch scenes,
drag the scene's sliders, recolor its palette, and set how much of it shows
through bb's surfaces.

![Ambient's Tide scene behind bb with two working agents as lights and the Ambient controls open in the sidebar](docs/screenshot.png)

Agents collaborate on the scene through the `ambient` tool. They can read the
shader contract, write a new scene with its own sliders, get compile errors back,
and look at a captured frame. Ask an agent to "make the ambient background feel
like a slow aurora" and then tune the result with the knobs it gives you.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ambient --yes
```

## Use

| Surface | What it does |
| --- | --- |
| Sidebar footer → Ambient | Scene dropdown; each scene's sliders and four colors, saved automatically as you change them, with ⌘Z / ⇧⌘Z to undo and redo. Shader edits an agent makes to the open scene save into that scene too, and Reset restores any edited scene's original version (a built-in's shipped look and the default display settings, or a saved scene as first saved); Display (Visibility: how much shows through bb, Motion: speed, Detail: render resolution, Glass opacity: frosted glass always sits behind the thread column, the composer, the right panel, the sidebar's cards, and the header's pills so text stays readable; the slider only lowers it from its 60% default); "When an agent starts / finishes / errors" to preview how the scene reacts |
| Sidebar footer → Ambient → Create a scene | Describe a scene in your own words and an agent creates it in a new thread. The agent first expands your description into a full concept (art style, palette, motion, what your agents and ripples become, a name), then writes, checks, and saves the scene |
| `ambient` agent tool | `get`, `set` (scene or controls), `look` (the scene behind bb's real UI, with its text drawn as bars so none of it reaches the model, plus the raw scene, with readability, open-area, visibility, motion, and cost checks), `library`, `load`, `save`, `delete`, `brief` (pass `request` to paint what the user described) |
| `bb ambient` | `status`, `list`, `load`, `set <param or visibility/motion/detail/glass>=<value>`, `palette`, `save`, `delete`, `on`, `off`, `reset <scene>`, `paint <description>`, `daily` |
| Sidebar footer → Ambient → Daily scene | Creates a bb automation that runs after the hour you pick, in your time zone. Its agent asks the `ambient` tool for today's brief, then paints, checks, and saves a scene around a rotating concept. Pause, edit, or see run history in Automations; `bb ambient daily now` runs it immediately |

Built-in scenes: **Tide**, **Fireflies**, **Contour**, **Risograph Map**, **Poppy Hill in the Wind**, **Plasticine Lighthouse Cove**, **Swirling Stars, Screaming Fjord**, and **Jellyfish Deep**.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-ambient
bb plugin install "path:$PWD/plugins/ambient" --yes
```
