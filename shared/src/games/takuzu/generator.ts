import { TAKUZU_SYMBOLS } from './types';
import type { TakuzuBoard, TakuzuGrid } from './types';
import type { Difficulty } from '../sudoku/types';
import { solveTakuzuByDeduction } from './solver';

/**
 * The size of the grid and the share of cells that stay given, for each level. The levels are the ones of the Sudoku,
 * so that a room can restart with the same list of names. The generator only empties a cell while deduction still
 * finishes the puzzle, so a puzzle may keep a few more cells than the share says.
 */
const LEVELS: Record<Difficulty, { size: number; givenRatio: number }> = {
  beginner: { size: 6, givenRatio: 0.55 },
  easy: { size: 8, givenRatio: 0.5 },
  medium: { size: 8, givenRatio: 0.4 },
  hard: { size: 10, givenRatio: 0.38 },
  expert: { size: 12, givenRatio: 0.33 },
};

/** Looking for a full grid is a search with luck in it: a try that goes on too long is dropped and started again. */
const NODES_PER_ATTEMPT = 5000;
const MAX_ATTEMPTS = 50;

export function getTakuzuLevel(difficulty: Difficulty): { size: number; clues: number } {
  // Fail loudly: an unknown difficulty would otherwise yield NaN clues and a fully solved board.
  if (!Object.hasOwn(LEVELS, difficulty)) throw new Error(`Unknown difficulty: ${String(difficulty)}`);

  const { size, givenRatio } = LEVELS[difficulty];
  return { size, clues: Math.floor(size * size * givenRatio) };
}

export function generateTakuzu(difficulty: Difficulty): TakuzuBoard {
  const { size, clues } = getTakuzuLevel(difficulty);
  const solution = generateSolution(size);
  const initial = solution.map((row) => [...row]);

  pokeHoles(initial, clues);

  // Never expected to fail: every cell was emptied only after deduction still finished the puzzle.
  // If it ever does, a player would get a puzzle that needs a guess, so fail loudly instead.
  const solved = solveTakuzuByDeduction(initial);
  if (!solved || !solved.every((row, r) => row.every((value, c) => value === solution[r][c]))) {
    throw new Error("Generated a puzzle that cannot be solved by deduction alone");
  }

  return { solution, initial, size };
}

/** Every row of this length that is balanced and has no three equal symbols in a row. */
function validRows(size: number): number[][] {
  const rows: number[][] = [];
  const row: number[] = [];
  const counts = [0, 0, 0];

  const extend = () => {
    if (row.length === size) { rows.push([...row]); return; }
    for (const symbol of TAKUZU_SYMBOLS) {
      const k = row.length;
      if (counts[symbol] >= size / 2) continue;
      if (k >= 2 && row[k - 1] === symbol && row[k - 2] === symbol) continue;
      row.push(symbol);
      counts[symbol]++;
      extend();
      counts[symbol]--;
      row.pop();
    }
  };
  extend();

  return rows;
}

function generateSolution(size: number): TakuzuGrid {
  const rows = validRows(size);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grid: TakuzuGrid = [];
    // How many of each symbol a column holds so far.
    const columnCounts = Array.from({ length: size }, () => [0, 0, 0]);
    let nodes = 0;

    const fillRow = (): boolean => {
      // The rows are all different by construction, the columns only once the grid is full.
      if (grid.length === size) return columnsAreDifferent(grid);

      const depth = grid.length;
      const candidates = [...rows];
      shuffleArray(candidates);

      for (const candidate of candidates) {
        if (++nodes > NODES_PER_ATTEMPT) return false;
        if (grid.some((previous) => previous.every((value, c) => value === candidate[c]))) continue;
        if (candidate.some((symbol, c) => columnCounts[c][symbol] >= size / 2)) continue;
        if (depth >= 2 && candidate.some((symbol, c) => grid[depth - 1][c] === symbol && grid[depth - 2][c] === symbol)) continue;

        grid.push(candidate);
        candidate.forEach((symbol, c) => columnCounts[c][symbol]++);
        if (fillRow()) return true;
        candidate.forEach((symbol, c) => columnCounts[c][symbol]--);
        grid.pop();
        if (nodes > NODES_PER_ATTEMPT) return false;
      }
      return false;
    };

    if (fillRow()) return grid;
  }

  throw new Error("Could not build a Takuzu grid");
}

function columnsAreDifferent(grid: TakuzuGrid): boolean {
  const columns = new Set(grid[0].map((_, c) => grid.map((row) => row[c]).join('')));
  return columns.size === grid.length;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Empties cells one by one, in random order, until `target` clues are left or no more can go.
 * A cell is emptied only if deduction can still finish the puzzle: that keeps every puzzle solvable without
 * guessing, and it also keeps the solution unique, since symbols that deduction forces can only belong to the one solution.
 */
function pokeHoles(grid: TakuzuGrid, target: number): void {
  const size = grid.length;
  const coords: [number, number][] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) coords.push([r, c]);
  shuffleArray(coords);

  let clues = size * size;

  for (let i = 0; i < coords.length && clues > target; i++) {
    const [r, c] = coords[i];
    const symbol = grid[r][c];
    grid[r][c] = 0;

    if (solveTakuzuByDeduction(grid) !== null) clues--;
    else grid[r][c] = symbol;
  }
}
