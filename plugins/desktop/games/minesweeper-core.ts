export type Difficulty = "beginner" | "intermediate" | "expert";

export const DIFFICULTIES: Record<Difficulty, { label: string; rows: number; cols: number; mines: number }> = {
  beginner: { label: "Beginner", rows: 9, cols: 9, mines: 10 },
  intermediate: { label: "Intermediate", rows: 16, cols: 16, mines: 40 },
  expert: { label: "Expert", rows: 16, cols: 30, mines: 99 },
};

export interface Cell {
  mine: boolean;
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
}

export type BoardStatus = "ready" | "playing" | "won" | "lost";

export interface Board {
  rows: number;
  cols: number;
  mines: number;
  cells: readonly Cell[];
  status: BoardStatus;
  exploded: number | null;
}

export function emptyBoard(difficulty: Difficulty): Board {
  const { rows, cols, mines } = DIFFICULTIES[difficulty];
  return {
    rows,
    cols,
    mines,
    cells: Array.from({ length: rows * cols }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false })),
    status: "ready",
    exploded: null,
  };
}

export function neighbors(board: Pick<Board, "rows" | "cols">, index: number): number[] {
  const row = Math.floor(index / board.cols);
  const col = index % board.cols;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) result.push(r * board.cols + c);
    }
  }
  return result;
}

export function placeMines(board: Board, safeIndex: number, random: () => number): Board {
  const protectedCells = new Set([safeIndex, ...neighbors(board, safeIndex)]);
  const candidates = board.cells.map((_, index) => index).filter((index) => !protectedCells.has(index));
  const pool = candidates.length >= board.mines ? candidates : board.cells.map((_, index) => index).filter((index) => index !== safeIndex);
  const mines = new Set<number>();
  while (mines.size < Math.min(board.mines, pool.length)) {
    mines.add(pool[Math.floor(random() * pool.length)]!);
  }
  const cells = board.cells.map((cell, index) => ({ ...cell, mine: mines.has(index) }));
  return {
    ...board,
    status: "playing",
    cells: cells.map((cell, index) => ({
      ...cell,
      adjacent: neighbors(board, index).filter((neighbor) => cells[neighbor]!.mine).length,
    })),
  };
}

function settle(board: Board, cells: Cell[]): Board {
  const won = cells.every((cell) => cell.mine || cell.revealed);
  return won
    ? { ...board, status: "won", cells: cells.map((cell) => (cell.mine ? { ...cell, flagged: true } : cell)) }
    : { ...board, cells };
}

function open(board: Board, cells: Cell[], start: number): Board {
  const queue = [start];
  while (queue.length > 0) {
    const index = queue.pop()!;
    const cell = cells[index]!;
    if (cell.revealed || cell.flagged) continue;
    if (cell.mine) {
      return {
        ...board,
        status: "lost",
        exploded: index,
        cells: cells.map((candidate) => (candidate.mine && !candidate.flagged ? { ...candidate, revealed: true } : candidate)),
      };
    }
    cells[index] = { ...cell, revealed: true };
    if (cell.adjacent === 0) queue.push(...neighbors(board, index));
  }
  return settle(board, cells);
}

export function reveal(board: Board, index: number, random: () => number): Board {
  if (board.status === "won" || board.status === "lost") return board;
  const started = board.status === "ready" ? placeMines(board, index, random) : board;
  const cell = started.cells[index];
  if (cell === undefined || cell.revealed || cell.flagged) return started;
  return open(started, [...started.cells], index);
}

export function toggleFlag(board: Board, index: number): Board {
  if (board.status === "won" || board.status === "lost") return board;
  const cell = board.cells[index];
  if (cell === undefined || cell.revealed) return board;
  const cells = [...board.cells];
  cells[index] = { ...cell, flagged: !cell.flagged };
  return { ...board, cells };
}

export function chord(board: Board, index: number): Board {
  if (board.status !== "playing") return board;
  const cell = board.cells[index];
  if (cell === undefined || !cell.revealed || cell.adjacent === 0) return board;
  const around = neighbors(board, index);
  const flags = around.filter((neighbor) => board.cells[neighbor]!.flagged).length;
  if (flags !== cell.adjacent) return board;
  let next: Board = board;
  for (const neighbor of around) {
    if (next.status !== "playing") break;
    const target = next.cells[neighbor]!;
    if (target.revealed || target.flagged) continue;
    next = open(next, [...next.cells], neighbor);
  }
  return next;
}

export function minesLeft(board: Board): number {
  return board.mines - board.cells.filter((cell) => cell.flagged).length;
}
