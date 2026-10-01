import { param, type BuiltInScene } from "./param.js";

const SOURCE = `float farY(float x) { return -0.02 + 0.03 * sin(x * 1.9 + 0.6) + 0.018 * sin(x * 4.3 + 2.0); }

float grass(vec2 p, float cw, float hMin, float hMax, float w, float seed, float wid, float heads, float arch) {
  float y0 = -0.56;
  float cx = floor(p.x / cw);
  float cov = 0.0;
  for (int i = -3; i <= 3; i++) {
    float c = cx + float(i);
    float h1 = hash21(vec2(c, seed));
    float h2 = hash21(vec2(c, seed + 7.3));
    float h3 = hash21(vec2(c, seed + 13.1));
    float x0 = (c + 0.15 + 0.7 * h1) * cw;
    float H = mix(hMin, hMax, h2) * mix(0.55, 1.0, smoothstep(0.15, 0.85, abs(x0)));
    float leaf = step(h2, arch);
    float bend = (clamp(w * (0.6 + 0.8 * h1), -1.8, 1.8) * 0.08 + (h3 - 0.5) * mix(0.1, 0.75, leaf)) * H;
    bend = clamp(bend, -2.8 * cw, 2.8 * cw);
    float k = clamp((p.y - y0) / H, 0.0, 1.0);
    float bx = x0 + bend * k * k;
    float wd = cw * wid * mix(1.0, 1.6, leaf) * (1.0 - 0.8 * k) * sqrt(1.0 + pow(2.0 * bend * k / H, 2.0));
    float blade = smoothstep(wd * 1.2, wd * 0.25, abs(p.x - bx)) * step(p.y, y0 + H);
    vec2 dir = normalize(vec2(2.0 * bend / H, 1.0));
    vec2 hd = p - (vec2(x0 + bend, y0 + H) + dir * 0.014);
    float e = length(vec2(dot(hd, dir) / 0.018, (hd.x * dir.y - hd.y * dir.x) / (cw * wid * 0.7)));
    float head = smoothstep(1.0, 0.75, e) * step(1.0 - heads, h2);
    cov = max(cov, max(blade, head));
  }
  return cov;
}

vec3 meadow(vec2 p, vec2 w, float t) {
  vec3 I = u_palette[0];
  vec3 V = u_palette[1];
  vec3 Y = u_palette[2];
  vec3 K = u_palette[3];
  vec3 paper = vec3(0.97, 0.94, 0.88);
  float fy = farY(p.x);

  float sy = clamp((p.y - fy) / 0.5, 0.0, 1.0);
  vec3 glow = mix(mix(K, paper, 0.4), mix(Y, paper, 0.2), smoothstep(0.14, 0.0, sy) * 0.8);
  vec3 col = mix(glow, mix(K, V, 0.55), smoothstep(0.03, 0.3, sy));
  col = mix(col, mix(I, V, 0.3), smoothstep(0.3, 0.9, sy));
  float cl = noise(vec2(p.x * 1.4 - t * 0.03, p.y * 3.0 + 1.7));
  vec3 cloudC = mix(V, K, smoothstep(0.55, 0.1, sy)) * 0.95;
  col = mix(col, cloudC, smoothstep(0.5, 0.72, cl) * 0.6 * smoothstep(0.08, 0.25, sy));

  float mt = fy - 0.045 + 0.012 * sin(p.x * 2.7 + 1.0);
  float tl = fy + 0.03 * noise(vec2(p.x * 8.0, 1.0)) + 0.015 * noise(vec2(p.x * 21.0, 4.0));
  vec3 tc = mix(I, V, 0.3 + 0.3 * noise(p * vec2(6.0, 9.0)));
  float mist = noise(vec2(p.x * 2.0 - t * 0.04, 7.0));
  tc = mix(tc, mix(V, K, 0.45), smoothstep(mt + 0.05, mt, p.y) * (0.35 + 0.4 * mist));
  col = mix(col, tc, smoothstep(tl + 0.004, tl - 0.004, p.y));

  float md = clamp((mt - p.y) / 0.3, 0.0, 1.0);
  vec3 mc = mix(mix(V, K, 0.35), mix(I, V, 0.5), smoothstep(0.0, 1.0, md));
  mc = mix(mc, mix(K, Y, 0.3), smoothstep(0.045, 0.0, mt - p.y) * 0.55);
  mc = mix(mc, mix(V, K, 0.5), 0.3 * smoothstep(0.45, 0.75, noise(vec2(p.x * 2.5 + 3.0, p.y * 6.0))));
  mc = mix(mc, mix(K, V, 0.25), smoothstep(0.66, 0.8, noise(p * 4.5 + 20.0)) * 0.55);
  col = mix(col, mc, smoothstep(mt + 0.004, mt - 0.004, p.y));

  float r2 = fy - 0.16 + 0.035 * sin(p.x * 1.1 + 0.3) + 0.012 * sin(p.x * 3.3 + 1.0);
  vec3 hc = mix(I, V, 0.4 + 0.2 * noise(vec2(p.x * 3.0, p.y * 5.0 + 2.0)));
  hc = mix(hc, mix(K, V, 0.35), smoothstep(0.04, 0.0, r2 - p.y) * 0.6);
  hc = mix(hc, mix(K, V, 0.4), smoothstep(0.68, 0.82, noise(p * 3.8 + 41.0)) * 0.5);
  col = mix(col, hc, smoothstep(r2 + 0.004, r2 - 0.004, p.y));

  float gm = grass(p, 0.02, 0.14, 0.3, w.y, 3.0, 0.22, 0.2, 0.45);
  col = mix(col, mix(I, V, 0.4) * 0.8, gm * 0.9);
  float gy = -0.47 + 0.035 * noise(vec2(p.x * 5.0, 0.0));
  col = mix(col, mix(I, V, 0.35) * 0.82, smoothstep(gy + 0.02, gy - 0.04, p.y));
  float gn = grass(p, 0.034, 0.2, 0.52, w.x, 11.0, 0.17, 0.22, 0.55);
  col = mix(col, mix(I, V, 0.15) * 0.62, gn);
  return col;
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  vec3 Y = u_palette[2];
  vec3 K = u_palette[3];
  vec3 core = mix(Y, vec3(1.0, 0.99, 0.9), 0.55);
  vec3 red = vec3(0.95, 0.12, 0.08);

  vec2 dp = p - toP(u_pointer);
  float pt = exp(-dot(dp, dp) / 0.01);
  float wt = t * p_wind;
  float w1 = 0.55 * sin(p.x * 2.3 - wt * 1.3 + p.y * 1.5) + 0.9 * (noise(vec2(p.x * 1.2 - wt * 0.8, wt * 0.1)) - 0.45);
  float w2 = 0.5 * sin(p.x * 1.7 - wt * 0.7 + 1.0) + 0.6 * (noise(vec2(p.x * 0.9 - wt * 0.45, 3.0)) - 0.45);
  float gust = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    gust += exp(-pow((dist - r.z * 0.3) * 6.0, 2.0)) * exp(-r.z * 0.6);
  }
  float push = pt * sign(dp.x) * 1.4 + gust * 1.2;
  vec2 w = vec2(w1 + push, w2 + push * 0.6);

  vec2 wv = vec2(fbm(p * 2.4 + vec2(0.0, t * 0.02)), fbm(p * 2.4 + vec2(5.2, 1.3) - vec2(t * 0.016, 0.0)));
  vec2 fe = vec2(noise(p * 48.0), noise(p * 48.0 + 9.1)) - 0.5;
  vec2 q = p + ((wv - 0.5) * 0.05 + fe * 0.008) * p_wet - dp * pt * 0.04;
  vec3 c0 = meadow(q, w, t);
  vec3 c1 = meadow(q + vec2(0.005, 0.008), w, t);

  float calm = 1.0 - 0.75 * smoothstep(0.12, 0.42, p.y);
  float edge = smoothstep(0.03, 0.22, length(c0 - c1));
  vec3 col = mix(c0, pow(min(c0, c1), vec3(1.35)) * 0.92, edge * 0.55);

  float bn = noise(p * 2.6 + wv * 1.6 + 11.0) * 0.75 + noise(p * 11.0 + wv * 3.0) * 0.18 + noise(p * 38.0) * 0.07;
  float inb = smoothstep(0.656, 0.664, bn);
  float rimIn = inb * smoothstep(0.73, 0.66, bn);
  col = mix(col, pow(col, vec3(0.7)), inb * 0.5 * p_wet);
  col = pow(col, vec3(1.0 + rimIn * 0.8 * p_wet * calm));
  col = mix(col, pow(col, vec3(0.8)), pt * 0.4);

  col = pow(col, vec3(1.0 + (noise(vec2(q.x * 40.0, q.y * 2.0)) - 0.5) * 0.2 * p_wet * calm));
  float g = noise(p * min(u_resolution.y / 2.5, 220.0));
  float valley = noise(p * 30.0 + 5.0);
  float lum = dot(col, vec3(0.3, 0.55, 0.15));
  float gw = (0.35 + clamp((col.b - col.g) * 1.5, 0.0, 1.0)) * (1.0 - lum * 0.6) * calm;
  col = pow(col, vec3(1.0 + ((g - 0.5) * (0.5 + 0.5 * valley) + (valley - 0.5) * 0.15) * 0.7 * p_grain * gw));

  float ax = u_resolution.x / u_resolution.y;
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    vec2 s = vec2(fi * 7.13, fi * 3.71);
    vec2 hp = vec2(hash21(s), hash21(s + 1.7));
    float xs = hp.x * 2.0 - 1.0;
    xs = sign(xs) * pow(abs(xs), 0.55);
    vec2 fp = vec2(xs * 0.5 * ax, mix(-0.44, 0.14, hp.y));
    fp += vec2(0.08 * sin(t * 0.21 * (1.0 + hp.y) + fi * 2.1), 0.045 * sin(t * 0.37 * (1.0 + hp.x) + fi));
    float blink = smoothstep(0.0, 0.8, sin(t * (0.6 + 0.5 * hash21(s + 9.1)) + fi * 2.3));
    vec2 d = p - fp + (wv - 0.5) * 0.02;
    float d2 = dot(d, d);
    float r = 0.0085 * p_size * (0.7 + 0.6 * hash21(s + 4.4));
    float halo = exp(-d2 / (r * r * 22.0)) * blink * p_motes;
    col = 1.0 - (1.0 - col) * (1.0 - Y * clamp(halo * 0.85, 0.0, 1.0));
    col = mix(col, core, smoothstep(r, r * 0.3, sqrt(d2)) * blink * min(p_motes, 1.0));
  }

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    vec2 base = toP(a.xy);
    float ph = t * 1.1 + fi * 1.7;
    vec2 head = base + vec2(0.04 * sin(ph), 0.02 * sin(ph * 2.0 + 0.5)) * (1.0 - waiting);
    float R = 0.01 * p_size;
    vec2 d = p - head + (wv - 0.5) * 0.012;
    float dl = length(d);
    float pulse = 0.5 + 0.5 * sin(t * 2.4 + fi);
    float bright = mix(0.9 + 0.1 * sin(t * 11.0 + fi * 3.0), 0.45 + 0.55 * pulse, waiting);
    vec3 hue = mix(Y, mix(Y, K, 0.6), waiting);
    float halo = exp(-dl * dl / (R * R * 32.0)) * bright * a.w;
    col = 1.0 - (1.0 - col) * (1.0 - hue * halo * 0.9);
    float body = smoothstep(R * 1.8, R * 1.5, dl);
    float brim = exp(-pow((dl - R * 1.7) / (R * 0.2), 2.0));
    col = mix(col, mix(hue, core, 0.3), body * 0.5 * a.w * bright);
    col = mix(col, hue * 0.6 + K * 0.1, brim * 0.3 * a.w);
    col = mix(col, core, smoothstep(R, R * 0.25, dl) * a.w * bright);
    if (waiting > 0.5) {
      float f = fract(t * 0.5 + fi * 0.3);
      float ring = exp(-pow((dl - R * (2.5 + 6.0 * f)) / (R * 0.35), 2.0)) * (1.0 - f);
      col = mix(col, K, ring * 0.75 * a.w);
    } else {
      for (int k = 1; k <= 6; k++) {
        float fk = float(k);
        float tk = ph - fk * 0.2;
        vec2 tp = base + vec2(0.04 * sin(tk), 0.02 * sin(tk * 2.0 + 0.5));
        vec2 td = p - tp;
        float tr = R * (0.9 - fk * 0.1);
        float tg = exp(-dot(td, td) / (tr * tr * 3.0)) * (1.0 - fk / 7.0) * a.w;
        col = 1.0 - (1.0 - col) * (1.0 - Y * tg * 0.75);
      }
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float ks = r.w > 1.5 ? 0.5 : 1.0;
    float isErr = abs(r.w - 1.0) < 0.5 ? 1.0 : 0.0;
    float rad = (0.03 + 0.2 * (1.0 - exp(-r.z * 1.1))) * ks;
    vec2 dir = d / max(dist, 1e-4);
    float rf = rad * (0.85 + 0.3 * noise(dir * 2.5 + r.xy * 31.0 + wv));
    float fade = exp(-r.z * 0.75);
    float body = clamp(smoothstep(rf, rf - 0.02, dist) * fade * (1.0 - 0.4 * dist / max(rf, 1e-3)), 0.0, 1.0);
    vec3 lit = 1.0 - (1.0 - col) * (1.0 - Y * body * 0.65);
    col = mix(lit, mix(col, red, body * 0.9), isErr);
    float rr = exp(-pow((dist - rf) * 110.0, 2.0)) * fade;
    col = mix(col, mix(Y * 0.5, red * 0.5, isErr), rr * 0.75);
    float ang = atan(d.y, d.x);
    float sp = pow(0.5 + 0.5 * cos(ang * 9.0 + r.x * 50.0), 20.0) * exp(-pow((dist - rf * 1.25) * 60.0, 2.0)) * fade;
    col = 1.0 - (1.0 - col) * (1.0 - mix(mix(Y, core, 0.5), vec3(1.0, 0.3, 0.2), isErr) * sp);
  }

  float pf = min(u_resolution.y / 4.0, 160.0);
  float pn = noise(p * pf) * 0.6 + noise(p * pf * 0.47 + 4.0) * 0.4;
  col *= 0.94 + 0.09 * pn;
  col = mix(col, vec3(0.97, 0.94, 0.88), 0.03);
  return mix(u_canvas, col, p_color);
}`;

export const fireflies: BuiltInScene = {
  id: "fireflies",
  name: "Fireflies",
  source: SOURCE,
  palette: ["#1d2266", "#6b3fb5", "#ffe14d", "#ff5fa2"],
  params: [
    param("size", "Firefly size", 0.2, 3, 1.2),
    param("motes", "Firefly swarm", 0, 2, 0.9),
    param("wind", "Grass sway", 0, 3, 1),
    param("wet", "Wetness (blooms & bleed)", 0, 2, 1),
    param("grain", "Granulation", 0, 2, 1),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
