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

  // elevation walks the palette: blue valleys, violet slopes, rose ridges, gold only on the summits
  vec3 night = mix(u_palette[0], u_palette[1], 0.3) * 0.8;
  vec3 lit = ramp(clamp(h * 0.62, 0.0, 1.0)) * p_bright;
  vec3 base = mix(night, lit, p_fill);
  vec3 ink = mix(base, u_palette[3] * p_bright, 0.55);
  vec3 col = mix(base, ink, clamp(line * p_lines + major * p_lines * 0.6, 0.0, 1.0));

  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, p_sat);
  // lighten toward a pale tint of the same color, so lighter never means grayer
  col = mix(col, mix(vec3(1.0), col / max(max(max(col.r, col.g), col.b), 1e-3), 0.35), p_lift);
  return mix(u_canvas, col, p_color);
}`;

export const contour: BuiltInScene = {
  id: "contour",
  name: "Contour",
  source: SOURCE,
  palette: ["#526181", "#3a2d8f", "#e0457b", "#ffd36b"],
  params: [
    param("scale", "Zoom", 0.5, 5, 1.6, 0.01),
    param("density", "Line density", 2, 30, 22, 0.5),
    param("weight", "Line weight", 0.5, 3, 1, 0.01),
    param("lines", "Line contrast", 0, 1, 0.38, 0.01),
    param("height", "Agent peaks", 0, 2, 1.54, 0.01),
    param("fill", "Fill", 0, 1, 0.75, 0.01),
    param("bright", "Brightness", 0.2, 1, 0.9, 0.01),
    param("lift", "Base lightness", 0, 0.8, 0.3, 0.01),
    param("sat", "Saturation", 0, 1, 0.85, 0.01),
    param("drift", "Drift", 0, 3, 0.6, 0.01),
    param("color", "Color strength", 0, 1, 1, 0.01),
  ],
};
