# SceneSeed Kit interpretation examples

Use these as composition precedents, not templates to copy part for part. A
good result keeps the prompt's central relationship legible after it is reduced
to a small set of primitives.

## Literal

### Tiny lighthouse

- **Thesis:** a narrow tower with a pale lantern cap.
- **Silhouette:** one cylinder, a contrasting balcony torus, a smaller lantern
  cylinder, and a cone roof.
- **Depth:** stagger the lantern or a small beam slightly toward the viewer.
- **Restraint:** windows and masonry are unnecessary if they weaken the outline.

### Cactus in a teacup

- **Thesis:** one rounded cactus emerging from an unmistakable handled cup.
- **Silhouette:** a low cylinder cup, torus handle, tall capsule cactus, and two
  short capsule arms.
- **Contrast:** use a light glossy cup against a dark matte plant.

## Metaphorical

### A rainy thought in a jar

- **Thesis:** a cloud trapped inside a clear vessel, raining into its own base.
- **Silhouette:** a glass cylinder around overlapping spheres and one narrow
  particle column.
- **Depth:** offset the cloud lobes on the z axis so the cluster feels volumetric.
- **Motion:** one restrained `bob` can make the thought feel alive.

### Hope growing through concrete

- **Thesis:** one delicate shoot splitting a heavy slab.
- **Silhouette:** two separated low boxes, a thin cylinder stem, and two small
  rotated capsules or flattened spheres as leaves.
- **Contrast:** make the shoot the lightest value against dark concrete.

## Spatial

### A sphere balanced between two towers

- **Thesis:** the precarious bridge-like relationship matters more than detail.
- **Silhouette:** two separated towers with one sphere touching both upper edges.
- **Camera:** use `front` or `three-quarter` so both contact points remain clear.

### A key floating inside a transparent cube

- **Thesis:** containment, not a key beside a box.
- **Silhouette:** a glass box enclosing a torus ring, narrow cylinder shaft, and
  two small box teeth.
- **Depth:** offset and rotate the key within the enclosure.

## Abstract

### Two ideas almost meeting

- **Thesis:** two forms lean toward one another across a charged gap.
- **Silhouette:** contrasting sphere clusters with narrow stems or beams that
  stop just short of contact.
- **Restraint:** preserve the negative space; filling it destroys the idea.

### Organized chaos

- **Thesis:** a calm outer order contains varied internal rhythm.
- **Silhouette:** a torus or box frame surrounding differently sized forms at
  staggered depths.
- **Motion:** one slow `orbit` can reinforce the system.

## Complete SceneSeed Kit program

The plugin injects the current job and object identifiers, recenters and
grounds the parts, fits the result into the stage, and creates the grayscale
palette and bounds.

```json
{
  "program": {
    "version": 1,
    "name": "Tiny lighthouse",
    "altText": "A dark narrow lighthouse with a pale lantern, black balcony ring, and pointed roof.",
    "camera": "three-quarter",
    "material": "matte",
    "movement": "still",
    "shadow": "crisp",
    "parts": [
      {
        "kind": "shape",
        "id": "tower",
        "shape": "cylinder",
        "size": { "width": 1.7, "height": 4.2, "depth": 1.7 },
        "at": [0, 2.1, 0],
        "tone": "dark"
      },
      {
        "kind": "shape",
        "id": "balcony",
        "shape": "torus",
        "size": { "width": 2.2, "height": 0.25, "depth": 2.2 },
        "at": [0, 4.25, 0],
        "tone": "black"
      },
      {
        "kind": "shape",
        "id": "lantern",
        "shape": "cylinder",
        "size": { "width": 1.2, "height": 0.9, "depth": 1.2 },
        "at": [0, 4.75, 0],
        "tone": "white"
      },
      {
        "kind": "shape",
        "id": "roof",
        "shape": "cone",
        "size": { "width": 1.7, "height": 0.9, "depth": 1.7 },
        "at": [0, 5.65, 0],
        "tone": "black"
      }
    ],
    "lights": [
      {
        "id": "lantern-light",
        "at": [0, 4.75, 0],
        "tone": "white",
        "intensity": 1.3,
        "range": 7
      }
    ]
  }
}
```
