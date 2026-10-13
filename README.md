# Mesh Gradient

Design, preview, and export mesh gradients from bb.

Mesh Gradient opens beside any thread as a right-panel tab. Ask the thread's agent for options and they land in the panel; or generate layered radial-gradient backgrounds from a seed, six style palettes, or your own color. Edit the result directly on the canvas — drag points, recolor them, adjust falloff, add and remove points, undo — with a live readability check that says whether white or black text holds up on it. Preview it as the surface it's actually for (OG card, hero, avatar), then hand it back to the agent as a mention, a PNG, or a design token.

![Mesh Gradient in bb](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/mesh-gradient --yes
```

## Use

- In a thread's right panel, open a new tab (**+**) and choose **Mesh Gradient** from the Actions list — the studio opens beside the conversation. Shuffle seeds, switch styles, or pick **custom** to set a base color — the layout you've built stays put and the palette sweeps across it (hue left→right, lightness top→bottom, richest at the center), then edit directly on the canvas: drag points to move them, click a point to recolor it or change its falloff, double-click to add one, ⌘Z undoes. Everything else (add point, copy CSS/SVG, PNG, tokens, theme, save, reset) lives in the **⋯** menu.
- **For this thread** collects gradients the agent proposed for this thread. **Ask the agent** drops a request into the composer; the agent answers with `mesh_gradient action=propose`, and each option appears as a tile with its name and why it fits. A fresh panel opens on the proposal whose text reads best; once you've started editing, new proposals wait in the row instead of replacing your work. Dismiss the ones you don't want.
- The badge in the canvas corner — **White text · Readable**, **Black text · Large text only**, or **Text is hard to read** — names the text color that reads best on the gradient, with the WCAG numbers in its tooltip. It shows on every surface except Avatar. When neither color holds up, the handoff asks the agent for a scrim behind the text instead.
- **Surface** switches the preview between Canvas, OG card (1200×630), Hero, and Avatar. The OG and Hero presets also draw sample copy in the readable color. The fast way to catch a hero that eats its own headline.
- **Send to agent** saves the gradient to the shared library, then writes the handoff into the thread's composer. On the Canvas surface it reads `Apply the [@name] mesh gradient to …`; on OG card, Hero, and Avatar it names the destination and readable text color, e.g. `Apply the [@name] mesh gradient as the Open Graph card background (1200×630), with white text on top (5.2:1 contrast).` The mention pill carries the exact values when you send.
- From the library, hover a tile for a one-click **send** — no need to load it into the editor first.
- In any thread, mention a saved gradient with **`@gradient`** — the agent receives the exact values as context at send time. Agents can also call the `mesh_gradient` tool directly to generate options or read a saved gradient, and `::mesh-gradient{id=…}` in a reply renders a live swatch instead of a hex dump.
- The **⋯** menu groups the rest: **Hand off** (Export PNG, Write token file, Save to library), **Copy** (CSS, SVG, bb theme CSS), and **Edit** (Add point, Reset to seed).
- **Export PNG** renders the current surface at its real pixel size, uploads it as a project attachment, and drops the path in the composer — the missing piece for OG cards and social assets.
- **Write token file** writes the whole library into the thread's own checkout as named tokens (CSS custom properties by default; Tailwind and TS via settings), so gradients get a name in the codebase instead of pasted values.
- All six palettes ship as bb themes — pick **Mesh Aurora / Sunset / Ocean / Candy / Forest / Mono** in Settings → Appearance. **Copy bb theme CSS** generates the same thing from any custom gradient.
- Agents (and you) can work with gradients from any thread. CSS output includes a `/* readability: … */` line naming the text color to use:

```bash
bb mesh-gradient propose --style ocean --name "calm tide" --note "fits the docs"   # show in this thread's panel
bb mesh-gradient proposals                              # options proposed for this thread
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
