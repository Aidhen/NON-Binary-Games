/** The drawings a deck is made from (see `MEMORY_FACES` in `@nbg/art`): a face is the index of one of them. */
export const MEMORY_FACE_COUNT = 22;

/** How long two cards that do not match stay put, face up, before anybody can flip them again. The server checks it on the next flip: it has no timer. */
export const MEMORY_MISMATCH_MS = 1200;

/**
 * How long a player can hold a first card face up before it goes back down by itself. Without it a card held and
 * never followed by a second one could not be flipped by anybody else, and its pair could never be found. The clients
 * turn it at this time; the server forgets the hand on the next flip after it, so it has no timer either.
 */
export const MEMORY_HAND_MS = 10_000;

/** A card of a pair found: where it lies and which drawing it has. Nobody is told who found it: the game has no credit. */
export interface MemoryCardMatched {
  index: number;
  face: number;
}

/** A card of the deck as the players see it once it is flipped: where it lies, which drawing it has and who flipped it, by alias. */
export interface MemoryCardShown {
  index: number;
  face: number;
  alias: string;
}

/** A card somebody holds face up: the same, with how long it has before it goes back down by itself (see MEMORY_HAND_MS). */
export interface MemoryCardOpen extends MemoryCardShown {
  closesInMs: number;
}
