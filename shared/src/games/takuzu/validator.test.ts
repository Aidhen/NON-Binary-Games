import { describe, expect, it } from 'vitest';
import { findTakuzuConflicts, isTakuzuSolved } from './validator';

/** A finished 4x4 grid that follows every rule. */
const SOLVED = [
  [1, 1, 2, 2],
  [2, 2, 1, 1],
  [1, 2, 2, 1],
  [2, 1, 1, 2],
];

const EMPTY = () => Array.from({ length: 4 }, () => new Array<number>(4).fill(0));

describe('findTakuzuConflicts', () => {
  it('finds nothing in a grid that follows the rules, or in one that is still empty', () => {
    expect(findTakuzuConflicts(SOLVED).size).toBe(0);
    expect(findTakuzuConflicts(EMPTY()).size).toBe(0);
  });

  it('marks three equal symbols in a row, and only those', () => {
    const grid = EMPTY();
    grid[1] = [1, 1, 1, 0];

    expect([...findTakuzuConflicts(grid)].sort()).toEqual(['1-0', '1-1', '1-2']);
  });

  it('marks three equal symbols in a column', () => {
    const grid = EMPTY();
    grid[0][3] = grid[1][3] = grid[2][3] = 2;

    expect([...findTakuzuConflicts(grid)].sort()).toEqual(['0-3', '1-3', '2-3']);
  });

  it('does not mark two equal symbols side by side', () => {
    const grid = EMPTY();
    grid[0] = [1, 1, 0, 2];

    expect(findTakuzuConflicts(grid).size).toBe(0);
  });

  it('marks the symbols of a line that has more of one than half', () => {
    const grid = EMPTY();
    grid[2] = [1, 2, 1, 1];

    const conflicts = findTakuzuConflicts(grid);
    expect([...conflicts].sort()).toEqual(['2-0', '2-2', '2-3']);
  });

  it('marks two finished rows that are the same, and two finished columns that are the same', () => {
    const rows = SOLVED.map((row) => [...row]);
    rows[3] = [...rows[0]];
    expect(findTakuzuConflicts(rows)).toContain('0-0');
    expect(findTakuzuConflicts(rows)).toContain('3-3');

    const columns = SOLVED.map((row) => [...row]);
    columns.forEach((row) => { row[3] = row[0]; });
    expect(findTakuzuConflicts(columns)).toContain('0-0');
    expect(findTakuzuConflicts(columns)).toContain('0-3');
  });

  it('does not compare lines that are not finished', () => {
    const grid = EMPTY();
    grid[0] = [1, 2, 0, 0];
    grid[1] = [1, 2, 0, 0];

    expect(findTakuzuConflicts(grid).size).toBe(0);
  });
});

describe('isTakuzuSolved', () => {
  it('accepts a finished grid that follows the rules', () => {
    expect(isTakuzuSolved(SOLVED)).toBe(true);
  });

  it('refuses a grid with an empty cell, even when nothing is broken yet', () => {
    const grid = SOLVED.map((row) => [...row]);
    grid[0][0] = 0;

    expect(isTakuzuSolved(grid)).toBe(false);
  });

  it('refuses a finished grid that breaks a rule', () => {
    const grid = SOLVED.map((row) => [...row]);
    grid[3] = [...grid[0]];

    expect(isTakuzuSolved(grid)).toBe(false);
  });
});
