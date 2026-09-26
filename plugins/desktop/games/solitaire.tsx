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
import "./solitaire.css";
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

const DRAG_THRESHOLD = 4;
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
      {suit === "hearts" && (
        <path d="M12 21.5C5 16 1.5 12.5 1.5 8c0-3.2 2.5-5.5 5.5-5.5 2.2 0 4 1.3 5 3.1 1-1.8 2.8-3.1 5-3.1 3 0 5.5 2.3 5.5 5.5 0 4.5-3.5 8-10.5 13.5Z" />
      )}
      {suit === "diamonds" && <path d="M12 1.5 20.5 12 12 22.5 3.5 12Z" />}
      {suit === "spades" && (
        <path d="M12 1.5c4 5 10 8.5 10 13 0 3-2.2 5-4.8 5-1.8 0-3.4-.9-4.2-2.3.3 2.3 1.2 3.8 2.8 5.3H8.2c1.6-1.5 2.5-3 2.8-5.3-.8 1.4-2.4 2.3-4.2 2.3C4.2 19.5 2 17.5 2 14.5c0-4.5 6-8 10-13Z" />
      )}
      {suit === "clubs" && (
        <g>
          <circle cx="12" cy="6.6" r="4.4" />
          <circle cx="6.4" cy="13.4" r="4.4" />
          <circle cx="17.6" cy="13.4" r="4.4" />
          <path d="M10.6 11h2.8c.2 5 1.4 8.6 3.4 11.5H7.2c2-2.9 3.2-6.5 3.4-11.5Z" />
        </g>
      )}
    </svg>
  );
}

function pipPositions(rank: number): number[][] {
  if (rank === 1) return [[50, 50]];
  if (rank === 2) return [[50, 15], [50, 85]];
  if (rank === 3) return [[50, 15], [50, 50], [50, 85]];
  const pips = [[25, 15], [75, 15], [25, 85], [75, 85]];
  if (rank === 5 || rank === 9) pips.push([50, 50]);
  if (rank >= 6 && rank <= 8) pips.push([25, 50], [75, 50]);
  if (rank >= 7 && rank <= 8) pips.push([50, 32]);
  if (rank === 8) pips.push([50, 68]);
  if (rank >= 9) pips.push([25, 38], [75, 38], [25, 62], [75, 62]);
  if (rank === 10) pips.push([50, 26], [50, 74]);
  return pips;
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
          <path d="M2 35V22L11 16h16l11 8v11Z" fill="var(--bbd-sol-gold)" stroke="currentColor" />
          <path d="M4 35V24l10-5 17 16M11 21l23 14M6 28l13 7" fill="none" stroke="var(--bbd-sol-royal)" strokeWidth="3" />
          <path d="M15 7h13v12l-5 5-8-7Z" fill="var(--bbd-sol-skin)" stroke="currentColor" />
          <path d={card.rank === 13 ? "M13 8V2l5 3 4-4 4 4 5-3v6Z" : card.rank === 12 ? "M13 8l3-6 6 3 6-3 3 6Z" : "M12 8l3-6h15l3 6Z"} fill="var(--bbd-sol-gold)" stroke="currentColor" />
          <path d="M24 11h2m-1 5h-5M14 10v11l5 4" stroke="currentColor" fill="none" />
          <path d="M4 23V6m-2 3 2-5 2 5M33 26V12" stroke="currentColor" />
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
  const boardRef = useRef<HTMLDivElement>(null);
  const dragStackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
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
    if (dragRef.current) return;
    setGame((current) => draw(current));
  }, []);

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

  const dropTarget = useCallback((current: Drag): MoveTarget | null => {
    const board = boardRef.current;
    const lead = dragStackRef.current?.firstElementChild;
    if (!board || !lead) return null;
    const leadRect = lead.getBoundingClientRect();
    let best: { target: MoveTarget; area: number } | null = null;
    for (const element of Array.from(board.querySelectorAll("[data-sol-drop]"))) {
      const target = parseTarget(element);
      if (!target || !canMove(gameRef.current, current.source, target)) continue;
      const area = overlap(leadRect, element.getBoundingClientRect());
      if (area > 0 && (!best || area > best.area)) best = { target, area };
    }
    return best?.target ?? null;
  }, []);

  useEffect(() => {
    if (!drag || drag.returning) return;
    const pointerId = drag.pointerId;

    const handleMove = (event: PointerEvent) => {
      const current = dragRef.current;
      const board = boardRef.current;
      if (!current || !board || event.pointerId !== pointerId) return;
      const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
      if (!current.active && distance < DRAG_THRESHOLD) return;
      const rect = board.getBoundingClientRect();
      updateDrag({
        ...current,
        active: true,
        x: event.clientX - rect.left + board.scrollLeft - current.offsetX,
        y: event.clientY - rect.top + board.scrollTop - current.offsetY,
      });
    };

    const handleUp = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current || event.pointerId !== pointerId) return;
      if (!current.active) {
        updateDrag(null);
        return;
      }
      const target = dropTarget(current);
      const next = target ? move(gameRef.current, current.source, target) : null;
      if (next) {
        setGame(next);
        updateDrag(null);
        return;
      }
      if (prefersReducedMotion()) {
        updateDrag(null);
        return;
      }
      updateDrag({ ...current, returning: true, x: current.originX, y: current.originY });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [drag?.pointerId, drag?.returning, dropTarget, updateDrag]);

  const beginDrag = useCallback(
    (source: MoveSource, event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || dragRef.current || won) return;
      const board = boardRef.current;
      const cards = sourceCards(gameRef.current, source);
      if (!board || cards.length === 0) return;
      const cardRect = event.currentTarget.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const originX = cardRect.left - boardRect.left + board.scrollLeft;
      const originY = cardRect.top - boardRect.top + board.scrollTop;
      updateDrag({
        source,
        cards,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - cardRect.left,
        offsetY: event.clientY - cardRect.top,
        originX,
        originY,
        x: originX,
        y: originY,
        active: false,
        returning: false,
      });
    },
    [updateDrag, won],
  );

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
            const cards = game.foundations[pile] ?? [];
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
        {won && (
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
