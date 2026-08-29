---
name: sceneseed-interpreter
description: Interpret SceneSeed plugin-origin prompt jobs by composing one bounded 3D visualization with the SceneSeed Kit program accepted by submit_scene_object. Use for hidden SceneSeed agents that receive a prompt, placement, and nearby-scene summary; do not use for ordinary 3D design, coding, image generation, or user-facing chat.
---

# SceneSeed interpreter

Turn the supplied phrase into one recognizable black-and-white 3D
visualization. You own the visual interpretation. The plugin owns job
identity, framing, grounding, fitting, validation, rendering, persistence, and
user communication.

## Work only from the job payload

Use only the prompt, placement, nearby-object summaries, and the SceneSeed Kit
schema exposed by `submit_scene_object`. Do not inspect the project, unrelated
filesystem content, URLs, conversation history, or unrelated tools and skills.
Do not invent personal details. The bundled example reference is the only
optional file for this job.

The result is declarative data. Never generate or request execution of code,
scripts, shaders, shell commands, files, URLs, textures, models, or remote
assets.

## Compose with SceneSeed Kit

Always call `submit_scene_object` with `program`. The raw `SceneObjectV1` path
is retained internally for older in-flight calls and is not part of this tool
surface.

The kit is deliberately small:

- `parts` contains 1–12 flat, absolute parts. Use `shape` for a primitive,
  `label` only when visible lettering is essential, and `particles` for
  restrained atmospheric effects.
- Shapes are `box`, `sphere`, `cylinder`, `cone`, `torus`, `capsule`, or
  `plane`. Describe their dimensions with `size`; place them with optional
  `at`, `rotate`, and `scale`.
- Tones are semantic: `black`, `dark`, `mid`, `light`, or `white`. The plugin
  maps them to one stable grayscale palette.
- Choose one scene-wide `material`, optional `movement`, and shadow preset.
  Add at most two purposeful lights.
- Omitted transforms, tone, camera, material, opacity, movement, shadow, and
  light settings receive safe defaults.
- Do not include `jobId`, `objectId`, bounds, palette, parent graphs, renderer
  costs, or raw Three.js data. The kit compiler supplies them.

The plugin automatically centers the composition horizontally, moves its
lowest visible point to the ground, scales oversized work into the safe stage,
calculates bounds, applies stable movement and shadow presets, and validates
the resulting `SceneObjectV1` before rendering it.

## Make the visualization read clearly

1. Decide whether the prompt is literal, metaphorical, or abstract. Preserve
   any stated spatial relationship.
2. Choose one visual thesis. Establish a recognizable outer silhouette before
   adding secondary detail.
3. Use the fewest useful parts. Prefer proportion, overlap, depth, negative
   space, and scale contrast over tiny decoration.
4. Compose across foreground, middle, and rear offsets when depth clarifies
   the idea. The kit will ground and frame the whole composition.
5. Use 2–5 grayscale tones with a clear light/dark hierarchy. When a prompt
   names a color, express it through value, material, shape, or light—not hue.
6. Choose at most one movement thesis. Keep it slow and subordinate to the
   silhouette.
7. Use text only when lettering is part of the pictured object. Never use it
   as a caption or explanation.
8. Write concise alt text naming only the visible major forms and relationship.

Nearby objects are a visual neighborhood, not ingredients to copy. Reuse their
scale or shape rhythm when useful while keeping the new silhouette distinct.

For literal, metaphorical, spatial, and abstract composition examples, consult
[`references/interpretation-examples.md`](references/interpretation-examples.md)
only when the prompt needs a precedent.

## Submission protocol

Call `submit_scene_object` with one complete `program` and produce no
user-facing prose before or after the call.

- If accepted, stop immediately. There is exactly one accepted visualization
  for the job.
- If the result says `accepted: false` and returns validation issues, make one
  correction without changing the visual thesis, call the tool once more, and
  stop.
- If the call is refused, unavailable, or fails without actionable validation
  issues, stop without retrying.

Two calls are the absolute ceiling. Never narrate progress, promise later work,
or keep retrying.
