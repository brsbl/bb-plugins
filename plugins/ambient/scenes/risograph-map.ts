import { param, type BuiltInScene } from "./param.js";

const SOURCE = `const vec3 INK = vec3(0.07, 0.06, 0.08);

vec2 rotA(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
float fillD(float d) { float w = fwidth(d) * 0.75 + 1e-4; return smoothstep(w, -w, d); }
float strokeD(float d, float lw) { float w = fwidth(d) * 0.75 + 1e-4; return smoothstep(lw + w, lw - w, abs(d)); }

// Ben-Day dots: a tone becomes a 45-degree grid of ink dots
float benday(vec2 p, float tone) {
  vec2 g = rotA(p, 0.785) * (95.0 / p_dots);
  float r = 0.72 * sqrt(clamp(tone, 0.0, 1.0));
  float d = length(fract(g) - 0.5);
  float w = fwidth(d) + 1e-4;
  return smoothstep(r + w, r - w, d);
}

// a jagged comic burst; spikes vary in length
float burst(vec2 q, float r, float n, float jag, float seed) {
  float a = atan(q.y, q.x) + 3.1416;
  float k = a * n / 6.2832;
  float s = 1.0 - abs(fract(k) - 0.5) * 2.0;
  float h = hash21(vec2(floor(k), seed));
  return (length(q) - r * (1.0 - jag + jag * s * (0.65 + 0.35 * h))) * 0.8;
}

vec3 tint(vec3 base, vec3 ink, float cov) { return base * mix(vec3(1.0), ink, cov); }

// one panel's art: rgb plus a black-ink line mask
vec4 panelArt(int kind, vec2 q, vec2 hs, float t, float lw) {
  vec3 paper = u_palette[3], red = u_palette[0], blue = u_palette[1], yel = u_palette[2];
  vec3 col = paper;
  float ink = 0.0;
  if (kind == 0) {
    // flying saucer beaming down over a dotted night sky
    float ty = clamp(q.y / hs.y * 0.5 + 0.5, 0.0, 1.0);
    col = tint(col, blue, benday(q, 0.06 + 0.32 * ty));
    float sp = hash21(floor(q * 26.0));
    col = mix(col, paper, smoothstep(0.12, 0.0, length(fract(q * 26.0) - 0.5)) * step(0.975, sp) * step(0.45, ty));
    vec2 c = vec2(0.35 * hs.x * sin(t * 0.35), 0.28 * hs.y + 0.025 * sin(t * 1.2));
    float R = hs.y * 0.5;
    vec2 s = rotA(q - c, 0.12 * sin(t * 0.6));
    if (s.y < 0.0) {
      float bw = R * 0.25 + (-s.y) * 0.45;
      float beam = step(abs(s.x), bw) * smoothstep(-hs.y * 1.6, -R * 0.1, s.y);
      col = mix(col, tint(paper, yel, 0.15 + 0.85 * benday(q, 0.5)), beam * 0.85);
      ink = max(ink, strokeD(abs(s.x) - bw, lw * 0.6) * smoothstep(-hs.y * 1.2, -R * 0.15, s.y));
    }
    float dome = max(length(s - vec2(0.0, R * 0.08)) - R * 0.42, -(s.y - R * 0.08));
    float disc = (length(s / vec2(R, R * 0.24)) - 1.0) * R * 0.24;
    vec3 dc = mix(tint(paper, blue, 0.35), paper, smoothstep(0.0, R * 0.3, s.y - R * 0.2 + s.x * 0.4));
    col = mix(col, dc, fillD(dome));
    vec3 hull = mix(tint(paper, blue, 0.55) * 0.75, tint(paper, blue, 0.15), smoothstep(-R * 0.2, R * 0.2, s.y));
    col = mix(col, hull, fillD(disc));
    float lights = fillD(length(vec2(fract(s.x / (R * 0.28) + t * 0.6) - 0.5, (s.y + R * 0.02) / (R * 0.28))) - 0.22);
    col = mix(col, mix(yel, red, step(0.5, fract(s.x / (R * 0.56) + t * 0.3))), lights * fillD(disc + R * 0.05));
    ink = max(ink, max(strokeD(dome, lw), strokeD(disc, lw)));
  } else if (kind == 1) {
    // rocket ship tearing past speed lines
    col = tint(col, yel, 0.3);
    float row = floor(q.y * 34.0);
    float hr = hash21(vec2(row, 3.0));
    float xs = fract(q.x * (0.8 + hr) / hs.x * 0.5 + t * (0.6 + 0.6 * hr) + hr * 7.0);
    float taper = smoothstep(0.0, 0.08, xs) * smoothstep(0.7, 0.3, xs);
    float streak = strokeD((fract(q.y * 34.0) - 0.5) / 34.0, 0.0022 * taper) * step(0.84, hr) * step(0.01, taper);
    col = mix(col, INK, streak);
    float R = hs.y * 0.62;
    float lx = mod(t * 0.12 * hs.x * 4.0, hs.x * 3.6) - hs.x * 1.8;
    vec2 c = vec2(lx, -0.05 * hs.y + 0.03 * sin(t * 1.5));
    vec2 s = rotA(q - c, -0.12);
    float body = segD(s, vec2(-R * 0.5, 0.0), vec2(R * 0.35, 0.0)) - R * 0.2 * (1.0 - 0.85 * smoothstep(R * 0.05, R * 0.6, s.x));
    float fin = segD(vec2(s.x, abs(s.y)), vec2(-R * 0.3, R * 0.15), vec2(-R * 0.68, R * 0.42)) - R * 0.07;
    float win = length(s - vec2(R * 0.12, R * 0.02)) - R * 0.085;
    if (s.x < -R * 0.5) {
      float fl = length((s + vec2(R * 0.55, 0.0)) / vec2(R * (0.45 + 0.12 * sin(t * 23.0)), R * 0.16)) - 1.0;
      col = mix(col, mix(red, yel, smoothstep(0.0, -0.6, fl)), fillD(fl));
      ink = max(ink, strokeD(fl * R * 0.16, lw * 0.7));
    }
    col = mix(col, red * 0.92, fillD(fin));
    col = mix(col, mix(paper, tint(paper, blue, 0.3), smoothstep(R * 0.2, -R * 0.2, s.y)), fillD(body));
    col = mix(col, red, fillD(body) * step(abs(s.x + R * 0.12), R * 0.06));
    col = mix(col, tint(paper, blue, 0.7), fillD(win));
    ink = max(ink, max(strokeD(min(body, fin), lw), strokeD(win, lw * 0.8)));
  } else if (kind == 2) {
    // POW: a jagged burst over radiating action lines
    col = tint(col, blue, benday(q, 0.1 + 0.15 * length(q) / hs.y));
    float a = atan(q.y, q.x);
    float lines = step(0.95, fract(a * 9.0 / 3.1416 + hash21(vec2(floor(a * 18.0 / 3.1416), 1.0)) * 0.3)) * smoothstep(hs.y * 0.3, hs.y * 0.8, length(q));
    col = mix(col, INK, lines * 0.8);
    float R = hs.y * (0.62 + 0.05 * sin(t * 2.2));
    vec2 s = rotA(q, 0.05 * sin(t * 0.9));
    float b1 = burst(s, R, 13.0, 0.42, 1.0);
    float b2 = burst(rotA(s, 0.4), R * 0.58, 11.0, 0.4, 2.0);
    col = mix(col, tint(paper, red, 0.95), fillD(b1));
    col = mix(col, tint(paper, yel, 0.95), fillD(b2));
    col = mix(col, tint(paper, red, 0.5), fillD(b2) * benday(s * 1.3, 0.25));
    ink = max(ink, max(strokeD(b1, lw * 1.2), strokeD(b2, lw)));
  }
  return vec4(col, ink);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * p_drift;
  vec3 paper = u_palette[3], red = u_palette[0], blue = u_palette[1], yel = u_palette[2];
  float W = 0.5 * u_resolution.x / u_resolution.y;
  float lw = 0.0014 * p_ink;

  // the page: two tiers of panels with slanted gutters
  float gut = 0.022;
  float ry = 0.04 + 0.05 * p.x / W;
  float dRow = abs(p.y - ry) / 1.001;
  bool topRow = p.y > ry;
  float b1 = 0.15 * W + 0.06 * (p.y - 0.27);
  int pid;
  float dCol;
  vec2 ctr, hs;
  if (topRow) {
    dCol = abs(p.x - b1) / 1.002;
    if (p.x < b1) { pid = 0; ctr = vec2(-0.42 * W, 0.27); hs = vec2(0.58 * W, 0.23); }
    else { pid = 2; ctr = vec2(0.58 * W, 0.27); hs = vec2(0.42 * W, 0.23); }
  } else {
    dCol = 1.0;
    pid = 1; ctr = vec2(0.0, -0.23); hs = vec2(W, 0.27);
  }
  float dEdge = min(W - abs(p.x), 0.5 - abs(p.y));
  float border = min(min(dRow, dCol), dEdge);

  vec2 q = p - ctr;
  vec2 mis = vec2(0.0028, -0.002) * p_misreg;
  vec4 art = panelArt(pid, q + mis, hs, t, lw);
  vec4 key = panelArt(pid, q, hs, t, lw);
  vec3 col = art.rgb;
  col = mix(col, INK, key.a);
  float frame = smoothstep(gut + lw * 2.5 + 0.001, gut + lw * 2.5, border);
  col = mix(col, INK, frame);
  col = mix(col, paper, smoothstep(gut + 0.0008, gut, border));

  // agents: little rockets on patrol; waiting ones raise a "!" balloon
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    vec2 c0 = toP(a.xy);
    vec2 d = p - c0;
    if (dot(d, d) > 0.012) continue;
    float R = 0.028 * a.w;
    if (a.z > 0.5) {
      float bob = 1.0 + 0.08 * sin(u_time * 4.0 + fi);
      vec2 b = d / bob;
      float bal = (length(b / vec2(1.25, 1.0)) - R * 1.1);
      float tail = segD(b, vec2(-R * 0.3, -R * 0.8), vec2(-R * 0.9, -R * 1.5)) - R * 0.12;
      float sh = min(bal, tail);
      col = mix(col, paper, fillD(sh));
      col = mix(col, INK, strokeD(sh, lw));
      float bang = min(segD(b, vec2(0.0, R * 0.55), vec2(0.0, -R * 0.15)) - R * 0.14, length(b + vec2(0.0, R * 0.55)) - R * 0.15);
      col = mix(col, red, fillD(bang));
    } else {
      float ph = u_time * 1.2 + fi * 1.7;
      vec2 c = vec2(0.03 * cos(ph), 0.03 * sin(ph));
      vec2 s = rotA(d - c, -(ph + 1.5708));
      float body = segD(s, vec2(-R * 0.5, 0.0), vec2(R * 0.4, 0.0)) - R * 0.22 * (1.0 - 0.85 * smoothstep(R * 0.05, R * 0.6, s.x));
      float fin = segD(vec2(s.x, abs(s.y)), vec2(-R * 0.3, R * 0.15), vec2(-R * 0.65, R * 0.4)) - R * 0.08;
      float fl = length((s + vec2(R * 0.6, 0.0)) / vec2(R * (0.4 + 0.1 * sin(u_time * 25.0 + fi)), R * 0.15)) - 1.0;
      col = mix(col, mix(red, yel, smoothstep(0.0, -0.6, fl)), fillD(fl) * a.w);
      col = mix(col, red, fillD(fin) * a.w);
      col = mix(col, paper, fillD(body) * a.w);
      col = mix(col, INK, strokeD(min(body, fin), lw) * a.w);
    }
  }

  // events land as impact bursts: yellow for a finished turn, red for an error
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    if (r.z > 1.6) continue;
    vec2 d = p - toP(r.xy);
    float isErr = step(abs(r.w - 1.0), 0.5);
    float grow = smoothstep(0.0, 0.35, r.z) * (1.0 - smoothstep(1.1, 1.6, r.z));
    float R = (r.w > 1.5 ? 0.04 : 0.07) * grow;
    if (R < 0.002) continue;
    float b = burst(rotA(d, r.x * 9.0), R, 12.0, 0.45, r.x * 50.0);
    float bi = burst(rotA(d, r.x * 9.0 + 0.3), R * 0.55, 9.0, 0.4, r.y * 50.0);
    col = mix(col, mix(yel, red, isErr), fillD(b));
    col = mix(col, mix(paper, yel, isErr), fillD(bi));
    col = mix(col, INK, strokeD(b, lw));
  }

  // pulpy newsprint: yellowed fibres, flecks, and a darkened edge of age
  float fib = noise(p * vec2(40.0, 380.0)) * 0.5 + noise(p * vec2(300.0, 60.0)) * 0.5;
  col *= 0.95 + 0.06 * fib;
  col = mix(col, col * vec3(1.0, 0.94, 0.8), p_age * (0.25 + 0.35 * smoothstep(0.35, 0.75, length(uv - 0.5))));
  col = mix(col, INK, step(0.995, hash21(floor(p * 420.0))) * 0.3 * p_age);
  return mix(u_canvas, col, p_color);
}`;

export const risographMap: BuiltInScene = {
  id: "risograph-map",
  name: "Atomic Comics",
  source: SOURCE,
  palette: ["#e23b2e", "#2b78cf", "#ffd23f", "#f3e6c8"],
  params: [
    param("drift", "Action speed", 0, 3, 1),
    param("dots", "Ben-Day dot size", 0.5, 2.5, 1),
    param("ink", "Ink line weight", 0.5, 3, 1.4),
    param("misreg", "Misregistration", 0, 3, 1),
    param("age", "Newsprint age", 0, 2, 1),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
