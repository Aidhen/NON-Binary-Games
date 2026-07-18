import { describe, it, expect } from 'vitest';
import { isValid } from './validator';
import type { SudokuGrid } from './types';

describe('Sudoku Logic - isValid', () => {
    const size = 4;
    const boxSize = 2;
    
    const emptyGrid = (): SudokuGrid => [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];

    it('should correctly validate an insertion in an empty cell', () => {
        const grid = emptyGrid();
        expect(isValid(grid, 0, 0, 1, size, boxSize)).toBe(true);
    });

    it('should invalidate a number already present in the row', () => {
        const grid = emptyGrid();
        grid[0][0] = 1;
        expect(isValid(grid, 0, 3, 1, size, boxSize)).toBe(false);
    });

    it('should invalidate a number already present in the column', () => {
        const grid = emptyGrid();
        grid[0][0] = 1;
        expect(isValid(grid, 3, 0, 1, size, boxSize)).toBe(false);
    });

    it('should invalidate a number already present in the box', () => {
        const grid = emptyGrid();
        grid[0][0] = 1;
        expect(isValid(grid, 1, 1, 1, size, boxSize)).toBe(false);
        expect(isValid(grid, 1, 3, 1, size, boxSize)).toBe(true);
    });
});