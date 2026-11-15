import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateWordSearch } from './generator';

// Every word of the list is also forbidden: a placed word is then a forbidden word that nothing can change, so no puzzle is ever good and only the clock decides.
vi.mock('./words/index', () => ({ WORDS: { en: ['ABCD', 'EFGH', 'IJKL', 'MNOP', 'QRST', 'UVWX', 'YZAB'], it: [] } }));
vi.mock('./blocklist', () => ({ BLOCKLIST: { en: ['ABCD', 'EFGH', 'IJKL', 'MNOP', 'QRST', 'UVWX', 'YZAB'], it: [] } }));

afterEach(() => vi.restoreAllMocks());

describe('generateWordSearch, when no puzzle is found', () => {
  it('stops when the time is up, after trying once, and does not use all the attempts', () => {
    // The first reading sets the deadline, every one after is long past it: the loop reads the clock once more, to see it, and stops.
    const now = vi.spyOn(Date, 'now').mockReturnValue(10_000);
    now.mockReturnValueOnce(0);

    expect(() => generateWordSearch('beginner', 'en')).toThrow('Could not build');

    expect(now).toHaveBeenCalledTimes(2);
  });

  it('uses the attempts when the time is not up, and then gives up', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);

    expect(() => generateWordSearch('beginner', 'en')).toThrow('Could not build');

    expect(now.mock.calls.length).toBeGreaterThan(2);
  });
});
