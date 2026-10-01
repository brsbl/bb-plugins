import type { Scene, SceneParam } from "./contract.js";

function param(
  id: string,
  label: string,
  min: number,
  max: number,
  value: number,
  step = 0.01,
): SceneParam {
  return { id, label, min, max, step, value };
}

const TIDE_SOURCE = `struct Ink { float v; float carve; float edge; float reg; };

vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
vec2 seaP(vec2 uv){ vec2 q = toP(uv); q.y = -0.44 + uv.y*0.48; return q; }

float crest(float u){ float s = 0.5 + 0.5*sin(u + 0.6*sin(u)); s *= s; return s*s; }
float farY(float x, float T){ return 0.07 + 0.018*p_height*crest(x*15.0 - T*0.9) + 0.006*sin(x*4.0 + T*0.2); }
float midY(float x, float T){ return -0.08 + 0.07*p_height*crest(x*7.0 - T*1.6 + 1.0) + 0.014*sin(x*2.3 - T*0.35); }
float nearY(float x, float T, float W){
  float e = smoothstep(0.3*W, W, abs(x));
  return -0.38 + p_height*(0.14*e + (0.11 + 0.26*e)*crest(x*4.0 - T*1.6 + 2.0));
}
vec2 moonP(float W){ return vec2(W - 0.17, 0.33); }

float claw(vec2 d, float r){
  return max(length(d) - r, -(length(d - r*vec2(0.5, -0.38)) - r*0.8));
}

float clawSdf(vec2 p, int L, float T, float W){
  float fq = L == 1 ? 7.0 : 4.0;
  float ph = L == 1 ? 1.0 : 2.0;
  float cw = L == 1 ? 0.032 : 0.06;
  float sh = T*1.6/fq;
  float c0 = floor((p.x - sh)/cw);
  float s = 1.0;
  for (int i = -1; i <= 1; i++){
    float c = c0 + float(i);
    float h = hash21(vec2(c, float(L)*7.1));
    float cxs = (c + 0.25 + 0.5*h)*cw;
    float g = smoothstep(0.3, 0.9, crest(cxs*fq + ph))*p_foam;
    if (g <= 0.01) continue;
    float cx = cxs + sh;
    float r = cw*(0.42 + 0.3*h)*g;
    float y = L == 1 ? midY(cx, T) : nearY(cx, T, W);
    vec2 d = p - vec2(cx, y + r*0.3);
    s = min(s, claw(d, r));
    s = min(s, claw(d - r*vec2(-0.72, 0.5), r*0.5));
    s = min(s, claw(d - r*vec2(0.95, -0.2), r*0.38));
  }
  return s;
}

float mistSdf(vec2 p, float T, float y0, float th, float sd){
  float dy = abs(p.y - y0 - 0.008*sin(p.x*3.0 + sd));
  float n = noise(vec2(p.x*1.4 - T*0.05 + sd, sd*3.7));
  return dy - th*sqrt(smoothstep(0.4, 0.62, n));
}

Ink subject(vec2 p, float T, float W){
  Ink o;
  float yF = farY(p.x, T);
  float yM = midY(p.x, T);
  float yN = nearY(p.x, T, W);
  float sF = p.y - yF;
  float sM = p.y - yM;
  if (sM > -0.02 && sM < 0.08) sM = min(sM, clawSdf(p, 1, T, W));
  float sN = p.y - yN;
  if (sN > -0.03 && sN < 0.14) sN = min(sN, clawSdf(p, 2, T, W));
  if (sN < 0.0){
    float cf = crest(p.x*4.0 - T*1.6 + 2.0);
    float d = max(yN - p.y, 0.0);
    o.v = 0.2 + 0.62*(0.3 + 0.7*cf)*exp(-d/0.09);
    if (p.y > yN || d < 0.022*smoothstep(0.35, 0.9, cf)*p_foam) o.v = 1.0;
    o.carve = d + 0.0025*sin(p.x*41.0);
    o.edge = -sN;
    o.reg = 3.0;
  } else if (sM < 0.0){
    float cf = crest(p.x*7.0 - T*1.6 + 1.0);
    float d = max(yM - p.y, 0.0);
    o.v = 0.26 + 0.5*(0.3 + 0.7*cf)*exp(-d/0.045);
    if (p.y > yM || d < 0.01*smoothstep(0.35, 0.9, cf)*p_foam) o.v = 1.0;
    o.carve = d*1.3 + 0.002*sin(p.x*47.0 + 1.0);
    o.edge = min(-sM, sN);
    o.reg = 2.0;
  } else if (sF < 0.0){
    float cf = crest(p.x*15.0 - T*0.9);
    float d = yF - p.y;
    o.v = 0.42 + 0.35*(0.3 + 0.7*cf)*exp(-d/0.012);
    if (d < 0.003*smoothstep(0.5, 1.0, cf)*p_foam) o.v = 1.0;
    o.carve = d*1.8 + 0.002*sin(p.x*53.0);
    o.edge = min(-sF, min(sM, sN));
    o.reg = 1.0;
  } else {
    o.v = clamp((p.y - 0.06)/0.44, 0.0, 1.0);
    o.carve = 0.0;
    o.reg = 0.0;
    float md = length(p - moonP(W)) - 0.046;
    if (md < 0.0) o.reg = 0.25;
    float m = min(mistSdf(p, T, 0.31, 0.02, 1.7), mistSdf(p, T, 0.18, 0.015, 5.3));
    if (m < 0.0) o.reg = 0.5;
    o.edge = min(min(sF, min(sM, sN)), abs(m));
    if (m >= 0.0) o.edge = min(o.edge, abs(md));
  }
  return o;
}

float warmField(vec2 p, float W){
  vec2 mp = moonP(W);
  vec2 md = p - mp;
  float w = 0.55*exp(-dot(md, md)/0.012);
  if (p.y < 0.08){
    float dx = p.x - mp.x;
    w += 0.5*exp(-dx*dx/0.0025)*exp(-(0.08 - p.y)/0.25);
  }
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - seaP(a.xy);
    w += a.w*0.9*p_glow*exp(-dot(d, d)/0.002);
    if (d.y < 0.0) w += a.w*0.9*p_glow*exp(-d.x*d.x/(0.0002*(1.0 - d.y*8.0)))*exp(d.y/0.1);
  }
  return w;
}

vec3 ink5(float k){
  vec3 navy = u_palette[0], teal = u_palette[1], paper = u_palette[3];
  if (k < 0.5) return navy;
  if (k < 1.5) return mix(navy, teal, 0.45);
  if (k < 2.5) return teal;
  if (k < 3.5) return mix(teal, paper, 0.55);
  return paper;
}

float stripes(float f, float x, float aa){
  float fr = smoothstep(0.45, 0.97, f);
  float tri = abs(fract(x) - 0.5)*2.0;
  return (1.0 - smoothstep(fr - aa, fr + aa, tri))*smoothstep(0.0, 0.08, fr);
}

vec3 scene(vec2 uv, vec2 p){
  float W = 0.5*u_resolution.x/u_resolution.y;
  float T = u_time*0.35*p_swell;
  vec3 navy = u_palette[0], teal = u_palette[1], lant = u_palette[2], paper = u_palette[3];
  vec3 verm = vec3(0.88, 0.2, 0.12);

  vec2 pw = p;
  vec2 dp = p - toP(u_pointer);
  pw.y -= 0.03*exp(-dot(dp, dp)/0.006);
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float e = length((p - seaP(r.xy))*vec2(1.0, 2.3));
    float rad = 0.01 + r.z*0.11;
    pw.y -= 0.014*exp(-pow((e - rad)/0.02, 2.0))*exp(-r.z*0.7);
  }

  Ink A = subject(pw, T, W);
  Ink K = subject(pw + vec2(0.0024, -0.0017), T, W);
  float F = 90.0*p_carve;
  float aa = min(fwidth(A.carve*F), 0.5);
  float w = warmField(pw + vec2(-0.0018, 0.0012), W);

  vec3 col;
  if (A.reg < 0.1){
    col = mix(mix(navy, teal, 0.5), mix(navy, teal, 0.1), smoothstep(0.0, 0.8, A.v));
    col = mix(col, mix(lant, paper, 0.3), clamp(w, 0.0, 1.0)*0.45);
  } else if (A.reg < 0.4){
    col = mix(mix(paper, lant, 0.35), lant, smoothstep(0.02, 0.05, length(pw - moonP(W)))*0.6);
  } else if (A.reg < 0.7){
    col = mix(mix(teal, paper, 0.28), mix(navy, teal, 0.7), smoothstep(0.02, -0.02, pw.y - (pw.y > 0.25 ? 0.31 : 0.18))*0.6);
  } else {
    float k = clamp(A.v, 0.0, 0.999)*4.0;
    float ki = floor(k);
    col = mix(ink5(ki), ink5(ki + 1.0), stripes(k - ki, A.carve*F, aa));
    col = mix(col, col*0.86 + navy*0.14, smoothstep(0.03, 0.3, A.carve)*step(A.v, 0.99));
    float wk = clamp(w*1.4, 0.0, 1.999)*2.0;
    float wi = floor(wk);
    vec3 w0 = wi < 0.5 ? col : (wi < 1.5 ? mix(col, lant, 0.5) : lant);
    vec3 w1 = wi < 0.5 ? mix(col, lant, 0.5) : (wi < 1.5 ? lant : mix(lant, paper, 0.4));
    col = mix(w0, w1, stripes(wk - wi, A.carve*F + 0.5, aa));
  }

  float yN = nearY(pw.x, T, W);
  vec2 sq = vec2(pw.x - T*0.4, pw.y)/0.016;
  vec2 ci = floor(sq);
  float h = hash21(ci);
  float band = pw.y - yN;
  if (band > -0.06 && band < 0.1 && h < 0.55*p_foam*smoothstep(0.35, 0.85, crest((ci.x + 0.5)*0.064 + 2.0))){
    vec2 o = (vec2(hash21(ci + 3.1), hash21(ci + 7.7)) - 0.5)*0.6;
    float rr = 0.12 + 0.18*hash21(ci + 1.9);
    col = mix(col, paper, smoothstep(rr, rr*0.7, length(fract(sq) - 0.5 - o)));
  }

  float lw = max(0.0018, 2.2/u_resolution.y)*(K.reg > 2.5 ? 1.25 : 1.0);
  col = mix(col, navy*0.45, smoothstep(lw, lw*0.55, K.edge)*0.9);

  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    vec2 hd = seaP(a.xy) + vec2(0.0, 0.006*sin(u_time*1.7 + fi*1.3));
    float waiting = step(0.5, a.z);
    float sc = 0.6 + 0.4*a.w;
    vec2 hs = vec2(0.015, 0.02)*sc;
    if (waiting < 0.5){
      float bx = hd.x - p.x;
      if (bx > 0.0 && bx < 0.24){
        float wy = hd.y - hs.y*1.1;
        float l1 = abs(p.y - (wy + bx*0.12));
        float l2 = abs(p.y - (wy - bx*0.22));
        float dash = smoothstep(0.25, 0.4, fract(bx*26.0 - u_time*1.4));
        float wk = (smoothstep(0.0026, 0.0013, l1) + smoothstep(0.0026, 0.0013, l2))*dash*(1.0 - bx/0.24);
        col = mix(col, paper, clamp(wk, 0.0, 1.0)*a.w*0.9);
      }
    } else {
      for (int k = 0; k < 3; k++){
        float ph = fract(u_time*0.45 + float(k)/3.0);
        float e = length((p - hd + vec2(0.0, hs.y))*vec2(1.0, 2.4));
        float rr = 0.024 + ph*0.11;
        col = mix(col, lant, smoothstep(0.0034, 0.0016, abs(e - rr))*(1.0 - ph)*a.w);
      }
    }
    vec2 d = rot2(p - hd, 0.12*sin(u_time*1.3 + fi));
    vec2 q = abs(d - vec2(0.0, hs.y*0.15)) - hs;
    float body = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.002;
    vec2 q2 = abs(d - vec2(0.0, -hs.y*1.05)) - vec2(hs.x*1.4, 0.0035*sc);
    float tray = length(max(q2, 0.0)) + min(max(q2.x, q2.y), 0.0);
    vec2 q3 = abs(d - vec2(0.0, hs.y*1.3)) - vec2(hs.x*1.15, 0.003*sc);
    float cap = length(max(q3, 0.0)) + min(max(q3.x, q3.y), 0.0);
    float sd = min(body, min(tray, cap));
    float pulse = 0.5 + 0.5*sin(u_time*4.0 + fi);
    vec3 bc = mix(lant, mix(paper, lant, 0.25), smoothstep(hs.x*1.2, 0.0, length(d*vec2(1.0, 0.7))));
    bc = mix(bc, mix(lant*0.55, paper, pulse), waiting*0.7);
    bc = mix(bc, navy*0.6, smoothstep(0.0014, 0.0006, abs(d.x))*step(body, 0.0) + step(body, 0.0)*smoothstep(0.0014, 0.0006, abs(d.y - hs.y*0.15)));
    vec3 lc = body < 0.0 ? bc : mix(navy, lant, 0.25);
    col = mix(col, lc, smoothstep(0.0, -0.0015, sd)*a.w);
    col = mix(col, navy*0.45, smoothstep(0.0024, 0.0009, abs(sd))*a.w);
  }

  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float e = length((p - seaP(r.xy))*vec2(1.0, 2.3));
    float rad = 0.01 + r.z*0.11;
    float fade = exp(-r.z*0.6)*smoothstep(0.0, 0.15, r.z);
    bool isErr = abs(r.w - 1.0) < 0.5;
    float wd = isErr ? 1.5 : 1.0;
    float ring = smoothstep(0.004*wd, 0.0022*wd, abs(e - rad)) + 0.7*smoothstep(0.003*wd, 0.0015*wd, abs(e - rad*0.72));
    vec3 ic = isErr ? verm : (r.w > 1.5 ? lant : paper);
    col = mix(col, ic, clamp(ring, 0.0, 1.0)*fade);
    if (isErr) col = mix(col, verm, smoothstep(rad, 0.0, e)*exp(-r.z*0.9)*0.45);
  }

  float gn = noise(vec2(p.x*2.5, p.y*9.0));
  float grain = 0.5 + 0.5*sin(p.y*260.0 + gn*9.0 + noise(vec2(p.x*18.0, p.y*70.0))*1.2);
  float dens = 0.86 + 0.09*grain + 0.07*noise(p*190.0);
  col = mix(paper, col, clamp(dens, 0.0, 1.0));
  float fib = noise(rot2(p, 0.6)*vec2(40.0, 520.0)) + noise(rot2(p, -1.1)*vec2(35.0, 480.0));
  col *= 0.96 + 0.04*fib;
  col += 0.035*smoothstep(1.35, 1.7, fib);

  return mix(u_canvas, col, p_color);
}`;

const FIREFLIES_SOURCE = `const float LAKE = -0.035;
float ridgeFar(float x) { return 0.05 + 0.13 * pow(1.0 - abs(2.0 * noise(vec2(x * 2.2, 1.0)) - 1.0), 2.0) + 0.03 * noise(vec2(x * 7.0, 2.0)) + 0.01 * noise(vec2(x * 23.0, 3.0)); }
float ridgeNear(float x) { return 0.005 + 0.03 * sin(x * 2.1 + 2.0) + 0.02 * noise(vec2(x * 5.0, 3.0)) + 0.006 * noise(vec2(x * 19.0, 4.0)); }
float shoreY(float x) { return -0.105 + 0.018 * sin(x * 1.7 + 1.0) + 0.008 * noise(vec2(x * 6.0, 5.0)); }
vec2 moonPos() { return vec2(0.3 * u_resolution.x / u_resolution.y, 0.34); }

// a row of tiered pines standing on base, thinning out between groves
float pines(vec2 p, float base, float cw, float hMin, float hMax, float seed) {
  float cx = floor(p.x / cw);
  float cov = 0.0;
  for (int j = -1; j <= 1; j++) {
    float c = cx + float(j);
    float grove = smoothstep(0.35, 0.6, noise(vec2(c * cw * 2.5, seed)));
    if (hash21(vec2(c, seed)) > 0.25 + 0.75 * grove) continue;
    float x0 = (c + 0.2 + 0.6 * hash21(vec2(c, seed + 1.0))) * cw;
    float H = mix(hMin, hMax, hash21(vec2(c, seed + 2.0))) * (0.55 + 0.45 * grove);
    float k = (p.y - base) / H;
    if (k < -0.3 || k > 1.0) continue;
    float wd = cw * 0.5 * (1.0 - k) * (0.7 + 0.3 * abs(sin(k * 16.0 + c)));
    cov = max(cov, smoothstep(wd, wd * 0.5, abs(p.x - x0)));
  }
  return cov;
}

float grass(vec2 p, float cw, float hMin, float hMax, float w, float seed, float wid, float heads, float arch) {
  float y0 = -0.56;
  float cx = floor(p.x / cw);
  float cov = 0.0;
  for (int i = -3; i <= 3; i++) {
    float c = cx + float(i);
    float h1 = hash21(vec2(c, seed));
    float h2 = hash21(vec2(c, seed + 7.3));
    float h3 = hash21(vec2(c, seed + 13.1));
    float x0 = (c + 0.15 + 0.7 * h1) * cw;
    float H = mix(hMin, hMax, h2) * mix(0.55, 1.0, smoothstep(0.15, 0.85, abs(x0)));
    float leaf = step(h2, arch);
    float bend = (clamp(w * (0.6 + 0.8 * h1), -1.8, 1.8) * 0.08 + (h3 - 0.5) * mix(0.1, 0.75, leaf)) * H;
    bend = clamp(bend, -2.8 * cw, 2.8 * cw);
    float k = clamp((p.y - y0) / H, 0.0, 1.0);
    float bx = x0 + bend * k * k;
    float wd = cw * wid * mix(1.0, 1.6, leaf) * (1.0 - 0.8 * k) * sqrt(1.0 + pow(2.0 * bend * k / H, 2.0));
    float blade = smoothstep(wd * 1.2, wd * 0.25, abs(p.x - bx)) * step(p.y, y0 + H);
    vec2 dir = normalize(vec2(2.0 * bend / H, 1.0));
    vec2 hd = p - (vec2(x0 + bend, y0 + H) + dir * 0.014);
    float e = length(vec2(dot(hd, dir) / 0.018, (hd.x * dir.y - hd.y * dir.x) / (cw * wid * 0.7)));
    float head = smoothstep(1.0, 0.75, e) * step(1.0 - heads, h2);
    cov = max(cov, max(blade, head));
  }
  return cov;
}

vec3 meadow(vec2 p, vec2 w, float t) {
  vec3 I = u_palette[0];
  vec3 V = u_palette[1];
  vec3 Y = u_palette[2];
  vec3 K = u_palette[3];
  vec3 paper = vec3(0.97, 0.94, 0.88);
  vec2 mp = moonPos();

  // sky: navy overhead, a pale band of moonlit haze along the peaks
  float sy = clamp((p.y - LAKE) / 0.5, 0.0, 1.0);
  vec3 col = mix(mix(K, V, 0.35), V * 0.8, smoothstep(0.0, 0.25, sy));
  col = mix(col, I, smoothstep(0.2, 0.85, sy));
  col = mix(col, mix(K, paper, 0.35), smoothstep(0.14, 0.0, sy) * 0.35);
  float mw = p.y - 0.12 - 0.3 * p.x + 0.05 * noise(vec2(p.x * 3.0 + t * 0.01, 2.0));
  float band = exp(-mw * mw / 0.014) * smoothstep(0.04, 0.2, sy);
  float neb = noise(p * 5.0 + vec2(t * 0.012, 0.0));
  float dust = smoothstep(0.55, 0.8, noise(p * 11.0 - 3.0));
  col = mix(col, mix(V, K, neb), band * (0.4 + 0.45 * neb) * (1.0 - 0.6 * dust) * p_galaxy);
  col = mix(col, mix(K, paper, 0.5), band * band * smoothstep(0.5, 0.85, neb) * 0.3 * p_galaxy);

  // the moon: a wide halo, a textured disc lit from the upper left
  vec2 md = p - mp;
  float ml = length(md);
  col = mix(col, mix(K, paper, 0.55), exp(-ml * ml / 0.03) * 0.4 * p_moon);
  col = mix(col, mix(K, paper, 0.75), exp(-ml / 0.014) * 0.5 * min(p_moon, 1.0));
  float maria = noise(md * 45.0 + 3.0) * 0.6 + noise(md * 120.0) * 0.4;
  vec3 moonC = mix(vec3(0.99, 0.97, 0.9), vec3(0.74, 0.8, 0.88), smoothstep(0.45, 0.72, maria));
  moonC *= 0.8 + 0.2 * smoothstep(0.055, 0.0, length(md - vec2(-0.012, 0.012)));
  col = mix(col, moonC, smoothstep(0.044, 0.041, ml) * min(p_moon, 1.0));

  // moonlit wisps of cloud
  float cl = noise(vec2(p.x * 1.6 - t * 0.02, p.y * 9.0 + 1.7)) * 0.7 + noise(vec2(p.x * 5.0 - t * 0.03, p.y * 22.0)) * 0.3;
  float wisp = smoothstep(0.52, 0.76, cl) * smoothstep(0.05, 0.2, p.y) * smoothstep(0.5, 0.25, p.y);
  col = mix(col, mix(mix(V, K, 0.5), mix(K, paper, 0.55), exp(-ml * ml / 0.06)), wisp * 0.45);

  // far range: moon-facing slopes catch light, snow on the high peaks, haze at the foot
  float rf = ridgeFar(p.x);
  float slope = (ridgeFar(p.x + 0.004) - rf) / 0.004;
  float lit = clamp(0.5 - slope * 0.7, 0.0, 1.0);
  vec3 mtn = mix(mix(V, K, 0.3), mix(K, paper, 0.3), lit * 0.55);
  mtn *= 0.86 + 0.2 * noise(vec2(p.x * 26.0 + p.y * 12.0, p.y * 7.0));
  float snow = smoothstep(0.12, 0.15, rf) * smoothstep(0.03, 0.0, rf - p.y) * smoothstep(0.35, 0.6, noise(vec2(p.x * 40.0, p.y * 9.0)));
  mtn = mix(mtn, mix(paper, K, 0.25) * (0.75 + 0.3 * lit), snow * 0.8);
  mtn = mix(mtn, mix(K, V, 0.45), smoothstep(0.07, 0.0, p.y - LAKE) * 0.55);
  col = mix(col, mtn, smoothstep(rf + 0.002, rf - 0.002, p.y));

  // near ridge, dark with pines along its crest
  float rn = ridgeNear(p.x);
  float nearM = max(smoothstep(rn + 0.002, rn - 0.002, p.y), pines(p, rn - 0.004, 0.02, 0.02, 0.065, 7.0));
  vec3 hc = mix(I, V, 0.25 + 0.2 * noise(vec2(p.x * 9.0, p.y * 30.0)));
  hc = mix(hc, mix(V, K, 0.35), smoothstep(0.03, 0.0, p.y - LAKE) * 0.35);
  col = mix(col, hc, nearM);

  // the lake mirrors the ridge, the pines, and a glittering path of moonlight
  if (p.y < LAKE) {
    float dy = LAKE - p.y;
    float wob = (noise(vec2(p.x * 30.0, p.y * 300.0 - t * 0.5)) - 0.5) * 0.005 * (0.3 + dy * 20.0);
    vec2 rp = vec2(p.x + wob, LAKE + dy * 1.25);
    vec3 lc = mix(mix(K, V, 0.35), V * 0.75, smoothstep(0.0, 0.07, dy));
    float rr = ridgeNear(rp.x);
    float refl = max(smoothstep(rr + 0.003, rr - 0.003, rp.y), pines(rp, rr - 0.004, 0.02, 0.02, 0.065, 7.0));
    lc = mix(lc, mix(I, V, 0.45), refl * 0.8);
    float glit = exp(-pow((p.x - mp.x) / (0.015 + dy * 0.5), 2.0)) * smoothstep(0.5, 0.85, noise(vec2(p.x * 45.0, p.y * 420.0 - t * 0.8)));
    lc = mix(lc, mix(paper, K, 0.25), glit * 0.85 * min(p_moon, 1.0));
    lc *= 0.9 + 0.14 * noise(vec2(p.x * 6.0, p.y * 160.0 + t * 0.3));
    col = lc;
  }

  // meadow: dry-brush strokes following the slope, a moonlit bank at the water
  float sh = shoreY(p.x);
  float gm0 = smoothstep(sh + 0.003, sh - 0.003, p.y);
  float mdp = clamp((sh - p.y) / 0.35, 0.0, 1.0);
  vec3 mc = mix(mix(V, K, 0.25), mix(I, V, 0.45), smoothstep(0.0, 0.7, mdp));
  mc = mix(mc, mix(K, paper, 0.25), smoothstep(0.01, 0.0, sh - p.y) * 0.4);
  mc *= 0.84 + 0.26 * noise(vec2(p.x * 4.0 + p.y * 2.0, p.y * 55.0));
  col = mix(col, mc, gm0);

  float r2 = sh - 0.13 + 0.035 * sin(p.x * 1.1 + 0.3) + 0.012 * sin(p.x * 3.3 + 1.0);
  vec3 hc2 = mix(I, V, 0.4 + 0.2 * noise(vec2(p.x * 3.0, p.y * 5.0 + 2.0)));
  hc2 = mix(hc2, mix(K, V, 0.35), smoothstep(0.04, 0.0, r2 - p.y) * 0.6);
  hc2 *= 0.86 + 0.22 * noise(vec2(p.x * 5.0 - p.y * 3.0, p.y * 48.0));
  col = mix(col, hc2, smoothstep(r2 + 0.004, r2 - 0.004, p.y));

  // wildflowers scattered through the meadow
  vec2 fg = p * vec2(70.0, 90.0);
  vec2 fid = floor(fg);
  float fh = hash21(fid + 40.0);
  float fl = smoothstep(0.2, 0.08, length(fract(fg) - 0.5 - (vec2(hash21(fid + 1.1), hash21(fid + 2.2)) - 0.5) * 0.5));
  fl *= step(0.85, fh) * gm0 * smoothstep(0.0, 0.08, sh - p.y);
  col = mix(col, (fh > 0.95 ? mix(Y, paper, 0.4) : mix(K, paper, 0.55)) * 0.9, fl * 0.75);

  float gf = grass(p, 0.011, 0.05, 0.14, w.y * 0.7, 23.0, 0.25, 0.15, 0.3);
  col = mix(col, mix(I, V, 0.5) * 0.9, gf * 0.7);
  float gm = grass(p, 0.02, 0.14, 0.3, w.y, 3.0, 0.22, 0.2, 0.45);
  col = mix(col, mix(I, V, 0.4) * 0.8, gm * 0.9);
  float gy = -0.47 + 0.035 * noise(vec2(p.x * 5.0, 0.0));
  col = mix(col, mix(I, V, 0.35) * 0.82, smoothstep(gy + 0.02, gy - 0.04, p.y));
  float gn = grass(p, 0.034, 0.2, 0.52, w.x, 11.0, 0.17, 0.22, 0.55);
  col = mix(col, mix(I, V, 0.15) * 0.62, gn);
  return col;
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  vec3 Y = u_palette[2];
  vec3 K = u_palette[3];
  vec3 core = mix(Y, vec3(1.0, 0.99, 0.9), 0.55);
  vec3 red = vec3(0.95, 0.12, 0.08);

  vec2 dp = p - toP(u_pointer);
  float pt = exp(-dot(dp, dp) / 0.01);
  float wt = t * p_wind;
  float w1 = 0.55 * sin(p.x * 2.3 - wt * 1.3 + p.y * 1.5) + 0.9 * (noise(vec2(p.x * 1.2 - wt * 0.8, wt * 0.1)) - 0.45);
  float w2 = 0.5 * sin(p.x * 1.7 - wt * 0.7 + 1.0) + 0.6 * (noise(vec2(p.x * 0.9 - wt * 0.45, 3.0)) - 0.45);
  float gust = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    gust += exp(-pow((dist - r.z * 0.3) * 6.0, 2.0)) * exp(-r.z * 0.6);
  }
  float push = pt * sign(dp.x) * 1.4 + gust * 1.2;
  vec2 w = vec2(w1 + push, w2 + push * 0.6);

  vec2 wv = vec2(fbm(p * 2.4 + vec2(0.0, t * 0.02)), fbm(p * 2.4 + vec2(5.2, 1.3) - vec2(t * 0.016, 0.0)));
  vec2 fe = vec2(noise(p * 48.0), noise(p * 48.0 + 9.1)) - 0.5;
  vec2 q = p + ((wv - 0.5) * 0.075 + fe * 0.012) * p_wet - dp * pt * 0.04;
  vec3 c0 = meadow(q, w, t);
  vec3 c1 = meadow(q + vec2(0.005, 0.008), w, t);

  float calm = 1.0 - 0.75 * smoothstep(0.12, 0.42, p.y);
  float edge = smoothstep(0.03, 0.22, length(c0 - c1));
  vec3 col = mix(c0, pow(min(c0, c1), vec3(1.35)) * 0.92, edge * 0.55);

  float bn = noise(p * 2.6 + wv * 1.6 + 11.0) * 0.75 + noise(p * 11.0 + wv * 3.0) * 0.18 + noise(p * 38.0) * 0.07;
  float inb = smoothstep(0.656, 0.664, bn);
  float rimIn = inb * smoothstep(0.73, 0.66, bn);
  col = mix(col, pow(col, vec3(0.7)), inb * 0.7 * p_wet);
  col = pow(col, vec3(1.0 + rimIn * 0.8 * p_wet * calm));
  col = mix(col, pow(col, vec3(0.8)), pt * 0.4);

  col = pow(col, vec3(1.0 + (noise(vec2(q.x * 40.0, q.y * 2.0)) - 0.5) * 0.2 * p_wet * calm));
  float g = noise(p * min(u_resolution.y / 2.5, 220.0));
  float valley = noise(p * 30.0 + 5.0);
  float lum = dot(col, vec3(0.3, 0.55, 0.15));
  float gw = (0.35 + clamp((col.b - col.g) * 1.5, 0.0, 1.0)) * (1.0 - lum * 0.6) * calm;
  col = pow(col, vec3(1.0 + ((g - 0.5) * (0.5 + 0.5 * valley) + (valley - 0.5) * 0.15) * 0.7 * p_grain * gw));

  float skyM = smoothstep(ridgeFar(q.x) + 0.004, ridgeFar(q.x) + 0.03, q.y);
  // nebula: layered pigment in the milky way, cut by dark dust filaments
  float mw = q.y - 0.12 - 0.3 * q.x;
  float band = exp(-mw * mw / 0.02) * skyM * p_galaxy;
  float nb = noise(q * 4.0 + wv * 1.5) * 0.5 + noise(q * 9.0 - t * 0.01) * 0.3 + noise(q * 22.0) * 0.2;
  float fil = smoothstep(0.5, 0.75, noise(vec2(q.x * 7.0 + q.y * 3.0, q.y * 16.0 - q.x * 4.0)));
  vec3 nebC = mix(mix(K, vec3(0.55, 0.95, 1.0), smoothstep(0.5, 0.8, nb)), mix(Y, vec3(1.0), 0.4), pow(nb, 4.0) * exp(-mw * mw / 0.004));
  col = 1.0 - (1.0 - col) * (1.0 - nebC * smoothstep(0.25, 0.75, nb) * band * 0.85 * (1.0 - 0.7 * fil));
  col *= 1.0 - fil * band * 0.35;

  for (int l = 0; l < 3; l++) {
    float sc = l == 0 ? 90.0 : (l == 1 ? 38.0 : 14.0);
    vec2 sg = p * sc + float(l) * 17.0;
    vec2 sid = floor(sg);
    float sh = hash21(sid);
    vec2 so = vec2(hash21(sid + 2.3), hash21(sid + 5.9)) - 0.5;
    vec2 sv = fract(sg) - 0.5 - so * 0.6;
    float sd = length(sv);
    float dens = l == 0 ? 0.12 + 0.25 * band : (l == 1 ? 0.07 : 0.1);
    float on = step(1.0 - dens * p_stars, sh) * skyM * min(p_stars * 2.0, 1.0) * smoothstep(0.046, 0.07, length(p - moonPos()));
    float star = smoothstep(l == 0 ? 0.09 : 0.06, 0.0, sd) + (l == 0 ? 0.0 : exp(-sd * sd / 0.02) * 0.3);
    if (l == 2) {
      star = smoothstep(0.035, 0.0, sd) + exp(-sd * sd / 0.004) * 0.6;
      star += (exp(-abs(sv.x) * 90.0) * exp(-abs(sv.y) * 9.0) + exp(-abs(sv.y) * 90.0) * exp(-abs(sv.x) * 9.0)) * 0.7;
    }
    float tw = 0.55 + 0.45 * sin(t * (0.8 + 1.8 * sh) + sh * 60.0);
    vec3 sc3 = mix(vec3(0.86, 0.92, 1.0), sh > 0.5 ? K : mix(Y, vec3(1.0), 0.5), 0.3 * fract(sh * 13.0));
    col = 1.0 - (1.0 - col) * (1.0 - sc3 * clamp(star * on * tw, 0.0, 1.0));
  }

  // ground mist, lit from within by the swarm
  float mistN = noise(vec2(q.x * 2.5 - t * 0.03, q.y * 7.0)) * 0.65 + noise(vec2(q.x * 7.0 + t * 0.05, q.y * 18.0)) * 0.35;
  float mist = smoothstep(0.06, 0.0, abs(q.y - LAKE + 0.01)) * smoothstep(0.35, 0.75, mistN) * p_mist;
  col = mix(col, mix(K, vec3(0.85, 0.93, 1.0), 0.45), mist * 0.4);

  // fireflies: J-shaped flashes, long-exposure trails, out-of-focus ones up close
  float ax = u_resolution.x / u_resolution.y;
  vec3 green = mix(Y, vec3(0.78, 1.0, 0.42), 0.4);
  vec3 hot = mix(green, vec3(1.0, 1.0, 0.9), 0.6);
  float light = 0.0;
  for (int i = 0; i < 60; i++) {
    float fi = float(i);
    if (fi >= 16.0 + 30.0 * p_motes) break;
    vec2 s = vec2(fi * 7.13, fi * 3.71);
    vec2 hp = vec2(hash21(s), hash21(s + 1.7));
    float z = hash21(s + 6.6);
    float xs = hp.x * 2.0 - 1.0;
    xs = sign(xs) * pow(abs(xs), 0.55);
    vec2 home = vec2(xs * 0.5 * ax, mix(-0.46, 0.0, hp.y));
    vec2 hd = p - home;
    if (dot(hd, hd) > 0.06) continue;
    float w1 = 0.21 * (1.0 + hp.y), w2 = 0.37 * (1.0 + hp.x);
    vec2 amp = vec2(0.08, 0.045) * (0.6 + 0.8 * z);
    vec2 fp = home + amp * vec2(sin(t * w1 + fi * 2.1), sin(t * w2 + fi));
    vec2 fb = home + amp * vec2(sin((t - 1.0) * w1 + fi * 2.1), sin((t - 1.0) * w2 + fi));
    float rate = 0.35 + 0.35 * hash21(s + 9.1);
    float ph = fract(t * rate + hash21(s + 3.3));
    float flash = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.05, 0.55, ph));
    flash = max(flash, 0.14);
    vec2 d = p - fp + (wv - 0.5) * 0.02;
    float d2 = dot(d, d);
    float r = 0.0085 * p_size * (0.6 + 0.8 * z);
    light += flash * exp(-d2 / 0.006) * (0.5 + z);
    if (z > 0.88) {
      // near the lens: a soft bokeh disc with a brighter rim
      float R = r * 3.2;
      float dl = sqrt(d2);
      float disc = smoothstep(R, R * 0.88, dl) * (0.35 + 0.35 * smoothstep(R * 0.55, R, dl));
      col = 1.0 - (1.0 - col) * (1.0 - green * disc * flash * 0.8 * min(p_motes, 1.0));
      continue;
    }
    vec2 ba = fp - fb;
    float k = clamp(dot(p - fb, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    float td = length(p - fb - ba * k);
    float ph0 = fract(ph - rate * (1.0 - k));
    float tf = smoothstep(0.0, 0.05, ph0) * (1.0 - smoothstep(0.05, 0.55, ph0));
    float trail = smoothstep(r * 0.7, 0.0, td) * tf * k * p_trails;
    float halo = exp(-d2 / (r * r * 30.0)) * flash * p_motes * (1.0 + 1.2 * fe.x);
    col = 1.0 - (1.0 - col) * (1.0 - green * clamp(halo * 1.1 + trail * 0.85, 0.0, 1.0));
    col = mix(col, hot, smoothstep(r, r * 0.3, sqrt(d2)) * flash * min(p_motes, 1.0));
  }
  // their light catches the grass and mist around them
  col += green * clamp(light, 0.0, 1.5) * 0.18 * (1.0 - skyM * 0.6) * (0.4 + mist);

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    vec2 base = toP(a.xy);
    float ph = t * 1.1 + fi * 1.7;
    vec2 head = base + vec2(0.04 * sin(ph), 0.02 * sin(ph * 2.0 + 0.5)) * (1.0 - waiting);
    float R = 0.01 * p_size;
    vec2 d = p - head + (wv - 0.5) * 0.012;
    float dl = length(d);
    float pulse = 0.5 + 0.5 * sin(t * 2.4 + fi);
    float bright = mix(0.9 + 0.1 * sin(t * 11.0 + fi * 3.0), 0.45 + 0.55 * pulse, waiting);
    vec3 hue = mix(Y, mix(Y, K, 0.6), waiting);
    float halo = exp(-dl * dl / (R * R * 32.0)) * bright * a.w;
    col = 1.0 - (1.0 - col) * (1.0 - hue * halo * 0.9);
    float body = smoothstep(R * 1.8, R * 1.5, dl);
    float brim = exp(-pow((dl - R * 1.7) / (R * 0.2), 2.0));
    col = mix(col, mix(hue, core, 0.3), body * 0.5 * a.w * bright);
    col = mix(col, hue * 0.6 + K * 0.1, brim * 0.3 * a.w);
    col = mix(col, core, smoothstep(R, R * 0.25, dl) * a.w * bright);
    if (waiting > 0.5) {
      float f = fract(t * 0.5 + fi * 0.3);
      float ring = exp(-pow((dl - R * (2.5 + 6.0 * f)) / (R * 0.35), 2.0)) * (1.0 - f);
      col = mix(col, K, ring * 0.75 * a.w);
    } else {
      for (int k = 1; k <= 6; k++) {
        float fk = float(k);
        float tk = ph - fk * 0.2;
        vec2 tp = base + vec2(0.04 * sin(tk), 0.02 * sin(tk * 2.0 + 0.5));
        vec2 td = p - tp;
        float tr = R * (0.9 - fk * 0.1);
        float tg = exp(-dot(td, td) / (tr * tr * 3.0)) * (1.0 - fk / 7.0) * a.w;
        col = 1.0 - (1.0 - col) * (1.0 - Y * tg * 0.75);
      }
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float ks = r.w > 1.5 ? 0.5 : 1.0;
    float isErr = abs(r.w - 1.0) < 0.5 ? 1.0 : 0.0;
    float rad = (0.03 + 0.2 * (1.0 - exp(-r.z * 1.1))) * ks;
    vec2 dir = d / max(dist, 1e-4);
    float rf = rad * (0.85 + 0.3 * noise(dir * 2.5 + r.xy * 31.0 + wv));
    float fade = exp(-r.z * 0.75);
    float body = clamp(smoothstep(rf, rf - 0.02, dist) * fade * (1.0 - 0.4 * dist / max(rf, 1e-3)), 0.0, 1.0);
    vec3 lit = 1.0 - (1.0 - col) * (1.0 - Y * body * 0.65);
    col = mix(lit, mix(col, red, body * 0.9), isErr);
    float rr = exp(-pow((dist - rf) * 110.0, 2.0)) * fade;
    col = mix(col, mix(Y * 0.5, red * 0.5, isErr), rr * 0.75);
    float ang = atan(d.y, d.x);
    float sp = pow(0.5 + 0.5 * cos(ang * 9.0 + r.x * 50.0), 20.0) * exp(-pow((dist - rf * 1.25) * 60.0, 2.0)) * fade;
    col = 1.0 - (1.0 - col) * (1.0 - mix(mix(Y, core, 0.5), vec3(1.0, 0.3, 0.2), isErr) * sp);
  }

  // watercolor finish: values settle into flat glazes whose edges pool darker
  vec3 lw = vec3(0.3, 0.55, 0.15);
  float L0 = dot(col, lw);
  float lv = (L0 + (noise(p * 3.5 + wv * 3.0) - 0.5) * 0.14) * 5.0;
  float fr = fract(lv);
  float Lq = (floor(lv) + smoothstep(0.15, 0.85, fr)) / 5.0;
  float settle = clamp(0.55 * p_wash, 0.0, 1.0) * (1.0 - clamp(light, 0.0, 1.0));
  col = mix(col, col * clamp((Lq + 0.03) / (L0 + 0.03), 0.8, 1.25), settle);
  col *= 1.0 - exp(-pow((fr - 0.3) / 0.08, 2.0)) * 0.1 * p_wet * settle;
  // pigment drifts between teal and indigo across the sheet
  float hue = noise(p * 1.7 + wv * 1.2 + 21.0);
  col *= mix(vec3(1.0), mix(vec3(0.9, 1.04, 1.05), vec3(0.97, 0.95, 1.07), hue), 0.7 * p_wet);
  // cold-press paper: lit tooth, pigment granulating in its valleys, dry-brush skips on the ground
  float th = noise(p * 210.0) * 0.6 + noise(p * 80.0 + 3.0) * 0.4;
  vec2 po = p + vec2(0.0015);
  float th2 = noise(po * 210.0) * 0.6 + noise(po * 80.0 + 3.0) * 0.4;
  float Lc = dot(col, lw);
  col *= 1.0 + (th - th2) * 0.35 * p_grain;
  col *= 1.0 - (1.0 - th) * 0.16 * p_grain * (1.0 - Lc);
  float skip = smoothstep(0.66, 0.74, noise(vec2(p.x * 26.0 + p.y * 8.0, p.y * 170.0))) * smoothstep(0.55, 0.75, th);
  col = mix(col, vec3(0.97, 0.94, 0.88), skip * 0.25 * p_grain * (1.0 - skyM));

  float pf = min(u_resolution.y / 4.0, 160.0);
  float pn = noise(p * pf) * 0.6 + noise(p * pf * 0.47 + 4.0) * 0.4;
  col *= 0.94 + 0.09 * pn;
  col = mix(col, vec3(0.97, 0.94, 0.88), 0.03);
  return mix(u_canvas, col, p_color);
}`;

const CONTOUR_SOURCE = `vec3 scene(vec2 uv, vec2 p) {
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

const RISOGRAPH_SOURCE = `float terrain(vec2 p, float td) {
  vec2 q = p * 1.9 + vec2(td, td * 0.4);
  float b = noise(q) * 0.52
          + noise(q * 2.07 + vec2(5.2, 1.3) - vec2(td * 0.6, 0.0)) * 0.28
          + noise(q * 4.13 + vec2(1.7, 9.2)) * 0.11
          + noise(q * 8.4 + vec2(8.3, 2.8)) * 0.035;
  float h = (b - 0.45) * 2.6;
  h += 0.45 * smoothstep(0.3, 0.9, abs(p.x)) - 0.05;
  return h;
}

float halftone(float T, vec2 p, float ang, float cell, float seed) {
  vec2 gT = vec2(dFdx(T), dFdy(T));
  float c = cos(ang), s = sin(ang);
  mat2 R = mat2(c, s, -s, c);
  vec2 q = R * p / cell;
  vec2 cp = transpose(R) * ((floor(q) + 0.5) * cell);
  float Tc = clamp(T + dot(gT, (cp - p) * u_resolution.y), 0.0, 1.0);
  float d = length(fract(q) - 0.5);
  float rough = (noise(p * u_resolution.y * 0.3 + seed) - 0.5) * 0.14 * p_grain;
  float r = 0.74 * sqrt(Tc);
  float aa = 0.8 / (cell * u_resolution.y);
  return smoothstep(r + aa, r - aa, d + rough) * smoothstep(0.0, 0.05, Tc);
}

float inkDensity(vec2 p, float seed) {
  float band = 0.8 + 0.2 * noise(vec2(p.x * 1.6 + seed, p.y * 24.0 + seed * 3.0));
  float mottle = 0.9 + 0.1 * noise(p * 14.0 + seed * 7.0);
  float speck = smoothstep(0.58, 0.85, noise(p * u_resolution.y * 0.45 + seed * 11.0));
  return band * mottle * (1.0 - 0.45 * p_grain * speck);
}

float isoLine(float v, float px) {
  float fw = fwidth(v) * px;
  return smoothstep(fw, fw * 0.35, abs(fract(v + 0.5) - 0.5));
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float td = t * 0.02 * p_drift;
  vec3 P = u_palette[0];
  vec3 B = u_palette[1];
  vec3 Y = u_palette[2];
  vec3 paper = u_palette[3];
  float lw = max(0.7, u_resolution.y * 0.0022);

  float h = terrain(p, td);
  vec2 dp = p - toP(u_pointer);
  h += 0.16 * exp(-dot(dp, dp) / 0.005);

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float r2 = dot(d, d);
    float waiting = step(0.5, a.z);
    float breathe = mix(1.0, 0.85 + 0.15 * sin(t * 2.4 + float(i)), waiting);
    h += p_height * a.w * breathe * exp(-r2 / 0.02);
    float dist = sqrt(r2);
    h += (1.0 - waiting) * a.w * 0.06 * sin(dist * 60.0 - t * 3.0) * exp(-dist * 6.0) * smoothstep(0.02, 0.06, dist);
  }

  float ringY = 0.0, ringP = 0.0, ringB = 0.0, flash = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float isErr = abs(r.w - 1.0) < 0.5 ? 1.0 : 0.0;
    float isStart = r.w > 1.5 ? 1.0 : 0.0;
    float front = r.z * 0.26 * (1.0 - 0.4 * isStart);
    float fade = exp(-r.z * 0.55);
    h += mix(0.25, -0.3, isErr) * exp(-pow((dist - front) * 16.0, 2.0)) * exp(-r.z * 0.9);
    float ad = abs(dist - front);
    float band = smoothstep(0.02, 0.013, ad) * fade;
    float edge = smoothstep(0.0035, 0.002, abs(ad - 0.022)) * fade;
    ringY += band * (1.0 - isStart);
    ringP += band * max(isErr, isStart);
    ringB += edge * (1.0 - isErr) * (1.0 - isStart);
    float thick = 0.07 * exp(-r.z * 0.7);
    flash += isErr * smoothstep(front + 0.004, front - 0.004, dist) * smoothstep(front - thick - 0.004, front - thick + 0.004, dist);
  }
  flash = clamp(flash, 0.0, 1.0);

  vec2 g = vec2(dFdx(h), dFdy(h)) * u_resolution.y;
  vec3 n = normalize(vec3(-g * 0.3, 1.0));
  float lam = dot(n, normalize(vec3(-0.6, 0.6, 0.55)));
  float shadow = clamp((0.72 - lam) * 1.6, 0.0, 1.0);
  float lit = clamp((lam - 0.8) * 4.0, 0.0, 1.0);

  float mr = 0.0034 * p_misreg;
  vec2 oP = mr * vec2(1.0, -0.6) + 0.001 * p_misreg * vec2(sin(t * 0.23), cos(t * 0.19));
  vec2 oB = mr * vec2(-0.7, 0.8);
  vec2 oY = mr * vec2(0.4, 0.9) + 0.0008 * p_misreg * vec2(cos(t * 0.17), sin(t * 0.29));
  float hP = h + dot(g, oP);
  float hB = h + dot(g, oB);
  float hY = h + dot(g, oY);

  float waterB = smoothstep(0.015, -0.015, hB);
  float landY = smoothstep(-0.02, 0.08, hY);
  float Ty = landY * (0.72 - 0.62 * smoothstep(0.45, 1.1, hY)) * (1.0 - 0.5 * lit);
  float Tp = smoothstep(0.3, 0.95, hP) * 0.9 + 0.06 * smoothstep(0.1, 0.3, hP);
  float Tb = mix(0.03 + 0.4 * shadow * smoothstep(-0.05, 0.3, hB), 0.14 + 0.3 * smoothstep(0.0, -0.5, hB), waterB);

  float cell = 0.013 * p_dots;
  float cY = halftone(Ty, p, 0.0, cell * 1.05, 1.3);
  float cP = halftone(Tp, p, 1.309, cell, 7.1);
  float cB = halftone(Tb, p, 0.262, cell * 0.95, 3.7);

  float landB = 1.0 - waterB;
  float minorB = isoLine(hB * 9.0, lw) * landB;
  float minorP = isoLine(hP * 9.0, lw) * smoothstep(-0.02, 0.05, hP);
  float majorP = isoLine(hP * 9.0 / 5.0, lw * 2.0) * smoothstep(-0.02, 0.05, hP);
  float majorB = isoLine(hB * 9.0 / 5.0, lw * 1.6) * landB;
  float shore = smoothstep(fwidth(hB) * lw * 2.0, fwidth(hB) * lw * 0.6, abs(hB));
  float wl = isoLine(hB * 30.0 - t * 0.35, lw * 0.8) * waterB * smoothstep(-0.35, -0.03, hB);
  float lineB = max(max(minorB * 0.75, majorB), max(shore, wl * 0.8));
  float lineP = max(minorP * 0.25, majorP);

  float ringW = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    if (a.z < 0.5) continue;
    vec2 d = p - toP(a.xy);
    float fr = fract(t * 0.6 + float(i) * 0.3);
    float rr = abs(length(d) - (0.045 + 0.08 * fr));
    float dash = step(0.0, sin(atan(d.y, d.x) * 14.0 + t));
    ringW = max(ringW, smoothstep(0.0032, 0.0016, rr) * dash * (1.0 - fr) * a.w);
  }

    float kY = clamp(max(cY, max(ringY, flash)), 0.0, 1.0) * inkDensity(p, 1.0);
  float kP = clamp(max(max(cP, lineP), max(ringP, flash)), 0.0, 1.0) * inkDensity(p, 4.0);
  float kB = clamp(max(max(cB, lineB) * (1.0 - 0.6 * flash), max(ringW, ringB)), 0.0, 1.0) * inkDensity(p, 9.0);

  vec3 col = paper * (0.96 + 0.04 * noise(p * u_resolution.y * 0.12) + 0.02 * (noise(p * 6.0) - 0.5));
  col *= mix(vec3(1.0), Y, kY);
  col *= mix(vec3(1.0), P, kP);
  col *= mix(vec3(1.0), B, kB);
  return mix(u_canvas, col, p_color);
}`;

export interface BuiltInScene extends Scene {
  id: string;
}

export const POPPY_HILL_SOURCE = `float hillY(float x) {
  return 0.07 + 0.09 * sin(x * 1.5 + 0.7) + 0.035 * sin(x * 3.7 + 1.3);
}

vec3 base(vec2 p, float w, float t) {
  vec3 skyC = u_palette[0];
  vec3 grass = u_palette[1];
  vec3 orange = u_palette[2];
  vec3 gold = u_palette[3];
  float hy = hillY(p.x);
  float hy2 = hillY(p.x * 0.6 + 2.7) + 0.09;

  float sy = clamp((p.y - hy) / 0.45, 0.0, 1.0);
  vec3 col = mix(mix(skyC, vec3(1.0, 0.96, 0.86), 0.45), skyC * 0.85 + vec3(0.0, 0.05, 0.14), sy);
  float cl = noise(vec2(p.x * 2.2 - t * 0.06, p.y * 5.0)) * noise(vec2(p.x * 4.0 - t * 0.09, p.y * 9.0 + 3.0));
  col = mix(col, vec3(1.0, 0.98, 0.95), smoothstep(0.16, 0.42, cl) * 0.85 * smoothstep(hy, hy + 0.1, p.y));

  if (p.y < hy2 + 0.01) {
    vec3 bh = mix(grass, skyC, 0.4) + gold * 0.1;
    float n = noise(p * vec2(34.0, 44.0));
    bh = mix(bh, mix(orange, gold, 0.5), smoothstep(0.6, 0.75, n) * 0.7);
    col = mix(col, bh, smoothstep(hy2 + 0.004, hy2 - 0.004, p.y));
  }

  if (p.y < hy + 0.07) {
    float depth = clamp((hy - p.y) / 0.55, 0.0, 1.0);
    float blade = noise(vec2(p.x * 22.0 + w * 2.0 * (0.3 + depth), p.y * 60.0));
    vec3 g = mix(grass * 0.55, grass * 1.15 + vec3(0.12, 0.1, 0.0), blade);
    g = mix(g, gold * 0.75 + grass * 0.35, 0.3 * noise(vec2(p.x * 3.0 - w * 0.6, p.y * 4.0)));
    g += vec3(0.12, 0.14, 0.02) * smoothstep(0.4, 1.3, w);
    col = mix(col, g, smoothstep(hy + 0.004, hy - 0.004, p.y));

    float s = p_size / 324.0;
    vec2 c0 = floor(p / s);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = c0 + vec2(float(i), float(j));
        float h = hash21(c);
        if (h > p_bloom) continue;
        vec2 h2 = vec2(hash21(c + 17.1), hash21(c + 41.7));
        vec2 root = (c + 0.15 + 0.7 * h2) * s;
        float rh = hillY(root.x);
        if (root.y > rh - 0.01) continue;
        float dd = clamp((rh - root.y) / 0.55, 0.0, 1.0);
        float sz = mix(0.45, 1.15, dd) * (0.8 + 0.4 * h2.x);
        float stem = s * 0.9 * sz;
        float bend = clamp(w * (0.7 + 0.6 * h2.y), -1.2, 1.2);
        vec2 head = root + vec2(bend * stem * 0.6, stem * (1.0 - 0.3 * bend * bend));
        vec2 pa = p - root;
        vec2 ba = head - root;
        float k = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float sd = length(pa - ba * k);
        col = mix(col, grass * 0.45, smoothstep(s * 0.05 * sz, s * 0.02 * sz, sd) * 0.8);
        vec2 d = p - head;
        float ca = cos(bend * 0.5), sa = sin(bend * 0.5);
        d = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
        float r = s * 0.32 * sz;
        float e = length(d * vec2(1.0, 1.25)) / r;
        if (e < 1.0) {
          vec3 pc = mix(orange, gold, h2.x * 0.6);
          pc = mix(pc, gold * 1.1 + 0.1, smoothstep(0.75, 0.0, e) * (d.y > 0.0 ? 0.55 : 0.25));
          pc *= 0.8 + 0.35 * smoothstep(-r, r, d.y + d.x * 0.5);
          col = mix(col, pc, smoothstep(1.0, 0.8, e));
        }
      }
    }
  }
  return col;
}

vec3 dabLayer(vec2 p, vec2 off, float w, float t, out float m, out float stripe) {
  float cell = p_brush;
  vec2 q = p / cell + off;
  vec2 c = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 cp = (c + 0.5 - off) * cell;
  float h = hash21(c + off * 7.0);
  float hy = hillY(cp.x);
  float ang = cp.y > hy + 0.01 ? 0.05 + 0.3 * (h - 0.5) : 1.3 + (h - 0.5) * 0.9 - w * 0.4;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 jit = (vec2(h, hash21(c + 3.3)) - 0.5) * 0.35;
  vec2 g = f - jit;
  float a = dot(g, dir);
  float b = dot(g, nrm);
  m = length(vec2(a * 0.9, b * 2.4));
  stripe = sin(b * 38.0 + h * 20.0) * 0.5 + 0.5;
  vec2 sp = cp + (jit + dir * a * 0.9) * cell;
  return base(sp, w, t);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float wt = t * p_wind;

  float w = 0.45 * sin(p.x * 2.6 - wt * 1.4 + p.y * 1.3);
  w += 1.1 * (noise(vec2(p.x * 1.3 - wt * 0.9, p.y * 1.1 + wt * 0.15)) - 0.45);
  w += 0.7 * smoothstep(0.55, 0.9, noise(vec2(p.x * 0.8 - wt * 1.7, 0.5 + p.y * 0.3)));

  float done = 0.0;
  float err = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float gst = exp(-pow((dist - r.z * 0.35) * 7.0, 2.0)) * exp(-r.z * 0.5);
    w += gst * 1.4;
    if (abs(r.w - 1.0) < 0.5) err += gst; else done += gst;
  }
  vec2 dp = p - toP(u_pointer);
  w += 1.0 * exp(-dot(dp, dp) / 0.012);
  w *= p_bend;

  float mA, sA, mB, sB;
  vec3 colB = dabLayer(p, vec2(0.0), w, t, mB, sB);
  vec3 colA = dabLayer(p, vec2(0.5, 0.37), w, t, mA, sA);
  colB *= 0.95 + 0.07 * sB;
  colA *= 0.95 + 0.08 * sA;
  vec3 col = mix(colB, colA, smoothstep(0.62, 0.46, mA));
  col *= 0.97 + 0.06 * noise(p * 140.0);

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 head = toP(a.xy) + vec2(w * 0.012, 0.004 * sin(t * 2.3 + float(i)));
    vec2 d = p - head;
    float R = 0.026 * a.w;
    float waiting = step(0.5, a.z);
    float pulse = 0.5 + 0.5 * sin(t * 3.0);
    float glow = exp(-dot(d, d) / (0.004 + 0.004 * waiting * pulse));
    col += u_palette[3] * glow * a.w * (0.35 + 0.35 * waiting * pulse);
    float ang = atan(d.y, d.x);
    float rr = R * (0.8 + 0.2 * cos(4.0 * ang + w * 0.8));
    float e = length(d) / max(rr, 1e-4);
    vec3 pc = mix(u_palette[2] * 1.1, u_palette[3] * 1.15 + 0.1, smoothstep(1.0, 0.2, e) * 0.6 + 0.25 * smoothstep(-R, R, d.y));
    pc = mix(pc, vec3(0.2, 0.12, 0.05), smoothstep(0.22, 0.12, e));
    col = mix(col, pc, smoothstep(1.0, 0.85, e) * a.w);
    if (waiting > 0.5) {
      float ring = abs(length(d) - R * (1.4 + 0.6 * pulse));
      col += u_palette[3] * smoothstep(0.004, 0.0, ring) * 0.6 * a.w;
    } else {
      for (int k = 0; k < 4; k++) {
        float ph = fract(t * 0.35 * max(p_wind, 0.2) + float(k) * 0.25 + float(i) * 0.13);
        vec2 pp = head + vec2(ph * 0.24, 0.03 * sin(ph * 9.0 + float(k) * 2.0) - ph * 0.04);
        float pd = length((p - pp) * vec2(1.0, 1.6));
        col = mix(col, mix(u_palette[2], u_palette[3], 0.3) * 1.1, smoothstep(0.008, 0.004, pd) * (1.0 - ph) * a.w);
      }
    }
  }

  col += u_palette[3] * clamp(done, 0.0, 1.0) * 0.22;
  col = mix(col, vec3(0.95, 0.12, 0.08), clamp(err, 0.0, 1.0) * 0.6);

  float cm = exp(-dot(p * vec2(0.9, 1.4), p * vec2(0.9, 1.4)) / 0.08);
  vec3 soft = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))), 0.35);
  col = mix(col, soft, cm * 0.25);

  return mix(u_canvas, col, p_color);
}`;

const PLASTICINE_COVE_SOURCE = `struct Clay { vec3 alb; vec2 g; float ao; float z; vec3 emit; };

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
  vec2 sd = p - vec2(0.06*aspect, 0.3);
  m = max(m, smoothstep(0.085, 0.07, length(sd)));
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
  vec2 sc = vec2(0.06*aspect, 0.3);
  vec2 sd = p - sc;
  c.alb += u_palette[3]*exp(-dot(sd, sd)/0.03)*0.22;
  float best = 0.0;
  float sl = length(sd);
  vec3 sunC = mix(u_palette[2], u_palette[3], 0.3 + 0.4*smoothstep(0.09, 0.0, sl));
  sunC = mix(sunC, u_palette[2]*1.05, smoothstep(0.005, 0.0, abs(sl - 0.064))*0.8);
  dome(c, sd, 0.085, sunC, 0.25, best, 0.0, 0.012);
  float cc0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(cc0 + float(j), k, t);
      if (pf.w == 0.0 || p.y < pf.w - 0.03) continue;
      vec3 cl = mix(mix(u_palette[3], vec3(1.0), 0.3), u_palette[2]*0.9 + 0.12, smoothstep(pf.w + 0.03, pf.w - 0.03, p.y)*0.5);
      dome(c, p - pf.xy, pf.z, cl, 0.3, best, 0.0, 0.06);
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
        c.z = 0.8; c.ao = 1.0;
      }
      float ty = p.y + 0.22;
      if (ty > 0.0 && ty < 0.3){
        float hw = mix(0.038, 0.025, ty/0.3);
        float u = (p.x - lx0 + 0.002*sin(ty*40.0))/hw;
        if (abs(u) < 1.0){
          float band = mod(floor(ty/0.055 + 0.08*sin(p.x*120.0)), 2.0);
          c.alb = band < 0.5 ? u_palette[2] : mix(u_palette[3], vec3(1.0), 0.3);
          c.g = vec2(slopeOf(u)*0.8, 0.0);
          c.z = 0.8; c.ao = 1.0;
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
  float ang = T*0.9;
  vec2 bd = p - lamp;
  float side = cos(ang);
  float along = bd.x*sign(side);
  float cone = exp(-pow(bd.y/(0.008 + max(along, 0.0)*0.13), 2.0))*exp(-max(along, 0.0)*1.1)*step(0.0, along)*abs(side);
  float lampGlow = exp(-dot(bd, bd)/0.0012);
  col += u_palette[3]*(cone*0.5*(1.0 - smoothstep(0.5, 0.7, c.z)) + lampGlow*0.5)*p_beam;
  col *= 1.0 + 0.025*(hash21(vec2(frame, 7.0)) - 0.5);
  return mix(u_canvas, col, p_color);
}`;

const SCREAMING_FJORD_SOURCE = `const int NS = 9;

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

const JELLYFISH_TIDEPOOL_SOURCE = `vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * p_drift;
  vec3 deep = u_palette[0];
  vec3 teal = u_palette[1];
  vec3 vio = u_palette[2];
  vec3 dawn = u_palette[3];
  vec3 water = mix(u_canvas, mix(deep, teal, 0.4), mix(0.5, 0.8, u_dark));

  vec2 dp = p - toP(u_pointer);
  float pd = exp(-dot(dp, dp) / 0.01);
  vec2 q = p + dp * pd * 0.4;

  // calm mask: quiet across the reading column and composer; lively at the edges and top
  float ex = abs(p.x) / (0.5 * u_resolution.x / u_resolution.y);
  float edge = max(smoothstep(0.4, 0.9, ex), smoothstep(0.75, 0.95, uv.y));
  float live = mix(1.0, edge, p_calm);

  vec2 w = q * 2.2 + vec2(t * 0.12, -t * 0.08);
  float n = fbm(w + vec2(sin(t * 0.4 + q.y * 3.0) * 0.5, cos(t * 0.33) * 0.4));
  vec3 col = mix(water, mix(deep, teal, 0.6), n * (0.35 + 0.65 * live));
  // slow swells rolling across the pool
  float swell = 0.5 + 0.5 * sin(q.x * 4.0 + q.y * 2.5 - t * 1.1 + n * 3.0);
  col = mix(col, mix(deep, teal, 0.5), swell * 0.18 * (0.4 + 0.6 * live));
  float c = abs(sin(q.x * 18.0 + n * 7.0 + t * 1.6) * sin(q.y * 15.0 - n * 6.0 - t * 1.3));
  col = mix(col, mix(teal, vec3(1.0), 0.3), pow(1.0 - c, 10.0) * 0.6 * p_glow * (0.25 + 0.75 * live));

  float rimM = max(smoothstep(0.6, 1.0, ex + n * 0.2), smoothstep(0.78, 1.0, uv.y + n * 0.1));
  col = mix(col, mix(vio, dawn, uv.y), rimM * 0.85 * p_dawn);

  vec2 g = q * 22.0 + vec2(t * 1.2, sin(t * 0.5) * 2.5);
  vec2 cid = floor(g);
  float h = hash21(cid);
  vec2 off = vec2(hash21(cid + 3.1), hash21(cid + 7.7)) - 0.5;
  float tw = 0.5 + 0.5 * sin(t * 3.0 + h * 40.0);
  float sp = smoothstep(0.22, 0.0, length(fract(g) - 0.5 - off * 0.5));
  col = mix(col, mix(teal, vio, h) * 1.2, sp * step(1.0 - p_plankton * 0.5, h) * tw * p_glow * (0.15 + 0.85 * live));

  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec2 jp = vec2(0.6 * sin(t * 0.15 + fk * 2.1), 0.38 * sin(t * 0.11 + fk * 1.7) + 0.03 * sin(t * 1.5 + fk));
    vec2 d = p - jp;
    float bell = exp(-dot(d * vec2(1.0, 1.6), d * vec2(1.0, 1.6)) / 0.003);
    col = mix(col, vio, clamp(bell * 0.7 * p_glow * (0.3 + 0.7 * live), 0.0, 0.8));
  }

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    float pulse = 0.5 + 0.5 * sin(u_time * 3.0 + fi);
    float swim = sin(u_time * 2.2 + fi * 1.3);
    vec2 c0 = toP(a.xy) + vec2(0.006 * sin(u_time * 0.7 + fi), (1.0 - waiting) * 0.014 * swim);
    vec2 d = p - c0;
    float squash = 1.0 + 0.18 * swim * (1.0 - waiting);
    vec2 bd = d * vec2(squash, 1.0 / squash);
    float r = 0.03;
    float dome = length(bd) / r;
    float bellM = smoothstep(1.0, 0.6, dome) * smoothstep(-0.4 * r, 0.0, bd.y);
    vec3 jc = mix(vio, teal, 0.3 + 0.3 * sin(fi));
    if (waiting > 0.5) jc = mix(jc, dawn, 0.75);
    float halo = exp(-dot(d, d) / (0.004 + 0.008 * waiting * pulse));
    col = mix(col, jc, clamp(halo * a.w * p_glow * (0.4 + 0.35 * waiting * pulse), 0.0, 0.8));
    col = mix(col, mix(jc, vec3(1.0), 0.25), bellM * 0.9 * a.w);
    float len = 0.1 * p_trail * (1.0 - 0.4 * waiting);
    float ty = clamp(-d.y / len, 0.0, 1.0);
    if (d.y < 0.0 && d.y > -len) {
      for (int k = 0; k < 3; k++) {
        float fk = float(k) - 1.0;
        float tx = fk * 0.012 + 0.014 * ty * sin(ty * 8.0 - u_time * 3.0 + fk * 2.0);
        float tl = smoothstep(0.005, 0.0, abs(d.x - tx));
        col = mix(col, jc, tl * (1.0 - ty) * 0.75 * a.w);
      }
    }
    if (waiting > 0.5) {
      float ph = fract(u_time * 0.6);
      float ring = abs(length(d) - r * (1.5 + 1.8 * ph));
      col = mix(col, dawn, smoothstep(0.005, 0.0, ring) * (1.0 - ph) * 0.8 * a.w);
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float ring = exp(-pow((dist - r.z * 0.22) * 30.0, 2.0)) * exp(-r.z * 0.9);
    vec3 rc = r.w > 0.5 && r.w < 1.5 ? vec3(0.95, 0.2, 0.18) : (r.w > 1.5 ? vio : teal);
    col = mix(col, rc, ring * 0.75);
  }

  col = mix(col, teal, pd * 0.2);
  return mix(u_canvas, col, p_color);
}`;

const KOI_POND_SOURCE = `const vec3 LD = vec3(-0.4, 0.5, 0.77);
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

const RED_ALARM_SOURCE = `const float BAY[16] = float[16](0.0,8.0,2.0,10.0,12.0,4.0,14.0,6.0,3.0,11.0,1.0,9.0,15.0,7.0,13.0,5.0);
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

export const BUILT_IN_SCENES: BuiltInScene[] = [
  {
    id: "tide",
    name: "Tide",
    source: TIDE_SOURCE,
    palette: ["#15295a", "#1e8a94", "#ffa845", "#efe2c4"],
    params: [
      param("swell", "Swell speed", 0, 3, 1, 0.05),
      param("height", "Wave height", 0.3, 1.6, 1, 0.05),
      param("foam", "Foam claws", 0, 1.6, 1, 0.05),
      param("carve", "Carved line density", 0.5, 2, 1, 0.05),
      param("glow", "Lantern glow", 0, 2, 1, 0.05),
      param("color", "Color strength", 0, 1, 0.92),
    ],
  },
  {
    id: "fireflies",
    name: "Fireflies",
    source: FIREFLIES_SOURCE,
    palette: ["#070b22", "#1f3f94", "#ffd65c", "#58b4ff"],
    params: [
      param("size", "Firefly size", 0.2, 3, 1.2),
      param("motes", "Firefly swarm", 0, 2, 0.9),
      param("stars", "Stars", 0, 2, 1),
      param("galaxy", "Milky Way", 0, 2, 1),
      param("trails", "Light trails", 0, 2, 1),
      param("mist", "Ground mist", 0, 2, 1),
      param("moon", "Moon", 0, 2, 1),
      param("wind", "Grass sway", 0, 3, 1),
      param("wet", "Wetness (blooms & bleed)", 0, 2, 1),
      param("wash", "Wash layering", 0, 2, 1),
      param("grain", "Granulation", 0, 2, 1),
      param("color", "Color strength", 0, 1, 0.92),
    ],
  },
  {
    id: "contour",
    name: "Contour",
    source: CONTOUR_SOURCE,
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
  },
  {
    id: "risograph-map",
    name: "Risograph Map",
    source: RISOGRAPH_SOURCE,
    palette: ["#ff48b0", "#0078bf", "#ffe800", "#f6f0e1"],
    params: [
      param("drift", "Terrain drift", 0, 3, 1),
      param("height", "Agent peaks", 0, 2, 0.9),
      param("dots", "Halftone dot size", 0.5, 2.5, 1),
      param("misreg", "Misregistration", 0, 3, 1),
      param("grain", "Ink grain", 0, 2, 1),
      param("color", "Color strength", 0, 1, 0.92),
    ],
  },
  {
    id: "poppy-hill",
    name: "Poppy Hill in the Wind",
    source: POPPY_HILL_SOURCE,
    palette: ["#5fa9ea", "#3f9b34", "#ff5a0a", "#ffbf1f"],
    params: [
      param("wind", "Wind speed", 0, 3, 1),
      param("bend", "Gust strength", 0, 2, 1),
      param("size", "Poppy size", 8, 40, 18, 0.5),
      param("bloom", "Bloom amount", 0, 1, 0.72),
      param("brush", "Brush stroke size", 0.006, 0.03, 0.017, 0.001),
      param("color", "Color strength", 0, 1, 0.95),
    ],
  },
  {
    id: "plasticine-lighthouse-cove",
    name: "Plasticine Lighthouse Cove",
    source: PLASTICINE_COVE_SOURCE,
    palette: ["#1c2c6b", "#22b3a6", "#ff6a3d", "#ffe0a6"],
    params: [
      param("swell", "Swell speed", 0, 2.5, 1, 0.05),
      param("coil", "Coil thickness", 0.5, 2, 1, 0.05),
      param("thumb", "Thumbprints", 0, 2.5, 1, 0.05),
      param("fps", "Stop-motion fps", 4, 24, 12, 1),
      param("beam", "Lighthouse beam", 0, 2, 1, 0.05),
      param("color", "Color strength", 0, 1, 0.92),
    ],
  },
  {
    id: "swirling-stars-screaming-fjord",
    name: "Swirling Stars, Screaming Fjord",
    source: SCREAMING_FJORD_SOURCE,
    palette: ["#2446a8", "#f6cf3f", "#e04a24", "#102a22"],
    params: [
      param("swirl", "Swirl speed", 0, 3, 1.3, 0.05),
      param("twist", "Vortex twist", 0, 2, 1, 0.05),
      param("brush", "Brush size", 0.006, 0.024, 0.014, 0.001),
      param("stars", "Star glow", 0, 1.5, 1, 0.05),
      param("blaze", "Scream sky height", 0, 1, 0.7, 0.05),
      param("color", "Color strength", 0, 1, 0.92),
    ],
  },
  {
    id: "jellyfish-tidepool",
    name: "Jellyfish Tidepool",
    source: JELLYFISH_TIDEPOOL_SOURCE,
    palette: ["#06243a", "#1fb5a8", "#b98cff", "#ffb38a"],
    params: [
      param("drift", "Current speed", 0, 3, 1),
      param("glow", "Bioluminescence", 0, 2, 1),
      param("plankton", "Plankton density", 0, 1, 0.45),
      param("trail", "Tentacle length", 0.3, 2, 1),
      param("dawn", "Dawn on the rim", 0, 1, 0.6),
      param("calm", "Calm behind text", 0, 1, 0.7),
      param("color", "Color strength", 0, 1, 0.92),
    ],
  },
  {
    id: "koi-pond",
    name: "Koi Pond",
    source: KOI_POND_SOURCE,
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
  },
  {
    id: "red-alarm",
    name: "Red Alarm",
    source: RED_ALARM_SOURCE,
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
  },
];

export const DEFAULT_SCENE: Scene = sceneOf(BUILT_IN_SCENES[0]!);

export function sceneOf(builtIn: BuiltInScene): Scene {
  return {
    name: builtIn.name,
    source: builtIn.source,
    palette: [...builtIn.palette],
    params: builtIn.params.map((entry) => ({ ...entry })),
    baseId: builtIn.id,
  };
}

export function rebuildBuiltIn(scene: Scene): Scene {
  const builtIn = BUILT_IN_SCENES.find((entry) => entry.id === scene.baseId);
  if (!builtIn) return scene;
  const values = new Map(scene.params.map((entry) => [entry.id, entry.value]));
  return {
    ...sceneOf(builtIn),
    name: scene.name,
    palette: scene.palette,
    params: builtIn.params.map((entry) => {
      const value = values.get(entry.id);
      return value === undefined
        ? { ...entry }
        : { ...entry, value: Math.min(entry.max, Math.max(entry.min, value)) };
    }),
  };
}
