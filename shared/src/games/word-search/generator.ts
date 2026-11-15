import type { Difficulty } from '../sudoku/types';
import type { WordLanguage, WordPlacement, WordSearchPuzzle } from './types';
import { WORDS } from './words/index';

/** A step from one letter to the next: `[dr, dc]`. */
export type WordDirection = readonly [dr: number, dc: number];

export interface WordSearchLevel {
  size: number;
  wordCount: number;
  /** The directions a word can take as it is read... */
  directions: readonly WordDirection[];
  /** ...and when true also the opposite of each one. */
  backwards: boolean;
}

const RIGHT: WordDirection = [0, 1];
const DOWN: WordDirection = [1, 0];
const DOWN_RIGHT: WordDirection = [1, 1];
const DOWN_LEFT: WordDirection = [1, -1];

/** The levels are the ones of the Sudoku, so that a room can restart with the same list of names. Each one adds a way to read the words. */
const LEVELS: Record<Difficulty, WordSearchLevel> = {
  beginner: { size: 8, wordCount: 6, directions: [RIGHT, DOWN], backwards: false },
  easy: { size: 10, wordCount: 8, directions: [RIGHT, DOWN, DOWN_RIGHT], backwards: false },
  medium: { size: 12, wordCount: 10, directions: [RIGHT, DOWN, DOWN_RIGHT, DOWN_LEFT], backwards: false },
  hard: { size: 14, wordCount: 12, directions: [RIGHT, DOWN, DOWN_RIGHT, DOWN_LEFT], backwards: true },
  expert: { size: 16, wordCount: 14, directions: [RIGHT, DOWN, DOWN_RIGHT, DOWN_LEFT], backwards: true },
};

/** The longest word of any puzzle, whatever the size of the grid. */
const MAX_WORD_LENGTH = 10;

/** A puzzle that cannot be finished (a word that does not fit, a forbidden word made only of placed letters) is thrown away and built again. */
const MAX_ATTEMPTS = 200;

/** The search also stops after this long. It runs on the one thread that serves every room, so it cannot take as long as the attempts allow. */
const MAX_BUILD_MS = 50;

/** Random places tried for one word before giving up on the whole attempt. */
const PLACE_TRIES = 60;

/** Rounds of re-rolling the filler letters that make a forbidden word or a second copy of a word: each one fixes almost everything, so a few are plenty. */
const MAX_SETTLE_ROUNDS = 30;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type Cell = readonly [r: number, c: number];

export function getWordSearchLevel(difficulty: Difficulty): WordSearchLevel {
  // Fail loudly: an unknown difficulty would otherwise give a grid of nothing.
  if (!Object.hasOwn(LEVELS, difficulty)) throw new Error(`Unknown difficulty: ${String(difficulty)}`);

  return LEVELS[difficulty];
}

/**
 * Builds a puzzle: picks the words at random, lays them in the grid, fills the rest with random letters and then
 * makes sure that the filler spells no forbidden word and that every word is in the grid exactly once, in any of
 * the 8 directions even where the level does not use them (a player may select a word from either end).
 * `forbidden` is what the filler must never spell: the server keeps that list, so that it does not travel to the page with the rest of this package.
 * It throws when it could not finish in time (a number of tries, or a few milliseconds).
 */
export function generateWordSearch(difficulty: Difficulty, language: WordLanguage, forbidden: readonly string[]): WordSearchPuzzle {
  const { size, wordCount, directions, backwards } = getWordSearchLevel(difficulty);
  if (!Object.hasOwn(WORDS, language)) throw new Error(`Unknown language: ${String(language)}`);

  const steps = backwards ? directions.flatMap((d): WordDirection[] => [d, [-d[0], -d[1]]]) : directions;
  const pool = WORDS[language].filter(word => word.length <= Math.min(size, MAX_WORD_LENGTH));

  const deadline = Date.now() + MAX_BUILD_MS;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // The first try is always made: the time only decides whether to go on.
    if (attempt > 0 && Date.now() > deadline) break;
    const picked = pickWords(pool, wordCount);
    const puzzle = picked && buildPuzzle(size, picked, steps, forbidden);
    if (puzzle) return puzzle;
  }

  throw new Error('Could not build a word search');
}

/**
 * Re-rolls the filler letters (the cells that are not `fixed`) until the grid has no forbidden word and each
 * placement reads its word exactly once, and says whether it got there. It gives up (false) when a problem is made
 * only of placed letters, since nothing can be changed, or after a few rounds. Changes the grid in place.
 */
export function settleFiller(grid: string[][], fixed: boolean[][], placements: readonly WordPlacement[], forbidden: readonly string[]): boolean {
  const lines = getLines(grid.length);

  for (let round = 0; round < MAX_SETTLE_ROUNDS; round++) {
    const dirty = fillerToReroll(grid, fixed, lines, placements, forbidden);
    if (dirty === null) return false;
    if (dirty.size === 0) return true;

    for (const [r, c] of dirty.values()) grid[r][c] = randomLetter();
  }

  return false;
}

/**
 * The filler cells behind every problem of the grid (a forbidden word, or a second copy of a word): an empty map when
 * there is none. A problem is cured by changing the filler it is made of, so one made only of placed letters cannot
 * be cured and the attempt is lost (null).
 */
function fillerToReroll(grid: string[][], fixed: boolean[][], lines: Cell[][], placements: readonly WordPlacement[], forbidden: readonly string[]): Map<number, Cell> | null {
  const size = grid.length;
  const texts = lines.map(line => line.map(([r, c]) => grid[r][c]).join(''));
  const dirty = new Map<number, Cell>();
  const blame = (hit: Cell[]): boolean => {
    const filler = hit.filter(([r, c]) => !fixed[r][c]);
    for (const cell of filler) dirty.set(cell[0] * size + cell[1], cell);
    return filler.length > 0;
  };

  for (const word of forbidden) {
    for (const hit of scanLines(lines, texts, word)) if (!blame(hit)) return null;
  }
  for (const placement of placements) {
    for (const hit of scanLines(lines, texts, placement.word)) {
      if (!isPlacement(hit, placement) && !blame(hit)) return null;
    }
  }

  return dirty;
}

/** Every place where the word is read in the grid, in any of the 8 directions, as the cells it covers. A word that reads the same both ways is counted once per place. */
export function findWordOccurrences(grid: string[][], word: string): Cell[][] {
  const lines = getLines(grid.length);
  const texts = lines.map(line => line.map(([r, c]) => grid[r][c]).join(''));

  return scanLines(lines, texts, word);
}

function buildPuzzle(size: number, picked: string[], steps: readonly WordDirection[], forbidden: readonly string[]): WordSearchPuzzle | null {
  const grid = Array.from({ length: size }, () => new Array<string>(size).fill(''));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const placements: WordPlacement[] = [];

  // The longest first: they are the ones that are hard to fit.
  for (const word of [...picked].sort((a, b) => b.length - a.length)) {
    const placement = placeWord(grid, fixed, word, steps);
    if (!placement) return null;
    placements.push(placement);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (!fixed[r][c]) grid[r][c] = randomLetter();
  }

  return settleFiller(grid, fixed, placements, forbidden) ? { size, grid, placements } : null;
}

/** Tries random places; letters of other words may be shared, but never changed. */
function placeWord(grid: string[][], fixed: boolean[][], word: string, steps: readonly WordDirection[]): WordPlacement | null {
  const size = grid.length;
  const last = word.length - 1;

  for (let attempt = 0; attempt < PLACE_TRIES; attempt++) {
    const [dr, dc] = steps[randomInt(steps.length)];
    const r = randomStart(size, dr * last);
    const c = randomStart(size, dc * last);
    let fits = true;
    for (let i = 0; i <= last && fits; i++) {
      const letter = grid[r + dr * i][c + dc * i];
      fits = letter === '' || letter === word[i];
    }
    if (!fits) continue;

    for (let i = 0; i <= last; i++) {
      grid[r + dr * i][c + dc * i] = word[i];
      fixed[r + dr * i][c + dc * i] = true;
    }
    return { word, r, c, dr, dc };
  }

  return null;
}

/** A start that keeps the other end of the word inside the grid. `reach` is how far the word goes, with its sign. */
function randomStart(size: number, reach: number): number {
  return randomInt(size - Math.abs(reach)) + (reach < 0 ? -reach : 0);
}

/** Picks words where none contains another, read forwards or backwards: that would make a word appear twice. */
function pickWords(pool: readonly string[], count: number): string[] | null {
  const order = [...pool];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }

  const picked: string[] = [];
  for (const word of order) {
    if (picked.some(other => overlaps(word, other))) continue;
    picked.push(word);
    if (picked.length === count) return picked;
  }

  return null;
}

function overlaps(a: string, b: string): boolean {
  const reversed = (word: string) => [...word].reverse().join('');
  return a.includes(b) || b.includes(a) || a.includes(reversed(b)) || b.includes(reversed(a));
}

function isPlacement(hit: Cell[], { r, c, dr, dc, word }: WordPlacement): boolean {
  const endR = r + dr * (word.length - 1);
  const endC = c + dc * (word.length - 1);
  const first = hit[0];
  const end = hit.at(-1) ?? first;
  const same = (a: Cell, row: number, col: number) => a[0] === row && a[1] === col;

  return (same(first, r, c) && same(end, endR, endC)) || (same(first, endR, endC) && same(end, r, c));
}

/** Looks for the word and for its reverse along each line; a line is read in one direction only, so that nothing is counted twice. */
function scanLines(lines: Cell[][], texts: string[], word: string): Cell[][] {
  const reversed = [...word].reverse().join('');
  const needles = reversed === word ? [word] : [word, reversed];
  const found: Cell[][] = [];

  lines.forEach((line, i) => {
    if (line.length < word.length) return;
    for (const needle of needles) {
      for (let at = texts[i].indexOf(needle); at !== -1; at = texts[i].indexOf(needle, at + 1)) found.push(line.slice(at, at + needle.length));
    }
  });

  return found;
}

const linesBySize = new Map<number, Cell[][]>();

/** Every row, column and diagonal of a square grid, each read in one direction (the reverse is looked for in the same text). */
function getLines(size: number): Cell[][] {
  const cached = linesBySize.get(size);
  if (cached) return cached;

  const lines: Cell[][] = [];
  const walk = (r: number, c: number, dr: number, dc: number) => {
    const line: Cell[] = [];
    for (; r >= 0 && r < size && c >= 0 && c < size; r += dr, c += dc) line.push([r, c]);
    lines.push(line);
  };
  for (let i = 0; i < size; i++) {
    walk(i, 0, 0, 1);
    walk(0, i, 1, 0);
    walk(0, i, 1, 1);
    walk(0, i, 1, -1);
    if (i > 0) {
      walk(i, 0, 1, 1);
      walk(i, size - 1, 1, -1);
    }
  }

  linesBySize.set(size, lines);
  return lines;
}

function randomInt(limit: number): number {
  return Math.floor(Math.random() * limit);
}

function randomLetter(): string {
  return LETTERS[randomInt(LETTERS.length)];
}
