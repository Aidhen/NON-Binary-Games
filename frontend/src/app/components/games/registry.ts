import { lazy } from 'react';
import { MAX_PLAYERS_PER_ROOM } from '@nbg/shared';
import type { GameId } from '@nbg/shared';
import { FlowerFieldCover } from './covers/FlowerFieldCover';
import { MysteryCover } from './covers/MysteryCover';
import { SudokuCover } from './covers/SudokuCover';
import { TakuzuCover } from './covers/TakuzuCover';
import type { AvailableGame, GameEntry } from './types';

/**
 * Every game of the app, in the order of the boxes on the table. Adding a game means adding its id to
 * GAME_IDS in `@nbg/shared` (so that the server accepts votes for it), its cover, and one entry here: the
 * room and the table are built from this list and need no change. A game that is not ready yet is a "soon"
 * entry: a closed box nobody can vote for.
 */
export const GAMES: readonly GameEntry[] = [
  {
    id: 'sudoku',
    status: 'available',
    titleKey: 'games.sudoku.title',
    Cover: SudokuCover,
    minPlayers: 1,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    // Loaded when a room opens it: the table does not need the code of every game.
    Game: lazy(() => import('../sudoku/SudokuContainer').then((module) => ({ default: module.SudokuContainer }))),
  },
  {
    id: 'takuzu',
    status: 'available',
    titleKey: 'games.takuzu.title',
    Cover: TakuzuCover,
    minPlayers: 1,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    Game: lazy(() => import('../takuzu/TakuzuContainer').then((module) => ({ default: module.TakuzuContainer }))),
  },
  {
    id: 'flower-field',
    status: 'available',
    titleKey: 'games.flowerField.title',
    Cover: FlowerFieldCover,
    minPlayers: 1,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    Game: lazy(() => import('../flower-field/FlowerFieldContainer').then((module) => ({ default: module.FlowerFieldContainer }))),
  },
  { id: 'mystery-2', status: 'soon', titleKey: 'games.mystery.title', Cover: MysteryCover, minPlayers: 1, maxPlayers: MAX_PLAYERS_PER_ROOM },
];

/** The entry of a game the server says is open, or nothing when this page is older than the server and does not know it. */
export const findGame = (id: GameId, games: readonly GameEntry[] = GAMES): AvailableGame | undefined =>
  games.find((game): game is AvailableGame => game.status === 'available' && game.id === id);
