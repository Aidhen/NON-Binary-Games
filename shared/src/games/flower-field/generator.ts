import type { Difficulty } from '../sudoku/types';
import type { FlowerMines } from './types';
import { canBeSolvedWithoutGuessing } from './solver';

/**
 * The size of the field and how many mines it has, for each level. The levels are the ones of the Sudoku, so that
 * a room can restart with the same list of names. A mine every six or seven cells at most: with more, a field that
 * needs no guess becomes too rare to find.
 */
const LEVELS: Record<Difficulty, { size: number; mines: number }> = {
  beginner: { size: 8, mines: 8 },
  easy: { size: 9, mines: 12 },
  medium: { size: 10, mines: 16 },
  hard: { size: 12, mines: 24 },
  expert: { size: 14, mines: 34 },
};

/** Fields that need a guess are thrown away and laid out again: a try costs little, but there must be an end. */
const MAX_ATTEMPTS = 200;

export function getFlowerFieldLevel(difficulty: Difficulty): { size: number; mines: number } {
  // Fail loudly: an unknown difficulty would otherwise give a field of nothing.
  if (!Object.hasOwn(LEVELS, difficulty)) throw new Error(`Unknown difficulty: ${String(difficulty)}`);

  return LEVELS[difficulty];
}

/**
 * Lays out the mines once the first cell is chosen: that cell and the ones around it are free, so that the first
 * move always opens an area, and the field is one that deduction alone can finish (see canBeSolvedWithoutGuessing).
 * It throws when there is no room for the mines, or when no field without a guess was found in time.
 */
export function layMines(size: number, mineCount: number, firstR: number, firstC: number): FlowerMines {
  const candidates: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (Math.abs(r - firstR) > 1 || Math.abs(c - firstC) > 1) candidates.push(r * size + c);
    }
  }
  if (mineCount > candidates.length) throw new Error('There is no room for that many mines');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    shuffleArray(candidates);
    const mines: FlowerMines = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    for (const cell of candidates.slice(0, mineCount)) mines[Math.floor(cell / size)][cell % size] = true;

    if (canBeSolvedWithoutGuessing(mines, firstR, firstC)) return mines;
  }

  throw new Error('Could not lay out a field that needs no guess');
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
