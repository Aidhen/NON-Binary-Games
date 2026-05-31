import { describe, it, expect } from 'vitest';
import { isValid, SudokuGrid } from './generator.js';

describe('Sudoku Logic - isValid', () => {
    // Simple 4x4 grid for tests (boxSize = 2)
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
        // Trying to put 1 in (0, 3) but it is already in (0, 0)
        expect(isValid(grid, 0, 3, 1, size, boxSize)).toBe(false);
    });

    it('should invalidate a number already present in the column', () => {
        const grid = emptyGrid();
        grid[0][0] = 1;
        // Trying to put 1 in (3, 0) but it is already in (0, 0)
        expect(isValid(grid, 3, 0, 1, size, boxSize)).toBe(false);
    });

    it('should invalidate a number already present in the box (sub-grid)', () => {
        const grid = emptyGrid();
        grid[0][0] = 1;
        /**
         * In a 4x4, the first box is:
         * (0,0) (0,1)
         * (1,0) (1,1)
         * If (0,0) is 1, then (1,1) cannot be 1.
         * Here the calculation comes into play: boxRowStart + Math.floor(i / boxSize)
         */
        expect(isValid(grid, 1, 1, 1, size, boxSize)).toBe(false);
        
        // However, in (1, 3) it is OK because it is another box
        expect(isValid(grid, 1, 3, 1, size, boxSize)).toBe(true);
    });
});