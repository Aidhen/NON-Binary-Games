/**
 * The games a room can open. A closed list: players vote for one of these, and the server refuses anything else.
 * A game that is only announced ("soon") is not here: it exists in the interface alone until it can be played.
 */
export const GAME_IDS = ['sudoku', 'takuzu'] as const;

export type GameId = (typeof GAME_IDS)[number];
