import type { Derived } from "./colors.js";

const vertex = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;
const fragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform vec2 origin;
uniform vec2 extent;
uniform float time;
uniform vec3 colors[4];
uniform vec3 highlight;
out vec4 result;
void main(){
  vec2 uv=(origin+vec2(gl_FragCoord.x/resolution.x,1.0-gl_FragCoord.y/resolution.y)*extent);
  vec2 p=uv-vec2(.5);
  float t=time*.55;
  float bend=sin(p.y*3.2+t)*.35+sin(p.x*2.1-t*.7)*.2;
  float phase=p.x*.7+p.y*.9+bend+t*.22;
  float band=fract(phase*.33)*4.0;
  vec3 col;
  if(band<1.0) col=mix(colors[0],colors[1],smoothstep(0.0,1.0,band));
  else if(band<2.0) col=mix(colors[1],colors[2],smoothstep(1.0,2.0,band));
  else if(band<3.0) col=mix(colors[2],colors[3],smoothstep(2.0,3.0,band));
  else col=mix(colors[3],colors[0],smoothstep(3.0,4.0,band));
  float shine=pow(.5+.5*sin(phase*4.0-t*.5),18.0)*.22;
  result=vec4(mix(col,highlight,shine),1.0);
}`;

export function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  if (!program || !buffer) { gl.deleteProgram(program); gl.deleteBuffer(buffer); return null; }
  const dispose = () => {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Could not allocate Prism Frame shader");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Prism Frame shader failed to compile");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Prism Frame shader failed to link");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  } catch (error) { dispose(); console.warn(error); return null; }
  const resolution = gl.getUniformLocation(program, "resolution");
  const origin = gl.getUniformLocation(program, "origin");
  const extent = gl.getUniformLocation(program, "extent");
  const time = gl.getUniformLocation(program, "time");
  const colors = gl.getUniformLocation(program, "colors[0]");
  const highlight = gl.getUniformLocation(program, "highlight");
  return {
    draw(theme: Derived, seconds: number, rect: DOMRect, scale: number) {
      const { width, height } = rect;
      const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0,0,w,h);
      gl.useProgram(program);
      gl.uniform2f(resolution,w,h);
      gl.uniform2f(origin, rect.left / innerHeight, rect.top / innerHeight);
      gl.uniform2f(extent, width / innerHeight, height / innerHeight);
      gl.uniform1f(time,seconds);
      gl.uniform3fv(colors,theme.palette.flat());
      gl.uniform3fv(highlight,theme.highlight);
      gl.drawArrays(gl.TRIANGLES,0,3);
    },
    dispose,
  };
}
