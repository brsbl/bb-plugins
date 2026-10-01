import { param, type BuiltInScene } from "./param.js";

const SOURCE = `const int NS = 9;

vec2 perp(vec2 d){ return vec2(-d.y, d.x); }
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }

vec3 starAt(int i, float W){
  float fi = float(i);
  float x = (-1.0 + 2.0*(fi + 0.25 + 0.5*hash21(vec2(fi, 1.3)))/float(NS))*W;
  float y = 0.24 + 0.22*hash21(vec2(fi, 7.9));
  float r = 0.014 + 0.016*hash21(vec2(fi, 4.1));
  return vec3(x, y, r);
}

vec4 vortex(int i, float W){
  return i == 0 ? vec4(-0.12*W - 0.02, 0.33, 0.14, 1.0) : vec4(0.26*W, 0.3, 0.09, -1.0);
}

float bandT(vec2 p, float sw){ return p.y + 0.035*sin(p.x*3.1 + sw*0.25) + 0.015*sin(p.x*7.7 - sw*0.35); }
float hillY(float x, float W){ return 0.015 + 0.09*smoothstep(0.0, -0.85, x/W) + 0.02*sin(x*2.0 + 0.6) + 0.012*sin(x*5.1 + 2.0); }
float shoreY(float x){ return -0.05 + 0.014*sin(x*3.0 + 1.0) + 0.008*sin(x*7.3); }
float railY(float x, float W){ return -0.12 - 0.24*(x + W)/(2.0*W); }
vec2 deckVP(float W){ return vec2(-W - 0.25, -0.06); }

// Van Gogh's cypress as a dark flame licking upward
float cyp(vec2 p, float cx, float sw){
  float h = (p.y + 0.52)/1.0;
  if (h < 0.0 || h > 1.0) return -1.0;
  float sway = 0.05*sin(sw*0.6 + cx*3.0)*h*h + 0.02*sin(h*9.0 - sw*1.3)*h;
  float lob = 1.0 + 0.3*sin(h*16.0 - sw*1.6 + cx*5.0) + 0.14*sin(h*37.0 - sw*2.4);
  return 0.09*pow(1.0 - h, 0.75)*lob - abs(p.x - cx - sway);
}

vec3 skyCol(vec2 p, float sw, float W){
  vec3 red = u_palette[2], yel = u_palette[1], blu = u_palette[0];
  vec3 blood = red*vec3(0.88, 0.62, 0.55);
  vec3 cream = mix(yel, vec3(1.0, 0.97, 0.85), 0.5);
  vec2 dp = p - toP(u_pointer);
  vec2 q = p + rot2(dp, 1.6*exp(-dot(dp, dp)/0.008)) - dp;
  // Munch's sky: wavy bands of blood red, orange and yellow, deepening upward
  float bt = bandT(q, sw);
  float k = bt*13.0 + 0.5*sin(q.x*4.0 - sw*0.2);
  float band = 0.5 + 0.5*sin(k*3.1416);
  float hgt = smoothstep(0.03, 0.48, bt);
  vec3 low = mix(yel, mix(red, yel, 0.45), band);
  vec3 high = mix(red, blood, band);
  vec3 col = mix(low, high, hgt);
  col = mix(col, mix(blu, vec3(0.42, 0.62, 0.58), 0.5), smoothstep(0.93, 0.99, sin(bt*9.0 + 1.3 - q.x*0.6))*0.5);
  // Van Gogh's vortices churn through it
  for (int i = 0; i < 2; i++){
    vec4 v = vortex(i, W);
    vec2 d = q - v.xy;
    float r = length(d);
    float th = atan(d.y, d.x);
    float arm = 0.5 + 0.5*sin(2.0*v.w*th + r/v.z*(3.0 + 7.0*p_twist) - sw);
    float Lv = smoothstep(0.3, 0.85, arm)*smoothstep(0.0, 0.35, r/v.z);
    float wgt = exp(-r*r/(v.z*v.z))*min(p_twist + 0.3, 1.0);
    col = mix(col, mix(blood, mix(yel, cream, 0.4), Lv), wgt*0.85);
  }
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      float fi = float(i);
      float r = s3.z*(1.0 + 0.12*sin(sw*1.7 + fi*2.3));
      float d = length(p - s3.xy);
      if (d > r*4.0) continue;
      float halo = exp(-d*d/(r*r*4.5))*p_stars;
      float rings = 0.5 + 0.5*sin(d/r*6.5 - sw*1.4 + fi);
      col = mix(col, mix(yel, cream, rings), clamp(halo, 0.0, 1.0)*0.8);
      col = mix(col, vec3(1.0, 0.97, 0.82), smoothstep(r*0.6, r*0.35, d));
    }
    vec2 md = p - vec2(W - 0.2, 0.37);
    float ml = length(md);
    col = mix(col, mix(yel, cream, 0.5 + 0.5*sin(ml*90.0 - sw*1.2)), clamp(exp(-ml*ml/0.012)*p_stars, 0.0, 1.0)*0.75);
    float cres = smoothstep(0.048, 0.044, ml)*smoothstep(0.038, 0.042, length(md - vec2(-0.02, 0.014)));
    col = mix(col, cream, cres);
  }
  return col;
}

vec3 base(vec2 p, float t, float W){
  float sw = t*p_swirl;
  vec3 red = u_palette[2], yel = u_palette[1], blu = u_palette[0], drk = u_palette[3];
  vec3 col = skyCol(p, sw, W);
  // the far shore: blue-black hills across the fjord
  float hy = hillY(p.x, W);
  if (p.y < hy){
    float n = noise(vec2(p.x*7.0, p.y*40.0));
    float ridge = 0.5 + 0.5*sin((hy - p.y)*120.0 + n*4.0 + p.x*3.0);
    vec3 hc = mix(drk*0.9 + blu*0.15, mix(blu, drk, 0.35), ridge*0.6);
    col = mix(col, hc, smoothstep(hy, hy - 0.004, p.y));
  }
  // the fjord: deep blue water with the sky's fire caught in it
  float sy = shoreY(p.x);
  if (p.y < sy){
    float dep = clamp((sy - p.y)/0.25, 0.0, 1.0);
    vec3 wc = mix(blu*0.95, blu*0.45 + drk*0.35, dep);
    float rn = noise(vec2(p.x*2.6 - sw*0.05, (p.y + 0.02*sin(p.x*6.0 + sw*0.3))*30.0));
    wc = mix(wc, mix(red, yel, 0.5), smoothstep(0.62, 0.85, rn)*0.5*(1.0 - dep*0.6));
    col = mix(col, wc, smoothstep(sy, sy - 0.004, p.y));
  }
  // the bridge deck and its railing
  float ry = railY(p.x, W);
  float lo = ry - 0.075;
  if (p.y < ry + 0.016){
    vec3 wood = mix(red, drk, 0.45);
    if (p.y < lo){
      vec2 dv = p - deckVP(W);
      float pa = atan(dv.y, dv.x);
      float n = noise(vec2(pa*30.0, length(dv)*5.0));
      float pl = 0.5 + 0.5*sin(pa*150.0 + n*4.0);
      vec3 dk = mix(mix(red, yel, 0.3)*0.75, mix(red, drk, 0.4)*0.8, pl*0.7);
      dk = mix(dk, yel*0.85, smoothstep(0.75, 0.95, n)*0.3);
      col = dk*(0.86 + 0.14*smoothstep(-0.5, -0.25, p.y));
    }
    float px = abs(fract(p.x/0.11 + 0.3) - 0.5)*0.11;
    if (p.y < ry && p.y > lo - 0.006) col = mix(col, wood*0.85, smoothstep(0.0075, 0.005, px));
    col = mix(col, wood*0.9, smoothstep(0.0065, 0.0045, abs(p.y - lo)));
    vec3 rc = mix(wood, mix(red, yel, 0.35), smoothstep(-0.012, 0.012, p.y - ry)*0.6);
    col = mix(col, rc, smoothstep(0.014, 0.011, abs(p.y - ry)));
  }
  return col;
}

vec2 skyFlow(vec2 p, float sw, float W){
  vec2 v = vec2(1.0, -(0.1085*cos(p.x*3.1 + sw*0.25) + 0.1155*cos(p.x*7.7 - sw*0.35)));
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
    vec2 d = p - vec2(W - 0.2, 0.37);
    v += perp(d)/0.05*exp(-dot(d, d)/0.01)*2.0;
  }
  return v;
}

vec2 disturb(vec2 p){
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
  if (p.y < ry - 0.08){
    dir = p - deckVP(W);
  } else if (p.y < ry + 0.012){
    dir = vec2(1.0, -0.24/(2.0*W));
  } else if (p.y < shoreY(p.x)){
    dir = vec2(1.0, 0.15*sin(p.x*6.0 + sw*0.3));
  } else if (p.y < hillY(p.x, W)){
    dir = vec2(1.0, 0.04*cos(p.x*2.0 + 0.6) + 0.06*cos(p.x*5.1 + 2.0));
  } else {
    dir = skyFlow(p, sw, W);
  }
  dir = normalize(dir) + disturb(p);
  return atan(dir.y, dir.x);
}

vec3 scene(vec2 uv, vec2 p){
  float t = u_time;
  float W = 0.5*u_resolution.x/u_resolution.y;

  // long overlapping strokes laid along the local flow; the topmost one covering a pixel wins
  float cell = p_brush;
  float ang = formAng(p, t, W);
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 g0 = floor(p/cell);
  float bestPri = -1.0, sa = 0.0, sb = 0.0, sh = 0.0, shw = 1.0;
  vec2 sc = p;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++){
    vec2 id = g0 + vec2(float(i), float(j));
    float h = hash21(id);
    vec2 c = (id + 0.5 + (vec2(h, hash21(id + 3.3)) - 0.5)*0.8)*cell;
    vec2 g = (p - c)/cell;
    float a = dot(g, dir), b = dot(g, nrm);
    float L = 0.9 + 1.1*hash21(id + 7.7);
    float hw = (0.3 + 0.16*hash21(id + 5.1))*(1.0 - pow(clamp(abs(a)/L, 0.0, 1.0), 3.0));
    if (abs(a) < L && abs(b) < hw){
      float pri = hash21(id + 9.4);
      if (pri > bestPri){ bestPri = pri; sa = a/L; sb = b/max(hw, 1e-3); sh = h; shw = hw; sc = c; }
    }
  }
  vec3 col;
  if (bestPri < 0.0){
    col = base(p, t, W)*0.82;
  } else {
    col = base(sc + dir*sa*cell*0.35, t, W);
    col = mix(col, col*vec3(0.88, 0.96, 1.15), step(0.78, sh)*0.45);
    col = mix(col, col*vec3(1.12, 1.03, 0.86), step(sh, 0.16)*0.4);
    // impasto: a lit ridge on one flank, bristle grooves, a darker lip of paint at the edge
    float imp = p_impasto;
    col *= 1.0 + 0.16*imp*(smoothstep(0.6, -0.6, sb) - 0.5);
    col *= 1.0 - 0.06*imp*(0.5 + 0.5*sin(sb*9.0 + sh*30.0));
    col *= 1.0 - 0.14*imp*smoothstep(0.7, 1.0, abs(sb));
    col += 0.06*imp*smoothstep(0.35, 0.0, abs(sb + 0.45))*(1.0 - abs(sa));
  }
  col *= 0.97 + 0.05*noise(p*160.0);

  // the cypress, painted over the strokes as one dark flame with a clean edge and its own upward strokes
  {
    float sw = t*p_swirl;
    float cx = W - 0.09;
    float ins = cyp(p, cx, sw);
    if (ins > -0.006){
      float k = clamp((p.y + 0.52), 0.0, 1.0);
      vec2 fq = vec2((p.x - cx)*55.0 + 2.0*sin(p.y*10.0 - sw*1.4), p.y*7.0 - sw*0.3);
      float flame = noise(fq)*0.65 + noise(fq*vec2(2.3, 1.7) + 4.0)*0.35;
      vec3 drkC = u_palette[3];
      vec3 cc = mix(drkC*0.5 + vec3(0.0, 0.03, 0.02), mix(drkC, vec3(0.16, 0.36, 0.24), 0.55), smoothstep(0.45, 0.85, flame));
      cc = mix(cc, mix(u_palette[0], drkC, 0.5), smoothstep(0.78, 0.92, noise(fq*vec2(1.2, 3.0) - 7.0))*0.45);
      cc *= 0.85 + 0.2*smoothstep(0.0, 0.03, ins)*(1.0 - 0.3*k);
      col = mix(col, cc, smoothstep(-0.0015, 0.0015, ins + (noise(p*140.0) - 0.5)*0.003));
    }
  }

  // two top-hatted walkers on the bridge
  vec3 drk = u_palette[3];
  for (int k = 0; k < 2; k++){
    float wx = -W*(0.66 - 0.08*float(k)) + 0.004*sin(t*0.9 + float(k));
    float fy = railY(wx, W) - 0.09;
    float H = 0.115 - 0.012*float(k);
    float ky = (p.y - fy)/H;
    float coat = abs(p.x - wx) - 0.016*(1.0 - 0.35*clamp(ky, 0.0, 1.0));
    coat = max(coat, max(-ky, ky - 0.74)*H);
    float head = length(p - vec2(wx, fy + H*0.82)) - 0.0105;
    float hat = max(abs(p.x - wx) - 0.0095, abs(p.y - fy - H*0.97) - 0.011);
    hat = min(hat, max(abs(p.x - wx) - 0.016, abs(p.y - fy - H*0.89) - 0.002));
    float wd = min(min(coat, head), hat);
    col = mix(col, drk*0.5, smoothstep(0.0012, -0.0012, wd));
  }

  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
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
      col = mix(col, mix(u_palette[1], warm, rings), halo*0.8*a.w);
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
  name: "Starry Fjord",
  aliases: ["Swirling Stars, Screaming Fjord", "Screaming Fjord"],
  source: SOURCE,
  palette: ["#1f3c96", "#f6c84a", "#e2481f", "#0e1630"],
  params: [
    param("swirl", "Swirl speed", 0, 3, 1.2, 0.05),
    param("twist", "Vortex twist", 0, 2, 1, 0.05),
    param("brush", "Brush size", 0.01, 0.04, 0.02, 0.001),
    param("impasto", "Paint thickness", 0, 2, 1, 0.05),
    param("stars", "Star glow", 0, 1.5, 1, 0.05),
    param("color", "Color strength", 0, 1, 0.92),
  ],
};
