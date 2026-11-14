import { TAKUZU_SYMBOLS } from './types';
import type { TakuzuGrid } from './types';
import { findTakuzuConflicts, isTakuzuSolved, takuzuLines } from './validator';

const other = (symbol: number): number => (symbol === 1 ? 2 : 1);

/**
 * Applies the three deductions a person uses, as many times as they find something, and nothing else:
 *  - two equal symbols side by side, or with one cell between them, force the cells around them to be the other symbol;
 *  - a line that already has half of one symbol is finished with the other;
 *  - a line with two cells left that needs one of each cannot copy a finished line, which settles which goes where.
 * It never guesses. It returns a new grid, as far as the deductions went, and leaves the one it is given as it is.
 * A puzzle whose givens already clash is returned as it is: there is nothing to deduce from a mistake.
 */
export function deduceTakuzu(puzzle: TakuzuGrid): TakuzuGrid {
  const grid = puzzle.map((row) => [...row]);
  const size = grid.length;
  const half = size / 2;
  if (findTakuzuConflicts(grid).size > 0) return grid;

  const lines = takuzuLines(size);
  let progress = true;

  const put = (r: number, c: number, symbol: number) => {
    if (grid[r][c] !== 0) return;
    grid[r][c] = symbol;
    progress = true;
  };

  while (progress) {
    progress = false;

    lines.forEach((line, index) => {
      const at = (k: number) => grid[line[k][0]][line[k][1]];
      const set = (k: number, symbol: number) => { if (k >= 0 && k < size) put(line[k][0], line[k][1], symbol); };

      for (let k = 0; k < size; k++) {
        const value = at(k);
        if (value === 0) continue;
        if (k + 1 < size && at(k + 1) === value) { set(k - 1, other(value)); set(k + 2, other(value)); }
        if (k + 2 < size && at(k + 2) === value) set(k + 1, other(value));
      }

      for (const symbol of TAKUZU_SYMBOLS) {
        if (line.filter((_, k) => at(k) === symbol).length !== half) continue;
        for (let k = 0; k < size; k++) set(k, other(symbol));
      }

      const empty = line.map((_, k) => k).filter((k) => at(k) === 0);
      const needsOneOfEach = TAKUZU_SYMBOLS.every((symbol) => line.filter((_, k) => at(k) === symbol).length === half - 1);
      if (empty.length !== 2 || !needsOneOfEach) return;

      // The lines of the same kind: the first half of the list are rows, the second half columns.
      const sameKind = index < size ? lines.slice(0, size) : lines.slice(size);
      for (const rival of sameKind) {
        if (rival === line || rival.some(([r, c]) => grid[r][c] === 0)) continue;
        const rivalAt = (k: number) => grid[rival[k][0]][rival[k][1]];
        if (!line.every((_, k) => at(k) === 0 || at(k) === rivalAt(k))) continue;
        // The finished line has one of each in these two cells too, or it would not be balanced.
        if (rivalAt(empty[0]) === rivalAt(empty[1])) continue;
        set(empty[0], other(rivalAt(empty[0])));
        set(empty[1], other(rivalAt(empty[1])));
        break;
      }
    });
  }

  return grid;
}

/**
 * Finishes a puzzle with the deductions of `deduceTakuzu`, or gives up (null) when they get stuck. A puzzle it
 * finishes can be solved by a person without trial and error, and has exactly one solution: each symbol it writes
 * is forced by the givens, so any solution must have it.
 */
export function solveTakuzuByDeduction(puzzle: TakuzuGrid): TakuzuGrid | null {
  const grid = deduceTakuzu(puzzle);
  return isTakuzuSolved(grid) ? grid : null;
}
