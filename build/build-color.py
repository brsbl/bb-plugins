"""endless-color — the foil sleeve, in light mode.

Derived from `endless` rather than duplicated: it reads the generated endless
stylesheet and appends one light-mode override block. Dark mode is inherited
unchanged, so the two themes stay a family and any future endless edit flows
through automatically.

Every colour is sampled from the three colour references:
  IMG_6521  stacked foam blocks  — maroon #32221F, olive #2D311C,
            terracotta #A27369, orange #B17963, gold #C2A260, sky #719DB2
  IMG_6523  welder               — mustard #796220, glove olive #838038,
            cool workshop white #E6F3FB
  IMG_6519  cover + foil         — paper #E2E2E3, foil violet #6B5C84
Each is darkened only as far as the 4.5:1 floor demands; hues are untouched.
"""
from build import GRAIN_DARK
from pathlib import Path
import sys

OVERRIDE = """

/* ===========================================================================
 * ENDLESS COLOR — the foil sleeve and the painted stair, in light mode.
 *
 * Base: the foil cover (IMG_6519). Its paper measures #E2E2E2 — exactly
 * neutral — and its foil holds a median saturation of just 11.8%, so the field
 * stays achromatic silver and colour appears only as a rare pop.
 *
 * Accents: the painted stair stack, held at the HIGHEST chroma each floor
 * allows rather than the lowest — an earlier pass minimised chroma and the
 * result read as muddy. Same sampled hues, cleaner voices:
 *   light blue #75A1B4 -> #2e6f95   primary / files / selection
 *   mustard    #C8A55B -> #8a660a   warning
 *   orange     #AA5C41 -> #a8481f   attention
 *   red        #6E2F24 -> #9c3118   destructive
 *   olive      #333820 -> #5a6813   success
 * plus the foil\'s own violet (#5d4f93) for merged.
 *
 * Trim: the speaker cabinet — white boxes held together by exposed plywood
 * rails. Borders here are a mustard-khaki ink instead of neutral black, at the
 * same alphas the family uses, so the chrome reads as warm rail against
 * silver panel. It is trim, not another accent: too faint to register as
 * colour until surfaces sit side by side.
 *
 * SELECTOR: `:root:not(.dark)`, not `:root, .light`. This block loads AFTER
 * the endless palette, and `:root` has the same specificity as `.dark` — so a
 * plain `:root` here BEATS the dark block and leaks light values into dark
 * mode. bb never sets a `.light` class either (light is the ABSENCE of
 * `.dark`), so `.light` alone matches nothing. `:root:not(.dark)` is the only
 * form that is both light-only and immune to the ordering. Caught by auditing
 * dark mode after the first attempt, which regressed 3 pairs.
 * ======================================================================== */
:root:not(.dark) {
  --canvas: #f1f2f4;              /* foil silver — measured base #bbbdbb is neutral; lifted, a breath cool */

  /* THE FOIL. The sleeve's base measures neutral silver (#bbbdbb, 1% sat)
   * with violet / periwinkle / cyan-blue streaks — so the surfaces are cool
   * silver (never warm, never cream), the sheen carries those exact streak
   * hues, and the stair colours are the pops: blue leads, mustard / orange /
   * red punctuate. Every value is luminance-matched, so all contrast ratios
   * carry over. */
  --sidebar: #e3e5e9;
  --secondary: #dfe2e6;
  --secondary-foreground: #0a0a0a;
  --accent: #d5d9df;
  --accent-foreground: #0a0a0a;
  --muted: #dde0e5;
  --sidebar-accent: #d5d9df;
  --sidebar-accent-foreground: #0a0a0a;
  --card: #fdfdff;
  --popover: #fdfdff;
  --surface-recessed: rgba(40, 44, 60, 0.05);
  --surface-recessed-solid: #dfe2e6;
  --surface-recessed-soft-solid: #e9ebee;
  --surface-scrim: rgba(241, 242, 244, 0.92);
  --state-hover: rgba(40, 44, 60, 0.07);     /* quiet, cool */
  --state-active: rgba(40, 44, 60, 0.14);

  /* GLOW, NOT REGISTER. The base family stacks planes like mounted prints;
   * the colour variant lets them shimmer instead — soft shadows tinted with
   * the foil's violet and the stair blue, so raised surfaces carry a faint
   * iridescent halo. */
  --shadow-color: rgba(70, 80, 130, 0.20);
  --shadow-2xs: 0px 1px 2px 0px rgba(70, 80, 130, 0.14);
  --shadow-xs: 0px 1px 2px 0px rgba(70, 80, 130, 0.14);
  --shadow-sm: 0 0 0 1px rgba(90, 80, 48, 0.10), 0px 2px 8px -1px rgba(70, 80, 130, 0.22), 0px 1px 3px 0px rgba(46, 111, 149, 0.10);
  --shadow: 0 0 0 1px rgba(90, 80, 48, 0.10), 0px 2px 8px -1px rgba(70, 80, 130, 0.22), 0px 1px 3px 0px rgba(46, 111, 149, 0.10);
  --shadow-md: 0 0 0 1px rgba(90, 80, 48, 0.11), 0px 4px 14px -2px rgba(70, 80, 130, 0.26), 0px 2px 6px -1px rgba(46, 111, 149, 0.12);
  --shadow-lg: 0 0 0 1px rgba(90, 80, 48, 0.12), 0px 8px 24px -4px rgba(70, 80, 130, 0.30), 0px 3px 10px -2px rgba(46, 111, 149, 0.14);
  --shadow-xl: 0 0 0 1px rgba(90, 80, 48, 0.12), 0px 12px 34px -6px rgba(70, 80, 130, 0.34), 0px 4px 12px -2px rgba(46, 111, 149, 0.16);


  /* THE SHEEN. Color Light's sidebar carries the holographic sleeve (sampled
   * 2000px scan: gold flare #e4cea3 / #f1ccac at the left edge, periwinkle slate
   * #8e97aa, sky #a4cedd, light blue #79add6 at the right; field #eaeaea).
   * Stops run left→right in the sleeve's own order: a soft
   * diagonal drift through the sleeve's violet, blue, gold and cyan, layered
   * UNDER the family's noise by riding the same --sidebar-noise hook the
   * structural rule already paints (a custom property can hold a multi-image
   * list). Stops run 9–17% alpha with a white catch-light at 38% and a second
   * oblique flash at 28deg — the foil turned toward the light. Worst text case on the tinted
   * surface measures 5.72:1, comfortably above the 4.5:1 floor. Light-only by
   * this block's own scoping — no other theme, and not dark, sees it. */
  --sidebar-noise-size: 100% 100%, 100% 100%, 180px 180px;
  --sidebar-noise:
    linear-gradient(163deg,
      rgba(228, 206, 163, 0.16) 0%,
      rgba(142, 151, 170, 0.12) 22%,
      rgba(255, 255, 255, 0.17) 38%,
      rgba(164, 206, 221, 0.16) 56%,
      rgba(255, 255, 255, 0) 70%,
      rgba(121, 173, 214, 0.14) 100%),
    linear-gradient(28deg,
      rgba(255, 255, 255, 0) 42%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0) 58%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.05'/%3E%3C/svg%3E");

  /* THE POP. Light blue leads — the stair\'s blue and the foil\'s dominant
   * hue agree on it — and it carries every interactive role. */
  --primary: #2e6f95;             /* 4.86:1 · white text 5.49:1 */
  --primary-foreground: #ffffff;
  --ring: #2e6f95;
  --timeline-accent: #2e6f95;
  --file-accent: #2e6f95;
  --surface-selected: rgba(121, 173, 214, 0.30);       /* chalk blue, sampled #6998a8 */
  --surface-selected-border: rgba(121, 173, 214, 0.75);
  --selection-color-default: rgba(121, 173, 214, 0.42);
  /* bb derives the 'open in split' row colour with color-mix(in oklch …);
   * on these warm low-chroma surfaces that mix serialises a powerless hue,
   * which Chrome renders as hue 0 — a pink row. Pin it to a soft chalk-blue
   * wash instead: a lighter member of the same blue selection system. */
  --bb-sidebar-open-in-split-background: rgba(105, 152, 168, 0.14);
  --sidebar-ring: #2e6f95;
  --sidebar-search-match: #d9e5ec;
  --sidebar-search-match-border: #2e6f95;

  /* Status — the rest of the stair */
  --warning: #8a660a;             /* mustard · 4.66:1 */
  --warning-text: #8a660a;
  --attention: #a8481f;           /* orange · 5.15:1 */
  --destructive: #9c3118;         /* red · 6.49:1, white text 7.33:1 */
  --destructive-foreground: #ffffff;
  --destructive-text: #872a14;
  --success: #5a6813;             /* olive · 5.43:1 */
  --success-foreground: #5a6813;
  --pr-merged: #55608c;           /* the foil\'s violet · 6.19:1 */
  --diff-added: #5a6813;
  --diff-removed: #9c3118;

  /* THE RAIL. Plywood-edge trim: mustard-khaki ink at the family\'s alphas. */
  --border: rgba(90, 80, 48, 0.30);
  --border-hairline: rgba(90, 80, 48, 0.12);
  --border-seam: rgba(90, 80, 48, 0.18);
  --border-seam-vertical: rgba(90, 80, 48, 0.18);
  --input: rgba(90, 80, 48, 0.55);
  --sidebar-border: rgba(90, 80, 48, 0.26);

  /* THE FOIL STICKER. Mention pills carry the sleeve's iridescence as a
   * the foil actually behaves in the reference: a mostly-silver surface with
   * chromatic streaks at the edges — violet-blue flaring in from one end,
   * gold-pink from the other, quiet in the middle. Text on the pill stays #0a0a0a; the
   * deepest stop composited over paper keeps the surface above 72%
   * lightness, so the ink clears the same floor the grey pill did. */
  --pill-surface: linear-gradient(105deg,
    rgba(150, 90, 210, 0.16) 0%,  rgba(60, 140, 220, 0.12) 12%,
    rgba(50, 195, 215, 0.07) 24%, rgba(120, 120, 120, 0.05) 40%,
    rgba(120, 120, 120, 0.05) 62%, rgba(235, 180, 45, 0.09) 78%,
    rgba(240, 115, 150, 0.13) 92%, rgba(150, 90, 210, 0.10) 100%);
  --pill-surface-selected: linear-gradient(105deg,
    rgba(150, 90, 210, 0.26) 0%,  rgba(60, 140, 220, 0.20) 12%,
    rgba(50, 195, 215, 0.12) 24%, rgba(120, 120, 120, 0.09) 40%,
    rgba(120, 120, 120, 0.09) 62%, rgba(235, 180, 45, 0.15) 78%,
    rgba(240, 115, 150, 0.22) 92%, rgba(150, 90, 210, 0.17) 100%);
  --pill-surface-selected-border: rgba(93, 79, 147, 0.50);
  --pill-shadow: 0 1px 3px 0 rgba(70, 80, 130, 0.25);
}
"""


DARK_OVERRIDE = """
/* FIELD — neutral black. Both dark references (the blacklight poster scan and
 * the gatefold) sample #111111 with no cast; the colour lives only in the orange
 * tape and the blue-lit gloves. Surfaces keep the solved luminance ladder and
 * drop the violet tint. */

/* ===========================================================================
 * ENDLESS COLOR, DARK — blacklight.
 *
 * The reference is the neon frame: a figure in black against true black, cut
 * by neon-orange piping and blue-lit hands, ENDLESS in white above. Measured:
 * the field is #010100 and the two accents sit at hue 16 (orange) and hue 208
 * (blue). So this dark mode drops the field to near-true black, keeps the
 * text silver, and hands the two accent roles to the neon pair — orange leads
 * (primary, ring, selection, attention), blue answers (files, timeline).
 * Status glows to match: this is the one mode in the family where saturation
 * is the point.
 *
 * TEMPERATURE CARRIES THE IDENTITY. Both dark modes share one luminance
 * ladder (the halation band is physiological, not stylistic), so what
 * separates them is temperature: the print's blacks are exact neutral;
 * blacklight's carry a UV-violet whisper — the colour of the lamp itself.
 * ACHROMATIC no more, but deliberately: The surfaces and text tiers
 * used to carry a +2..+10 blue cast, which fought the neon orange and made the
 * two dark modes read as different systems. They are exact greys now at the
 * same luminance; all the colour comes from the sampled accents.
 *
 * Loads after everything, so this .dark block wins over the inherited endless
 * dark by order at equal specificity — the same cascade rule the family
 * header documents, used deliberately this time.
 * ======================================================================== */
.dark {
  --canvas: #121212;              /* blacklight black — a UV-violet whisper, same luminance */
  --sidebar: #070707;             /* the video frame — true black, tinted UV */
  --card: #191919;
  --popover: #212121;
  --secondary: #191919;
  --accent: #191919;
  --muted: #161616;
  --surface-recessed-solid: #191919;
  --surface-recessed-soft-solid: #161616;
  --surface-scrim: rgba(18, 18, 18, 0.92);   /* matches the neutral canvas — the old value still carried the UV tint */

  --foreground: #c9c9c9;          /* 11.49:1 — inside the family band; #e8e8e8 haloed */
  --muted-foreground: #a6a6a6;    /* 7.82:1 */
  --readback-foreground: #969696; /* 6.43:1 */
  --subtle-foreground: #888888;   /* 5.28:1 canvas · 4.54:1 on the floating step */
  --sidebar-foreground: #c5c5c5;  /* 11.81:1 — in band on the deeper field */
  --sidebar-accent: #121212;
  --sidebar-accent-foreground: #c5c5c5;

  /* ORANGE LEADS — sampled hue 16, lit to neon */
  --primary: #ff6a1f;             /* 7.01:1 · black text 6.63:1 */
  --primary-foreground: #111111;
  --ring: #2fb4ff;               /* focus shares the selection's blue; orange is the seam, not a ring */
  --sidebar-ring: #2fb4ff;
  --attention: #ff6a1f;
  --surface-selected: rgba(47, 180, 255, 0.20);      /* the blue light — lit hands */
  --surface-selected-border: rgba(47, 180, 255, 0.85);
  --selection-color-default: rgba(47, 180, 255, 0.30);
  --bb-sidebar-open-in-split-background: rgba(47, 180, 255, 0.10);  /* see light note */
  --sidebar-search-match: #241a14;
  --sidebar-search-match-border: #ff6a1f;

  /* BLUE ANSWERS — sampled hue 208, lit */
  --timeline-accent: #5fa8d8;   /* the glove under UV (#357098 sampled), lifted to clear 4.5:1 */     /* 7.63:1 */
  --file-accent: #5fa8d8;

  /* Status under blacklight */
  --destructive: #ff5240;         /* 6.23:1 fill */
  --destructive-foreground: #111111;
  --destructive-text: #ff9484;    /* 9.91:1 */
  --success: #38f56e;             /* 13.78:1 */
  --success-foreground: #38f56e;
  --warning: #ffab33;             /* 10.60:1 */
  --warning-text: #ffab33;
  --pr-merged: #a97aff;           /* 6.59:1 */
  --diff-added: #38f56e;
  --diff-removed: #ff9484;

  --border: rgba(255, 255, 255, 0.09);
  --border-hairline: rgba(255, 255, 255, 0.04);
  /* Seam tokens border CONTENT (message bubbles, cards) as well as panel
   * edges, so they stay neutral — orange there reads as an alert ring, not
   * piping. The piping lives where only chrome is: the sidebar edge, the lit
   * seam, and the composer's input line. */
  --border-seam: rgba(255, 255, 255, 0.10);
  --border-seam-vertical: rgba(255, 255, 255, 0.10);
  --input: rgba(255, 255, 255, 0.14);               /* neutral edge — the orange belongs to the seam and the primary, not every field */
  --sidebar-border: rgba(255, 255, 255, 0.10);   /* neutral seam — orange stays on primary and the active row */
  --state-hover: rgba(255, 106, 31, 0.07);          /* hover = lit */
  --state-active: rgba(255, 106, 31, 0.14);

  /* NEON GLOW. Raised surfaces under blacklight glow at the edges — an
   * orange halo with a blue undertone, instead of the base family's lit-rim
   * register shadows. Raised surfaces carry neutral black elevation with a
   * faint white rim — no coloured glow; orange and blue stay on the things that
   * are lit, not on the air around them. */
  /* Halved from the first pass — the halo was reading as an alert, not a
   * glow. Ring stays legible; the bloom is a suggestion. */
  --shadow-color: rgba(0, 0, 0, 0.75);
  --shadow-2xs: 0px 1px 0px 0px rgba(0, 0, 0, 0.55);
  --shadow-xs: 0px 1px 0px 0px rgba(0, 0, 0, 0.55);
  --shadow-sm: 0 0 0 1px rgba(255, 255, 255, 0.06), 0px 1px 3px -1px rgba(0, 0, 0, 0.70);
  --shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0px 1px 3px -1px rgba(0, 0, 0, 0.70);
  --shadow-md: 0 0 0 1px rgba(255, 255, 255, 0.07), 0px 3px 10px -2px rgba(0, 0, 0, 0.75);
  --shadow-lg: 0 0 0 1px rgba(255, 255, 255, 0.08), 0px 6px 20px -4px rgba(0, 0, 0, 0.80);
  --shadow-xl: 0 0 0 1px rgba(255, 255, 255, 0.09), 0px 10px 30px -6px rgba(0, 0, 0, 0.85);

  --pill-surface: linear-gradient(to bottom, rgba(255, 106, 31, 0.08), rgba(255, 106, 31, 0.16));
  --pill-surface-selected: linear-gradient(to bottom, rgba(255, 106, 31, 0.22), rgba(255, 106, 31, 0.34));
  --pill-surface-selected-border: rgba(255, 106, 31, 0.50);
}
"""

SEAM_RULE = """
/* Blacklight sidebar: the same starfield as the mono theme, at less than half
 * the speck strength — on true black the specks read brighter than they do on
 * #1d1d1d, so the density stays and the intensity comes down. */
.dark .fixed.bg-sidebar { --sidebar-noise: __STARS_SOFT__; }


/* bb sets --bb-sidebar-open-in-split-background ON the row element via
 * color-mix(in oklch …); with warm low-chroma surfaces the mix serialises a
 * powerless hue that Chrome renders as hue 0 — a pink row. A root-level
 * token cannot beat an element-level declaration, so this overrides at the
 * element's own selector (loads later; :root:not(.dark) also out-specifies). */
:root:not(.dark) .bb-sidebar-open-in-split-row {
  --bb-sidebar-open-in-split-background: rgba(105, 152, 168, 0.14);
}
.dark .bb-sidebar-open-in-split-row {
  --bb-sidebar-open-in-split-background: rgba(47, 180, 255, 0.10);
}

/* Blacklight text renders with greyscale antialiasing. bb's default subpixel
 * smoothing draws RGB fringes around light glyphs, and on a near-true-black
 * field those fringes read as a glow around every character. Greyscale AA is
 * the standard fix for light-on-dark halation. Scoped to dark only; light
 * keeps subpixel, where fringes are invisible and text is crisper. */
.dark body,
.dark .fixed.bg-sidebar {
  /* the base theme re-enables subpixel in the sidebar; blacklight must not */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* The blacklight sidebar. The base theme pins its own sidebar system on
 * `.dark .fixed.bg-sidebar` (values solved for the silver print), which
 * silently overrides the variant's tokens — the sidebar was rendering the
 * WRONG THEME. This block loads later at equal specificity, so the frame
 * actually wears the blacklight. --surface-recessed-soft-solid is pinned to
 * the same black because bb paints it behind row lists; leaving it lighter
 * would bring back the banding the base block documents. */
.dark .fixed.bg-sidebar {
  --sidebar: #070707;
  --surface-recessed-soft-solid: #070707;
  --sidebar-foreground: #c5c5c5;            /* 11.81:1 — in band */
  --foreground: #c5c5c5;
  --muted-foreground: #a4a4a4;
  --readback-foreground: #949494;
  --subtle-foreground: #848484;             /* 5.42:1 */

  --border: rgba(255, 255, 255, 0.05);
  --border-hairline: rgba(255, 255, 255, 0.025);
  --sidebar-border: rgba(255, 255, 255, 0.10);   /* neutral seam — orange stays on primary and the active row */

  --state-hover: rgba(255, 106, 31, 0.07);  /* hover = lit, like the content */
  --state-active: rgba(255, 106, 31, 0.13);
  --sidebar-accent: #121212;
  --sidebar-accent-foreground: #c5c5c5;
  --surface-selected: rgba(47, 180, 255, 0.18);   /* the blue light */
  --surface-selected-border: rgba(47, 180, 255, 0.85);
}

/* The lit seam — the piping that defines the blacklight frame. */
.dark .fixed.bg-sidebar {
  box-shadow: none;
}
"""

default_base = Path(__file__).resolve().parent.parent / "themes" / "endless.css"
base = Path(sys.argv[2] if len(sys.argv) > 2 else default_base).read_text(encoding="utf-8")
out = base + OVERRIDE + DARK_OVERRIDE + SEAM_RULE.replace("__STARS_SOFT__", GRAIN_DARK.replace("OP", "0.09"))
# guard: a duplicate declaration inside one block silently shadows the other
# (the silver-header bug); fail the build instead of shipping it.
import re as _re
from collections import Counter as _C
for _sel, _body in _re.findall(r'(:root:not\(\.dark\)|^\.dark)\s*\{(.*?)\n\}', OVERRIDE + DARK_OVERRIDE, _re.S | _re.M):
    _d = {k: v for k, v in _C(_re.findall(r'--([a-z-]+):', _body)).items() if v > 1}
    assert not _d, f'duplicate declarations in {_sel}: {_d}'
Path(sys.argv[1]).write_text(out, encoding="utf-8")
print(f"  wrote {sys.argv[1]}  {len(base)+len(OVERRIDE)} bytes")
