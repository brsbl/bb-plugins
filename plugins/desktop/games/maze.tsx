import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ProgramMenuBar } from "../apps/xp-chrome";
import { BB_MARK } from "../art";
import { windowOwnsKeys } from "../windows";
import { advance, cellCenter, isWall, newRun, seededRandom, type MazeRun } from "./maze-core";

const OPTIONS_KEY = "bb-desktop:maze:options:v1";
const MAX_FRAME_SECONDS = 0.1;
/** The view renders at most this many pixels and is scaled up to the window, like the screen saver's low-res mode. */
const MAX_VIEW_PIXELS = 640 * 400;
/** Half the horizontal field of view, as the camera plane's length relative to the view direction. */
const FOV = 0.66;
const TEXTURE = 64;
const TURBO_SPEED = 3;

interface Options {
  overheadMap: boolean;
  turbo: boolean;
}

function loadOptions(): Options {
  try {
    const stored = JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? "null") as Partial<Options> | null;
    return { overheadMap: stored?.overheadMap !== false, turbo: stored?.turbo === true };
  } catch {
    return { overheadMap: true, turbo: false };
  }
}

function freshRun(): MazeRun {
  return newRun(seededRandom(Math.floor(Math.random() * 2 ** 32)));
}

/* Textures: drawn in source, packed as little-endian RGBA words for direct writes into ImageData. */

function pack(r: number, g: number, b: number): number {
  return ((255 << 24) | (clamp(b) << 16) | (clamp(g) << 8) | clamp(r)) >>> 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hash(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function texture(paint: (x: number, y: number) => [number, number, number]): Uint32Array {
  const pixels = new Uint32Array(TEXTURE * TEXTURE);
  for (let y = 0; y < TEXTURE; y++) {
    for (let x = 0; x < TEXTURE; x++) pixels[y * TEXTURE + x] = pack(...paint(x, y));
  }
  return pixels;
}

/** Red brick in running bond with pale mortar, eight courses to a wall. */
function brick(): Uint32Array {
  return texture((x, y) => {
    const row = Math.floor(y / 8);
    const shifted = x + (row % 2) * 8;
    const noise = hash(x, y, 1) * 22 - 11;
    if (y % 8 === 0 || shifted % 16 === 0) return [168 + noise, 160 + noise, 146 + noise];
    const tone = hash(Math.floor(shifted / 16), row, 2) * 34 - 17;
    const speck = hash(x, y, 3) < 0.04 ? -30 : 0;
    return [152 + tone + noise + speck, 64 + tone * 0.5 + noise + speck, 44 + tone * 0.4 + noise + speck];
  });
}

/** Warm wood planks running away from the viewer, with grain and staggered end joints. */
function wood(): Uint32Array {
  return texture((x, y) => {
    const plank = Math.floor(x / 16);
    const joint = Math.floor(hash(plank, 0, 4) * 64);
    if (x % 16 === 0 || y === joint) return [70, 42, 22];
    const tone = hash(plank, Math.floor((y - joint + 64) / 64), 5) * 30 - 15;
    const grain = Math.sin((x % 16) * 0.9 + Math.sin(y * 0.12 + plank * 2) * 2.6) * 12;
    const noise = hash(x, y, 6) * 10 - 5;
    return [150 + tone + grain + noise, 96 + tone * 0.7 + grain * 0.8 + noise, 52 + tone * 0.4 + grain * 0.5 + noise];
  });
}

/** Rough gray stucco. */
function stucco(): Uint32Array {
  return texture((x, y) => {
    const coarse = hash(x >> 2, y >> 2, 7) * 18;
    const fine = hash(x, y, 8) * 26;
    const pit = hash(x, y, 9) < 0.03 ? -34 : 0;
    const value = 128 + coarse + fine + pit;
    return [value, value, value - 4];
  });
}

interface Textures {
  wall: Uint32Array;
  floor: Uint32Array;
  ceiling: Uint32Array;
}

let textures: Textures | null = null;
function loadTextures(): Textures {
  textures ??= { wall: brick(), floor: wood(), ceiling: stucco() };
  return textures;
}

/** Darkens a packed pixel by `light` / 256, keeping alpha. */
function shade(pixel: number, light: number): number {
  const blue = (((pixel >>> 16) & 0xff) * light) >> 8;
  const green = (((pixel >>> 8) & 0xff) * light) >> 8;
  const red = ((pixel & 0xff) * light) >> 8;
  return (0xff000000 | (blue << 16) | (green << 8) | red) >>> 0;
}

function lightAt(distance: number): number {
  return Math.max(70, Math.min(256, Math.round(256 / (1 + distance * 0.09))));
}

/* The view: one ray per column for the walls, one span per row for the floor and ceiling. */

function castScene(pixels: Uint32Array, depth: Float32Array, width: number, height: number, run: MazeRun) {
  const { wall, floor, ceiling } = loadTextures();
  const { maze } = run;
  const { x: px, y: py, angle } = run.pose;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const planeX = -dirY * FOV;
  const planeY = dirX * FOV;
  const horizon = height / 2;

  for (let y = Math.floor(horizon) + 1; y < height; y++) {
    const distance = (0.5 * height) / (y - horizon);
    const light = lightAt(distance);
    const stepX = (distance * 2 * planeX) / width;
    const stepY = (distance * 2 * planeY) / width;
    let fx = px + distance * (dirX - planeX);
    let fy = py + distance * (dirY - planeY);
    const floorRow = y * width;
    const ceilingRow = (height - 1 - y) * width;
    for (let x = 0; x < width; x++) {
      const tx = Math.floor((fx - Math.floor(fx)) * TEXTURE) & (TEXTURE - 1);
      const ty = Math.floor((fy - Math.floor(fy)) * TEXTURE) & (TEXTURE - 1);
      pixels[floorRow + x] = shade(floor[ty * TEXTURE + tx]!, light);
      pixels[ceilingRow + x] = shade(ceiling[ty * TEXTURE + tx]!, light);
      fx += stepX;
      fy += stepY;
    }
  }

  for (let x = 0; x < width; x++) {
    const camera = (2 * x) / width - 1;
    const rayX = dirX + planeX * camera;
    const rayY = dirY + planeY * camera;
    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    const deltaX = rayX === 0 ? 1e30 : Math.abs(1 / rayX);
    const deltaY = rayY === 0 ? 1e30 : Math.abs(1 / rayY);
    const stepX = rayX < 0 ? -1 : 1;
    const stepY = rayY < 0 ? -1 : 1;
    let sideX = (rayX < 0 ? px - mapX : mapX + 1 - px) * deltaX;
    let sideY = (rayY < 0 ? py - mapY : mapY + 1 - py) * deltaY;
    let side = 0;
    for (let guard = 0; guard < 256; guard++) {
      if (sideX < sideY) {
        sideX += deltaX;
        mapX += stepX;
        side = 0;
      } else {
        sideY += deltaY;
        mapY += stepY;
        side = 1;
      }
      if (isWall(maze, mapX, mapY)) break;
    }
    const distance = Math.max(1e-4, side === 0 ? sideX - deltaX : sideY - deltaY);
    depth[x] = distance;
    const hit = side === 0 ? py + distance * rayY : px + distance * rayX;
    let tx = Math.floor((hit - Math.floor(hit)) * TEXTURE);
    if ((side === 0 && rayX < 0) || (side === 1 && rayY > 0)) tx = TEXTURE - 1 - tx;
    const lineHeight = height / distance;
    const top = horizon - lineHeight / 2;
    const start = Math.max(0, Math.ceil(top));
    const end = Math.min(height, Math.ceil(horizon + lineHeight / 2));
    // Walls facing north and south read a little darker, the way a fixed light rakes across a corridor.
    const light = (lightAt(distance) * (side === 1 ? 200 : 256)) >> 8;
    const texStep = TEXTURE / lineHeight;
    for (let y = start; y < end; y++) {
      const ty = Math.floor((y - top) * texStep) & (TEXTURE - 1);
      pixels[y * width + x] = shade(wall[ty * TEXTURE + tx]!, light);
    }
  }
}

/* Sprites: the start sign, the gray polyhedra, and the smiley at the exit, redrawn each frame and billboarded. */

const SPRITE = 64;

const ICOSAHEDRON = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const vertices = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(([x, y, z]) => {
    const length = Math.hypot(x!, y!, z!);
    return [x! / length, y! / length, z! / length] as const;
  });
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ] as const;
  return { vertices, faces };
})();

function paintPolyhedron(ctx: CanvasRenderingContext2D, time: number) {
  const a = time * 1.3;
  const b = time * 0.8;
  const points = ICOSAHEDRON.vertices.map(([x, y, z]) => {
    const x1 = x * Math.cos(a) + z * Math.sin(a);
    const z1 = -x * Math.sin(a) + z * Math.cos(a);
    const y2 = y * Math.cos(b) - z1 * Math.sin(b);
    const z2 = y * Math.sin(b) + z1 * Math.cos(b);
    return [x1, y2, z2] as const;
  });
  const faces = ICOSAHEDRON.faces
    .map((face) => {
      const [p, q, r] = face.map((index) => points[index]!) as [typeof points[0], typeof points[0], typeof points[0]];
      const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2];
      const vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const length = Math.hypot(nx, ny, nz) || 1;
      return { face, z: (p[2] + q[2] + r[2]) / 3, nz: nz / length, light: (nx * -0.4 + ny * -0.5 + nz * 0.77) / length };
    })
    .filter((face) => face.nz > 0)
    .sort((left, right) => left.z - right.z);
  const radius = SPRITE * 0.46;
  ctx.lineJoin = "round";
  for (const { face, light } of faces) {
    const value = clamp(96 + Math.max(0, light) * 150);
    ctx.fillStyle = `rgb(${value} ${value} ${value + 6})`;
    ctx.strokeStyle = `rgb(${value - 40} ${value - 40} ${value - 34})`;
    ctx.beginPath();
    face.forEach((index, i) => {
      const [x, y] = points[index]!;
      if (i === 0) ctx.moveTo(SPRITE / 2 + x * radius, SPRITE / 2 + y * radius);
      else ctx.lineTo(SPRITE / 2 + x * radius, SPRITE / 2 + y * radius);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Draws `paint` on a 64 px card that turns about its vertical axis; both faces read the right way round. */
function paintTurning(ctx: CanvasRenderingContext2D, time: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  ctx.save();
  ctx.translate(SPRITE / 2, 0);
  ctx.scale(Math.max(0.04, Math.abs(Math.cos(time * 1.6))), 1);
  ctx.translate(-SPRITE / 2, 0);
  paint(ctx);
  ctx.restore();
}

let bbMark: Path2D | null = null;

function paintSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#1c3fa8";
  ctx.strokeStyle = "#e6ecff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(4, 14, 56, 36, 5);
  ctx.fill();
  ctx.stroke();
  bbMark ??= new Path2D(BB_MARK);
  ctx.save();
  ctx.translate(14, 19);
  ctx.scale(36 / 491, 36 / 491);
  ctx.fillStyle = "#fff";
  ctx.fill(bbMark);
  ctx.restore();
}

function paintSmiley(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ffd21f";
  ctx.strokeStyle = "#5a3c00";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2b1c00";
  ctx.beginPath();
  ctx.ellipse(23, 25, 3.5, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(41, 25, 3.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(32, 33, 15, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

type SpriteKind = "sign" | "polyhedron" | "smiley";

/** World height of each sprite, as a fraction of a wall. */
const SPRITE_SIZE: Record<SpriteKind, number> = { sign: 0.62, polyhedron: 0.42, smiley: 0.5 };

function drawSprites(ctx: CanvasRenderingContext2D, card: HTMLCanvasElement, depth: Float32Array, width: number, height: number, run: MazeRun, time: number) {
  const cardContext = card.getContext("2d");
  if (!cardContext) return;
  const { x: px, y: py, angle } = run.pose;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const planeX = -dirY * FOV;
  const planeY = dirX * FOV;
  const inverse = 1 / (planeX * dirY - dirX * planeY);
  const sprites: { kind: SpriteKind; x: number; y: number }[] = [
    { kind: "sign", ...run.sign },
    { kind: "smiley", ...cellCenter(run.maze.exit) },
    ...run.spinners.map((cell) => ({ kind: "polyhedron" as const, ...cellCenter(cell) })),
  ];
  const placed = sprites
    .map((sprite) => {
      const dx = sprite.x - px;
      const dy = sprite.y - py;
      return { ...sprite, side: inverse * (dirY * dx - dirX * dy), forward: inverse * (-planeY * dx + planeX * dy) };
    })
    .filter((sprite) => sprite.forward > 0.15)
    .sort((left, right) => right.forward - left.forward);
  for (const sprite of placed) {
    cardContext.clearRect(0, 0, SPRITE, SPRITE);
    if (sprite.kind === "polyhedron") paintPolyhedron(cardContext, time);
    else paintTurning(cardContext, time, sprite.kind === "sign" ? paintSign : paintSmiley);
    const size = (height / sprite.forward) * SPRITE_SIZE[sprite.kind];
    const centerX = (width / 2) * (1 + sprite.side / sprite.forward);
    // The sign and the smiley hang at eye level; the polyhedra bob gently.
    const bob = sprite.kind === "polyhedron" ? Math.sin(time * 2 + sprite.x) * 0.06 * (height / sprite.forward) : 0;
    const top = height / 2 - size / 2 + bob;
    const left = Math.floor(centerX - size / 2);
    const right = Math.min(width, Math.ceil(centerX + size / 2));
    for (let x = Math.max(0, left); x < right; x++) {
      if (sprite.forward >= depth[x]!) continue;
      const source = Math.floor(((x - (centerX - size / 2)) / size) * SPRITE);
      ctx.drawImage(card, Math.max(0, Math.min(SPRITE - 1, source)), 0, 1, SPRITE, x, top, 1, size);
    }
  }
}

/* The overhead map: the parts of the maze the walker has seen, drawn over the view's top-left corner. */

function drawMap(ctx: CanvasRenderingContext2D, run: MazeRun, scale: number) {
  const { maze } = run;
  const tile = Math.max(2, Math.floor(5 * scale));
  const pad = Math.round(8 * scale);
  // A tile is seen once the walker has stood in a cell beside it: cell (cx, cy) sits on tile (2cx + 1, 2cy + 1).
  const near = (tile: number, cells: number) =>
    [Math.floor((tile - 1) / 2), Math.ceil((tile - 1) / 2)].filter((cell) => cell >= 0 && cell < cells);
  const seen = (x: number, y: number) =>
    near(y, maze.rows).some((cy) => near(x, maze.columns).some((cx) => run.visited[cy * maze.columns + cx] === 1));
  ctx.save();
  ctx.globalAlpha = 0.85;
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!seen(x, y)) continue;
      ctx.fillStyle = isWall(maze, x, y) ? "#e8e8e8" : "#1a1a1a";
      ctx.fillRect(pad + x * tile, pad + y * tile, tile, tile);
    }
  }
  ctx.globalAlpha = 1;
  const { x, y, angle } = run.pose;
  ctx.translate(pad + x * tile, pad + y * tile);
  ctx.rotate(angle);
  ctx.fillStyle = "#ff3b2f";
  ctx.beginPath();
  ctx.moveTo(tile * 0.9, 0);
  ctx.lineTo(-tile * 0.6, tile * 0.6);
  ctx.lineTo(-tile * 0.6, -tile * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function MazeScreenSaver({ active = true }: { active?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<{ canvas: HTMLCanvasElement; image: ImageData; depth: Float32Array; card: HTMLCanvasElement } | null>(null);
  const [initial] = useState(freshRun);
  const runRef = useRef<MazeRun>(initial);
  const [options, setOptions] = useState<Options>(loadOptions);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");
  const running = active && visible && !paused;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const view = viewRef.current;
    const ctx = canvas?.getContext("2d");
    const viewContext = view?.canvas.getContext("2d");
    if (!canvas || !view || !ctx || !viewContext) return;
    const run = runRef.current;
    const { width, height } = view.image;
    const time = performance.now() / 1000;
    castScene(new Uint32Array(view.image.data.buffer), view.depth, width, height, run);
    viewContext.putImageData(view.image, 0, 0);
    drawSprites(viewContext, view.card, view.depth, width, height, run, time);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(run.pose.roll);
    ctx.drawImage(view.canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (optionsRef.current.overheadMap) drawMap(ctx, run, canvas.width / Math.max(1, canvas.clientWidth));
  }, []);

  const newMaze = useCallback(() => {
    runRef.current = freshRun();
    render();
  }, [render]);

  const updateOptions = (patch: Partial<Options>) => {
    const next = { ...optionsRef.current, ...patch };
    optionsRef.current = next;
    setOptions(next);
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(next));
    render();
  };

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const apply = () => {
      const cssWidth = stage.clientWidth;
      const cssHeight = stage.clientHeight;
      if (cssWidth === 0 || cssHeight === 0) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(cssWidth * ratio));
      canvas.height = Math.max(1, Math.round(cssHeight * ratio));
      const fit = Math.min(1, Math.sqrt(MAX_VIEW_PIXELS / (canvas.width * canvas.height)));
      const width = Math.max(1, Math.round(canvas.width * fit));
      const height = Math.max(1, Math.round(canvas.height * fit));
      const view = viewRef.current;
      if (!view || view.image.width !== width || view.image.height !== height) {
        const viewCanvas = view?.canvas ?? document.createElement("canvas");
        viewCanvas.width = width;
        viewCanvas.height = height;
        const card = view?.card ?? document.createElement("canvas");
        card.width = SPRITE;
        card.height = SPRITE;
        viewRef.current = { canvas: viewCanvas, image: new ImageData(width, height), depth: new Float32Array(width), card };
      }
      render();
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [render]);

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!windowOwnsKeys(rootRef.current) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "F2") {
        event.preventDefault();
        newMaze();
      } else if (event.key === "F3") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [newMaze]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const seconds = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - last) / 1000));
      last = now;
      advance(runRef.current, seconds, optionsRef.current.turbo ? TURBO_SPEED : 1);
      if (runRef.current.finished) runRef.current = freshRun();
      render();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, render]);

  return (
    <div ref={rootRef} className="bbd-program bbd-maze">
      <ProgramMenuBar
        menus={[
          {
            label: "Maze",
            items: [
              { label: "New Maze", shortcut: "F2", action: newMaze },
              { label: paused ? "Resume" : "Pause", shortcut: "F3", action: () => setPaused(!paused) },
            ],
          },
          {
            label: "Options",
            items: [
              { label: "Overhead Map", checked: options.overheadMap, action: () => updateOptions({ overheadMap: !options.overheadMap }) },
              { label: "Turbo Mode", checked: options.turbo, action: () => updateOptions({ turbo: !options.turbo }) },
            ],
          },
        ]}
      />
      <div ref={stageRef} className="bbd-maze-stage" onDoubleClick={() => setPaused(!paused)}>
        <canvas ref={canvasRef} className="bbd-maze-canvas" role="img" aria-label="3D Maze: a walk through a brick maze" />
        {paused ? <span className="bbd-maze-paused">Paused · F3 to resume</span> : null}
      </div>
    </div>
  );
}
