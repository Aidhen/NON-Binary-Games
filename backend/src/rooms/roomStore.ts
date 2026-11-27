import type { DifficultyLevel, GameId, NotesGrid, WordLanguage, WordSearchPuzzle, FlowerGrid, FlowerMines, FlowerStatus, PlayerAnimal, PlayerColor, SudokuBoard, SudokuGrid, TakuzuBoard, TakuzuGrid } from "@nbg/shared";

/** How a player is shown to the others in one room: the animal of their name and their color. */
export interface RoomProfile {
  animal: PlayerAnimal;
  color: PlayerColor;
  /** Timestamp (ms) of the last request to change color from this player, for the cooldown. */
  lastColorAt?: number;
}

/** The state of a Sudoku that a room is playing. */
export interface SudokuGame {
  id: 'sudoku';
  board: SudokuBoard;
  difficulty: DifficultyLevel;
  currentGrid: SudokuGrid;
  filledCells: number;
  notesGrid: NotesGrid;
  /** The board has been solved once: the room is told once, and a restart makes a new game. */
  won: boolean;
}

/** The state of a Takuzu that a room is playing. It has no notes: a cell holds a symbol or nothing. */
export interface TakuzuGame {
  id: 'takuzu';
  board: TakuzuBoard;
  difficulty: DifficultyLevel;
  currentGrid: TakuzuGrid;
  filledCells: number;
  /** As for the Sudoku. */
  won: boolean;
}

/** The state of a Flower Field that a room is playing. */
export interface FlowerFieldGame {
  id: 'flower-field';
  difficulty: DifficultyLevel;
  size: number;
  mineCount: number;
  /** Opening a mine loses the game for the room. Off, the mine is only marked. It stays from one game of the room to the next. */
  explosive: boolean;
  /** Where the mines are. Laid out at the first cell that is opened, so that it is never a mine: null until then. */
  mines: FlowerMines | null;
  /** What the players see of each cell. */
  grid: FlowerGrid;
  /** Who put the flag on each cell, by alias, under the key `r-c`. At most one per cell. */
  flags: Map<string, string>;
  openedCells: number;
  status: FlowerStatus;
}

/** The state of a Word Search that a room is playing. The puzzle, with where each word lies, never leaves the server. */
export interface WordSearchGame {
  id: 'word-search';
  difficulty: DifficultyLevel;
  /** The language of the words. It stays from one game of the room to the next. */
  language: WordLanguage;
  puzzle: WordSearchPuzzle;
  /** The words found, by word: who found each one (by alias) and the two ends of it. */
  found: Map<string, { alias: string; from: { r: number; c: number }; to: { r: number; c: number } }>;
  status: 'playing' | 'won';
}

/** A card some player holds face up: it is not resolved until they flip a second one. */
export interface MemoryHand {
  index: number;
  alias: string;
  /** When the card goes back down by itself (ms timestamp, see MEMORY_HAND_MS). */
  until: number;
}

/** Two cards that did not match: nobody can flip them until `until` (ms timestamp). */
export interface MemoryLock {
  indices: [number, number];
  until: number;
}

/** The state of a Memory that a room is playing. The deck, with the face of every card, never leaves the server. */
export interface MemoryGame {
  id: 'memory';
  difficulty: DifficultyLevel;
  /** The face of each card, by its place. */
  deck: number[];
  /** The cards found, by place: who found each pair (by alias). Both cards of a pair are here. */
  matched: Map<number, string>;
  /** The card each player holds face up, by player id. At most one each, gone when they flip a second one, leave, or hold it past `until`. */
  hands: Map<string, MemoryHand>;
  /** The pairs that did not match and are still locked. Each card is in one lock at most, and the ones that ran out are dropped at the next flip. */
  locks: MemoryLock[];
  status: 'playing' | 'won';
}

/** A game where the players write a value in a cell: it is what `cell-update` works on. */
export type ValueGridGame = SudokuGame | TakuzuGame;

/** A game played on a square grid of cells: it is what `select-cell` and `restart-game` work on. */
export type GridGame = ValueGridGame | FlowerFieldGame | WordSearchGame;

/** The game a room has open. A new game adds its own state here, told apart by `id`. The Memory is not played on a grid: `select-cell` does not apply to it. */
export type RoomGame = GridGame | MemoryGame;

export interface RoomState {
  /** Null while the players are still choosing (see `votes`). Once chosen it stays until the room votes to go back to the table (see `tableVotes`). */
  game: RoomGame | null;
  /** The game each player in the room wants (by player id). At most one per player, gone when they leave or the game opens. */
  votes: Map<string, GameId>;
  /** The players (by player id) who want to leave the game and go back to the table. Gone when they leave, or when a game opens or closes. */
  tableVotes: Set<string>;
  /** Sockets of each player: the same player can have more than one open (two tabs). */
  players: Map<string, Set<string>>;
  /** The alias of each player (by player id) in this room: what the other players see instead of the id. */
  aliases: Map<string, string>;
  /** The animal and color of each player (by player id) in this room. Kept and pruned together with the aliases. */
  profiles: Map<string, RoomProfile>;
  /** A cell or a note was changed since the board was generated. An empty room nobody played in (or with no game yet) is not worth keeping. */
  played: boolean;
}

/** How long an empty room is kept, so that a dropped connection does not cost the game. */
export const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;

/** Rooms kept at the same time: a room costs memory, and opening its game costs CPU. */
export const MAX_ROOMS = 200;

/**
 * Every access to the rooms goes through here, so the way they are kept (today a
 * Map in memory) can change without touching the socket handlers.
 *
 * A room whose last player left is not deleted right away: it expires after
 * `emptyRoomTtlMs` unless someone comes back first. A room nobody played in has
 * nothing to lose, so it goes away immediately.
 */
export class RoomStore {
  private readonly rooms = new Map<string, RoomState>();
  private readonly expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    public emptyRoomTtlMs: number = EMPTY_ROOM_TTL_MS,
    public maxRooms: number = MAX_ROOMS,
  ) {}

  get size(): number {
    return this.rooms.size;
  }

  /** True when no new room can be created (rooms that already exist can still be joined). */
  isFull(): boolean {
    return this.rooms.size >= this.maxRooms;
  }

  get(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  has(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  set(roomId: string, room: RoomState): this {
    this.rooms.set(roomId, room);
    return this;
  }

  delete(roomId: string): boolean {
    this.cancelExpiry(roomId);
    return this.rooms.delete(roomId);
  }

  clear(): void {
    this.expiryTimers.forEach(clearTimeout);
    this.expiryTimers.clear();
    this.rooms.clear();
  }

  /** Called when a room has no players left. With a TTL of 0, or if nobody played in it, the room goes away immediately. */
  expireWhenEmpty(roomId: string): void {
    this.cancelExpiry(roomId);

    if (this.emptyRoomTtlMs <= 0 || this.rooms.get(roomId)?.played === false) {
      this.rooms.delete(roomId);
      return;
    }

    const timer = setTimeout(() => {
      this.expiryTimers.delete(roomId);
      if (this.rooms.get(roomId)?.players.size === 0) this.rooms.delete(roomId);
    }, this.emptyRoomTtlMs);
    // Waiting for a room to expire must not keep the process alive.
    timer.unref();
    this.expiryTimers.set(roomId, timer);
  }

  /** Called when someone joins: the room is in use again. */
  cancelExpiry(roomId: string): void {
    const timer = this.expiryTimers.get(roomId);
    if (timer === undefined) return;

    clearTimeout(timer);
    this.expiryTimers.delete(roomId);
  }
}
