import type { Difficulty, SudokuBoard, SudokuGrid } from './types.js';
import { isValid } from './validator.js';

export function generateSudoku(difficulty: Difficulty, size: number = 9): SudokuBoard {
    const boxSize = Math.sqrt(size);
    if (!Number.isInteger(boxSize)) {
        throw new Error("Grid size must be a perfect square (e.g., 4, 9, 16).");
    }

    const solution = generateFullGrid(size, boxSize);
    const initial = solution.map(row => [...row]);
    const cluesTarget = getCluesCount(difficulty, size);

    pokeHoles(initial, cluesTarget, size, boxSize);

    return { solution, initial, size, boxSize };
}

function generateFullGrid(size: number, boxSize: number): SudokuGrid {
    const grid: SudokuGrid = Array.from({ length: size }, () => Array(size).fill(0));
    fillGrid(grid, size, boxSize);
    return grid;
}


function fillGrid(grid: SudokuGrid, size: number, boxSize: number): boolean {
    const emptyCell = findEmptyCell(grid, size);
    if (!emptyCell) { return true; }

    const numbers = Array.from({ length: size }, (_, i) => i + 1);
    shuffleArray(numbers);

    for (const num of numbers) {
        const [row, col] = emptyCell;
        if (isValid(grid, row, col, num, size, boxSize)) {
            grid[row][col] = num;
            if (fillGrid(grid, size, boxSize)) { return true; }
            grid[row][col] = 0;
        }
    }
    return false;
}


function findEmptyCell(grid: SudokuGrid, size: number): [number, number] | null {
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (grid[row][col] === 0) { return [row, col]; }
        }
    }
    return null;
}


function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getCluesCount(difficulty: Difficulty, size: number): number {
    const totalCells = size * size;
    const ratios: Record<Difficulty, number> = {
        easy: 0.5,
        medium: 0.4,
        hard: 0.3
    };
    return Math.floor(totalCells * ratios[difficulty]);
}

function pokeHoles(grid: SudokuGrid, target: number, size: number, boxSize: number): void {
    const coords: [number, number][] = [];
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            coords.push([row, col]);
        }
    }

    shuffleArray(coords);

    let counterClues = size * size;

    for (let i = 0; i < coords.length && counterClues > target; i++) {
        const [row, col] = coords[i];
        const t = grid[row][col];
        grid[row][col] = 0;
        if(countSolutions(grid, size, boxSize) === 1){ counterClues--;}
        else {
            grid[row][col] = t;
        }
    }
}

export function countSolutions(grid: SudokuGrid, size: number, boxSize: number): number {
    const emptyCell = findEmptyCell(grid, size);
    if (emptyCell === null) return 1;

    const [row, col] = emptyCell;
    let count = 0;

    for (let i = 1; i <= size; i++) {
        if(isValid(grid, row, col, i, size, boxSize)) {
            grid[row][col] = i;
            count += countSolutions(grid, size, boxSize);
            
            grid[row][col] = 0;
            if(count > 1) return count;  
        }
    }
    return count;
}