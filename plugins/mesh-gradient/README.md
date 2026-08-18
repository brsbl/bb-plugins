# Mesh Gradient

Design, preview, and export mesh gradients from bb.

Mesh Gradient opens beside any thread as a right-panel tab, generates layered radial-gradient backgrounds from a seed, six style palettes, or your own color, and lets you edit the result directly on the canvas — drag points, recolor them, adjust falloff, add and remove points, undo. Preview it as the surface it's actually for (OG card, hero, avatar) with a readability check on overlaid text, then hand it to an agent as a mention, a PNG, or a design token.

![Mesh Gradient in bb](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/mesh-gradient --yes
```

## Use

- In a thread's right panel, open a new tab (**+**) and choose **Mesh Gradient** from the Actions list — the studio opens beside the conversation. Shuffle seeds, switch styles, or pick **custom** to set a base color — the layout you've built stays put and the palette sweeps across it (hue left→right, lightness top→bottom, richest at the center), then edit directly on the canvas: drag points to move them, click a point to recolor it or change its falloff, double-click to add one, ⌘Z undoes. Everything else (add point, copy CSS/SVG, PNG, tokens, theme, save, reset) lives in the **⋯** menu.
- **Surface** switches the preview between Canvas, OG card (1200×630), Hero, and Avatar. The text presets draw sample copy in whichever of black or white reads better, with a badge — Readable / Large text only / Hard to read — carrying the WCAG numbers in its tooltip. The fast way to catch a hero that eats its own headline.
- **Send to agent** saves the gradient to the shared library, then writes the handoff into the thread's composer: `Apply the [@name] mesh gradient to …`, with the mention pill carrying the exact values when you send.
- From the library, hover a tile for a one-click **send** — no need to load it into the editor first.
- In any thread, mention a saved gradient with **`@gradient`** — the agent receives the exact values as context at send time. Agents can also call the `mesh_gradient` tool directly to generate options or read a saved gradient, and `::mesh-gradient{id=…}` in a reply renders a live swatch instead of a hex dump.
- **Export PNG** renders the current surface at its real pixel size, uploads it as a project attachment, and drops the path in the composer — the missing piece for OG cards and social assets.
- **Write token file** writes the whole library into the thread's own checkout as named tokens (CSS custom properties by default; Tailwind and TS via settings), so gradients get a name in the codebase instead of pasted values.
- All six palettes ship as bb themes — pick **Mesh Aurora / Sunset / Ocean / Candy / Forest / Mono** in Settings → Appearance. **Copy bb theme CSS** generates the same thing from any custom gradient.
- Agents (and you) can work with gradients from any thread:

```bash
bb mesh-gradient generate --seed 42 --style sunset      # deterministic CSS to stdout
bb mesh-gradient generate --color '#3366ff'             # generate around your own color
bb mesh-gradient show "deep tide" --format svg          # exact values of a saved gradient
bb mesh-gradient tokens --format css                    # whole library as design tokens
bb mesh-gradient save --seed 42 --style sunset          # add to the library
bb mesh-gradient list                                   # saved gradients
```

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-mesh-gradient
bb plugin install "path:$PWD/plugins/mesh-gradient" --yes
```
