import type { Difficulty, SudokuBoard, SudokuGrid } from './types';
import { isValid } from './validator';
import { solveWithSingles } from './solver';

export function generateSudoku(difficulty: Difficulty, size: number = 9): SudokuBoard {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) {
    throw new Error("Grid size must be a perfect square (e.g., 4, 9, 16).");
  }

  const solution = generateFullGrid(size, boxSize);
  const initial = solution.map(row => [...row]);
  const cluesTarget = getCluesCount(difficulty, size);

  pokeHoles(initial, cluesTarget, size, boxSize);

  // Never expected to fail: every number was taken out only after deduction still finished the puzzle.
  // If it ever does, a player would get a puzzle that needs a guess, so fail loudly instead.
  if (!sameGrid(solveWithSingles(initial, size, boxSize), solution)) {
    throw new Error("Generated a puzzle that cannot be solved by deduction alone");
  }

  return { solution, initial, size, boxSize };
}

function generateFullGrid(size: number, boxSize: number): SudokuGrid {
  const grid: SudokuGrid = Array.from({ length: size }, () => new Array(size).fill(0));
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


function getCandidates(grid: SudokuGrid, r: number, c: number, size: number, boxSize: number): number[] {
  const candidates = [];
  for (let v = 1; v <= size; v++) {
    if (isValid(grid, r, c, v, size, boxSize)) candidates.push(v);
  }
  return candidates;
}

function findBestEmptyCell(grid: SudokuGrid, size: number, boxSize: number) {
  let best: { r: number; c: number; options: number[] } | null = null;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 0) continue;

      const options = getCandidates(grid, r, c, size, boxSize);

      if (options.length === 0) return { r, c, options: [] };
      if (options.length === 1) return { r, c, options };

      if (!best || options.length < best.options.length) {
        best = { r, c, options };
      }
    }
  }

  return best;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function getCluesCount(difficulty: Difficulty, size: number): number {
  const totalCells = size * size;
  // Share of the cells that stay given. The generator cannot always go as low as the hardest ask (it only removes a
  // number while deduction still finishes the puzzle), so a puzzle may keep a few more.
  const ratios: Record<Difficulty, number> = {
    beginner: 0.6,
    easy: 0.5,
    medium: 0.4,
    hard: 0.35,
    expert: 0.3
  };

  // Fail loudly: an unknown difficulty would otherwise yield NaN clues and a fully solved board.
  if (!Object.hasOwn(ratios, difficulty)) {
    throw new Error(`Unknown difficulty: ${String(difficulty)}`);
  }

  return Math.floor(totalCells * ratios[difficulty]);
}

function sameGrid(a: SudokuGrid | null, b: SudokuGrid): boolean {
  return a !== null && a.every((row, r) => row.every((value, c) => value === b[r][c]));
}

/**
 * Empties cells one by one, in random order, until `target` clues are left or no more can go.
 * A cell is emptied only if the two basic deductions (see solveWithSingles) can still finish the puzzle: that keeps
 * every puzzle solvable without guessing, and it also keeps the solution unique, since numbers that deduction forces
 * can only belong to the one solution.
 */
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

    if (solveWithSingles(grid, size, boxSize) !== null) {
      counterClues--;
    } else {
      grid[row][col] = t;
    }
  }
}

export function countSolutions(grid: SudokuGrid, size: number, boxSize: number): number {
  const bestCell = findBestEmptyCell(grid, size, boxSize);

  if (!bestCell) return 1;

  const { r, c, options } = bestCell;

  if (options.length === 0) return 0;

  let count = 0;

  for (const val of options) {
    grid[r][c] = val;
    count += countSolutions(grid, size, boxSize);
    grid[r][c] = 0;

    if (count > 1) return count;
  }
  return count;
}