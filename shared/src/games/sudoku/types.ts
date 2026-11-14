/** From the gentlest to the hardest: each level leaves fewer given numbers. Every one can be solved by deduction alone. */
export const DIFFICULTIES = ['beginner', 'easy', 'medium', 'hard', 'expert'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export type SudokuGrid = number[][];

export interface SudokuBoard {
  solution: SudokuGrid;
  initial: SudokuGrid;
  size: number;
  boxSize: number;
}
