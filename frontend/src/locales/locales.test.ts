import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '@nbg/shared';
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
