export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export type SudokuGrid = number[][];

export interface SudokuBoard {
  solution: SudokuGrid;
  initial: SudokuGrid;
  size: number;
  boxSize: number;
}
