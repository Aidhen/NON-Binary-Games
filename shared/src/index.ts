import { SudokuBoard } from './games/sudoku/types';

export * from './games/sudoku/index';
export * from './gameLogic';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface ServerToClientEvents {
  "game-started": (payload: { board: SudokuBoard; currentGrid: number[][] }) => void;
  "cell-updated": (data: { r: number; c: number; v: number }) => void;
  "move-rejected": (data: { r: number; c: number; reason: string }) => void;
  "error": (message: string) => void;
  "player-selected-cell": (payload: { playerId: string, r: number | null, c: number | null }) => void;
  "player-disconnected": (playerId: string) => void;
  "game-won": () => void;
}

export interface ClientToServerEvents {
  "join-room": (roomId: string, difficulty: "easy" | "medium" | "hard") => void;
  "cell-update": (roomId: string, data: { r: number; c: number; v: number }) => void;
  "select-cell": (roomId: string, payload: { r: number | null, c: number | null }) => void;
  "restart-game": (roomId: string, difficulty: DifficultyLevel) => void;
}