import { describe, expect, it } from 'vitest';
import { isSolved, resolveSelection } from './validator';
import type { WordPlacement, WordSearchPuzzle } from './types';

// The letters do not matter to the validator, only where the words lie: 8x8, one word of each kind.
const placements: WordPlacement[] = [
  { word: 'ROW', r: 1, c: 2, dr: 0, dc: 1 }, // (1,2) to (1,4)
  { word: 'COLUMN', r: 0, c: 7, dr: 1, dc: 0 }, // (0,7) to (5,7)
  { word: 'DIAGONAL', r: 0, c: 0, dr: 1, dc: 1 }, // (0,0) to (7,7)
  { word: 'ANTI', r: 2, c: 6, dr: 1, dc: -1 }, // (2,6) to (5,3)
  { word: 'LEFT', r: 6, c: 5, dr: 0, dc: -1 }, // (6,5) to (6,2), laid backwards
];
const puzzle: WordSearchPuzzle = { size: 8, grid: Array.from({ length: 8 }, () => new Array<string>(8).fill('A')), placements, hidden: { word: 'ABCD', cells: [[7, 0], [7, 1], [7, 2], [7, 3]] } };
const none: ReadonlySet<string> = new Set();

describe('resolveSelection', () => {
  it('finds a word from its first cell to its last', () => {
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 1, c: 4 })).toBe(placements[0]);
  });

  it('finds it as well when the ends come the other way round', () => {
    expect(resolveSelection(puzzle, none, { r: 1, c: 4 }, { r: 1, c: 2 })).toBe(placements[0]);
  });

  it.each([
    ['a column', placements[1], { r: 0, c: 7 }, { r: 5, c: 7 }],
    ['a diagonal', placements[2], { r: 0, c: 0 }, { r: 7, c: 7 }],
    ['the other diagonal', placements[3], { r: 2, c: 6 }, { r: 5, c: 3 }],
    ['a word laid backwards', placements[4], { r: 6, c: 5 }, { r: 6, c: 2 }],
  ])('finds %s, from either end', (_name, placement, a, b) => {
    expect(resolveSelection(puzzle, none, a, b)).toBe(placement);
    expect(resolveSelection(puzzle, none, b, a)).toBe(placement);
  });

  it('rejects a cell outside the grid, on either end', () => {
    expect(resolveSelection(puzzle, none, { r: -1, c: 2 }, { r: 1, c: 2 })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 1, c: 8 })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 8, c: 7 }, { r: 0, c: 7 })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 0, c: 7 }, { r: 0, c: -1 })).toBeNull();
  });

  it('rejects a cell that is not a whole number', () => {
    expect(resolveSelection(puzzle, none, { r: 1.5, c: 2 }, { r: 1, c: 4 })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 1, c: Number.NaN })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 1, c: Infinity })).toBeNull();
  });

  it('rejects two cells that are not on a straight line', () => {
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 2, c: 4 })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 0, c: 0 }, { r: 7, c: 6 })).toBeNull();
  });

  it('rejects a span that is longer or shorter than the word', () => {
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 1, c: 5 })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 1, c: 3 })).toBeNull();
    expect(resolveSelection(puzzle, none, { r: 0, c: 0 }, { r: 6, c: 6 })).toBeNull();
  });

  it('rejects a span that is right but starts one cell off', () => {
    expect(resolveSelection(puzzle, none, { r: 1, c: 3 }, { r: 1, c: 5 })).toBeNull();
  });

  it('rejects a single cell', () => {
    expect(resolveSelection(puzzle, none, { r: 1, c: 2 }, { r: 1, c: 2 })).toBeNull();
  });

  it('rejects a word that is already found, from either end', () => {
    const found = new Set(['ROW']);

    expect(resolveSelection(puzzle, found, { r: 1, c: 2 }, { r: 1, c: 4 })).toBeNull();
    expect(resolveSelection(puzzle, found, { r: 1, c: 4 }, { r: 1, c: 2 })).toBeNull();
    expect(resolveSelection(puzzle, found, { r: 0, c: 7 }, { r: 5, c: 7 })).toBe(placements[1]);
  });
});

describe('isSolved', () => {
  it('is false until every word is found', () => {
    expect(isSolved(puzzle, none)).toBe(false);
    expect(isSolved(puzzle, new Set(['ROW', 'COLUMN', 'DIAGONAL', 'ANTI']))).toBe(false);
  });

  it('is true when every word is found', () => {
    expect(isSolved(puzzle, new Set(placements.map(p => p.word)))).toBe(true);
  });

  it('ignores found words that are not in the puzzle', () => {
    expect(isSolved(puzzle, new Set(['OTHER']))).toBe(false);
  });
});
