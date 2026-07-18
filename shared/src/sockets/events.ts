import type { SudokuBoard } from '../games/sudoku/types';

export const MAX_PLAYERS = 4;

export interface GameState {
  players: string[];
  status: 'waiting' | 'playing' | 'finished';
}

export interface SudokuGameState extends GameState {
  gameType: 'sudoku';
  data: {
    board: SudokuBoard;
    currentGrid: number[][];
  };
}

export function canJoinGame(state: GameState): boolean {
  return state.players.length < MAX_PLAYERS && state.status === 'waiting';
}