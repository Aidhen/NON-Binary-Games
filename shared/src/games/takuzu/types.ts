/** A cell holds 0 (empty) or one of the two symbols, 1 and 2. Zero is taken by "empty", so the symbols start from 1. */
export const TAKUZU_SYMBOLS = [1, 2] as const;

export type TakuzuGrid = number[][];

export interface TakuzuBoard {
  solution: TakuzuGrid;
  initial: TakuzuGrid;
  size: number;
}
