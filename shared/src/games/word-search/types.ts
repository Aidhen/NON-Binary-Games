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

/** A step from one letter to the next: `[dr, dc]`. */
export type WordDirection = readonly [dr: number, dc: number];

/** The word spelled by the cells no other word covers, read in order, row by row. Kept by the server, never sent to the clients: the page works it out when every word is found. */
export interface HiddenWord {
  word: string;
  cells: [r: number, c: number][];
}

export interface WordSearchPuzzle {
  size: number;
  grid: WordSearchGrid;
  placements: WordPlacement[];
  hidden: HiddenWord;
}

/** A cell the player pointed at. */
export interface WordSearchCell {
  r: number;
  c: number;
}
