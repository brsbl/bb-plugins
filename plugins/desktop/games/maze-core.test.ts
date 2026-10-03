import { describe, expect, it } from "vitest";
import { advance, canStep, generateMaze, isWall, newRun, seededRandom, type Maze } from "./maze-core";

function reachableCells(maze: Maze): number {
  const seen = new Set<string>(["0,0"]);
  const queue = [{ x: 0, y: 0 }];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    for (let dir = 0; dir < 4; dir++) {
      if (!canStep(maze, cell, dir)) continue;
      const next = { x: cell.x + [1, 0, -1, 0][dir]!, y: cell.y + [0, 1, 0, -1][dir]! };
      const key = `${next.x},${next.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return seen.size;
}

function passages(maze: Maze): number {
  let count = 0;
  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.columns; x++) {
      if (canStep(maze, { x, y }, 0)) count++;
      if (canStep(maze, { x, y }, 1)) count++;
    }
  }
  return count;
}

describe("3D Maze", () => {
  it("carves a perfect maze inside a closed border", () => {
    for (const seed of [1, 2, 3, 42]) {
      const maze = generateMaze(10, 8, seededRandom(seed));
      expect(reachableCells(maze)).toBe(80);
      // A spanning tree: every cell connected by exactly cells - 1 passages, so there are no loops.
      expect(passages(maze)).toBe(79);
      for (let x = 0; x < maze.width; x++) expect(isWall(maze, x, 0) && isWall(maze, x, maze.height - 1)).toBe(true);
      for (let y = 0; y < maze.height; y++) expect(isWall(maze, 0, y) && isWall(maze, maze.width - 1, y)).toBe(true);
    }
  });

  it("reproduces a maze from its seed", () => {
    expect(generateMaze(6, 6, seededRandom(7)).tiles).toEqual(generateMaze(6, 6, seededRandom(7)).tiles);
  });

  it("follows the wall to the exit without stepping into a wall", () => {
    for (const seed of [1, 5, 9, 2024]) {
      const run = newRun(seededRandom(seed));
      for (let frame = 0; frame < 20_000 && !run.finished; frame++) {
        advance(run, 1 / 30);
        expect(isWall(run.maze, Math.floor(run.pose.x), Math.floor(run.pose.y))).toBe(false);
      }
      expect(run.finished).toBe(true);
      expect(run.cell).toEqual(run.maze.exit);
      expect(run.visited[run.maze.exit.y * run.maze.columns + run.maze.exit.x]).toBe(1);
    }
  });

  it("rolls the view over when it walks into a polyhedron", () => {
    const run = newRun(seededRandom(3), 3, 1);
    run.spinners = [{ x: 1, y: 0 }];
    let rolled = false;
    for (let frame = 0; frame < 2_000 && !run.finished; frame++) {
      advance(run, 1 / 30);
      rolled ||= run.upsideDown;
    }
    expect(rolled).toBe(true);
    expect(run.spinners).toEqual([]);
    expect(run.pose.roll).toBeCloseTo(Math.PI);
  });

  it("runs faster in Turbo Mode", () => {
    const normal = newRun(seededRandom(11));
    const turbo = newRun(seededRandom(11));
    advance(normal, 3);
    advance(turbo, 1, 3);
    expect(turbo.cell).toEqual(normal.cell);
    expect(turbo.heading).toBe(normal.heading);
  });
});
