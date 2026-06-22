import type { SudokuGrid } from './types.js';

/**
 * Checks if a given number is valid in a specific cell.
 */
export function isValid(
    grid: SudokuGrid, 
    row: number, 
    col: number, 
    value: number, 
    size: number, 
    boxSize: number
): boolean {
    const boxRowStart = Math.floor(row / boxSize) * boxSize;
    const boxColStart = Math.floor(col / boxSize) * boxSize;

    for (let i = 0; i < size; i++) {
        if (grid[row][i] === value) return false;
        if (grid[i][col] === value) return false;
        
        const r = boxRowStart + Math.floor(i / boxSize);
        const c = boxColStart + (i % boxSize);
        if (grid[r][c] === value) return false;
    }

    return true;
}