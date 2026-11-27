import { MEMORY_HAND_MS, MEMORY_MISMATCH_MS, generateMemory } from "@nbg/shared";
import type { DifficultyLevel, MemoryCardShown, MemoryStartedPayload } from "@nbg/shared";
import type { MemoryGame } from "./roomStore";

export const createMemory = (difficulty: DifficultyLevel): MemoryGame => ({
  id: 'memory',
  difficulty,
  deck: generateMemory(difficulty),
  matched: new Map(),
  hands: new Map(),
  locks: [],
  status: 'playing',
});

/**
 * What the players are told about the game: the faces of the cards that are matched or open, and nothing about the
 * rest. A card that is locked after a mismatch is hidden here too: whoever sees the table now was not there to see it.
 * A card held past its time is hidden as well, although the server forgets the hand only at the next flip.
 */
export const memoryStarted = (game: MemoryGame, now: number = Date.now()): MemoryStartedPayload => ({
  game: 'memory',
  difficulty: game.difficulty,
  cards: game.deck.length,
  matched: [...game.matched].map(([index, alias]) => ({ index, face: game.deck[index], alias })),
  open: [...game.hands.values()]
    .filter(({ until }) => until > now)
    .map(({ index, alias, until }) => ({ index, face: game.deck[index], alias, closesInMs: until - now })),
});

export interface FlipResult {
  /** The card that was turned, to tell the room. */
  flipped: MemoryCardShown;
  /** The two cards that matched, when this was the second card of a pair. */
  matched: [number, number] | null;
  /** The two cards that did not, when this was the second card and another one. They are locked now. */
  mismatched: [number, number] | null;
  won: boolean;
}

const isOpen = (game: MemoryGame, index: number): boolean => {
  for (const hand of game.hands.values()) if (hand.index === index) return true;
  return false;
};

const isLocked = (game: MemoryGame, index: number): boolean => game.locks.some(({ indices }) => indices.includes(index));

/**
 * Flips a card. Returns null when the move does not apply: the game is over, the place is not on the table, the
 * card is matched, open (in any hand, the player's own included) or locked. `index` must be an integer: its
 * upper bound is the deck, checked here too, since a handler that forgets it would read `undefined` as a face.
 * `now` is a timestamp in ms: the lock of a mismatch and the time a card can be held are times to compare with, not timers.
 */
export const flipCard = (game: MemoryGame, playerId: string, alias: string, index: number, now: number): FlipResult | null => {
  if (game.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= game.deck.length) return null;

  // The locks that ran out are forgotten here, so that the list stays as short as the cards that are really waiting.
  game.locks = game.locks.filter(({ until }) => until > now);
  // The same for the cards held too long: they went back down on every screen, and now they do here. The player's own
  // too, so that a card flipped after it is a first card again and not the second of a pair nobody can see.
  for (const [playerId, hand] of game.hands) if (hand.until <= now) game.hands.delete(playerId);
  if (game.matched.has(index) || isOpen(game, index) || isLocked(game, index)) return null;

  const face = game.deck[index];
  const flipped = { index, face, alias };
  const first = game.hands.get(playerId);

  if (!first) {
    game.hands.set(playerId, { index, alias, until: now + MEMORY_HAND_MS });
    return { flipped, matched: null, mismatched: null, won: false };
  }

  game.hands.delete(playerId);
  if (game.deck[first.index] === face) {
    game.matched.set(first.index, alias);
    game.matched.set(index, alias);
    const won = game.matched.size === game.deck.length;
    if (won) game.status = 'won';
    return { flipped, matched: [first.index, index], mismatched: null, won };
  }

  game.locks.push({ indices: [first.index, index], until: now + MEMORY_MISMATCH_MS });
  return { flipped, matched: null, mismatched: [first.index, index], won: false };
};

/** The card a player holds goes back down, when they leave. Returns its place, or null when they held none. */
export const closeHandOf = (game: MemoryGame, playerId: string): number | null => {
  const hand = game.hands.get(playerId);
  if (!hand) return null;

  game.hands.delete(playerId);
  return hand.index;
};
