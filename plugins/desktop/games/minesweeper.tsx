import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import "./minesweeper.css";
import { usePointerTracker } from "../windows";
import { ProgramMenuBar } from "../apps/xp-chrome";
import {
  DIFFICULTIES,
  chord,
  emptyBoard,
  minesLeft,
  reveal,
  toggleFlag,
  type Board,
  type Difficulty,
} from "./minesweeper-core";

const DIFFICULTY_KEY = "bb-desktop:minesweeper:difficulty";

function loadDifficulty(): Difficulty {
  const stored = typeof localStorage === "undefined" ? null : localStorage.getItem(DIFFICULTY_KEY);
  return stored === "intermediate" || stored === "expert" ? stored : "beginner";
}

function Led({ value }: { value: number }) {
  const clamped = Math.max(-99, Math.min(999, value));
  const text = clamped < 0 ? `-${String(-clamped).padStart(2, "0")}` : String(clamped).padStart(3, "0");
  const segments = ["abcdef", "bc", "abdeg", "abcdg", "bcfg", "acdfg", "acdefg", "abc", "abcdefg", "abcdfg"];
  const paths = ["M2 1h7l-1 2H3Z", "M9 2v8l-2-1V4Z", "M9 12v8l-2-2v-5Z", "M2 21h7l-1-2H3Z", "M1 12v8l2-2v-5Z", "M1 2v8l2-1V4Z", "M2 11l1-1h5l1 1-1 1H3Z"];
  return <span className="bbd-mine-led" aria-label={String(clamped)}>
    {[...text].map((digit, index) => <svg key={index} viewBox="0 0 11 23" aria-hidden>
      {paths.map((d, segment) => <path key={d} d={d} data-lit={(digit === "-" ? "g" : segments[Number(digit)]!).includes("abcdefg"[segment]!)} />)}
    </svg>)}
  </span>;
}

type Mood = "happy" | "worried" | "cool" | "dead";

function Face({ mood }: { mood: Mood }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="var(--bbd-mine-face-yellow)" stroke="var(--bbd-mine-ink)" strokeWidth="1.2" />
      {mood === "cool" ? (
        <path d="M5.5 9h13l-1 3.2c-.4 1.2-2.8 1.2-3.2 0L13.6 10h-3.2l-.7 2.2c-.4 1.2-2.8 1.2-3.2 0Z" fill="var(--bbd-mine-ink)" />
      ) : mood === "dead" ? (
        <path d="M7 8l3 3M10 8l-3 3M14 8l3 3M17 8l-3 3" stroke="var(--bbd-mine-ink)" strokeWidth="1.3" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="8.6" cy="9.6" r="1.3" fill="var(--bbd-mine-ink)" />
          <circle cx="15.4" cy="9.6" r="1.3" fill="var(--bbd-mine-ink)" />
        </>
      )}
      {mood === "worried" ? (
        <circle cx="12" cy="16" r="2.2" fill="none" stroke="var(--bbd-mine-ink)" strokeWidth="1.3" />
      ) : mood === "dead" ? (
        <path d="M8 17.5c2.2-2.2 5.8-2.2 8 0" fill="none" stroke="var(--bbd-mine-ink)" strokeWidth="1.3" strokeLinecap="round" />
      ) : (
        <path d="M7.5 14.5c2.4 3 6.6 3 9 0" fill="none" stroke="var(--bbd-mine-ink)" strokeWidth="1.3" strokeLinecap="round" />
      )}
    </svg>
  );
}

function MineGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="bbd-mine-glyph" aria-hidden>
      <path d="M8 1.5v13M1.5 8h13M3.4 3.4l9.2 9.2M12.6 3.4l-9.2 9.2" stroke="var(--bbd-mine-ink)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="8" r="4.6" fill="var(--bbd-mine-ink)" />
      <circle cx="6.6" cy="6.6" r="1.3" fill="var(--bbd-mine-light)" />
    </svg>
  );
}

function FlagGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="bbd-mine-glyph" aria-hidden>
      <path d="M4 14h8M6 12.5h4M8.2 2.5v10" stroke="var(--bbd-mine-ink)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.2 2.5 3 5l5.2 2.6Z" fill="var(--bbd-mine-red)" />
    </svg>
  );
}

function cellLabel(board: Board, index: number): string {
  const cell = board.cells[index]!;
  const position = `row ${Math.floor(index / board.cols) + 1}, column ${(index % board.cols) + 1}`;
  if (!cell.revealed) return `${cell.flagged ? "Flagged" : "Hidden"} ${position}`;
  if (cell.mine) return `Mine ${position}`;
  return `${cell.adjacent === 0 ? "Empty" : cell.adjacent} ${position}`;
}

export function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>(loadDifficulty);
  const [board, setBoard] = useState<Board>(() => emptyBoard(difficulty));
  const [pressing, setPressing] = useState(false);
  const track = usePointerTracker();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [cellSize, setCellSize] = useState(22);
  const fieldRef = useRef<HTMLDivElement>(null);

  const newGame = (next: Difficulty = difficulty) => {
    setDifficulty(next);
    localStorage.setItem(DIFFICULTY_KEY, next);
    setBoard(emptyBoard(next));
    setStartedAt(null);
  };

  useEffect(() => {
    const restart = (event: KeyboardEvent) => {
      if (event.key === "F2" && fieldRef.current?.closest(".bbd-window")?.getAttribute("data-focused") === "true") { event.preventDefault(); newGame(); }
    };
    window.addEventListener("keydown", restart);
    return () => window.removeEventListener("keydown", restart);
  }, [difficulty]);

  useEffect(() => {
    if (board.status !== "playing") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [board.status]);

  useEffect(() => {
    const field = fieldRef.current;
    if (field === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry === undefined) return;
      const fit = Math.floor(Math.min(entry.contentRect.width / board.cols, entry.contentRect.height / board.rows));
      setCellSize(Math.max(16, Math.min(32, fit)));
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [board.cols, board.rows]);

  const elapsed = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));

  const act = (next: Board) => {
    if (startedAt === null && next.status !== "ready") {
      setStartedAt(Date.now());
      setNow(Date.now());
    }
    setBoard(next);
  };

  const onCellClick = (index: number) => {
    const cell = board.cells[index]!;
    act(cell.revealed ? chord(board, index) : reveal(board, index, Math.random));
  };

  const onCellContextMenu = (event: ReactMouseEvent, index: number) => {
    event.preventDefault();
    act(board.cells[index]!.revealed ? chord(board, index) : toggleFlag(board, index));
  };

  const mood: Mood =
    board.status === "won" ? "cool" : board.status === "lost" ? "dead" : pressing ? "worried" : "happy";

  return (
    <div className="bbd-program bbd-mine flex h-full flex-col">
      <ProgramMenuBar menus={[
        { label: "Game", items: [
          { label: "New", shortcut: "F2", action: () => newGame() }, "separator",
          ...(Object.keys(DIFFICULTIES) as Difficulty[]).map(key => ({ label: DIFFICULTIES[key].label, checked: difficulty === key, action: () => newGame(key) })),
        ] },
        { label: "Help", items: [{ label: "Reveal: click · Flag: right-click" }, { label: "Click a number to clear its neighbors" }] },
      ]} />
      <div className="bbd-mine-panel flex min-h-0 flex-1 flex-col">
        <div className="bbd-mine-head">
          <Led value={minesLeft(board)} />
          <button
            type="button"
            className="bbd-mine-face"
            aria-label={board.status === "won" ? "You won. New game" : board.status === "lost" ? "Game over. New game" : "New game"}
            title="New game"
            onClick={() => newGame()}
          >
            <Face mood={mood} />
          </button>
          <Led value={elapsed} />
        </div>
        <div ref={fieldRef} className="bbd-mine-field min-h-0 flex-1">
          <div
            className="bbd-mine-grid"
            role="grid"
            aria-label={`Minesweeper, ${DIFFICULTIES[difficulty].label}`}
            style={{ gridTemplateColumns: `repeat(${board.cols}, ${cellSize}px)`, gridAutoRows: `${cellSize}px` }}
            onPointerDown={(event) => {
              if (event.button !== 0 || event.isPrimary === false || board.status === "won" || board.status === "lost") return;
              // Capture the cell, not the grid, so a normal click still reveals it.
              const target = event.target as HTMLElement;
              const cell = target.closest<HTMLElement>(".bbd-mine-cell");
              if (!cell) return;
              setPressing(true);
              track({ ...event, currentTarget: cell }, () => setPressing(false), () => setPressing(false));
            }}
            onPointerCancel={() => setPressing(false)}
          >
            {board.cells.map((cell, index) => (
              <button
                key={index}
                type="button"
                role="gridcell"
                className="bbd-mine-cell"
                data-revealed={cell.revealed}
                data-exploded={board.exploded === index}
                data-wrong={board.status === "lost" && cell.flagged && !cell.mine}
                data-count={cell.revealed && !cell.mine ? cell.adjacent : undefined}
                aria-label={cellLabel(board, index)}
                onClick={() => onCellClick(index)}
                onContextMenu={(event) => onCellContextMenu(event, index)}
              >
                {cell.revealed ? (
                  cell.mine ? (
                    <MineGlyph />
                  ) : cell.adjacent > 0 ? (
                    cell.adjacent
                  ) : null
                ) : cell.flagged ? (
                  <FlagGlyph />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
