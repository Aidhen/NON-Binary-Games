import type { WordSearchCell, WordSearchFound } from '@nbg/shared';

/** The cells from one end to the other, or none when it is not a straight line inside the grid. */
export const lineCells = (from: WordSearchCell, to: WordSearchCell, size: number): WordSearchCell[] => {
  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const length = Math.max(Math.abs(dr), Math.abs(dc));
  const inside = [from, to].every(({ r, c }) => r >= 0 && c >= 0 && r < size && c < size);
  if (!inside || (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc))) return [];
  return Array.from({ length: length + 1 }, (_, i) => ({ r: from.r + Math.sign(dr) * i, c: from.c + Math.sign(dc) * i }));
};

/**
 * The hidden word, worked out from what the server told: the cells no found word covers, in reading order, spelled with the letters of the grid.
 * Nothing until every word is found: with a word missing its cells would look like leftovers and the "word" would be a wrong guess.
 */
export const hiddenWordOf = (grid: string[][], found: WordSearchFound[], totalWords: number): { cells: WordSearchCell[]; word: string } | null => {
  const size = grid.length;
  if (totalWords === 0 || new Set(found.map(({ word }) => word)).size < totalWords) return null;
  const covered = new Set(found.flatMap(({ from, to }) => lineCells(from, to, size).map(({ r, c }) => `${r}-${c}`)));
  const cells = grid.flatMap((row, r) => row.map((_, c) => ({ r, c }))).filter(({ r, c }) => !covered.has(`${r}-${c}`));
  return { cells, word: cells.map(({ r, c }) => grid[r][c]).join('') };
};
