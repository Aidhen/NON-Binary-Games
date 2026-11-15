import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES } from '../sudoku/types';
import { generateWordSearch, getWordSearchLevel, warmUpWordSearch } from './generator';
import { WORD_LANGUAGES } from './types';
import type { WordDirection, WordLanguage, WordSearchPuzzle } from './types';
import { WORDS } from './words/index';

const ALL_DIRECTIONS: WordDirection[] = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
// Pairs of letters that are in no word of the lists, so a generator that ignores the list gets caught at once only if it makes letters up. The real list lives in the backend.
const FORBIDDEN = ['QX', 'JZ', 'VK', 'ZQ', 'XJ', 'WQ'];
const RUNS = 100;

/** Small seeded generator (mulberry32), so that a failure can be played again. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const reversed = (word: string) => [...word].reverse().join('');

// Written apart from the generator on purpose, and brute force: from every cell, in every direction, the cells that spell the word. A word that reads the same both ways is found twice there, hence the set of spans.
function countOccurrences(grid: string[][], word: string): number {
  const size = grid.length;
  const spans = new Set<string>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of ALL_DIRECTIONS) {
        const endR = r + dr * (word.length - 1);
        const endC = c + dc * (word.length - 1);
        if (endR < 0 || endC < 0 || endR >= size || endC >= size) continue;
        let spells = true;
        for (let i = 0; i < word.length && spells; i++) spells = grid[r + dr * i][c + dc * i] === word[i];
        if (spells) spans.add([[r, c], [endR, endC]].map(String).sort().join('|'));
      }
    }
  }
  return spans.size;
}

/** Everything a puzzle promises, checked without the code that made it. Gives the list of what is wrong, empty when all is well. */
function check(puzzle: WordSearchPuzzle, size: number, allowed: Set<string>, language: WordLanguage, forbidden: readonly string[]): string[] {
  const errors: string[] = [];
  const { grid, placements, hidden } = puzzle;
  if (puzzle.size !== size || grid.length !== size) errors.push('size');
  for (const row of grid) if (row.length !== size || !row.every(letter => /^[A-Z]$/.test(letter))) errors.push('letters');

  const covered = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  for (const { word, r, c, dr, dc } of placements) {
    if (word.length < 4 || word.length > Math.min(size, 10)) errors.push(`length of ${word}`);
    if (!WORDS[language].includes(word)) errors.push(`${word} is not in the list`);
    if (!allowed.has(String([dr, dc]))) errors.push(`direction of ${word}`);
    for (let i = 0; i < word.length; i++) {
      const y = r + dr * i;
      const x = c + dc * i;
      if (y < 0 || x < 0 || y >= size || x >= size) { errors.push(`${word} leaves the grid`); break; }
      if (grid[y][x] !== word[i]) errors.push(`${word} is not in the grid where it says`);
      covered[y][x] = true;
    }
  }

  const words = placements.map(p => p.word);
  if (new Set(words).size !== words.length) errors.push('a word twice');
  for (const a of words) for (const b of words) if (a !== b && (a.includes(b) || a.includes(reversed(b)))) errors.push(`${a} contains ${b}`);
  for (const word of words) if (countOccurrences(grid, word) !== 1) errors.push(`${word} is not there exactly once`);
  for (const word of forbidden) if (countOccurrences(grid, word) > 0) errors.push(`forbidden ${word}`);

  const left: [number, number][] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!covered[r][c]) left.push([r, c]);
  if (left.length < 4 || left.length > 10) errors.push(`${left.length} cells left`);
  if (left.map(([r, c]) => grid[r][c]).join('') !== hidden.word) errors.push('the cells left do not spell the hidden word');
  if (JSON.stringify(left) !== JSON.stringify(hidden.cells)) errors.push('the cells of the hidden word');
  if (hidden.cells.length !== hidden.word.length) errors.push('length of the hidden word');
  if (!WORDS[language].includes(hidden.word)) errors.push('the hidden word is not in the list');
  if (words.includes(hidden.word)) errors.push('the hidden word is one of the words to find');
  for (const word of forbidden) if (hidden.word.includes(word) || hidden.word.includes(reversed(word))) errors.push('the hidden word is forbidden');

  return errors;
}

describe('getWordSearchLevel', () => {
  it('gives the size and the ways to read the words of each level', () => {
    const summary = DIFFICULTIES.map(d => {
      const { size, directions, backwards } = getWordSearchLevel(d);
      return [d, size, directions.length, backwards];
    });

    expect(summary).toEqual([
      ['beginner', 6, 2, false],
      ['easy', 7, 3, false],
      ['medium', 8, 4, false],
      ['hard', 10, 4, true],
      ['expert', 12, 4, true],
    ]);
  });

  it('has no number of words: it follows from the packing', () => {
    expect(Object.keys(getWordSearchLevel('easy')).sort()).toEqual(['backwards', 'directions', 'size']);
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
    const { size, directions, backwards } = getWordSearchLevel(difficulty);
    const allowed = new Set((backwards ? directions.flatMap(([dr, dc]) => [[dr, dc], [-dr, -dc]]) : directions).map(String));
    let runs: WordSearchPuzzle[] = [];

    beforeAll(() => {
      vi.spyOn(Math, 'random').mockImplementation(seeded(difficulty.length * 1000 + language.charCodeAt(0)));
      runs = Array.from({ length: RUNS }, () => generateWordSearch(difficulty, language, FORBIDDEN));
    });
    afterAll(() => vi.restoreAllMocks());

    it('gives puzzles that keep every promise of the rules, run after run', () => {
      expect(runs.flatMap(puzzle => check(puzzle, size, allowed, language, FORBIDDEN))).toEqual([]);
    });

    it('leaves 4 to 10 cells for a hidden word that is not one of the words to find', () => {
      for (const { hidden, placements } of runs) {
        expect(hidden.word.length).toBeGreaterThanOrEqual(4);
        expect(hidden.word.length).toBeLessThanOrEqual(10);
        expect(hidden.cells).toHaveLength(hidden.word.length);
        expect(placements.map(p => p.word)).not.toContain(hidden.word);
      }
    });
  });

  it('keeps the words that are forbidden out of the grid, the words to find and the hidden word', () => {
    const forbidden = ['OVER', 'STAR', 'LINE'];
    vi.spyOn(Math, 'random').mockImplementation(seeded(7));
    try {
      const runs = Array.from({ length: RUNS }, () => generateWordSearch('medium', 'en', forbidden));

      expect(runs.flatMap(puzzle => check(puzzle, 8, new Set(['0,1', '1,0', '1,1', '1,-1']), 'en', forbidden))).toEqual([]);
    } finally {
      vi.restoreAllMocks();
    }
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

  it('works with no forbidden words at all', () => {
    expect(check(generateWordSearch('easy', 'en', []), 7, new Set(['0,1', '1,0', '1,1']), 'en', [])).toEqual([]);
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

describe('warmUpWordSearch', () => {
  it('prepares every language and size, and the puzzles that come after are as good as any', () => {
    const forbidden = [...FORBIDDEN];

    expect(() => warmUpWordSearch(forbidden)).not.toThrow();

    for (const difficulty of DIFFICULTIES) {
      const { size, directions, backwards } = getWordSearchLevel(difficulty);
      const allowed = new Set((backwards ? directions.flatMap(([dr, dc]) => [[dr, dc], [-dr, -dc]]) : directions).map(String));
      for (const language of WORD_LANGUAGES) expect(check(generateWordSearch(difficulty, language, forbidden), size, allowed, language, forbidden)).toEqual([]);
    }
  });
});
