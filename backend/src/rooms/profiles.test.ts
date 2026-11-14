import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS_PER_ROOM, PLAYER_ANIMALS, PLAYER_COLORS } from '@nbg/shared';
import type { RoomState } from './roomStore';
import { assignProfile, colorIsFree, snapshotPlayers } from './profiles';

const createRoom = (): RoomState => ({
  board: {} as RoomState['board'],
  difficulty: 'easy',
  currentGrid: [],
  players: new Map(),
  filledCells: 0,
  notesGrid: {},
  aliases: new Map(),
  profiles: new Map(),
  played: false,
});

/** A player that is in the room: sockets, an alias and a profile, as the join handler leaves them. */
const join = (room: RoomState, playerId: string) => {
  room.players.set(playerId, new Set([`socket-of-${playerId}`]));
  room.aliases.set(playerId, `alias-of-${playerId}`);
  return assignProfile(room, playerId);
};

describe('assignProfile', () => {
  it('gives a player an animal and a color from the lists, and keeps them in the room', () => {
    const room = createRoom();

    const profile = join(room, 'a');

    expect(PLAYER_ANIMALS).toContain(profile.animal);
    expect(PLAYER_COLORS).toContain(profile.color);
    expect(room.profiles.get('a')).toEqual(profile);
  });

  it('never gives two players of a full room the same animal or the same color', () => {
    for (let round = 0; round < 200; round++) {
      const room = createRoom();
      const players = Array.from({ length: MAX_PLAYERS_PER_ROOM }, (_, i) => join(room, `player-${i}`));

      expect(new Set(players.map(({ animal }) => animal)).size).toBe(MAX_PLAYERS_PER_ROOM);
      expect(new Set(players.map(({ color }) => color)).size).toBe(MAX_PLAYERS_PER_ROOM);
    }
  });

  it('is not all the same: the animals and colors that come out vary', () => {
    const animals = new Set<string>();
    const colors = new Set<string>();
    for (let round = 0; round < 200; round++) {
      const profile = join(createRoom(), 'a');
      animals.add(profile.animal);
      colors.add(profile.color);
    }

    expect(animals.size).toBeGreaterThan(PLAYER_ANIMALS.length / 2);
    expect(colors.size).toBeGreaterThan(PLAYER_COLORS.length / 2);
  });

  it('keeps the profile of a player who comes back, and of a second tab of a player who is there', () => {
    const room = createRoom();
    const first = join(room, 'a');
    join(room, 'b');

    expect(assignProfile(room, 'a')).toEqual(first);

    room.players.delete('a');
    expect(assignProfile(room, 'a')).toEqual(first);
  });

  it('gives a returning player a new color when somebody took theirs, and a new animal when somebody took theirs', () => {
    const room = createRoom();
    const first = join(room, 'a');
    room.players.delete('a');
    room.profiles.set('b', { animal: first.animal, color: first.color });
    room.players.set('b', new Set(['socket-of-b']));
    room.aliases.set('b', 'alias-of-b');

    const back = assignProfile(room, 'a');

    expect(back.color).not.toBe(first.color);
    expect(back.animal).not.toBe(first.animal);
  });

  it('still gives a profile when every color and animal is taken, instead of failing', () => {
    const room = createRoom();
    PLAYER_COLORS.forEach((color, i) => {
      room.players.set(`other-${i}`, new Set(['s']));
      room.profiles.set(`other-${i}`, { color, animal: PLAYER_ANIMALS[i] });
    });
    PLAYER_ANIMALS.slice(PLAYER_COLORS.length).forEach((animal, i) => {
      room.players.set(`extra-${i}`, new Set(['s']));
      room.profiles.set(`extra-${i}`, { color: PLAYER_COLORS[0], animal });
    });

    const profile = assignProfile(room, 'late');

    expect(PLAYER_COLORS).toContain(profile.color);
    expect(PLAYER_ANIMALS).toContain(profile.animal);
  });
});

describe('colorIsFree', () => {
  it('is taken only by another player who is in the room', () => {
    const room = createRoom();
    join(room, 'a');
    join(room, 'b');
    room.profiles.get('a')!.color = 'red';
    room.profiles.get('b')!.color = 'blue';

    expect(colorIsFree(room, 'a', 'blue')).toBe(false);
    expect(colorIsFree(room, 'a', 'red')).toBe(true);
    expect(colorIsFree(room, 'a', 'green')).toBe(true);

    room.players.delete('b');
    expect(colorIsFree(room, 'a', 'blue')).toBe(true);
  });
});

describe('snapshotPlayers', () => {
  it('lists the players who are in the room, in the order they came, with their alias and profile', () => {
    const room = createRoom();
    join(room, 'a');
    join(room, 'b');
    join(room, 'c');
    room.players.delete('b');

    expect(snapshotPlayers(room)).toEqual([
      { alias: 'alias-of-a', ...room.profiles.get('a')! },
      { alias: 'alias-of-c', ...room.profiles.get('c')! },
    ]);
  });

  it('leaves out a player who has no alias or no profile yet', () => {
    const room = createRoom();
    join(room, 'a');
    room.players.set('b', new Set(['s']));
    room.aliases.set('c', 'alias-of-c');
    room.players.set('c', new Set(['s']));

    expect(snapshotPlayers(room).map(({ alias }) => alias)).toEqual(['alias-of-a']);
  });
});
