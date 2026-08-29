---
name: sceneseed-interpreter
description: Interpret a user-submitted SceneSeed prompt by writing one bounded black-and-white Three.js visualization and submitting its JavaScript source through submit_scene_object. Use only for hidden SceneSeed agent jobs, not ordinary coding or user-facing chat.
---

# SceneSeed interpreter

Turn the supplied phrase into one recognizable black-and-white 3D
visualization. The user explicitly initiated this drawing action. You own the
Three.js composition; the plugin owns job identity, source execution,
serialization, framing, persistence, loading state, and user communication.

## Work only from the job payload

Use only the prompt, placement, nearby-object summaries, this skill, and
`submit_scene_object`. Do not inspect the project, unrelated filesystem
content, URLs, conversation history, or unrelated tools and skills. Do not
invent personal details.

## Write the Three.js scene

Call `submit_scene_object` with one `source` string. The string is a plain
JavaScript function body. `THREE` is already in scope; do not import or export
anything and do not wrap the source in Markdown fences.

The function body must build a `THREE.Object3D` and return exactly:

```js
return {
  root,
  name: "Short scene name",
  altText: "Concise description of the visible result.",
  camera: "three-quarter",
  movement: "still",
  shadow: "crisp",
};
```

- `root` may be a `THREE.Group`, mesh, line, points object, or a hierarchy of
  them. Prefer a `THREE.Group`.
- Use Three.js geometry, transforms, groups, materials, lights, loops, and
  local helper functions freely. This is real drawing code, not a declarative
  list of kit parts.
- Use built-in buffer geometries such as `BoxGeometry`, `SphereGeometry`,
  `CylinderGeometry`, `ConeGeometry`, `TorusGeometry`, `TorusKnotGeometry`,
  `CapsuleGeometry`, `LatheGeometry`, `ShapeGeometry`, `ExtrudeGeometry`,
  `TubeGeometry`, `RingGeometry`, or a finite custom `BufferGeometry`.
- Supported materials are `MeshBasicMaterial`, `MeshLambertMaterial`,
  `MeshPhongMaterial`, `MeshStandardMaterial`, `MeshPhysicalMaterial`,
  `MeshToonMaterial`, `LineBasicMaterial`, `LineDashedMaterial`, and
  `PointsMaterial`.
- Compose only in black, white, and grays. The plugin normalizes material and
  light colors to grayscale before serialization.
- Do not use textures, external assets, loaders, shaders, DOM APIs, network
  calls, timers, imports, exports, or runtime code generation.
- The plugin recenters the returned object horizontally, places its lowest
  visible point on the ground, and fits oversized work into the stage.
- Keep the result purposeful and fast to author: aim for 6–18 drawable
  objects, 2,000–6,000 aggregate vertices, no more than five unique geometries,
  and no more than eight materials. Reuse geometry and materials in repeated
  forms, keep the source under 6,000 characters and the serialized result under
  500 KB, and add detail only when it materially improves recognition.
- Keep `TubeGeometry` at or below 64 tubular by 12 radial segments. Keep
  `ExtrudeGeometry` at or below two steps, three bevel segments, and 12 curve
  segments. Never call `toNonIndexed()` or create geometry per face.
  The hard acceptance ceilings remain 80 drawable objects, 40,000 rendered
  vertices, 24 materials, and four lights.
- Optional `camera` is `front`, `three-quarter`, `top`, or `free`. A detailed
  `{ position: [x, y, z], target: [x, y, z], fov }` camera is also accepted
  and uses the free-camera framing.
- Optional `movement` is `still`, `breathe`, `orbit`, `bob`, or `shimmer`;
  `{ type, speed }` is accepted as the equivalent Three-style form.
- Optional `shadow` is `soft`, `crisp`, or `none`; small Three-style shadow
  option objects such as `{ enabled }` or `{ cast, receive }` are normalized.
  Do not add a ground plane or shadow mesh; Diorama supplies both.

## Make the visualization read clearly

1. Choose one visual thesis from the prompt and establish its silhouette.
2. Use recognizable proportion, overlap, curves, depth, and negative space;
   do not reduce every idea to stacked boxes.
3. Prefer `CapsuleGeometry`, spheres, lathes, tubes, toruses, rounded cylinders,
   and beveled `ExtrudeGeometry` for major forms. Use `BoxGeometry` only when a
   deliberately rigid edge is part of the idea. Keep radial segments around
   24–32 so silhouettes are smooth without wasting vertices.
4. Favor `MeshPhysicalMaterial` or `MeshStandardMaterial` with controlled
   gloss. A useful physical finish is roughness `0.16–0.34`, clearcoat
   `0.55–0.9`, and clearcoat roughness `0.12–0.25`; reserve modest transmission
   for one or two intentionally glass-like parts so the scene stays legible.
5. Write small local helper functions when repeated geometry or radial detail
   improves the form.
6. Use two to five grayscale values with a clear light/dark hierarchy. Express
   named colors through value, finish, lighting, or form rather than hue.
7. Prefer a crisp contact shadow and keep animation subordinate to the
   composition.
8. Write concise alt text describing only the visible major forms and their
   relationship.

Nearby objects are context for scale and visual rhythm, not ingredients to
copy. Each submitted prompt replaces the current canvas result.

For examples of literal, metaphorical, spatial, and abstract compositions,
consult
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
