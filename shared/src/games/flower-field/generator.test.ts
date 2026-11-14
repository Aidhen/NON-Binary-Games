import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../sudoku/types';
import { getFlowerFieldLevel, layMines } from './generator';
import { canBeSolvedWithoutGuessing } from './solver';

describe('getFlowerFieldLevel', () => {
  it('grows with the level, and leaves room for the mines around the first cell', () => {
    const sizes = DIFFICULTIES.map((level) => getFlowerFieldLevel(level).size);

    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
    for (const level of DIFFICULTIES) {
      const { size, mines } = getFlowerFieldLevel(level);
      expect(mines).toBeGreaterThan(0);
      // The first cell and its neighbours are free: nine cells at most.
      expect(mines).toBeLessThanOrEqual(size * size - 9);
      expect(mines / (size * size)).toBeLessThan(0.2);
    }
  });

  it('refuses a level it does not know', () => {
    expect(() => getFlowerFieldLevel('impossible' as never)).toThrow('Unknown difficulty');
  });
});

describe('layMines', () => {
  it.each(['beginner', 'easy'] as const)('puts every mine of the level in the field, %s', (level) => {
    const { size, mines: count } = getFlowerFieldLevel(level);

    const mines = layMines(size, count, 3, 4);

    expect(mines.flat().filter(Boolean)).toHaveLength(count);
  });

  it.each([[0, 0], [0, 5], [4, 4], [7, 7]])('keeps the first cell and the ones around it free, from (%i, %i)', (r, c) => {
    const mines = layMines(8, 8, r, c);

    for (let nr = r - 1; nr <= r + 1; nr++) {
      for (let nc = c - 1; nc <= c + 1; nc++) expect(mines[nr]?.[nc] ?? false).toBe(false);
    }
  });

  it.each(['beginner', 'easy'] as const)('lays out a field that needs no guess, %s', (level) => {
    const { size, mines: count } = getFlowerFieldLevel(level);

    for (let i = 0; i < 5; i++) expect(canBeSolvedWithoutGuessing(layMines(size, count, 2, 2), 2, 2)).toBe(true);
  });

  it('does not lay the same field twice in a row', () => {
    const fields = Array.from({ length: 5 }, () => JSON.stringify(layMines(8, 8, 0, 0)));

    expect(new Set(fields).size).toBeGreaterThan(1);
  });

  it('refuses when there is no room for the mines', () => {
    expect(() => layMines(3, 1, 1, 1)).toThrow('no room');
    expect(() => layMines(4, 8, 1, 1)).toThrow('no room');
  });
});
