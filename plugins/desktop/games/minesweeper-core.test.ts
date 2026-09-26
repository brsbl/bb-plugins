import { describe, expect, it } from "vitest";

import { chord, emptyBoard, minesLeft, neighbors, placeMines, reveal, toggleFlag, type Board } from "./minesweeper-core";

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function boardWithMines(rows: number, cols: number, mineIndexes: number[]): Board {
  const base: Board = { ...emptyBoard("beginner"), rows, cols, mines: mineIndexes.length };
  const cells = Array.from({ length: rows * cols }, (_, index) => ({
    mine: mineIndexes.includes(index),
    adjacent: 0,
    revealed: false,
    flagged: false,
  }));
  return {
    ...base,
    status: "playing",
    cells: cells.map((cell, index) => ({
      ...cell,
      adjacent: neighbors({ rows, cols }, index).filter((neighbor) => cells[neighbor]!.mine).length,
    })),
  };
}

describe("minesweeper", () => {
  it("never puts a mine on or next to the first click", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const board = placeMines(emptyBoard("beginner"), 40, seeded(seed));
      expect(board.cells.filter((cell) => cell.mine)).toHaveLength(10);
      for (const index of [40, ...neighbors(board, 40)]) expect(board.cells[index]!.mine).toBe(false);
    }
  });

  it("opens an empty region in one click and wins when every safe cell is open", () => {
    const board = reveal(boardWithMines(3, 3, [8]), 0, seeded(1));
    expect(board.cells.filter((cell) => cell.revealed)).toHaveLength(8);
    expect(board.status).toBe("won");
    expect(board.cells[8]!.flagged).toBe(true);
  });

  it("loses on a mine and shows every unflagged mine", () => {
    const flagged = toggleFlag(boardWithMines(3, 3, [0, 8]), 0);
    const board = reveal(flagged, 8, seeded(1));
    expect(board.status).toBe("lost");
    expect(board.exploded).toBe(8);
    expect(board.cells[0]!.revealed).toBe(false);
    expect(board.cells[8]!.revealed).toBe(true);
  });

  it("ignores clicks on flagged cells and counts flags against mines", () => {
    const board = toggleFlag(boardWithMines(3, 3, [0]), 4);
    expect(reveal(board, 4, seeded(1))).toBe(board);
    expect(minesLeft(board)).toBe(0);
  });

  it("chords a number whose flags match, and does nothing otherwise", () => {
    const start = reveal(boardWithMines(3, 3, [0, 2]), 1, seeded(1));
    expect(chord(start, 1)).toBe(start);
    const flagged = toggleFlag(toggleFlag(start, 0), 2);
    const opened = chord(flagged, 1);
    expect([3, 4, 5].map((index) => opened.cells[index]!.revealed)).toEqual([true, true, true]);
    expect(opened.status).toBe("playing");
  });
});
