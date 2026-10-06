import { describe, expect, it } from "vitest";

import {
  RANKS,
  SUITS,
  autoFoundationTarget,
  canMove,
  createCard,
  draw,
  isWon,
  move,
  newGame,
  type Card,
  type SolitaireState,
} from "./solitaire-core";

function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function up(card: Card): Card {
  return { ...card, faceUp: true };
}

function state(partial: Partial<SolitaireState>): SolitaireState {
  return {
    tableau: Array.from({ length: 7 }, () => []),
    stock: [],
    waste: [],
    foundations: Array.from({ length: 4 }, () => []),
    moves: 0,
    ...partial,
  };
}

function piles(entries: Record<number, Card[]>): Card[][] {
  return Array.from({ length: 7 }, (_, index) => entries[index] ?? []);
}

describe("newGame", () => {
  it("deals seven tableau piles with only the top card face up", () => {
    const game = newGame(seeded(1));
    expect(game.tableau).toHaveLength(7);
    game.tableau.forEach((pile, index) => {
      expect(pile).toHaveLength(index + 1);
      expect(pile.map((card) => card.faceUp)).toEqual(pile.map((_, position) => position === index));
    });
    expect(game.stock).toHaveLength(24);
    expect(game.stock.every((card) => !card.faceUp)).toBe(true);
    expect(game.waste).toHaveLength(0);
    expect(game.foundations).toEqual([[], [], [], []]);
    expect(game.moves).toBe(0);
  });

  it("uses every card exactly once", () => {
    const game = newGame(seeded(7));
    const ids = [...game.tableau.flat(), ...game.stock].map((card) => card.id);
    expect(new Set(ids).size).toBe(52);
  });

  it("is deterministic for the same random source", () => {
    expect(newGame(seeded(42))).toEqual(newGame(seeded(42)));
    expect(newGame(seeded(42))).not.toEqual(newGame(seeded(43)));
  });
});

describe("stock", () => {
  it("draws one card face up onto the waste", () => {
    const game = newGame(seeded(3));
    const top = game.stock[game.stock.length - 1]!;
    const next = draw(game);
    expect(next.stock).toHaveLength(23);
    expect(next.waste).toEqual([{ ...top, faceUp: true }]);
    expect(next.moves).toBe(1);
    expect(game.stock).toHaveLength(24);
  });

  it("recycles the waste back into the stock in original order", () => {
    let game = newGame(seeded(5));
    const original = game.stock.map((card) => card.id);
    for (let index = 0; index < 24; index += 1) game = draw(game);
    expect(game.stock).toHaveLength(0);
    expect(game.waste).toHaveLength(24);
    const recycled = draw(game);
    expect(recycled.waste).toHaveLength(0);
    expect(recycled.stock.map((card) => card.id)).toEqual(original);
    expect(recycled.stock.every((card) => !card.faceUp)).toBe(true);
    expect(recycled.moves).toBe(25);
  });

  it("does nothing when stock and waste are both empty", () => {
    const empty = state({});
    expect(draw(empty)).toBe(empty);
  });
});

describe("tableau moves", () => {
  it("moves a card onto the next higher rank of the opposite color", () => {
    const game = state({
      tableau: piles({ 0: [up(createCard("spades", 8))], 1: [createCard("clubs", 2), up(createCard("hearts", 7))] }),
    });
    const next = move(game, { kind: "tableau", pile: 1, index: 1 }, { kind: "tableau", pile: 0 });
    expect(next?.tableau[0]!.map((card) => card.id)).toEqual(["spades-8", "hearts-7"]);
    expect(next?.tableau[1]).toEqual([up(createCard("clubs", 2))]);
    expect(next?.moves).toBe(1);
  });

  it("rejects same-color and wrong-rank moves", () => {
    const game = state({
      tableau: piles({
        0: [up(createCard("spades", 8))],
        1: [up(createCard("clubs", 7))],
        2: [up(createCard("hearts", 6))],
      }),
    });
    expect(canMove(game, { kind: "tableau", pile: 1, index: 0 }, { kind: "tableau", pile: 0 })).toBe(false);
    expect(canMove(game, { kind: "tableau", pile: 2, index: 0 }, { kind: "tableau", pile: 0 })).toBe(false);
    expect(move(game, { kind: "tableau", pile: 2, index: 0 }, { kind: "tableau", pile: 0 })).toBeNull();
  });

  it("moves a whole run and flips the newly exposed card", () => {
    const game = state({
      tableau: piles({
        0: [up(createCard("diamonds", 10))],
        1: [createCard("hearts", 1), up(createCard("clubs", 9)), up(createCard("hearts", 8))],
      }),
    });
    const next = move(game, { kind: "tableau", pile: 1, index: 1 }, { kind: "tableau", pile: 0 });
    expect(next?.tableau[0]!.map((card) => card.id)).toEqual(["diamonds-10", "clubs-9", "hearts-8"]);
    expect(next?.tableau[1]).toEqual([up(createCard("hearts", 1))]);
  });

  it("rejects picking up face-down cards or broken runs", () => {
    const game = state({
      tableau: piles({
        0: [up(createCard("diamonds", 10))],
        1: [createCard("clubs", 9), up(createCard("hearts", 8))],
        2: [up(createCard("clubs", 9)), up(createCard("spades", 8))],
      }),
    });
    expect(canMove(game, { kind: "tableau", pile: 1, index: 0 }, { kind: "tableau", pile: 0 })).toBe(false);
    expect(canMove(game, { kind: "tableau", pile: 2, index: 0 }, { kind: "tableau", pile: 0 })).toBe(false);
  });

  it("only allows a King or King-led run onto an empty pile", () => {
    const game = state({
      tableau: piles({
        1: [up(createCard("spades", 13)), up(createCard("hearts", 12))],
        2: [up(createCard("hearts", 11))],
      }),
    });
    expect(canMove(game, { kind: "tableau", pile: 2, index: 0 }, { kind: "tableau", pile: 0 })).toBe(false);
    expect(canMove(game, { kind: "tableau", pile: 1, index: 1 }, { kind: "tableau", pile: 0 })).toBe(false);
    const next = move(game, { kind: "tableau", pile: 1, index: 0 }, { kind: "tableau", pile: 0 });
    expect(next?.tableau[0]!.map((card) => card.id)).toEqual(["spades-13", "hearts-12"]);
    expect(next?.tableau[1]).toEqual([]);
  });

  it("moves the waste top onto the tableau", () => {
    const game = state({
      tableau: piles({ 3: [up(createCard("clubs", 5))] }),
      waste: [up(createCard("spades", 2)), up(createCard("diamonds", 4))],
    });
    const next = move(game, { kind: "waste" }, { kind: "tableau", pile: 3 });
    expect(next?.tableau[3]!.map((card) => card.id)).toEqual(["clubs-5", "diamonds-4"]);
    expect(next?.waste.map((card) => card.id)).toEqual(["spades-2"]);
  });
});

describe("foundation moves", () => {
  it("starts a foundation with an Ace and builds up by suit", () => {
    const game = state({
      tableau: piles({ 0: [up(createCard("hearts", 2))] }),
      waste: [up(createCard("hearts", 1))],
    });
    const withAce = move(game, { kind: "waste" }, { kind: "foundation", pile: 2 });
    expect(withAce?.foundations[2]!.map((card) => card.id)).toEqual(["hearts-1"]);
    const withTwo = move(withAce!, { kind: "tableau", pile: 0, index: 0 }, { kind: "foundation", pile: 2 });
    expect(withTwo?.foundations[2]!.map((card) => card.id)).toEqual(["hearts-1", "hearts-2"]);
    expect(withTwo?.moves).toBe(2);
  });

  it("rejects non-Aces on empty foundations, other suits, and runs", () => {
    const game = state({
      tableau: piles({
        0: [up(createCard("spades", 2))],
        1: [up(createCard("clubs", 3)), up(createCard("hearts", 2))],
      }),
      foundations: [[up(createCard("hearts", 1))], [], [], []],
    });
    expect(canMove(game, { kind: "tableau", pile: 0, index: 0 }, { kind: "foundation", pile: 1 })).toBe(false);
    expect(canMove(game, { kind: "tableau", pile: 0, index: 0 }, { kind: "foundation", pile: 0 })).toBe(false);
    expect(canMove(game, { kind: "tableau", pile: 1, index: 0 }, { kind: "foundation", pile: 0 })).toBe(false);
    expect(canMove(game, { kind: "tableau", pile: 1, index: 1 }, { kind: "foundation", pile: 0 })).toBe(true);
  });

  it("moves a foundation top back onto the tableau", () => {
    const game = state({
      tableau: piles({ 0: [up(createCard("clubs", 4))] }),
      foundations: [[up(createCard("hearts", 1)), up(createCard("hearts", 2)), up(createCard("hearts", 3))], [], [], []],
    });
    const next = move(game, { kind: "foundation", pile: 0 }, { kind: "tableau", pile: 0 });
    expect(next?.tableau[0]!.map((card) => card.id)).toEqual(["clubs-4", "hearts-3"]);
    expect(next?.foundations[0]).toHaveLength(2);
    expect(canMove(game, { kind: "foundation", pile: 0 }, { kind: "foundation", pile: 1 })).toBe(false);
  });

  it("finds the auto target for a double-click", () => {
    const game = state({
      tableau: piles({ 0: [up(createCard("spades", 2))], 1: [up(createCard("diamonds", 1))], 2: [up(createCard("clubs", 9))] }),
      foundations: [[], [up(createCard("spades", 1))], [], []],
    });
    expect(autoFoundationTarget(game, { kind: "tableau", pile: 0, index: 0 })).toEqual({ kind: "foundation", pile: 1 });
    expect(autoFoundationTarget(game, { kind: "tableau", pile: 1, index: 0 })).toEqual({ kind: "foundation", pile: 0 });
    expect(autoFoundationTarget(game, { kind: "tableau", pile: 2, index: 0 })).toBeNull();
    expect(autoFoundationTarget(state({}), { kind: "waste" })).toBeNull();
  });
});

describe("isWon", () => {
  const complete = SUITS.map((suit) => RANKS.map((rank) => up(createCard(suit, rank))));

  it("is true only when every foundation holds a full suit", () => {
    expect(isWon(state({ foundations: complete }))).toBe(true);
    expect(isWon(state({ foundations: [...complete.slice(0, 3), complete[3]!.slice(0, 12)] }))).toBe(false);
    expect(isWon(newGame(seeded(9)))).toBe(false);
  });

  it("is reached by moving the last King onto its foundation", () => {
    const game = state({
      tableau: piles({ 0: [up(createCard("clubs", 13))] }),
      foundations: [...complete.slice(0, 3), complete[3]!.slice(0, 12)],
    });
    const next = move(game, { kind: "tableau", pile: 0, index: 0 }, { kind: "foundation", pile: 3 });
    expect(next && isWon(next)).toBe(true);
  });
});
