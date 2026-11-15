import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../sudoku/types';
import { findWordOccurrences, generateWordSearch, getWordSearchLevel, settleFiller } from './generator';
import type { WordDirection } from './generator';
import { WORD_LANGUAGES } from './types';
import type { WordPlacement } from './types';
import { WORDS } from './words/index';

const ALL_DIRECTIONS: WordDirection[] = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
// Pairs of letters that are in no word of the lists but turn up all the time in random filler, so a generator that ignores the list gets caught at once. The real list lives in the backend.
const FORBIDDEN = ['QX', 'JZ', 'VK', 'ZQ', 'XJ', 'WQ'];

// Written apart from the generator on purpose: from every cell, in every direction, the cells that spell the word. A word that reads the same both ways is found twice there, hence the set of spans.
function countOccurrences(grid: string[][], word: string): number {
  const size = grid.length;
  const spans = new Set<string>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of ALL_DIRECTIONS) {
        const cells = [...word].map((_, i) => [r + dr * i, c + dc * i]);
        if (cells.some(([y, x]) => y < 0 || x < 0 || y >= size || x >= size)) continue;
        if (cells.every(([y, x], i) => grid[y][x] === word[i])) spans.add([cells[0], cells[cells.length - 1]].map(String).sort().join('|'));
      }
    }
  }
  return spans.size;
}

const read = (grid: string[][], { word, r, c, dr, dc }: WordPlacement) => [...word].map((_, i) => grid[r + dr * i]?.[c + dc * i]).join('');

describe('getWordSearchLevel', () => {
  it('gives the size, the words and the ways to read them of each level', () => {
    const summary = DIFFICULTIES.map(d => {
      const { size, wordCount, directions, backwards } = getWordSearchLevel(d);
      return [d, size, wordCount, directions.length, backwards];
    });

    expect(summary).toEqual([
      ['beginner', 8, 6, 2, false],
      ['easy', 10, 8, 3, false],
      ['medium', 12, 10, 4, false],
      ['hard', 14, 12, 4, true],
      ['expert', 16, 14, 4, true],
    ]);
  });

  it('starts with right and down, then adds the down-right and the down-left diagonals', () => {
    expect(getWordSearchLevel('beginner').directions).toEqual([[0, 1], [1, 0]]);
    expect(getWordSearchLevel('easy').directions).toContainEqual([1, 1]);
    expect(getWordSearchLevel('easy').directions).not.toContainEqual([1, -1]);
    expect(getWordSearchLevel('medium').directions).toContainEqual([1, -1]);
  });

  it('throws for a difficulty it does not know, also one that is an inherited property', () => {
    expect(() => getWordSearchLevel('impossible' as never)).toThrow('Unknown difficulty');
    expect(() => getWordSearchLevel('toString' as never)).toThrow('Unknown difficulty');
  });
});

describe('generateWordSearch', () => {
  describe.each(DIFFICULTIES.flatMap(d => WORD_LANGUAGES.map(l => [d, l] as const)))('%s, %s', (difficulty, language) => {
    const { size, wordCount, directions, backwards } = getWordSearchLevel(difficulty);
    const allowed = new Set((backwards ? directions.flatMap(([dr, dc]) => [[dr, dc], [-dr, -dc]]) : directions).map(String));
    const runs = Array.from({ length: 5 }, () => generateWordSearch(difficulty, language, FORBIDDEN));

    it('gives a square grid of single capital letters', () => {
      for (const puzzle of runs) {
        expect(puzzle.size).toBe(size);
        expect(puzzle.grid).toHaveLength(size);
        for (const row of puzzle.grid) {
          expect(row).toHaveLength(size);
          for (const letter of row) expect(letter).toMatch(/^[A-Z]$/);
        }
      }
    });

    it('has the number of words of the level, all different, from the list of the language', () => {
      for (const { placements } of runs) {
        const words = placements.map(p => p.word);
        expect(words).toHaveLength(wordCount);
        expect(new Set(words).size).toBe(wordCount);
        for (const word of words) {
          expect(WORDS[language]).toContain(word);
          expect(word.length).toBeLessThanOrEqual(Math.min(size, 10));
        }
      }
    });

    it('lays each word only in the directions of the level', () => {
      for (const { placements } of runs) for (const p of placements) expect(allowed.has(String([p.dr, p.dc]))).toBe(true);
    });

    it('has every placement reading its word in the grid, inside it', () => {
      for (const { grid, placements } of runs) {
        for (const p of placements) {
          expect(read(grid, p)).toBe(p.word);
          const endR = p.r + p.dr * (p.word.length - 1);
          const endC = p.c + p.dc * (p.word.length - 1);
          for (const n of [p.r, p.c, endR, endC]) expect(n >= 0 && n < size).toBe(true);
        }
      }
    });

    it('has every word exactly once, in any of the 8 directions', () => {
      for (const { grid, placements } of runs) for (const { word } of placements) expect(countOccurrences(grid, word)).toBe(1);
    });

    it('spells no forbidden word, in any language or direction', () => {
      for (const { grid } of runs) for (const bad of FORBIDDEN) expect(countOccurrences(grid, bad)).toBe(0);
    });
  });

  it('gives different puzzles each time', () => {
    const grids = new Set(Array.from({ length: 5 }, () => generateWordSearch('medium', 'en', FORBIDDEN).grid.flat().join('')));

    expect(grids.size).toBeGreaterThan(1);
  });

  it('throws for a difficulty or a language it does not know', () => {
    expect(() => generateWordSearch('impossible' as never, 'en', FORBIDDEN)).toThrow('Unknown difficulty');
    expect(() => generateWordSearch('easy', 'xx' as never, FORBIDDEN)).toThrow('Unknown language');
    expect(() => generateWordSearch('easy', 'toString' as never, FORBIDDEN)).toThrow('Unknown language');
  });

  it('never takes long, level after level', () => {
    // A generous bound: the real limit is a few tens of milliseconds, this only catches a search that has got lost.
    for (const difficulty of DIFFICULTIES) {
      for (const language of WORD_LANGUAGES) {
        for (let run = 0; run < 20; run++) {
          const start = Date.now();
          generateWordSearch(difficulty, language, FORBIDDEN);
          expect(Date.now() - start).toBeLessThan(1000);
        }
      }
    }
  });
});

describe('findWordOccurrences', () => {
  const blank = () => Array.from({ length: 8 }, () => new Array<string>(8).fill('Z'));

  it.each(ALL_DIRECTIONS.map(d => [String(d), d] as const))('finds a word planted in direction %s', (_name, [dr, dc]) => {
    const grid = blank();
    for (let i = 0; i < 4; i++) grid[3 + dr * i][3 + dc * i] = 'ABCD'[i];

    const found = findWordOccurrences(grid, 'ABCD');

    expect(found).toHaveLength(1);
    expect(found[0].map(String).sort()).toEqual([0, 1, 2, 3].map(i => String([3 + dr * i, 3 + dc * i])).sort());
  });

  it('counts a word that reads the same both ways once', () => {
    const grid = blank();
    [...'ABCBA'].forEach((letter, i) => { grid[2][i + 1] = letter; });

    expect(findWordOccurrences(grid, 'ABCBA')).toHaveLength(1);
  });

  it('finds nothing when the word is not there, or only broken', () => {
    const grid = blank();
    [...'ABCD'].forEach((letter, i) => { grid[0][i * 2] = letter; });

    expect(findWordOccurrences(grid, 'ABCD')).toEqual([]);
  });
});

describe('settleFiller', () => {
  const blank = () => Array.from({ length: 8 }, () => new Array<string>(8).fill('Z'));
  const free = () => Array.from({ length: 8 }, () => new Array<boolean>(8).fill(false));

  it.each(ALL_DIRECTIONS.map(d => [String(d), d] as const))('re-rolls a forbidden word made of filler, in direction %s', (_name, [dr, dc]) => {
    const grid = blank();
    for (let i = 0; i < 4; i++) grid[3 + dr * i][3 + dc * i] = 'ABCD'[i];

    expect(settleFiller(grid, free(), [], ['ABCD'])).toBe(true);
    expect(findWordOccurrences(grid, 'ABCD')).toEqual([]);
  });

  it('only changes the cells of the problem', () => {
    const grid = blank();
    [...'ABCD'].forEach((letter, i) => { grid[0][i] = letter; });

    settleFiller(grid, free(), [], ['ABCD']);

    expect(grid.slice(1).flat().every(letter => letter === 'Z')).toBe(true);
  });

  it('gives up on a forbidden word that is made only of placed letters', () => {
    const grid = blank();
    [...'ABCD'].forEach((letter, i) => { grid[0][i] = letter; });
    const fixed = free();
    for (let i = 0; i < 4; i++) fixed[0][i] = true;

    expect(settleFiller(grid, fixed, [], ['ABCD'])).toBe(false);
  });

  it('re-rolls the filler of a forbidden word that uses a placed letter, and keeps the placed one', () => {
    const grid = blank();
    [...'ABCD'].forEach((letter, i) => { grid[0][i] = letter; });
    const fixed = free();
    fixed[0][0] = true;

    expect(settleFiller(grid, fixed, [], ['ABCD'])).toBe(true);
    expect(grid[0][0]).toBe('A');
    expect(findWordOccurrences(grid, 'ABCD')).toEqual([]);
  });

  it('removes a second copy of a placed word and keeps the placed one', () => {
    const grid = blank();
    const fixed = free();
    [...'ABCD'].forEach((letter, i) => { grid[0][i] = letter; fixed[0][i] = true; });
    // The second copy is in the filler, read from the bottom up and backwards.
    [...'DCBA'].forEach((letter, i) => { grid[7 - i][5] = letter; });
    const placement: WordPlacement = { word: 'ABCD', r: 0, c: 0, dr: 0, dc: 1 };

    expect(settleFiller(grid, fixed, [placement], [])).toBe(true);
    expect(findWordOccurrences(grid, 'ABCD')).toHaveLength(1);
    expect(grid[0].slice(0, 4).join('')).toBe('ABCD');
  });

  it('gives up when the second copy is made only of placed letters', () => {
    const grid = blank();
    const fixed = free();
    [...'ABCD'].forEach((letter, i) => { grid[0][i] = letter; grid[1][i] = letter; fixed[0][i] = true; fixed[1][i] = true; });
    const placement: WordPlacement = { word: 'ABCD', r: 0, c: 0, dr: 0, dc: 1 };

    expect(settleFiller(grid, fixed, [placement], [])).toBe(false);
  });

  it('is true and changes nothing when there is no problem', () => {
    const grid = blank();

    expect(settleFiller(grid, free(), [], ['ABCD'])).toBe(true);
    expect(grid).toEqual(blank());
  });
});
