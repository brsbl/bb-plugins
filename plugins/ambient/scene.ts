export const MAX_AGENTS = 16;
export const MAX_RIPPLES = 12;
export const MAX_PARAMS = 12;
export const MAX_SOURCE_LENGTH = 32_000;
export const PARAM_ID_PATTERN = /^[a-z][a-z0-9_]{0,23}$/;
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export interface SceneParam {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface Scene {
  name: string;
  source: string;
  params: SceneParam[];
  palette: [string, string, string, string];
}

export interface Controls {
  enabled: boolean;
  showThrough: number;
  speed: number;
  quality: number;
}

export const DEFAULT_CONTROLS: Controls = {
  enabled: true,
  showThrough: 0.22,
  speed: 1,
  quality: 0.5,
};

export type RippleKind = "done" | "error" | "started";

export const RIPPLE_KIND_CODE: Record<RippleKind, number> = {
  done: 0,
  error: 1,
  started: 2,
};

export const SHADER_CONTRACT = `Scenes are GLSL ES 3.00 fragment bodies. Define:

  vec3 scene(vec2 uv, vec2 p)

uv is 0..1 screen space (y up); p is aspect-corrected and centered (y spans -0.5..0.5). Return an RGB color; it is clamped to 0..1.

Uniforms:
  vec2  u_resolution        drawing-buffer pixels
  float u_time              seconds, scaled by the user's speed control
  vec3  u_palette[4]        the scene palette, sRGB 0..1
  vec3  u_canvas, u_ink     bb's current theme background and text colors
  float u_dark              1.0 in dark mode
  int   u_agentCount        live agents (max ${MAX_AGENTS})
  vec4  u_agents[${MAX_AGENTS}]     xy = uv position, z = state (0 working, 1 waiting for the user), w = presence 0..1 (fades in/out)
  int   u_rippleCount       active ripples (max ${MAX_RIPPLES})
  vec4  u_ripples[${MAX_RIPPLES}]   xy = uv origin, z = age in seconds, w = kind (0 turn finished, 1 error, 2 agent started)
  float u_activity          smoothed 0..1 overall busyness
  vec2  u_pointer           cursor in uv space
  float p_<id>              one float per declared param, driven by the user's sliders

Helpers: hash21(vec2), noise(vec2), fbm(vec2), toP(vec2 uv) -> p space, pal(float t) cycles the palette, ramp(float t) blends the palette 0..1 without wrapping.
Loop over agents with: for (int i = 0; i < ${MAX_AGENTS}; i++) { if (i >= u_agentCount) break; ... }. Ripples fade out on their own; they live about 4 seconds.
bb draws its UI over the scene with a translucent veil, so favor soft, low-frequency, slow motion that stays readable behind text.
The veil already matches bb's light or dark theme and the user controls how much shows through, so render the palette at full strength in both modes: do not darken the scene for u_dark or blend most of it into u_canvas. The built-in scenes end with mix(u_canvas, col, p_color), where p_color defaults near 0.9. action=look reports how far the frame differs from bb's background; if it says the scene is too faint, raise contrast and color.`;

const PRELUDE = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_palette[4];
uniform vec3 u_canvas;
uniform vec3 u_ink;
uniform float u_dark;
uniform int u_agentCount;
uniform vec4 u_agents[${MAX_AGENTS}];
uniform int u_rippleCount;
uniform vec4 u_ripples[${MAX_RIPPLES}];
uniform float u_activity;
uniform vec2 u_pointer;
out vec4 ambientFragColor;
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}
vec2 toP(vec2 uv) {
  return (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
}
vec3 pal(float t) {
  float x = fract(t) * 4.0;
  int i = int(floor(x));
  return mix(u_palette[i], u_palette[(i + 1) % 4], smoothstep(0.0, 1.0, fract(x)));
}
vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * 3.0;
  int i = int(min(floor(x), 2.0));
  return mix(u_palette[i], u_palette[i + 1], smoothstep(0.0, 1.0, x - float(i)));
}
`;

const EPILOGUE = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  ambientFragColor = vec4(clamp(scene(uv, p), 0.0, 1.0), 1.0);
}
`;

export interface AssembledShader {
  code: string;
  sourceLineOffset: number;
}

export function assembleShader(scene: Pick<Scene, "source" | "params">): AssembledShader {
  const uniforms = scene.params
    .map((param) => `uniform float p_${param.id};`)
    .join("\n");
  const head = `${PRELUDE}${uniforms}\n`;
  return {
    code: `${head}${scene.source}\n${EPILOGUE}`,
    sourceLineOffset: head.split("\n").length - 1,
  };
}

export function remapShaderLog(log: string, sourceLineOffset: number): string {
  return log
    .replace(/ERROR: (\d+):(\d+):/g, (_match, file: string, line: string) => {
      const sourceLine = Number(line) - sourceLineOffset;
      return sourceLine > 0
        ? `ERROR: line ${sourceLine}:`
        : `ERROR: ${file}:${line} (prelude):`;
    })
    .replace(/\u0000/g, "")
    .trim();
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function param(
  id: string,
  label: string,
  min: number,
  max: number,
  value: number,
  step = 0.01,
): SceneParam {
  return { id, label, min, max, step, value };
}

const TIDE_SOURCE = `vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * 0.04;
  vec2 q = p * p_scale;
  vec2 warp = vec2(0.0);
  float glow = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float r2 = dot(d, d);
    float reach = 0.04 * p_reach * p_reach;
    warp += a.w * exp(-r2 / reach) * vec2(-d.y, d.x) * 3.0;
    float breathe = a.z > 0.5 ? 0.55 + 0.45 * sin(u_time * 3.0) : 1.0;
    glow += a.w * breathe * exp(-r2 / (0.004 * p_reach));
  }
  float ring = 0.0;
  float alarm = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float radius = r.z * 0.3 * p_ripple;
    float band = exp(-pow((dist - radius) * 24.0, 2.0)) * exp(-r.z * 1.2);
    warp += band * d / max(dist, 0.001) * 0.25;
    ring += band;
    alarm += abs(r.w - 1.0) < 0.5 ? band : 0.0;
  }
  vec2 c = p - toP(u_pointer);
  warp += p_cursor * 0.4 * vec2(-c.y, c.x) * exp(-dot(c, c) * 20.0);
  float n = fbm(q + warp + vec2(t, -0.6 * t) + 1.5 * fbm(q * 0.7 - vec2(0.3 * t, t)));
  vec3 col = ramp(n * 1.25 - 0.1 + 0.2 * u_activity);
  col += glow * p_glow * u_palette[3];
  vec3 ringColor = mix(u_palette[3], vec3(1.0, 0.3, 0.25), clamp(alarm / max(ring, 0.001), 0.0, 1.0));
  col += ring * 0.6 * ringColor;
  col = mix(u_canvas, col, p_color);
  col += (hash21(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5) * 0.06 * p_grain;
  return col;
}`;

const FIREFLIES_SOURCE = `vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  vec3 col = mix(u_palette[0], u_palette[1], smoothstep(-0.6, 0.8, p.y + 0.25 * fbm(p * 1.5 + t * 0.02)));
  col += p_haze * 0.25 * fbm(p * 3.0 + vec2(t * 0.03, 0.0)) * u_palette[2];
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 7.13, fi * 3.71);
    vec2 pos = vec2(hash21(seed), hash21(seed + 1.7));
    pos += 0.08 * vec2(
      sin(t * 0.07 * (1.0 + hash21(seed + 3.1)) + fi),
      cos(t * 0.05 * (1.0 + hash21(seed + 5.3)) + fi * 1.3)
    );
    vec2 d = p - toP(fract(pos));
    float twinkle = 0.5 + 0.5 * sin(t * (0.6 + hash21(seed + 9.1)) + fi * 2.0);
    col += u_palette[2] * p_motes * 0.00018 / (dot(d, d) + 0.0004) * twinkle;
  }
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float waiting = step(0.5, a.z);
    float flicker = mix(0.85 + 0.15 * sin(t * 9.0 + float(i) * 1.7), 0.35 + 0.65 * (0.5 + 0.5 * sin(t * 2.2)), waiting);
    vec3 hue = mix(u_palette[2], u_palette[3], waiting);
    float size = p_size * 0.0012;
    col += hue * a.w * flicker * size / (dot(d, d) + size * 0.6);
  }
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float ang = atan(d.y, d.x);
    float radius = r.z * 0.22 * p_burst;
    float band = exp(-pow((dist - radius) * 40.0, 2.0));
    float sparks = pow(0.5 + 0.5 * cos(ang * 23.0 + r.x * 40.0), 12.0);
    vec3 hue = r.w < 0.5 ? u_palette[3] : (r.w < 1.5 ? vec3(1.0, 0.3, 0.25) : u_palette[2] * 0.6);
    col += hue * band * (0.35 + sparks) * exp(-r.z * 1.4);
  }
  return mix(u_canvas, col, p_color);
}`;

const CONTOUR_SOURCE = `vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * 0.02 * p_drift;
  float h = fbm(p * p_scale + vec2(t, t * 0.4)) * 1.2;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float breathe = a.z > 0.5 ? 0.8 + 0.2 * sin(u_time * 2.0) : 1.0;
    h += p_height * a.w * breathe * exp(-dot(d, d) / 0.03);
  }
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float dir = abs(r.w - 1.0) < 0.5 ? -1.0 : 1.0;
    h += dir * 0.25 * exp(-pow((dist - r.z * 0.28) * 18.0, 2.0)) * exp(-r.z);
  }
  float v = h * p_density;
  float w = fwidth(v) * p_weight;
  float f = fract(v);
  float line = 1.0 - smoothstep(0.0, w * 1.5, min(f, 1.0 - f));
  float m = fract(v / 5.0);
  float major = 1.0 - smoothstep(0.0, w * 2.5, min(m, 1.0 - m) * 5.0);
  vec3 base = mix(u_canvas, ramp(h * 0.8), p_fill);
  vec3 col = mix(base, u_palette[3], clamp(line * 0.55 + major * 0.35, 0.0, 1.0));
  return mix(u_canvas, col, p_color);
}`;

export interface BuiltInScene extends Scene {
  id: string;
}

export const BUILT_IN_SCENES: BuiltInScene[] = [
  {
    id: "tide",
    name: "Tide",
    source: TIDE_SOURCE,
    palette: ["#0b1d3a", "#1f6f8b", "#6fb7a8", "#f2d0a4"],
    params: [
      param("scale", "Scale", 0.5, 6, 2.2),
      param("reach", "Agent reach", 0.3, 3, 1),
      param("glow", "Agent glow", 0, 2, 0.8),
      param("ripple", "Ripple size", 0.3, 3, 1),
      param("cursor", "Cursor swirl", 0, 1, 0.3),
      param("grain", "Grain", 0, 1, 0.3),
      param("color", "Color", 0, 1, 0.9),
    ],
  },
  {
    id: "fireflies",
    name: "Fireflies",
    source: FIREFLIES_SOURCE,
    palette: ["#070b18", "#1b2340", "#ffd27a", "#ff8fb1"],
    params: [
      param("size", "Firefly size", 0.2, 3, 1),
      param("motes", "Motes", 0, 2, 0.6),
      param("haze", "Haze", 0, 2, 0.8),
      param("burst", "Burst size", 0.3, 3, 1),
      param("color", "Color", 0, 1, 1),
    ],
  },
  {
    id: "contour",
    name: "Contour",
    source: CONTOUR_SOURCE,
    palette: ["#f4efe6", "#d9c6a5", "#8aa39b", "#2f4858"],
    params: [
      param("scale", "Scale", 0.5, 5, 1.6),
      param("density", "Line density", 2, 30, 10, 0.5),
      param("weight", "Line weight", 0.5, 3, 1),
      param("height", "Agent height", 0, 2, 0.8),
      param("fill", "Fill", 0, 1, 0.5),
      param("drift", "Drift", 0, 3, 1),
      param("color", "Color", 0, 1, 1),
    ],
  },
];

export const DEFAULT_SCENE: Scene = sceneOf(BUILT_IN_SCENES[0]!);

export function sceneOf(builtIn: BuiltInScene): Scene {
  return {
    name: builtIn.name,
    source: builtIn.source,
    palette: [...builtIn.palette],
    params: builtIn.params.map((entry) => ({ ...entry })),
  };
}
