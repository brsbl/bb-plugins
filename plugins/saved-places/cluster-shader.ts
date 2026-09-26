export type MeshBlob = { x: number; y: number; r: number; color: string };
export type MeshSpec = { base: string; blobs: MeshBlob[] };

const MAX_BLOBS = 5;
const MAX_SIZE = 58;
const COLUMNS = 8;
const FRAME_MS = 1000 / 30;

const vertexSource = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const fragmentSource = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_seed;
uniform float u_px;
uniform vec3 u_base;
uniform vec4 u_blob[${MAX_BLOBS}];
uniform vec3 u_color[${MAX_BLOBS}];

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
vec3 toLab(vec3 c) {
  vec3 lms = mat3(0.4122214708, 0.2119034982, 0.0883024619, 0.5363325363, 0.6806995451, 0.2817188376, 0.0514459929, 0.1073969566, 0.6299787005) * c;
  lms = pow(max(lms, 0.0), vec3(1.0 / 3.0));
  return mat3(0.2104542553, 1.9779984951, 0.0259040371, 0.7936177850, -2.4285922050, 0.7827717662, -0.0040720468, 0.4505937099, -0.8086757660) * lms;
}
vec3 fromLab(vec3 c) {
  vec3 lms = mat3(1.0, 1.0, 1.0, 0.3963377774, -0.1055613458, -0.0894841775, 0.2158037573, -0.0638541728, -1.2914855480) * c;
  lms = lms * lms * lms;
  return mat3(4.0767416621, -1.2684380046, -0.0041960863, -3.3077115913, 2.6097574011, -0.7034186147, 0.2309699292, -0.3413193965, 1.7076147010) * lms;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 p = v_uv;
  float d = length(p);
  float alpha = 1.0 - smoothstep(1.0 - u_px * 1.5, 1.0, d);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
  float t = u_time * 0.32 + u_seed * 17.0;
  vec2 q = p;
  q += 0.34 * (vec2(noise(q * 1.7 + vec2(t, u_seed * 9.0)), noise(q * 1.7 + vec2(-t * 0.8, 5.0 + u_seed * 9.0))) - 0.5);
  q += 0.14 * vec2(sin(q.y * 3.1 + t * 1.3), cos(q.x * 2.7 - t * 1.1));
  vec3 baseLab = toLab(toLinear(u_base));
  float wsum = 0.18;
  vec3 acc = baseLab * wsum;
  float chroma = length(baseLab.yz) * wsum;
  for (int i = 0; i < ${MAX_BLOBS}; i++) {
    vec4 blob = u_blob[i];
    if (blob.w <= 0.0) continue;
    float fi = float(i);
    vec2 c = blob.xy + 0.16 * vec2(sin(t * 0.9 + fi * 2.1), cos(t * 0.7 + fi * 1.7));
    float w = exp(-2.2 * dot(q - c, q - c) / (blob.z * blob.z));
    w = w * w * w * blob.w;
    vec3 blobLab = toLab(toLinear(u_color[i]));
    acc += blobLab * w;
    chroma += length(blobLab.yz) * w;
    wsum += w;
  }
  vec3 lab = acc / wsum;
  lab.yz = normalize(lab.yz + 1e-6) * (chroma / wsum);
  float swirl = sin(dot(q, vec2(2.3, -1.9)) + t * 1.4);
  lab.yz *= 0.92 + 0.06 * swirl;
  lab.x = mix(lab.x, 0.9, 0.5) + 0.02 * swirl;
  vec3 color = fromLab(lab);
  vec3 n = vec3(p, sqrt(max(1.0 - d * d, 0.0)));
  vec3 light = normalize(vec3(-0.45, 0.6, 0.75));
  vec3 view = vec3(0.0, 0.0, 1.0);
  float fresnel = pow(1.0 - n.z, 2.5);
  color *= 1.0 + 0.08 * dot(n, light);
  vec3 glow = fromLab(vec3(min(lab.x + 0.18, 0.98), lab.yz * 0.8));
  float caustic = smoothstep(0.1, 0.95, -p.y) * (1.0 - smoothstep(0.7, 1.0, d)) * (0.8 + 0.2 * swirl);
  color = mix(color, glow, caustic * 0.75);
  float spec = pow(max(dot(reflect(-light, n), view), 0.0), 70.0);
  color += vec3(1.0) * spec;
  vec2 cap = (p - vec2(0.0, 0.44)) * vec2(1.0, 1.85);
  float glass = (1.0 - smoothstep(0.6, 0.64, length(cap))) * mix(0.5, 0.08, 1.0 - smoothstep(0.2, 0.85, p.y));
  color = mix(color, vec3(1.0), glass);
  float glint = 1.0 - smoothstep(0.0, 0.2, length((p - vec2(-0.25, 0.33)) * vec2(1.0, 1.4)));
  color += vec3(0.7) * glint;
  color = mix(color, vec3(1.0), fresnel * 0.45 * (0.6 + 0.4 * (1.0 - smoothstep(-0.8, 0.2, p.x + p.y))));
  vec3 srgb = toSrgb(color) + (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 128.0;
  gl_FragColor = vec4(clamp(srgb, 0.0, 1.0) * alpha, alpha);
}
`;

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

type Tile = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; spec: MeshSpec; seed: number; size: number; drawn: boolean };

export function createClusterShader() {
  const gl = document.createElement("canvas").getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader failed");
    return shader;
  };
  let program: WebGLProgram;
  try {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const u = { time: uniform("u_time"), seed: uniform("u_seed"), px: uniform("u_px"), base: uniform("u_base"), blob: uniform("u_blob"), color: uniform("u_color") };

  const tiles = new Set<Tile>();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  let tileSize = 0;
  let frame = 0;
  let last = 0;
  let lost = false;
  const start = performance.now();
  gl.canvas.addEventListener("webglcontextlost", event => { event.preventDefault(); lost = true; });

  const animating = () => !reducedMotion.matches && document.visibilityState === "visible";
  const render = (list: Tile[], time: number) => {
    const size = Math.ceil(MAX_SIZE * dpr());
    const rows = Math.ceil(list.length / COLUMNS);
    const canvas = gl.canvas as HTMLCanvasElement;
    if (canvas.width < COLUMNS * size || canvas.height < rows * size || tileSize !== size) {
      tileSize = size;
      canvas.width = COLUMNS * size;
      canvas.height = Math.max(canvas.height, rows * size);
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const placed = list.map((tile, index) => ({ tile, px: Math.ceil(tile.size * dpr()), x: (index % COLUMNS) * size, y: Math.floor(index / COLUMNS) * size }));
    for (const { tile, px, x, y } of placed) {
      gl.viewport(x, canvas.height - y - px, px, px);
      const blobs = new Float32Array(MAX_BLOBS * 4);
      const colors = new Float32Array(MAX_BLOBS * 3);
      tile.spec.blobs.slice(0, MAX_BLOBS).forEach((blob, i) => {
        blobs.set([blob.x, blob.y, blob.r, 1], i * 4);
        colors.set(rgb(blob.color), i * 3);
      });
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.seed, tile.seed);
      gl.uniform1f(u.px, 2 / px);
      gl.uniform3fv(u.base, rgb(tile.spec.base));
      gl.uniform4fv(u.blob, blobs);
      gl.uniform3fv(u.color, colors);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    for (const { tile, px, x, y } of placed) {
      if (tile.canvas.width !== px) { tile.canvas.width = px; tile.canvas.height = px; }
      tile.ctx.clearRect(0, 0, px, px);
      tile.ctx.drawImage(canvas, x, y, px, px, 0, 0, px, px);
      if (!tile.drawn) { tile.drawn = true; tile.canvas.dataset.ready = "true"; }
    }
  };
  const draw = (now: number) => {
    frame = 0;
    if (lost || !tiles.size) return;
    const animate = animating();
    const pending = [...tiles].filter(tile => tile.canvas.isConnected && (animate || !tile.drawn));
    if (pending.length && (!animate || now - last >= FRAME_MS)) {
      last = now;
      render(pending, animate ? (now - start) / 1000 : 0);
    }
    if (animate) frame = requestAnimationFrame(draw);
  };
  let flushing = false;
  const flush = () => {
    flushing = false;
    const fresh = [...tiles].filter(tile => tile.canvas.isConnected && !tile.drawn);
    if (!lost && fresh.length) render(fresh, animating() ? (performance.now() - start) / 1000 : 0);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  const onVisibility = () => schedule();
  document.addEventListener("visibilitychange", onVisibility);
  reducedMotion.addEventListener("change", onVisibility);

  return {
    attach(spec: MeshSpec, size: number, seed: number) {
      const canvas = document.createElement("canvas");
      canvas.className = "sp-cluster-mesh";
      canvas.setAttribute("aria-hidden", "true");
      const ctx = canvas.getContext("2d");
      if (!ctx) return { canvas, release: () => {} };
      const tile: Tile = { canvas, ctx, spec, seed, size, drawn: false };
      tiles.add(tile);
      if (!flushing) { flushing = true; queueMicrotask(flush); }
      schedule();
      return { canvas, release: () => { tiles.delete(tile); } };
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      tiles.clear();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
