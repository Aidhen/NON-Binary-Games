import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStorage, writeStorage } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('storage helpers', () => {
  it('returns null for a missing key', () => {
    expect(readStorage('missing')).toBeNull();
  });

  it('writes a value and reads it back', () => {
    writeStorage('key', 'value');

    expect(readStorage('key')).toBe('value');
  });

  it('returns null instead of throwing when reading fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(readStorage('key')).toBeNull();
  });

  it('does not throw when writing fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => writeStorage('key', 'value')).not.toThrow();
  });
});
