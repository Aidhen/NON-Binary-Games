import type { WordPlacement, WordSearchCell, WordSearchPuzzle } from './types';

/**
 * The placement a selection covers, or null. The two end cells can come in either order (a player may start from
 * either end of the word), so the direction in which the word was laid never matters. Null as well when a cell is
 * outside the grid or not a whole number, when the cells are not on a row, a column or a diagonal, when the span is
 * not exactly a word of the puzzle, and when that word is already found.
 */
export function resolveSelection(puzzle: WordSearchPuzzle, foundWords: ReadonlySet<string>, from: WordSearchCell, to: WordSearchCell): WordPlacement | null {
  const inside = (n: number) => Number.isInteger(n) && n >= 0 && n < puzzle.size;
  if (![from.r, from.c, to.r, to.c].every(inside)) return null;

  const dr = to.r - from.r;
  const dc = to.c - from.c;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;

  const covers = (p: WordPlacement) => {
    const endR = p.r + p.dr * (p.word.length - 1);
    const endC = p.c + p.dc * (p.word.length - 1);
    return (p.r === from.r && p.c === from.c && endR === to.r && endC === to.c) || (p.r === to.r && p.c === to.c && endR === from.r && endC === from.c);
  };
  const placement = puzzle.placements.find(covers);

  return placement && !foundWords.has(placement.word) ? placement : null;
}

export function isSolved(puzzle: WordSearchPuzzle, foundWords: ReadonlySet<string>): boolean {
  return puzzle.placements.every(placement => foundWords.has(placement.word));
}
