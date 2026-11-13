import type { ActivityFrame } from "./activity.js";
import {
  MAX_AGENTS,
  MAX_RIPPLES,
  assembleShader,
  hexToRgb,
  remapShaderLog,
  type Scene,
} from "./contract.js";
import { encodePng } from "./pixels.js";

const VERTEX_SOURCE = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export type CompileResult =
  | { ok: true }
  | { ok: false; log: string }
  | { ok: "superseded" };

const MOTION_SAMPLE_WIDTH = 64;
const PROBE_SIZES = [64, 192] as const;
const PROBE_FRAMES = 3;
const COMPILE_POLL_MS = 16;

export interface Capture {
  dataUrl: string;
  visibility: { fromBackground: number; spread: number };
  samples: Float32Array;
}

export function motionBetween(before: Capture, after: Capture): number {
  const length = Math.min(before.samples.length, after.samples.length);
  if (length === 0) return 0;
  let total = 0;
  for (let index = 0; index < length; index += 1) {
    total += Math.abs(before.samples[index]! - after.samples[index]!);
  }
  return total / length;
}

export interface ThemeColors {
  canvas: [number, number, number];
  ink: [number, number, number];
  dark: boolean;
}

export interface FrameInput {
  time: number;
  frame: ActivityFrame;
  pointer: [number, number];
  theme: ThemeColors;
}

interface Program {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
  paramIds: string[];
}

/**
 * Frees the canvas's GPU context now instead of whenever it is garbage collected. Only for a
 * canvas that is going away: a released context can't be drawn into again.
 */
export function releaseContext(canvas: HTMLCanvasElement): void {
  canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
}

export class AmbientRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly buffer: WebGLBuffer;
  private current: Program | null = null;
  private palette = new Float32Array(12);
  private paramValues = new Map<string, number>();
  private compileToken = 0;
  private readonly parallel: { COMPLETION_STATUS_KHR: number } | null;
  private probeTarget: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
    if (!gl) throw new Error("WebGL2 is unavailable");
    this.gl = gl;
    this.parallel = gl.getExtension("KHR_parallel_shader_compile");
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("could not allocate a vertex buffer");
    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
  }

  async compile(scene: Pick<Scene, "source" | "params">): Promise<CompileResult> {
    const { gl } = this;
    const token = ++this.compileToken;
    const assembled = assembleShader(scene);
    const vertex = gl.createShader(gl.VERTEX_SHADER);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return { ok: false, log: "could not allocate a shader program" };
    gl.shaderSource(vertex, VERTEX_SOURCE);
    gl.compileShader(vertex);
    gl.shaderSource(fragment, assembled.code);
    gl.compileShader(fragment);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);
    const parallel = this.parallel;
    if (parallel) {
      await new Promise<void>((resolve) => {
        const poll = () => {
          if (gl.isContextLost() || gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
            resolve();
          } else {
            setTimeout(poll, COMPILE_POLL_MS);
          }
        };
        poll();
      });
    }
    const cleanup = () => {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
    if (token !== this.compileToken || gl.isContextLost()) {
      cleanup();
      gl.deleteProgram(program);
      return { ok: "superseded" };
    }
    const failure = [fragment, vertex].find((shader) => !gl.getShaderParameter(shader, gl.COMPILE_STATUS));
    if (failure || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = failure ? gl.getShaderInfoLog(failure) : gl.getProgramInfoLog(program);
      cleanup();
      gl.deleteProgram(program);
      return { ok: false, log: remapShaderLog(log ?? "compile failed", assembled.sourceLineOffset) };
    }
    cleanup();
    if (this.current) gl.deleteProgram(this.current.program);
    const names = [
      "u_resolution",
      "u_time",
      "u_palette",
      "u_canvas",
      "u_ink",
      "u_dark",
      "u_agentCount",
      "u_agents",
      "u_rippleCount",
      "u_ripples",
      "u_activity",
      "u_pointer",
      ...scene.params.map((param) => `p_${param.id}`),
    ];
    this.current = {
      program,
      paramIds: scene.params.map((param) => param.id),
      uniforms: new Map(
        names.map((name) => [name, gl.getUniformLocation(program, name)]),
      ),
    };
    return { ok: true };
  }

  isContextLost(): boolean {
    return this.gl.isContextLost();
  }

  setPalette(palette: readonly string[]): void {
    palette.slice(0, 4).forEach((hex, index) => {
      this.palette.set(hexToRgb(hex), index * 3);
    });
  }

  setParamValues(values: Record<string, number>): void {
    this.paramValues = new Map(Object.entries(values));
  }

  resize(scale: number): void {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(window.innerWidth * ratio * scale));
    const height = Math.max(1, Math.round(window.innerHeight * ratio * scale));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  render(input: FrameInput): void {
    this.draw(input, this.canvas.width, this.canvas.height);
  }

  private draw(input: FrameInput, width: number, height: number): void {
    const { gl, current } = this;
    if (!current) return;
    const uniform = (name: string) => current.uniforms.get(name) ?? null;
    gl.viewport(0, 0, width, height);
    gl.useProgram(current.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uniform("u_resolution"), width, height);
    gl.uniform1f(uniform("u_time"), input.time);
    gl.uniform3fv(uniform("u_palette"), this.palette);
    gl.uniform3fv(uniform("u_canvas"), input.theme.canvas);
    gl.uniform3fv(uniform("u_ink"), input.theme.ink);
    gl.uniform1f(uniform("u_dark"), input.theme.dark ? 1 : 0);
    gl.uniform1i(uniform("u_agentCount"), input.frame.agentCount);
    gl.uniform4fv(uniform("u_agents"), input.frame.agents, 0, MAX_AGENTS * 4);
    gl.uniform1i(uniform("u_rippleCount"), input.frame.rippleCount);
    gl.uniform4fv(uniform("u_ripples"), input.frame.ripples, 0, MAX_RIPPLES * 4);
    gl.uniform1f(uniform("u_activity"), input.frame.activity);
    gl.uniform2f(uniform("u_pointer"), input.pointer[0], input.pointer[1]);
    for (const id of current.paramIds) {
      gl.uniform1f(uniform(`p_${id}`), this.paramValues.get(id) ?? 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  estimateFrameMs(input: FrameInput): number {
    const { gl } = this;
    if (!this.current || gl.isContextLost()) return 0;
    const aspect = this.canvas.height / Math.max(1, this.canvas.width);
    const timings = PROBE_SIZES.map((width) => {
      const height = Math.max(1, Math.round(width * aspect));
      this.bindProbeTarget(width, height);
      gl.finish();
      const start = performance.now();
      for (let index = 0; index < PROBE_FRAMES; index += 1) this.draw(input, width, height);
      gl.finish();
      return { pixels: width * height, ms: (performance.now() - start) / PROBE_FRAMES };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const [small, large] = timings as [(typeof timings)[number], (typeof timings)[number]];
    const perPixel = Math.max(0, large.ms - small.ms) / (large.pixels - small.pixels);
    return perPixel * this.canvas.width * this.canvas.height;
  }

  private bindProbeTarget(width: number, height: number): void {
    const { gl } = this;
    if (!this.probeTarget) {
      const framebuffer = gl.createFramebuffer();
      const texture = gl.createTexture();
      if (!framebuffer || !texture) throw new Error("could not allocate a probe target");
      this.probeTarget = { framebuffer, texture };
    }
    gl.bindTexture(gl.TEXTURE_2D, this.probeTarget.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.probeTarget.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.probeTarget.texture, 0);
  }

  async capture(
    maxWidth: number,
    canvasColor: readonly [number, number, number],
    options: { encode: boolean },
  ): Promise<Capture> {
    const source = this.canvas;
    const scale = Math.min(1, maxWidth / source.width);
    const target = document.createElement("canvas");
    target.width = Math.round(source.width * scale);
    target.height = Math.round(source.height * scale);
    const context = target.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D canvas unavailable");
    context.drawImage(source, 0, 0, target.width, target.height);
    const { data } = context.getImageData(0, 0, target.width, target.height);
    let distance = 0;
    let lumaSum = 0;
    let lumaSquares = 0;
    let samples = 0;
    for (let index = 0; index < data.length; index += 4 * 16) {
      const r = data[index]! / 255;
      const g = data[index + 1]! / 255;
      const b = data[index + 2]! / 255;
      distance += Math.hypot(r - canvasColor[0], g - canvasColor[1], b - canvasColor[2]) / Math.sqrt(3);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lumaSum += luma;
      lumaSquares += luma * luma;
      samples += 1;
    }
    const mean = lumaSum / samples;
    const small = document.createElement("canvas");
    small.width = MOTION_SAMPLE_WIDTH;
    small.height = Math.max(1, Math.round((MOTION_SAMPLE_WIDTH * source.height) / source.width));
    const smallContext = small.getContext("2d", { willReadFrequently: true });
    if (!smallContext) throw new Error("2D canvas unavailable");
    smallContext.drawImage(target, 0, 0, small.width, small.height);
    const smallData = smallContext.getImageData(0, 0, small.width, small.height).data;
    const lumas = new Float32Array(smallData.length / 4);
    for (let index = 0; index < lumas.length; index += 1) {
      lumas[index] =
        (0.2126 * smallData[index * 4]! + 0.7152 * smallData[index * 4 + 1]! + 0.0722 * smallData[index * 4 + 2]!) / 255;
    }
    return {
      dataUrl: options.encode ? await encodePng(target) : "",
      visibility: {
        fromBackground: distance / samples,
        spread: Math.sqrt(Math.max(0, lumaSquares / samples - mean * mean)),
      },
      samples: lumas,
    };
  }

  dispose(): void {
    const { gl } = this;
    this.compileToken += 1;
    if (this.current) gl.deleteProgram(this.current.program);
    if (this.probeTarget) {
      gl.deleteFramebuffer(this.probeTarget.framebuffer);
      gl.deleteTexture(this.probeTarget.texture);
      this.probeTarget = null;
    }
    gl.deleteBuffer(this.buffer);
    this.current = null;
  }
}
