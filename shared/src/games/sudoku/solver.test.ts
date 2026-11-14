import { describe, expect, it } from 'vitest';
import { solveWithSingles } from './solver';
import { generateSudoku } from './generator';
import type { SudokuGrid } from './types';

const parse = (text: string, size = 9): SudokuGrid =>
  Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => Number(text[r * size + c])));

// A well known easy puzzle: every step is a cell with one possible number or a number with one possible cell.
const EASY = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const EASY_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

// Unique solution, 24 given numbers, and no cell with one candidate and no number with one place at the start:
// a person must guess or use a deduction beyond the two basic ones. The tests of the guarantees check both claims
// with checkers that share nothing with the code under test.
export const NEEDS_A_GUESS = '097000000000014000301702000006000000030400007000090831000007350400000008810000060';

describe('solveWithSingles', () => {
  it('finishes a puzzle that the two basic deductions can finish, on the one solution', () => {
    expect(solveWithSingles(parse(EASY), 9, 3)).toEqual(parse(EASY_SOLUTION));
  });

  it('gives up on a puzzle with one solution that needs a guess, instead of guessing', () => {
    expect(solveWithSingles(parse(NEEDS_A_GUESS), 9, 3)).toBeNull();
  });

  it('gives up on a puzzle with many solutions', () => {
    expect(solveWithSingles(parse('0'.repeat(81)), 9, 3)).toBeNull();
  });

  it('does not change the grid it is given', () => {
    const puzzle = parse(EASY);
    const copy = puzzle.map((row) => [...row]);

    solveWithSingles(puzzle, 9, 3);

    expect(puzzle).toEqual(copy);
  });

  it('returns a finished grid as it is', () => {
    expect(solveWithSingles(parse(EASY_SOLUTION), 9, 3)).toEqual(parse(EASY_SOLUTION));
  });

  describe('refuses a puzzle whose given numbers clash', () => {
    const empty = () => parse('0'.repeat(81));

    it('in a row', () => {
      const puzzle = empty();
      puzzle[0][0] = 5; puzzle[0][8] = 5;

      expect(solveWithSingles(puzzle, 9, 3)).toBeNull();
    });

    it('in a column', () => {
      const puzzle = empty();
      puzzle[0][0] = 5; puzzle[8][0] = 5;

      expect(solveWithSingles(puzzle, 9, 3)).toBeNull();
    });

    it('in a box', () => {
      const puzzle = empty();
      puzzle[0][0] = 5; puzzle[1][1] = 5;

      expect(solveWithSingles(puzzle, 9, 3)).toBeNull();
    });

    it('also when the rest of the puzzle could be finished', () => {
      const puzzle = parse(EASY_SOLUTION);
      puzzle[0][0] = puzzle[0][1];

      expect(solveWithSingles(puzzle, 9, 3)).toBeNull();
    });
  });

  it('refuses a puzzle with a cell where no number can go, without changing it', () => {
    const puzzle = parse('0'.repeat(81));
    for (let c = 0; c < 8; c++) puzzle[0][c] = c + 1;
    puzzle[1][8] = 9;

    expect(solveWithSingles(puzzle, 9, 3)).toBeNull();
    expect(puzzle[0][8]).toBe(0);
  });

  it('works on a 4x4 grid', () => {
    const puzzle = parse('1230' + '3412' + '2143' + '4320', 4);

    expect(solveWithSingles(puzzle, 4, 2)).toEqual(parse('1234' + '3412' + '2143' + '4321', 4));
  });

  it.each(['beginner', 'easy', 'medium'] as const)('finishes every 4x4 puzzle made for the %s level on its own solution', (level) => {
    for (let i = 0; i < 20; i++) {
      const { initial, solution } = generateSudoku(level === 'beginner' ? 'easy' : level, 4);

      expect(solveWithSingles(initial, 4, 2)).toEqual(solution);
    }
  });
});
