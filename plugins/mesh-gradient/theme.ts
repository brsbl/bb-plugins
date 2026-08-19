import { hslToHex, type MeshGradientSpec, type MeshPoint } from "./gradient.js";

/**
 * bb palettes derive every neutral surface from two anchors (--canvas/--ink)
 * plus an accent, so a gradient only has to supply a hue family and a few
 * semantic colors. Everything else follows from the host's theme.css.
 */

function dominant(spec: MeshGradientSpec): MeshPoint {
  // The widest-reaching point sets the palette's character.
  return spec.points.reduce((widest, point) =>
    point.radius > widest.radius ? point : widest,
  );
}

function secondary(spec: MeshGradientSpec, baseHue: number): MeshPoint {
  let furthest = spec.points[0];
  let bestDistance = -1;
  for (const point of spec.points) {
    const delta = Math.abs(point.hue - baseHue);
    const distance = Math.min(delta, 360 - delta);
    if (distance > bestDistance) {
      bestDistance = distance;
      furthest = point;
    }
  }
  return furthest;
}

export interface ThemeOptions {
  /** Human-facing palette name, used only in the file's comment header. */
  name: string;
}

export function toThemeCss(spec: MeshGradientSpec, options: ThemeOptions): string {
  const base = dominant(spec);
  const accent = secondary(spec, base.hue);
  const hue = Math.round(base.hue);
  const accentHue = Math.round(accent.hue);

  const lightCanvas = hslToHex(hue, 24, 97);
  const lightInk = hslToHex(hue, 32, 14);
  const lightPrimary = hslToHex(accentHue, 62, 42);
  const darkCanvas = hslToHex(hue, 26, 11);
  const darkInk = hslToHex(hue, 16, 90);
  const darkPrimary = hslToHex(accentHue, 62, 68);

  return `/* ${options.name} — generated from a mesh gradient (seed ${spec.seed}).
   Only the anchors, accent, and semantics are set; bb derives the rest. */
:root, .light {
  --canvas: ${lightCanvas};
  --ink: ${lightInk};
  --primary: ${lightPrimary};
  --primary-foreground: ${lightCanvas};
  --muted-foreground: color-mix(in oklch, var(--ink) 70%, var(--canvas));
  --subtle-foreground: color-mix(in oklch, var(--ink) 58%, var(--canvas));
  --readback-foreground: color-mix(in oklch, var(--ink) 64%, var(--canvas));
  --timeline-accent: ${lightPrimary};
  --file-accent: var(--timeline-accent);
  --destructive: #b3261e;
  --destructive-text: #8c1d18;
  --warning: #b06000;
  --warning-text: #8a4b00;
  --attention: ${hslToHex(accentHue, 70, 55)};
  --success: #2e7d32;
  --diff-added: #2e7d32;
  --diff-removed: #b3261e;
  --pr-merged: ${hslToHex((accentHue + 40) % 360, 45, 50)};
}
.dark {
  --canvas: ${darkCanvas};
  --ink: ${darkInk};
  --primary: ${darkPrimary};
  --primary-foreground: ${darkCanvas};
  --timeline-accent: ${darkPrimary};
  --file-accent: var(--timeline-accent);
  --destructive: #f2b8b5;
  --destructive-text: #f2b8b5;
  --warning: #ffb77c;
  --warning-text: #ffb77c;
  --attention: ${hslToHex(accentHue, 70, 68)};
  --success: #7bc47f;
  --diff-added: #7bc47f;
  --diff-removed: #f2b8b5;
  --pr-merged: ${hslToHex((accentHue + 40) % 360, 50, 70)};
}
`;
}
