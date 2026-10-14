export type Color = [number, number, number];
export type Theme = Record<"canvas" | "ink" | "foreground" | "sidebar" | "sidebarAccent" | "card" | "primary" | "timeline" | "border" | "selected", Color>;
export const mix = (a: Color, b: Color, t: number): Color => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const linear = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const srgb = (v: number) => clamp(v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
const luminance = (c: Color) => linear(c[0]) * 0.2126 + linear(c[1]) * 0.7152 + linear(c[2]) * 0.0722;
export function contrast(a: Color, b: Color) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function lab(c: Color): Color {
  const [r, g, b] = c.map(linear);
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const m = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const s = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  return [0.2104542553*l + 0.793617785*m - 0.0040720468*s, 1.9779984951*l - 2.428592205*m + 0.4505937099*s, 0.0259040371*l + 0.7827717662*m - 0.808675766*s];
}
function rgb([L, a, b]: Color): Color {
  const l = (L + 0.3963377774*a + 0.2158037573*b) ** 3;
  const m = (L - 0.1055613458*a - 0.0638541728*b) ** 3;
  const s = (L - 0.0894841775*a - 1.291485548*b) ** 3;
  return [srgb(4.0767416621*l - 3.3077115913*m + 0.2309699292*s), srgb(-1.2684380046*l + 2.6097574011*m - 0.3413193965*s), srgb(-0.0041960863*l - 0.7034186147*m + 1.707614701*s)];
}
function surfaceMix(a: Color, b: Color, t: number): Color {
  const [al, aa, ab] = lab(a), [bl, ba, bb] = lab(b);
  const ac = Math.hypot(aa, ab), bc = Math.hypot(ba, bb);
  const ah = ac < 0.0001 ? Math.atan2(bb, ba) : Math.atan2(ab, aa);
  const bh = bc < 0.0001 ? ah : Math.atan2(bb, ba);
  const delta = Math.atan2(Math.sin(bh - ah), Math.cos(bh - ah));
  const hue = ah + delta * t, chroma = ac + (bc - ac) * t;
  return rgb([al + (bl - al) * t, Math.cos(hue) * chroma, Math.sin(hue) * chroma]);
}
function readable(ink: Color, backgrounds: Color[], floor: number): Color {
  if (backgrounds.every(bg => contrast(ink, bg) >= floor)) return ink;
  const [L, a, b] = lab(ink);
  const targets: Color[] = [rgb([0.04, a * 0.15, b * 0.15]), rgb([0.98, a * 0.08, b * 0.08])];
  targets.sort((x, y) => Math.abs(lab(x)[0] - L) - Math.abs(lab(y)[0] - L));
  for (let i = 1; i <= 100; i++) for (const target of targets) {
    const next = surfaceMix(ink, target, i / 100);
    if (backgrounds.every(bg => contrast(next, bg) >= floor)) return next;
  }
  return targets.sort((x, y) => Math.min(...backgrounds.map(bg => contrast(y, bg))) - Math.min(...backgrounds.map(bg => contrast(x, bg))))[0];
}
export function derive(theme: Theme, strength: number) {
  const base = theme.sidebar;
  const reflection = (surface: Color, pigment: Color, amount: number): Color => {
    const [L] = lab(surface);
    const [l, a, b] = lab(surfaceMix(surface, pigment, amount * strength));
    return rgb([Math.max(L - 0.08 * strength, Math.min(L + 0.08 * strength, l)), a, b]);
  };
  const palette = [base, reflection(base, theme.primary, 0.5), theme.sidebarAccent, reflection(base, theme.timeline, 0.5)];
  const normal = [theme.card, reflection(theme.card, theme.primary, 0.3), surfaceMix(theme.card, theme.sidebarAccent, 0.5), reflection(theme.card, theme.timeline, 0.3)];
  const selected = normal.map(color => surfaceMix(color, theme.selected, 0.65));
  const text = readable(theme.foreground, [...normal, ...selected], 4.6);
  const icon = readable(theme.ink, [...normal, ...selected], 4.6);
  const border = readable(theme.border, normal, 1.8);
  const selectedBorder = readable(theme.primary, selected, 3);
  const highlight = surfaceMix(base, theme.ink, 0.12);
  const [canvasL, ca, cb] = lab(theme.canvas);
  const shadow = rgb([Math.max(0.03, canvasL * 0.35), ca * 0.35, cb * 0.35]);
  return { base, palette, normal, selected, text, icon, border, selectedBorder, highlight, shadow };
}
export type Derived = ReturnType<typeof derive>;
export const css = (c: Color) => `rgb(${c.map(v => (clamp(v) * 255).toFixed(2)).join(" ")})`;

export function themeReader(parent: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";
  probe.setAttribute("aria-hidden", "true");
  parent.append(probe);
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) { probe.remove(); throw new Error("Prism Frame could not read theme colors"); }
  const read = (name: string, fallback: Color, background: Color): Color => {
    probe.style.color = `var(${name}, ${css(fallback)})`;
    context.clearRect(0,0,1,1);
    context.fillStyle = getComputedStyle(probe).color;
    context.fillRect(0,0,1,1);
    const [r,g,b,a] = context.getImageData(0,0,1,1).data;
    return mix(background, [r/255,g/255,b/255], a/255);
  };
  return {
    read(): Theme {
      const canvas = read("--canvas", [1,1,1], [1,1,1]);
      const ink = read("--ink", [0.15,0.15,0.15], canvas);
      return { canvas, ink, foreground: read("--foreground",ink,canvas), sidebar: read("--sidebar",canvas,canvas), sidebarAccent: read("--sidebar-accent",canvas,canvas), card: read("--card",canvas,canvas), primary: read("--primary",ink,canvas), timeline: read("--timeline-accent",ink,canvas), border: read("--border",ink,canvas), selected: read("--surface-selected",canvas,canvas) };
    },
    dispose() { probe.remove(); },
  };
}
