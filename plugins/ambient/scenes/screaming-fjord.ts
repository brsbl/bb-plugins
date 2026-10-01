import { param, type BuiltInScene } from "./param.js";

const SOURCE = `const int NS = 9;

vec2 perp(vec2 d){ return vec2(-d.y, d.x); }
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }

vec3 starAt(int i, float W){
  float fi = float(i);
  float x = (-1.0 + 2.0*(fi + 0.25 + 0.5*hash21(vec2(fi, 1.3)))/float(NS))*W;
  float y = i == NS - 1 ? 0.2 : 0.22 + 0.24*hash21(vec2(fi, 7.9));
  float r = 0.014 + 0.016*hash21(vec2(fi, 4.1));
  return vec3(x, y, r);
}

vec4 vortex(int i, float W){
  return i == 0 ? vec4(-0.1*W - 0.02, 0.3, 0.14, 1.0) : vec4(0.28*W, 0.27, 0.09, -1.0);
}

float bandT(vec2 p, float sw){ return p.y + 0.028*sin(p.x*3.3 + sw*0.25) + 0.012*sin(p.x*8.0 - sw*0.4); }
float bandTop(){ return 0.05 + 0.15*p_blaze; }
float hillY(float x){ return 0.012 + 0.028*sin(x*2.0 + 0.6) + 0.014*sin(x*5.1 + 2.0); }
float shoreY(float x){ return -0.05 + 0.014*sin(x*3.0 + 1.0) + 0.008*sin(x*7.3); }
float railY(float x, float W){ return -0.12 - 0.24*(x + W)/(2.0*W); }
vec2 deckVP(float W){ return vec2(-W - 0.25, -0.06); }

float cyp(vec2 p, float cx, float H, float wmax, float sw){
  float h = (p.y + 0.52)/H;
  if (h < 0.0 || h > 1.0) return -1.0;
  float sway = 0.035*sin(sw*0.6 + cx*3.0)*h*h;
  float lob = 1.0 + 0.2*sin(h*21.0 + sw*1.1 + cx*5.0) + 0.1*sin(h*45.0 - sw*1.6);
  return wmax*pow(1.0 - h, 0.8)*lob - abs(p.x - cx - sway);
}

vec3 skyCol(vec2 p, float sw, float W){
  vec3 deep = u_palette[0]*0.72 + vec3(0.0, 0.02, 0.07);
  vec3 lite = mix(u_palette[0], vec3(0.78, 0.88, 1.0), 0.55);
  vec3 milk = mix(lite, u_palette[1], 0.35);
  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
  vec2 dp = p - toP(u_pointer);
  vec2 q = p + rot2(dp, 1.6*exp(-dot(dp, dp)/0.008)) - dp;
  float s = noise(vec2(q.x*2.4 - sw*0.05, q.y*15.0 + 2.2*sin(q.x*2.6 + sw*0.1)));
  float L = smoothstep(0.42, 0.8, s)*0.6;
  float wy = 0.22 + 0.06*sin(q.x*2.4 - sw*0.12);
  float M = exp(-pow((q.y - wy)/0.045, 2.0))*(0.6 + 0.4*sin(q.x*22.0 + q.y*25.0 - sw*0.9));
  for (int i = 0; i < 2; i++){
    vec4 v = vortex(i, W);
    vec2 d = q - v.xy;
    float r = length(d);
    float th = atan(d.y, d.x);
    float arm = 0.5 + 0.5*sin(2.0*v.w*th + r/v.z*(3.0 + 7.0*p_twist) - sw);
    float Lv = smoothstep(0.3, 0.85, arm)*smoothstep(0.0, 0.35, r/v.z)*0.9 + 0.5*exp(-r*r/(v.z*v.z*0.04));
    float wgt = exp(-r*r/(v.z*v.z))*min(p_twist + 0.3, 1.0);
    L = mix(L, Lv, wgt);
    M *= 1.0 - wgt;
  }
  vec3 col = mix(deep, lite, L);
  col = mix(col, milk, clamp(M, 0.0, 1.0)*0.85);
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      float fi = float(i);
      float r = s3.z*(1.0 + 0.12*sin(sw*1.7 + fi*2.3));
      float d = length(p - s3.xy);
      if (d > r*4.0) continue;
      float halo = exp(-d*d/(r*r*4.5))*p_stars;
      float rings = 0.5 + 0.5*sin(d/r*6.5 - sw*1.4 + fi);
      col = mix(col, mix(lite*1.08, warm, rings), clamp(halo, 0.0, 1.0)*0.85);
      col = mix(col, mix(u_palette[1], vec3(1.0, 0.96, 0.75), smoothstep(r*0.5, 0.0, d)), smoothstep(r*0.7, r*0.45, d));
    }
    vec2 md = p - vec2(W - 0.15, 0.35);
    float ml = length(md);
    float mh = exp(-ml*ml/0.012)*p_stars;
    col = mix(col, mix(warm, lite*1.1, 0.5 + 0.5*sin(ml*90.0 - sw*1.2)), clamp(mh, 0.0, 1.0)*0.8);
    float cres = smoothstep(0.048, 0.044, ml)*smoothstep(0.038, 0.042, length(md - vec2(-0.02, 0.014)));
    col = mix(col, mix(u_palette[1], mix(u_palette[1], u_palette[2], 0.35), smoothstep(0.02, 0.048, ml)), cres);
  }
  return col;
}

vec3 base(vec2 p, float t, float W){
  float sw = t*p_swirl;
  vec3 red = u_palette[2], yel = u_palette[1], blu = u_palette[0], drk = u_palette[3];
  vec3 col = skyCol(p, sw, W);
  float bt = bandT(p, sw);
  float top = bandTop();
  vec3 B[4] = vec3[4](red, mix(red, yel, 0.5), yel, mix(red, drk, 0.3));
  float k = bt*17.0 + 0.6*sin(p.x*4.0 - sw*0.2) + 0.3*sin(p.x*11.0 + sw*0.3);
  float f = fract(k);
  int bi = int(mod(floor(k), 4.0));
  vec3 bc = mix(B[bi], B[(bi + 1) - 4*((bi + 1)/4)], smoothstep(0.55, 1.0, f));
  bc = mix(bc, yel, smoothstep(0.03, -0.03, bt)*0.35);
  bc = mix(bc, mix(blu, vec3(0.3, 0.62, 0.55), 0.5), smoothstep(0.88, 1.0, sin(bt*11.0 + 2.0 - p.x*0.7))*0.6);
  col = mix(col, bc, smoothstep(top + 0.03, top - 0.03, bt));
  float hy = hillY(p.x);
  if (p.y < hy){
    float n = noise(vec2(p.x*7.0, p.y*40.0));
    float ridge = 0.5 + 0.5*sin((hy - p.y)*140.0 + n*4.0 + p.x*3.0);
    vec3 hc = mix(blu*0.5 + drk*0.25, mix(blu, vec3(0.6, 0.75, 1.0), 0.35), ridge*0.7);
    col = mix(col, hc, smoothstep(hy, hy - 0.004, p.y));
  }
  float sy = shoreY(p.x);
  if (p.y < sy){
    float dep = clamp((sy - p.y)/0.25, 0.0, 1.0);
    vec3 wc = mix(blu*0.8 + vec3(0.05, 0.0, 0.08), blu*0.45 + drk*0.3, dep);
    float rn = noise(vec2(p.x*2.6 - sw*0.05, (p.y + 0.02*sin(p.x*6.0 + sw*0.3))*30.0));
    wc = mix(wc, mix(red, yel, 0.55), smoothstep(0.6, 0.85, rn)*0.6*(1.0 - dep*0.7));
    col = mix(col, wc, smoothstep(sy, sy - 0.004, p.y));
  }
  float ry = railY(p.x, W);
  float lo = ry - 0.075;
  if (p.y < ry + 0.016){
    vec3 wood = mix(red, drk, 0.35);
    if (p.y < lo){
      vec2 dv = p - deckVP(W);
      float pa = atan(dv.y, dv.x);
      float n = noise(vec2(pa*30.0, length(dv)*5.0));
      float pl = 0.5 + 0.5*sin(pa*150.0 + n*4.0);
      float pl2 = 0.5 + 0.5*sin(pa*57.0 + 1.7 + n*2.0);
      vec3 dk = mix(mix(red, yel, 0.35)*0.75, mix(red, drk, 0.35)*0.85, pl*0.7);
      dk = mix(dk, mix(blu, vec3(0.62, 0.6, 0.66), 0.45)*0.85, smoothstep(0.6, 0.95, pl2)*0.6);
      dk = mix(dk, yel*0.85, smoothstep(0.75, 0.95, n)*0.3);
      col = dk*(0.86 + 0.14*smoothstep(-0.5, -0.25, p.y));
    }
    float px = abs(fract(p.x/0.11 + 0.3) - 0.5)*0.11;
    if (p.y < ry && p.y > lo - 0.006) col = mix(col, wood*0.85, smoothstep(0.0075, 0.005, px));
    col = mix(col, wood*0.9, smoothstep(0.0065, 0.0045, abs(p.y - lo)));
    vec3 rc = mix(wood, mix(red, yel, 0.4), smoothstep(-0.012, 0.012, p.y - ry)*0.6);
    col = mix(col, rc, smoothstep(0.014, 0.011, abs(p.y - ry)));
  }
  float cx = W - 0.085;
  float ins = cyp(p, cx, 0.9, 0.075, sw);
  if (ins > -0.004){
    float n = noise(vec2((p.x - cx)*40.0 + 1.5*sin(p.y*9.0 + sw*0.8), p.y*4.0));
    vec3 cc = mix(drk*0.8, mix(drk, vec3(0.28, 0.5, 0.3), 0.55), smoothstep(0.45, 0.85, n));
    cc = mix(cc, mix(red, drk, 0.6), smoothstep(0.8, 0.95, noise(vec2(p.x*60.0, p.y*9.0)))*0.5);
    cc *= 0.75 + 0.25*smoothstep(0.0, 0.03, ins);
    col = mix(col, cc, smoothstep(-0.004, 0.002, ins));
  }
  return col;
}

vec2 skyFlow(vec2 p, float sw, float W){
  vec2 v = vec2(1.0, -0.38*cos(p.x*2.6 + sw*0.1));
  for (int i = 0; i < 2; i++){
    vec4 c = vortex(i, W);
    vec2 d = p - c.xy;
    v += c.w*perp(d)/c.z*exp(-dot(d, d)/(c.z*c.z))*4.0*max(p_twist, 0.2);
  }
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      vec2 d = p - s3.xy;
      v += perp(d)/s3.z*exp(-dot(d, d)/(s3.z*s3.z*5.0))*2.5;
    }
    vec2 d = p - vec2(W - 0.15, 0.35);
    v += perp(d)/0.05*exp(-dot(d, d)/0.01)*2.0;
  }
  return v;
}

vec2 disturb(vec2 p, float t){
  vec2 dp = p - toP(u_pointer);
  vec2 v = perp(dp)/0.07*exp(-dot(dp, dp)/0.008)*2.5;
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    v += perp(d)/0.05*exp(-dot(d, d)/0.005)*2.5*a.w;
  }
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = max(length(d), 1e-3);
    float ring = exp(-pow((dist - r.z*0.16)/0.03, 2.0))*exp(-r.z*0.6);
    v += perp(d)/dist*ring*2.5;
  }
  return v;
}

float formAng(vec2 p, float t, float W){
  float sw = t*p_swirl;
  float ry = railY(p.x, W);
  vec2 dir;
  if (cyp(p, W - 0.085, 0.9, 0.075, sw) > 0.0){
    dir = vec2(0.25*sin(p.y*14.0 + sw*1.2), 1.0);
  } else if (p.y < ry - 0.08){
    dir = p - deckVP(W);
  } else if (p.y < ry + 0.012){
    dir = vec2(1.0, -0.24/(2.0*W));
  } else if (p.y < shoreY(p.x)){
    dir = vec2(1.0, 0.15*sin(p.x*6.0 + sw*0.3));
  } else if (p.y < hillY(p.x)){
    dir = vec2(1.0, 0.056*cos(p.x*2.0 + 0.6) + 0.0714*cos(p.x*5.1 + 2.0));
  } else if (bandT(p, sw) < bandTop() + 0.02){
    dir = vec2(1.0, -(0.0924*cos(p.x*3.3 + sw*0.25) + 0.096*cos(p.x*8.0 - sw*0.4)));
  } else {
    dir = skyFlow(p, sw, W);
  }
  dir = normalize(dir) + disturb(p, t);
  return atan(dir.y, dir.x);
}

vec3 dabLayer(vec2 p, vec2 off, float t, float W, out float m, out float stripe){
  float cell = p_brush;
  vec2 q = p/cell + off;
  vec2 c = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 cp = (c + 0.5 - off)*cell;
  float h = hash21(c + off*7.0);
  float ang = formAng(cp, t, W) + (h - 0.5)*0.3;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 jit = (vec2(h, hash21(c + 3.3)) - 0.5)*0.3;
  vec2 g = f - jit;
  float a = dot(g, dir);
  float b = dot(g, nrm);
  m = length(vec2(a*0.52, b*2.5));
  stripe = sin(b*44.0 + h*20.0)*0.5 + 0.5;
  vec3 col = base(cp + (jit + dir*a*0.9 + nrm*b*0.35)*cell, t, W);
  float h2 = hash21(c + off*3.0 + 11.0);
  col = mix(col, col*vec3(0.85, 0.95, 1.2) + vec3(0.0, 0.02, 0.04), step(0.72, h2)*0.6);
  col = mix(col, col*vec3(1.15, 1.05, 0.85), step(h2, 0.18)*0.5);
  col *= 0.9 + 0.16*smoothstep(0.2, -0.2, b);
  return col;
}

vec3 scene(vec2 uv, vec2 p){
  float t = u_time;
  float W = 0.5*u_resolution.x/u_resolution.y;
  float sw = t*p_swirl;
  float mA, sA, mB, sB;
  vec3 colB = dabLayer(p, vec2(0.0), t, W, mB, sB);
  vec3 colA = dabLayer(p, vec2(0.5, 0.37), t, W, mA, sA);
  colB *= (0.93 + 0.09*sB)*(1.0 - 0.16*smoothstep(0.5, 0.8, mB));
  colA *= 0.93 + 0.1*sA;
  vec3 col = mix(colB, colA, smoothstep(0.62, 0.48, mA));
  col *= 1.0 - 0.1*smoothstep(0.44, 0.54, mA)*smoothstep(0.68, 0.56, mA);
  col *= 0.97 + 0.06*noise(p*150.0);


  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
  vec3 lite = mix(u_palette[0], vec3(0.78, 0.88, 1.0), 0.55);
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    vec2 ap = toP(a.xy);
    vec2 d = p - ap;
    float r = length(d);
    float an = atan(d.y, d.x);
    if (a.z < 0.5){
      float halo = exp(-r*r/0.0035);
      float rings = 0.5 + 0.5*sin(r*150.0 - t*4.0 + an);
      col = mix(col, mix(lite*1.1, warm, rings), halo*0.8*a.w);
      for (int k = 0; k < 3; k++){
        float ph = t*1.8 + float(k)*2.094 + fi;
        vec2 dd = p - ap - 0.045*vec2(cos(ph), sin(ph));
        vec2 tg = vec2(-sin(ph), cos(ph));
        float st = length(vec2(dot(dd, tg)/0.016, dot(dd, perp(tg))/0.0045));
        col = mix(col, warm*1.05, smoothstep(1.0, 0.6, st)*a.w);
      }
      col = mix(col, mix(u_palette[1], vec3(1.0, 0.97, 0.8), smoothstep(0.012, 0.0, r)), smoothstep(0.017, 0.012, r)*a.w);
    } else {
      float pulse = 0.5 + 0.5*sin(t*4.0 + fi);
      for (int k = 0; k < 3; k++){
        float ph = fract(t*0.45 + float(k)/3.0);
        float rr = 0.018 + ph*0.1 + 0.005*sin(an*6.0 + t*3.0 + float(k));
        float ring = exp(-pow((r - rr)/0.006, 2.0))*(1.0 - ph);
        col = mix(col, mix(u_palette[2], u_palette[1], 0.25*float(k)), ring*a.w);
      }
      vec3 skin = mix(u_palette[1], vec3(0.7, 0.66, 0.5), 0.5)*1.1;
      col = mix(col, skin, smoothstep(0.018, 0.012, r)*a.w);
      col = mix(col, u_palette[3], smoothstep(1.0, 0.7, length(vec2(d.x/0.004, (d.y + 0.002)/0.007)))*a.w*(0.6 + 0.4*pulse));
    }
  }

  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float an = atan(d.y, d.x);
    float rad = r.z*0.16 + 0.008*sin(an*5.0 + r.z*6.0);
    float ring = exp(-pow((dist - rad)/0.012, 2.0))*exp(-r.z*0.6);
    if (abs(r.w - 1.0) < 0.5){
      col = mix(col, vec3(0.88, 0.08, 0.05), clamp(ring*1.2 + exp(-dist*dist/0.02)*exp(-r.z*0.8)*0.3, 0.0, 1.0));
    } else {
      col = mix(col, warm, clamp(ring, 0.0, 1.0)*0.8);
    }
  }
  return mix(u_canvas, col, p_color);
}`;

export const screamingFjord: BuiltInScene = {
  id: "swirling-stars-screaming-fjord",
  name: "Swirling Stars, Screaming Fjord",
  source: SOURCE,
  palette: ["#2446a8", "#f6cf3f", "#e04a24", "#102a22"],
  params: [
    param("swirl", "Swirl speed", 0, 3, 1.3, 0.05),
    param("twist", "Vortex twist", 0, 2, 1, 0.05),
    param("brush", "Brush size", 0.006, 0.024, 0.014, 0.001),
    param("stars", "Star glow", 0, 1.5, 1, 0.05),
    param("blaze", "Scream sky height", 0, 1, 0.7, 0.05),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
