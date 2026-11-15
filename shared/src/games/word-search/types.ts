/** Adding a language later is one entry here, one word file in `words/` and one list in `blocklist.ts`. */
export const WORD_LANGUAGES = ['en', 'it'] as const;

export type WordLanguage = (typeof WORD_LANGUAGES)[number];

/** Single uppercase letters, A to Z. */
export type WordSearchGrid = string[][];

/** Where a word lies: the start cell and the step from one letter to the next. Kept by the server, never sent to the clients. */
export interface WordPlacement {
  word: string;
  r: number;
  c: number;
  dr: number;
  dc: number;
}

export interface WordSearchPuzzle {
  size: number;
  grid: WordSearchGrid;
  placements: WordPlacement[];
}

/** A cell the player pointed at. */
export interface WordSearchCell {
  r: number;
  c: number;
}
