import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS_PER_ROOM, PLAYER_ANIMALS, PLAYER_COLORS, playerColorSchema, setColorArgsSchema } from './index';

describe('player colors and animals', () => {
  it('have no repeated entry, so that a name or a color is never ambiguous', () => {
    expect(new Set(PLAYER_COLORS).size).toBe(PLAYER_COLORS.length);
    expect(new Set(PLAYER_ANIMALS).size).toBe(PLAYER_ANIMALS.length);
  });

  it('are more than the players of a room, so that there is always a free one to take', () => {
    expect(PLAYER_COLORS.length).toBeGreaterThan(MAX_PLAYERS_PER_ROOM);
    expect(PLAYER_ANIMALS.length).toBeGreaterThan(MAX_PLAYERS_PER_ROOM);
  });

  it('are plain lower case words: they are keys of the translations, never shown as they are', () => {
    for (const word of [...PLAYER_COLORS, ...PLAYER_ANIMALS]) expect(word).toMatch(/^[a-z]+$/);
  });
});

describe('playerColorSchema', () => {
  it.each(PLAYER_COLORS)('accepts %s', (color) => {
    expect(playerColorSchema.safeParse(color).success).toBe(true);
  });

  it.each(['', 'RED', 'Red', ' red', 'gold', 'rgb(0,0,0)', '#ff0000', '__proto__', 'constructor', 42, null, undefined, {}, ['red']])(
    'rejects %j',
    (value) => {
      expect(playerColorSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('setColorArgsSchema', () => {
  it('takes exactly one color', () => {
    expect(setColorArgsSchema.safeParse(['blue']).success).toBe(true);
    expect(setColorArgsSchema.safeParse([]).success).toBe(false);
    expect(setColorArgsSchema.safeParse(['blue', 'red']).success).toBe(false);
    expect(setColorArgsSchema.safeParse(['blue', () => 1]).success).toBe(false);
    expect(setColorArgsSchema.safeParse(['gold']).success).toBe(false);
  });
});
