import { describe, expect, it } from 'vitest';
import { getCompletedNumbers } from './completedNumbers';

describe('getCompletedNumbers', () => {
  it('returns the numbers that appear size times', () => {
    const grid = [
      [1, 2, 0, 4],
      [0, 4, 1, 0],
      [0, 1, 4, 0],
      [4, 0, 0, 1],
    ];

    expect(getCompletedNumbers(grid, 4)).toEqual(new Set([1, 4]));
  });

  it('does not return numbers that appear fewer times', () => {
    const grid = [
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(getCompletedNumbers(grid, 4).size).toBe(0);
  });

  it('ignores empty cells', () => {
    const grid = Array.from({ length: 4 }, () => new Array(4).fill(0));

    expect(getCompletedNumbers(grid, 4).size).toBe(0);
  });

  it('counts wrong placements too, so it never reveals mistakes', () => {
    const grid = [
      [3, 3, 3, 3],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(getCompletedNumbers(grid, 4)).toEqual(new Set([3]));
  });

  it('keeps a number complete when it appears more than size times', () => {
    const grid = [
      [2, 2, 2, 2],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    expect(getCompletedNumbers(grid, 4)).toEqual(new Set([2]));
  });
});
