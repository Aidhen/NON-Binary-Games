import { describe, expect, it } from 'vitest';
import type { GameId } from '@nbg/shared';
import type { RoomState } from './roomStore';
import { chosenGame, snapshotLobby } from './lobby';

/** A room at the table with these players in it, and an alias for each. */
const createRoom = (...playerIds: string[]): RoomState => ({
  game: null,
  votes: new Map(),
  players: new Map(playerIds.map((id) => [id, new Set([`socket-of-${id}`])])),
  aliases: new Map(playerIds.map((id) => [id, `alias-of-${id}`])),
  profiles: new Map(),
  played: false,
});

// The list has one game today: the count must not depend on that.
const other = 'another-game' as GameId;

describe('chosenGame', () => {
  it('chooses nothing while nobody voted', () => {
    expect(chosenGame(createRoom('a'))).toBeNull();
    expect(chosenGame(createRoom())).toBeNull();
  });

  it('takes one vote alone, both votes in two, and more than half after that', () => {
    const room = createRoom('a');
    room.votes.set('a', 'sudoku');
    expect(chosenGame(room)).toBe('sudoku');

    for (const [players, votesNeeded] of [[2, 2], [3, 2], [4, 3], [5, 3]]) {
      const ids = Array.from({ length: players }, (_, i) => `player-${i}`);
      const bigger = createRoom(...ids);
      ids.slice(0, votesNeeded - 1).forEach((id) => bigger.votes.set(id, 'sudoku'));
      expect(chosenGame(bigger)).toBeNull();

      bigger.votes.set(ids[votesNeeded - 1], 'sudoku');
      expect(chosenGame(bigger)).toBe('sudoku');
    }
  });

  it('chooses nothing when the room is split in two', () => {
    const room = createRoom('a', 'b', 'c', 'd');
    room.votes.set('a', 'sudoku').set('b', 'sudoku').set('c', other).set('d', other);

    expect(chosenGame(room)).toBeNull();
  });

  it('does not count the vote of a player who is not in the room', () => {
    const room = createRoom('a', 'b');
    room.votes.set('a', 'sudoku').set('gone', 'sudoku');

    expect(chosenGame(room)).toBeNull();
  });
});

describe('snapshotLobby', () => {
  it('tells the votes by alias, and no game while the room is choosing', () => {
    const room = createRoom('a', 'b');
    room.votes.set('b', 'sudoku');

    expect(snapshotLobby(room)).toEqual({ game: null, votes: [{ alias: 'alias-of-b', game: 'sudoku' }] });
  });

  it('leaves out a vote without a player in the room or without an alias', () => {
    const room = createRoom('a', 'b');
    room.aliases.delete('b');
    room.votes.set('b', 'sudoku').set('gone', 'sudoku');

    expect(snapshotLobby(room).votes).toEqual([]);
  });

  it('tells the game once it is open', () => {
    const room = createRoom('a');
    room.game = { id: 'sudoku' } as RoomState['game'];

    expect(snapshotLobby(room).game).toBe('sudoku');
  });
});
