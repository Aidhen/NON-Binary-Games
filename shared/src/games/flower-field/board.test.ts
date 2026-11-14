import { describe, expect, it } from 'vitest';
import { FLOWER_HIDDEN } from './types';
import type { FlowerMines } from './types';
import { countAround, countOpenCells, createHiddenGrid, neighboursOf, openCells } from './board';

/** A field of this size with mines in these cells. */
const field = (size: number, ...cells: [number, number][]): FlowerMines => {
  const mines = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  cells.forEach(([r, c]) => { mines[r][c] = true; });
  return mines;
};

describe('neighboursOf', () => {
  it('has eight neighbours in the middle, five on an edge and three in a corner', () => {
    expect(neighboursOf(5, 2, 2)).toHaveLength(8);
    expect(neighboursOf(5, 0, 2)).toHaveLength(5);
    expect(neighboursOf(5, 4, 4)).toHaveLength(3);
  });

  it('never includes the cell itself, or a cell outside the field', () => {
    for (const [r, c] of neighboursOf(3, 0, 0)) {
      expect([r, c]).not.toEqual([0, 0]);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(3);
    }
  });
});

describe('countAround', () => {
  it('counts the mines that touch a cell, and not its own', () => {
    const mines = field(4, [0, 0], [0, 1]);

    expect(countAround(mines, 1, 1)).toBe(2);
    expect(countAround(mines, 0, 0)).toBe(1);
    expect(countAround(mines, 3, 3)).toBe(0);
  });
});

describe('openCells', () => {
  it('opens the whole field around a cell that touches no mine, except the mines', () => {
    const grid = createHiddenGrid(4);

    const changes = openCells(field(4, [3, 3]), grid, 0, 0);

    expect(changes).toHaveLength(15);
    expect(countOpenCells(grid)).toBe(15);
    expect(grid[3][3]).toBe(FLOWER_HIDDEN);
    expect(grid[2][2]).toBe(1);
    expect(grid[0][0]).toBe(0);
  });

  it('opens only the cell that was asked for when it touches a mine', () => {
    const grid = createHiddenGrid(4);

    const changes = openCells(field(4, [3, 3]), grid, 2, 2);

    expect(changes).toEqual([{ r: 2, c: 2, v: 1 }]);
    expect(countOpenCells(grid)).toBe(1);
  });

  it('tells each cell it changed with the number it now shows', () => {
    const grid = createHiddenGrid(4);

    const changes = openCells(field(4, [3, 3]), grid, 0, 0);

    for (const { r, c, v } of changes) expect(grid[r][c]).toBe(v);
  });

  it('leaves alone a cell that was already open', () => {
    const grid = createHiddenGrid(4);
    openCells(field(4, [3, 3]), grid, 2, 2);

    const changes = openCells(field(4, [3, 3]), grid, 0, 0);

    expect(changes.some(({ r, c }) => r === 2 && c === 2)).toBe(false);
    expect(countOpenCells(grid)).toBe(15);
  });
});

describe('countOpenCells', () => {
  it('counts the open cells, and not the closed or marked ones', () => {
    const grid = createHiddenGrid(3);
    grid[0][0] = 0;
    grid[1][1] = 4;
    grid[2][2] = -2;

    expect(countOpenCells(grid)).toBe(2);
  });
});
