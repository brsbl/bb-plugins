import { param, type BuiltInScene } from "./param.js";

const SOURCE = `struct Clay { vec3 alb; vec2 g; float ao; float z; vec3 emit; };

float slopeOf(float u){ return clamp(-u / sqrt(max(1.0 - u*u, 0.02)), -3.0, 3.0); }

float wEdge(float fi, float x, float t, out float d1){
  float base = -0.03 - fi*0.105;
  float amp = 0.016 + 0.009*fi;
  float k = 3.2 + fi*1.1;
  float s = (0.35 + 0.3*fi)*p_swell;
  float a1 = x*k - t*s + fi*1.7;
  float a2 = x*k*2.3 + t*s*0.6 + fi*2.9;
  d1 = amp*k*cos(a1) + amp*0.4*k*2.3*cos(a2);
  return base + amp*sin(a1) + amp*0.4*sin(a2);
}

float lumpR(vec2 d, float r, float lump){
  float an = atan(d.y, d.x);
  return r*(1.0 + lump*(sin(an*3.0 + r*300.0) + 0.6*sin(an*7.0 + r*170.0)));
}

void dome(inout Clay c, vec2 d, float r, vec3 col, float z, inout float best, float lift, float lump){
  r = lumpR(d, r, lump);
  float l = length(d);
  if (l >= r) return;
  float hh = sqrt(r*r - l*l) + lift;
  if (hh <= best) return;
  best = hh;
  c.alb = col;
  c.g = -d / max(sqrt(r*r - l*l), r*0.3);
  c.z = z;
  c.ao = 1.0;
}

vec4 puff(float ci, int k, float t){
  float fk = float(k);
  float h = hash21(vec2(ci, 3.7));
  float hk = hash21(vec2(ci, fk + 2.0));
  float cy = 0.3 + 0.12*hash21(vec2(ci, 9.1));
  float cx = (ci + 0.5)*0.3 - t*0.018;
  vec2 pc = vec2(cx + (fk - 1.0)*0.05*(0.8 + 0.4*h), cy + (k == 1 ? 0.02 : 0.004*hk) + 0.004*sin(t*1.3 + fk + ci));
  float r = (k == 1 ? 0.048 : 0.028 + 0.012*hk)*(0.85 + 0.3*h);
  return vec4(pc, r, h < 0.3 ? 0.0 : cy);
}

float castMask(vec2 p, float t, float aspect){
  float m = 0.0;
  float c0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(c0 + float(j), k, t);
      if (pf.w == 0.0) continue;
      m = max(m, smoothstep(pf.z, pf.z*0.8, length(p - pf.xy)));
    }
  }
  float lx0 = 0.5*aspect - 0.13;
  float ty = p.y + 0.22;
  float hw = mix(0.038, 0.025, clamp(ty/0.3, 0.0, 1.0)) + 0.004;
  m = max(m, step(0.0, ty)*step(ty, 0.36)*smoothstep(hw, hw - 0.008, abs(p.x - lx0)));
  return m;
}

Clay subject(vec2 p, float t, float aspect){
  Clay c;
  c.ao = 1.0; c.g = vec2(0.0); c.z = 0.0; c.emit = vec3(0.0);
  float sy = smoothstep(-0.05, 0.45, p.y);
  c.alb = mix(mix(u_palette[2], u_palette[3], 0.45), u_palette[0], sy);
  c.alb = mix(c.alb, u_palette[2]*0.9 + vec3(0.06, 0.0, 0.1), exp(-pow((p.y - 0.1)/0.08, 2.0))*0.45);
  float sn = noise(p*vec2(2.5, 14.0));
  float sm = sin(p.y*80.0 + 6.0*sn + 2.0*sin(p.x*4.0));
  c.g = vec2(0.05*sm, 0.16*sm);
  c.alb *= 0.95 + 0.1*sn;
  c.ao = 1.0 - 0.32*castMask(p + vec2(-0.017, 0.017), t, aspect);
  float best = 0.0;
  float cc0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(cc0 + float(j), k, t);
      if (pf.w == 0.0 || p.y < pf.w - 0.03) continue;
      vec3 cl = mix(mix(u_palette[3], vec3(1.0), 0.3), u_palette[2]*0.9 + 0.12, smoothstep(pf.w + 0.03, pf.w - 0.03, p.y)*0.5);
      dome(c, p - pf.xy, pf.z, cl, 0.3, best, 0.0, 0.06);
    }
  }
  // clay seagulls wheeling across the sky, flapping as they go
  for (int gi = 0; gi < 6; gi++){
    float fg = float(gi);
    if (fg >= p_gulls) break;
    float span = aspect + 0.5;
    float gx = mod(fg*0.37*span + t*(0.022 + 0.008*fg), span) - span*0.5;
    float gy = 0.17 + 0.22*hash21(vec2(fg, 4.0)) + 0.02*sin(t*0.7 + fg*2.0);
    float S = 0.016 + 0.008*hash21(vec2(fg, 6.0));
    vec2 q = (p - vec2(gx, gy))/S;
    if (abs(q.x) > 1.25 || abs(q.y) > 1.1) continue;
    float flap = 0.5*sin(t*5.0 + fg*1.9);
    float ax = min(abs(q.x), 1.0);
    float wy = (0.4 + flap)*sin(3.1416*ax)*0.75 - 0.15*ax;
    float th = 0.17*(1.0 - 0.75*ax);
    float wing = max(abs(q.y - wy) - th, abs(q.x) - 1.0);
    float body = length(q/vec2(0.3, 0.16)) - 1.0;
    if (min(wing, body*0.16) < 0.0){
      float u = clamp((q.y - wy)/max(th, 1e-3), -1.0, 1.0);
      c.alb = mix(vec3(0.95, 0.94, 0.92), u_palette[0]*0.7, smoothstep(0.7, 0.95, ax));
      c.g = body < 0.0 ? -q/0.3*0.6 : vec2(0.0, slopeOf(u)*0.45);
      c.z = 0.55; c.ao = 1.0;
    }
  }
  float hx = p.x;
  float he = 0.03 + 0.035*sin(hx*2.3 + 1.0) + 0.016*sin(hx*5.3 + 0.4);
  float hd = 0.035*2.3*cos(hx*2.3 + 1.0) + 0.016*5.3*cos(hx*5.3 + 0.4);
  if (p.y < he){
    float r = 0.022;
    float s = clamp((he - p.y)/r, 0.0, 1.0);
    float dh = (1.0 - s)/sqrt(max(1.0 - (1.0 - s)*(1.0 - s), 0.03));
    c.g = clamp(dh, 0.0, 3.0)*vec2(hd, -1.0)*0.7;
    c.alb = mix(mix(u_palette[0], u_palette[1], 0.5), u_palette[2], 0.1);
    c.alb *= 0.9 + 0.2*noise(p*vec2(9.0, 30.0));
    c.z = 0.35; c.ao = 1.0;
  }
  float lx0 = 0.5*aspect - 0.13;
  float isWater = 0.0;
  for (int i = 0; i < 4; i++){
    float fi = float(i);
    float de;
    float e = wEdge(fi, p.x, t, de);
    if (i == 3){
      vec2 rd = (p - vec2(lx0 + 0.01, -0.25))/vec2(0.11, 0.065);
      float rl = length(rd);
      if (rl < 1.0 + 0.08*noise(p*40.0)){
        c.alb = mix(u_palette[0]*0.8 + 0.1, u_palette[1]*0.5, 0.3);
        c.g = -rd/max(sqrt(max(1.0 - rl*rl, 0.0)), 0.3)*0.9;
        c.z = 0.8; c.ao = 1.0; isWater = 0.0;
      }
      float ty = p.y + 0.22;
      if (ty > 0.0 && ty < 0.3){
        float hw = mix(0.038, 0.025, ty/0.3);
        float u = (p.x - lx0 + 0.002*sin(ty*40.0))/hw;
        if (abs(u) < 1.0){
          float band = mod(floor(ty/0.055 + 0.08*sin(p.x*120.0)), 2.0);
          c.alb = band < 0.5 ? u_palette[2] : mix(u_palette[3], vec3(1.0), 0.3);
          c.g = vec2(slopeOf(u)*0.8, 0.0);
          c.z = 0.8; c.ao = 1.0; isWater = 0.0;
        }
      }
      if (ty >= 0.3 && ty < 0.335 && abs(p.x - lx0) < 0.028){
        float u = (p.x - lx0)/0.028;
        float bar = step(0.8, fract(u*2.0 + 0.5));
        c.alb = mix(u_palette[3]*1.1, u_palette[0], bar*0.8);
        c.g = vec2(slopeOf(u)*0.5, 0.0);
        c.emit += u_palette[3]*(1.0 - bar)*0.55;
        c.z = 0.8;
      }
      vec2 cd = (p - vec2(lx0, 0.115))/vec2(0.034, 0.032);
      float cl = length(cd);
      if (cd.y > 0.0 && cl < 1.0){
        c.alb = u_palette[2]*0.9;
        c.g = -cd/max(sqrt(1.0 - cl*cl), 0.3)*0.8;
        c.z = 0.8;
      }
    }
    if (p.y < e){
      float d = (e - p.y)*(1.0 + 0.14*sin(p.x*5.0 + fi*2.0) + 0.06*sin(p.x*13.0 - fi));
      float w = 0.026*p_coil*(0.75 + 0.12*fi);
      float ci = floor(d/w);
      float u = 2.0*fract(d/w) - 1.0;
      float dh = slopeOf(u);
      c.g = dh*vec2(de, -1.0)*(0.55 + 0.12*fi);
      float aoMin = mix(0.55, 0.72, step(2.5, fi));
      c.ao = aoMin + (1.0 - aoMin)*sqrt(max(1.0 - u*u, 0.0));
      vec3 sea = mix(u_palette[1], u_palette[0], clamp(ci*0.11 + (3.0 - fi)*0.08, 0.0, 0.7));
      sea *= 0.92 + 0.16*hash21(vec2(ci, fi*7.0 + 1.0));
      sea = mix(sea, mix(u_palette[2], u_palette[3], 0.5), (3.0 - fi)*0.07);
      vec3 foam = mix(u_palette[3], vec3(1.0), 0.35);
      foam = mix(foam, u_palette[1], step(2.5, fi)*0.35);
      c.alb = ci < 0.5 ? foam : sea;
      c.z = 0.45 + fi*0.18;
      isWater = ci < 0.5 ? 0.0 : 1.0;
    } else {
      c.ao *= 0.5 + 0.5*smoothstep(0.0, 0.035, p.y - e);
    }
  }
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    if (a.w < 0.05) continue;
    float fi = float(i);
    vec2 ap = toP(a.xy);
    float by = 0.0, bs = 0.0, bslope = 0.0;
    for (int b = 0; b < 4; b++){
      float db;
      float eb = wEdge(float(b), ap.x, t, db);
      if (b == 0 || eb >= ap.y - 0.08){ by = eb; bs = float(b); bslope = db; }
    }
    float sc2 = a.w*(0.8 + 0.17*bs);
    vec2 d = p - vec2(ap.x, by + 0.004);
    float ta = -atan(bslope)*0.6;
    d = vec2(cos(ta)*d.x - sin(ta)*d.y, sin(ta)*d.x + cos(ta)*d.y)/sc2;
    float waiting = step(0.5, a.z);
    if (isWater > 0.5 && d.y < -0.022 && d.y > -0.1 && abs(d.x) < 0.07){
      // the boat's wobbling reflection: pale sail above a dark hull smear
      float k = (-d.y - 0.022)/0.078;
      float wob = 0.007*sin(d.y*170.0 + t*3.0 + fi);
      float sail = smoothstep(0.022*(1.0 - 0.5*k), 0.0, abs(d.x - 0.022 + wob))*(1.0 - k)*step(0.012, -d.y - 0.022);
      float hull = smoothstep(0.04, 0.0, abs(d.x + wob))*smoothstep(0.014, 0.0, -d.y - 0.022);
      c.alb = mix(c.alb, mix(u_palette[3], vec3(1.0), 0.3), sail*0.4);
      c.alb = mix(c.alb, u_palette[2]*0.7, hull*0.35);
    }
    if (d.x > 0.07 || d.x < -0.16 || abs(d.y) > 0.1) continue;
    if (waiting < 0.5){
      float sh = fract(t*0.9 + fi*0.3);
      for (int k = 0; k < 3; k++){
        float fk = float(k) + sh;
        vec2 pc = vec2(-0.05 - fk*0.03, -0.012 + 0.003*sin(fk*3.0));
        float r = 0.012*(1.0 - fk*0.26);
        if (r > 0.0) dome(c, d - pc, r, mix(u_palette[3], vec3(1.0), 0.45), 1.0, best, 1.0, 0.05);
      }
    }
    if (d.y < 0.0 && d.y > -0.022){
      float hw = 0.046 - (-d.y)*0.9;
      if (abs(d.x) < hw){
        float u = (d.y + 0.011)/0.011;
        c.alb = d.y > -0.005 ? mix(u_palette[3], vec3(1.0), 0.3) : u_palette[2];
        c.g = vec2(slopeOf(d.x/hw)*0.3, slopeOf(u)*0.8);
        c.z = 1.0; c.ao = 1.0;
      }
    }
    if (abs(d.x) < 0.0025 && d.y >= 0.0 && d.y < 0.074){
      c.alb = u_palette[0]; c.g = vec2(slopeOf(d.x/0.0025)*0.5, 0.0); c.z = 1.0; c.ao = 1.0;
    }
    float sy2 = (d.y - 0.006)/0.064;
    if (sy2 > 0.0 && sy2 < 1.0){
      float sw = 0.042*(1.0 - sy2);
      if (d.x > 0.005 && d.x < 0.005 + sw){
        float u = (d.x - 0.005)/max(sw, 1e-3)*2.0 - 1.0;
        c.alb = mix(u_palette[3], vec3(1.0), 0.35);
        c.g = vec2(slopeOf(u)*0.35, -0.2);
        c.z = 1.0; c.ao = 1.0;
      }
      float jw = 0.03*(1.0 - sy2*1.2);
      if (d.x < -0.005 && d.x > -0.005 - jw){
        c.alb = mix(u_palette[2], u_palette[3], 0.3);
        c.g = vec2(0.35, -0.15);
        c.z = 1.0; c.ao = 1.0;
      }
    }
    if (waiting > 0.5){
      float pulse = 0.5 + 0.5*sin(t*4.0 + fi);
      vec2 ld = d - vec2(0.0, 0.078);
      float l2 = dot(ld, ld);
      c.emit += u_palette[3]*(exp(-l2/0.00006)*1.2 + smoothstep(0.004, 0.0, abs(sqrt(l2) - 0.012 - 0.014*pulse))*0.7*(1.0 - pulse*0.5))*a.w;
    }
  }
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float rad = r.z*0.14;
    float x = (dist - rad)/0.016;
    float G = exp(-x*x)*exp(-r.z*0.55);
    vec2 dir = d/max(dist, 1e-4);
    c.g += dir*(-2.0*x)*G*1.2;
    bool err = abs(r.w - 1.0) < 0.5;
    vec3 rc = err ? vec3(0.92, 0.1, 0.07) : mix(u_palette[3], vec3(1.0), 0.3);
    c.alb = mix(c.alb, rc, clamp(G*1.6, 0.0, 1.0));
    if (err) c.emit += vec3(0.5, 0.03, 0.02)*G;
  }
  vec2 dp = p - toP(u_pointer);
  float pr = length(dp);
  float PG = exp(-pr*pr/0.0025);
  c.g += (dp/max(pr, 1e-4))*(2.0*pr/0.0025)*PG*0.05;
  c.ao *= 1.0 - 0.2*PG;
  return c;
}

float thumbH(vec2 p){
  float lump = 0.008*noise(p*14.0);
  float cs = 0.09;
  vec2 cc = floor(p/cs);
  float h = hash21(cc);
  vec2 ctr = (cc + 0.4 + 0.2*vec2(h, hash21(cc + 5.0)))*cs;
  vec2 q = p - ctr;
  float an = h*6.2831;
  q = vec2(cos(an)*q.x + sin(an)*q.y, -sin(an)*q.x + cos(an)*q.y);
  float e = length(q*vec2(1.0, 1.5));
  float print = step(0.6, h)*smoothstep(0.034, 0.012, e);
  return (lump + print*(0.0007*sin(e*320.0) - 0.0025))*p_thumb;
}

vec3 scene(vec2 uv, vec2 p){
  float aspect = u_resolution.x/u_resolution.y;
  float fps = max(p_fps, 1.0);
  float frame = floor(u_time*fps);
  float T = frame/fps;
  Clay c = subject(p, T, aspect);
  vec2 boil = (vec2(hash21(vec2(frame, 1.0)), hash21(vec2(frame, 2.0))) - 0.5)*0.002;
  float ep = 0.0018;
  float t0 = thumbH(p + boil);
  vec2 tg = vec2(thumbH(p + boil + vec2(ep, 0.0)) - t0, thumbH(p + boil + vec2(0.0, ep)) - t0)/ep;
  c.g += tg*mix(0.4, 1.0, c.z);
  vec3 N = normalize(vec3(-c.g, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.55, 0.62));
  vec3 F = normalize(vec3(0.7, 0.1, 0.7));
  float diff = max(dot(N, L), 0.0);
  float fil = max(dot(N, F), 0.0);
  vec3 col = c.alb*(0.32*c.ao + 0.85*diff*vec3(1.0, 0.93, 0.82)*sqrt(c.ao) + 0.22*fil*vec3(0.6, 0.7, 0.95));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  col += pow(max(dot(N, H), 0.0), 22.0)*0.14*vec3(1.0, 0.95, 0.85);
  col += pow(1.0 - N.z, 2.0)*0.18*mix(u_palette[3], u_palette[1], 0.4);
  col = mix(col, c.alb*0.95*c.ao, (1.0 - c.z)*0.22);
  col += c.emit;
  vec2 lamp = vec2(0.5*aspect - 0.13, 0.097);
  float ang = T*0.55;
  vec2 bd = p - lamp;
  float side = cos(ang);
  float facing = max(sin(ang), 0.0)*(1.0 - abs(side));
  float along = bd.x*sign(side);
  float spread = 0.01 + max(along, 0.0)*(0.09 + 0.25*(1.0 - abs(side)));
  float cone = exp(-pow((bd.y - along*0.015)/spread, 2.0))*exp(-max(along, 0.0)*0.5)*step(0.0, along)*sqrt(abs(side));
  float rays = 0.75 + 0.25*noise(vec2(atan(bd.y, abs(bd.x))*40.0, T*0.4));
  float lampGlow = exp(-dot(bd, bd)/0.0012)*(0.6 + 2.0*facing);
  vec3 beamC = mix(u_palette[3], vec3(1.0, 0.98, 0.9), 0.5);
  col += beamC*(cone*0.75*rays*(1.0 - smoothstep(0.55, 0.75, c.z)) + lampGlow*0.5)*p_beam;
  col *= 1.0 + 0.025*(hash21(vec2(frame, 7.0)) - 0.5);
  return mix(u_canvas, col, p_color);
}`;

export const plasticineCove: BuiltInScene = {
  id: "plasticine-lighthouse-cove",
  name: "Lighthouse Cove",
  source: SOURCE,
  palette: ["#1c2c6b", "#22b3a6", "#ff6a3d", "#ffe0a6"],
  params: [
    param("swell", "Swell speed", 0, 2.5, 1, 0.05),
    param("coil", "Coil thickness", 0.5, 2, 1, 0.05),
    param("thumb", "Thumbprints", 0, 2.5, 1, 0.05),
    param("fps", "Stop-motion fps", 4, 24, 12, 1),
    param("beam", "Lighthouse beam", 0, 2, 1, 0.05),
    param("gulls", "Seagulls", 0, 6, 3, 1),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
