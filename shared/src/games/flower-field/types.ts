/** A cell nobody has opened yet. */
export const FLOWER_HIDDEN = -1;

/** A cell somebody tried to open and was a mine: it stays closed, and everybody can see that it is a mine. */
export const FLOWER_MARKED = -2;

/** What the players see of the field: HIDDEN, MARKED, or for an open cell how many mines touch it (0 to 8). */
export type FlowerGrid = number[][];

/** Where the mines are. Only the server has it, until the game is lost. */
export type FlowerMines = boolean[][];

export type FlowerStatus = 'playing' | 'won' | 'lost';

/** A cell that changed, with what the players now see in it. */
export interface FlowerCellChange {
  r: number;
  c: number;
  v: number;
}
