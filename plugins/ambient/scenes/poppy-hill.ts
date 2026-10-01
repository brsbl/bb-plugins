import { param, type BuiltInScene } from "./param.js";

export const POPPY_HILL_SOURCE = `float hillY(float x) {
  return 0.07 + 0.09 * sin(x * 1.5 + 0.7) + 0.035 * sin(x * 3.7 + 1.3);
}

// fluffy cumulus built from overlapping puffs: x = coverage, y = how much sun the puff catches
vec2 clouds(vec2 p, float t) {
  float cov = 0.0, lit = 0.0;
  float ax = u_resolution.x / u_resolution.y;
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float span = ax + 0.8;
    float cx = mod(fk * 0.47 * span + t * 0.008 * (0.7 + 0.3 * fk), span) - span * 0.5;
    float cy = 0.27 + 0.13 * hash21(vec2(fk, 2.0));
    float sc = 0.7 + 0.5 * hash21(vec2(fk, 5.0));
    if (abs(p.x - cx) > 0.25 * sc || abs(p.y - cy) > 0.12 * sc) continue;
    for (int j = 0; j < 6; j++) {
      float fj = float(j);
      float u = (fj - 2.5) / 2.5;
      vec2 pc = vec2(cx + u * 0.13 * sc, cy + (0.035 * (1.0 - u * u) + 0.015 * hash21(vec2(fk, fj))) * sc);
      float r = (0.04 + 0.025 * (1.0 - u * u) + 0.012 * hash21(vec2(fj, fk + 9.0))) * sc;
      float d = length((p - pc) * vec2(1.0, 1.15));
      float m = smoothstep(r, r * 0.82, d) * step(cy - 0.025 * sc, p.y);
      cov = max(cov, m);
      lit = max(lit, m * smoothstep(-r, r * 0.8, p.y - pc.y + (p.x - pc.x) * 0.3));
    }
  }
  return vec2(cov, lit);
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
  if (p.y > hy) {
    vec2 cl = clouds(p, t * p_wind);
    vec3 cc = mix(mix(skyC, vec3(0.78, 0.8, 0.88), 0.55), vec3(1.0, 0.98, 0.93), cl.y);
    col = mix(col, cc, cl.x * 0.95);
  }

  // a distant range dissolving into haze
  float hy3 = hy2 + 0.05 + 0.03 * sin(p.x * 2.3 + 1.1) + 0.015 * noise(vec2(p.x * 6.0, 4.0));
  if (p.y < hy3 + 0.01) {
    vec3 far = mix(skyC * 0.82 + vec3(0.08, 0.08, 0.05), mix(grass, skyC, 0.7), 0.3);
    far = mix(far, vec3(0.95, 0.94, 0.9), 0.25 * smoothstep(hy3 - 0.06, hy3, p.y));
    col = mix(col, far, smoothstep(hy3 + 0.004, hy3 - 0.004, p.y) * 0.85);
  }

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

export const poppyHill: BuiltInScene = {
  id: "poppy-hill",
  name: "Poppy Hill",
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
};
