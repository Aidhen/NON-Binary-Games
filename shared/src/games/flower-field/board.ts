import { FLOWER_HIDDEN } from './types';
import type { FlowerCellChange, FlowerGrid, FlowerMines } from './types';

/** The cells that touch (r, c), the edges of the field cut off. */
export function neighboursOf(size: number, r: number, c: number): [number, number][] {
  const neighbours: [number, number][] = [];
  for (let nr = Math.max(0, r - 1); nr <= Math.min(size - 1, r + 1); nr++) {
    for (let nc = Math.max(0, c - 1); nc <= Math.min(size - 1, c + 1); nc++) {
      if (nr !== r || nc !== c) neighbours.push([nr, nc]);
    }
  }
  return neighbours;
}

export function createHiddenGrid(size: number): FlowerGrid {
  return Array.from({ length: size }, () => new Array<number>(size).fill(FLOWER_HIDDEN));
}

/** How many mines touch (r, c). The cell itself does not count. */
export function countAround(mines: FlowerMines, r: number, c: number): number {
  return neighboursOf(mines.length, r, c).filter(([nr, nc]) => mines[nr][nc]).length;
}

/** Cells that are open: a closed one is HIDDEN or MARKED, both below zero. */
export function countOpenCells(grid: FlowerGrid): number {
  return grid.reduce((total, row) => total + row.filter((value) => value >= 0).length, 0);
}

/**
 * Opens (r, c), which must be hidden and not a mine, and, while the cells opened touch no mine, the ones around them.
 * It writes into `grid` and tells which cells it changed, so that the players can be told only about those.
 */
export function openCells(mines: FlowerMines, grid: FlowerGrid, r: number, c: number): FlowerCellChange[] {
  const size = mines.length;
  const changes: FlowerCellChange[] = [];
  const queue: [number, number][] = [[r, c]];
  grid[r][c] = countAround(mines, r, c);
  changes.push({ r, c, v: grid[r][c] });

  while (queue.length > 0) {
    const [qr, qc] = queue.pop()!;
    if (grid[qr][qc] !== 0) continue;

    for (const [nr, nc] of neighboursOf(size, qr, qc)) {
      if (grid[nr][nc] !== FLOWER_HIDDEN) continue;
      grid[nr][nc] = countAround(mines, nr, nc);
      changes.push({ r: nr, c: nc, v: grid[nr][nc] });
      queue.push([nr, nc]);
    }
  }

  return changes;
}
