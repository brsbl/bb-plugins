# Procedural brush evaluation

The reusable brush is compared with Protofetti's previous geometric output
using three stable prompts. Each pair uses the same prompt, front camera,
monochrome palette, still motion, zero contact shadow, renderer, viewport, and
theme. Only the drawing implementation changes.

| Input | Comparison |
| --- | --- |
| `a tired traveler sketching in a chair` | [Before and after](brush-evaluation/seated-traveler.png) |
| `a rainy thought in a jar` | [Before and after](brush-evaluation/rain-jar.png) |
| `a playful pocket radio` | [Before and after](brush-evaluation/pocket-radio.png) |

The comparison checks stroke character, graphite texture, pressure and width
variation, searching-line layering, grayscale and tint hierarchy, and overall
illustration quality. The after fixtures run through the same material
validation, one-time monochrome normalization, geometry portability, framing,
and serialization function as agent-authored source. They must serialize as
`SceneObjectV2`, stay within the existing 600-vertex evaluator limit, and
render without console or layout errors through the production
`SceneRenderer`. A separate compile-path regression executes `BRUSH` inside
the bounded source evaluator.

The resulting drawings use a dark tapered primary line, lighter displaced
searching passes, seeded width fluctuation, intermittent graphite gaps, and
light construction strokes. They are recognizably prompt-specific while
remaining deliberately loose. The current limit is that texture is geometric
and deterministic rather than sampled from a bitmap paper or graphite asset;
this keeps generated scenes small, serializable, tintable, and safe to run in
the existing bounded source evaluator.

The repository-local comparison story is `Protofetti / Procedural brush /
Reference comparison`. It renders these fixtures through the production
renderer when the prototype harness is available; the committed screenshots
are the stable review evidence and do not require that optional harness.
