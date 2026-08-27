# SceneSeed interpretation examples

Use these examples to resolve interpretation choices, not as templates to copy
node for node. A good SceneSeed result keeps the prompt's core relationship
legible after it is reduced to a small set of bounded primitives.

## Literal

### Tiny red lighthouse

- **Thesis:** a narrow red tower with a bright lantern cap.
- **Silhouette:** stacked cylinders, a small cone roof, and one contrasting
  horizontal balcony ring.
- **Depth and grounding:** taper the tower slightly, lift the lantern above the
  balcony, and use a compact shadow under the base.
- **Restraint:** light beams can be two translucent cones; windows and masonry
  are unnecessary if they weaken the outline.

### Cactus in a teacup

- **Thesis:** one rounded cactus emerging from an unmistakable handled cup.
- **Silhouette:** low cylinder or capsule cup, torus-like handle, tall capsule
  cactus with two short arms.
- **Material:** matte ceramic against a slightly glossy green plant.
- **Restraint:** imply spines with a few particles only if the cost remains
  low; never depend on them for recognition.

## Metaphorical

### A rainy thought in a jar

- **Thesis:** a small blue cloud trapped inside a clear vessel, raining into
  its own base.
- **Silhouette:** transparent cylindrical jar enclosing an irregular cluster
  of spheres; a few vertical droplets establish rain.
- **Depth and grounding:** overlap the cloud lobes at different depths and let
  the jar cast the contact shadow.
- **Motion:** a restrained `bob` or `shimmer` can make the thought feel alive;
  do not animate every part.

### Hope growing through concrete

- **Thesis:** one vivid shoot splitting a heavy gray slab.
- **Silhouette:** wide low box with a central crack suggested by separated
  pieces, plus a narrow green stem and two leaves.
- **Scale contrast:** the small shoot must be the focal exception against the
  slab's weight.
- **Restraint:** the metaphor is the relationship; extra rubble is secondary.

## Spatial

### A red sphere balanced between two towers

- **Thesis:** the precarious bridge-like relationship is more important than
  architectural detail.
- **Silhouette:** two vertical boxes or cylinders separated by a narrow gap,
  with one red sphere touching both upper edges.
- **Camera:** use `front` or `three-quarter` so both contact points read.
- **Grounding:** the towers share one contact shadow; the sphere should not
  appear to float clear of them.

### A key floating inside a transparent cube

- **Thesis:** containment, not a key beside a box.
- **Silhouette:** a glass cube around a simple shaft, ring, and two teeth made
  from cylinders, a torus, and boxes.
- **Depth:** offset the key within the cube and choose `three-quarter` so the
  enclosure remains obvious.
- **Restraint:** use no label or explanatory text.

## Abstract

### Two ideas almost meeting

- **Thesis:** two distinct forms lean toward one another across a charged gap.
- **Silhouette:** contrasting bulb-like clusters with narrow stems or beams
  that stop just short of contact.
- **Material and light:** one warm and one cool emissive accent can make the
  gap the focal point.
- **Restraint:** preserve the negative space; filling it destroys the idea.

### Organized chaos

- **Thesis:** a calm outer order contains visibly varied internal motion.
- **Silhouette:** a regular ring or frame surrounding differently sized forms
  at staggered depths.
- **Coherence:** repeat one color or material across the irregular forms so
  they read as a system.
- **Motion:** one bounded `orbit` may reinforce the idea; several competing
  motions turn legibility into noise.

## Text when lettering is essential

### EXIT sign half-buried in snow

Here the four visible letters are part of the object, so one short text node is
appropriate. Pair it with a thin box sign and overlapping white mounds. Do not
add a caption such as “an exit sign”; the visual text already carries the
prompt.

## Complete SceneObjectV1 payloads

These payloads demonstrate the strict flat-node shape. Replace fixture IDs with
the IDs supplied by the current job; do not copy an example's identifiers.

### Literal: tiny red lighthouse

```json
{
  "version": 1,
  "jobId": "job-lighthouse",
  "objectId": "object-lighthouse",
  "name": "Tiny red lighthouse",
  "altText": "A small red lighthouse with a pale lantern, dark balcony ring, and pointed roof.",
  "bounds": { "width": 2.8, "height": 6.4, "depth": 2.8 },
  "cameraHint": "three-quarter",
  "palette": ["theme:danger", "theme:canvas", "theme:ink", "theme:warning"],
  "material": { "preset": "matte", "opacity": 1 },
  "nodes": [
    {
      "kind": "group",
      "id": "lighthouse-root",
      "parentId": null,
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    {
      "kind": "mesh",
      "id": "tower",
      "parentId": "lighthouse-root",
      "position": [0, 2.1, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "cylinder",
      "size": { "width": 1.7, "height": 4.2, "depth": 1.7 }
    },
    {
      "kind": "mesh",
      "id": "balcony",
      "parentId": "lighthouse-root",
      "position": [0, 4.25, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 2,
      "geometry": "torus",
      "size": { "width": 2.2, "height": 0.25, "depth": 2.2 }
    },
    {
      "kind": "mesh",
      "id": "lantern",
      "parentId": "lighthouse-root",
      "position": [0, 4.75, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 3,
      "geometry": "cylinder",
      "size": { "width": 1.2, "height": 0.9, "depth": 1.2 }
    },
    {
      "kind": "mesh",
      "id": "roof",
      "parentId": "lighthouse-root",
      "position": [0, 5.55, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 2,
      "geometry": "cone",
      "size": { "width": 1.6, "height": 0.8, "depth": 1.6 }
    }
  ],
  "lights": [
    {
      "id": "lantern-light",
      "kind": "point",
      "position": [0, 4.75, 0],
      "paletteIndex": 3,
      "intensity": 1.4,
      "range": 7
    }
  ],
  "motion": { "preset": "none", "speed": 0, "amplitude": 0 },
  "ground": { "contactShadow": { "strength": 0.65, "softness": 0.55 } }
}
```

### Metaphorical: a rainy thought in a jar

```json
{
  "version": 1,
  "jobId": "job-rainy-thought",
  "objectId": "object-rainy-thought",
  "name": "Rainy thought in a jar",
  "altText": "A blue cloud cluster hangs inside a clear jar while a short column of droplets falls below it.",
  "bounds": { "width": 4.2, "height": 5.6, "depth": 4.2 },
  "cameraHint": "three-quarter",
  "palette": ["#8cc8e8", "theme:canvas", "theme:accent"],
  "material": { "preset": "glass", "opacity": 0.62 },
  "nodes": [
    {
      "kind": "group",
      "id": "jar-root",
      "parentId": null,
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    {
      "kind": "mesh",
      "id": "jar",
      "parentId": "jar-root",
      "position": [0, 2.2, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 1,
      "geometry": "cylinder",
      "size": { "width": 3.7, "height": 4.4, "depth": 3.7 }
    },
    {
      "kind": "mesh",
      "id": "cloud-left",
      "parentId": "jar-root",
      "position": [-0.75, 3.1, 0.1],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "sphere",
      "size": { "width": 1.55, "height": 1.15, "depth": 1.3 }
    },
    {
      "kind": "mesh",
      "id": "cloud-center",
      "parentId": "jar-root",
      "position": [0, 3.35, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "sphere",
      "size": { "width": 1.9, "height": 1.35, "depth": 1.5 }
    },
    {
      "kind": "mesh",
      "id": "cloud-right",
      "parentId": "jar-root",
      "position": [0.8, 3.05, -0.1],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "sphere",
      "size": { "width": 1.45, "height": 1.05, "depth": 1.25 }
    },
    {
      "kind": "particles",
      "id": "rain",
      "parentId": "jar-root",
      "position": [0, 1.8, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 2,
      "preset": "motes",
      "count": 24,
      "size": 0.09,
      "spread": { "width": 1.7, "height": 2.3, "depth": 1.2 }
    }
  ],
  "lights": [],
  "motion": { "preset": "bob", "speed": 0.35, "amplitude": 0.12 },
  "ground": { "contactShadow": { "strength": 0.5, "softness": 0.75 } }
}
```

### Spatial: a red sphere balanced between two towers

```json
{
  "version": 1,
  "jobId": "job-sphere-towers",
  "objectId": "object-sphere-towers",
  "name": "Sphere between towers",
  "altText": "A glossy red sphere touches the upper inner edges of two tall muted towers.",
  "bounds": { "width": 7, "height": 6.2, "depth": 2.8 },
  "cameraHint": "front",
  "palette": ["theme:muted", "theme:danger"],
  "material": { "preset": "glossy", "opacity": 1 },
  "nodes": [
    {
      "kind": "group",
      "id": "balance-root",
      "parentId": null,
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    {
      "kind": "mesh",
      "id": "left-tower",
      "parentId": "balance-root",
      "position": [-2.15, 2.5, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "box",
      "size": { "width": 2.2, "height": 5, "depth": 2.2 }
    },
    {
      "kind": "mesh",
      "id": "right-tower",
      "parentId": "balance-root",
      "position": [2.15, 2.5, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "box",
      "size": { "width": 2.2, "height": 5, "depth": 2.2 }
    },
    {
      "kind": "mesh",
      "id": "red-sphere",
      "parentId": "balance-root",
      "position": [0, 5, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 1,
      "geometry": "sphere",
      "size": { "width": 2.2, "height": 2.2, "depth": 2.2 }
    }
  ],
  "lights": [],
  "motion": { "preset": "breathe", "speed": 0.22, "amplitude": 0.05 },
  "ground": { "contactShadow": { "strength": 0.8, "softness": 0.35 } }
}
```

### Abstract: two ideas almost meeting

```json
{
  "version": 1,
  "jobId": "job-almost-meeting",
  "objectId": "object-almost-meeting",
  "name": "Ideas almost meeting",
  "altText": "A warm cluster and a cool cluster reach toward a narrow glowing gap without touching.",
  "bounds": { "width": 7.8, "height": 4.8, "depth": 3.8 },
  "cameraHint": "three-quarter",
  "palette": ["#f2a65a", "#70a9d8", "theme:accent"],
  "material": { "preset": "emissive", "opacity": 0.92 },
  "nodes": [
    {
      "kind": "group",
      "id": "ideas-root",
      "parentId": null,
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    {
      "kind": "mesh",
      "id": "warm-core",
      "parentId": "ideas-root",
      "position": [-2.25, 2.1, 0.2],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "sphere",
      "size": { "width": 2.1, "height": 2.1, "depth": 2.1 }
    },
    {
      "kind": "mesh",
      "id": "warm-reach",
      "parentId": "ideas-root",
      "position": [-1.15, 2.05, 0.1],
      "rotation": [0, 0, -1.15],
      "scale": [1, 1, 1],
      "paletteIndex": 0,
      "geometry": "capsule",
      "size": { "width": 0.55, "height": 1.7, "depth": 0.55 }
    },
    {
      "kind": "mesh",
      "id": "cool-core",
      "parentId": "ideas-root",
      "position": [2.25, 2.1, -0.2],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 1,
      "geometry": "sphere",
      "size": { "width": 2.1, "height": 2.1, "depth": 2.1 }
    },
    {
      "kind": "mesh",
      "id": "cool-reach",
      "parentId": "ideas-root",
      "position": [1.15, 2.05, -0.1],
      "rotation": [0, 0, 1.15],
      "scale": [1, 1, 1],
      "paletteIndex": 1,
      "geometry": "capsule",
      "size": { "width": 0.55, "height": 1.7, "depth": 0.55 }
    },
    {
      "kind": "mesh",
      "id": "charged-gap",
      "parentId": "ideas-root",
      "position": [0, 2.05, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "paletteIndex": 2,
      "geometry": "sphere",
      "size": { "width": 0.24, "height": 0.24, "depth": 0.24 }
    }
  ],
  "lights": [
    {
      "id": "gap-light",
      "kind": "point",
      "position": [0, 2.05, 0],
      "paletteIndex": 2,
      "intensity": 0.9,
      "range": 4
    }
  ],
  "motion": { "preset": "breathe", "speed": 0.3, "amplitude": 0.08 },
  "ground": { "contactShadow": { "strength": 0.45, "softness": 0.8 } }
}
```
