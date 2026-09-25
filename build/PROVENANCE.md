# Endless palette provenance

The theme family is generated from the source files in this directory. The
committed reference images are repository-only authoring inputs; the plugin's
`files` allowlist deliberately keeps them out of installed packages.

## Measured source colours

The target values below were recorded while sampling the source artwork. JPEG
encoding shifts several decoded pixels by one or two RGB levels, so the table
also records the nearest pixel in the committed image and its exact coordinate.

| Role | Source region | Authoring sample | Nearest committed pixel |
| --- | --- | --- | --- |
| Foil paper | `IMG_6519-cover-foil.jpeg`, upper paper field | `#E2E2E3` | `#E2E2E2` at `(1, 4)` |
| Foil violet | `IMG_6519-cover-foil.jpeg`, lower-right foil arc | `#6B5C84` | `#6C5C83` at `(763, 878)` |
| Maroon | `IMG_6521-stacked-blocks.jpeg`, top block | `#32221F` | `#31221F` at `(689, 32)` |
| Olive | `IMG_6521-stacked-blocks.jpeg`, second block | `#2D311C` | `#2D321C` at `(776, 168)` |
| Terracotta | `IMG_6521-stacked-blocks.jpeg`, red stair | `#A27369` | `#A2716A` at `(506, 451)` |
| Orange | `IMG_6521-stacked-blocks.jpeg`, orange stair | `#B17963` | `#B17864` at `(590, 633)` |
| Gold | `IMG_6521-stacked-blocks.jpeg`, yellow stair | `#C2A260` | `#C2A360` at `(562, 701)` |
| Sky | `IMG_6521-stacked-blocks.jpeg`, lower blue stair | `#719DB2` | `#709DB2` at `(283, 915)` |
| Mustard | `IMG_6523-welder.jpeg`, jacket chest | `#796220` | `#79621F` at `(486, 284)` |
| Glove olive | `IMG_6523-welder.jpeg`, right glove | `#838038` | `#838039` at `(618, 614)` |
| Workshop white | `IMG_6523-welder.jpeg`, upper wall | `#E6F3FB` | `#E6F3FB` at `(237, 0)` |

`build-color.py` documents how these samples map to the final semantic roles.
The generated accents preserve source hues while adjusting luminance to meet
the contrast floors recorded beside each token. Neutral ramps come from the
album cover, film still, and their printed step wedges.

## Rebuild

From the repository root:

```bash
python3 plugins/endless/build/build.py 0.13 0.18 plugins/endless/themes/endless.css local
python3 plugins/endless/build/build-color.py plugins/endless/themes/endless-color.css plugins/endless/themes/endless.css
```
