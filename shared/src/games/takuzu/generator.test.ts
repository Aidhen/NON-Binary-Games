import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../sudoku/types';
import type { TakuzuGrid } from './types';
import { generateTakuzu, getTakuzuLevel } from './generator';
import { solveTakuzuByDeduction } from './solver';
import { findTakuzuConflicts, isTakuzuSolved } from './validator';

/** Counts the solutions the slow way, trying every symbol, and stops at two: all that matters is "one or more". */
const countSolutions = (grid: TakuzuGrid): number => {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 0) continue;

      let count = 0;
      for (const symbol of [1, 2]) {
        grid[r][c] = symbol;
        if (findTakuzuConflicts(grid).size === 0) count += countSolutions(grid);
        grid[r][c] = 0;
        if (count > 1) return count;
      }
      return count;
    }
  }
  return isTakuzuSolved(grid) ? 1 : 0;
};

describe('getTakuzuLevel', () => {
  it('has an even size and some clues for every level, and grows with the level', () => {
    const sizes = DIFFICULTIES.map((level) => getTakuzuLevel(level).size);

    for (const level of DIFFICULTIES) {
      const { size, clues } = getTakuzuLevel(level);
      expect(size % 2).toBe(0);
      expect(clues).toBeGreaterThan(0);
      expect(clues).toBeLessThan(size * size);
    }
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  });

  it('refuses a level it does not know', () => {
    expect(() => getTakuzuLevel('impossible' as never)).toThrow('Unknown difficulty');
  });
});

describe('generateTakuzu', () => {
  it.each(DIFFICULTIES)('makes a board of the size of the level, %s', (level) => {
    const board = generateTakuzu(level);

    expect(board.size).toBe(getTakuzuLevel(level).size);
    expect(board.solution).toHaveLength(board.size);
    expect(board.initial).toHaveLength(board.size);
  });

  it.each(DIFFICULTIES)('makes a solution that follows every rule, %s', (level) => {
    const { solution } = generateTakuzu(level);

    expect(isTakuzuSolved(solution)).toBe(true);
  });

  it.each(DIFFICULTIES)('only gives cells of the solution, and leaves some empty, %s', (level) => {
    const { solution, initial } = generateTakuzu(level);
    let empty = 0;

    initial.forEach((row, r) => row.forEach((value, c) => {
      if (value === 0) empty++;
      else expect(value).toBe(solution[r][c]);
    }));

    expect(empty).toBeGreaterThan(0);
  });

  it.each(DIFFICULTIES)('makes a puzzle that deduction alone finishes, so nobody has to guess, %s', (level) => {
    for (let i = 0; i < 5; i++) {
      const { solution, initial } = generateTakuzu(level);

      expect(solveTakuzuByDeduction(initial)).toEqual(solution);
    }
  });

  it.each(['beginner', 'easy'] as const)('makes a puzzle with exactly one solution, checked the slow way, %s', (level) => {
    for (let i = 0; i < 3; i++) {
      const { initial } = generateTakuzu(level);

      expect(countSolutions(initial.map((row) => [...row]))).toBe(1);
    }
  });

  it('does not give the same board twice in a row', () => {
    const boards = Array.from({ length: 5 }, () => JSON.stringify(generateTakuzu('beginner').solution));

    expect(new Set(boards).size).toBeGreaterThan(1);
  });
});
