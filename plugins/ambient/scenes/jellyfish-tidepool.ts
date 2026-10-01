import { param, type BuiltInScene } from "./param.js";

const SOURCE = `// a translucent moon jelly: lit dome, glowing gonads, frilled margin, oral arms, long tentacles
vec4 jelly(vec2 p, vec2 c, float R, float ph, float tilt, float blur, vec3 glowC, float trail) {
  vec2 q = p - c;
  float ca = cos(tilt), sa = sin(tilt);
  q = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
  float L = R * 5.0 * trail;
  if (q.y > R * 1.3 || q.y < -L - R || abs(q.x) > R * 2.2) return vec4(0.0);
  float pulse = 0.5 + 0.5 * sin(ph);
  float w = R * (1.08 - 0.16 * pulse);
  float h = R * (0.72 + 0.18 * pulse);
  vec2 b = q / vec2(w, h);
  float under = -0.2 + 0.28 * b.x * b.x;
  float d = b.y > 0.0 ? length(b) - 1.0 : abs(b.x) - 1.0;
  d = max(d, under - b.y);
  float aa = 0.04 + blur * 6.0;
  float bell = smoothstep(aa, -aa, d);
  float rim = smoothstep(-0.4, 0.0, d) * bell;
  vec2 g = b - vec2(0.0, 0.3);
  float ga = atan(g.y, g.x);
  float gon = smoothstep(1.0, 0.45, length(g) / (0.3 * (0.55 + 0.45 * abs(cos(ga * 2.0))))) * bell;
  float veins = smoothstep(0.8, 1.0, cos(atan(b.x, b.y + 0.3) * 16.0)) * bell * (1.0 - gon) * 0.5;
  float sheen = exp(-dot(b - vec2(-0.4, 0.55), b - vec2(-0.4, 0.55)) / 0.035) * bell;
  float frill = smoothstep(0.1 + aa, 0.0, abs(b.y - under + 0.04 * sin(b.x * 28.0 + ph * 2.0))) * smoothstep(1.15, 0.95, abs(b.x));

  float base = under * h;
  float lines = 0.0;
  if (q.y < base && abs(q.x) < w * 1.4) {
    float k = clamp((base - q.y) / L, 0.0, 1.0);
    for (int i = 0; i < 5; i++) {
      float fi = float(i) - 2.0;
      float x0 = fi / 2.0 * w * 0.9;
      float x = x0 * (1.0 - 0.25 * k) + R * 0.35 * k * sin(k * 5.0 - ph * 0.7 + fi * 1.3);
      float wd = R * 0.025 * (1.0 - 0.6 * k) + blur;
      lines = max(lines, smoothstep(wd, 0.0, abs(q.x - x)) * (1.0 - k) * (0.6 + 0.4 * sin(k * 40.0 + fi)));
    }
    float ka = clamp((base - q.y) / (L * 0.55), 0.0, 1.0);
    for (int i = 0; i < 2; i++) {
      float s = i == 0 ? -1.0 : 1.0;
      float x = s * R * 0.12 + R * 0.25 * ka * sin(ka * 4.0 - ph * 0.5 + s);
      float wd = R * (0.13 * (1.0 - ka) + 0.03) * (0.8 + 0.3 * sin(ka * 60.0 + s * 2.0)) + blur;
      lines = max(lines, smoothstep(wd, wd * 0.4, abs(q.x - x)) * (1.0 - ka) * 0.85);
    }
  }
  float a = clamp(bell * 0.35 + rim * 0.5 + gon * 0.7 + frill * 0.8 + lines * 0.7 + veins, 0.0, 1.0);
  vec3 col = glowC * (bell * 0.25 + rim * 0.75 + gon * 1.1 + frill + lines * 0.8 + veins) + vec3(1.0) * sheen * 0.6;
  return vec4(col, a);
}

// A sea anemone from the side: a smooth fleshy column on a flared foot, crowned by soft wavy
// tentacles rooted across the oral disc in a shaded back row and a lit front row, swaying
// together in the current. Some sit closed as a glossy mound. Returns premultiplied rgb and alpha.
vec4 anemone(vec2 q, vec2 b, float S, float t, float seed, vec3 body, vec3 tip, vec3 water) {
  vec2 l = (q - b) / S;
  if (abs(l.x) > 1.7 || l.y < -0.08 || l.y > 1.9) return vec4(0.0);
  float aa = 1.5 / (u_resolution.y * S);
  vec3 ld = normalize(vec3(-0.35, 0.65, 0.7));

  if (hash21(vec2(seed, 3.7)) < 0.2) {
    vec2 dd = (l - vec2(0.0, -0.02)) / vec2(0.52, 0.46);
    float dl = length(dd);
    float m = smoothstep(1.0 + aa * 2.5, 1.0 - aa * 2.5, dl) * step(0.0, l.y + 0.02);
    vec3 n = vec3(dd, sqrt(max(1.0 - dl * dl, 0.0)));
    float dif = max(dot(n, ld), 0.0);
    vec2 vg = dd * 7.0;
    float bump = smoothstep(0.22, 0.1, length(fract(vg + vec2(0.5 * floor(vg.y), 0.0)) - 0.5)) * n.z;
    vec3 c = body * (0.3 + 0.75 * dif) * (0.94 + 0.06 * noise(dd * 9.0)) + mix(body, tip, 0.4) * 0.05 * bump;
    c += vec3(1.0) * 0.25 * pow(max(dot(reflect(-ld, n), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
    return vec4(c * m, m);
  }

  vec3 colP = vec3(0.0);
  float alpha = 0.0;
  float Hc = 0.34;
  float hy = clamp(l.y / Hc, 0.0, 1.0);
  float hw = 0.32 + 0.16 * smoothstep(0.45, 1.0, hy) + 0.06 * exp(-max(l.y, 0.0) * 18.0);
  float cd = max(abs(l.x) - hw, max(-l.y, l.y - Hc));
  float cm = smoothstep(aa, -aa, cd);
  if (cm > 0.0) {
    float nx = clamp(l.x / hw, -0.999, 0.999);
    vec3 n = vec3(nx, 0.0, sqrt(1.0 - nx * nx));
    float dif = max(dot(n, ld), 0.0);
    vec3 cc = body * (0.28 + 0.6 * dif) * (0.97 + 0.03 * sin(asin(nx) * 20.0));
    cc *= 1.0 - 0.3 * smoothstep(0.65, 1.0, hy);
    colP = cc * cm;
    alpha = cm;
  }

  float sway = 0.16 * sin(t * 0.55 + b.x * 3.0) + 0.05 * sin(t * 1.3 + seed * 7.0);
  for (int layer = 0; layer < 2; layer++) {
    float front = float(layer);
    for (int i = 0; i < 22; i++) {
      float fi = float(i) * 2.0 + front;
      float h1 = hash21(vec2(fi, seed * 17.0 + 1.0));
      float h2 = hash21(vec2(fi, seed * 17.0 + 2.0));
      float h3 = hash21(vec2(fi, seed * 17.0 + 3.0));
      float u = (fi + 0.5) / 44.0 * 2.0 - 1.0 + (h1 - 0.5) * 0.05;
      vec2 root = vec2(u * 0.46, Hc - 0.04 + 0.09 * (1.0 - u * u) * front);
      float L = (0.6 + 0.3 * h3) * (1.0 - 0.3 * u * u) * mix(1.05, 0.9, front);
      if (length(l - root) > L + 0.1) continue;
      float ang = u * 0.8 + (h2 - 0.5) * 0.3;
      vec2 dir = vec2(sin(ang), cos(ang));
      vec2 nrm = vec2(dir.y, -dir.x);
      float curl = (0.08 + 0.22 * abs(u)) * (u < 0.0 ? -1.0 : 1.0) + (h1 - 0.5) * 0.25;
      float ph = t * 1.1 + fi * 0.7 + seed * 5.0;
      float best = 1e3, bs = 0.0;
      vec2 p0 = root;
      for (int sg = 1; sg <= 4; sg++) {
        float s = float(sg) / 4.0;
        vec2 p1 = root + L * (dir * s + nrm * (curl * s * s + 0.11 * sin(s * 5.0 - ph) * s)) + vec2(sway * s * s * L, 0.0);
        vec2 pa = l - p0, ba = p1 - p0;
        float hh = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float dd = length(pa - ba * hh);
        if (dd < best) { best = dd; bs = (float(sg) - 1.0 + hh) / 4.0; }
        p0 = p1;
      }
      float w = mix(0.075, 0.01, pow(bs, 0.8));
      float m = smoothstep(aa, -aa, best - w);
      if (m <= 0.0) continue;
      float across = clamp(1.0 - (best / w) * (best / w), 0.0, 1.0);
      vec3 tc = mix(body * 0.55, mix(body, tip, 0.2), sqrt(across));
      tc = mix(tc, tip, smoothstep(0.5, 1.0, bs) * 0.45);
      tc *= (0.82 + 0.18 * clamp(dir.y, 0.0, 1.0)) * mix(0.62, 1.0, front);
      float ta = m * mix(0.97, 0.85, bs);
      colP = tc * ta + colP * (1.0 - ta);
      alpha = ta + alpha * (1.0 - ta);
    }
  }
  return vec4(colP, alpha);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * p_drift;
  float ax = u_resolution.x / u_resolution.y;
  vec3 deep = u_palette[0];
  vec3 cyan = u_palette[1];
  vec3 coral = u_palette[2];
  vec3 pale = u_palette[3];

  vec2 dp = p - toP(u_pointer);
  float pd = exp(-dot(dp, dp) / 0.012);
  vec2 q = p + dp * pd * 0.25;

  // water column: sunlit surface above, deepening navy below
  vec3 col = mix(deep * 0.55, mix(deep, cyan, 0.4), smoothstep(-0.05, 1.05, uv.y));
  float sh = fbm(vec2(q.x * 3.0 + t * 0.05, q.y * 2.0 - t * 0.04));
  col = mix(col, mix(cyan, pale, 0.45), smoothstep(0.8, 1.0, uv.y) * (0.35 + 0.65 * sh));
  float cx = q.x * 9.0 + sh * 4.0, cy = q.y * 9.0 - sh * 3.0;
  float caus = pow(1.0 - abs(sin(cx + t * 0.6) * sin(cy - t * 0.5)), 18.0);
  col += mix(cyan, pale, 0.5) * caus * 0.07 * smoothstep(0.45, 1.0, uv.y);
  // shafts of light slanting down from the surface
  float rx = q.x + (0.5 - q.y) * 0.32;
  float rays = noise(vec2(rx * 6.0, t * 0.06)) * noise(vec2(rx * 13.0 + 3.0, t * 0.04 + 7.0));
  rays = smoothstep(0.12, 0.45, rays) * smoothstep(-0.45, 0.5, q.y);
  col += mix(cyan, pale, 0.55) * rays * 0.28 * p_rays;

  // marine snow at two depths
  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    float sc = l == 0 ? 55.0 : 24.0;
    vec2 sg = q * sc + vec2(t * (0.3 + 0.4 * fl), -t * (0.6 + 0.8 * fl)) + fl * 13.0;
    vec2 id = floor(sg);
    float hs = hash21(id);
    vec2 o = vec2(hash21(id + 2.1), hash21(id + 4.7)) - 0.5;
    float sd = length(fract(sg) - 0.5 - o * 0.6);
    col += mix(pale, cyan, 0.4) * smoothstep(0.1 + 0.05 * fl, 0.0, sd) * step(1.0 - 0.25 * p_snow, hs) * (0.25 + 0.3 * fl);
  }

  // tidepool floor: dark rock lit along its rim, anemones swaying in the current
  float ry = -0.4 + 0.05 * noise(vec2(q.x * 3.5, 1.0)) + 0.03 * noise(vec2(q.x * 11.0, 2.0)) + 0.1 * (1.0 - p_rocks);
  if (q.y < ry + 0.17 && p_rocks > 0.0) {
    float rock = smoothstep(ry + 0.003, ry - 0.003, q.y);
    vec3 rc = mix(deep * 0.45, mix(deep, cyan, 0.25), smoothstep(0.03, 0.0, ry - q.y) * 0.7);
    rc *= 0.75 + 0.35 * noise(q * vec2(30.0, 18.0)) * noise(q * 7.0 + 4.0);
    col = mix(col, rc, rock);
    float cw = 0.17;
    vec3 water = mix(deep, cyan, 0.3);
    for (int j = -1; j <= 1; j++) {
      float ci = floor(q.x / cw) + float(j);
      float h = hash21(vec2(ci, 9.0));
      if (h < 1.0 - 0.8 * p_rocks) continue;
      float bx = (ci + 0.25 + 0.5 * hash21(vec2(ci, 3.0))) * cw;
      float by = -0.4 + 0.05 * noise(vec2(bx * 3.5, 1.0)) + 0.03 * noise(vec2(bx * 11.0, 2.0)) + 0.1 * (1.0 - p_rocks) - 0.006;
      float S = 0.045 + 0.04 * hash21(vec2(ci, 5.0));
      float v = hash21(vec2(ci, 12.0));
      vec3 body = v < 0.45 ? coral : (v < 0.75 ? mix(cyan, vec3(0.4, 0.8, 0.45), 0.55) : mix(coral, vec3(1.0, 0.6, 0.3), 0.5));
      vec3 tipC = v < 0.45 ? mix(coral, pale, 0.45) : (v < 0.75 ? mix(pale, vec3(0.75, 1.0, 0.8), 0.4) : pale);
      vec4 an = anemone(q, vec2(bx, by), S, t, fract(ci * 0.371), body, tipC, water);
      col = col * (1.0 - an.a) + an.rgb;
    }
  }

  // drifting jellies, deepest first; depth fades and softens them
  float n = floor(p_jellies + 0.5);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    if (fi >= n) break;
    float z = 0.85 - 0.75 * fi / max(n - 1.0, 1.0);
    float hx = fract(fi * 0.618 + 0.21);
    vec2 c = vec2((hx * 2.0 - 1.0) * 0.4 * ax + 0.06 * sin(t * 0.05 + fi * 2.0),
                  0.12 - 0.2 * fract(fi * 0.37 + 0.5) + 0.07 * sin(t * 0.04 + fi * 1.7));
    float ph = u_time * (0.9 + 0.3 * hash21(vec2(fi, 2.0))) + fi * 2.3;
    c.y += 0.012 * sin(ph - 0.8);
    float R = mix(0.135, 0.05, z) * p_size;
    vec3 gc = mix(mix(cyan, pale, 0.35), mix(coral, pale, 0.3), step(0.66, hash21(vec2(fi, 8.0))));
    vec2 jd = q - c;
    col += gc * exp(-dot(jd, jd) / (R * R * 3.0)) * 0.16 * p_glow * (1.0 - 0.5 * z);
    vec4 jl = jelly(q, c, R, ph, 0.25 * sin(t * 0.09 + fi * 2.0), z * 0.004 * p_depth, gc * p_glow, p_trail);
    vec3 jc = mix(jl.rgb, mix(deep, cyan, 0.3), z * 0.45 * p_depth);
    col = mix(col, col * 0.85 + jc, jl.a * (1.0 - 0.35 * z * p_depth));
  }

  // agents are small bright jellies; ones waiting on you pulse coral rings
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    float ph = u_time * mix(2.4, 1.2, waiting) + fi * 1.3;
    vec2 c0 = toP(a.xy) + vec2(0.006 * sin(u_time * 0.7 + fi), 0.01 * sin(ph - 0.8) * (1.0 - waiting));
    vec3 gc = mix(mix(cyan, pale, 0.3), coral, waiting);
    vec2 jd = q - c0;
    col += gc * exp(-dot(jd, jd) / 0.004) * 0.25 * a.w * p_glow;
    vec4 jl = jelly(q, c0, 0.03 * a.w, ph, 0.0, 0.0, gc * 1.2 * p_glow, 0.8);
    col = mix(col, col * 0.85 + jl.rgb, jl.a * a.w);
    if (waiting > 0.5) {
      float f = fract(u_time * 0.6 + fi * 0.3);
      col += coral * smoothstep(0.004, 0.0, abs(length(jd) - 0.035 - 0.08 * f)) * (1.0 - f) * 0.8 * a.w;
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(q - toP(r.xy));
    float ring = exp(-pow((dist - r.z * 0.2) * 40.0, 2.0)) * exp(-r.z * 0.9);
    vec3 rc = r.w > 0.5 && r.w < 1.5 ? vec3(0.95, 0.22, 0.2) : (r.w > 1.5 ? pale : cyan);
    col = mix(col, rc, ring * 0.7);
  }

  col += cyan * pd * 0.08;
  return mix(u_canvas, col, p_color);
}`;

export const jellyfishTidepool: BuiltInScene = {
  id: "jellyfish-tidepool",
  name: "Jellyfish Tidepool",
  source: SOURCE,
  palette: ["#06163a", "#2fc9d8", "#ff8466", "#e6f7ff"],
  params: [
    param("drift", "Current speed", 0, 3, 1),
    param("jellies", "Jellyfish", 1, 6, 4, 1),
    param("size", "Jellyfish size", 0.5, 1.8, 1),
    param("trail", "Tentacle length", 0.3, 2, 1),
    param("glow", "Bioluminescence", 0, 2, 1),
    param("depth", "Depth haze", 0, 2, 1),
    param("rays", "Light shafts", 0, 2, 1),
    param("snow", "Marine snow", 0, 2, 1),
    param("rocks", "Tidepool floor", 0, 1, 0.8),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
