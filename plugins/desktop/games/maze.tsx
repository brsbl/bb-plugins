import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ProgramMenuBar } from "../apps/xp-chrome";
import { windowOwnsKeys } from "../windows";
import { advance, canStep, cellCenter, newRun, ratPosition, seededRandom, type MazeRun } from "./maze-core";

const OPTIONS_KEY = "bb-desktop:maze:options:v1";
const MAX_FRAME_SECONDS = 0.1;
/** The view renders at most this many pixels and is scaled up to the window, like the screen saver's low-res mode. */
const MAX_VIEW_PIXELS = 640 * 400;
/** Half the horizontal field of view, as the camera plane's length relative to the view direction. */
const FOV = 1;
const TEXTURE = 128;
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

/** Four large courses, broad white mortar and dark red, softly bevelled brick. */
function brick(): Uint32Array {
  return texture((x, y) => {
    const row = Math.floor(y / 32);
    const bx = (x + (row % 2) * 32) % 64;
    const by = y % 32;
    const edge = Math.min(bx, 63 - bx, by, 31 - by);
    const noise = hash(x, y, 1);
    if (edge < 1) {
      const value = 222 + noise * 33;
      return [value, value, value];
    }
    if (edge < 2) return [181 + noise * 30, 174 + noise * 30, 170 + noise * 30];
    const coarse = hash(x >> 2, y >> 2, 2) * 28;
    const tone = hash(Math.floor((x + (row % 2) * 32) / 64), row, 3) * 12;
    const bevel = edge < 4 ? -28 : 0;
    return [108 + coarse + tone + noise * 18 + bevel, 4 + noise * 12, 3 + noise * 9];
  });
}

/** Continuous golden wood grain, without the plank joints of a modern timber floor. */
function wood(): Uint32Array {
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const a = hash(ix & 15, iy & 15, 4), b = hash((ix + 1) & 15, iy & 15, 4);
    const c = hash(ix & 15, (iy + 1) & 15, 4), d = hash((ix + 1) & 15, (iy + 1) & 15, 4);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };
  return texture((x, y) => {
    const warp = noise(x / 8, y / 8) * 12 + noise(x / 4, y / 16) * 5;
    const grain = Math.sin(x * Math.PI / 2 + warp) * 9 + Math.sin(x * Math.PI + warp * 2) * 4;
    const speck = hash(x, y, 6) * 12;
    return [179 + grain + speck, 125 + grain + speck, 35 + grain * 0.6 + speck];
  });
}

/** Square acoustic ceiling tiles: raised white grid, gray seams and coarse white stipple. */
function stucco(): Uint32Array {
  return texture((x, y) => {
    const tx = x % 32, ty = y % 32;
    if (tx < 2 || ty < 2) return [250, 250, 250];
    if (tx < 4 || ty < 4) return [155, 155, 160];
    const coarse = hash(x >> 1, y >> 1, 7);
    const value = coarse < 0.35 ? 154 + coarse * 120 : 224 + hash(x, y, 8) * 31;
    return [value, value, Math.min(255, value + 2)];
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

/* Thin cell-boundary walls, like the original OpenGL planes, rather than solid tile blocks. */
function castScene(pixels: Uint32Array, depth: Float32Array, width: number, height: number, focal: number, run: MazeRun) {
  const { wall, floor, ceiling } = loadTextures();
  const { maze } = run;
  const px = (run.pose.x - 0.5) / 2, py = (run.pose.y - 0.5) / 2;
  const dirX = Math.cos(run.pose.angle), dirY = Math.sin(run.pose.angle);
  const planeX = -dirY * width / (2 * focal), planeY = dirX * width / (2 * focal);
  const horizon = height / 2;
  pixels.fill(floor[0]!);
  for (let y = Math.floor(horizon) + 1; y < height; y++) {
    const distance = focal * 0.5 / (y - horizon);
    const stepX = distance * 2 * planeX / width, stepY = distance * 2 * planeY / width;
    let fx = px + distance * (dirX - planeX), fy = py + distance * (dirY - planeY);
    for (let x = 0; x < width; x++) {
      const tx = Math.floor(fx * TEXTURE) & (TEXTURE - 1);
      const ty = Math.floor(fy * TEXTURE) & (TEXTURE - 1);
      pixels[y * width + x] = floor[ty * TEXTURE + tx]!;
      pixels[(height - 1 - y) * width + x] = ceiling[ty * TEXTURE + tx]!;
      fx += stepX; fy += stepY;
    }
  }
  for (let x = 0; x < width; x++) {
    const camera = 2 * x / width - 1;
    const rayX = dirX + planeX * camera, rayY = dirY + planeY * camera;
    let mapX = Math.floor(px), mapY = Math.floor(py);
    const deltaX = rayX === 0 ? 1e30 : Math.abs(1 / rayX);
    const deltaY = rayY === 0 ? 1e30 : Math.abs(1 / rayY);
    const stepX = rayX < 0 ? -1 : 1, stepY = rayY < 0 ? -1 : 1;
    let sideX = (rayX < 0 ? px - mapX : mapX + 1 - px) * deltaX;
    let sideY = (rayY < 0 ? py - mapY : mapY + 1 - py) * deltaY;
    let side = 0, distance = 1;
    for (let guard = 0; guard < maze.columns + maze.rows + 2; guard++) {
      side = sideX < sideY ? 0 : 1;
      distance = side === 0 ? sideX : sideY;
      const dir = side === 0 ? (stepX > 0 ? 0 : 2) : (stepY > 0 ? 1 : 3);
      if (!canStep(maze, { x: mapX, y: mapY }, dir)) break;
      if (side === 0) { sideX += deltaX; mapX += stepX; }
      else { sideY += deltaY; mapY += stepY; }
    }
    distance = Math.max(1e-4, distance);
    depth[x] = distance;
    const hit = side === 0 ? py + distance * rayY : px + distance * rayX;
    let tx = Math.floor((hit - Math.floor(hit)) * TEXTURE);
    if ((side === 0 && rayX < 0) || (side === 1 && rayY > 0)) tx = TEXTURE - 1 - tx;
    const lineHeight = focal / distance, top = horizon - lineHeight / 2;
    const start = Math.max(0, Math.ceil(top)), end = Math.min(height, Math.ceil(horizon + lineHeight / 2));
    for (let y = start; y < end; y++) {
      const ty = Math.floor((y - top) * TEXTURE / lineHeight) & (TEXTURE - 1);
      pixels[y * width + x] = wall[ty * TEXTURE + tx]!;
    }
  }
}

/* Source-drawn sprites, projected and clipped against the wall depth buffer. */

const SPRITE = 64;
/** Sprites are painted in that 64-unit box onto a card at twice the resolution, so close-ups stay sharp. */
const CARD = SPRITE * 2;

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

// Dual of the icosahedron: twelve pentagonal faces, matching the chunky original rock.
const DODECAHEDRON = (() => {
  const vertices = ICOSAHEDRON.faces.map((face) => {
    const point = [0, 0, 0];
    for (const index of face) for (let axis = 0; axis < 3; axis++) point[axis]! += ICOSAHEDRON.vertices[index]![axis]!;
    const length = Math.hypot(...point);
    return point.map((value) => value / length);
  });
  const faces = ICOSAHEDRON.vertices.map((normal, index) => {
    const adjacent = ICOSAHEDRON.faces.flatMap((face, i) => (face as readonly number[]).includes(index) ? [i] : []);
    const u = vertices[adjacent[0]!]!;
    const v = [normal[1] * u[2]! - normal[2] * u[1]!, normal[2] * u[0]! - normal[0] * u[2]!, normal[0] * u[1]! - normal[1] * u[0]!];
    const angle = (i: number) => Math.atan2(vertices[i]!.reduce((n, c, a) => n + c * v[a]!, 0), vertices[i]!.reduce((n, c, a) => n + c * u[a]!, 0));
    return adjacent.sort((a, b) => angle(a) - angle(b));
  });
  return { vertices, faces };
})();

function paintPolyhedron(ctx: CanvasRenderingContext2D, time: number) {
  const a = time * 1.3;
  const b = time * 0.8;
  const points = DODECAHEDRON.vertices.map(([x, y, z]) => {
    const x1 = x! * Math.cos(a) + z! * Math.sin(a);
    const z1 = -x! * Math.sin(a) + z! * Math.cos(a);
    const y2 = y! * Math.cos(b) - z1 * Math.sin(b);
    const z2 = y! * Math.sin(b) + z1 * Math.cos(b);
    return [x1, y2, z2] as const;
  });
  const faces = DODECAHEDRON.faces
    .map((face) => {
      const p = points[face[0]!]!, q = points[face[1]!]!, r = points[face[2]!]!;
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
    const value = clamp(8 + Math.max(0, light) * 170);
    ctx.fillStyle = `rgb(${value} ${value} ${value})`;
    ctx.beginPath();
    face.forEach((index, i) => {
      const [x, y] = points[index]!;
      if (i === 0) ctx.moveTo(SPRITE / 2 + x * radius, SPRITE / 2 + y * radius);
      else ctx.lineTo(SPRITE / 2 + x * radius, SPRITE / 2 + y * radius);
    });
    ctx.closePath();
    ctx.fill();
  }
}

/** The four waving panes of bb's taskbar flag (`StartFlag`), in its 18 px box. */
const FLAG_PANES = [
  ["M2 3.2 Q4.8 2 8.2 3.4 L7.4 8.2 Q4.2 7 1.4 8 Z", "oklch(0.66 0.21 30)"],
  ["M9.4 3.8 Q12.6 5 16 3.6 L15.2 8.4 Q12 9.6 8.6 8.6 Z", "oklch(0.74 0.19 140)"],
  ["M1.2 9.2 Q4 8.2 7.2 9.4 L6.4 14.2 Q3.4 13 0.4 14 Z", "oklch(0.62 0.18 250)"],
  ["M8.4 9.8 Q11.6 11 15 9.6 L14.2 14.4 Q11 15.6 7.6 14.6 Z", "oklch(0.86 0.16 90)"],
] as const;
let flagPanes: [Path2D, string][] | null = null;

/**
 * The start sign: the screen saver's Start button slab, with bb's flag and "bb" where it said Start. A raised khaki
 * button with a dark outline, a bevel and a dark underside, a little see-through, turning about its vertical axis
 * with its edge showing.
 */
function paintStartButton(ctx: CanvasRenderingContext2D, time: number) {
  const angle = time * 1.6;
  const face = Math.cos(angle);
  const turnsLeft = Math.sin(angle) * face > 0;
  const width = Math.max(1, 60 * Math.abs(face));
  const edge = 5 * Math.abs(Math.sin(angle));
  const height = 18;
  const top = 32 - height / 2;
  const left = 32 - (width + edge) / 2 + (turnsLeft ? edge : 0);
  ctx.save();
  ctx.globalAlpha = 0.68;
  ctx.fillStyle = "#6a5220";
  ctx.fillRect(turnsLeft ? left - edge : left + width, top, edge, height + 2);
  ctx.fillStyle = "#4a3410";
  ctx.fillRect(left - 0.75, top - 0.75, width + 1.5, height + 3.5);
  ctx.fillStyle = "#dccb93";
  ctx.fillRect(left, top, width, height);
  ctx.fillStyle = "#a08850";
  ctx.fillRect(left, top + height - 2, width, 2);
  ctx.fillStyle = "#f7efcc";
  ctx.fillRect(left, top, width, 1.2);
  ctx.fillRect(left, top, 1.2, height - 2);
  ctx.fillStyle = "#7a6434";
  ctx.fillRect(left + width - 1.2, top, 1.2, height);
  ctx.fillStyle = "#5e4818";
  ctx.fillRect(left, top + height, width, 2);
  // The label squashes with the face as it turns and always reads the right way round.
  ctx.translate(left + width / 2, 32);
  ctx.scale(width / 60, 1);
  flagPanes ??= FLAG_PANES.map(([d, colour]) => [new Path2D(d), colour]);
  ctx.fillStyle = "#6a5428";
  for (const [x, y] of [[-26, -4], [-26, 0], [-26, 3], [-24, -2], [-24, 1.5]]) ctx.fillRect(x!, y!, 1.2, 1);
  ctx.save();
  ctx.translate(-23, -6.5);
  ctx.scale(12 / 18, 12 / 18);
  ctx.strokeStyle = "#3a2808";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  for (const [pane, colour] of flagPanes) {
    ctx.fillStyle = colour;
    ctx.fill(pane);
    ctx.stroke(pane);
  }
  ctx.restore();
  ctx.fillStyle = "#3d2a08";
  ctx.font = "bold 11px Tahoma, Verdana, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("bb", -6, 0.5);
  ctx.restore();
}

function paintSmiley(ctx: CanvasRenderingContext2D) {
  const gold = ctx.createRadialGradient(24, 18, 2, 32, 32, 30);
  gold.addColorStop(0, "rgba(255,255,60,0.6)");
  gold.addColorStop(0.75, "rgba(255,230,0,0.68)");
  gold.addColorStop(1, "rgba(190,162,0,0.75)");
  ctx.fillStyle = gold;
  ctx.beginPath(); ctx.ellipse(32, 32, 29, 22, 0, 0, Math.PI * 2); ctx.fill();
  const blue = ctx.createLinearGradient(0, 21, 0, 47);
  blue.addColorStop(0, "#5757ff"); blue.addColorStop(0.45, "#190b92"); blue.addColorStop(0.75, "#4b30e9"); blue.addColorStop(1, "#16045b");
  ctx.fillStyle = blue;
  for (const x of [20, 44]) { ctx.beginPath(); ctx.ellipse(x, 26, 3.8, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = blue; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(14, 37); ctx.quadraticCurveTo(32, 48, 50, 37); ctx.stroke();
}

/** An original brown fur sprite, kept deliberately low and side-on like the saver rat. */
function paintRat(ctx: CanvasRenderingContext2D, time: number) {
  const gait = Math.sin(time * 18) * 1.5;
  ctx.strokeStyle = "#967a65"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(21, 43); ctx.bezierCurveTo(2, 46, 1, 35, 8, 36); ctx.stroke();
  ctx.fillStyle = "#8d7360";
  for (const x of [25, 43]) { ctx.beginPath(); ctx.ellipse(x + gait, 46, 5, 1.5, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.save(); ctx.beginPath();
  ctx.ellipse(32, 39, 19, 7, -0.12, 0, Math.PI * 2);
  ctx.moveTo(40, 35); ctx.lineTo(61, 42); ctx.lineTo(43, 45); ctx.closePath();
  ctx.clip(); ctx.fillStyle = "#615143"; ctx.fillRect(0, 20, 64, 28);
  for (let i = 0; i < 650; i++) {
    const x = hash(i, 1, 10) * 64, y = 23 + hash(i, 2, 10) * 25;
    const tone = 55 + hash(i, 3, 10) * 90;
    ctx.strokeStyle = `rgb(${tone + 15} ${tone} ${tone - 16})`; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 1); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = "#8d7666"; ctx.beginPath(); ctx.ellipse(47, 36, 2.5, 3, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#16100e"; ctx.fillRect(54, 40, 2, 1); ctx.fillRect(60, 42, 2, 1);
}

type SpriteKind = "sign" | "polyhedron" | "smiley" | "rat";

/** World height of each sprite, as a fraction of a wall. */
const SPRITE_SIZE: Record<SpriteKind, number> = { sign: 0.62, polyhedron: 0.45, smiley: 0.55, rat: 0.6 };

function drawSprites(ctx: CanvasRenderingContext2D, card: HTMLCanvasElement, depth: Float32Array, width: number, height: number, focal: number, run: MazeRun, time: number) {
  const cardContext = card.getContext("2d");
  if (!cardContext) return;
  const px = (run.pose.x - 0.5) / 2, py = (run.pose.y - 0.5) / 2;
  const { angle } = run.pose;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const planeX = -dirY * width / (2 * focal);
  const planeY = dirX * width / (2 * focal);
  const inverse = 1 / (planeX * dirY - dirX * planeY);
  const sprites: { kind: SpriteKind; x: number; y: number }[] = [
    { kind: "sign", ...run.sign },
    { kind: "rat", ...ratPosition(run) },
    { kind: "smiley", ...cellCenter(run.maze.exit) },
    ...run.spinners.map((cell) => ({ kind: "polyhedron" as const, ...cellCenter(cell) })),
  ];
  const placed = sprites
    .map((sprite) => {
      const dx = (sprite.x - 0.5) / 2 - px;
      const dy = (sprite.y - 0.5) / 2 - py;
      return { ...sprite, side: inverse * (dirY * dx - dirX * dy), forward: inverse * (-planeY * dx + planeX * dy) };
    })
    .filter((sprite) => sprite.forward > 0.15)
    .sort((left, right) => right.forward - left.forward);
  for (const sprite of placed) {
    cardContext.setTransform(1, 0, 0, 1, 0, 0);
    cardContext.clearRect(0, 0, CARD, CARD);
    cardContext.setTransform(CARD / SPRITE, 0, 0, CARD / SPRITE, 0, 0);
    if (sprite.kind === "polyhedron") paintPolyhedron(cardContext, time);
    else if (sprite.kind === "rat") paintRat(cardContext, time);
    else if (sprite.kind === "smiley") paintSmiley(cardContext);
    else paintStartButton(cardContext, time);
    const size = (focal / sprite.forward) * SPRITE_SIZE[sprite.kind];
    const centerX = (width / 2) * (1 + sprite.side / sprite.forward);
    // The rat's feet meet the floor; the rock hangs below eye level.
    const bob = sprite.kind === "rat" ? focal / sprite.forward * (0.5 - SPRITE_SIZE.rat * 0.25) : sprite.kind === "polyhedron" ? focal / sprite.forward * 0.18 : 0;
    const top = height / 2 - size / 2 + bob;
    const left = Math.floor(centerX - size / 2);
    const right = Math.min(width, Math.ceil(centerX + size / 2));
    for (let x = Math.max(0, left); x < right; x++) {
      if (sprite.forward >= depth[x]!) continue;
      const source = Math.floor(((x - (centerX - size / 2)) / size) * CARD);
      ctx.drawImage(card, Math.max(0, Math.min(CARD - 1, source)), 0, 1, CARD, x, top, 1, size);
    }
  }
}

/* An unfilled, rotating line map with a blue viewer and the original marker colours. */
function drawMap(ctx: CanvasRenderingContext2D, run: MazeRun, scale: number, time: number) {
  const { maze } = run;
  const size = 128 * scale, unit = 10 * scale, pad = 8 * scale;
  ctx.save();
  ctx.beginPath(); ctx.rect(pad, pad, size, size); ctx.clip();
  ctx.translate(pad + size / 2, pad + size / 2);
  ctx.rotate(-run.pose.angle - Math.PI / 2);
  ctx.translate(-(run.pose.x - 0.5) / 2 * unit, -(run.pose.y - 0.5) / 2 * unit);
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = scale;
  ctx.beginPath();
  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.columns; x++) {
      if (!run.visited[y * maze.columns + x]) continue;
      for (let dir = 0; dir < 4; dir++) {
        if (canStep(maze, { x, y }, dir)) continue;
        const edges = [[x + 1, y, x + 1, y + 1], [x, y + 1, x + 1, y + 1], [x, y, x, y + 1], [x, y, x + 1, y]][dir]!;
        ctx.moveTo(edges[0]! * unit, edges[1]! * unit); ctx.lineTo(edges[2]! * unit, edges[3]! * unit);
      }
    }
  }
  ctx.stroke();
  const marker = (x: number, y: number, colour: string, angle: number) => {
    ctx.save(); ctx.translate((x - 0.5) / 2 * unit, (y - 0.5) / 2 * unit); ctx.rotate(angle);
    ctx.fillStyle = colour; ctx.beginPath(); ctx.moveTo(unit * 0.35, 0); ctx.lineTo(-unit * 0.25, unit * 0.25); ctx.lineTo(-unit * 0.25, -unit * 0.25); ctx.closePath(); ctx.fill(); ctx.restore();
  };
  const start = cellCenter(maze.start), exit = cellCenter(maze.exit), rat = ratPosition(run);
  marker(start.x, start.y, "#ff0000", 0);
  if (run.visited[maze.exit.y * maze.columns + maze.exit.x]) marker(exit.x, exit.y, "#00ff00", 0);
  for (const cell of run.spinners) if (run.visited[cell.y * maze.columns + cell.x]) {
    const p = cellCenter(cell); marker(p.x, p.y, "#ffffff", time);
  }
  if (run.visited[run.rat.cell.y * maze.columns + run.rat.cell.x]) marker(rat.x, rat.y, "#ff8000", run.rat.heading * Math.PI / 2);
  marker(run.pose.x, run.pose.y, "#0000ff", run.pose.angle);
  ctx.restore();
}

export function MazeScreenSaver({ active = true }: { active?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
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
    // Render beyond every viewport edge during a roll. Rotating a viewport-sized image exposes black corners.
    const rolling = Math.abs(Math.sin(run.pose.roll)) > 0.001;
    const fit = Math.min(1, Math.sqrt(MAX_VIEW_PIXELS / (canvas.width * canvas.height)));
    const baseWidth = Math.max(1, Math.round(canvas.width * fit));
    const baseHeight = Math.max(1, Math.round(canvas.height * fit));
    const diagonal = Math.ceil(Math.hypot(baseWidth, baseHeight));
    const width = rolling ? diagonal : baseWidth, height = rolling ? diagonal : baseHeight;
    if (view.image.width !== width || view.image.height !== height) {
      view.canvas.width = width; view.canvas.height = height;
      view.image = new ImageData(width, height); view.depth = new Float32Array(width);
    }
    const time = elapsedRef.current;
    const focal = baseWidth / (2 * FOV);
    castScene(new Uint32Array(view.image.data.buffer), view.depth, width, height, focal, run);
    viewContext.putImageData(view.image, 0, 0);
    drawSprites(viewContext, view.card, view.depth, width, height, focal, run, time);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(run.pose.roll);
    const drawWidth = width / baseWidth * canvas.width, drawHeight = height / baseHeight * canvas.height;
    ctx.drawImage(view.canvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (optionsRef.current.overheadMap) drawMap(ctx, run, canvas.width / Math.max(1, canvas.clientWidth), time);
  }, []);

  const newMaze = useCallback(() => {
    runRef.current = freshRun();
    elapsedRef.current = 0;
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
        card.width = CARD;
        card.height = CARD;
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
      elapsedRef.current += seconds * (optionsRef.current.turbo ? TURBO_SPEED : 1);
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
