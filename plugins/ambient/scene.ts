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
  quality: number;
  glass: number;
}

export const DEFAULT_CONTROLS: Controls = {
  enabled: true,
  showThrough: 0.77,
  speed: 0.75,
  quality: 0.5,
  glass: 0.6,
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
action=look shows the scene behind bb's real panels, glass, and text, and reports where the open areas are, which words the scene makes hard to read, how far the frame differs from bb's background, how much it moved in a second, and how long a frame takes to render. If it flags the scene as too faint, nearly still, too heavy, hidden behind the panels, or hard to read, fix that.`;

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

export const POPPY_HILL_SOURCE = `float hillY(float x) {
  return 0.07 + 0.09 * sin(x * 1.5 + 0.7) + 0.035 * sin(x * 3.7 + 1.3);
}

vec3 base(vec2 p, float w, float t) {
  vec3 skyC = u_palette[0];
  vec3 grass = u_palette[1];
  vec3 orange = u_palette[2];
  vec3 gold = u_palette[3];
  float hy = hillY(p.x);
  float hy2 = hillY(p.x * 0.6 + 2.7) + 0.09;

  float sy = clamp((p.y - hy) / 0.45, 0.0, 1.0);
  vec3 col = mix(mix(skyC, vec3(1.0, 0.96, 0.86), 0.45), skyC * 0.85 + vec3(0.0, 0.05, 0.14), sy);
  float cl = noise(vec2(p.x * 2.2 - t * 0.06, p.y * 5.0)) * noise(vec2(p.x * 4.0 - t * 0.09, p.y * 9.0 + 3.0));
  col = mix(col, vec3(1.0, 0.98, 0.95), smoothstep(0.16, 0.42, cl) * 0.85 * smoothstep(hy, hy + 0.1, p.y));

  if (p.y < hy2 + 0.01) {
    vec3 bh = mix(grass, skyC, 0.4) + gold * 0.1;
    float n = noise(p * vec2(34.0, 44.0));
    bh = mix(bh, mix(orange, gold, 0.5), smoothstep(0.6, 0.75, n) * 0.7);
    col = mix(col, bh, smoothstep(hy2 + 0.004, hy2 - 0.004, p.y));
  }

  if (p.y < hy + 0.07) {
    float depth = clamp((hy - p.y) / 0.55, 0.0, 1.0);
    float blade = noise(vec2(p.x * 22.0 + w * 2.0 * (0.3 + depth), p.y * 60.0));
    vec3 g = mix(grass * 0.55, grass * 1.15 + vec3(0.12, 0.1, 0.0), blade);
    g = mix(g, gold * 0.75 + grass * 0.35, 0.3 * noise(vec2(p.x * 3.0 - w * 0.6, p.y * 4.0)));
    g += vec3(0.12, 0.14, 0.02) * smoothstep(0.4, 1.3, w);
    col = mix(col, g, smoothstep(hy + 0.004, hy - 0.004, p.y));

    float s = p_size / 324.0;
    vec2 c0 = floor(p / s);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = c0 + vec2(float(i), float(j));
        float h = hash21(c);
        if (h > p_bloom) continue;
        vec2 h2 = vec2(hash21(c + 17.1), hash21(c + 41.7));
        vec2 root = (c + 0.15 + 0.7 * h2) * s;
        float rh = hillY(root.x);
        if (root.y > rh - 0.01) continue;
        float dd = clamp((rh - root.y) / 0.55, 0.0, 1.0);
        float sz = mix(0.45, 1.15, dd) * (0.8 + 0.4 * h2.x);
        float stem = s * 0.9 * sz;
        float bend = clamp(w * (0.7 + 0.6 * h2.y), -1.2, 1.2);
        vec2 head = root + vec2(bend * stem * 0.6, stem * (1.0 - 0.3 * bend * bend));
        vec2 pa = p - root;
        vec2 ba = head - root;
        float k = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float sd = length(pa - ba * k);
        col = mix(col, grass * 0.45, smoothstep(s * 0.05 * sz, s * 0.02 * sz, sd) * 0.8);
        vec2 d = p - head;
        float ca = cos(bend * 0.5), sa = sin(bend * 0.5);
        d = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
        float r = s * 0.32 * sz;
        float e = length(d * vec2(1.0, 1.25)) / r;
        if (e < 1.0) {
          vec3 pc = mix(orange, gold, h2.x * 0.6);
          pc = mix(pc, gold * 1.1 + 0.1, smoothstep(0.75, 0.0, e) * (d.y > 0.0 ? 0.55 : 0.25));
          pc *= 0.8 + 0.35 * smoothstep(-r, r, d.y + d.x * 0.5);
          col = mix(col, pc, smoothstep(1.0, 0.8, e));
        }
      }
    }
  }
  return col;
}

vec3 dabLayer(vec2 p, vec2 off, float w, float t, out float m, out float stripe) {
  float cell = p_brush;
  vec2 q = p / cell + off;
  vec2 c = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 cp = (c + 0.5 - off) * cell;
  float h = hash21(c + off * 7.0);
  float hy = hillY(cp.x);
  float ang = cp.y > hy + 0.01 ? 0.05 + 0.3 * (h - 0.5) : 1.3 + (h - 0.5) * 0.9 - w * 0.4;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 jit = (vec2(h, hash21(c + 3.3)) - 0.5) * 0.35;
  vec2 g = f - jit;
  float a = dot(g, dir);
  float b = dot(g, nrm);
  m = length(vec2(a * 0.9, b * 2.4));
  stripe = sin(b * 38.0 + h * 20.0) * 0.5 + 0.5;
  vec2 sp = cp + (jit + dir * a * 0.9) * cell;
  return base(sp, w, t);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float wt = t * p_wind;

  float w = 0.45 * sin(p.x * 2.6 - wt * 1.4 + p.y * 1.3);
  w += 1.1 * (noise(vec2(p.x * 1.3 - wt * 0.9, p.y * 1.1 + wt * 0.15)) - 0.45);
  w += 0.7 * smoothstep(0.55, 0.9, noise(vec2(p.x * 0.8 - wt * 1.7, 0.5 + p.y * 0.3)));

  float done = 0.0;
  float err = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float gst = exp(-pow((dist - r.z * 0.35) * 7.0, 2.0)) * exp(-r.z * 0.5);
    w += gst * 1.4;
    if (abs(r.w - 1.0) < 0.5) err += gst; else done += gst;
  }
  vec2 dp = p - toP(u_pointer);
  w += 1.0 * exp(-dot(dp, dp) / 0.012);
  w *= p_bend;

  float mA, sA, mB, sB;
  vec3 colB = dabLayer(p, vec2(0.0), w, t, mB, sB);
  vec3 colA = dabLayer(p, vec2(0.5, 0.37), w, t, mA, sA);
  colB *= 0.95 + 0.07 * sB;
  colA *= 0.95 + 0.08 * sA;
  vec3 col = mix(colB, colA, smoothstep(0.62, 0.46, mA));
  col *= 0.97 + 0.06 * noise(p * 140.0);

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 head = toP(a.xy) + vec2(w * 0.012, 0.004 * sin(t * 2.3 + float(i)));
    vec2 d = p - head;
    float R = 0.026 * a.w;
    float waiting = step(0.5, a.z);
    float pulse = 0.5 + 0.5 * sin(t * 3.0);
    float glow = exp(-dot(d, d) / (0.004 + 0.004 * waiting * pulse));
    col += u_palette[3] * glow * a.w * (0.35 + 0.35 * waiting * pulse);
    float ang = atan(d.y, d.x);
    float rr = R * (0.8 + 0.2 * cos(4.0 * ang + w * 0.8));
    float e = length(d) / max(rr, 1e-4);
    vec3 pc = mix(u_palette[2] * 1.1, u_palette[3] * 1.15 + 0.1, smoothstep(1.0, 0.2, e) * 0.6 + 0.25 * smoothstep(-R, R, d.y));
    pc = mix(pc, vec3(0.2, 0.12, 0.05), smoothstep(0.22, 0.12, e));
    col = mix(col, pc, smoothstep(1.0, 0.85, e) * a.w);
    if (waiting > 0.5) {
      float ring = abs(length(d) - R * (1.4 + 0.6 * pulse));
      col += u_palette[3] * smoothstep(0.004, 0.0, ring) * 0.6 * a.w;
    } else {
      for (int k = 0; k < 4; k++) {
        float ph = fract(t * 0.35 * max(p_wind, 0.2) + float(k) * 0.25 + float(i) * 0.13);
        vec2 pp = head + vec2(ph * 0.24, 0.03 * sin(ph * 9.0 + float(k) * 2.0) - ph * 0.04);
        float pd = length((p - pp) * vec2(1.0, 1.6));
        col = mix(col, mix(u_palette[2], u_palette[3], 0.3) * 1.1, smoothstep(0.008, 0.004, pd) * (1.0 - ph) * a.w);
      }
    }
  }

  col += u_palette[3] * clamp(done, 0.0, 1.0) * 0.22;
  col = mix(col, vec3(0.95, 0.12, 0.08), clamp(err, 0.0, 1.0) * 0.6);

  float cm = exp(-dot(p * vec2(0.9, 1.4), p * vec2(0.9, 1.4)) / 0.08);
  vec3 soft = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))), 0.35);
  col = mix(col, soft, cm * 0.25);

  return mix(u_canvas, col, p_color);
}`;

const PLASTICINE_COVE_SOURCE = `struct Clay { vec3 alb; vec2 g; float ao; float z; vec3 emit; };

float slopeOf(float u){ return clamp(-u / sqrt(max(1.0 - u*u, 0.02)), -3.0, 3.0); }

float wEdge(float fi, float x, float t, out float d1){
  float base = -0.03 - fi*0.105;
  float amp = 0.016 + 0.009*fi;
  float k = 3.2 + fi*1.1;
  float s = (0.35 + 0.3*fi)*p_swell;
  float a1 = x*k - t*s + fi*1.7;
  float a2 = x*k*2.3 + t*s*0.6 + fi*2.9;
  d1 = amp*k*cos(a1) + amp*0.4*k*2.3*cos(a2);
  return base + amp*sin(a1) + amp*0.4*sin(a2);
}

float lumpR(vec2 d, float r, float lump){
  float an = atan(d.y, d.x);
  return r*(1.0 + lump*(sin(an*3.0 + r*300.0) + 0.6*sin(an*7.0 + r*170.0)));
}

void dome(inout Clay c, vec2 d, float r, vec3 col, float z, inout float best, float lift, float lump){
  r = lumpR(d, r, lump);
  float l = length(d);
  if (l >= r) return;
  float hh = sqrt(r*r - l*l) + lift;
  if (hh <= best) return;
  best = hh;
  c.alb = col;
  c.g = -d / max(sqrt(r*r - l*l), r*0.3);
  c.z = z;
  c.ao = 1.0;
}

vec4 puff(float ci, int k, float t){
  float fk = float(k);
  float h = hash21(vec2(ci, 3.7));
  float hk = hash21(vec2(ci, fk + 2.0));
  float cy = 0.3 + 0.12*hash21(vec2(ci, 9.1));
  float cx = (ci + 0.5)*0.3 - t*0.018;
  vec2 pc = vec2(cx + (fk - 1.0)*0.05*(0.8 + 0.4*h), cy + (k == 1 ? 0.02 : 0.004*hk) + 0.004*sin(t*1.3 + fk + ci));
  float r = (k == 1 ? 0.048 : 0.028 + 0.012*hk)*(0.85 + 0.3*h);
  return vec4(pc, r, h < 0.3 ? 0.0 : cy);
}

float castMask(vec2 p, float t, float aspect){
  float m = 0.0;
  float c0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(c0 + float(j), k, t);
      if (pf.w == 0.0) continue;
      m = max(m, smoothstep(pf.z, pf.z*0.8, length(p - pf.xy)));
    }
  }
  vec2 sd = p - vec2(0.06*aspect, 0.3);
  m = max(m, smoothstep(0.085, 0.07, length(sd)));
  float lx0 = 0.5*aspect - 0.13;
  float ty = p.y + 0.22;
  float hw = mix(0.038, 0.025, clamp(ty/0.3, 0.0, 1.0)) + 0.004;
  m = max(m, step(0.0, ty)*step(ty, 0.36)*smoothstep(hw, hw - 0.008, abs(p.x - lx0)));
  return m;
}

Clay subject(vec2 p, float t, float aspect){
  Clay c;
  c.ao = 1.0; c.g = vec2(0.0); c.z = 0.0; c.emit = vec3(0.0);
  float sy = smoothstep(-0.05, 0.45, p.y);
  c.alb = mix(mix(u_palette[2], u_palette[3], 0.45), u_palette[0], sy);
  c.alb = mix(c.alb, u_palette[2]*0.9 + vec3(0.06, 0.0, 0.1), exp(-pow((p.y - 0.1)/0.08, 2.0))*0.45);
  float sn = noise(p*vec2(2.5, 14.0));
  float sm = sin(p.y*80.0 + 6.0*sn + 2.0*sin(p.x*4.0));
  c.g = vec2(0.05*sm, 0.16*sm);
  c.alb *= 0.95 + 0.1*sn;
  c.ao = 1.0 - 0.32*castMask(p + vec2(-0.017, 0.017), t, aspect);
  vec2 sc = vec2(0.06*aspect, 0.3);
  vec2 sd = p - sc;
  c.alb += u_palette[3]*exp(-dot(sd, sd)/0.03)*0.22;
  float best = 0.0;
  float sl = length(sd);
  vec3 sunC = mix(u_palette[2], u_palette[3], 0.3 + 0.4*smoothstep(0.09, 0.0, sl));
  sunC = mix(sunC, u_palette[2]*1.05, smoothstep(0.005, 0.0, abs(sl - 0.064))*0.8);
  dome(c, sd, 0.085, sunC, 0.25, best, 0.0, 0.012);
  float cc0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(cc0 + float(j), k, t);
      if (pf.w == 0.0 || p.y < pf.w - 0.03) continue;
      vec3 cl = mix(mix(u_palette[3], vec3(1.0), 0.3), u_palette[2]*0.9 + 0.12, smoothstep(pf.w + 0.03, pf.w - 0.03, p.y)*0.5);
      dome(c, p - pf.xy, pf.z, cl, 0.3, best, 0.0, 0.06);
    }
  }
  float hx = p.x;
  float he = 0.03 + 0.035*sin(hx*2.3 + 1.0) + 0.016*sin(hx*5.3 + 0.4);
  float hd = 0.035*2.3*cos(hx*2.3 + 1.0) + 0.016*5.3*cos(hx*5.3 + 0.4);
  if (p.y < he){
    float r = 0.022;
    float s = clamp((he - p.y)/r, 0.0, 1.0);
    float dh = (1.0 - s)/sqrt(max(1.0 - (1.0 - s)*(1.0 - s), 0.03));
    c.g = clamp(dh, 0.0, 3.0)*vec2(hd, -1.0)*0.7;
    c.alb = mix(mix(u_palette[0], u_palette[1], 0.5), u_palette[2], 0.1);
    c.alb *= 0.9 + 0.2*noise(p*vec2(9.0, 30.0));
    c.z = 0.35; c.ao = 1.0;
  }
  float lx0 = 0.5*aspect - 0.13;
  for (int i = 0; i < 4; i++){
    float fi = float(i);
    float de;
    float e = wEdge(fi, p.x, t, de);
    if (i == 3){
      vec2 rd = (p - vec2(lx0 + 0.01, -0.25))/vec2(0.11, 0.065);
      float rl = length(rd);
      if (rl < 1.0 + 0.08*noise(p*40.0)){
        c.alb = mix(u_palette[0]*0.8 + 0.1, u_palette[1]*0.5, 0.3);
        c.g = -rd/max(sqrt(max(1.0 - rl*rl, 0.0)), 0.3)*0.9;
        c.z = 0.8; c.ao = 1.0;
      }
      float ty = p.y + 0.22;
      if (ty > 0.0 && ty < 0.3){
        float hw = mix(0.038, 0.025, ty/0.3);
        float u = (p.x - lx0 + 0.002*sin(ty*40.0))/hw;
        if (abs(u) < 1.0){
          float band = mod(floor(ty/0.055 + 0.08*sin(p.x*120.0)), 2.0);
          c.alb = band < 0.5 ? u_palette[2] : mix(u_palette[3], vec3(1.0), 0.3);
          c.g = vec2(slopeOf(u)*0.8, 0.0);
          c.z = 0.8; c.ao = 1.0;
        }
      }
      if (ty >= 0.3 && ty < 0.335 && abs(p.x - lx0) < 0.028){
        float u = (p.x - lx0)/0.028;
        float bar = step(0.8, fract(u*2.0 + 0.5));
        c.alb = mix(u_palette[3]*1.1, u_palette[0], bar*0.8);
        c.g = vec2(slopeOf(u)*0.5, 0.0);
        c.emit += u_palette[3]*(1.0 - bar)*0.55;
        c.z = 0.8;
      }
      vec2 cd = (p - vec2(lx0, 0.115))/vec2(0.034, 0.032);
      float cl = length(cd);
      if (cd.y > 0.0 && cl < 1.0){
        c.alb = u_palette[2]*0.9;
        c.g = -cd/max(sqrt(1.0 - cl*cl), 0.3)*0.8;
        c.z = 0.8;
      }
    }
    if (p.y < e){
      float d = (e - p.y)*(1.0 + 0.14*sin(p.x*5.0 + fi*2.0) + 0.06*sin(p.x*13.0 - fi));
      float w = 0.026*p_coil*(0.75 + 0.12*fi);
      float ci = floor(d/w);
      float u = 2.0*fract(d/w) - 1.0;
      float dh = slopeOf(u);
      c.g = dh*vec2(de, -1.0)*(0.55 + 0.12*fi);
      float aoMin = mix(0.55, 0.72, step(2.5, fi));
      c.ao = aoMin + (1.0 - aoMin)*sqrt(max(1.0 - u*u, 0.0));
      vec3 sea = mix(u_palette[1], u_palette[0], clamp(ci*0.11 + (3.0 - fi)*0.08, 0.0, 0.7));
      sea *= 0.92 + 0.16*hash21(vec2(ci, fi*7.0 + 1.0));
      sea = mix(sea, mix(u_palette[2], u_palette[3], 0.5), (3.0 - fi)*0.07);
      vec3 foam = mix(u_palette[3], vec3(1.0), 0.35);
      foam = mix(foam, u_palette[1], step(2.5, fi)*0.35);
      c.alb = ci < 0.5 ? foam : sea;
      c.z = 0.45 + fi*0.18;
    } else {
      c.ao *= 0.5 + 0.5*smoothstep(0.0, 0.035, p.y - e);
    }
  }
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    if (a.w < 0.05) continue;
    float fi = float(i);
    vec2 ap = toP(a.xy);
    float by = 0.0, bs = 0.0, bslope = 0.0;
    for (int b = 0; b < 4; b++){
      float db;
      float eb = wEdge(float(b), ap.x, t, db);
      if (b == 0 || eb >= ap.y - 0.08){ by = eb; bs = float(b); bslope = db; }
    }
    float sc2 = a.w*(0.8 + 0.17*bs);
    vec2 d = p - vec2(ap.x, by + 0.004);
    float ta = -atan(bslope)*0.6;
    d = vec2(cos(ta)*d.x - sin(ta)*d.y, sin(ta)*d.x + cos(ta)*d.y)/sc2;
    float waiting = step(0.5, a.z);
    if (d.x > 0.07 || d.x < -0.16 || abs(d.y) > 0.1) continue;
    if (waiting < 0.5){
      float sh = fract(t*0.9 + fi*0.3);
      for (int k = 0; k < 3; k++){
        float fk = float(k) + sh;
        vec2 pc = vec2(-0.05 - fk*0.03, -0.012 + 0.003*sin(fk*3.0));
        float r = 0.012*(1.0 - fk*0.26);
        if (r > 0.0) dome(c, d - pc, r, mix(u_palette[3], vec3(1.0), 0.45), 1.0, best, 1.0, 0.05);
      }
    }
    if (d.y < 0.0 && d.y > -0.022){
      float hw = 0.046 - (-d.y)*0.9;
      if (abs(d.x) < hw){
        float u = (d.y + 0.011)/0.011;
        c.alb = d.y > -0.005 ? mix(u_palette[3], vec3(1.0), 0.3) : u_palette[2];
        c.g = vec2(slopeOf(d.x/hw)*0.3, slopeOf(u)*0.8);
        c.z = 1.0; c.ao = 1.0;
      }
    }
    if (abs(d.x) < 0.0025 && d.y >= 0.0 && d.y < 0.074){
      c.alb = u_palette[0]; c.g = vec2(slopeOf(d.x/0.0025)*0.5, 0.0); c.z = 1.0; c.ao = 1.0;
    }
    float sy2 = (d.y - 0.006)/0.064;
    if (sy2 > 0.0 && sy2 < 1.0){
      float sw = 0.042*(1.0 - sy2);
      if (d.x > 0.005 && d.x < 0.005 + sw){
        float u = (d.x - 0.005)/max(sw, 1e-3)*2.0 - 1.0;
        c.alb = mix(u_palette[3], vec3(1.0), 0.35);
        c.g = vec2(slopeOf(u)*0.35, -0.2);
        c.z = 1.0; c.ao = 1.0;
      }
      float jw = 0.03*(1.0 - sy2*1.2);
      if (d.x < -0.005 && d.x > -0.005 - jw){
        c.alb = mix(u_palette[2], u_palette[3], 0.3);
        c.g = vec2(0.35, -0.15);
        c.z = 1.0; c.ao = 1.0;
      }
    }
    if (waiting > 0.5){
      float pulse = 0.5 + 0.5*sin(t*4.0 + fi);
      vec2 ld = d - vec2(0.0, 0.078);
      float l2 = dot(ld, ld);
      c.emit += u_palette[3]*(exp(-l2/0.00006)*1.2 + smoothstep(0.004, 0.0, abs(sqrt(l2) - 0.012 - 0.014*pulse))*0.7*(1.0 - pulse*0.5))*a.w;
    }
  }
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float rad = r.z*0.14;
    float x = (dist - rad)/0.016;
    float G = exp(-x*x)*exp(-r.z*0.55);
    vec2 dir = d/max(dist, 1e-4);
    c.g += dir*(-2.0*x)*G*1.2;
    bool err = abs(r.w - 1.0) < 0.5;
    vec3 rc = err ? vec3(0.92, 0.1, 0.07) : mix(u_palette[3], vec3(1.0), 0.3);
    c.alb = mix(c.alb, rc, clamp(G*1.6, 0.0, 1.0));
    if (err) c.emit += vec3(0.5, 0.03, 0.02)*G;
  }
  vec2 dp = p - toP(u_pointer);
  float pr = length(dp);
  float PG = exp(-pr*pr/0.0025);
  c.g += (dp/max(pr, 1e-4))*(2.0*pr/0.0025)*PG*0.05;
  c.ao *= 1.0 - 0.2*PG;
  return c;
}

float thumbH(vec2 p){
  float lump = 0.008*noise(p*14.0);
  float cs = 0.09;
  vec2 cc = floor(p/cs);
  float h = hash21(cc);
  vec2 ctr = (cc + 0.4 + 0.2*vec2(h, hash21(cc + 5.0)))*cs;
  vec2 q = p - ctr;
  float an = h*6.2831;
  q = vec2(cos(an)*q.x + sin(an)*q.y, -sin(an)*q.x + cos(an)*q.y);
  float e = length(q*vec2(1.0, 1.5));
  float print = step(0.6, h)*smoothstep(0.034, 0.012, e);
  return (lump + print*(0.0007*sin(e*320.0) - 0.0025))*p_thumb;
}

vec3 scene(vec2 uv, vec2 p){
  float aspect = u_resolution.x/u_resolution.y;
  float fps = max(p_fps, 1.0);
  float frame = floor(u_time*fps);
  float T = frame/fps;
  Clay c = subject(p, T, aspect);
  vec2 boil = (vec2(hash21(vec2(frame, 1.0)), hash21(vec2(frame, 2.0))) - 0.5)*0.002;
  float ep = 0.0018;
  float t0 = thumbH(p + boil);
  vec2 tg = vec2(thumbH(p + boil + vec2(ep, 0.0)) - t0, thumbH(p + boil + vec2(0.0, ep)) - t0)/ep;
  c.g += tg*mix(0.4, 1.0, c.z);
  vec3 N = normalize(vec3(-c.g, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.55, 0.62));
  vec3 F = normalize(vec3(0.7, 0.1, 0.7));
  float diff = max(dot(N, L), 0.0);
  float fil = max(dot(N, F), 0.0);
  vec3 col = c.alb*(0.32*c.ao + 0.85*diff*vec3(1.0, 0.93, 0.82)*sqrt(c.ao) + 0.22*fil*vec3(0.6, 0.7, 0.95));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  col += pow(max(dot(N, H), 0.0), 22.0)*0.14*vec3(1.0, 0.95, 0.85);
  col += pow(1.0 - N.z, 2.0)*0.18*mix(u_palette[3], u_palette[1], 0.4);
  col = mix(col, c.alb*0.95*c.ao, (1.0 - c.z)*0.22);
  col += c.emit;
  vec2 lamp = vec2(0.5*aspect - 0.13, 0.097);
  float ang = T*0.9;
  vec2 bd = p - lamp;
  float side = cos(ang);
  float along = bd.x*sign(side);
  float cone = exp(-pow(bd.y/(0.008 + max(along, 0.0)*0.13), 2.0))*exp(-max(along, 0.0)*1.1)*step(0.0, along)*abs(side);
  float lampGlow = exp(-dot(bd, bd)/0.0012);
  col += u_palette[3]*(cone*0.5*(1.0 - smoothstep(0.5, 0.7, c.z)) + lampGlow*0.5)*p_beam;
  col *= 1.0 + 0.025*(hash21(vec2(frame, 7.0)) - 0.5);
  return mix(u_canvas, col, p_color);
}`;

const SCREAMING_FJORD_SOURCE = `const int NS = 9;

vec2 perp(vec2 d){ return vec2(-d.y, d.x); }
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }

vec3 starAt(int i, float W){
  float fi = float(i);
  float x = (-1.0 + 2.0*(fi + 0.25 + 0.5*hash21(vec2(fi, 1.3)))/float(NS))*W;
  float y = i == NS - 1 ? 0.2 : 0.22 + 0.24*hash21(vec2(fi, 7.9));
  float r = 0.014 + 0.016*hash21(vec2(fi, 4.1));
  return vec3(x, y, r);
}

vec4 vortex(int i, float W){
  return i == 0 ? vec4(-0.1*W - 0.02, 0.3, 0.14, 1.0) : vec4(0.28*W, 0.27, 0.09, -1.0);
}

float bandT(vec2 p, float sw){ return p.y + 0.028*sin(p.x*3.3 + sw*0.25) + 0.012*sin(p.x*8.0 - sw*0.4); }
float bandTop(){ return 0.05 + 0.15*p_blaze; }
float hillY(float x){ return 0.012 + 0.028*sin(x*2.0 + 0.6) + 0.014*sin(x*5.1 + 2.0); }
float shoreY(float x){ return -0.05 + 0.014*sin(x*3.0 + 1.0) + 0.008*sin(x*7.3); }
float railY(float x, float W){ return -0.12 - 0.24*(x + W)/(2.0*W); }
float figX(float W){ return 0.58*W; }
vec2 deckVP(float W){ return vec2(-W - 0.25, -0.06); }

float cyp(vec2 p, float cx, float H, float wmax, float sw){
  float h = (p.y + 0.52)/H;
  if (h < 0.0 || h > 1.0) return -1.0;
  float sway = 0.035*sin(sw*0.6 + cx*3.0)*h*h;
  float lob = 1.0 + 0.2*sin(h*21.0 + sw*1.1 + cx*5.0) + 0.1*sin(h*45.0 - sw*1.6);
  return wmax*pow(1.0 - h, 0.8)*lob - abs(p.x - cx - sway);
}

float figBody(vec2 p, float fx, float sw, out float side){
  side = 0.0;
  float h = (p.y + 0.52)/0.34;
  if (h < 0.0 || h > 1.0) return -1.0;
  float bcx = fx - 0.075*(1.0 - h)*(1.0 - h) + 0.03*sin(h*3.6 + 0.2 + 0.5*sin(sw*1.1))*(1.0 - h*0.4);
  float bw = mix(0.095, 0.022, pow(h, 0.45));
  float dx = p.x - bcx - 0.005*sin(p.y*40.0 + sw*2.0);
  side = dx/bw;
  return bw - abs(dx);
}

vec2 headC(float fx, float sw){ return vec2(fx + 0.008*sin(sw*1.1 + 5.0), -0.13); }

vec3 skyCol(vec2 p, float sw, float W){
  vec3 deep = u_palette[0]*0.72 + vec3(0.0, 0.02, 0.07);
  vec3 lite = mix(u_palette[0], vec3(0.78, 0.88, 1.0), 0.55);
  vec3 milk = mix(lite, u_palette[1], 0.35);
  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
  vec2 dp = p - toP(u_pointer);
  vec2 q = p + rot2(dp, 1.6*exp(-dot(dp, dp)/0.008)) - dp;
  float s = noise(vec2(q.x*2.4 - sw*0.05, q.y*15.0 + 2.2*sin(q.x*2.6 + sw*0.1)));
  float L = smoothstep(0.42, 0.8, s)*0.6;
  float wy = 0.22 + 0.06*sin(q.x*2.4 - sw*0.12);
  float M = exp(-pow((q.y - wy)/0.045, 2.0))*(0.6 + 0.4*sin(q.x*22.0 + q.y*25.0 - sw*0.9));
  for (int i = 0; i < 2; i++){
    vec4 v = vortex(i, W);
    vec2 d = q - v.xy;
    float r = length(d);
    float th = atan(d.y, d.x);
    float arm = 0.5 + 0.5*sin(2.0*v.w*th + r/v.z*(3.0 + 7.0*p_twist) - sw);
    float Lv = smoothstep(0.3, 0.85, arm)*smoothstep(0.0, 0.35, r/v.z)*0.9 + 0.5*exp(-r*r/(v.z*v.z*0.04));
    float wgt = exp(-r*r/(v.z*v.z))*min(p_twist + 0.3, 1.0);
    L = mix(L, Lv, wgt);
    M *= 1.0 - wgt;
  }
  vec3 col = mix(deep, lite, L);
  col = mix(col, milk, clamp(M, 0.0, 1.0)*0.85);
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      float fi = float(i);
      float r = s3.z*(1.0 + 0.12*sin(sw*1.7 + fi*2.3));
      float d = length(p - s3.xy);
      if (d > r*4.0) continue;
      float halo = exp(-d*d/(r*r*4.5))*p_stars;
      float rings = 0.5 + 0.5*sin(d/r*6.5 - sw*1.4 + fi);
      col = mix(col, mix(lite*1.08, warm, rings), clamp(halo, 0.0, 1.0)*0.85);
      col = mix(col, mix(u_palette[1], vec3(1.0, 0.96, 0.75), smoothstep(r*0.5, 0.0, d)), smoothstep(r*0.7, r*0.45, d));
    }
    vec2 md = p - vec2(W - 0.15, 0.35);
    float ml = length(md);
    float mh = exp(-ml*ml/0.012)*p_stars;
    col = mix(col, mix(warm, lite*1.1, 0.5 + 0.5*sin(ml*90.0 - sw*1.2)), clamp(mh, 0.0, 1.0)*0.8);
    float cres = smoothstep(0.048, 0.044, ml)*smoothstep(0.038, 0.042, length(md - vec2(-0.02, 0.014)));
    col = mix(col, mix(u_palette[1], mix(u_palette[1], u_palette[2], 0.35), smoothstep(0.02, 0.048, ml)), cres);
  }
  return col;
}

float segD(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba*clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0));
}

vec3 base(vec2 p, float t, float W){
  float sw = t*p_swirl;
  vec3 red = u_palette[2], yel = u_palette[1], blu = u_palette[0], drk = u_palette[3];
  vec3 col = skyCol(p, sw, W);
  float bt = bandT(p, sw);
  float top = bandTop();
  vec3 B[4] = vec3[4](red, mix(red, yel, 0.5), yel, mix(red, drk, 0.3));
  float k = bt*17.0 + 0.6*sin(p.x*4.0 - sw*0.2) + 0.3*sin(p.x*11.0 + sw*0.3);
  float f = fract(k);
  int bi = int(mod(floor(k), 4.0));
  vec3 bc = mix(B[bi], B[(bi + 1) - 4*((bi + 1)/4)], smoothstep(0.55, 1.0, f));
  bc = mix(bc, yel, smoothstep(0.03, -0.03, bt)*0.35);
  bc = mix(bc, mix(blu, vec3(0.3, 0.62, 0.55), 0.5), smoothstep(0.88, 1.0, sin(bt*11.0 + 2.0 - p.x*0.7))*0.6);
  col = mix(col, bc, smoothstep(top + 0.03, top - 0.03, bt));
  float hy = hillY(p.x);
  if (p.y < hy){
    float n = noise(vec2(p.x*7.0, p.y*40.0));
    float ridge = 0.5 + 0.5*sin((hy - p.y)*140.0 + n*4.0 + p.x*3.0);
    vec3 hc = mix(blu*0.5 + drk*0.25, mix(blu, vec3(0.6, 0.75, 1.0), 0.35), ridge*0.7);
    col = mix(col, hc, smoothstep(hy, hy - 0.004, p.y));
  }
  float sy = shoreY(p.x);
  if (p.y < sy){
    float dep = clamp((sy - p.y)/0.25, 0.0, 1.0);
    vec3 wc = mix(blu*0.8 + vec3(0.05, 0.0, 0.08), blu*0.45 + drk*0.3, dep);
    float rn = noise(vec2(p.x*2.6 - sw*0.05, (p.y + 0.02*sin(p.x*6.0 + sw*0.3))*30.0));
    wc = mix(wc, mix(red, yel, 0.55), smoothstep(0.6, 0.85, rn)*0.6*(1.0 - dep*0.7));
    col = mix(col, wc, smoothstep(sy, sy - 0.004, p.y));
  }
  float ry = railY(p.x, W);
  float lo = ry - 0.075;
  if (p.y < ry + 0.016){
    vec3 wood = mix(red, drk, 0.35);
    if (p.y < lo){
      vec2 dv = p - deckVP(W);
      float pa = atan(dv.y, dv.x);
      float n = noise(vec2(pa*30.0, length(dv)*5.0));
      float pl = 0.5 + 0.5*sin(pa*150.0 + n*4.0);
      float pl2 = 0.5 + 0.5*sin(pa*57.0 + 1.7 + n*2.0);
      vec3 dk = mix(mix(red, yel, 0.35)*0.75, mix(red, drk, 0.35)*0.85, pl*0.7);
      dk = mix(dk, mix(blu, vec3(0.62, 0.6, 0.66), 0.45)*0.85, smoothstep(0.6, 0.95, pl2)*0.6);
      dk = mix(dk, yel*0.85, smoothstep(0.75, 0.95, n)*0.3);
      col = dk*(0.86 + 0.14*smoothstep(-0.5, -0.25, p.y));
    }
    float px = abs(fract(p.x/0.11 + 0.3) - 0.5)*0.11;
    if (p.y < ry && p.y > lo - 0.006) col = mix(col, wood*0.85, smoothstep(0.0075, 0.005, px));
    col = mix(col, wood*0.9, smoothstep(0.0065, 0.0045, abs(p.y - lo)));
    vec3 rc = mix(wood, mix(red, yel, 0.4), smoothstep(-0.012, 0.012, p.y - ry)*0.6);
    col = mix(col, rc, smoothstep(0.014, 0.011, abs(p.y - ry)));
  }
  float cx = W - 0.085;
  float ins = cyp(p, cx, 0.9, 0.075, sw);
  if (ins > -0.004){
    float n = noise(vec2((p.x - cx)*40.0 + 1.5*sin(p.y*9.0 + sw*0.8), p.y*4.0));
    vec3 cc = mix(drk*0.8, mix(drk, vec3(0.28, 0.5, 0.3), 0.55), smoothstep(0.45, 0.85, n));
    cc = mix(cc, mix(red, drk, 0.6), smoothstep(0.8, 0.95, noise(vec2(p.x*60.0, p.y*9.0)))*0.5);
    cc *= 0.75 + 0.25*smoothstep(0.0, 0.03, ins);
    col = mix(col, cc, smoothstep(-0.004, 0.002, ins));
  }
  float fx = figX(W);
  if (abs(p.x - fx) < 0.16 && p.y < -0.05){
    vec3 bodyC = mix(drk, blu*0.4, 0.45);
    float side;
    float bdy = figBody(p, fx, sw, side);
    float n = noise(vec2(p.x*50.0, p.y*8.0));
    vec3 bcol = bodyC*(0.85 + 0.3*n);
    bcol = mix(bcol, mix(blu, drk, 0.3), smoothstep(0.2, 0.9, side)*0.5);
    col = mix(col, bcol, smoothstep(-0.003, 0.002, bdy));
    vec2 hc = headC(fx, sw);
    vec3 skin = mix(yel, vec3(0.62, 0.62, 0.48), 0.55);
    for (int s = 0; s < 2; s++){
      float sg = s == 0 ? -1.0 : 1.0;
      vec2 hand = hc + vec2(sg*0.036, -0.05);
      vec2 elbow = vec2(fx + sg*0.052 - 0.006, -0.235);
      vec2 shoulder = vec2(fx + sg*0.018 - 0.01, -0.2);
      float ad = min(segD(p, hand, elbow), segD(p, elbow, shoulder));
      col = mix(col, bodyC*0.95, smoothstep(0.014, 0.011, ad));
    }
    vec2 d = p - hc;
    float wx = 0.034*(1.0 + 0.32*clamp(d.y/0.06, -1.0, 1.0));
    float e = length(vec2(d.x/wx, d.y/0.06));
    vec3 hcol = skin*(0.78 + 0.28*smoothstep(-0.03, 0.03, d.y - d.x*0.6));
    float eye = length(vec2((abs(d.x) - 0.014)/0.0075, (d.y - 0.012)/0.012));
    float nose = length(vec2((abs(d.x) - 0.003)/0.0022, (d.y + 0.004)/0.004));
    float mouth = length(vec2(d.x/0.0075, (d.y + 0.03)/0.014));
    hcol = mix(hcol, drk*1.2 + blu*0.1, smoothstep(1.0, 0.7, min(min(eye, mouth), nose)));
    col = mix(col, hcol, smoothstep(1.0, 0.92, e));
    for (int s = 0; s < 2; s++){
      float sg = s == 0 ? -1.0 : 1.0;
      vec2 hd = rot2(p - hc - vec2(sg*0.033, -0.022), sg*0.28)/vec2(0.0095, 0.03);
      col = mix(col, skin*0.82, smoothstep(1.0, 0.8, length(hd)));
    }
  }
  return col;
}

vec2 skyFlow(vec2 p, float sw, float W){
  vec2 v = vec2(1.0, -0.38*cos(p.x*2.6 + sw*0.1));
  for (int i = 0; i < 2; i++){
    vec4 c = vortex(i, W);
    vec2 d = p - c.xy;
    v += c.w*perp(d)/c.z*exp(-dot(d, d)/(c.z*c.z))*4.0*max(p_twist, 0.2);
  }
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      vec2 d = p - s3.xy;
      v += perp(d)/s3.z*exp(-dot(d, d)/(s3.z*s3.z*5.0))*2.5;
    }
    vec2 d = p - vec2(W - 0.15, 0.35);
    v += perp(d)/0.05*exp(-dot(d, d)/0.01)*2.0;
  }
  return v;
}

vec2 disturb(vec2 p, float t){
  vec2 dp = p - toP(u_pointer);
  vec2 v = perp(dp)/0.07*exp(-dot(dp, dp)/0.008)*2.5;
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    v += perp(d)/0.05*exp(-dot(d, d)/0.005)*2.5*a.w;
  }
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = max(length(d), 1e-3);
    float ring = exp(-pow((dist - r.z*0.16)/0.03, 2.0))*exp(-r.z*0.6);
    v += perp(d)/dist*ring*2.5;
  }
  return v;
}

float formAng(vec2 p, float t, float W){
  float sw = t*p_swirl;
  float fx = figX(W);
  float side;
  float ry = railY(p.x, W);
  vec2 dir;
  if (cyp(p, W - 0.085, 0.9, 0.075, sw) > 0.0){
    dir = vec2(0.25*sin(p.y*14.0 + sw*1.2), 1.0);
  } else if (figBody(p, fx, sw, side) > 0.0 || length(p - headC(fx, sw)) < 0.075){
    dir = vec2(0.35*sin(p.y*16.0 + sw) - 0.3, 1.0);
  } else if (p.y < ry - 0.08){
    dir = p - deckVP(W);
  } else if (p.y < ry + 0.012){
    dir = vec2(1.0, -0.24/(2.0*W));
  } else if (p.y < shoreY(p.x)){
    dir = vec2(1.0, 0.15*sin(p.x*6.0 + sw*0.3));
  } else if (p.y < hillY(p.x)){
    dir = vec2(1.0, 0.056*cos(p.x*2.0 + 0.6) + 0.0714*cos(p.x*5.1 + 2.0));
  } else if (bandT(p, sw) < bandTop() + 0.02){
    dir = vec2(1.0, -(0.0924*cos(p.x*3.3 + sw*0.25) + 0.096*cos(p.x*8.0 - sw*0.4)));
  } else {
    dir = skyFlow(p, sw, W);
  }
  dir = normalize(dir) + disturb(p, t);
  return atan(dir.y, dir.x);
}

vec3 dabLayer(vec2 p, vec2 off, float t, float W, out float m, out float stripe){
  float cell = p_brush;
  vec2 q = p/cell + off;
  vec2 c = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 cp = (c + 0.5 - off)*cell;
  float h = hash21(c + off*7.0);
  float ang = formAng(cp, t, W) + (h - 0.5)*0.3;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 jit = (vec2(h, hash21(c + 3.3)) - 0.5)*0.3;
  vec2 g = f - jit;
  float a = dot(g, dir);
  float b = dot(g, nrm);
  m = length(vec2(a*0.52, b*2.5));
  stripe = sin(b*44.0 + h*20.0)*0.5 + 0.5;
  vec3 col = base(cp + (jit + dir*a*0.9 + nrm*b*0.35)*cell, t, W);
  float h2 = hash21(c + off*3.0 + 11.0);
  col = mix(col, col*vec3(0.85, 0.95, 1.2) + vec3(0.0, 0.02, 0.04), step(0.72, h2)*0.6);
  col = mix(col, col*vec3(1.15, 1.05, 0.85), step(h2, 0.18)*0.5);
  col *= 0.9 + 0.16*smoothstep(0.2, -0.2, b);
  return col;
}

vec3 scene(vec2 uv, vec2 p){
  float t = u_time;
  float W = 0.5*u_resolution.x/u_resolution.y;
  float sw = t*p_swirl;
  float mA, sA, mB, sB;
  vec3 colB = dabLayer(p, vec2(0.0), t, W, mB, sB);
  vec3 colA = dabLayer(p, vec2(0.5, 0.37), t, W, mA, sA);
  colB *= (0.93 + 0.09*sB)*(1.0 - 0.16*smoothstep(0.5, 0.8, mB));
  colA *= 0.93 + 0.1*sA;
  vec3 col = mix(colB, colA, smoothstep(0.62, 0.48, mA));
  col *= 1.0 - 0.1*smoothstep(0.44, 0.54, mA)*smoothstep(0.68, 0.56, mA);
  col *= 0.97 + 0.06*noise(p*150.0);

  vec2 hc = headC(figX(W), sw);
  float fm = smoothstep(0.09, 0.06, length(p - hc));
  if (fm > 0.0) col = mix(col, base(p, t, W)*(0.95 + 0.08*sA), fm*0.6);

  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
  vec3 lite = mix(u_palette[0], vec3(0.78, 0.88, 1.0), 0.55);
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    vec2 ap = toP(a.xy);
    vec2 d = p - ap;
    float r = length(d);
    float an = atan(d.y, d.x);
    if (a.z < 0.5){
      float halo = exp(-r*r/0.0035);
      float rings = 0.5 + 0.5*sin(r*150.0 - t*4.0 + an);
      col = mix(col, mix(lite*1.1, warm, rings), halo*0.8*a.w);
      for (int k = 0; k < 3; k++){
        float ph = t*1.8 + float(k)*2.094 + fi;
        vec2 dd = p - ap - 0.045*vec2(cos(ph), sin(ph));
        vec2 tg = vec2(-sin(ph), cos(ph));
        float st = length(vec2(dot(dd, tg)/0.016, dot(dd, perp(tg))/0.0045));
        col = mix(col, warm*1.05, smoothstep(1.0, 0.6, st)*a.w);
      }
      col = mix(col, mix(u_palette[1], vec3(1.0, 0.97, 0.8), smoothstep(0.012, 0.0, r)), smoothstep(0.017, 0.012, r)*a.w);
    } else {
      float pulse = 0.5 + 0.5*sin(t*4.0 + fi);
      for (int k = 0; k < 3; k++){
        float ph = fract(t*0.45 + float(k)/3.0);
        float rr = 0.018 + ph*0.1 + 0.005*sin(an*6.0 + t*3.0 + float(k));
        float ring = exp(-pow((r - rr)/0.006, 2.0))*(1.0 - ph);
        col = mix(col, mix(u_palette[2], u_palette[1], 0.25*float(k)), ring*a.w);
      }
      vec3 skin = mix(u_palette[1], vec3(0.7, 0.66, 0.5), 0.5)*1.1;
      col = mix(col, skin, smoothstep(0.018, 0.012, r)*a.w);
      col = mix(col, u_palette[3], smoothstep(1.0, 0.7, length(vec2(d.x/0.004, (d.y + 0.002)/0.007)))*a.w*(0.6 + 0.4*pulse));
    }
  }

  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float an = atan(d.y, d.x);
    float rad = r.z*0.16 + 0.008*sin(an*5.0 + r.z*6.0);
    float ring = exp(-pow((dist - rad)/0.012, 2.0))*exp(-r.z*0.6);
    if (abs(r.w - 1.0) < 0.5){
      col = mix(col, vec3(0.88, 0.08, 0.05), clamp(ring*1.2 + exp(-dist*dist/0.02)*exp(-r.z*0.8)*0.3, 0.0, 1.0));
    } else {
      col = mix(col, warm, clamp(ring, 0.0, 1.0)*0.8);
    }
  }
  return mix(u_canvas, col, p_color);
}`;

export const BUILT_IN_SCENES: BuiltInScene[] = [
  {
    id: "tide",
    name: "Tide",
    source: TIDE_SOURCE,
    palette: ["#06122e", "#0a5e8c", "#19d3c5", "#ffb35c"],
    params: [
      param("scale", "Zoom", 0.5, 6, 2.2),
      param("reach", "Light size", 0.3, 3, 1),
      param("glow", "Light glow", 0, 2, 0.8),
      param("ripple", "Ripple size", 0.3, 3, 1),
      param("cursor", "Cursor swirl", 0, 1, 0.3),
      param("grain", "Grain", 0, 1, 0.3),
      param("color", "Color strength", 0, 1, 0.9),
    ],
  },
  {
    id: "fireflies",
    name: "Fireflies",
    source: FIREFLIES_SOURCE,
    palette: ["#0b0f3d", "#3d2a9c", "#ffe14d", "#ff4fa0"],
    params: [
      param("size", "Firefly size", 0.2, 3, 1.2),
      param("motes", "Background motes", 0, 2, 0.6),
      param("haze", "Haze", 0, 2, 1.4),
      param("burst", "Ripple size", 0.3, 3, 1),
      param("color", "Color strength", 0, 1, 1),
    ],
  },
  {
    id: "contour",
    name: "Contour",
    source: CONTOUR_SOURCE,
    palette: ["#0d1b3e", "#3a2d8f", "#e0457b", "#ffd36b"],
    params: [
      param("scale", "Zoom", 0.5, 5, 1.6),
      param("density", "Line density", 2, 30, 10, 0.5),
      param("weight", "Line weight", 0.5, 3, 1),
      param("height", "Agent peaks", 0, 2, 0.8),
      param("fill", "Fill", 0, 1, 0.5),
      param("drift", "Drift", 0, 3, 1),
      param("color", "Color strength", 0, 1, 1),
    ],
  },
  {
    id: "poppy-hill",
    name: "Poppy Hill in the Wind",
    source: POPPY_HILL_SOURCE,
    palette: ["#5fa9ea", "#3f9b34", "#ff5a0a", "#ffbf1f"],
    params: [
      param("wind", "Wind speed", 0, 3, 1),
      param("bend", "Gust strength", 0, 2, 1),
      param("size", "Poppy size", 8, 40, 18, 0.5),
      param("bloom", "Bloom amount", 0, 1, 0.72),
      param("brush", "Brush stroke size", 0.006, 0.03, 0.017, 0.001),
      param("color", "Color strength", 0, 1, 0.95),
    ],
  },
  {
    id: "plasticine-lighthouse-cove",
    name: "Plasticine Lighthouse Cove",
    source: PLASTICINE_COVE_SOURCE,
    palette: ["#1c2c6b", "#22b3a6", "#ff6a3d", "#ffe0a6"],
    params: [
      param("swell", "Swell speed", 0, 2.5, 1, 0.05),
      param("coil", "Coil thickness", 0.5, 2, 1, 0.05),
      param("thumb", "Thumbprints", 0, 2.5, 1, 0.05),
      param("fps", "Stop-motion fps", 4, 24, 12, 1),
      param("beam", "Lighthouse beam", 0, 2, 1, 0.05),
      param("color", "Color strength", 0, 1, 0.92),
    ],
  },
  {
    id: "swirling-stars-screaming-fjord",
    name: "Swirling Stars, Screaming Fjord",
    source: SCREAMING_FJORD_SOURCE,
    palette: ["#2446a8", "#f6cf3f", "#e04a24", "#102a22"],
    params: [
      param("swirl", "Swirl speed", 0, 3, 1.3, 0.05),
      param("twist", "Vortex twist", 0, 2, 1, 0.05),
      param("brush", "Brush size", 0.006, 0.024, 0.014, 0.001),
      param("stars", "Star glow", 0, 1.5, 1, 0.05),
      param("blaze", "Scream sky height", 0, 1, 0.7, 0.05),
      param("color", "Color strength", 0, 1, 0.92),
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
    baseId: builtIn.id,
  };
}

export function rebuildBuiltIn(scene: Scene): Scene {
  const builtIn = BUILT_IN_SCENES.find((entry) => entry.id === scene.baseId);
  if (!builtIn) return scene;
  const values = new Map(scene.params.map((entry) => [entry.id, entry.value]));
  return {
    ...sceneOf(builtIn),
    name: scene.name,
    palette: scene.palette,
    params: builtIn.params.map((entry) => {
      const value = values.get(entry.id);
      return value === undefined
        ? { ...entry }
        : { ...entry, value: Math.min(entry.max, Math.max(entry.min, value)) };
    }),
  };
}
