import { describe, expect, it } from 'vitest';
import { WORD_LANGUAGES } from '../types';
import { WORDS } from './index';

describe.each(WORD_LANGUAGES)('word list (%s)', language => {
  const words = WORDS[language];

  it('has only uppercase A-Z words of 4 to 10 letters', () => {
    expect(words.filter(word => !/^[A-Z]{4,10}$/.test(word))).toEqual([]);
  });

  it('has no duplicates', () => {
    expect(words.filter((word, i) => words.indexOf(word) !== i)).toEqual([]);
  });

  it('has at least 300 words', () => {
    expect(words.length).toBeGreaterThanOrEqual(300);
  });

  it.each([4, 5, 6, 7, 8, 9, 10])('has at least 20 words of %i letters', length => {
    expect(words.filter(word => word.length === length).length).toBeGreaterThanOrEqual(20);
  });
});

describe('word lists', () => {
  it('have an entry for every language', () => {
    expect(Object.keys(WORDS).sort()).toEqual([...WORD_LANGUAGES].sort());
  });
});
