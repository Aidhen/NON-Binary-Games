export type Difficulty = 'easy' | 'medium' | 'hard';

export type SudokuGrid = number[][];

export interface SudokuBoard {
    solution: SudokuGrid;
    initial: SudokuGrid;
    size: number;
    boxSize: number;
}