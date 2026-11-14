import { describe, expect, it } from 'vitest';
import { deduceTakuzu, solveTakuzuByDeduction } from './solver';

const SOLUTION = [
  [1, 1, 2, 2],
  [2, 2, 1, 1],
  [1, 2, 2, 1],
  [2, 1, 1, 2],
];

describe('solveTakuzuByDeduction', () => {
  it('finishes a puzzle with the pair rule and the count rule, and gets the solution', () => {
    const puzzle = [
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1],
      [0, 1, 0, 0],
    ];

    expect(solveTakuzuByDeduction(puzzle)).toEqual(SOLUTION);
  });

  it('gives up on a puzzle where deduction gets stuck, instead of guessing', () => {
    expect(solveTakuzuByDeduction(Array.from({ length: 4 }, () => new Array<number>(4).fill(0)))).toBeNull();
  });

  it('gives up on givens that break a rule', () => {
    const puzzle = [
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(solveTakuzuByDeduction(puzzle)).toBeNull();
  });

  it('leaves the puzzle it is given as it was', () => {
    const puzzle = [
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1],
      [0, 1, 0, 0],
    ];
    const copy = puzzle.map((row) => [...row]);

    solveTakuzuByDeduction(puzzle);

    expect(puzzle).toEqual(copy);
  });
});

describe('deduceTakuzu', () => {
  it('fills the cells around two equal symbols with the other symbol', () => {
    const grid = deduceTakuzu([
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    expect(grid[0]).toEqual([2, 1, 1, 2]);
  });

  it('fills the cell between two equal symbols with the other symbol', () => {
    const grid = deduceTakuzu([
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    expect(grid[0][1]).toBe(1);
  });

  it('cannot copy a finished line: two cells left that need one of each go the other way', () => {
    const grid = deduceTakuzu([
      [1, 2, 0, 0],
      [0, 0, 0, 0],
      [1, 2, 2, 1],
      [0, 0, 0, 0],
    ]);

    expect(grid[0]).toEqual([1, 2, 1, 2]);
  });

  it('writes nothing for a puzzle whose givens clash', () => {
    const puzzle = [
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(deduceTakuzu(puzzle)).toEqual(puzzle);
  });
});
