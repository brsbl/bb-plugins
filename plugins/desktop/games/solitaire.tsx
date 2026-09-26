import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  FOUNDATION_PILES,
  autoFoundationTarget,
  canMove,
  draw,
  isWon,
  move,
  newGame,
  rankLabel,
  sourceCards,
  suitColor,
  type Card,
  type MoveSource,
  type MoveTarget,
  type SolitaireState,
  type Suit,
} from "./solitaire-core";
import { SUIT_PATHS, courtShapes, pipPositions, runCascade } from "./solitaire-cascade";
import "./solitaire.css";
import { usePointerTracker } from "../windows";
import { ProgramMenuBar, ProgramStatusBar } from "../apps/xp-chrome";

interface Metrics {
  cardWidth: number;
  cardHeight: number;
  gap: number;
  fanDown: number;
  fanUp: number;
}

interface Drag {
  source: MoveSource;
  cards: readonly Card[];
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  active: boolean;
  returning: boolean;
}

const RETURN_MS = 180;

function measure(width: number): Metrics {
  const gap = Math.max(4, Math.round(width * 0.018));
  const cardWidth = Math.max(34, Math.min(71, Math.floor((width - gap * 8) / 7)));
  const cardHeight = Math.round(cardWidth * 96 / 71);
  return {
    cardWidth,
    cardHeight,
    gap,
    fanDown: Math.max(4, Math.round(cardHeight * 0.09)),
    fanUp: Math.max(10, Math.round(cardHeight * 0.22)),
  };
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function sameSource(a: MoveSource, b: MoveSource): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "tableau" && b.kind === "tableau") return a.pile === b.pile;
  if (a.kind === "foundation" && b.kind === "foundation") return a.pile === b.pile;
  return true;
}

function parseTarget(element: Element): MoveTarget | null {
  const kind = element.getAttribute("data-sol-drop");
  const pile = Number(element.getAttribute("data-sol-pile"));
  if (!Number.isInteger(pile)) return null;
  if (kind === "tableau" || kind === "foundation") return { kind, pile };
  return null;
}

function overlap(a: DOMRect, b: DOMRect): number {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

function fanOffset(pile: readonly Card[], index: number): string {
  let down = 0;
  let up = 0;
  for (let position = 0; position < index; position += 1) {
    if (pile[position]!.faceUp) up += 1;
    else down += 1;
  }
  return `calc(var(--bbd-sol-fan-down) * ${down} + var(--bbd-sol-fan-up) * ${up})`;
}

function SuitGlyph({ suit, className }: { suit: Suit; className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {SUIT_PATHS[suit].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

function CardFace({ card }: { card: Card }) {
  const label = rankLabel(card.rank);
  return (
    <>
      <span className="bbd-sol-corner">
        <span className="bbd-sol-rank">{label}</span>
        <SuitGlyph suit={card.suit} className="bbd-sol-corner-suit" />
      </span>
      {card.rank <= 10 ? <div className="bbd-sol-pips" data-rank={card.rank}>
        {pipPositions(card.rank).map(([x, y], index) => <span key={index} style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${y > 50 ? 180 : 0}deg)` }}><SuitGlyph suit={card.suit} className="bbd-sol-pip" /></span>)}
      </div> : <svg className="bbd-sol-court" viewBox="0 0 40 70" aria-hidden>
        {[false, true].map(flipped => <g key={String(flipped)} transform={flipped ? "rotate(180 20 35)" : undefined}>
          {courtShapes(card.rank).map(({ d, fill, royal }) => (
            <path
              key={d}
              d={d}
              fill={fill === "none" ? "none" : `var(--bbd-sol-${fill})`}
              stroke={royal ? "var(--bbd-sol-royal)" : "currentColor"}
              strokeWidth={royal ? 3 : undefined}
            />
          ))}
        </g>)}
      </svg>}
      <span className="bbd-sol-corner bbd-sol-corner-end">
        <span className="bbd-sol-rank">{label}</span>
        <SuitGlyph suit={card.suit} className="bbd-sol-corner-suit" />
      </span>
    </>
  );
}

function CardView({
  card,
  style,
  hidden = false,
  onPointerDown,
  onDoubleClick,
}: {
  card: Card;
  style?: CSSProperties;
  hidden?: boolean;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
}) {
  const name = `${rankLabel(card.rank)} of ${card.suit}`;
  return (
    <div
      className="bbd-sol-card"
      data-face={card.faceUp ? "up" : "down"}
      data-color={suitColor(card.suit)}
      data-hidden={hidden ? "true" : undefined}
      style={style}
      aria-label={card.faceUp ? name : "Face-down card"}
      title={card.faceUp ? name : undefined}
      onPointerDown={card.faceUp ? onPointerDown : undefined}
      onDoubleClick={card.faceUp ? onDoubleClick : undefined}
    >
      {card.faceUp ? <CardFace card={card} /> : <span className="bbd-sol-back" />}
    </div>
  );
}

export function SolitaireGame() {
  const [game, setGame] = useState<SolitaireState>(() => newGame(Math.random));
  const [metrics, setMetrics] = useState<Metrics>(() => measure(640));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [cascade, setCascade] = useState<"running" | "done" | null>(null);
  const [launched, setLaunched] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const cascadeRef = useRef<HTMLCanvasElement>(null);
  const dragStackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const track = usePointerTracker();
  const gameRef = useRef(game);
  const won = isWon(game);
  const running = game.moves > 0 && !won;

  gameRef.current = game;

  const updateDrag = useCallback((next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  }, []);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const apply = () => setMetrics(measure(board.clientWidth));
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    setCascade(won ? (prefersReducedMotion() ? "done" : "running") : null);
    setLaunched(0);
  }, [won]);

  // Metrics are read once at launch; resizing mid-cascade keeps the trail already painted.
  useEffect(() => {
    const board = boardRef.current;
    const canvas = cascadeRef.current;
    if (cascade !== "running" || !board || !canvas) return;
    Object.assign(canvas.style, {
      left: `${board.scrollLeft}px`,
      top: `${board.scrollTop}px`,
      width: `${board.clientWidth}px`,
      height: `${board.clientHeight}px`,
    });
    const boardRect = board.getBoundingClientRect();
    const origins = Array.from(board.querySelectorAll(".bbd-sol-foundation"), (slot) => {
      const rect = slot.getBoundingClientRect();
      return { x: rect.left - boardRect.left - board.clientLeft, y: rect.top - boardRect.top - board.clientTop };
    });
    return runCascade({
      canvas,
      foundations: gameRef.current.foundations,
      origins,
      cardWidth: metrics.cardWidth,
      cardHeight: metrics.cardHeight,
      font: getComputedStyle(board).fontFamily,
      random: Math.random,
      onLaunch: setLaunched,
      onDone: () => setCascade("done"),
    });
  }, [cascade]);

  useEffect(() => {
    if (cascade !== "running") return;
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape" && boardRef.current?.closest(".bbd-window")?.getAttribute("data-focused") === "true") {
        setCascade("done");
      }
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [cascade]);

  const startNewGame = useCallback(() => {
    updateDrag(null);
    setSeconds(0);
    setGame(newGame(Math.random));
  }, [updateDrag]);

  useEffect(() => {
    const restart = (event: KeyboardEvent) => {
      if (event.key === "F2" && boardRef.current?.closest(".bbd-window")?.getAttribute("data-focused") === "true") {
        event.preventDefault(); startNewGame();
      }
    };
    window.addEventListener("keydown", restart);
    return () => window.removeEventListener("keydown", restart);
  }, [startNewGame]);

  const drawCard = useCallback(() => {
    if (dragRef.current?.returning) updateDrag(null);
    if (dragRef.current) return;
    setGame((current) => draw(current));
  }, [updateDrag]);

  const autoMove = useCallback((source: MoveSource) => {
    setGame((current) => {
      const target = autoFoundationTarget(current, source);
      return target ? (move(current, source, target) ?? current) : current;
    });
  }, []);

  const finishReturn = useCallback(() => {
    if (dragRef.current?.returning) updateDrag(null);
  }, [updateDrag]);

  useEffect(() => {
    if (!drag?.returning) return;
    const timer = window.setTimeout(finishReturn, RETURN_MS + 80);
    return () => window.clearTimeout(timer);
  }, [drag?.returning, finishReturn]);

  const beginDrag = (source: MoveSource, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.isPrimary === false || won) return;
    // A card still gliding home must not swallow the next grab.
    if (dragRef.current?.returning) updateDrag(null);
    if (dragRef.current) return;
    const board = boardRef.current;
    const cards = sourceCards(gameRef.current, source);
    if (!board || cards.length === 0) return;
    const cardRect = event.currentTarget.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    // A tableau column accepts drops anywhere below its top card, down to the bottom of the felt.
    const targets = Array.from(board.querySelectorAll("[data-sol-drop]")).map((element) => {
      const target = parseTarget(element);
      const rect = element.getBoundingClientRect();
      const bottom = target?.kind === "tableau" ? Math.max(rect.bottom, boardRect.bottom) : rect.bottom;
      return { target, rect: new DOMRect(rect.left, rect.top, rect.width, bottom - rect.top) };
    });
    const originX = cardRect.left - boardRect.left + board.scrollLeft;
    const originY = cardRect.top - boardRect.top + board.scrollTop;
    const initial: Drag = {
      source, cards, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      offsetX: event.clientX - cardRect.left, offsetY: event.clientY - cardRect.top,
      originX, originY, x: originX, y: originY, active: true, returning: false,
    };
    let latest = initial;
    let delta = { x: 0, y: 0 };
    track(event, (next) => {
      delta = next;
      latest = { ...initial, x: originX + next.x, y: originY + next.y };
      if (dragRef.current === null) updateDrag(latest);
      else dragRef.current = latest;
      if (dragStackRef.current) dragStackRef.current.style.transform = `translate(${latest.x}px, ${latest.y}px)`;
    }, (cancelled, moved) => {
      if (cancelled || !moved) { updateDrag(null); return; }
      const lead = new DOMRect(cardRect.left + delta.x, cardRect.top + delta.y, cardRect.width, cardRect.height);
      const pointerX = initial.startX + delta.x;
      const pointerY = initial.startY + delta.y;
      // The legal pile under the pointer wins; otherwise the legal pile the card overlaps most.
      let best: { target: MoveTarget; area: number } | null = null;
      for (const candidate of targets) {
        if (!candidate.target || !canMove(gameRef.current, source, candidate.target)) continue;
        const { left, right, top, bottom } = candidate.rect;
        const underPointer = pointerX >= left && pointerX <= right && pointerY >= top && pointerY <= bottom;
        const area = underPointer ? Infinity : overlap(lead, candidate.rect);
        if (area > 0 && (!best || area > best.area)) best = { target: candidate.target, area };
      }
      const next = best ? move(gameRef.current, source, best.target) : null;
      if (next) { setGame(next); updateDrag(null); }
      else if (prefersReducedMotion()) updateDrag(null);
      else updateDrag({ ...latest, returning: true, x: originX, y: originY });
    });
  };

  const lifted = drag?.active ? drag : null;
  const isLifted = (source: MoveSource, index: number) =>
    lifted !== null &&
    sameSource(lifted.source, source) &&
    (lifted.source.kind !== "tableau" || index >= lifted.source.index);

  const boardStyle = {
    "--bbd-sol-card-w": `${metrics.cardWidth}px`,
    "--bbd-sol-card-h": `${metrics.cardHeight}px`,
    "--bbd-sol-gap": `${metrics.gap}px`,
    "--bbd-sol-fan-down": `${metrics.fanDown}px`,
    "--bbd-sol-fan-up": `${metrics.fanUp}px`,
  } as CSSProperties;

  const wasteTop = game.waste[game.waste.length - 1];
  const wasteUnder = game.waste[game.waste.length - 2];
  const wasteLifted = isLifted({ kind: "waste" }, 0);

  return (
    <div className="bbd-program bbd-sol h-full">
      <ProgramMenuBar menus={[
        { label: "Game", items: [{ label: "Deal", shortcut: "F2", action: startNewGame }, { label: "Draw", action: drawCard }, "separator", { label: "Options…", disabled: true }, { label: "Deck…", disabled: true }] },
        { label: "Help", items: [{ label: "Build alternating colors downward" }, { label: "Double-click a card to send it home" }] },
      ]} />
      <div
        ref={boardRef}
        className="bbd-sol-board"
        style={boardStyle}
        data-size={metrics.cardWidth < 60 ? "small" : "regular"}
      >
        <div className="bbd-sol-grid">
          <button
            type="button"
            className="bbd-sol-slot bbd-sol-stock"
            onClick={drawCard}
            aria-label={game.stock.length > 0 ? `Draw a card, ${game.stock.length} left` : "Recycle the waste"}
            title={game.stock.length > 0 ? "Draw a card" : "Recycle the waste"}
          >
            {game.stock.length > 0 ? (
              <span className="bbd-sol-card" data-face="down">
                <span className="bbd-sol-back" />
              </span>
            ) : (
              <span className="bbd-sol-recycle" data-empty={game.waste.length === 0 ? "true" : undefined} />
            )}
          </button>
          <div className="bbd-sol-slot bbd-sol-waste">
            {wasteUnder && wasteLifted && <CardView key={wasteUnder.id} card={wasteUnder} />}
            {wasteTop && (
              <CardView
                key={wasteTop.id}
                card={wasteTop}
                hidden={wasteLifted}
                onPointerDown={(event) => beginDrag({ kind: "waste" }, event)}
                onDoubleClick={() => autoMove({ kind: "waste" })}
              />
            )}
          </div>
          {Array.from({ length: FOUNDATION_PILES }, (_, pile) => {
            // The win cascade deals Kings first, one per foundation in turn.
            const flown = launched > pile ? Math.floor((launched - 1 - pile) / FOUNDATION_PILES) + 1 : 0;
            const pileCards = game.foundations[pile] ?? [];
            const cards = pileCards.slice(0, pileCards.length - flown);
            const top = cards[cards.length - 1];
            const under = cards[cards.length - 2];
            const source: MoveSource = { kind: "foundation", pile };
            const topLifted = isLifted(source, 0);
            return (
              <div
                key={pile}
                className="bbd-sol-slot bbd-sol-foundation"
                role="group"
                data-sol-drop="foundation"
                data-sol-pile={pile}
                aria-label={`Foundation ${pile + 1}`}
              >
                {under && topLifted && <CardView key={under.id} card={under} />}
                {top && (
                  <CardView
                    key={top.id}
                    card={top}
                    hidden={topLifted}
                    onPointerDown={(event) => beginDrag(source, event)}
                  />
                )}
              </div>
            );
          })}
          {game.tableau.map((pile, pileIndex) => (
            <div
              key={pileIndex}
              className="bbd-sol-slot bbd-sol-pile"
              role="group"
              data-sol-drop="tableau"
              data-sol-pile={pileIndex}
              aria-label={`Pile ${pileIndex + 1}`}
              style={{ height: `calc(var(--bbd-sol-card-h) + ${fanOffset(pile, pile.length === 0 ? 0 : pile.length - 1)})` }}
            >
              {pile.map((card, index) => {
                const source: MoveSource = { kind: "tableau", pile: pileIndex, index };
                return (
                  <CardView
                    key={card.id}
                    card={card}
                    hidden={isLifted(source, index)}
                    style={{ top: fanOffset(pile, index) }}
                    onPointerDown={(event) => beginDrag(source, event)}
                    onDoubleClick={index === pile.length - 1 ? () => autoMove(source) : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {drag?.active && (
          <div
            ref={dragStackRef}
            className="bbd-sol-drag"
            data-returning={drag.returning ? "true" : undefined}
            style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
            onTransitionEnd={finishReturn}
            aria-hidden
          >
            {drag.cards.map((card, index) => (
              <CardView key={card.id} card={card} style={{ top: `calc(var(--bbd-sol-fan-up) * ${index})` }} />
            ))}
          </div>
        )}
        {cascade !== null && (
          <canvas
            ref={cascadeRef}
            className="bbd-sol-cascade"
            aria-hidden
            onPointerDown={() => setCascade("done")}
          />
        )}
        {cascade === "done" && (
          <div className="bbd-sol-win" role="dialog" aria-label="You won">
            <div className="bbd-sol-win-panel bbd-glass">
              <strong className="bbd-sol-win-title">You won!</strong>
              <span className="bbd-sol-stat">
                {game.moves} moves in {formatTime(seconds)}
              </span>
              <button type="button" className="bbd-button bbd-bevel" onClick={startNewGame}>
                New game
              </button>
            </div>
          </div>
        )}
      </div>
      <ProgramStatusBar><span className="flex-1" /><span>Moves: {game.moves}</span><span>Time: {formatTime(seconds)}</span></ProgramStatusBar>
    </div>
  );
}
