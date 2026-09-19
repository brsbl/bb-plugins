# Protofetti sketch interpretation examples

Use these as composition precedents, not templates. A good result keeps the
prompt's central relationship legible with a small number of expressive paths.

## Literal

### Tiny lighthouse

- Draw one slightly leaning outer tower contour, a loose roof triangle, two
  imperfect lantern bands, and a pale gesture line for the beam.
- Let overlapping roof and tower lines show the construction instead of
  correcting them into perfect symmetry.

### Cactus in a teacup

- Use one closed cup contour, an open handle loop, and three branching cactus
  gestures with lighter cross-hatching near the soil.
- Keep the handle and one cactus arm intentionally off-kilter.

## Metaphorical

### A rainy thought in a jar

- Outline the jar with two searching side strokes and an imperfect mouth.
- Draw the cloud as one lumpy closed contour, then add sparse tapered rain
  marks inside so containment remains obvious.

### Hope growing through concrete

- Use two heavy, broken slab contours around a thin rising stem.
- Preserve the split as negative space; two light leaf gestures are enough.

## Spatial

### A sphere balanced between two towers

- Sketch the towers with uneven vertical pressure and the sphere with two
  overlapping circular passes.
- Make the contact points dark and leave the rest of the sphere lighter.

### A key floating inside a transparent cube

- Suggest the cube with pale incomplete construction lines.
- Draw the key darker using a loop, shaft, and two tooth gestures; overlap its
  outline across the cube lines to keep it in front.

## Abstract

### Two ideas almost meeting

- Use two distinct clusters of three strokes leaning toward a clean central
  gap.
- Darken only the closest endpoints; do not fill the gap with a symbol.

### Organized chaos

- Repeat one loose contour rhythm at varied scales, then connect only two or
  three marks with a lighter construction stroke.
- Keep the overall silhouette calm even when individual lines wander.

## Complete brush source

The `source` value is this JavaScript function body as a string. `BRUSH` and
`THREE` are already in scope.

```js
const root = new THREE.Group();
const pencil = BRUSH.create({
  seed: 73,
  texture: "pencil",
  shape: "tapered",
  width: 0.14,
  opacity: 0.9,
  pressureVariation: 0.34,
  jitter: 0.55,
  layering: 3,
  color: 0x303030,
  colorBehavior: "graphite",
  smoothing: 0.3,
});

root.add(pencil.stroke([
  [-2.5, -2.6], [-2.8, 0.8], [-2.2, 3.2], [0, 3.6],
  [2.1, 3.1], [2.8, 0.7], [2.4, -2.6],
], { closed: true, pressure: [0.2, 0.75, 0.92, 0.72, 1, 0.68, 0.18] }));
root.add(pencil.stroke([[-2.6, 1.6], [-1.2, 1.3], [0.2, 1.55], [1.5, 1.25], [2.5, 1.6]], { width: 0.1 }));
root.add(pencil.stroke([[-1.8, 2], [-1.1, 2.7], [0, 2.45], [0.9, 2.8], [1.8, 2.05]], { closed: true }));
root.add(pencil.stroke([[-0.9, 1.8], [-0.7, 0.7]], { width: 0.08, opacity: 0.66 }));
root.add(pencil.stroke([[0, 1.9], [0.1, 0.55]], { width: 0.08, opacity: 0.66 }));
root.add(pencil.stroke([[0.9, 1.8], [0.8, 0.75]], { width: 0.08, opacity: 0.66 }));

return {
  root,
  name: "Rainy thought in a jar",
  altText: "A loose graphite cloud rains inside an imperfect glass jar outline.",
  camera: "front",
  movement: "still",
  shadow: "none",
};
```
