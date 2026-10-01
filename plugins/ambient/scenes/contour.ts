import { param, type BuiltInScene } from "./param.js";

const SOURCE = `float terrain(vec2 tq) {
  vec2 wq = tq + 0.6 * vec2(noise(tq * 0.7 + 3.1), noise(tq * 0.7 - 1.7));
  float f = fbm(wq);
  float n = noise(wq * 2.3 + 5.0) * 2.0 - 1.0;
  float r = 1.0 - sqrt(n * n + 0.04);
  return f * 0.85 + r * r * 0.16 - 0.04;
}

// a trail meandering across the map, in terrain space so it drifts with the land
float trailY(float x, float k) {
  return 0.35 * sin(x * 0.9 + k * 2.1) + 0.12 * sin(x * 2.3 + k * 4.7) + 0.05 * sin(x * 5.1 + k);
}
float trailD(vec2 tq, float k, float off) {
  float y = trailY(tq.x, k) + off + 0.4 * u_time * 0.02 * p_drift;
  float dy = 0.35 * 0.9 * cos(tq.x * 0.9 + k * 2.1) + 0.12 * 2.3 * cos(tq.x * 2.3 + k * 4.7) + 0.05 * 5.1 * cos(tq.x * 5.1 + k);
  return abs(tq.y - y) / sqrt(1.0 + dy * dy);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * 0.02 * p_drift;
  vec3 tanC = u_palette[0], blue = u_palette[1], forest = u_palette[2], base = u_palette[3];
  vec3 green = vec3(0.24, 0.54, 0.16);
  vec2 tq = p * p_scale + vec2(t, t * 0.4);
  float px = p_scale / u_resolution.y;
  float h = terrain(tq);

  float waitRing = 0.0;
  float pin = 1e3;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float an = atan(d.y, d.x);
    vec2 dl = d * (1.0 + 0.35 * (noise(vec2(an * 1.6 + float(i) * 7.0, 1.0)) - 0.5)) * vec2(1.0, 1.25);
    float r2 = dot(dl, dl);
    h += 0.35 * p_height * a.w / (1.0 + r2 / 0.003) * exp(-r2 / 0.04);
    pin = min(pin, length(d) / max(a.w, 0.05));
    if (a.z > 0.5) {
      float f = fract(u_time * 0.6 + float(i) * 0.3);
      waitRing = max(waitRing, smoothstep(0.003, 0.0, abs(length(d) - 0.014 - 0.05 * f)) * (1.0 - f) * a.w);
    }
  }
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float dir = abs(r.w - 1.0) < 0.5 ? -1.0 : 1.0;
    h += dir * 0.08 * exp(-pow((dist - r.z * 0.25) * 16.0, 2.0)) * exp(-r.z);
  }

  // land cover: warm paper, soft woodland on the lower slopes, bare high ground
  vec3 col = base;
  float wood = smoothstep(0.46, 0.6, noise(tq * 1.4 + 9.0)) * smoothstep(0.62, 0.45, h);
  col = mix(col, forest, wood * p_fill);
  col = mix(col, mix(base, vec3(0.93, 0.9, 0.84), 0.6), smoothstep(0.6, 0.85, h) * p_fill);

  // pronounced hillshade: cool shadows, warm highlights
  vec2 g = vec2(dFdx(h), dFdy(h)) / max(px, 1e-5) * 0.12;
  vec3 L = normalize(vec3(-0.7, 0.7, 0.6));
  float dif = dot(normalize(vec3(-g, 1.0)), L) - L.z;
  col *= mix(vec3(1.0), vec3(0.62, 0.67, 0.76), smoothstep(0.0, 0.6, -dif * p_relief));
  col = mix(col, vec3(1.0, 0.98, 0.93), smoothstep(0.0, 0.5, dif * p_relief) * 0.5);

  // water: lakes in the hollows, streams threading the valleys
  float wl = 0.27;
  float hw = max(fwidth(h), 1e-5);
  float lake = smoothstep(hw, -hw, h - wl);
  float sn = noise(tq * 2.6 + 11.0) - 0.5;
  float stream = (1.0 - smoothstep(0.9, 1.8, abs(sn) / max(fwidth(sn), 1e-5))) * smoothstep(0.52, 0.34, h) * step(wl, h);
  col = mix(col, blue * 0.85, stream);

  // contours: thin tan lines, every fifth a heavier index contour
  float v = h * p_density;
  float fw = max(fwidth(v), 1e-4);
  float dMinor = min(fract(v), 1.0 - fract(v)) / fw;
  float mv = fract(v / 5.0);
  float dMajor = min(mv, 1.0 - mv) * 5.0 / fw;
  float minor = (1.0 - smoothstep(0.25 * p_weight, 0.25 * p_weight + 1.0, dMinor)) * smoothstep(0.7, 0.3, fw);
  float major = (1.0 - smoothstep(0.6 * p_weight, 0.6 * p_weight + 1.0, dMajor)) * smoothstep(1.4, 0.6, fw);
  col = mix(col, tanC, minor * 0.6 * (1.0 - lake));
  col = mix(col, tanC * 0.85, major * 0.85 * (1.0 - lake));

  col = mix(col, blue, lake);
  col = mix(col, blue * 0.8, (1.0 - smoothstep(0.4, 1.4, abs(h - wl) / hw)) * 0.6);

  // trails: dashed brown footpaths and one highlighted route in trail green with a white casing
  float tpx = px;
  for (int k = 0; k < 2; k++) {
    float d = trailD(tq, float(k) * 1.7 + 0.4, k == 0 ? -0.55 : 0.55) / tpx;
    float dash = step(0.45, fract(tq.x * 9.0 + float(k) * 0.3));
    col = mix(col, vec3(0.42, 0.3, 0.2), (1.0 - smoothstep(1.0, 2.0, d)) * dash * 0.9 * p_trails * (1.0 - lake));
  }
  float rd = trailD(tq, 2.6, 0.0) / tpx;
  col = mix(col, vec3(1.0), (1.0 - smoothstep(4.6, 5.6, rd)) * 0.95 * p_trails);
  col = mix(col, green, (1.0 - smoothstep(2.9, 3.9, rd)) * p_trails);

  // agents: green location pins with a white ring; waiting ones ping
  float pr = pin;
  float pinW = 1.5 / u_resolution.y;
  col *= 1.0 - 0.25 * smoothstep(0.02, 0.012, pr);
  col = mix(col, vec3(1.0), smoothstep(0.014 + pinW, 0.014, pr));
  col = mix(col, green, smoothstep(0.0105 + pinW, 0.0105, pr));
  col = mix(col, vec3(1.0), smoothstep(0.0036 + pinW, 0.0036, pr));
  col = mix(col, green, waitRing * 0.9);
  return mix(u_canvas, col, p_color);
}`;

export const contour: BuiltInScene = {
  id: "contour",
  name: "Contour",
  source: SOURCE,
  palette: ["#a88b67", "#9ecae8", "#cfe1b6", "#f3f0e7"],
  params: [
    param("scale", "Zoom", 0.5, 5, 1.8),
    param("density", "Line density", 4, 40, 24, 0.5),
    param("weight", "Line weight", 0.5, 3, 1),
    param("relief", "Hillshade", 0, 2, 1),
    param("height", "Agent peaks", 0, 2, 1),
    param("fill", "Land cover", 0, 1, 0.9),
    param("trails", "Trails", 0, 1, 1),
    param("drift", "Drift", 0, 3, 1),
    param("color", "Color strength", 0, 1, 1),
  ],
};
