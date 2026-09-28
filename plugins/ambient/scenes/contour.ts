import { param, type BuiltInScene } from "./param.js";

const SOURCE = `vec3 scene(vec2 uv, vec2 p) {
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

export const contour: BuiltInScene = {
  id: "contour",
  name: "Contour",
  source: SOURCE,
  palette: ["#0d1b3e", "#3a2d8f", "#e0457b", "#ffd36b"],
  params: [
    param("scale", "Zoom", 0.5, 5, 1.6),
    param("density", "Line density", 2, 30, 22, 0.5),
    param("weight", "Line weight", 0.5, 3, 1),
    param("height", "Agent peaks", 0, 2, 1.9),
    param("fill", "Fill", 0, 1, 0.5),
    param("drift", "Drift", 0, 3, 1),
    param("color", "Color strength", 0, 1, 1),
  ],
};
