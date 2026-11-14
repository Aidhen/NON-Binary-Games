import { describe, expect, it } from 'vitest';
import { GAME_IDS, MAX_PLAYERS_PER_ROOM } from '@nbg/shared';
import type { GameId } from '@nbg/shared';
import { en } from '@/locales/en';
import { it as italian } from '@/locales/it';
import { GAMES, findGame } from './registry';
import type { GameEntry } from './types';

const translated = (dictionary: unknown, key: string) =>
  key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], dictionary);

describe('GAMES', () => {
  it('gives every entry an id of its own', () => {
    const ids = GAMES.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has one playable entry for each game the server knows, and no other playable entry', () => {
    const playable = GAMES.filter(({ status }) => status === 'available').map(({ id }) => id);

    expect([...playable].sort()).toEqual([...GAME_IDS].sort());
  });

  it('never announces as "soon" a game the server already lets people vote for', () => {
    const known: readonly string[] = GAME_IDS;

    for (const game of GAMES.filter(({ status }) => status === 'soon')) expect(known).not.toContain(game.id);
  });

  it('gives every playable game a component to open', () => {
    for (const game of GAMES) {
      if (game.status === 'available') expect(game.Game).toBeDefined();
    }
  });

  it('gives every box a cover', () => {
    for (const game of GAMES) expect(game.Cover).toEqual(expect.any(Function));
  });

  it('asks for a number of players a room can hold', () => {
    for (const { minPlayers, maxPlayers } of GAMES) {
      expect(minPlayers).toBeGreaterThanOrEqual(1);
      expect(maxPlayers).toBeGreaterThanOrEqual(minPlayers);
      expect(maxPlayers).toBeLessThanOrEqual(MAX_PLAYERS_PER_ROOM);
    }
  });

  it('has the name of every game in both languages', () => {
    for (const { titleKey } of GAMES) {
      expect(translated(en, titleKey)).toEqual(expect.any(String));
      expect(translated(italian, titleKey)).toEqual(expect.any(String));
    }
  });
});

describe('findGame', () => {
  const Game = () => null;
  const games: GameEntry[] = [
    { id: 'later', status: 'soon', titleKey: 'x', Cover: () => null, minPlayers: 1, maxPlayers: 2 },
    { id: 'sudoku', status: 'available', titleKey: 'x', Cover: () => null, minPlayers: 1, maxPlayers: 2, Game },
  ];

  it('finds the playable entry of a game', () => {
    expect(findGame('sudoku', games)?.Game).toBe(Game);
    expect(findGame('sudoku')?.id).toBe('sudoku');
  });

  it('finds nothing for a game this page does not know, or one that is only announced', () => {
    expect(findGame('newer-game' as GameId, games)).toBeUndefined();
    expect(findGame('later' as GameId, games)).toBeUndefined();
  });
});
