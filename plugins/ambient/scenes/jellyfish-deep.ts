import { param, type BuiltInScene } from "./param.js";

const SOURCE = `float caustic(vec2 x, float t) {
  vec2 p = x * 6.2832 - 250.0;
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}

vec4 jelly(vec2 d, float s, float ph, float trail, float tt) {
  float c = 0.5 + 0.5 * sin(ph);
  float sx = s * (1.0 + 0.14 * c);
  float sy = s * (0.8 - 0.16 * c);
  if (abs(d.x) > sx * 2.2 || d.y > sy * 1.4 || d.y < -s * 5.5 * trail) return vec4(0.0);
  vec2 b = d / vec2(sx, sy);
  float r = length(b);
  float skirt = -0.28 - 0.1 * sin(b.x * 10.0 + ph * 0.5) - 0.12 * c;
  float body = smoothstep(1.0, 0.9, r) * smoothstep(skirt - 0.06, skirt + 0.04, b.y);
  float rim = body * smoothstep(0.55, 0.97, r) + smoothstep(0.08, 0.0, abs(b.y - skirt)) * smoothstep(1.05, 0.8, abs(b.x));
  vec2 ib = b - vec2(0.0, 0.18);
  float inner = body * exp(-dot(ib, ib) * 5.0) * (0.6 + 0.4 * cos(atan(ib.x, ib.y) * 4.0));
  float tent = 0.0;
  float yy = -(d.y - skirt * sy);
  if (yy > 0.0) {
    float len = s * 5.0 * trail;
    float ty = yy / len;
    if (ty < 1.0) {
      for (int k = 0; k < 5; k++) {
        float fk = float(k) - 2.0;
        float tx = fk * 0.36 * sx * (1.0 - 0.3 * ty) + 0.3 * s * ty * sin(ty * 7.0 - tt * 2.4 + fk * 1.3);
        float w = s * (0.07 - 0.04 * ty);
        tent += smoothstep(w, w * 0.2, abs(d.x - tx)) * pow(1.0 - ty, 1.4) * 0.7;
      }
      float ay = yy / (len * 0.55);
      if (ay < 1.0) {
        for (int k = 0; k < 2; k++) {
          float fk = float(k) * 2.0 - 1.0;
          float tx = fk * 0.12 * sx + 0.16 * s * sin(ay * 5.0 - tt * 1.6 + fk);
          float w = s * (0.2 - 0.12 * ay) * (0.8 + 0.2 * sin(ay * 40.0 - tt * 3.0));
          tent += smoothstep(w, w * 0.3, abs(d.x - tx)) * (1.0 - ay);
        }
      }
    }
  }
  return vec4(body, clamp(rim, 0.0, 1.0), inner, clamp(tent, 0.0, 1.0));
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * p_drift;
  vec3 abyss = u_palette[0];
  vec3 sea = u_palette[1];
  vec3 jel = u_palette[2];
  vec3 sun = u_palette[3];
  float ar = u_resolution.x / u_resolution.y;

  vec2 dp = p - toP(u_pointer);
  float pd = exp(-dot(dp, dp) / 0.012);
  float n = fbm(p * 1.7 + vec2(t * 0.05, -t * 0.03));
  vec2 q = p + (n - 0.5) * vec2(0.05, 0.03) + 0.004 * vec2(sin(p.y * 9.0 + t * 0.9), cos(p.x * 7.0 - t * 0.7)) + dp * pd * 0.25;

  float ex = abs(p.x) / (0.5 * ar);
  float edge = max(smoothstep(0.42, 0.9, ex), smoothstep(0.8, 0.97, uv.y));
  float live = mix(1.0, edge, p_calm);

  float depth = clamp(1.0 - uv.y + (n - 0.5) * 0.12, 0.0, 1.0);
  float fall = pow(smoothstep(-0.05, 1.05, depth), 1.3 / p_depth);
  vec3 shallow = mix(sea, sun, 0.22);
  vec3 col = mix(shallow, abyss, fall);

  float wave = 0.025 * sin(q.x * 13.0 + t * 1.2) + 0.015 * sin(q.x * 29.0 - t * 1.9) + 0.02 * (n - 0.5);
  float surf = smoothstep(0.86, 0.99, uv.y + wave);
  float glint = caustic(vec2(q.x * 0.9, q.y * 3.0) + vec2(t * 0.01, 0.0), t * 0.5);
  col = mix(col, mix(sun, sea, 0.2), surf * (0.55 + 0.4 * glint));

  float rx = q.x + (uv.y - 1.0) * 0.32;
  float r1 = noise(vec2(rx * 6.0 + t * 0.07, t * 0.12));
  float r2 = noise(vec2(rx * 15.0 - t * 0.1, 4.0 + t * 0.18));
  float rays = pow(clamp(r1 * 0.7 + r2 * 0.45 - 0.3, 0.0, 1.0), 1.6) * smoothstep(1.0, 0.1, depth);
  col = mix(col, sun, clamp(rays * 0.85 * p_rays * (0.4 + 0.6 * live), 0.0, 0.8));

  float floorY = -0.43 + 0.03 * sin(p.x * 2.3 + 1.0) + 0.02 * sin(p.x * 5.1) + 0.015 * (n - 0.5);
  float sand = smoothstep(0.006, -0.006, q.y - floorY);
  float ripplesand = 0.5 + 0.5 * sin((q.x + 0.3 * q.y) * 70.0 + n * 6.0);
  vec3 floorCol = mix(mix(abyss, sun, 0.2), mix(abyss, sea, 0.45), 0.5 + 0.3 * ripplesand);
  col = mix(col, floorCol, sand * 0.85);

  float ca = caustic(q * vec2(1.1, 1.6) + vec2(t * 0.012, t * 0.02), t * 0.32);
  float caW = mix(0.5 * (1.0 - fall), 1.0, sand) * (0.3 + 0.7 * live);
  col = mix(col, mix(sun, sea, 0.15), clamp(ca * caW * 0.8 * p_caustics, 0.0, 0.85));

  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    float sc = mix(34.0, 18.0, fl);
    vec2 g = q * sc + vec2(sin(t * 0.21 + fl * 2.0) * 0.8 + t * 0.15, t * (0.25 + 0.2 * fl));
    vec2 cid = floor(g);
    float h = hash21(cid + fl * 17.0);
    vec2 off = vec2(hash21(cid + 3.1), hash21(cid + 7.7)) - 0.5;
    float sz = mix(0.09, 0.14, fl);
    float sp = smoothstep(sz, sz * 0.2, length(fract(g) - 0.5 - off * 0.6));
    float on = step(1.0 - 0.3 * p_snow, h);
    col = mix(col, mix(sun, shallow, 0.35 + 0.3 * fall), sp * on * mix(0.35, 0.55, fl) * (0.3 + 0.7 * live));
  }

  vec2 bg = vec2(q.x * 10.0, q.y * 10.0 - t * 1.3);
  vec2 bid = floor(bg);
  float hb = hash21(bid + 41.0);
  if (hash21(vec2(bid.x, 9.0)) < 0.1 * p_bubbles && hb < 0.8) {
    vec2 bl = fract(bg) - 0.5 - vec2(0.18 * sin(t * 3.0 + hb * 30.0 + bg.y * 1.7), 0.0);
    float br = 0.07 + 0.12 * hb;
    float bd = length(bl);
    float shell = smoothstep(br * 0.35, 0.0, abs(bd - br));
    float spec = smoothstep(br * 0.4, 0.0, length(bl - vec2(-0.35, 0.35) * br));
    col = mix(col, mix(sun, sea, 0.2), clamp(shell * 0.6 + spec * 0.85, 0.0, 1.0) * (0.15 + 0.85 * live) * (1.0 - 0.4 * fall));
  }

  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float s = mix(0.032, 0.07, fract(fk * 0.618 + 0.2));
    float fog = mix(0.5, 0.95, (s - 0.032) / 0.038);
    float jy = fract(fk * 0.29 + t * 0.006 * (1.0 + fk * 0.35)) * 1.5 - 0.75;
    float side = mod(fk, 2.0) < 0.5 ? -1.0 : 1.0;
    float jx = side * (0.5 * ar) * mix(0.6, 0.88, fract(fk * 0.43)) + 0.05 * sin(t * 0.17 + fk * 2.0);
    float ph = t * 1.4 + fk * 1.9;
    vec2 d = p - vec2(jx, jy + 0.012 * sin(ph));
    vec4 j = jelly(d, s, ph, 1.0, t + fk);
    vec3 jc = mix(jel, sea, 0.2 + 0.2 * sin(fk * 2.3));
    float halo = exp(-dot(d, d) / (s * s * 6.0));
    col = mix(col, mix(jc, sun, 0.2), clamp(halo * 0.4 * p_glow * fog, 0.0, 0.8));
    col = mix(col, mix(col, jc, 0.6), j.x * 0.45 * fog);
    col = mix(col, mix(jc, sun, 0.25 + 0.2 * j.z), clamp(j.y * 0.95 + j.z * 0.55, 0.0, 1.0) * fog);
    col = mix(col, mix(jc, sun, 0.15), j.w * 0.7 * fog);
  }

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    float ph = u_time * mix(2.6, 1.1, waiting) + fi * 1.7;
    vec2 c0 = toP(a.xy) + vec2(0.006 * sin(u_time * 0.7 + fi), (1.0 - waiting) * 0.012 * sin(ph - 1.2));
    vec2 d = p - c0;
    float s = 0.036;
    vec4 j = jelly(d, s, ph, mix(1.0, 0.7, waiting), u_time + fi);
    vec3 jc = mix(jel, sea, 0.25 + 0.25 * sin(fi * 1.7));
    jc = mix(jc, sun, 0.7 * waiting);
    float pulse = 0.5 + 0.5 * sin(u_time * 2.0 + fi);
    float halo = exp(-dot(d, d) / (s * s * (4.0 + 3.0 * waiting * pulse)));
    col = mix(col, jc, clamp(halo * a.w * p_glow * 0.6, 0.0, 0.85));
    col = mix(col, mix(col, jc, 0.7), j.x * 0.6 * a.w);
    col = mix(col, mix(jc, sun, 0.3 + 0.3 * j.z), clamp(j.y * 0.9 + j.z * 0.6, 0.0, 1.0) * a.w);
    col = mix(col, mix(jc, sun, 0.2), j.w * 0.75 * a.w);
    if (waiting < 0.5) {
      for (int b = 0; b < 3; b++) {
        float fb = float(b);
        float by = fract(u_time * 0.45 + fb * 0.33 + fi * 0.21);
        vec2 bp = c0 + vec2(0.012 * sin(by * 12.0 + fb * 2.0 + fi), s * 0.9 + by * 0.14);
        float br = 0.004 + 0.003 * fb;
        float ring = smoothstep(0.0022, 0.0, abs(length(p - bp) - br));
        col = mix(col, mix(sun, sea, 0.2), ring * (1.0 - by) * 0.8 * a.w);
      }
    } else {
      float ph2 = fract(u_time * 0.5 + fi * 0.3);
      float ring = abs(length(d) - s * (1.6 + 2.2 * ph2));
      col = mix(col, sun, smoothstep(0.004, 0.0, ring) * (1.0 - ph2) * 0.7 * a.w);
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float front = r.z * 0.2;
    float ring = exp(-pow((dist - front) * 26.0, 2.0)) * exp(-r.z * 0.8);
    float shimmer = 0.6 + 0.4 * sin(atan(p.y - toP(r.xy).y, p.x - toP(r.xy).x) * 18.0 + r.z * 6.0);
    vec3 rc = r.w > 0.5 && r.w < 1.5 ? vec3(0.95, 0.28, 0.25) : (r.w > 1.5 ? jel : mix(sun, sea, 0.3));
    col = mix(col, rc, ring * shimmer * 0.7);
  }

  col = mix(col, mix(sun, sea, 0.4), pd * 0.12);
  return mix(u_canvas, col, p_color);
}`;

export const jellyfishDeep: BuiltInScene = {
  id: "jellyfish-deep",
  name: "Jellyfish Deep",
  source: SOURCE,
  palette: ["#05213f", "#13a3b4", "#c48bff", "#fdf3cf"],
  params: [
    param("drift", "Current", 0, 3, 1),
    param("depth", "Depth", 0.4, 2, 1),
    param("rays", "Light shafts", 0, 2, 1),
    param("caustics", "Caustics", 0, 2, 1),
    param("snow", "Marine snow", 0, 2, 1),
    param("bubbles", "Bubbles", 0, 2, 1),
    param("glow", "Bioluminescence", 0, 2, 1),
    param("calm", "Calm behind text", 0, 1, 0.6),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
