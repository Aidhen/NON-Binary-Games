import type { Difficulty } from '../sudoku/types';
import { buildPackTable, packWordSearch } from './packer';
import type { PackTable } from './packer';
import { WORD_LANGUAGES } from './types';
import type { WordDirection, WordLanguage, WordSearchPuzzle } from './types';
import { WORDS } from './words/index';

export interface WordSearchLevel {
  size: number;
  /** The directions a word can take as it is read... */
  directions: readonly WordDirection[];
  /** ...and when true also the opposite of each one. */
  backwards: boolean;
}

const RIGHT: WordDirection = [0, 1];
const DOWN: WordDirection = [1, 0];
const DOWN_RIGHT: WordDirection = [1, 1];
const DOWN_LEFT: WordDirection = [1, -1];

/**
 * The levels are the ones of the Sudoku, so that a room can restart with the same list of names. Each one adds a way to read the words.
 * The grids are small because they are packed: the number of words is whatever it takes to cover them.
 */
const LEVELS: Record<Difficulty, WordSearchLevel> = {
  beginner: { size: 6, directions: [RIGHT, DOWN], backwards: false },
  easy: { size: 7, directions: [RIGHT, DOWN, DOWN_RIGHT], backwards: false },
  medium: { size: 8, directions: [RIGHT, DOWN, DOWN_RIGHT, DOWN_LEFT], backwards: false },
  hard: { size: 10, directions: [RIGHT, DOWN, DOWN_RIGHT, DOWN_LEFT], backwards: true },
  expert: { size: 12, directions: [RIGHT, DOWN, DOWN_RIGHT, DOWN_LEFT], backwards: true },
};

/** An attempt that leaves too many cells over, or cannot spell a hidden word, is thrown away and made again. Nearly every attempt works, so this is only a bound. */
const MAX_ATTEMPTS = 200;

/** The search also stops after this long. It runs on the one thread that serves every room, so it cannot take as long as the attempts allow. */
const MAX_BUILD_MS = 50;

/** Tries made whatever the clock says. A try fails now and then (a few in a hundred), and on a slow machine or at a cold start one try can take longer than the whole time: without these, one unlucky try would become an error for the players. */
const MIN_ATTEMPTS = 5;

export function getWordSearchLevel(difficulty: Difficulty): WordSearchLevel {
  // Fail loudly: an unknown difficulty would otherwise give a grid of nothing.
  if (!Object.hasOwn(LEVELS, difficulty)) throw new Error(`Unknown difficulty: ${String(difficulty)}`);

  return LEVELS[difficulty];
}

// The tables take about 60 ms to build and a puzzle about 5, so they are kept. They are kept per list of forbidden words (the list itself is the key, not its content): a caller that makes a new array for each puzzle gets no cache.
const tables = new WeakMap<readonly string[], Map<string, PackTable>>();

function getTable(difficulty: Difficulty, language: WordLanguage, forbidden: readonly string[]): PackTable {
  const { size, directions, backwards } = getWordSearchLevel(difficulty);
  if (!Object.hasOwn(WORDS, language)) throw new Error(`Unknown language: ${String(language)}`);

  const bySize = tables.get(forbidden) ?? new Map<string, PackTable>();
  tables.set(forbidden, bySize);
  const key = `${language}:${size}`;
  let table = bySize.get(key);
  if (!table) {
    const steps = backwards ? directions.flatMap((d): WordDirection[] => [d, [-d[0], -d[1]]]) : directions;
    table = buildPackTable(language, size, steps, forbidden);
    bySize.set(key, table);
  }

  return table;
}

/** Builds the tables of every language and size for this list of forbidden words, so that the first player to start a Word Search does not wait for them. */
export function warmUpWordSearch(forbidden: readonly string[]): void {
  for (const difficulty of Object.keys(LEVELS) as Difficulty[]) {
    for (const language of WORD_LANGUAGES) getTable(difficulty, language, forbidden);
  }
}

/**
 * Builds a puzzle: the grid is packed with words, one after the other, until what no word covers is 4 to 10 cells, and
 * those cells spell the hidden word, a word of the list that is not one of the words to find. There is no random filler.
 * Every word to find is in the grid exactly once, in any of the 8 directions even where the level does not use them (a
 * player may select a word from either end), and no word contains another.
 * `forbidden` is what the grid must never spell: the server keeps that list, so that it does not travel to the page with the rest of this package.
 * It throws when it could not finish in time (a number of tries, or a few milliseconds).
 */
export function generateWordSearch(difficulty: Difficulty, language: WordLanguage, forbidden: readonly string[]): WordSearchPuzzle {
  const table = getTable(difficulty, language, forbidden);

  const deadline = Date.now() + MAX_BUILD_MS;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // The first tries are always made, and run to their end: the time only decides whether to go on after them.
    if (attempt >= MIN_ATTEMPTS && Date.now() > deadline) break;
    const puzzle = packWordSearch(table, attempt < MIN_ATTEMPTS ? null : deadline);
    if (puzzle) return puzzle;
  }

  throw new Error('Could not build a word search');
}
