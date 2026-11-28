import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, MEMORY_HAND_MS, MEMORY_MISMATCH_MS, getMemoryLevel } from '@nbg/shared';
import type { MemoryGame } from './roomStore';
import { closeHandOf, createMemory, flipCard, memoryStarted } from './memory';

/** A beginner deck whose faces are known: pairs of 0, 1, 2... side by side (0 0 1 1 2 2...), no luck involved. */
const deckOfPairs = (): MemoryGame => {
  const game = createMemory('beginner');
  game.deck = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  return game;
};

const T0 = 1_000_000;

describe('createMemory', () => {
  it.each(DIFFICULTIES)('starts with a deck of the level, nothing matched, no hands and no locks, %s', (level) => {
    const game = createMemory(level);

    expect(game).toMatchObject({ id: 'memory', difficulty: level, status: 'playing' });
    expect(game.deck).toHaveLength(getMemoryLevel(level).pairs * 2);
    expect(game.matched.size).toBe(0);
    expect(game.hands.size).toBe(0);
    expect(game.locks).toEqual([]);
  });
});

describe('flipCard', () => {
  it('opens a first card for the player, with its face and who flipped it', () => {
    const game = deckOfPairs();

    expect(flipCard(game, 'p1', 'ana', 2, T0)).toEqual({ flipped: { index: 2, face: 1, alias: 'ana' }, matched: null, mismatched: null, won: false });
    expect(game.hands.get('p1')).toEqual({ index: 2, alias: 'ana', until: T0 + MEMORY_HAND_MS });
  });

  it('matches a second card with the same face for good, to the alias of the player', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);

    const result = flipCard(game, 'p1', 'ana', 1, T0);

    expect(result).toMatchObject({ matched: [0, 1], mismatched: null, won: false });
    expect(game.matched.has(0)).toBe(true);
    expect(game.matched.has(1)).toBe(true);
    expect(game.hands.size).toBe(0);
    expect(game.locks).toEqual([]);
  });

  it('puts two cards that differ back down at once, and locks them for the time of the mismatch', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);

    const result = flipCard(game, 'p1', 'ana', 2, T0);

    expect(result).toMatchObject({ flipped: { index: 2, face: 1 }, matched: null, mismatched: [0, 2] });
    expect(game.hands.size).toBe(0);
    expect(game.matched.size).toBe(0);
    expect(game.locks).toEqual([{ indices: [0, 2], until: T0 + MEMORY_MISMATCH_MS }]);
  });

  it('refuses the locked cards, for anybody, until the time is over and not a moment before', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);
    flipCard(game, 'p1', 'ana', 2, T0);

    expect(flipCard(game, 'p2', 'bo', 0, T0 + MEMORY_MISMATCH_MS - 1)).toBeNull();
    expect(flipCard(game, 'p1', 'ana', 2, T0 + MEMORY_MISMATCH_MS - 1)).toBeNull();
    expect(game.hands.size).toBe(0);

    expect(flipCard(game, 'p2', 'bo', 0, T0 + MEMORY_MISMATCH_MS)).not.toBeNull();
    expect(game.locks).toEqual([]);
  });

  it('keeps a lock for each mismatch, and forgets the ones that ran out', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);
    flipCard(game, 'p1', 'ana', 2, T0);
    flipCard(game, 'p2', 'bo', 4, T0 + 500);
    flipCard(game, 'p2', 'bo', 6, T0 + 500);
    expect(game.locks).toHaveLength(2);

    flipCard(game, 'p1', 'ana', 8, T0 + MEMORY_MISMATCH_MS);

    expect(game.locks).toEqual([{ indices: [4, 6], until: T0 + 500 + MEMORY_MISMATCH_MS }]);
  });

  it('refuses a card somebody else holds face up, and the player\'s own', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);

    expect(flipCard(game, 'p2', 'bo', 0, T0)).toBeNull();
    expect(flipCard(game, 'p1', 'ana', 0, T0)).toBeNull();
    // Nothing changed for the one who held it: the second card still resolves against the first.
    expect(flipCard(game, 'p1', 'ana', 1, T0)).toMatchObject({ matched: [0, 1] });
  });

  it('lets each player hold their own card, and resolves each hand alone', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);
    flipCard(game, 'p2', 'bo', 2, T0);

    expect(flipCard(game, 'p2', 'bo', 3, T0)).toMatchObject({ matched: [2, 3] });
    expect(game.hands.get('p1')).toEqual({ index: 0, alias: 'ana', until: T0 + MEMORY_HAND_MS });
    expect(game.matched.has(2)).toBe(true);
  });

  it('refuses a matched card', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);
    flipCard(game, 'p1', 'ana', 1, T0);

    expect(flipCard(game, 'p2', 'bo', 0, T0)).toBeNull();
    expect(flipCard(game, 'p2', 'bo', 1, T0)).toBeNull();
    expect(game.hands.size).toBe(0);
  });

  it.each([-1, 12, 13, 1000, 0.5, Number.NaN, Infinity])('refuses a place that is not on the table (%s)', (index) => {
    const game = deckOfPairs();

    expect(flipCard(game, 'p1', 'ana', index, T0)).toBeNull();
    expect(game.hands.size).toBe(0);
  });

  it('wins when the last pair is matched, and refuses every flip after it', () => {
    const game = deckOfPairs();
    for (let index = 0; index < 10; index += 2) {
      flipCard(game, 'p1', 'ana', index, T0);
      expect(flipCard(game, 'p1', 'ana', index + 1, T0)).toMatchObject({ won: false });
    }
    flipCard(game, 'p2', 'bo', 10, T0);

    const last = flipCard(game, 'p2', 'bo', 11, T0);

    expect(last).toMatchObject({ matched: [10, 11], won: true });
    expect(game.status).toBe('won');
    expect(flipCard(game, 'p1', 'ana', 0, T0)).toBeNull();
  });

  it('does not flip in a game that is over, even a card that was never matched', () => {
    const game = deckOfPairs();
    game.status = 'won';

    expect(flipCard(game, 'p1', 'ana', 0, T0)).toBeNull();
  });
});

describe('a card held too long', () => {
  it('stays the player\'s until its time is over, and anybody can flip it from then on', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);

    expect(flipCard(game, 'p2', 'bo', 0, T0 + MEMORY_HAND_MS - 1)).toBeNull();
    expect(flipCard(game, 'p2', 'bo', 0, T0 + MEMORY_HAND_MS)).toMatchObject({ flipped: { index: 0, alias: 'bo' }, matched: null });
    expect(game.hands.has('p1')).toBe(false);
    expect(game.hands.get('p2')).toMatchObject({ index: 0 });
  });

  it('is gone from the hand of the player too: the next card they flip is a first card, not the second of a pair', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);

    expect(flipCard(game, 'p1', 'ana', 1, T0 + MEMORY_HAND_MS)).toEqual({ flipped: { index: 1, face: 0, alias: 'ana' }, matched: null, mismatched: null, won: false });
    expect(game.matched.size).toBe(0);
    expect(game.hands.get('p1')).toEqual({ index: 1, alias: 'ana', until: T0 + 2 * MEMORY_HAND_MS });
  });

  it('frees two players who each hold one card of the same pair, so that the pair can still be found', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);
    flipCard(game, 'p2', 'bo', 1, T0);
    // Each one holds half of the pair: neither can take the other half.
    expect(flipCard(game, 'p1', 'ana', 1, T0 + 1)).toBeNull();
    expect(flipCard(game, 'p2', 'bo', 0, T0 + 1)).toBeNull();

    const later = T0 + MEMORY_HAND_MS;
    flipCard(game, 'p1', 'ana', 0, later);
    expect(flipCard(game, 'p1', 'ana', 1, later)).toMatchObject({ matched: [0, 1] });
  });

  it('is not told to a player who comes in after its time, and is told with the time it has left before', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 4, T0);

    expect(memoryStarted(game, T0 + 4000).open).toEqual([{ index: 4, face: 2, alias: 'ana', closesInMs: MEMORY_HAND_MS - 4000 }]);
    expect(memoryStarted(game, T0 + MEMORY_HAND_MS).open).toEqual([]);
  });
});

describe('closeHandOf', () => {
  it('puts the card of the player back down and says which it was', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 4, T0);

    expect(closeHandOf(game, 'p1')).toBe(4);
    expect(game.hands.size).toBe(0);
    // The card can be flipped again, by anybody.
    expect(flipCard(game, 'p2', 'bo', 4, T0)).not.toBeNull();
  });

  it('does nothing for a player with an empty hand, or one who is not there, and leaves the others alone', () => {
    const game = deckOfPairs();
    flipCard(game, 'p2', 'bo', 4, T0);

    expect(closeHandOf(game, 'p1')).toBeNull();
    expect(closeHandOf(game, 'nobody')).toBeNull();
    expect(game.hands.size).toBe(1);
  });
});

describe('memoryStarted', () => {
  it('tells the matched and open cards with their faces, and the count of cards', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);
    flipCard(game, 'p1', 'ana', 1, T0);
    flipCard(game, 'p2', 'bo', 6, T0);

    expect(memoryStarted(game, T0)).toEqual({
      game: 'memory',
      difficulty: 'beginner',
      cards: 12,
      matched: [{ index: 0, face: 0 }, { index: 1, face: 0 }],
      open: [{ index: 6, face: 3, alias: 'bo', closesInMs: MEMORY_HAND_MS }],
    });
  });

  it('does not tell the face of any card that is hidden, and not the locked ones either', () => {
    const game = deckOfPairs();
    flipCard(game, 'p1', 'ana', 0, T0);
    flipCard(game, 'p1', 'ana', 2, T0);
    flipCard(game, 'p2', 'bo', 4, T0);

    const told = memoryStarted(game, T0);

    expect(told.matched).toEqual([]);
    expect(told.open).toEqual([{ index: 4, face: 2, alias: 'bo', closesInMs: MEMORY_HAND_MS }]);
    // The deck is not in the payload under any name.
    expect(JSON.stringify(told)).not.toContain('deck');
    expect(JSON.stringify(told)).not.toContain('locks');
  });
});
