import type { DifficultyLevel, GameId, NotesGrid, FlowerGrid, FlowerMines, FlowerStatus, PlayerAnimal, PlayerColor, SudokuBoard, SudokuGrid, TakuzuBoard, TakuzuGrid } from "@nbg/shared";

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
}

/** The state of a Takuzu that a room is playing. It has no notes: a cell holds a symbol or nothing. */
export interface TakuzuGame {
  id: 'takuzu';
  board: TakuzuBoard;
  difficulty: DifficultyLevel;
  currentGrid: TakuzuGrid;
  filledCells: number;
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

/** A game where the players write a value in a cell: it is what `cell-update` works on. */
export type ValueGridGame = SudokuGame | TakuzuGame;

/** A game played on a square grid of cells: it is what `select-cell` and `restart-game` work on. */
export type GridGame = ValueGridGame | FlowerFieldGame;

/** The game a room has open. A new game adds its own state here, told apart by `id`. */
export type RoomGame = GridGame;

export interface RoomState {
  /** Null while the players are still choosing (see `votes`). Once chosen, the game of a room does not change. */
  game: RoomGame | null;
  /** The game each player in the room wants (by player id). At most one per player, gone when they leave or the game opens. */
  votes: Map<string, GameId>;
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
