import { FLOWER_HIDDEN } from './types';
import type { FlowerMines } from './types';
import { countOpenCells, createHiddenGrid, neighboursOf, openCells } from './board';

interface Constraint {
  r: number;
  c: number;
  /** Mines still to find among the unknown cells around an open cell. */
  need: number;
  /** The closed cells around it that are not known to be mines yet, as `r * size + c`. */
  unknown: number[];
}

/**
 * Plays a field from its first move with the two deductions a person uses, and nothing else:
 *  - a number that has all its mines already found: the other cells around it are safe; a number that needs as
 *    many mines as it has unknown cells: they are all mines;
 *  - two numbers where the unknown cells of one are among those of the other: what is left of the bigger one has
 *    the difference of their mines, which settles it when that is none or all of them.
 * It never guesses. True means that every safe cell can be opened this way, so a player never has to guess.
 */
export function canBeSolvedWithoutGuessing(mines: FlowerMines, firstR: number, firstC: number): boolean {
  const size = mines.length;
  const grid = createHiddenGrid(size);
  const mineCount = mines.flat().filter(Boolean).length;
  const known = new Set<number>();
  let progress = true;

  const open = (cell: number) => {
    const r = Math.floor(cell / size);
    const c = cell % size;
    if (grid[r][c] !== FLOWER_HIDDEN) return;
    openCells(mines, grid, r, c);
    progress = true;
  };
  const markAsMines = (cells: number[]) => {
    for (const cell of cells) {
      if (known.has(cell)) continue;
      known.add(cell);
      progress = true;
    }
  };

  openCells(mines, grid, firstR, firstC);

  while (progress) {
    progress = false;
    const constraints: Constraint[] = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] <= 0) continue;

        const unknown: number[] = [];
        let found = 0;
        for (const [nr, nc] of neighboursOf(size, r, c)) {
          if (grid[nr][nc] !== FLOWER_HIDDEN) continue;
          if (known.has(nr * size + nc)) found++;
          else unknown.push(nr * size + nc);
        }
        if (unknown.length === 0) continue;

        const need = grid[r][c] - found;
        if (need === 0) unknown.forEach(open);
        else if (need === unknown.length) markAsMines(unknown);
        else constraints.push({ r, c, need, unknown });
      }
    }

    // What a constraint says stays true after cells were opened or found in this pass, so none of them is stale.
    for (const small of constraints) {
      for (const big of constraints) {
        if (small === big || small.unknown.length >= big.unknown.length) continue;
        // Cells that are not close cannot share an unknown cell.
        if (Math.abs(small.r - big.r) > 2 || Math.abs(small.c - big.c) > 2) continue;
        if (!small.unknown.every((cell) => big.unknown.includes(cell))) continue;

        const rest = big.unknown.filter((cell) => !small.unknown.includes(cell));
        const extra = big.need - small.need;
        if (extra === 0) rest.forEach(open);
        else if (extra === rest.length) markAsMines(rest);
      }
    }
  }

  return countOpenCells(grid) === size * size - mineCount;
}
