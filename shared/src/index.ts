import type { SudokuBoard, Difficulty } from './games/sudoku/types';
import type { TakuzuGrid } from './games/takuzu/types';
import type { Emote } from './emotes';
import type { GameId } from './games';
import type { PlayerColor, PlayerProfile } from './players';
import type { CellUpdatePayload, CellUpdateResult, ToggleNotePayload, SelectCellPayload } from './schemas';

export * from './games/sudoku/index';
export * from './games/takuzu/index';
export * from './schemas';
export * from './emotes';
export * from './games';
export * from './players';

export type DifficultyLevel = Difficulty;

/** Players that can be in the same room (one color each, see the palette of the board). */
export const MAX_PLAYERS_PER_ROOM = 5;

/** `too-fast`: this connection (or the whole server) is creating rooms faster than a game needs. */
export type JoinError = 'room-full' | 'server-full' | 'too-fast';

/** Who wrote each note, by alias (see `SocketData.alias`): the identity of a player never leaves the server. */
export type NotesGrid = Record<string, Record<number, string>>;

/** The vote of one player, by alias (see `SocketData.alias`). */
export interface LobbyVote {
  alias: string;
  game: GameId;
}

/**
 * What a room is doing. `game` is null while the players are still at the table choosing, and `votes` says who
 * wants what. Once a game is open it stays the game of the room, and there are no votes left to tell.
 */
export interface LobbyState {
  game: GameId | null;
  votes: LobbyVote[];
}

/** The Sudoku of a room, with everything a player needs to show it. */
export interface SudokuStartedPayload {
  game: 'sudoku';
  board: SudokuBoard;
  currentGrid: number[][];
  notesGrid: NotesGrid;
  difficulty: DifficultyLevel;
}

/**
 * The Takuzu of a room. The solution stays on the server: the page can show a broken rule without it, and the
 * server is the one who says the puzzle is solved.
 */
export interface TakuzuStartedPayload {
  game: 'takuzu';
  size: number;
  /** The cells the puzzle gave, which nobody can change. */
  initial: TakuzuGrid;
  currentGrid: TakuzuGrid;
  difficulty: DifficultyLevel;
}

/**
 * What the players are told when a game opens or restarts, and the one who joins a room that is playing it.
 * `game` says which one it is: the page of a game ignores the start of any other.
 */
export type GameStartedPayload = SudokuStartedPayload | TakuzuStartedPayload;

export interface ServerToClientEvents {
  /** Sent to a player who joins, and to everybody each time a vote changes, a voter leaves or the game opens. */
  "lobby-updated": (data: LobbyState) => void;
  /** The game of the room: sent when it opens or restarts, and to whoever joins a room that is playing it. */
  "game-started": (payload: GameStartedPayload) => void;
  "cell-updated": (data: { r: number; c: number; v: number }) => void;
  "player-selected-cell": (payload: { alias: string, r: number | null, c: number | null }) => void;
  "player-disconnected": (alias: string) => void;
  "join-error": (reason: JoinError) => void;
  "game-won": () => void;
  "note-toggled": (data: { r: number; c: number; v: number; alias: string | null }) => void;
  "emote-received": (data: { alias: string; emote: Emote }) => void;
  /** Sent to the player who has just joined: the alias that is theirs in the list of players. */
  "joined-as": (alias: string) => void;
  /** The players in the room, in the order they came, each time somebody comes, leaves or changes color. */
  "players-updated": (data: { players: PlayerProfile[] }) => void;
}

/**
 * Only `join-room` carries a room id: the server remembers the room of each
 * socket (see SocketData), so every other event is implicitly scoped to the
 * room the sender has actually joined.
 */
export interface ClientToServerEvents {
  "join-room": (roomId: string) => void;
  /** The game this player wants the room to open, or `null` to take the vote back. Ignored once a game is open. */
  "vote-game": (game: GameId | null) => void;
  "cell-update": (data: CellUpdatePayload, acknowledge?: (result: CellUpdateResult) => void) => void;
  "select-cell": (payload: SelectCellPayload) => void;
  "restart-game": (difficulty: DifficultyLevel) => void;
  "toggle-note": (data: ToggleNotePayload) => void;
  "send-emote": (emote: Emote) => void;
  "set-color": (color: PlayerColor) => void;
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
  /** Timestamp (ms) of the last vote accepted from this socket, for the cooldown. */
  lastVoteAt?: number;
}
