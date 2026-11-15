import { generateWordSearch, isSolved, resolveSelection } from "@nbg/shared";
import type { DifficultyLevel, WordSearchCell, WordSearchFound, WordSearchStartedPayload } from "@nbg/shared";
import type { RoomGame, WordSearchGame } from "./roomStore";
import { FORBIDDEN } from "./wordSearchBlocklist";

/** `previous` is the game the room was playing: the language is a choice of the table, so it stays. The first one is English. */
export const createWordSearch = (difficulty: DifficultyLevel, previous?: RoomGame): WordSearchGame => {
  const language = previous?.id === 'word-search' ? previous.language : 'en';
  return { id: 'word-search', difficulty, language, puzzle: generateWordSearch(difficulty, language, FORBIDDEN), found: new Map(), status: 'playing' };
};

const foundList = (game: WordSearchGame): WordSearchFound[] =>
  [...game.found].map(([word, { alias, from, to }]) => ({ word, alias, from, to }));

/** What the players are told about the game. The placements are not here: only the words found say where they lie. */
export const wordSearchStarted = (game: WordSearchGame): WordSearchStartedPayload => ({
  game: 'word-search',
  size: game.puzzle.size,
  difficulty: game.difficulty,
  language: game.language,
  grid: game.puzzle.grid,
  // Alphabetical, so that the list says nothing about where the words lie (the placements come in the order they were laid).
  words: game.puzzle.placements.map(placement => placement.word).sort((a, b) => a.localeCompare(b)),
  found: foundList(game),
});

export interface SelectionResult {
  found: WordSearchFound;
  won: boolean;
}

/** Applies a selection. Returns null when the move does not apply: not a word, a word already found, or a game that is over. */
export const selectWord = (game: WordSearchGame, from: WordSearchCell, to: WordSearchCell, alias: string): SelectionResult | null => {
  if (game.status !== 'playing') return null;

  const placement = resolveSelection(game.puzzle, new Set(game.found.keys()), from, to);
  if (!placement) return null;

  // The ends come from the placement, not from the client: the same word is always told the same way.
  const start = { r: placement.r, c: placement.c };
  const end = { r: placement.r + placement.dr * (placement.word.length - 1), c: placement.c + placement.dc * (placement.word.length - 1) };
  game.found.set(placement.word, { alias, from: start, to: end });

  const won = isSolved(game.puzzle, new Set(game.found.keys()));
  if (won) game.status = 'won';
  return { found: { word: placement.word, alias, from: start, to: end }, won };
};
