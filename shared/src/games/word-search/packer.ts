import type { WordDirection, WordLanguage, WordPlacement, WordSearchPuzzle } from './types';
import { WORDS } from './words/index';

/** The shortest and the longest word of any puzzle, whatever the size of the grid. */
const MIN_WORD_LENGTH = 4;
const MAX_WORD_LENGTH = 10;

/** The letters no word covers spell the hidden word, so there are as many as its length: from the shortest to the longest word. */
const MIN_LEFT = 4;
const MAX_LEFT = 10;

/** Cells kept free from the start, so that the hidden word has a place before the grid fills up (it is the minimum: those are the ones no word may cross). */
const RESERVED_CELLS = MIN_LEFT;

// How the next word is chosen. A candidate scores the new letters it brings (GREED each) plus a random push (up to NOISE), and one of the best TOP_K is tried first. These are the values the packing was measured with: they fill the grid in a few milliseconds and leave 4 to 10 cells over almost every time.
const GREED = 1;
const NOISE = 3;
const TOP_K = 6;
/** Words tried per place; a place that crosses other words gets two more, since few words fit there. */
const SAMPLE = 3;
const SAMPLE_CROSSING_EXTRA = 2;

const reverse = (word: string): string => [...word].reverse().join('');

/** One word contains the other, read in either direction: both together would make a word appear twice. */
const overlaps = (a: string, b: string): boolean => a.includes(b) || b.includes(a) || a.includes(reverse(b)) || b.includes(reverse(a));

/** What does not depend on the language: every row, column and diagonal of a square grid as the indexes of its cells (`r * size + c`), each read in one direction, and the lines through each cell. */
interface GridLines {
  lines: number[][];
  cellLines: number[][];
}

const linesBySize = new Map<number, GridLines>();

function getLines(size: number): GridLines {
  const cached = linesBySize.get(size);
  if (cached) return cached;

  const lines: number[][] = [];
  const walk = (r: number, c: number, dr: number, dc: number) => {
    const line: number[] = [];
    for (; r >= 0 && r < size && c >= 0 && c < size; r += dr, c += dc) line.push(r * size + c);
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
  const cellLines: number[][] = Array.from({ length: size * size }, () => []);
  lines.forEach((line, i) => line.forEach(cell => cellLines[cell].push(i)));

  const built = { lines, cellLines };
  linesBySize.set(size, built);
  return built;
}

/** Everything a packing needs that depends only on the language, the size, the directions and the forbidden words: built once, used by every puzzle after. */
export interface PackTable extends GridLines {
  size: number;
  steps: readonly WordDirection[];
  /** The words that can be laid, and their indexes by length. */
  pool: string[];
  byLength: number[][];
  /** Pairs of pool words that cannot share a grid (0 not known yet, 1 fine, 2 one contains the other), filled in as they are asked. */
  conflict: Uint8Array;
  /** Words of the whole list by length, for the hidden word: it can be longer than the grid allows to lay, but is as clean as the rest. */
  hiddenByLength: Map<number, string[]>;
  forbidden: RegExp;
}

export function buildPackTable(language: WordLanguage, size: number, steps: readonly WordDirection[], forbidden: readonly string[]): PackTable {
  const both = forbidden.flatMap(word => [word, reverse(word)]);
  // An empty list would be an empty pattern, which matches everything.
  const pattern = both.length > 0 ? new RegExp(both.map(word => word.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')).join('|')) : /(?!)/;

  const clean = WORDS[language].filter(word => !pattern.test(word));
  const pool = clean.filter(word => word.length <= Math.min(size, MAX_WORD_LENGTH));
  const byLength: number[][] = Array.from({ length: MAX_WORD_LENGTH + 1 }, () => []);
  pool.forEach((word, i) => byLength[word.length].push(i));
  const hiddenByLength = new Map<number, string[]>();
  for (const word of clean) hiddenByLength.set(word.length, [...(hiddenByLength.get(word.length) ?? []), word]);

  return { size, steps, pool, byLength, conflict: new Uint8Array(pool.length * pool.length), hiddenByLength, forbidden: pattern, ...getLines(size) };
}

function compatible(table: PackTable, a: number, b: number): boolean {
  const key = a * table.pool.length + b;
  let known = table.conflict[key];
  if (known === 0) {
    known = overlaps(table.pool[a], table.pool[b]) ? 2 : 1;
    table.conflict[key] = known;
    table.conflict[b * table.pool.length + a] = known;
  }
  return known === 1;
}

const randomInt = (limit: number): number => Math.floor(Math.random() * limit);

function shuffled<T>(items: readonly T[]): T[] {
  const order = [...items];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** A word laid in the grid: where it lies, and the indexes of its first and last cell. */
interface PlacedWord extends WordPlacement {
  index: number;
  reversed: string;
  first: number;
  last: number;
}

/** A way to lay a word, not done yet. */
interface Candidate {
  score: number;
  index: number;
  r: number;
  c: number;
  dr: number;
  dc: number;
  length: number;
}

/** The state of one attempt. `grid` is flat, with '' for a cell nothing covers. */
interface Attempt {
  table: PackTable;
  grid: string[];
  used: Uint8Array;
  placed: PlacedWord[];
  reserved: Uint8Array;
  /** The cells that no word could be laid on, as far as they are still empty. */
  skipped: number[];
}

/**
 * One try at a puzzle: lays words on the first empty cell, over and over, then spells a word of the list in the 4 to
 * 10 cells that are left. Null when it did not work out (the caller tries again) or when the `deadline` (a `Date.now()`
 * reading) passed; no deadline means the attempt always runs to its end.
 */
export function packWordSearch(table: PackTable, deadline: number | null): WordSearchPuzzle | null {
  const { size } = table;
  const attempt: Attempt = { table, grid: new Array<string>(size * size).fill(''), used: new Uint8Array(table.pool.length), placed: [], reserved: reserveCells(size * size), skipped: [] };

  for (let cell = 0; cell < size * size; cell++) {
    if (attempt.grid[cell] !== '' || attempt.reserved[cell]) continue;
    // Not at every cell: reading the clock costs more than a few of them.
    if (deadline !== null && (cell & 7) === 0 && Date.now() > deadline) return null;
    if (!layWordOn(attempt, cell) && !markSkipped(attempt, cell)) return null;
  }

  return spellHiddenWord(attempt);
}

function reserveCells(total: number): Uint8Array {
  const reserved = new Uint8Array(total);
  for (let count = 0; count < RESERVED_CELLS; ) {
    const cell = randomInt(total);
    if (!reserved[cell]) {
      reserved[cell] = 1;
      count++;
    }
  }
  return reserved;
}

/** A cell no word fits on stays empty. False when there are already too many of them to spell any word with. */
function markSkipped(attempt: Attempt, cell: number): boolean {
  attempt.skipped.push(cell);
  attempt.skipped = attempt.skipped.filter(skipped => attempt.grid[skipped] === '');
  return attempt.skipped.length + RESERVED_CELLS <= MAX_LEFT;
}

/** Lays one of the best words that pass through the cell, if any does. */
function layWordOn(attempt: Attempt, cell: number): boolean {
  const { table, grid } = attempt;
  const { size } = table;

  for (const candidate of bestCandidates(attempt, cell)) {
    const word = table.pool[candidate.index];
    const step = candidate.dr * size + candidate.dc;
    const first = candidate.r * size + candidate.c;
    const filled: number[] = [];
    for (let i = 0; i < candidate.length; i++) {
      if (grid[first + i * step] === '') {
        grid[first + i * step] = word[i];
        filled.push(first + i * step);
      }
    }

    const placed: PlacedWord = { word, r: candidate.r, c: candidate.c, dr: candidate.dr, dc: candidate.dc, index: candidate.index, reversed: reverse(word), first, last: first + (candidate.length - 1) * step };
    const touched = new Set<number>();
    for (const filledCell of filled) for (const line of table.cellLines[filledCell]) touched.add(line);
    if (linesAreClean(attempt, touched, placed)) {
      attempt.placed.push(placed);
      attempt.used[candidate.index] = 1;
      return true;
    }
    for (const filledCell of filled) grid[filledCell] = '';
  }

  return false;
}

/** The best few ways to lay a word through the cell, best first: every direction, length and offset, with a handful of words each. */
function bestCandidates(attempt: Attempt, cell: number): Candidate[] {
  const { table } = attempt;
  const { size } = table;
  const r = Math.floor(cell / size);
  const c = cell % size;
  const top: Candidate[] = [];

  for (const [dr, dc] of table.steps) {
    for (let length = MIN_WORD_LENGTH; length <= Math.min(size, MAX_WORD_LENGTH); length++) {
      for (let offset = 0; offset < length; offset++) {
        const startR = r - offset * dr;
        const startC = c - offset * dc;
        const endR = startR + (length - 1) * dr;
        const endC = startC + (length - 1) * dc;
        if ([startR, startC, endR, endC].some(n => n < 0 || n >= size)) continue;

        const fresh = freshCells(attempt, startR * size + startC, dr * size + dc, length);
        if (fresh >= 0) addWords(attempt, top, { r: startR, c: startC, dr, dc, length }, fresh);
      }
    }
  }

  return top;
}

/** How many cells of the span are empty, or -1 when it runs through a reserved one. */
function freshCells(attempt: Attempt, first: number, step: number, length: number): number {
  let fresh = 0;
  for (let i = 0; i < length; i++) {
    const cell = first + i * step;
    if (attempt.reserved[cell]) return -1;
    if (attempt.grid[cell] === '') fresh++;
  }
  return fresh;
}

/** Scores a few words that fit the span (the letters already there agree, and no word placed contains or is contained) and keeps the best in `top`, in order. */
function addWords(attempt: Attempt, top: Candidate[], span: Omit<Candidate, 'score' | 'index'>, fresh: number): void {
  const { table, grid, used, placed } = attempt;
  const { size } = table;
  const list = table.byLength[span.length];
  const first = span.r * size + span.c;
  const step = span.dr * size + span.dc;
  const limit = fresh === span.length ? SAMPLE : SAMPLE + SAMPLE_CROSSING_EXTRA;
  const offset = randomInt(list.length);

  let got = 0;
  for (let q = 0; q < list.length && got < limit; q++) {
    const index = list[(q + offset) % list.length];
    if (used[index]) continue;
    const word = table.pool[index];
    let agrees = true;
    for (let i = 0; i < span.length && agrees; i++) agrees = grid[first + i * step] === '' || grid[first + i * step] === word[i];
    if (!agrees || !placed.every(other => compatible(table, index, other.index))) continue;

    got++;
    const score = fresh * GREED + Math.random() * NOISE;
    if (top.length < TOP_K || score > top[top.length - 1].score) {
      top.push({ ...span, score, index });
      top.sort((a, b) => b.score - a.score);
      if (top.length > TOP_K) top.pop();
    }
  }
}

/** The text of a line, with a dot where nothing is laid yet. */
const lineText = (grid: string[], line: number[]): string => line.reduce((text, cell) => text + (grid[cell] || '.'), '');

/**
 * Is the grid still free of forbidden words and of second copies of the words placed, on the lines through the cells just
 * filled? A word being laid (`added`) is looked for on every line, since it may already be there by chance.
 */
function linesAreClean(attempt: Attempt, touched: Iterable<number>, added: PlacedWord | null): boolean {
  const { table, grid, placed } = attempt;

  for (const index of touched) {
    const text = lineText(grid, table.lines[index]);
    if (table.forbidden.test(text)) return false;
    if (!placed.every(word => occursOnlyAsPlaced(table.lines[index], text, word))) return false;
  }
  if (added) return table.lines.every(line => occursOnlyAsPlaced(line, lineText(grid, line), added));

  return true;
}

/** Does the word appear on the line, in either direction, only where it was laid? */
function occursOnlyAsPlaced(line: number[], text: string, word: PlacedWord): boolean {
  if (line.length < word.word.length) return true;

  const needles = word.reversed === word.word ? [word.word] : [word.word, word.reversed];
  for (const needle of needles) {
    for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + 1)) {
      const a = line[at];
      const b = line[at + needle.length - 1];
      if (!((a === word.first && b === word.last) || (a === word.last && b === word.first))) return false;
    }
  }

  return true;
}

/** The last step: the empty cells must come to 4 to 10 and spell a word of the list that is not one of the words to find, without making a forbidden word or a second copy of one. */
function spellHiddenWord(attempt: Attempt): WordSearchPuzzle | null {
  const { table, grid, placed } = attempt;
  const { size } = table;

  const empty: number[] = [];
  for (let cell = 0; cell < grid.length; cell++) if (grid[cell] === '') empty.push(cell);
  if (empty.length < MIN_LEFT || empty.length > MAX_LEFT) return null;

  const touched = new Set<number>();
  for (const cell of empty) for (const line of table.cellLines[cell]) touched.add(line);
  const taken = new Set(placed.map(word => word.word));

  for (const word of shuffled(table.hiddenByLength.get(empty.length) ?? [])) {
    if (taken.has(word)) continue;
    empty.forEach((cell, i) => { grid[cell] = word[i]; });
    if (linesAreClean(attempt, touched, null)) {
      return {
        size,
        grid: Array.from({ length: size }, (_, r) => grid.slice(r * size, r * size + size)),
        placements: placed.map(({ word: laid, r, c, dr, dc }) => ({ word: laid, r, c, dr, dc })),
        hidden: { word, cells: empty.map((cell): [number, number] => [Math.floor(cell / size), cell % size]) },
      };
    }
    for (const cell of empty) grid[cell] = '';
  }

  return null;
}
