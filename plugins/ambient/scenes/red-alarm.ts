import { param, type BuiltInScene } from "./param.js";

const SOURCE = `const float BAY[16] = float[16](0.0,8.0,2.0,10.0,12.0,4.0,14.0,6.0,3.0,11.0,1.0,9.0,15.0,7.0,13.0,5.0);
float bayer(vec2 c) { ivec2 i = ivec2(mod(c, 4.0)); return (BAY[i.x + i.y * 4] + 0.5) / 16.0; }

const float HZ = -0.16;
float g_led;
float g_aspect;

float boxD(vec2 d, vec2 h) { vec2 q = abs(d) - h; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float k = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * k); }

// eyepiece lens: magnifies the middle, crushes the periphery toward the rim
vec2 lens(vec2 p) {
  vec2 e = p / vec2(0.5 * g_aspect, 0.5);
  float r2 = dot(e, e) * 0.5;
  return p * (1.0 + p_bulge * r2) / (1.0 + p_bulge);
}

// subject: monochrome intensity + depth (0 near, 1 far)
vec2 base(vec2 p, float t) {
  float sp = p_speed;
  float led = g_led;
  if (p.y < HZ) {
    // near layer: checkered wireframe floor racing toward the viewer
    float d = HZ - p.y;
    float z = 0.22 / d;
    float zz = z + t * 0.9 * sp;
    float dz = abs(fract(zz + 0.5) - 0.5) * d * d / 0.22;
    float xw = p.x * z * 1.6;
    float dx = abs(fract(xw + 0.5) - 0.5) / (z * 1.6);
    float w = led * 0.55;
    float lz = step(dz, w) * smoothstep(9.0, 2.5, z);
    float lx = step(dx, w) * smoothstep(16.0, 3.0, z);
    float chk = mod(floor(zz + 0.5) + floor(xw + 0.5), 2.0);
    float I = 0.04 + 0.5 * exp(-d * 30.0) + chk * 0.3 * smoothstep(7.0, 1.5, z);
    I = max(I, max(lz, lx) * mix(0.45, 0.98, smoothstep(6.0, 1.0, z)));
    // message packets riding the lanes
    float lane = floor(xw + 0.5);
    float h = hash21(vec2(lane, 3.1));
    float zp = mod(h * 37.0 - t * (1.2 + 1.6 * h) * sp, 14.0) + 0.6;
    float pd = abs(z - zp) * d * d / 0.22;
    if (h < 0.45 && pd < led * 1.6 && dx < led * 1.3) I = 1.0;
    return vec2(I, clamp(z / 10.0, 0.0, 1.0));
  }
  float up = p.y - HZ;
  float I = 0.01 + 0.34 * exp(-up * 16.0);
  if (up < led * 1.5) I = 0.95;
  float dep = 1.0;
  // far layer: skyline of stacked thread cards
  float xf = p.x + t * 0.012 * sp;
  float cw = 0.09;
  float ci = floor(xf / cw);
  float fx = xf - (ci + 0.5) * cw;
  float h1 = hash21(vec2(ci, 1.7));
  float th = 0.07 + 0.3 * h1 * h1;
  float hw = cw * 0.4;
  if (abs(fx) < hw && up < th) {
    float sy = up / 0.026;
    float edge = max(step(hw - led * 1.1, abs(fx)), step(th - led * 1.1, up));
    I = fract(sy) > 0.8 ? 0.06 : 0.24;
    float lit = step(0.8, hash21(vec2(ci, floor(sy)) + floor(t * 0.5 * sp + h1 * 4.0) * 0.13));
    I = max(I, lit * 0.55 * step(fract(sy), 0.8));
    I = max(I, edge * 0.45);
    dep = 0.85;
  }
  // middle layer: thread windows rising out of the horizon, dimming as they scroll away
  vec2 cs = vec2(0.34, 0.26);
  vec2 q = vec2(p.x - t * 0.008 * sp, p.y - t * 0.03 * sp);
  vec2 id = floor(q / cs);
  vec2 f = q - (id + 0.5) * cs;
  float hp = hash21(id + 5.3);
  if (hp < p_panels && up > 0.008) {
    vec2 hs = vec2(0.115 + 0.03 * hash21(id + 9.1), 0.08 + 0.03 * hash21(id + 2.7));
    vec2 ofs = (vec2(hash21(id + 1.3), hash21(id + 7.7)) - 0.5) * vec2(0.06, 0.05);
    vec2 d = f - ofs;
    float bd = boxD(d, hs);
    if (bd < 0.0) {
      dep = 0.45;
      float P = 0.0;
      float top = hs.y - d.y;
      if (top < 0.034) {
        P = 0.55;
        if (boxD(d - vec2(-hs.x + 0.02, hs.y - 0.017), vec2(0.009)) < 0.0) P = 0.12;
        if (abs(d.x - hs.x + 0.022) < led * 2.0 && abs(top - 0.017) < led * 2.0) P = 0.95;
      } else {
        float rowF = (top - 0.04) / 0.024;
        float row = floor(rowF);
        if (rowF > 0.0 && fract(rowF) < 0.42 && top < 2.0 * hs.y - 0.012) {
          float inner = 2.0 * hs.x - 0.03;
          float lx = (d.x + hs.x - 0.015) / inner;
          float hr = hash21(vec2(row, 4.0) + id);
          if (hr > 0.62) lx = 1.0 - lx;
          float len = 0.25 + 0.6 * hash21(vec2(row, 8.0) + id);
          if (lx > 0.0 && lx < len) P = hr > 0.62 ? 0.62 : 0.34;
        }
      }
      if (bd > -led * 1.2) P = 0.8;
      I = P * mix(1.0, 0.42, smoothstep(0.18, 0.6, up));
    }
  }
  return vec2(I, dep);
}

vec3 cubeV(int i) { return vec3((i & 1) == 0 ? -1.0 : 1.0, (i & 2) == 0 ? -1.0 : 1.0, (i & 4) == 0 ? -1.0 : 1.0); }

float events(vec2 p, float t, out float err) {
  float led = g_led;
  float I = 0.0;
  err = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 head = lens(toP(a.xy)) + vec2(0.0, 0.006 * sin(t * 2.1 + float(i)));
    vec2 d = p - head;
    if (dot(d, d) > 0.03) continue;
    if (a.z > 0.5) {
      // waiting: blinking [!] callout with sonar frames
      float blink = step(0.3, fract(t * 1.4));
      float fr = step(abs(boxD(d, vec2(0.04, 0.032))), led * 0.8);
      float ex = step(boxD(d - vec2(0.0, 0.006), vec2(led * 0.9, 0.013)), 0.0) + step(boxD(d + vec2(0.0, 0.02), vec2(led * 0.9)), 0.0);
      I = max(I, max(fr, ex) * mix(0.45, 1.0, blink) * a.w);
      float ph = fract(t * 0.7 + float(i) * 0.3);
      float ring = step(abs(boxD(d, vec2(0.04, 0.032) * (1.0 + ph * 2.2))), led * 0.7);
      I = max(I, ring * (1.0 - ph) * 0.8 * a.w);
    } else {
      // working: spinning wireframe cube with a scan trail
      float R = 0.05 * a.w;
      float ay = t * 1.3 + float(i), ax = 0.55 + 0.25 * sin(t * 0.7 + float(i));
      float cy = cos(ay), sy = sin(ay), cx = cos(ax), sx = sin(ax);
      if (dot(d, d) < 0.0016) {
        float md = 1e3;
        for (int e = 0; e < 12; e++) {
          int axn = e / 4;
          int k = e - axn * 4;
          int lo = k & ((1 << axn) - 1);
          int ia = ((k >> axn) << (axn + 1)) | lo;
          int ib = ia | (1 << axn);
          vec3 va = cubeV(ia), vb = cubeV(ib);
          va = vec3(cy * va.x + sy * va.z, va.y, -sy * va.x + cy * va.z);
          vb = vec3(cy * vb.x + sy * vb.z, vb.y, -sy * vb.x + cy * vb.z);
          vec2 pa = vec2(va.x, cx * va.y - sx * va.z) * R * 0.5;
          vec2 pb = vec2(vb.x, cx * vb.y - sx * vb.z) * R * 0.5;
          md = min(md, segD(d, pa, pb));
        }
        I = max(I, step(md, led * 0.65) * a.w);
      }
      I = max(I, 0.2 * exp(-dot(d, d) / 0.002) * a.w);
      for (int k = 0; k < 6; k++) {
        float fk = float(k) + fract(t * 3.0);
        vec2 tp = vec2(-0.05 - fk * 0.018, 0.004 * sin(fk * 1.7 + t * 3.0));
        float tb = boxD(d - tp, vec2(led * 1.2, led * 0.6));
        I = max(I, step(tb, 0.0) * (1.0 - fk / 6.5) * 0.9 * a.w);
      }
    }
  }
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - lens(toP(r.xy));
    float fade = exp(-r.z * 0.7);
    float sp = r.w > 1.5 ? 0.12 : 0.24;
    float s = r.z * sp + 0.01;
    float bd = boxD(d, vec2(s * 1.35, s));
    float ring = step(abs(bd), led * 0.9) + step(abs(boxD(d, vec2(s * 0.8, s * 0.6))), led * 0.7) * 0.6;
    I = max(I, clamp(ring, 0.0, 1.0) * fade);
    // error: an inverted shockwave band trailing the frame
    if (abs(r.w - 1.0) < 0.5) err = max(err, step(bd, 0.0) * step(-0.08, bd) * exp(-r.z * 0.9) * 1.6);
  }
  return I;
}

vec3 scene(vec2 uv, vec2 p0) {
  float t = u_time;
  float led = 1.0 / p_res;
  g_led = led;
  g_aspect = u_resolution.x / u_resolution.y;
  // cursor knocks the mirror out of sync: rows tear sideways
  vec2 sp0 = p0;
  vec2 dp = p0 - toP(u_pointer);
  float gl = exp(-dot(dp, dp) / 0.012);
  sp0.x += gl * (hash21(vec2(floor(p0.y / led), floor(t * 14.0))) - 0.5) * 0.08;

  // look through the eyepiece: the LED grid itself bends with the lens
  vec2 p = lens(sp0);
  vec2 c = floor(p / led);
  vec2 cp = (c + 0.5) * led;

  // tunnel: elliptical falloff from the middle, dithered into stepped LED rings
  vec2 e = p0 / vec2(0.5 * g_aspect, 0.5);
  float r = length(e * vec2(0.82, 1.0));
  float vig = 1.0 - p_tunnel * smoothstep(0.2, 1.2, r);
  vig *= 1.0 - p_tunnel * 0.9 * smoothstep(1.05, 1.45, r);

  vec2 b = base(cp, t);
  float I = b.x;
  // stereo ghost: near things double like a misaligned eyepiece
  vec2 gb = base(cp + vec2(0.012 * p_stereo, 0.0), t);
  I = max(I, gb.x * (1.0 - gb.y) * 0.45 * step(0.01, p_stereo));
  I *= vig;
  float err;
  I = max(I, events(cp, t, err) * max(vig, 0.65));
  // oscillating mirror sweep
  float sx = mod(t * 0.45, 2.8) - 1.4;
  float band = exp(-pow((p0.x - sx) * 7.0, 2.0));
  I = I * (1.0 + 0.6 * p_scan * band) + 0.07 * p_scan * band * vig;
  I *= 0.9 + 0.1 * hash21(vec2(c.y, 0.37));
  // RED ALARM: inverse video strobe
  float ev = clamp(err, 0.0, 1.0);
  float haz = step(0.5, fract((cp.x + cp.y) / 0.05 - t * 2.0));
  float strobe = 0.5 + 0.5 * step(0.5, fract(t * 4.0));
  I = mix(I, mix(1.0 - I, haz, 0.5), ev * strobe);

  float lvl = clamp(floor(clamp(I, 0.0, 1.0) * 3.0 + bayer(c)), 0.0, 3.0);
  vec3 lc = lvl < 0.5 ? u_palette[0] : lvl < 1.5 ? u_palette[1] : lvl < 2.5 ? u_palette[2] : u_palette[3];
  lc = mix(lc, vec3(1.0, 0.72, 0.6), ev * strobe * step(2.5, lvl) * 0.5);
  vec2 f = fract(p / led) - 0.5;
  float dot_ = smoothstep(0.52, 0.3, max(abs(f.x) * 1.15, abs(f.y)));
  vec3 col = mix(u_palette[0] * 0.7, lc, mix(0.55, 1.0, dot_));
  col += u_palette[2] * 0.06 * clamp(I, 0.0, 1.0);
  // the dark rubber visor swallows the far rim
  col *= mix(1.0, 0.35, p_tunnel * smoothstep(0.95, 1.5, r));
  return mix(u_canvas, col, p_color);
}`;

export const redAlarm: BuiltInScene = {
  id: "red-alarm",
  name: "Red Alarm",
  source: SOURCE,
  palette: ["#140204", "#6e0610", "#d4101c", "#ff4a3a"],
  params: [
    param("speed", "Scroll speed", 0, 3, 0.4),
    param("res", "LED rows", 90, 260, 192, 1),
    param("stereo", "Stereo depth", 0, 2, 0.54),
    param("panels", "Thread panels", 0, 1, 0.76),
    param("scan", "Mirror scan glow", 0, 1, 0.77),
    param("tunnel", "Tunnel vision", 0, 1, 0.04),
    param("bulge", "Eyepiece bulge", 0, 1.5, 0.91),
    param("color", "Color strength", 0, 1, 1),
  ],
};
