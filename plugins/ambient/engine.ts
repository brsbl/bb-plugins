import type { ActivityFrame } from "./activity.js";
import {
  MAX_AGENTS,
  MAX_RIPPLES,
  assembleShader,
  hexToRgb,
  remapShaderLog,
  type Scene,
} from "./scene.js";

const VERTEX_SOURCE = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export type CompileResult = { ok: true } | { ok: false; log: string };

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

export class AmbientRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly buffer: WebGLBuffer;
  private current: Program | null = null;
  private palette = new Float32Array(12);
  private paramValues = new Map<string, number>();

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

  compile(scene: Pick<Scene, "source" | "params">): CompileResult {
    const { gl } = this;
    const assembled = assembleShader(scene);
    const vertex = this.shader(gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragment = this.shader(gl.FRAGMENT_SHADER, assembled.code);
    if (!vertex.ok || !fragment.ok) {
      const log = !fragment.ok ? fragment.log : !vertex.ok ? vertex.log : "";
      if (vertex.ok) gl.deleteShader(vertex.shader);
      if (fragment.ok) gl.deleteShader(fragment.shader);
      return { ok: false, log: remapShaderLog(log, assembled.sourceLineOffset) };
    }
    const program = gl.createProgram();
    if (!program) return { ok: false, log: "could not allocate a program" };
    gl.attachShader(program, vertex.shader);
    gl.attachShader(program, fragment.shader);
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);
    gl.deleteShader(vertex.shader);
    gl.deleteShader(fragment.shader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? "link failed";
      gl.deleteProgram(program);
      return { ok: false, log: remapShaderLog(log, assembled.sourceLineOffset) };
    }
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
    const { gl, current } = this;
    if (!current) return;
    const uniform = (name: string) => current.uniforms.get(name) ?? null;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(current.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uniform("u_resolution"), this.canvas.width, this.canvas.height);
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

  capture(maxWidth: number): string {
    const source = this.canvas;
    const scale = Math.min(1, maxWidth / source.width);
    const target = document.createElement("canvas");
    target.width = Math.round(source.width * scale);
    target.height = Math.round(source.height * scale);
    const context = target.getContext("2d");
    if (!context) throw new Error("2D canvas unavailable");
    context.drawImage(source, 0, 0, target.width, target.height);
    return target.toDataURL("image/png");
  }

  dispose(): void {
    const { gl } = this;
    if (this.current) gl.deleteProgram(this.current.program);
    gl.deleteBuffer(this.buffer);
    this.current = null;
  }

  private shader(
    type: number,
    source: string,
  ): { ok: true; shader: WebGLShader } | { ok: false; log: string } {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) return { ok: false, log: "could not allocate a shader" };
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? "compile failed";
      gl.deleteShader(shader);
      return { ok: false, log };
    }
    return { ok: true, shader };
  }
}
