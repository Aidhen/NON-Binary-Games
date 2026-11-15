import { describe, expect, it } from 'vitest';
import { BLOCKLIST } from './blocklist';
import { WORD_LANGUAGES } from './types';
import { WORDS } from './words/index';

const reversed = (word: string) => [...word].reverse().join('');

describe('blocklist', () => {
  it('has an entry for every language', () => {
    expect(Object.keys(BLOCKLIST).sort()).toEqual([...WORD_LANGUAGES].sort());
  });

  describe.each(WORD_LANGUAGES)('(%s)', language => {
    const list = BLOCKLIST[language];

    it('is not empty and has only uppercase A-Z words of 4 letters or more', () => {
      expect(list.length).toBeGreaterThan(10);
      expect(list.filter(word => !/^[A-Z]{4,}$/.test(word))).toEqual([]);
    });

    it('has no duplicates', () => {
      expect(list.filter((word, i) => list.indexOf(word) !== i)).toEqual([]);
    });
  });

  // The generator checks the grid against every list, and a placed word cannot be changed: if one hid a forbidden word, the puzzle could never be finished.
  it('is not hidden inside any word of any language, forwards or backwards', () => {
    const forbidden = WORD_LANGUAGES.flatMap(language => BLOCKLIST[language]);
    const clashes = WORD_LANGUAGES.flatMap(language => WORDS[language].flatMap(word =>
      forbidden.filter(bad => word.includes(bad) || word.includes(reversed(bad))).map(bad => `${language}: ${word} / ${bad}`)));

    expect(clashes).toEqual([]);
  });
});
