import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, EMOTES } from '@nbg/shared';
import { en } from './en';
import { it as italian } from './it';

describe('the names of the difficulty levels', () => {
  it.each([['English', en], ['Italian', italian]])('exist for every level, in %s', (_language, dictionary) => {
    for (const level of DIFFICULTIES) {
      expect(dictionary.sudoku[level], level).toBeTruthy();
      expect(dictionary.sudoku[level]).not.toContain('sudoku.');
    }
  });

  it('are different from each other, so that two buttons never read the same', () => {
    for (const dictionary of [en, italian]) {
      const names = DIFFICULTIES.map((level) => dictionary.sudoku[level]);
      expect(new Set(names).size).toBe(DIFFICULTIES.length);
    }
  });
});

// Every key of a dictionary, as the path the pages ask for ("home.create").
const pathsOf = (dictionary: object, prefix = ''): string[] => Object.entries(dictionary).flatMap(([key, value]) =>
  typeof value === 'string' ? [`${prefix}${key}`] : pathsOf(value as object, `${prefix}${key}.`));

describe('the two dictionaries', () => {
  it('have the same keys, so that no page falls back to the name of a key in one language', () => {
    expect(pathsOf(italian).sort()).toEqual(pathsOf(en).sort());
  });

  it.each([['English', en], ['Italian', italian]])('have no empty sentence, in %s', (_language, dictionary) => {
    const lookUp = (path: string) => path.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown>)[part], dictionary);
    for (const path of pathsOf(dictionary)) {
      expect((lookUp(path) as string).trim(), path).not.toBe('');
    }
  });
});

describe('the names of the emotes', () => {
  it.each([['English', en], ['Italian', italian]])('exist for every emote, in %s', (_language, dictionary) => {
    const names = dictionary.emotes.names as Record<string, string>;
    for (const emote of EMOTES) expect(names[emote], emote).toBeTruthy();
    expect(Object.keys(names).sort()).toEqual([...EMOTES].sort());
  });
});

describe('the Flower Field copy', () => {
  it.each([['English', en], ['Italian', italian]])('talks about bees and not mines, in %s', (_language, dictionary) => {
    const text = JSON.stringify([dictionary.flowerField, dictionary.gamesPage.flowerField]).toLowerCase();
    expect(text).not.toMatch(/\bmin[ae]s?\b|\bmin[ae]\b/);
  });
});
