import { describe, expect, it } from 'vitest';
import { fitMemoryGrid, memoryGapOf } from './boardStyles';

const heightOf = (cardWidth: number) => (cardWidth * 4) / 3;

describe('fitMemoryGrid', () => {
  it('puts a deck of 44 cards on about 8 columns in a portrait phone, with cards a thumb can hit', () => {
    const grid = fitMemoryGrid(44, 350, 340);

    expect(grid.columns).toBeGreaterThanOrEqual(7);
    expect(grid.columns).toBeLessThanOrEqual(9);
    expect(grid.cardWidth).toBeGreaterThanOrEqual(38);
  });

  it('uses wider rows when the box is wide and low, and taller columns when it is narrow and high', () => {
    const wide = fitMemoryGrid(44, 900, 400);
    const narrow = fitMemoryGrid(44, 300, 640);

    expect(wide.columns).toBeGreaterThan(narrow.columns);
  });

  it.each([12, 16, 24, 32, 44])('never makes a grid that leaves the box, %i cards', (count) => {
    for (const [width, height] of [[350, 340], [320, 256], [900, 500], [1200, 704], [300, 640]]) {
      const { columns, rows, cardWidth, gap } = fitMemoryGrid(count, width, height);

      expect(columns * rows).toBeGreaterThanOrEqual(count);
      expect(columns * cardWidth + (columns - 1) * gap).toBeLessThanOrEqual(width);
      expect(rows * heightOf(cardWidth) + (rows - 1) * gap).toBeLessThanOrEqual(height + 1);
    }
  });

  it('picks the columns that give the largest card of all the ones it tried', () => {
    const count = 24;
    const best = fitMemoryGrid(count, 600, 420);

    for (let columns = 3; columns <= 11; columns++) {
      const rows = Math.ceil(count / columns);
      const width = Math.min((600 - 5 * (columns - 1)) / columns, ((420 - 5 * (rows - 1)) * 0.75) / rows);
      // The gap changes with the size, so the comparison leaves a little room.
      expect(best.cardWidth).toBeGreaterThanOrEqual(Math.floor(width) - 3);
    }
  });

  it('does not use more columns than cards, or fewer than 3 when it can', () => {
    expect(fitMemoryGrid(2, 400, 400).columns).toBeLessThanOrEqual(2);
    expect(fitMemoryGrid(12, 100, 800).columns).toBeGreaterThanOrEqual(3);
  });

  it('gives a plain grid while the box is not measured yet', () => {
    const grid = fitMemoryGrid(12, 0, 0);

    expect(grid.columns).toBe(6);
    expect(grid.cardWidth).toBeGreaterThan(0);
  });
});

describe('memoryGapOf', () => {
  it('is 8 px for big cards and 3 px for small ones', () => {
    expect(memoryGapOf(120)).toBe(8);
    expect(memoryGapOf(20)).toBe(3);
    expect(memoryGapOf(55)).toBeGreaterThanOrEqual(3);
    expect(memoryGapOf(55)).toBeLessThanOrEqual(8);
  });
});
