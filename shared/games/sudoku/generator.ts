// shared/games/sudoku/generator.ts



export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Represents the Sudoku grid as a 2D array.
 * 0 represents an empty cell.
 */
export type SudokuGrid = number[][];

export interface SudokuBoard {
    solution: SudokuGrid;
    initial: SudokuGrid;
    size: number;
    boxSize: number;
}

/**
 * Generates a new Sudoku board for any valid size (4, 9, 16).
 * This function is shared between the backend (for authoritative state generation)
 * and the frontend (for potential offline capabilities).
 */
export function generateSudoku(difficulty: Difficulty, size: number = 9): SudokuBoard {
    const boxSize = Math.sqrt(size);
    if (!Number.isInteger(boxSize)) {
        throw new Error("Grid size must be a perfect square (e.g., 4, 9, 16).");
    }

    // 1. Generate a fully populated valid N x N grid
    const solution = generateFullGrid(size, boxSize);

    // 2. Create a copy to start removing numbers
    const initial = solution.map(row => [...row]);

    // 3. Determine how many clues to leave based on difficulty
    const cluesTarget = getCluesCount(difficulty, size);

    // 4. Remove numbers while ensuring a unique solution
    pokeHoles(initial, cluesTarget, size, boxSize);

    return {
        solution,
        initial,
        size,
        boxSize
    };
}

/**
 * Fills an N x N grid using a randomized backtracking algorithm.
 * @private
 */
function generateFullGrid(size: number, boxSize: number): SudokuGrid {
    const grid: SudokuGrid = Array.from({ length: size }, () => Array(size).fill(0));


    // TODO: Start the recursive process from index 0
    return grid;
}

/**
 * Checks if a given number is valid in a specific cell (row, col) of the Sudoku grid.
 * It verifies the number against the row, column, and the sub-grid constraints.
 *
 * @param grid The current Sudoku grid.
 * @param row The row index of the cell to check.
 * @param col The column index of the cell to check.
 * @param value The number to validate.
 * @param size The side length of the grid (e.g., 9 for a 9x9 grid).
 * @param boxSize The side length of the sub-grid (e.g., 3 for a 9x9 grid).
 * @returns True if the number is valid, false otherwise.
 */
export function isValid(grid: SudokuGrid, row: number, col: number, value: number, size: number, boxSize: number): boolean {
    const boxRowStart = Math.floor(row / boxSize) * boxSize;
    const boxColStart = Math.floor(col / boxSize) * boxSize;

    for (let i = 0; i < size; i++) {
        // Check the row
        if (grid[row][i] === value) return false;
        
        // Check the column
        if (grid[i][col] === value) return false;
        
        // Check the sub-grid (box)
        // We map the linear index 'i' to row and column offsets within the box
        const r = boxRowStart + Math.floor(i / boxSize);
        const c = boxColStart + (i % boxSize);
        if (grid[r][c] === value) return false;
    }

    return true;
}

/**
 * Maps difficulty levels to the number of remaining clues.
 * Uses percentages to stay consistent across different grid sizes.
 * @private
 */
function getCluesCount(difficulty: Difficulty, size: number): number {
    const totalCells = size * size;
    const ratios: Record<Difficulty, number> = {
        easy: 0.5,   // ~40 clues for 9x9
        medium: 0.4, // ~32 clues for 9x9
        hard: 0.3    // ~24 clues for 9x9
    };
    return Math.floor(totalCells * ratios[difficulty]);
}

/**
 * Removes numbers from the grid one by one.
 * Uses a solver to verify that the puzzle remains unique.
 * @private
 */
function pokeHoles(grid: SudokuGrid, target: number, size: number, boxSize: number): void {
    // Current clues start at size * size
    // TODO: Implement logic:
    // 1. Pick a random cell
    // 2. Temporarily remove value
    // 3. Run countSolutions(grid, size, boxSize)
    // 4. If solutions > 1, put value back. Else, currentClues--
}

/**
 * Core solver function using backtracking.
 * Used to check if a puzzle has 0, 1, or multiple solutions.
 * @returns The number of possible solutions found.
 */
export function countSolutions(grid: SudokuGrid, size: number, boxSize: number): number {
    // Implementation of a non-randomized backtracking solver to check uniqueness
    return 1;
}
