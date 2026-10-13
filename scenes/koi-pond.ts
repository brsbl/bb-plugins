import { param, type BuiltInScene } from "./param.js";

const SOURCE = `const vec3 LD = vec3(-0.4, 0.5, 0.77);
// 0 kohaku, 1 tancho, 2 sanke, 3 showa, 4 yamabuki ogon, 5 asagi, 6 orenji ogon
const int KINDS[9] = int[9](0, 3, 4, 1, 2, 5, 6, 0, 3);

float bodyHW(float u) {
  if (u > 0.15) { float k = (u - 0.15) / 0.85; return 0.29 * sqrt(max(1.0 - k * k, 0.0)); }
  float k = clamp((u + 0.72) / 0.87, 0.0, 1.0);
  return 0.075 + 0.215 * pow(sin(1.5708 * k), 1.2);
}

vec2 toLocal(vec2 p, vec2 c, float ang, float L) {
  vec2 q = p - c;
  float ca = cos(ang), sa = sin(ang);
  return vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y) / L;
}

// a fan-shaped fin rooted at o, sweeping along d; x = coverage, y = along-fin 0..1, z = ray shading
vec3 finFan(vec2 l, vec2 o, vec2 d, float len, float wid, float aa) {
  vec2 r = l - o;
  float a = dot(r, d), b = dot(r, vec2(-d.y, d.x));
  float along = clamp(a / len, 0.0, 1.0);
  float e = length(vec2((a - len * 0.5) / (len * 0.5), b / (wid * (0.4 + 0.6 * along))));
  float m = smoothstep(1.0, 1.0 - aa / wid, e);
  return vec3(m, along, 0.78 + 0.22 * sin(atan(b, a + 0.03) * 30.0));
}

vec4 koi(vec2 p, vec2 c, float ang, float L, float ph, int kind, float seed) {
  vec2 l = toLocal(p, c, ang, L);
  if (dot(l, l) > 1.9) return vec4(0.0);
  float ca = cos(ang), sa = sin(ang);
  float u = l.x;
  float v = l.y - 0.09 * sin(2.4 * u - ph) * pow(max(1.0 - u, 0.0) * 0.5, 1.6);
  float aa = 2.5 / (u_resolution.y * L);
  float hw = bodyHW(u);
  float vn = clamp(v / max(hw, 1e-3), -1.0, 1.0);
  float body = smoothstep(0.0, aa, hw - abs(v)) * smoothstep(-0.76, -0.7, u);

  vec3 white = u_palette[2];
  vec3 red = u_palette[3];
  vec3 blk = vec3(0.05, 0.05, 0.06);
  vec3 gold = vec3(0.98, 0.74, 0.24);

  // forked caudal fin
  float tu = -(u + 0.66);
  float tw = 0.05 + max(tu, 0.0) * 0.6;
  float fin = step(0.0, tu) * smoothstep(0.0, aa, tw - abs(v)) * smoothstep(0.0, aa, 0.24 + 0.95 * abs(v) - tu) * smoothstep(0.0, aa, 0.56 - tu);
  float rays = fin * (0.78 + 0.22 * sin(v / (tu + 0.1) * 30.0));
  float finRoot = 0.0;
  // paired pectoral and pelvic fins, paddling out of phase
  for (int k = 0; k < 2; k++) {
    float s = k == 0 ? 1.0 : -1.0;
    float fa = 0.95 + 0.3 * sin(ph * 0.5 + s * 1.3);
    vec3 pf = finFan(vec2(u, v), vec2(0.45, s * 0.2), vec2(-cos(fa), s * sin(fa)), 0.32, 0.12, aa);
    float fb = 0.7 + 0.15 * sin(ph * 0.5 + s);
    vec3 vf = finFan(vec2(u, v), vec2(-0.22, s * 0.13), vec2(-cos(fb), s * sin(fb)), 0.17, 0.06, aa);
    fin = max(fin, max(pf.x, vf.x));
    rays = max(rays, max(pf.x * pf.z, vf.x * vf.z));
    finRoot = max(finRoot, pf.x * smoothstep(0.55, 0.1, pf.y));
  }
  float dorsal = smoothstep(0.03, 0.03 - aa, abs(v - 0.02 * sin(ph))) * smoothstep(-0.5, -0.4, u) * smoothstep(0.2, 0.12, u);

  // variety pattern, laid out on the unbent body
  float n1 = noise(vec2(u * 2.3 + seed * 13.0, vn * 1.2 + seed * 7.0));
  float n2 = noise(vec2(u * 4.5 + seed * 5.0, vn * 2.2 - seed * 3.0));
  float back = smoothstep(0.95, 0.75, abs(vn));
  float hi = smoothstep(0.47, 0.5, n1 + 0.22 * smoothstep(0.55, 0.8, u) - 0.12 * smoothstep(0.0, -0.5, u))
    * back * smoothstep(-0.5, -0.4, u) * smoothstep(0.97, 0.9, u);
  vec3 base = white;
  vec3 finC = white;
  float metal = 0.0;
  float net = 0.12;
  if (kind == 0) {
    base = mix(white, red, hi);
  } else if (kind == 1) {
    base = mix(white, red, smoothstep(0.11, 0.1, length(vec2(u - 0.68, v * 1.1))));
  } else if (kind == 2) {
    base = mix(mix(white, red, hi), blk, smoothstep(0.64, 0.67, n2) * smoothstep(0.55, 0.4, u) * back);
  } else if (kind == 3) {
    base = mix(mix(blk, white, smoothstep(0.52, 0.55, n2)), red, hi);
    finC = mix(white, blk, finRoot);
  } else if (kind == 4) {
    base = gold; finC = gold; metal = 1.0;
  } else if (kind == 5) {
    base = mix(vec3(0.4, 0.52, 0.62), mix(red, gold, 0.3), smoothstep(0.6, 0.85, abs(vn)));
    base = mix(base, vec3(0.86, 0.88, 0.87), smoothstep(0.62, 0.85, u));
    finC = mix(white, red, 0.55 * finRoot + 0.2);
    net = 0.35;
  } else {
    base = mix(red, gold, 0.5); finC = base; metal = 0.75;
  }

  // scales: offset rows of crescents on the trunk; the head is bare
  vec2 sg = vec2(u * 12.0, v * 12.0);
  sg.y += 0.5 * mod(floor(sg.x), 2.0);
  float sd = length(vec2(fract(sg.x), fract(sg.y) - 0.5));
  float scale = smoothstep(0.5, 0.62, sd) * smoothstep(0.85, 0.7, sd) * smoothstep(0.6, 0.45, u) * smoothstep(-0.72, -0.6, u);
  base *= 1.0 - net * scale;

  // rounded body: a normal from the cross-section, rolling off at snout and tail
  float nz = sqrt(max(1.0 - vn * vn, 0.0));
  float nx = 0.8 * smoothstep(0.6, 1.0, u) - 0.3 * smoothstep(0.0, -0.7, u);
  vec3 n = normalize(vec3(nx * nz, vn, nz * 1.2 + 0.05));
  vec3 nw = vec3(ca * n.x - sa * n.y, sa * n.x + ca * n.y, n.z);
  vec3 ld = normalize(LD);
  float dif = max(dot(nw, ld), 0.0);
  float spec = pow(max(dot(nw, normalize(ld + vec3(0.0, 0.0, 1.0))), 0.0), mix(44.0, 18.0, metal));
  vec3 bc = base * (0.3 + 0.82 * dif) * (0.55 + 0.45 * nz);
  bc += mix(vec3(1.0), base, metal * 0.6) * spec * mix(0.5, 1.0, metal) * (1.0 - 0.5 * scale);
  bc *= 1.0 - 0.3 * smoothstep(0.03, 0.0, abs(u - 0.6 + 0.12 * vn * vn)) * nz;
  float eye = smoothstep(0.045, 0.03, length(vec2(u - 0.8, abs(v) - hw * 0.8)));
  bc = mix(bc, vec3(0.04), eye);
  vec3 dc = mix(finC, base, 0.4) * (0.5 + 0.6 * dif);
  bc = mix(bc, dc, dorsal * 0.7 * body);

  vec3 col = finC * (0.62 + 0.4 * rays / max(fin, 1e-3));
  col = mix(col, bc, body);
  return vec4(col, max(fin * 0.6, body));
}

// the shadow a fish throws on the pond floor, softer the higher it swims
float koiShadow(vec2 p, vec2 c, float ang, float L, float blur) {
  vec2 l = toLocal(p, c, ang, L);
  if (dot(l, l) > 2.6) return 0.0;
  float k = 1.0 + 1.5 * blur;
  float s = exp(-(pow((l.x - 0.05) / 0.85, 2.0) + pow(l.y / 0.24, 2.0)) * 3.0 / k);
  s = max(s, 0.6 * exp(-(pow(l.x - 0.35, 2.0) / 0.02 + l.y * l.y / 0.12) / k));
  s = max(s, 0.6 * exp(-(pow(l.x + 0.92, 2.0) / 0.03 + l.y * l.y / 0.05) / k));
  return s;
}

void fishAt(int i, float t, float ax, out vec2 c, out float ang, out float L, out float dep, out float ph) {
  float fi = float(i);
  float h1 = hash21(vec2(fi, 3.1)), h2 = hash21(vec2(fi, 7.7)), h3 = hash21(vec2(fi, 11.3)), h4 = hash21(vec2(fi, 17.9));
  float T = t * p_swim;
  float w1 = 0.06 + 0.04 * h3, w2 = 0.1 + 0.05 * h4;
  float A = 0.46 * ax, B = 0.36;
  float a1 = T * w1 + 6.2832 * h1, a2 = T * w2 + 6.2832 * h2;
  c = vec2(A * sin(a1), B * sin(a2));
  vec2 vel = vec2(A * w1 * cos(a1), B * w2 * cos(a2));
  if (h1 < 0.5) { c.x = -c.x; vel.x = -vel.x; }
  ang = atan(vel.y, vel.x);
  dep = 0.85 - 0.75 * fi / max(p_count - 1.0, 1.0);
  L = (0.095 + 0.035 * h2) * p_size * (1.0 - 0.2 * dep);
  ph = u_time * (2.0 + 2.0 * min(p_swim, 2.0)) + h1 * 20.0;
}

// lily pads and lotus floating on the surface; grow > 1 gives the soft shadow footprint
vec4 pads(vec2 p, float t, float grow) {
  vec4 outC = vec4(0.0);
  vec3 ld = normalize(LD);
  for (int l = 0; l < 2; l++) {
    float lane = l == 0 ? 0.43 : -0.45;
    if (abs(p.y - lane) > 0.2) continue;
    float cw = 0.26;
    float px = p.x + t * (l == 0 ? 0.006 : -0.005);
    for (int j = -1; j <= 1; j++) {
      float ci = floor(px / cw) + float(j);
      float h = hash21(vec2(ci, float(l) * 5.0 + 2.0));
      if (h < 1.0 - 0.7 * p_pads) continue;
      float h2 = hash21(vec2(ci, 31.0 + float(l)));
      float h3 = hash21(vec2(ci, 47.0 + float(l)));
      vec2 cc = vec2((ci + 0.5 + 0.5 * (h2 - 0.5)) * cw, lane + 0.06 * (h3 - 0.5));
      vec2 d = vec2(px, p.y) - cc;
      float dist = length(d);
      float r = (0.05 + 0.04 * h2) * grow;
      float a = atan(d.y, d.x);
      float notch = smoothstep(0.1, 0.18, abs(mod(a - h * 6.2832 + 3.1416, 6.2832) - 3.1416));
      float m = smoothstep(r, r - 0.003 * grow * grow, dist) * notch;
      if (grow > 1.0) { outC.a = max(outC.a, m); continue; }
      float rim = smoothstep(0.75 * r, r, dist);
      vec3 n = normalize(vec3(-d / max(dist, 1e-4) * rim * 0.9, 1.0));
      float lit = 0.5 + 0.65 * max(dot(n, ld), 0.0);
      float vein = smoothstep(0.9, 1.0, cos(a * 11.0 + h * 5.0)) * smoothstep(0.1 * r, 0.6 * r, dist);
      vec3 green = mix(vec3(0.14, 0.32, 0.13), vec3(0.36, 0.52, 0.2), h2 + 0.25 * noise(d * 70.0));
      vec3 pc = green * lit + 0.06 * vein;
      pc = mix(pc, vec3(0.5, 0.22, 0.12), smoothstep(0.92 * r, r, dist) * 0.5);
      pc += 0.25 * pow(max(dot(n, normalize(ld + vec3(0.0, 0.0, 1.0))), 0.0), 30.0);
      if (h > 0.82) {
        vec2 fd = d - vec2(r * 0.2, r * 0.1);
        float fr = length(fd);
        float pa = atan(fd.y, fd.x) + h * 3.0;
        float petal = smoothstep(0.03 * (0.55 + 0.45 * abs(cos(pa * 3.0))), 0.026 * (0.55 + 0.45 * abs(cos(pa * 3.0))), fr);
        vec3 lotus = mix(u_palette[2], u_palette[3], 0.3 + 0.4 * smoothstep(0.0, 0.03, fr)) * (0.75 + 0.35 * abs(cos(pa * 3.0)));
        lotus = mix(lotus, vec3(1.0, 0.85, 0.3), smoothstep(0.009, 0.005, fr));
        pc = mix(pc, lotus, petal);
        m = max(m, petal);
      }
      outC = vec4(mix(outC.rgb, pc, m), max(outC.a, m));
    }
  }
  return outC;
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float ax = u_resolution.x / u_resolution.y;
  vec3 deep = u_palette[0];
  vec3 shallow = u_palette[1];
  vec3 ld = normalize(LD);

  // surface waves from finished turns and the cursor refract everything below
  vec2 rn = vec2(0.0);
  float err = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float rad = r.z * (r.w > 1.5 ? 0.08 : 0.15);
    float fade = exp(-r.z * 0.8);
    float w = sin((dist - rad) * 90.0) * exp(-pow((dist - rad) * 16.0, 2.0)) * fade;
    rn += d / max(dist, 1e-3) * w;
    if (abs(r.w - 1.0) < 0.5) err = max(err, exp(-pow((dist - rad) * 12.0, 2.0)) * fade);
  }
  vec2 dp = p - toP(u_pointer);
  float pd = length(dp);
  rn += dp / max(pd, 1e-3) * sin(pd * 80.0 - t * 4.0) * exp(-pd * pd / 0.006) * 0.6;
  vec2 fp = p + rn * 0.006;

  // pond floor: mottled stone, darker toward the deep rim, dappled with caustics
  float fl = fbm(fp * 2.2 + 3.0);
  vec3 col = mix(deep, shallow, 0.2 + 0.55 * fl);
  col *= 0.88 + 0.18 * noise(fp * 26.0);
  col = mix(col, deep * 0.6, smoothstep(0.55, 1.4, length(p / vec2(ax * 0.5, 0.5))));
  vec2 cq = fp * 16.0 + vec2(t * 0.3, t * 0.2);
  float cn = noise(fp * 5.0 + t * 0.08);
  float cc = abs(sin(cq.x + cn * 6.0 + sin(cq.y * 0.7 + t * 0.5)) * sin(cq.y * 1.2 - cn * 5.0 + t * 0.4));
  float caus = pow(1.0 - cc, 12.0) * p_caustics * (0.5 + 0.5 * noise(fp * 2.0 - t * 0.05));
  col += mix(shallow, vec3(1.0), 0.4) * caus * 0.18;

  float sh = 0.0;
  for (int i = 0; i < 9; i++) {
    if (float(i) >= p_count) break;
    vec2 c; float ang, L, dep, ph;
    fishAt(i, t, ax, c, ang, L, dep, ph);
    sh = max(sh, koiShadow(fp - vec2(0.03, -0.045) * (1.15 - dep) * p_depth, c, ang, L, 1.0 - dep));
  }
  sh = max(sh, 0.55 * pads(fp - vec2(0.05, -0.07) * p_depth, t, 1.15).a);
  col *= 1.0 - clamp(0.45 * p_depth, 0.0, 0.75) * sh;

  // koi, deepest first; water swallows the color of the deep ones
  vec3 murk = mix(deep, shallow, 0.5);
  for (int i = 0; i < 9; i++) {
    if (float(i) >= p_count) break;
    vec2 c; float ang, L, dep, ph;
    fishAt(i, t, ax, c, ang, L, dep, ph);
    vec4 k = koi(p + rn * 0.004 * dep, c, ang, L, ph, KINDS[i], float(i) * 0.37);
    vec3 kc = mix(k.rgb, murk, dep * 0.5) + mix(shallow, vec3(1.0), 0.5) * caus * 0.12 * dep;
    col = mix(col, kc, k.a);
  }

  // agents are tancho koi circling their spot; waiting ones rise and mouth the surface
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    vec2 a0 = toP(a.xy);
    float ph0 = t * 0.8 * max(p_swim, 0.3) + fi * 1.7;
    vec2 c = mix(a0 + 0.045 * vec2(cos(ph0), sin(ph0)), a0, waiting);
    float ang = mix(ph0 + 1.5708, 1.5708 + 0.15 * sin(t * 0.8 + fi), waiting);
    float L = 0.055 * a.w * sqrt(p_size);
    col *= 1.0 - 0.4 * clamp(p_depth, 0.0, 1.5) * a.w * koiShadow(p - vec2(0.03, -0.045) * p_depth, c, ang, L, 0.8);
    vec4 k = koi(p, c, ang, L, t * mix(6.0, 2.0, waiting) + fi, 1, fi);
    col = mix(col, k.rgb, k.a * a.w);
    if (waiting > 0.5) {
      vec2 mouth = c + vec2(cos(ang), sin(ang)) * L * 0.95;
      for (int k2 = 0; k2 < 2; k2++) {
        float f = fract(t * 0.6 + float(k2) * 0.5);
        float ring = smoothstep(0.003, 0.0, abs(length(p - mouth) - (0.01 + 0.07 * f)));
        col = mix(col, vec3(0.95), ring * (1.0 - f) * 0.6 * a.w);
      }
    }
  }

  // the surface: pads and lotus, lit ripple crests, a faint sky sheen
  vec4 pl = pads(p + rn * 0.002, t, 1.0);
  col = mix(col, pl.rgb, pl.a);
  col += vec3(0.9, 0.95, 1.0) * 0.22 * max(dot(rn, normalize(ld.xy)), 0.0);
  col = mix(col, vec3(0.85, 0.15, 0.1), err * 0.55);
  col += vec3(0.8, 0.9, 1.0) * 0.05 * smoothstep(0.6, 0.9, noise(vec2(p.x * 3.0 - t * 0.05, p.y * 12.0)));
  return mix(u_canvas, col, p_color);
}`;

export const koiPond: BuiltInScene = {
  id: "koi-pond",
  name: "Koi Pond",
  source: SOURCE,
  palette: ["#0e2a2e", "#3d7a70", "#f5f1e8", "#e2451c"],
  params: [
    param("swim", "Swim speed", 0, 3, 1),
    param("count", "Koi", 1, 9, 7, 1),
    param("size", "Koi size", 0.6, 1.6, 1),
    param("depth", "Depth & shadows", 0, 2, 1),
    param("caustics", "Caustic light", 0, 2, 1),
    param("pads", "Lily pads", 0, 1, 0.6),
    param("color", "Color strength", 0, 1, 0.95),
  ],
};
