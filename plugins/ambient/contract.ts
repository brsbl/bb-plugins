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
  baseId?: string;
}

export interface Controls {
  enabled: boolean;
  showThrough: number;
  speed: number;
  glass: number;
}

export type ControlKey = Exclude<keyof Controls, "enabled">;

export interface RangeSpec {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  default: number;
  format: (value: number) => string;
}

export interface ControlSpec extends RangeSpec {
  key: ControlKey;
  /** The name agents and the CLI use; aliases are also accepted on the CLI. */
  name: string;
  aliases: readonly string[];
  describe: string;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export const CONTROL_SPECS: readonly ControlSpec[] = [
  {
    key: "showThrough",
    name: "visibility",
    aliases: ["showthrough"],
    label: "Visibility",
    hint: "How much of the scene shows through bb",
    describe: "how much of the scene shows through bb",
    min: 0,
    max: 0.8,
    step: 0.01,
    default: 0.77,
    format: percent,
  },
  {
    key: "speed",
    name: "motion",
    aliases: ["speed"],
    label: "Motion",
    hint: "How fast the scene moves",
    describe: "animation speed",
    min: 0,
    max: 4,
    step: 0.05,
    default: 0.75,
    format: (value) => `${value.toFixed(1)}×`,
  },
  {
    key: "glass",
    name: "glass",
    aliases: [],
    label: "Glass opacity",
    hint: "How solid the glass behind text is; lower lets more of the scene through",
    describe:
      "opacity of the frosted glass that keeps text readable over the scene; it is always on and can only be lowered from its default",
    min: 0.2,
    max: 0.6,
    step: 0.01,
    default: 0.6,
    format: percent,
  },
];

/** Render resolution. It belongs to the device, not the synced controls, so it lives in localStorage. */
export const DETAIL: RangeSpec = {
  label: "Detail",
  hint: "Render resolution on this device; lower is softer and uses less GPU",
  min: 0.2,
  max: 1,
  step: 0.05,
  default: 0.5,
  format: percent,
};

export function clampToSpec(spec: Pick<RangeSpec, "min" | "max">, value: number): number {
  return Math.min(spec.max, Math.max(spec.min, value));
}

export const DEFAULT_CONTROLS: Controls = {
  enabled: true,
  ...(Object.fromEntries(CONTROL_SPECS.map((spec) => [spec.key, spec.default])) as Record<ControlKey, number>),
};

/** Which library entry the open scene autosaves into; null for an unsaved agent scene. */
export type SceneRef = { kind: "builtIn" | "saved"; id: string };

/** Drawn when a scene can't be (or must not be) rendered. Cheap enough for any GPU. */
export const FALLBACK_SCENE: Scene = {
  name: "Fallback",
  source: `vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * 0.05;
  vec3 col = ramp(0.5 + 0.35 * sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 - t));
  return mix(u_canvas, col, 0.6);
}`,
  params: [],
  palette: ["#1d2b53", "#3a6ea5", "#c47ac0", "#f4d6a0"],
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
bb draws its UI over the scene with a translucent veil, so keep shapes soft and contrast gentle where text sits; motion can be lively as long as it stays smooth and continuous.
The veil already matches bb's light or dark theme and the user controls how much shows through, so render the palette at full strength in both modes: do not darken the scene for u_dark or blend most of it into u_canvas. The built-in scenes end with mix(u_canvas, col, p_color), where p_color defaults near 0.9. Keep it cheap: the shader runs every frame behind bb, so a frame must render in a few milliseconds. Use constant, small loop bounds, at most one or two fbm calls per pixel, and never fbm inside the agent or ripple loops.
action=look shows the scene behind bb's real panels and glass, with text drawn as bars, and reports where the open areas are, which words the scene makes hard to read, how far the frame differs from bb's background, how much it moved in a second, and how long a frame takes to render. If it flags the scene as too faint, nearly still, too heavy, hidden behind the panels, or hard to read, fix that.`;

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
