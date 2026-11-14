import { describe, expect, it } from 'vitest';
import { PLAYER_ANIMALS, PLAYER_COLORS } from '@nbg/shared';
import { en } from '@/locales/en';
import { it as italian } from '@/locales/it';
import type { Translations } from '@/locales/en';
import { PLAYER_ANIMAL_EMOJI, playerName } from './playerNames';

/** Looks a path up in a dictionary the way the translation context does. */
const translatorOf = (dictionary: Translations) => (path: string): string =>
  path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], dictionary) as string;

const english = translatorOf(en);
const italiano = translatorOf(italian);

describe('playerName', () => {
  it('puts the color before the animal in English', () => {
    expect(playerName(english, { animal: 'panda', color: 'red' })).toBe('Red Panda');
    expect(playerName(english, { animal: 'fox', color: 'teal' })).toBe('Teal Fox');
  });

  it('puts the color after the animal in Italian and makes it agree with it', () => {
    expect(playerName(italiano, { animal: 'panda', color: 'red' })).toBe('Panda Rosso');
    expect(playerName(italiano, { animal: 'fox', color: 'red' })).toBe('Volpe Rossa');
    expect(playerName(italiano, { animal: 'turtle', color: 'pink' })).toBe('Tartaruga Rosa');
    expect(playerName(italiano, { animal: 'owl', color: 'green' })).toBe('Gufo Verde');
  });

  it.each([['English', english], ['Italian', italiano]])('gives every animal with every color a name of its own in %s', (_language, t) => {
    const names = PLAYER_ANIMALS.flatMap((animal) => PLAYER_COLORS.map((color) => playerName(t, { animal, color })));

    expect(new Set(names).size).toBe(PLAYER_ANIMALS.length * PLAYER_COLORS.length);
    for (const name of names) {
      expect(name).not.toMatch(/[{}]/);
      expect(name).not.toContain('players.');
      expect(name.trim()).toBe(name);
    }
  });

  it('changes only the color word when the color changes, and only the animal word when the animal does', () => {
    expect(playerName(english, { animal: 'panda', color: 'blue' })).toBe('Blue Panda');
    expect(playerName(english, { animal: 'otter', color: 'blue' })).toBe('Blue Otter');
  });
});

describe('the dictionaries of the players', () => {
  it.each([['English', en], ['Italian', italian]])('give every animal a gender in %s', (_language, dictionary) => {
    for (const animal of PLAYER_ANIMALS) expect(['m', 'f']).toContain(dictionary.players.animals[animal].gender);
  });

  it('name exactly the animals and the colors of the contract, in both languages', () => {
    for (const dictionary of [en, italian]) {
      expect(Object.keys(dictionary.players.animals).sort()).toEqual([...PLAYER_ANIMALS].sort());
      expect(Object.keys(dictionary.players.colors).sort()).toEqual([...PLAYER_COLORS].sort());
    }
  });
});

describe('PLAYER_ANIMAL_EMOJI', () => {
  it('has a different emoji for every animal', () => {
    expect(Object.keys(PLAYER_ANIMAL_EMOJI).sort()).toEqual([...PLAYER_ANIMALS].sort());
    expect(new Set(Object.values(PLAYER_ANIMAL_EMOJI)).size).toBe(PLAYER_ANIMALS.length);
  });
});
