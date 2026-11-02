import type { SudokuBoard, Difficulty } from './games/sudoku/types';
import type { CellUpdatePayload, ToggleNotePayload, SelectCellPayload } from './schemas';

export * from './games/sudoku/index';
export * from './gameLogic';
export * from './schemas';

export type DifficultyLevel = Difficulty;

export type NotesGrid = Record<string, Record<number, string>>;

export interface ServerToClientEvents {
  "game-started": (payload: { board: SudokuBoard; currentGrid: number[][]; notesGrid: NotesGrid; difficulty: DifficultyLevel }) => void;
  "cell-updated": (data: { r: number; c: number; v: number }) => void;
  "move-rejected": (data: { r: number; c: number; reason: string }) => void;
  "error": (message: string) => void;
  "player-selected-cell": (payload: { playerId: string, r: number | null, c: number | null }) => void;
  "player-disconnected": (playerId: string) => void;
  "game-won": () => void;
  "note-toggled": (data: { r: number; c: number; v: number; playerId: string | null }) => void;
}

/**
 * Only `join-room` carries a room id: the server remembers the room of each
 * socket (see SocketData), so every other event is implicitly scoped to the
 * room the sender has actually joined.
 */
export interface ClientToServerEvents {
  "join-room": (roomId: string, difficulty: DifficultyLevel) => void;
  "cell-update": (data: CellUpdatePayload) => void;
  "select-cell": (payload: SelectCellPayload) => void;
  "restart-game": (difficulty: DifficultyLevel) => void;
  "toggle-note": (data: ToggleNotePayload) => void;
}

/** Per-socket state kept by the server (`socket.data`). */
export interface SocketData {
  roomId?: string;
}
