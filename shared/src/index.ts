import type { SudokuBoard, Difficulty } from './games/sudoku/types';
import type { Emote } from './emotes';
import type { CellUpdatePayload, CellUpdateResult, ToggleNotePayload, SelectCellPayload } from './schemas';

export * from './games/sudoku/index';
export * from './schemas';
export * from './emotes';

export type DifficultyLevel = Difficulty;

/** Players that can be in the same room (one color each, see the palette of the board). */
export const MAX_PLAYERS_PER_ROOM = 5;

/** `too-fast`: this connection (or the whole server) is creating rooms faster than a game needs. */
export type JoinError = 'room-full' | 'server-full' | 'too-fast';

/** Who wrote each note, by alias (see `SocketData.alias`): the identity of a player never leaves the server. */
export type NotesGrid = Record<string, Record<number, string>>;

export interface ServerToClientEvents {
  "game-started": (payload: { board: SudokuBoard; currentGrid: number[][]; notesGrid: NotesGrid; difficulty: DifficultyLevel }) => void;
  "cell-updated": (data: { r: number; c: number; v: number }) => void;
  "player-selected-cell": (payload: { alias: string, r: number | null, c: number | null }) => void;
  "player-disconnected": (alias: string) => void;
  "join-error": (reason: JoinError) => void;
  "game-won": () => void;
  "note-toggled": (data: { r: number; c: number; v: number; alias: string | null }) => void;
  "emote-received": (data: { alias: string; emote: Emote }) => void;
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
  /** Stable identity of the player: the id sent by the browser, or the socket id when it sent none. Never sent to other players. */
  playerId: string;
  roomId?: string;
  /**
   * What the other players of the room call this player: random, valid for this room only and the same
   * for every tab of the player. It cannot be used to recognise the player in another room, or to act as them.
   */
  alias?: string;
  /** Where the connection comes from, for the limits per address. Kept in memory only: never sent, never logged. */
  address?: string;
  /** Timestamp (ms) of the last emote accepted from this socket, for the cooldown. */
  lastEmoteAt?: number;
}
