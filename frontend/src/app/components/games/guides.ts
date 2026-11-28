import type { GameId } from '@nbg/shared';

/** What the page of the games says about one game. Everything is a translation key. */
export interface GameGuide {
  taglineKey: string;
  descriptionKey: string;
  /** The rules, in the order they are read. */
  ruleKeys: readonly string[];
}

/**
 * The guide of every game the server knows. A new game needs an entry here, like it needs one in the
 * registry: the type makes the build fail until it has one. Where a game already explains a rule in its
 * own page, the guide uses the same sentence, so that the two cannot say different things.
 */
export const GAME_GUIDES: Readonly<Record<GameId, GameGuide>> = {
  sudoku: {
    taglineKey: 'gamesPage.sudoku.tagline',
    descriptionKey: 'gamesPage.sudoku.description',
    ruleKeys: ['sudoku.ruleNumbers', 'gamesPage.sudoku.rule2', 'sudoku.ruleNotes', 'gamesPage.sudoku.rule4'],
  },
  takuzu: {
    taglineKey: 'gamesPage.takuzu.tagline',
    descriptionKey: 'gamesPage.takuzu.description',
    ruleKeys: ['takuzu.rulePairs', 'takuzu.ruleBalance', 'takuzu.ruleUnique', 'takuzu.tapHint', 'gamesPage.takuzu.rule5'],
  },
  'flower-field': {
    taglineKey: 'gamesPage.flowerField.tagline',
    descriptionKey: 'gamesPage.flowerField.description',
    ruleKeys: ['flowerField.ruleNumbers', 'flowerField.ruleSafe', 'flowerField.ruleFlags', 'flowerField.ruleMineMarks'],
  },
  'word-search': {
    taglineKey: 'gamesPage.wordSearch.tagline',
    descriptionKey: 'gamesPage.wordSearch.description',
    ruleKeys: ['wordSearch.ruleFind', 'wordSearch.ruleDrag', 'gamesPage.wordSearch.rule3', 'gamesPage.wordSearch.rule4'],
  },
  memory: {
    taglineKey: 'gamesPage.memory.tagline',
    descriptionKey: 'gamesPage.memory.description',
    ruleKeys: ['memory.ruleFind', 'memory.ruleTogether', 'memory.ruleMismatch', 'gamesPage.memory.rule4'],
  },
};
