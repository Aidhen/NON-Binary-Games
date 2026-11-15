import { TAKUZU_SYMBOLS } from './types';
import type { TakuzuGrid } from './types';

/** The key of a cell in the set of conflicts: the same `r-c` the notes of the Sudoku use. */
export const takuzuCellKey = (r: number, c: number): string => `${r}-${c}`;

/** The coordinates of every row and then every column, each one in order. */
export function takuzuLines(size: number): [number, number][][] {
  const rows = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, k): [number, number] => [i, k]));
  const cols = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, k): [number, number] => [k, i]));
  return [...rows, ...cols];
}

/** More than two equal symbols in a row: every cell of the run is a conflict. */
function markRuns(line: [number, number][], values: number[], conflicts: Set<string>): void {
  for (let k = 0; k + 2 < line.length; k++) {
    if (values[k] === 0 || values[k] !== values[k + 1] || values[k] !== values[k + 2]) continue;
    for (let j = 0; j < 3; j++) conflicts.add(takuzuCellKey(...line[k + j]));
  }
}

/** A symbol that fills more than half of the line: every cell that holds it is a conflict. */
function markSurplus(line: [number, number][], values: number[], conflicts: Set<string>): void {
  const half = line.length / 2;
  for (const symbol of TAKUZU_SYMBOLS) {
    if (values.filter((value) => value === symbol).length <= half) continue;
    line.forEach(([r, c], k) => { if (values[k] === symbol) conflicts.add(takuzuCellKey(r, c)); });
  }
}

/** Two lines of the group that are the same: all their cells are conflicts. Only finished lines are compared. */
function markCopies(grid: TakuzuGrid, group: [number, number][][], conflicts: Set<string>): void {
  const finished = group.filter((line) => line.every(([r, c]) => grid[r][c] !== 0));
  for (let a = 0; a < finished.length; a++) {
    for (let b = a + 1; b < finished.length; b++) {
      if (!finished[a].every(([r, c], k) => grid[r][c] === grid[finished[b][k][0]][finished[b][k][1]])) continue;
      for (const [r, c] of [...finished[a], ...finished[b]]) conflicts.add(takuzuCellKey(r, c));
    }
  }
}

/**
 * The cells that break a rule right now, as `r-c` keys. The rules:
 *  - no more than two equal symbols in a row, in a line or a column;
 *  - each row and column holds as many of one symbol as of the other;
 *  - no two rows, and no two columns, are the same.
 * A line that is not finished only breaks the rules it already breaks: an empty cell is never a conflict.
 */
export function findTakuzuConflicts(grid: TakuzuGrid): Set<string> {
  const size = grid.length;
  const conflicts = new Set<string>();
  const lines = takuzuLines(size);

  for (const line of lines) {
    const values = line.map(([r, c]) => grid[r][c]);
    markRuns(line, values, conflicts);
    markSurplus(line, values, conflicts);
  }

  // Two lines are only the same once both are finished; rows are compared with rows and columns with columns.
  markCopies(grid, lines.slice(0, size), conflicts);
  markCopies(grid, lines.slice(size), conflicts);

  return conflicts;
}

/** Every cell is filled and no rule is broken. */
export function isTakuzuSolved(grid: TakuzuGrid): boolean {
  return grid.every((row) => row.every((value) => value !== 0)) && findTakuzuConflicts(grid).size === 0;
}
