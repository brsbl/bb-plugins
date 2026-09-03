# Protofetti

Protofetti turns a prompt into one persistent interactive sketch scene.
Send an idea from bb's composer and a hidden bb agent replaces the canvas with
its bounded, hand-drawn interpretation.

![Protofetti showing a generated scene and bb's composer](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/sceneseed --yes
```

Open **Protofetti** in bb's navigation, enter a prompt, and send it. Protofetti
creates its persistent canvas automatically, shimmers while the interpretation
runs, and replaces the current scene when the next prompt completes.

## Use

- Enter a prompt in bb's composer and send it. A failed interpretation offers
  an in-place retry.
- The first result fills the canvas. Each later prompt replaces it after a
  canvas-wide loading shimmer.
- Orbit or zoom the stage, apply a color tint, or remix the current scene.
  Protofetti restores the persistent scene across reloads.

## Agent access

Scene generation uses a plugin-owned procedural brush. When the user sends a
prompt, Protofetti supplies a focused template with `BRUSH` and `THREE` already in
scope. The agent composes visible marks with the bounded brush and uses Three.js
only for the returned root group. Protofetti runs that source for the requested
job, normalizes the result to grayscale, recenters it, fits it into renderer
limits, serializes ordinary Three.js geometry, and persists the result.

The browser never evaluates returned source: it receives the serialized
Three.js object and loads it into the existing canvas renderer. This flow uses
the plugin's existing agent tool and bb SDK surface. Previously saved
`SceneObjectV1` records and older in-flight declarative submissions remain
accepted for compatibility.

## Procedural brush API

Create one deterministic brush and compose strokes from arbitrary 2D or 3D
control points:

```js
const pencil = BRUSH.create({
  seed: 27,
  texture: "pencil",
  shape: "tapered",
  width: 0.11,
  opacity: 0.9,
  pressureVariation: 0.34,
  jitter: 0.55,
  layering: 3,
  colorBehavior: "graphite",
});

root.add(
  pencil.stroke([[-3, -2], [-1, 2], [2, 1], [3, -2]], {
    closed: true,
    pressure: [0.2, 1, 0.7, 0.2],
  }),
);
```

`stroke(points, overrides?)` exposes stroke shape, texture preset and strength,
opacity, width, scalar or per-point pressure, pressure variation, jitter,
layering, base color, color behavior and variation, smoothing, drawing-plane
normal, closure, depth, and seed. One brush reuses compatible materials and is
bounded to 48 points per stroke, four layers, and 520 cumulative vertices.
`pencil.stats()` reports its stroke, layer, and vertex totals. The complete
generated scene keeps the existing 600-vertex evaluator ceiling.

`colorBehavior: "graphite"` converts the base color inside the brush. `fixed`
keeps one base value, while `layered` varies that value between passes. The
production output path normalizes every generated material to grayscale,
preserves sketch graphite contrast, then applies the user's chosen canvas tint
without regeneration.

For a legible sketch hierarchy, use `0.85–0.95` opacity for the silhouette,
`0.60–0.75` for interior structure, and reserve `0.30–0.40` for one or two
construction marks that are not required for recognition.

The stable before/after evaluation inputs and criteria are recorded in
[`docs/brush-evaluation.md`](docs/brush-evaluation.md).

## Prompt gallery

The committed gallery covers 50 plugin, product-screen, and early-product
prompts at a consistent desktop viewport. Open
[`docs/prompt-gallery-overview.png`](docs/prompt-gallery-overview.png) for the
contact sheet or browse the individual captures in [`docs/prompt-gallery/`](docs/prompt-gallery/).

Run the interactive production-renderer gallery from the repository root:

```bash
npm run gallery --workspace=bb-plugin-sceneseed
```

The stable review route is
`http://localhost:61000/?mode=preview&story=diorama--prompt-gallery--gallery`.
The legacy `diorama` story prefix is intentional so existing review links stay
valid after the Protofetti display-name change.

To regenerate the 50 committed captures with Chrome for Testing while the
gallery is running:

```bash
SCENESEED_CHROME_PATH=/path/to/chrome npm run gallery:capture --workspace=bb-plugin-sceneseed
```

The same saved records are available through the plugin CLI:

```bash
bb sceneseed list
bb sceneseed show <canvas-id> --json
bb sceneseed add <canvas-id> --prompt "a storm in a teacup" --x 0 --y 0
bb sceneseed wait <job-id>
bb sceneseed cancel <job-id>
bb sceneseed remove-object <canvas-id> <object-id>
```

## Safety and privacy

- Generated source runs only for the prompt action the user submitted. It has
  the supplied bounded `BRUSH` API and `THREE` namespace and must return one
  finite object; imports, URLs, files, remote assets, textures, shaders, DOM,
  and network access are not part of the template.
- Prompts, generated scene graphs, transforms, job state, and canvas metadata are
  stored in the plugin's private SQLite database, not in a project workspace.
- The canvas uses a hidden, persistent bb thread in the personal project. The
  thread uses the normal provider and bb capability envelope; Protofetti asks it
  not to inspect unrelated context, but does not claim structural isolation.
- Disabling or uninstalling the plugin does not erase its database or spawned
  threads. Use **Delete Protofetti data** in Protofetti settings to archive the
  interpreter thread and clear stored data, including legacy canvases.

## MVP limits

Only one prompt can generate at a time. The persisted data contract retains its
existing 25-object and 100-unit safety ceilings for backward compatibility.
Sharing, export, collaboration, raw mesh editing, remote model loading, and
image generation are intentionally out of scope.

`fixtures/prompt-scenes.json` is the fixed 32-prompt evaluation set for future
agent-quality runs: eight literal, metaphorical, spatial, and abstract prompts,
each with nearby-scene context and observable interpretation cues. It is test
data, not bundled executable content.

## Develop

From the repository root:

```bash
npm ci
npm run check --workspace=bb-plugin-sceneseed
bb plugin install "path:$PWD/plugins/sceneseed" --yes
```
