import { TAKUZU_SYMBOLS } from './types';
import type { TakuzuGrid } from './types';
import { findTakuzuConflicts, isTakuzuSolved, takuzuLines } from './validator';

const other = (symbol: number): number => (symbol === 1 ? 2 : 1);

type Line = [number, number][];

/** The grid being filled, and whether a symbol was written since the flag was last put down. */
interface Deduction {
  grid: TakuzuGrid;
  progress: boolean;
}

const at = (grid: TakuzuGrid, line: Line, k: number): number => grid[line[k][0]][line[k][1]];

/** Writes a symbol in the k-th cell of a line, when the line has such a cell and it is empty. */
function set(deduction: Deduction, line: Line, k: number, symbol: number): void {
  if (k < 0 || k >= line.length) return;
  const [r, c] = line[k];
  if (deduction.grid[r][c] !== 0) return;
  deduction.grid[r][c] = symbol;
  deduction.progress = true;
}

/** Two equal symbols side by side, or with one cell between them, force the cells around them to be the other symbol. */
function fillAroundPairs(deduction: Deduction, line: Line): void {
  const { grid } = deduction;
  const size = line.length;

  for (let k = 0; k < size; k++) {
    const value = at(grid, line, k);
    if (value === 0) continue;
    if (k + 1 < size && at(grid, line, k + 1) === value) { set(deduction, line, k - 1, other(value)); set(deduction, line, k + 2, other(value)); }
    if (k + 2 < size && at(grid, line, k + 2) === value) set(deduction, line, k + 1, other(value));
  }
}

/** A line that already has half of one symbol is finished with the other. */
function fillBalanced(deduction: Deduction, line: Line): void {
  const { grid } = deduction;
  const half = line.length / 2;

  for (const symbol of TAKUZU_SYMBOLS) {
    if (line.filter((_, k) => at(grid, line, k) === symbol).length !== half) continue;
    for (let k = 0; k < line.length; k++) set(deduction, line, k, other(symbol));
  }
}

/** A line with two cells left that needs one of each cannot copy a finished line of its kind, which settles which goes where. */
function fillAgainstCopies(deduction: Deduction, line: Line, sameKind: Line[]): void {
  const { grid } = deduction;
  const half = line.length / 2;

  const empty = line.map((_, k) => k).filter((k) => at(grid, line, k) === 0);
  const needsOneOfEach = TAKUZU_SYMBOLS.every((symbol) => line.filter((_, k) => at(grid, line, k) === symbol).length === half - 1);
  if (empty.length !== 2 || !needsOneOfEach) return;

  for (const rival of sameKind) {
    if (rival === line || rival.some(([r, c]) => grid[r][c] === 0)) continue;
    if (!line.every((_, k) => at(grid, line, k) === 0 || at(grid, line, k) === at(grid, rival, k))) continue;
    // The finished line has one of each in these two cells too, or it would not be balanced.
    if (at(grid, rival, empty[0]) === at(grid, rival, empty[1])) continue;
    set(deduction, line, empty[0], other(at(grid, rival, empty[0])));
    set(deduction, line, empty[1], other(at(grid, rival, empty[1])));
    break;
  }
}

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
  if (findTakuzuConflicts(grid).size > 0) return grid;

  const lines = takuzuLines(size);
  // The lines of the same kind: the first half of the list are rows, the second half columns.
  const rows = lines.slice(0, size);
  const columns = lines.slice(size);
  const deduction: Deduction = { grid, progress: true };

  while (deduction.progress) {
    deduction.progress = false;

    lines.forEach((line, index) => {
      fillAroundPairs(deduction, line);
      fillBalanced(deduction, line);
      fillAgainstCopies(deduction, line, index < size ? rows : columns);
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
