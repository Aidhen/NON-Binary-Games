import type { SudokuBoard, Difficulty } from './games/sudoku/types';
import type { Emote } from './emotes';
import type { CellUpdatePayload, CellUpdateResult, ToggleNotePayload, SelectCellPayload } from './schemas';

export * from './games/sudoku/index';
export * from './gameLogic';
export * from './schemas';
export * from './emotes';

export type DifficultyLevel = Difficulty;

/** Players that can be in the same room (one color each, see the palette of the board). */
export const MAX_PLAYERS_PER_ROOM = 5;

export type JoinError = 'room-full' | 'server-full';

export type NotesGrid = Record<string, Record<number, string>>;

export interface ServerToClientEvents {
  "game-started": (payload: { board: SudokuBoard; currentGrid: number[][]; notesGrid: NotesGrid; difficulty: DifficultyLevel }) => void;
  "cell-updated": (data: { r: number; c: number; v: number }) => void;
  "move-rejected": (data: { r: number; c: number; reason: string }) => void;
  "error": (message: string) => void;
  "player-selected-cell": (payload: { playerId: string, r: number | null, c: number | null }) => void;
  "player-disconnected": (playerId: string) => void;
  "join-error": (reason: JoinError) => void;
  "game-won": () => void;
  "note-toggled": (data: { r: number; c: number; v: number; playerId: string | null }) => void;
  "emote-received": (data: { playerId: string; emote: Emote }) => void;
}

/**
 * Only `join-room` carries a room id: the server remembers the room of each
 * socket (see SocketData), so every other event is implicitly scoped to the
 * room the sender has actually joined.
 */
export interface ClientToServerEvents {
  "join-room": (roomId: string, difficulty: DifficultyLevel) => void;
  "cell-update": (data: CellUpdatePayload, acknowledge?: (result: CellUpdateResult) => void) => void;
  "select-cell": (payload: SelectCellPayload) => void;
  "restart-game": (difficulty: DifficultyLevel) => void;
  "toggle-note": (data: ToggleNotePayload) => void;
  "send-emote": (emote: Emote) => void;
}

/** Per-socket state kept by the server (`socket.data`). */
export interface SocketData {
  /** Stable identity of the player: the id sent by the browser, or the socket id when it sent none. */
  playerId: string;
  roomId?: string;
  /** Timestamp (ms) of the last emote accepted from this socket, for the cooldown. */
  lastEmoteAt?: number;
}
