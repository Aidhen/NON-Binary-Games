import { BaseGameState } from '../src/gameLogic.js';
import { SudokuBoard } from './generator.js';

export interface SudokuGameState extends BaseGameState {
  gameType: 'sudoku';
  data: {
    board: SudokuBoard;
    currentGrid: number[][];
  };
}