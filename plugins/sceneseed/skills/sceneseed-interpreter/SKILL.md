---
name: sceneseed-interpreter
description: Interpret a user-submitted Protofetti prompt as one bounded procedural hand-drawn sketch and submit its JavaScript source through submit_scene_object. Use only for hidden Protofetti agent jobs, not ordinary coding or user-facing chat.
---

# Protofetti interpreter

Turn the supplied phrase into one recognizable, loose sketch. The user
explicitly initiated this drawing action. You own the composition; the plugin
owns job identity, source execution, brush bounds, serialization, framing,
persistence, loading state, and user communication.

## Work only from the job payload

Use only the prompt, placement, nearby-object summaries, this skill, and
`submit_scene_object`. Do not inspect the project, unrelated filesystem
content, URLs, conversation history, or unrelated tools and skills. Do not
invent personal details.

## Submit one brush drawing

Call `submit_scene_object` with one `source` string. The string is a plain
JavaScript function body. `BRUSH` and `THREE` are already in scope; do not
import or export anything and do not wrap the source in Markdown fences.

Use `THREE` only for a root `Group`. Make every visible mark with the procedural
brush, then return exactly:

```js
const root = new THREE.Group();
const pencil = BRUSH.create({
  seed: 27,
  texture: "pencil",
  shape: "tapered",
  width: 0.11,
  opacity: 0.9,
  pressureVariation: 0.34,
  jitter: 0.55,
  layering: 3,
  color: 0x343434,
  colorBehavior: "graphite",
});

root.add(
  pencil.stroke(
    [[-3, -2], [-2.7, 1], [-1.4, 2.4], [1, 2.2], [2.8, 0.7], [3, -2]],
    { closed: true, pressure: [0.25, 0.72, 1, 0.86, 0.65, 0.2] },
  ),
);
root.add(pencil.stroke(
  [[-2.2, 0.1], [-0.8, 0.7], [0.5, 0.2], [2, 0.8]],
  { opacity: 0.66, layering: 1 },
));

return {
  root,
  name: "Short sketch name",
  altText: "Concise description of the visible drawing.",
  camera: "front",
  movement: "still",
  shadow: "none",
};
```

`pencil.stroke(points, overrides?)` returns a serializable `THREE.Group` and
accepts two- or three-coordinate points. Two-coordinate points draw on the XY
plane. Use shallow `depth` overrides only to control overlap.

### Brush controls

| Control | Values | Purpose |
| --- | --- | --- |
| `shape` | `round`, `tapered`, `flat` | End and pressure profile of the mark. |
| `texture` | `clean`, `pencil`, `charcoal`, `ink` | Coordinated grain, gaps, layering, and opacity defaults. |
| `textureStrength` | `0–1` | Blends the texture preset toward a clean stroke. |
| `opacity` | `0.05–1` | Darkness of the primary pass; searching passes are lighter. |
| `width` | `0.01–2` | Base ribbon width in scene units. |
| `pressure` | number or per-point array | Explicit pressure along the path. |
| `pressureVariation` | `0–0.9` | Seeded width fluctuation along the stroke. |
| `jitter` | `0–1.5` | Seeded searching-line displacement relative to width. |
| `layering` | `1–4` | Number of slightly displaced passes. |
| `color` | hex number or CSS color | Base color or graphite value. |
| `colorBehavior` | `fixed`, `graphite`, `layered` | Keeps one value, converts to graphite, or varies value across passes before output normalization. |
| `colorVariation` | `0–0.45` | Amount of pass-to-pass value variation. |
| `smoothing` | `0–0.45` | Corner softening without uncontrolled detail. |
| `closed` | boolean | Joins the final point back to the first. |
| `normal` | 2D or 3D vector | Drawing plane normal for non-XY marks. |
| `depth` | `-20–20` | Small plane offset for overlap ordering. |
| `seed` | integer | Makes jitter, pressure, gaps, and layering repeatable. |

Defaults are bounded. One brush may compose many strokes and reuses compatible
materials. The brush rejects more than 48 points per stroke, more than four
layers, and more than 520 cumulative brush vertices. The complete generated
scene remains capped at 600 vertices for compatibility with the existing
source evaluator.

## Draw like a working sketch

1. Choose one instantly recognizable silhouette and draw it large enough to
   occupy the canvas.
2. Use 4–6 purposeful strokes: one closed outer contour, a few overlapping
   interior contours, and one or two lighter construction or hatching marks.
3. Prefer 4–6 control points per stroke. Place bends where the subject changes
   direction; do not add points merely to make the curve smoother.
4. Keep the composition front-facing, slightly asymmetrical, and imperfect.
   Let searching lines miss and overlap by a small amount.
5. Vary pressure explicitly on the hero contour and let the brush add smaller
   seeded variation. Start and end tapered strokes lightly.
6. Keep the drawing legible at a glance: use `0.85–0.95` opacity for the hero
   silhouette, `0.60–0.75` for interior structure, and `0.30–0.40` for no more
   than two construction marks. Do not make recognition depend on the pale
   marks.
7. Represent color through grayscale value. Protofetti's existing color controls
   tint those values after rendering without regeneration.
8. Describe only the visible result in the alt text.

Avoid polished vector symmetry, geometric primitives, solid fills, glossy 3D
materials, grids, axes, frames, shadows, and decorative lines that do not help
recognition. Do not add a ground plane; the sketch floats on the canvas like a
page in a notebook.

Nearby objects are context for scale and visual rhythm, not ingredients to
copy. Each submitted prompt replaces the current canvas result.

For literal, metaphorical, spatial, and abstract composition examples, consult
[`references/interpretation-examples.md`](references/interpretation-examples.md)
only when the prompt needs a precedent.

## Submission protocol

Call `submit_scene_object` once with the complete source and produce no
user-facing prose before or after the call.

- If accepted, stop immediately.
- If it returns actionable validation or execution issues, correct the same
  visual thesis, call the tool one final time, and stop.
- If it is refused, unavailable, or fails without actionable issues, stop.

Two calls are the absolute ceiling. Never narrate progress or keep retrying.
