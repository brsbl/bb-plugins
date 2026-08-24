from pathlib import Path
import sys

GRAIN = ("url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E"
         "%3Cfilter id='g'%3E"
         "%3CfeTurbulence type='fractalNoise' baseFrequency='0.012 0.65' numOctaves='2' stitchTiles='stitch'/%3E"
         "%3CfeColorMatrix type='saturate' values='0'/%3E"
         "%3C/filter%3E"
         "%3Crect width='180' height='180' filter='url(%23g)' opacity='OP'/%3E%3C/svg%3E\")")

# Light sidebar: the cover's paper, not the amp's brushing. Isotropic mottle —
# a fine grain plus a low-frequency blotch (three octaves) — sampled against the
# sleeve's own field (mean 225, σ 2.8 levels, no directionality).
GRAIN_LIGHT = ("url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E"
         "%3Cfilter id='g'%3E"
         "%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' stitchTiles='stitch'/%3E"
         "%3CfeColorMatrix type='saturate' values='0'/%3E"
         "%3C/filter%3E"
         "%3Crect width='180' height='180' filter='url(%23g)' opacity='OP'/%3E%3C/svg%3E\")")

# Dark sidebar: the inverted cover's field — dense, faded, isotropic grain, the
# same mottle as the light side but read against black. Measured on the inverted
# cover scan: mean 29.7, sigma 2.5, no directionality.
#
# It is painted as a HIGHLIGHT rect plus a SHADOW rect from the same turbulence,
# so the grain is zero-mean: a white-only rect over near-black lifted the
# sidebar from level 29 to 53 before it was visible at all. Two rects hold the
# surface where the ladder put it and spend the opacity on texture instead.
# OP is each rect's alpha.
_TURB = ("%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3'"
         " seed='3' stitchTiles='stitch'/%3E")
GRAIN_DARK = ("url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E"
         "%3Cfilter id='hi' x='0' y='0' width='100%25' height='100%25'%3E" + _TURB +
         "%3CfeColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .4 .4 .4 0 -.6'/%3E%3C/filter%3E"
         "%3Cfilter id='lo' x='0' y='0' width='100%25' height='100%25'%3E" + _TURB +
         "%3CfeColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.4 -.4 -.4 0 .6'/%3E%3C/filter%3E"
         "%3Crect width='180' height='180' filter='url(%23hi)' opacity='OP'/%3E"
         "%3Crect width='180' height='180' filter='url(%23lo)' opacity='OP'/%3E%3C/svg%3E\")")

LOCAL_FONTS = """/* Type is system-native (Helvetica Neue / Courier); nothing to embed. */"""

def inline_fonts():
    return LOCAL_FONTS

def build(dark_op, light_op, fonts):
    css = Path(__file__).with_name("theme-template.css").read_text(encoding="utf-8")
    css = css.replace("__GRAIN_DARK__",  GRAIN_DARK.replace("OP", str(dark_op)))
    css = css.replace("__GRAIN_LIGHT__", GRAIN_LIGHT.replace("OP", str(light_op)))
    return css.replace("__FONTS__", fonts)

if __name__ == "__main__":
    dark_op, light_op, target, mode = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3], sys.argv[4]
    fonts = LOCAL_FONTS if mode == "local" else inline_fonts()
    out = build(dark_op, light_op, fonts)
    Path(target).write_text(out, encoding="utf-8")
    print(f"wrote {target}  {len(out)} bytes  dark_op={dark_op} light_op={light_op}")
