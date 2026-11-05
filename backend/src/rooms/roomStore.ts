import type { DifficultyLevel, NotesGrid, SudokuBoard, SudokuGrid } from "@nbg/shared";

export interface RoomState {
  board: SudokuBoard;
  difficulty: DifficultyLevel;
  currentGrid: SudokuGrid;
  /** Sockets of each player: the same player can have more than one open (two tabs). */
  players: Map<string, Set<string>>;
  filledCells: number;
  notesGrid: NotesGrid;
}

/** How long an empty room is kept, so that a dropped connection does not cost the game. */
export const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;

/**
 * Every access to the rooms goes through here, so the way they are kept (today a
 * Map in memory) can change without touching the socket handlers.
 *
 * A room whose last player left is not deleted right away: it expires after
 * `emptyRoomTtlMs` unless someone comes back first.
 */
export class RoomStore {
  private readonly rooms = new Map<string, RoomState>();
  private readonly expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(public emptyRoomTtlMs: number = EMPTY_ROOM_TTL_MS) {}

  get size(): number {
    return this.rooms.size;
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

  /** Called when a room has no players left. With a TTL of 0 the room goes away immediately. */
  expireWhenEmpty(roomId: string): void {
    this.cancelExpiry(roomId);

    if (this.emptyRoomTtlMs <= 0) {
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
