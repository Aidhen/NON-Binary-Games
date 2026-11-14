import { describe, expect, it } from 'vitest';
import type { FlowerMines } from './types';
import { canBeSolvedWithoutGuessing } from './solver';

const field = (size: number, ...cells: [number, number][]): FlowerMines => {
  const mines = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  cells.forEach(([r, c]) => { mines[r][c] = true; });
  return mines;
};

describe('canBeSolvedWithoutGuessing', () => {
  it('accepts a field with no mines: the first move opens everything', () => {
    expect(canBeSolvedWithoutGuessing(field(4), 0, 0)).toBe(true);
  });

  it('accepts a field where the first move opens everything that is safe', () => {
    expect(canBeSolvedWithoutGuessing(field(4, [3, 3]), 0, 0)).toBe(true);
  });

  it('finds the mines a number points out, and the safe cells that come from it', () => {
    // The 2 at (0, 2) has two cells left and needs two mines. That frees (1, 0), and then (0, 0).
    expect(canBeSolvedWithoutGuessing(field(4, [0, 1], [1, 1]), 3, 3)).toBe(true);
  });

  it('refuses a field where a first move that touches many mines leaves nothing to deduce', () => {
    expect(canBeSolvedWithoutGuessing(field(3, [0, 0], [2, 2]), 1, 1)).toBe(false);
  });

  it('refuses a field with a safe cell that no number can reach', () => {
    // (0, 0) is closed in by three mines: nobody can tell it is safe without guessing.
    expect(canBeSolvedWithoutGuessing(field(4, [0, 1], [1, 0], [1, 1]), 3, 3)).toBe(false);
  });
});
