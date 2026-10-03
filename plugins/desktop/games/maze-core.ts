/**
 * The 3D Maze screen saver's world: a perfect maze on a tile grid and a walker that follows the right-hand wall to
 * the exit. Rendering lives in `maze.tsx`; everything here is pure so it can be tested without a canvas.
 *
 * Cells sit on odd tiles: cell (x, y) is tile (2x + 1, 2y + 1), and the tiles between neighbouring cells are open
 * when there is a passage. Angles follow the canvas, so +y is south and a heading of π/2 faces south.
 */

export const MAZE_COLUMNS = 10;
export const MAZE_ROWS = 8;
const SPINNER_COUNT = 3;

/** Seconds to walk one cell, turn a quarter, roll over, and celebrate at the exit, before Turbo Mode. */
const WALK_SECONDS = 0.65;
const TURN_SECONDS = 0.4;
const FLIP_SECONDS = 0.55;
const EXIT_SECONDS = 1.6;
/** How far into the exit cell the walker goes, so it stops facing the smiley rather than inside it. */
const EXIT_REACH = 0.2;
const FLIP_REACH = 0.35;

/** East, south, west, north. */
const DX = [1, 0, -1, 0] as const;
const DY = [0, 1, 0, -1] as const;

export interface Cell {
  x: number;
  y: number;
}

export interface Maze {
  columns: number;
  rows: number;
  /** Tile grid width and height: `2 * columns + 1` by `2 * rows + 1`. */
  width: number;
  height: number;
  /** 1 for wall, 0 for open, row-major. */
  tiles: Uint8Array;
  start: Cell;
  exit: Cell;
}

export type Random = () => number;

/** A small seeded generator, so a maze can be reproduced from its seed. */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function isWall(maze: Maze, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= maze.width || y >= maze.height) return true;
  return maze.tiles[y * maze.width + x] === 1;
}

/** Whether the walker can step from `cell` one cell in direction `dir`. */
export function canStep(maze: Maze, cell: Cell, dir: number): boolean {
  const d = ((dir % 4) + 4) % 4;
  return !isWall(maze, 2 * cell.x + 1 + DX[d]!, 2 * cell.y + 1 + DY[d]!);
}

/** Carves a perfect maze (exactly one path between any two cells) with an iterative depth-first search. */
export function generateMaze(columns: number, rows: number, random: Random): Maze {
  const width = 2 * columns + 1;
  const height = 2 * rows + 1;
  const tiles = new Uint8Array(width * height).fill(1);
  const seen = new Uint8Array(columns * rows);
  const open = (x: number, y: number) => {
    tiles[y * width + x] = 0;
  };
  const stack: Cell[] = [{ x: 0, y: 0 }];
  seen[0] = 1;
  open(1, 1);
  while (stack.length > 0) {
    const cell = stack[stack.length - 1]!;
    const choices = [0, 1, 2, 3].filter((dir) => {
      const x = cell.x + DX[dir]!;
      const y = cell.y + DY[dir]!;
      return x >= 0 && y >= 0 && x < columns && y < rows && seen[y * columns + x] === 0;
    });
    if (choices.length === 0) {
      stack.pop();
      continue;
    }
    const dir = choices[Math.floor(random() * choices.length)]!;
    const next = { x: cell.x + DX[dir]!, y: cell.y + DY[dir]! };
    seen[next.y * columns + next.x] = 1;
    open(2 * cell.x + 1 + DX[dir]!, 2 * cell.y + 1 + DY[dir]!);
    open(2 * next.x + 1, 2 * next.y + 1);
    stack.push(next);
  }
  return { columns, rows, width, height, tiles, start: { x: 0, y: 0 }, exit: { x: columns - 1, y: rows - 1 } };
}

/** The centre of a cell in tile coordinates. */
export function cellCenter(cell: Cell): { x: number; y: number } {
  return { x: 2 * cell.x + 1.5, y: 2 * cell.y + 1.5 };
}

type Move =
  | { kind: "walk"; dir: number }
  | { kind: "turn"; from: number; to: number }
  | { kind: "flip"; dir: number }
  | { kind: "exit" };

export interface Pose {
  x: number;
  y: number;
  /** Heading in radians. */
  angle: number;
  /** Roll about the view axis in radians; π is upside down. */
  roll: number;
}

/** The rat walks independently; cell is the start of its current passage. */
export interface Rat {
  cell: Cell;
  heading: number;
  progress: number;
}

export interface MazeRun {
  maze: Maze;
  /** The cell the walker is in, or entering while it walks. */
  cell: Cell;
  /** Quarter turns from east, unbounded so turns interpolate the short way. */
  heading: number;
  upsideDown: boolean;
  /** Cells the walker has stood in, row-major, for the overhead map. */
  visited: Uint8Array;
  /** Where the start sign hangs, in tile coordinates: one cell ahead, so the run opens facing it. */
  sign: { x: number; y: number };
  /** Gray polyhedra still floating in the maze; walking into one rolls the view over. */
  spinners: Cell[];
  rat: Rat;
  pose: Pose;
  move: Move | null;
  /** Progress through `move`, from 0 to 1. */
  progress: number;
  /** Set once the exit celebration ends; the caller then starts a new maze. */
  finished: boolean;
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function newRun(random: Random, columns = MAZE_COLUMNS, rows = MAZE_ROWS): MazeRun {
  const maze = generateMaze(columns, rows, random);
  const spinners: Cell[] = [];
  for (let tries = 0; spinners.length < SPINNER_COUNT && tries < 200; tries++) {
    const cell = { x: Math.floor(random() * columns), y: Math.floor(random() * rows) };
    if (cell.x + cell.y < 2 || sameCell(cell, maze.exit) || spinners.some((other) => sameCell(other, cell))) continue;
    spinners.push(cell);
  }
  // Face the first open passage so the run opens on a corridor rather than a wall.
  const heading = [0, 1, 2, 3].find((dir) => canStep(maze, maze.start, dir)) ?? 0;
  const visited = new Uint8Array(columns * rows);
  visited[0] = 1;
  const center = cellCenter(maze.start);
  return {
    maze,
    cell: { ...maze.start },
    heading,
    upsideDown: false,
    visited,
    sign: { x: center.x + 2 * DX[heading]!, y: center.y + 2 * DY[heading]! },
    spinners,
    rat: { cell: { ...maze.exit }, heading: [0, 1, 2, 3].find((dir) => canStep(maze, maze.exit, dir)) ?? 0, progress: 0 },
    pose: { x: center.x, y: center.y, angle: (heading * Math.PI) / 2, roll: 0 },
    move: null,
    progress: 0,
    finished: false,
  };
}

/**
 * The right-hand rule: prefer right, then straight, then left, then back the way it came. A turn is always followed
 * by a walk (see `settle`), so the rule runs once per cell rather than again after each turn.
 */
function nextMove(run: MazeRun): Move {
  if (sameCell(run.cell, run.maze.exit)) return { kind: "exit" };
  for (const turn of [1, 0, -1, 2]) {
    if (!canStep(run.maze, run.cell, run.heading + turn)) continue;
    return turn === 0 ? { kind: "walk", dir: run.heading } : { kind: "turn", from: run.heading, to: run.heading + turn };
  }
  // A maze with a single cell has nowhere to go; spin in place.
  return { kind: "turn", from: run.heading, to: run.heading + 1 };
}

function duration(move: Move): number {
  switch (move.kind) {
    case "walk":
      return WALK_SECONDS;
    case "turn":
      return TURN_SECONDS * Math.abs(move.to - move.from);
    case "flip":
      return FLIP_SECONDS;
    case "exit":
      return EXIT_SECONDS;
  }
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function poseOf(run: MazeRun): Pose {
  const center = cellCenter(run.cell);
  const roll = run.upsideDown ? Math.PI : 0;
  const pose: Pose = { x: center.x, y: center.y, angle: (run.heading * Math.PI) / 2, roll };
  const move = run.move;
  if (move === null) return pose;
  const t = run.progress;
  switch (move.kind) {
    case "walk": {
      // `cell` already points at the destination, so walk in from the cell behind it.
      const d = ((move.dir % 4) + 4) % 4;
      const reach = sameCell(run.cell, run.maze.exit) ? EXIT_REACH : 1;
      pose.x -= 2 * DX[d]! * (1 - t * reach);
      pose.y -= 2 * DY[d]! * (1 - t * reach);
      return pose;
    }
    case "turn":
      pose.angle = ((move.from + (move.to - move.from) * ease(t)) * Math.PI) / 2;
      return pose;
    case "flip": {
      // Hold in front of the rock while rolling, then continue the interrupted walk.
      const d = ((move.dir % 4) + 4) % 4;
      pose.x -= 2 * DX[d]! * (1 - FLIP_REACH);
      pose.y -= 2 * DY[d]! * (1 - FLIP_REACH);
      pose.roll = roll + Math.PI * (1 - ease(t));
      return pose;
    }
    case "exit": {
      // Hold on the smiley for a beat before the caller builds a new maze.
      const d = ((run.heading % 4) + 4) % 4;
      pose.x -= 2 * DX[d]! * (1 - EXIT_REACH);
      pose.y -= 2 * DY[d]! * (1 - EXIT_REACH);
      return pose;
    }
  }
}

/** Starts the next move, applying its effect on the walker's cell, heading, and orientation up front. */
function begin(run: MazeRun, move: Move) {
  run.move = move;
  run.progress = 0;
  if (move.kind === "walk") {
    const d = ((move.dir % 4) + 4) % 4;
    run.cell = { x: run.cell.x + DX[d]!, y: run.cell.y + DY[d]! };
    run.visited[run.cell.y * run.maze.columns + run.cell.x] = 1;
  } else if (move.kind === "flip") {
    run.upsideDown = !run.upsideDown;
  }
}

/** Ends the current move and decides what follows from where the walker now stands. */
function settle(run: MazeRun, move: Move) {
  run.move = null;
  switch (move.kind) {
    case "exit":
      run.finished = true;
      return;
    case "turn":
      run.heading = move.to;
      if (canStep(run.maze, run.cell, run.heading)) {
        begin(run, { kind: "walk", dir: run.heading });
        return;
      }
      break;
    case "walk":
      break;
    case "flip":
      run.spinners = run.spinners.filter((spinner) => !sameCell(spinner, run.cell));
      run.move = { kind: "walk", dir: move.dir };
      run.progress = FLIP_REACH;
      return;
  }
  begin(run, nextMove(run));
}

/** The rat's world position uses the same coordinates as the walker and never crosses walls. */
export function ratPosition(run: MazeRun): { x: number; y: number } {
  const { rat } = run;
  const center = cellCenter(rat.cell);
  if (!canStep(run.maze, rat.cell, rat.heading)) return center;
  const d = ((rat.heading % 4) + 4) % 4;
  return { x: center.x + 2 * DX[d]! * rat.progress, y: center.y + 2 * DY[d]! * rat.progress };
}

function advanceRat(run: MazeRun, seconds: number) {
  const { rat, maze } = run;
  if (!canStep(maze, rat.cell, rat.heading)) return;
  rat.progress += seconds / 1.1;
  for (let guard = 0; rat.progress >= 1 && guard < 64; guard++) {
    const d = ((rat.heading % 4) + 4) % 4;
    rat.cell = { x: rat.cell.x + DX[d]!, y: rat.cell.y + DY[d]! };
    rat.progress -= 1;
    const turn = [-1, 0, 1, 2].find((offset) => canStep(maze, rat.cell, rat.heading + offset)) ?? 2;
    rat.heading = (rat.heading + turn + 4) % 4;
  }
  rat.progress = Math.min(rat.progress, 1);
}

/** Advances the walker by `seconds` (scaled by `speed` for Turbo Mode), mutating and returning the run. */
export function advance(run: MazeRun, seconds: number, speed = 1): MazeRun {
  let budget = Math.max(0, seconds) * speed;
  if (!run.finished) advanceRat(run, budget);
  // A long frame can finish several moves; the cap keeps a stalled tab from spinning here.
  for (let guard = 0; guard < 64 && budget > 0 && !run.finished; guard++) {
    if (run.move === null) begin(run, nextMove(run));
    const move = run.move!;
    const meetsRock = move.kind === "walk" && run.progress < FLIP_REACH && run.spinners.some((spinner) => sameCell(spinner, run.cell));
    const end = meetsRock ? FLIP_REACH : 1;
    const remaining = (end - run.progress) * duration(move);
    if (budget < remaining) {
      run.progress += budget / duration(move);
      budget = 0;
    } else {
      budget -= remaining;
      run.progress = end;
      if (meetsRock && move.kind === "walk") begin(run, { kind: "flip", dir: move.dir });
      else settle(run, move);
    }
  }
  run.pose = poseOf(run);
  return run;
}
