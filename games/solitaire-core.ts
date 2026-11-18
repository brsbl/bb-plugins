export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type SuitColor = "red" | "black";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface SolitaireState {
  tableau: readonly (readonly Card[])[];
  stock: readonly Card[];
  waste: readonly Card[];
  foundations: readonly (readonly Card[])[];
  moves: number;
}

export type MoveSource =
  | { kind: "waste" }
  | { kind: "tableau"; pile: number; index: number }
  | { kind: "foundation"; pile: number };

export type MoveTarget = { kind: "tableau"; pile: number } | { kind: "foundation"; pile: number };

export const SUITS: readonly Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const TABLEAU_PILES = 7;

export const FOUNDATION_PILES = 4;

export function suitColor(suit: Suit): SuitColor {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function rankLabel(rank: Rank): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

export function createCard(suit: Suit, rank: Rank, faceUp = false): Card {
  return { id: `${suit}-${rank}`, suit, rank, faceUp };
}

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => createCard(suit, rank)));
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const held = result[index]!;
    result[index] = result[swap]!;
    result[swap] = held;
  }
  return result;
}

export function newGame(random: () => number): SolitaireState {
  const deck = shuffle(createDeck(), random);
  let cursor = 0;
  const tableau = Array.from({ length: TABLEAU_PILES }, (_, pile) =>
    Array.from({ length: pile + 1 }, (_, position) => {
      const card = deck[cursor]!;
      cursor += 1;
      return { ...card, faceUp: position === pile };
    }),
  );
  return {
    tableau,
    stock: deck.slice(cursor).map((card) => ({ ...card, faceUp: false })),
    waste: [],
    foundations: Array.from({ length: FOUNDATION_PILES }, () => []),
    moves: 0,
  };
}

export function draw(state: SolitaireState): SolitaireState {
  if (state.stock.length > 0) {
    const card = state.stock[state.stock.length - 1]!;
    return {
      ...state,
      stock: state.stock.slice(0, -1),
      waste: [...state.waste, { ...card, faceUp: true }],
      moves: state.moves + 1,
    };
  }
  if (state.waste.length === 0) return state;
  return {
    ...state,
    stock: [...state.waste].reverse().map((card) => ({ ...card, faceUp: false })),
    waste: [],
    moves: state.moves + 1,
  };
}

function isRun(cards: readonly Card[]): boolean {
  if (cards.length === 0) return false;
  return cards.every((card, index) => {
    if (!card.faceUp) return false;
    if (index === 0) return true;
    const above = cards[index - 1]!;
    return above.rank === card.rank + 1 && suitColor(above.suit) !== suitColor(card.suit);
  });
}

export function sourceCards(state: SolitaireState, source: MoveSource): readonly Card[] {
  if (source.kind === "waste") {
    const top = state.waste[state.waste.length - 1];
    return top ? [top] : [];
  }
  if (source.kind === "foundation") {
    const pile = state.foundations[source.pile];
    const top = pile?.[pile.length - 1];
    return top ? [top] : [];
  }
  const pile = state.tableau[source.pile];
  if (!pile || source.index < 0 || source.index >= pile.length) return [];
  const cards = pile.slice(source.index);
  return isRun(cards) ? cards : [];
}

function acceptsOnTableau(pile: readonly Card[], card: Card): boolean {
  const top = pile[pile.length - 1];
  if (!top) return card.rank === 13;
  return top.faceUp && top.rank === card.rank + 1 && suitColor(top.suit) !== suitColor(card.suit);
}

function acceptsOnFoundation(pile: readonly Card[], card: Card): boolean {
  const top = pile[pile.length - 1];
  if (!top) return card.rank === 1;
  return top.suit === card.suit && top.rank + 1 === card.rank;
}

export function canMove(state: SolitaireState, source: MoveSource, target: MoveTarget): boolean {
  const cards = sourceCards(state, source);
  const lead = cards[0];
  if (!lead) return false;
  if (source.kind === target.kind && source.pile === target.pile) return false;
  if (target.kind === "foundation") {
    if (source.kind === "foundation") return false;
    if (cards.length !== 1) return false;
    const pile = state.foundations[target.pile];
    return pile !== undefined && acceptsOnFoundation(pile, lead);
  }
  const pile = state.tableau[target.pile];
  return pile !== undefined && acceptsOnTableau(pile, lead);
}

function flipTop(pile: readonly Card[]): readonly Card[] {
  const top = pile[pile.length - 1];
  if (!top || top.faceUp) return pile;
  return [...pile.slice(0, -1), { ...top, faceUp: true }];
}

function withoutSource(state: SolitaireState, source: MoveSource, count: number): SolitaireState {
  if (source.kind === "waste") return { ...state, waste: state.waste.slice(0, -count) };
  if (source.kind === "foundation") {
    return {
      ...state,
      foundations: state.foundations.map((pile, index) => (index === source.pile ? pile.slice(0, -count) : pile)),
    };
  }
  return {
    ...state,
    tableau: state.tableau.map((pile, index) => (index === source.pile ? flipTop(pile.slice(0, source.index)) : pile)),
  };
}

function withTarget(state: SolitaireState, target: MoveTarget, cards: readonly Card[]): SolitaireState {
  const placed = cards.map((card) => ({ ...card, faceUp: true }));
  if (target.kind === "foundation") {
    return {
      ...state,
      foundations: state.foundations.map((pile, index) => (index === target.pile ? [...pile, ...placed] : pile)),
    };
  }
  return {
    ...state,
    tableau: state.tableau.map((pile, index) => (index === target.pile ? [...pile, ...placed] : pile)),
  };
}

export function move(state: SolitaireState, source: MoveSource, target: MoveTarget): SolitaireState | null {
  if (!canMove(state, source, target)) return null;
  const cards = sourceCards(state, source);
  const next = withTarget(withoutSource(state, source, cards.length), target, cards);
  return { ...next, moves: state.moves + 1 };
}

export function autoFoundationTarget(state: SolitaireState, source: MoveSource): MoveTarget | null {
  if (source.kind === "foundation") return null;
  const cards = sourceCards(state, source);
  if (cards.length !== 1) return null;
  const card = cards[0]!;
  const matching = state.foundations.findIndex((pile) => pile[pile.length - 1]?.suit === card.suit);
  const candidates =
    matching >= 0
      ? [matching]
      : state.foundations.map((_, index) => index).filter((index) => state.foundations[index]!.length === 0);
  for (const pile of candidates) {
    const target: MoveTarget = { kind: "foundation", pile };
    if (canMove(state, source, target)) return target;
  }
  return null;
}

export function isWon(state: SolitaireState): boolean {
  return state.foundations.length === FOUNDATION_PILES && state.foundations.every((pile) => pile.length === RANKS.length);
}
