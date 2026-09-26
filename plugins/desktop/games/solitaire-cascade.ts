import { FOUNDATION_PILES, rankLabel, suitColor, type Card, type Rank, type Suit } from "./solitaire-core";

/** Suit glyph paths in a 24×24 box, shared by the DOM cards and the win cascade's canvas cards. */
export const SUIT_PATHS: Record<Suit, readonly string[]> = {
  hearts: ["M12 21.5C5 16 1.5 12.5 1.5 8c0-3.2 2.5-5.5 5.5-5.5 2.2 0 4 1.3 5 3.1 1-1.8 2.8-3.1 5-3.1 3 0 5.5 2.3 5.5 5.5 0 4.5-3.5 8-10.5 13.5Z"],
  diamonds: ["M12 1.5 20.5 12 12 22.5 3.5 12Z"],
  spades: ["M12 1.5c4 5 10 8.5 10 13 0 3-2.2 5-4.8 5-1.8 0-3.4-.9-4.2-2.3.3 2.3 1.2 3.8 2.8 5.3H8.2c1.6-1.5 2.5-3 2.8-5.3-.8 1.4-2.4 2.3-4.2 2.3C4.2 19.5 2 17.5 2 14.5c0-4.5 6-8 10-13Z"],
  clubs: [
    "M16.4 6.6a4.4 4.4 0 1 1-8.8 0a4.4 4.4 0 1 1 8.8 0Z",
    "M10.8 13.4a4.4 4.4 0 1 1-8.8 0a4.4 4.4 0 1 1 8.8 0Z",
    "M22 13.4a4.4 4.4 0 1 1-8.8 0a4.4 4.4 0 1 1 8.8 0Z",
    "M10.6 11h2.8c.2 5 1.4 8.6 3.4 11.5H7.2c2-2.9 3.2-6.5 3.4-11.5Z",
  ],
};

export type CourtFill = "gold" | "skin" | "none";

/** One half of a court card's figure in a 40×70 box; the other half is the same art rotated 180°. */
export function courtShapes(rank: Rank): readonly { d: string; fill: CourtFill; royal?: boolean }[] {
  return [
    { d: "M2 35V22L11 16h16l11 8v11Z", fill: "gold" },
    { d: "M4 35V24l10-5 17 16M11 21l23 14M6 28l13 7", fill: "none", royal: true },
    { d: "M15 7h13v12l-5 5-8-7Z", fill: "skin" },
    { d: rank === 13 ? "M13 8V2l5 3 4-4 4 4 5-3v6Z" : rank === 12 ? "M13 8l3-6 6 3 6-3 3 6Z" : "M12 8l3-6h15l3 6Z", fill: "gold" },
    { d: "M24 11h2m-1 5h-5M14 10v11l5 4", fill: "none" },
    { d: "M4 23V6m-2 3 2-5 2 5M33 26V12", fill: "none" },
  ];
}

export function pipPositions(rank: number): number[][] {
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

const COLORS = {
  face: "#fff",
  edge: "rgba(40, 52, 72, 0.42)",
  black: "#000",
  red: "#ff0000",
  gold: "#ffdf00",
  skin: "#ffdfad",
  royal: "#000080",
};

const pathCache = new Map<string, Path2D>();
function path(d: string): Path2D {
  let cached = pathCache.get(d);
  if (!cached) pathCache.set(d, (cached = new Path2D(d)));
  return cached;
}

/** Draws `art` scaled into the box like an SVG with the default `xMidYMid meet`. */
function inBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, viewW: number, viewH: number, flip: boolean, art: () => void) {
  const scale = Math.min(w / viewW, h / viewH);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (flip) ctx.rotate(Math.PI);
  ctx.scale(scale, scale);
  ctx.translate(-viewW / 2, -viewH / 2);
  art();
  ctx.restore();
}

function suit(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, w: number, h: number, flip = false) {
  inBox(ctx, x, y, w, h, 24, 24, flip, () => {
    for (const d of SUIT_PATHS[card.suit]) ctx.fill(path(d));
  });
}

function corner(ctx: CanvasRenderingContext2D, card: Card, w: number, h: number, font: string) {
  const size = w < 60 ? 11 : 12;
  const label = rankLabel(card.rank);
  const glyph = size * 0.8;
  ctx.font = `700 ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const cx = w * 0.03 + Math.max(ctx.measureText(label).width, glyph) / 2;
  ctx.fillText(label, cx, h * 0.05);
  suit(ctx, card, cx - glyph / 2, h * 0.05 + size + size * 0.1, glyph, glyph);
}

/** Paints a face-up card the same way the DOM `CardFace` renders it, with its 1px drop shadow. */
export function drawCard(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, w: number, h: number, font: string) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = COLORS.black;
  ctx.beginPath();
  ctx.roundRect(1, 1, w, h, 3);
  ctx.fill();
  ctx.fillStyle = COLORS.face;
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, w - 1, h - 1, 3);
  ctx.fill();
  ctx.stroke();

  const ink = suitColor(card.suit) === "red" ? COLORS.red : COLORS.black;
  ctx.fillStyle = ink;
  corner(ctx, card, w, h, font);
  ctx.save();
  ctx.translate(w, h);
  ctx.rotate(Math.PI);
  corner(ctx, card, w, h, font);
  ctx.restore();

  if (card.rank <= 10) {
    const left = w * 0.19;
    const top = h * 0.09;
    const areaW = w * 0.62;
    const areaH = h * 0.82;
    const [pipW, pipH] = card.rank === 1 ? [30, 34] : [16, 18];
    for (const [px, py] of pipPositions(card.rank)) {
      suit(ctx, card, left + areaW * px! / 100 - pipW / 2, top + areaH * py! / 100 - pipH / 2, pipW, pipH, py! > 50);
    }
  } else {
    const bx = w * 0.2;
    const by = h * 0.12;
    const bw = w * 0.6;
    const bh = h * 0.76;
    ctx.strokeStyle = ink;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    for (const flip of [false, true]) {
      inBox(ctx, bx, by, bw, bh, 40, 70, false, () => {
        if (flip) {
          ctx.translate(40, 70);
          ctx.rotate(Math.PI);
        }
        for (const shape of courtShapes(card.rank)) {
          const shapePath = path(shape.d);
          if (shape.fill !== "none") {
            ctx.fillStyle = COLORS[shape.fill];
            ctx.fill(shapePath);
          }
          ctx.lineWidth = shape.royal ? 3 : 1;
          ctx.strokeStyle = shape.royal ? COLORS.royal : ink;
          ctx.stroke(shapePath);
        }
      });
    }
  }
  ctx.restore();
}

export interface CascadeOptions {
  canvas: HTMLCanvasElement;
  /** Cards on each foundation, Ace first. */
  foundations: readonly (readonly Card[])[];
  /** Top-left of each foundation slot within the canvas, in CSS pixels. */
  origins: readonly { x: number; y: number }[];
  cardWidth: number;
  cardHeight: number;
  font: string;
  random: () => number;
  /** Called as each card leaves its foundation, with the count launched so far. */
  onLaunch: (launched: number) => void;
  onDone: () => void;
}

/**
 * The Windows Solitaire win: Kings down to Aces leave the foundations in turn, bounce along the
 * bottom of the felt and exit sideways. The canvas is never cleared, so every step leaves a card behind.
 */
export function runCascade(options: CascadeOptions): () => void {
  const { canvas, foundations, origins, cardWidth: w, cardHeight: h, font, random, onLaunch, onDone } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    onDone();
    return () => {};
  }
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.scale(ratio, ratio);

  const order: { card: Card; pile: number }[] = [];
  for (let depth = 12; depth >= 0; depth -= 1) {
    for (let pile = 0; pile < FOUNDATION_PILES; pile += 1) {
      const card = foundations[pile]?.[depth];
      if (card) order.push({ card, pile });
    }
  }

  const unit = w / 71;
  const floor = height - h;
  let index = 0;
  let flying: { card: Card; x: number; y: number; vx: number; vy: number } | null = null;
  let frame = 0;

  const launch = () => {
    const next = order[index];
    if (!next) return false;
    index += 1;
    const origin = origins[next.pile] ?? { x: 0, y: 0 };
    const speed = (2 + random() * 5) * unit;
    flying = {
      card: next.card,
      x: origin.x,
      y: origin.y,
      vx: random() < 0.5 ? -speed : speed,
      vy: -random() * 10 * unit,
    };
    onLaunch(index);
    return true;
  };

  const step = () => {
    for (let tick = 0; tick < 2; tick += 1) {
      if (!flying && !launch()) {
        onDone();
        return;
      }
      const card = flying!;
      card.vy += 0.9 * unit;
      card.x += card.vx;
      card.y += card.vy;
      if (card.y > floor) {
        card.y = floor;
        card.vy = -card.vy * 0.78;
      }
      drawCard(ctx, card.card, card.x, card.y, w, h, font);
      if (card.x < -w || card.x > width) flying = null;
    }
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
