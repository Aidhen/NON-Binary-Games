import { describe, expect, it } from 'vitest';
import type { WordPlacement, WordSearchPuzzle } from '@nbg/shared';
import type { RoomGame, WordSearchGame } from './roomStore';
import { createWordSearch, selectWord, wordSearchStarted } from './wordSearch';

/** A 5x5 puzzle made by hand: CAT on the first row, DOG down the last column from row 1, ANT backwards on the last row. */
const PLACEMENTS: WordPlacement[] = [
  { word: 'DOG', r: 1, c: 4, dr: 1, dc: 0 },
  { word: 'CAT', r: 0, c: 0, dr: 0, dc: 1 },
  { word: 'ANT', r: 4, c: 4, dr: 0, dc: -1 },
];

const handMade = (): WordSearchGame => {
  const grid = Array.from({ length: 5 }, () => new Array<string>(5).fill('X'));
  for (const { word, r, c, dr, dc } of PLACEMENTS) [...word].forEach((letter, i) => { grid[r + dr * i][c + dc * i] = letter; });
  const puzzle: WordSearchPuzzle = { size: 5, grid, placements: PLACEMENTS.map(placement => ({ ...placement })) };
  return { id: 'word-search', difficulty: 'beginner', language: 'en', puzzle, found: new Map(), status: 'playing' };
};

describe('createWordSearch', () => {
  it('starts in English with nothing found', () => {
    const game = createWordSearch('beginner');

    expect(game).toMatchObject({ id: 'word-search', difficulty: 'beginner', language: 'en', status: 'playing' });
    expect(game.puzzle.size).toBe(8);
    expect(game.found.size).toBe(0);
  });

  it('keeps the language from the Word Search the room was playing, and only from a Word Search', () => {
    const before = createWordSearch('easy');
    before.language = 'it';

    expect(createWordSearch('hard', before).language).toBe('it');
    expect(createWordSearch('hard', { id: 'sudoku' } as RoomGame).language).toBe('en');
  });
});

describe('wordSearchStarted', () => {
  it('tells the grid and the words in alphabetical order, and nothing about where they lie', () => {
    const game = handMade();

    const payload = wordSearchStarted(game);

    expect(payload).toMatchObject({ game: 'word-search', size: 5, difficulty: 'beginner', language: 'en', words: ['ANT', 'CAT', 'DOG'], found: [] });
    expect(payload.grid).toEqual(game.puzzle.grid);
    expect(JSON.stringify(payload)).not.toMatch(/placements|"dr"|"dc"/);
  });

  it('tells where the words found lie, with who found them', () => {
    const game = handMade();
    selectWord(game, { r: 0, c: 0 }, { r: 0, c: 2 }, 'ana');

    expect(wordSearchStarted(game).found).toEqual([{ word: 'CAT', alias: 'ana', from: { r: 0, c: 0 }, to: { r: 0, c: 2 } }]);
  });
});

describe('selectWord', () => {
  it('records who found the word, with the ends of the placement', () => {
    const game = handMade();

    const result = selectWord(game, { r: 1, c: 4 }, { r: 3, c: 4 }, 'ana');

    expect(result).toEqual({ found: { word: 'DOG', alias: 'ana', from: { r: 1, c: 4 }, to: { r: 3, c: 4 } }, won: false });
    expect(game.found.get('DOG')?.alias).toBe('ana');
  });

  it('accepts the ends in either order and answers with the ends of the placement', () => {
    const game = handMade();

    const result = selectWord(game, { r: 3, c: 4 }, { r: 1, c: 4 }, 'ana');

    expect(result!.found).toMatchObject({ word: 'DOG', from: { r: 1, c: 4 }, to: { r: 3, c: 4 } });
  });

  it('does nothing for what is not a word, or a word that is found already', () => {
    const game = handMade();

    expect(selectWord(game, { r: 0, c: 0 }, { r: 0, c: 1 }, 'ana')).toBeNull();
    expect(selectWord(game, { r: 0, c: 0 }, { r: 2, c: 1 }, 'ana')).toBeNull();
    expect(selectWord(game, { r: 0, c: 0 }, { r: 0, c: 9 }, 'ana')).toBeNull();
    expect(selectWord(game, { r: 0, c: 0 }, { r: 0, c: 2 }, 'ana')).not.toBeNull();
    expect(selectWord(game, { r: 0, c: 2 }, { r: 0, c: 0 }, 'bo')).toBeNull();
    expect(game.found.get('CAT')?.alias).toBe('ana');
  });

  it('wins with the last word, and then does nothing', () => {
    const game = handMade();
    selectWord(game, { r: 0, c: 0 }, { r: 0, c: 2 }, 'ana');
    selectWord(game, { r: 1, c: 4 }, { r: 3, c: 4 }, 'ana');

    const last = selectWord(game, { r: 4, c: 2 }, { r: 4, c: 4 }, 'bo');

    expect(last!.won).toBe(true);
    expect(game.status).toBe('won');
    game.found.delete('CAT');
    expect(selectWord(game, { r: 0, c: 0 }, { r: 0, c: 2 }, 'ana')).toBeNull();
  });
});
