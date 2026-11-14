import { lazy } from 'react';
import { MAX_PLAYERS_PER_ROOM } from '@nbg/shared';
import type { GameId } from '@nbg/shared';
import type { AvailableGame, GameEntry } from './types';

/**
 * Every game of the app, in the order they are shown. Adding a game means adding its id to GAME_IDS in
 * `@nbg/shared` (so that the server accepts votes for it) and one entry here: the room and the table are
 * built from this list and need no change.
 */
export const GAMES: readonly GameEntry[] = [
  {
    id: 'sudoku',
    status: 'available',
    titleKey: 'games.sudoku.title',
    minPlayers: 1,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    // Loaded when a room opens it: the table does not need the code of every game.
    Game: lazy(() => import('../sudoku/SudokuContainer').then((module) => ({ default: module.SudokuContainer }))),
  },
];

/** The entry of a game the server says is open, or nothing when this page is older than the server and does not know it. */
export const findGame = (id: GameId, games: readonly GameEntry[] = GAMES): AvailableGame | undefined =>
  games.find((game): game is AvailableGame => game.status === 'available' && game.id === id);
