import { param, type BuiltInScene } from "./param.js";

const SOURCE = `float terrain(vec2 p, float td) {
  vec2 q = p * 1.9 + vec2(td, td * 0.4);
  float b = noise(q) * 0.52
          + noise(q * 2.07 + vec2(5.2, 1.3) - vec2(td * 0.6, 0.0)) * 0.28
          + noise(q * 4.13 + vec2(1.7, 9.2)) * 0.11
          + noise(q * 8.4 + vec2(8.3, 2.8)) * 0.035;
  float h = (b - 0.45) * 2.6;
  h += 0.45 * smoothstep(0.3, 0.9, abs(p.x)) - 0.05;
  return h;
}

float halftone(float T, vec2 p, float ang, float cell, float seed) {
  vec2 gT = vec2(dFdx(T), dFdy(T));
  float c = cos(ang), s = sin(ang);
  mat2 R = mat2(c, s, -s, c);
  vec2 q = R * p / cell;
  vec2 cp = transpose(R) * ((floor(q) + 0.5) * cell);
  float Tc = clamp(T + dot(gT, (cp - p) * u_resolution.y), 0.0, 1.0);
  float d = length(fract(q) - 0.5);
  float rough = (noise(p * u_resolution.y * 0.3 + seed) - 0.5) * 0.14 * p_grain;
  float r = 0.74 * sqrt(Tc);
  float aa = 0.8 / (cell * u_resolution.y);
  return smoothstep(r + aa, r - aa, d + rough) * smoothstep(0.0, 0.05, Tc);
}

float inkDensity(vec2 p, float seed) {
  float band = 0.8 + 0.2 * noise(vec2(p.x * 1.6 + seed, p.y * 24.0 + seed * 3.0));
  float mottle = 0.9 + 0.1 * noise(p * 14.0 + seed * 7.0);
  float speck = smoothstep(0.58, 0.85, noise(p * u_resolution.y * 0.45 + seed * 11.0));
  return band * mottle * (1.0 - 0.45 * p_grain * speck);
}

float isoLine(float v, float px) {
  float fw = fwidth(v) * px;
  return smoothstep(fw, fw * 0.35, abs(fract(v + 0.5) - 0.5));
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float td = t * 0.02 * p_drift;
  vec3 P = u_palette[0];
  vec3 B = u_palette[1];
  vec3 Y = u_palette[2];
  vec3 paper = u_palette[3];
  float lw = max(0.7, u_resolution.y * 0.0022);

  float h = terrain(p, td);
  vec2 dp = p - toP(u_pointer);
  h += 0.16 * exp(-dot(dp, dp) / 0.005);

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float r2 = dot(d, d);
    float waiting = step(0.5, a.z);
    float breathe = mix(1.0, 0.85 + 0.15 * sin(t * 2.4 + float(i)), waiting);
    h += p_height * a.w * breathe * exp(-r2 / 0.02);
    float dist = sqrt(r2);
    h += (1.0 - waiting) * a.w * 0.06 * sin(dist * 60.0 - t * 3.0) * exp(-dist * 6.0) * smoothstep(0.02, 0.06, dist);
  }

  float ringY = 0.0, ringP = 0.0, ringB = 0.0, flash = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float isErr = abs(r.w - 1.0) < 0.5 ? 1.0 : 0.0;
    float isStart = r.w > 1.5 ? 1.0 : 0.0;
    float front = r.z * 0.26 * (1.0 - 0.4 * isStart);
    float fade = exp(-r.z * 0.55);
    h += mix(0.25, -0.3, isErr) * exp(-pow((dist - front) * 16.0, 2.0)) * exp(-r.z * 0.9);
    float ad = abs(dist - front);
    float band = smoothstep(0.02, 0.013, ad) * fade;
    float edge = smoothstep(0.0035, 0.002, abs(ad - 0.022)) * fade;
    ringY += band * (1.0 - isStart);
    ringP += band * max(isErr, isStart);
    ringB += edge * (1.0 - isErr) * (1.0 - isStart);
    float thick = 0.07 * exp(-r.z * 0.7);
    flash += isErr * smoothstep(front + 0.004, front - 0.004, dist) * smoothstep(front - thick - 0.004, front - thick + 0.004, dist);
  }
  flash = clamp(flash, 0.0, 1.0);

  vec2 g = vec2(dFdx(h), dFdy(h)) * u_resolution.y;
  vec3 n = normalize(vec3(-g * 0.3, 1.0));
  float lam = dot(n, normalize(vec3(-0.6, 0.6, 0.55)));
  float shadow = clamp((0.72 - lam) * 1.6, 0.0, 1.0);
  float lit = clamp((lam - 0.8) * 4.0, 0.0, 1.0);

  float mr = 0.0034 * p_misreg;
  vec2 oP = mr * vec2(1.0, -0.6) + 0.001 * p_misreg * vec2(sin(t * 0.23), cos(t * 0.19));
  vec2 oB = mr * vec2(-0.7, 0.8);
  vec2 oY = mr * vec2(0.4, 0.9) + 0.0008 * p_misreg * vec2(cos(t * 0.17), sin(t * 0.29));
  float hP = h + dot(g, oP);
  float hB = h + dot(g, oB);
  float hY = h + dot(g, oY);

  float waterB = smoothstep(0.015, -0.015, hB);
  float landY = smoothstep(-0.02, 0.08, hY);
  float Ty = landY * (0.72 - 0.62 * smoothstep(0.45, 1.1, hY)) * (1.0 - 0.5 * lit);
  float Tp = smoothstep(0.3, 0.95, hP) * 0.9 + 0.06 * smoothstep(0.1, 0.3, hP);
  float Tb = mix(0.03 + 0.4 * shadow * smoothstep(-0.05, 0.3, hB), 0.14 + 0.3 * smoothstep(0.0, -0.5, hB), waterB);

  float cell = 0.013 * p_dots;
  float cY = halftone(Ty, p, 0.0, cell * 1.05, 1.3);
  float cP = halftone(Tp, p, 1.309, cell, 7.1);
  float cB = halftone(Tb, p, 0.262, cell * 0.95, 3.7);

  float landB = 1.0 - waterB;
  float minorB = isoLine(hB * 9.0, lw) * landB;
  float minorP = isoLine(hP * 9.0, lw) * smoothstep(-0.02, 0.05, hP);
  float majorP = isoLine(hP * 9.0 / 5.0, lw * 2.0) * smoothstep(-0.02, 0.05, hP);
  float majorB = isoLine(hB * 9.0 / 5.0, lw * 1.6) * landB;
  float shore = smoothstep(fwidth(hB) * lw * 2.0, fwidth(hB) * lw * 0.6, abs(hB));
  float wl = isoLine(hB * 30.0 - t * 0.35, lw * 0.8) * waterB * smoothstep(-0.35, -0.03, hB);
  float lineB = max(max(minorB * 0.75, majorB), max(shore, wl * 0.8));
  float lineP = max(minorP * 0.25, majorP);

  float ringW = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    if (a.z < 0.5) continue;
    vec2 d = p - toP(a.xy);
    float fr = fract(t * 0.6 + float(i) * 0.3);
    float rr = abs(length(d) - (0.045 + 0.08 * fr));
    float dash = step(0.0, sin(atan(d.y, d.x) * 14.0 + t));
    ringW = max(ringW, smoothstep(0.0032, 0.0016, rr) * dash * (1.0 - fr) * a.w);
  }

    float kY = clamp(max(cY, max(ringY, flash)), 0.0, 1.0) * inkDensity(p, 1.0);
  float kP = clamp(max(max(cP, lineP), max(ringP, flash)), 0.0, 1.0) * inkDensity(p, 4.0);
  float kB = clamp(max(max(cB, lineB) * (1.0 - 0.6 * flash), max(ringW, ringB)), 0.0, 1.0) * inkDensity(p, 9.0);

  vec3 col = paper * (0.96 + 0.04 * noise(p * u_resolution.y * 0.12) + 0.02 * (noise(p * 6.0) - 0.5));
  col *= mix(vec3(1.0), Y, kY);
  col *= mix(vec3(1.0), P, kP);
  col *= mix(vec3(1.0), B, kB);
  return mix(u_canvas, col, p_color);
}`;

export const risographMap: BuiltInScene = {
  id: "risograph-map",
  name: "Risograph Map",
  source: SOURCE,
  palette: ["#ff48b0", "#0078bf", "#ffe800", "#f6f0e1"],
  params: [
    param("drift", "Terrain drift", 0, 3, 1),
    param("height", "Agent peaks", 0, 2, 0.9),
    param("dots", "Halftone dot size", 0.5, 2.5, 1),
    param("misreg", "Misregistration", 0, 3, 1),
    param("grain", "Ink grain", 0, 2, 1),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
