import { describe, it, expect } from 'vitest';
import { createKeyedRateLimiter, createRateLimiter } from './rateLimiter';

describe('createRateLimiter', () => {
  it('allows up to the limit and drops the rest of the window', () => {
    const allow = createRateLimiter(3, 1000, () => 0);

    expect([allow(), allow(), allow(), allow(), allow()]).toEqual([true, true, true, false, false]);
  });

  it('allows again when a new window starts', () => {
    let time = 0;
    const allow = createRateLimiter(2, 1000, () => time);

    allow(); allow();
    expect(allow()).toBe(false);

    time = 999;
    expect(allow()).toBe(false);

    time = 1000;
    expect(allow()).toBe(true);
    expect(allow()).toBe(true);
    expect(allow()).toBe(false);
  });
});

describe('createKeyedRateLimiter', () => {
  it('counts every key on its own', () => {
    const allow = createKeyedRateLimiter(2, 1000, () => 0);

    expect([allow('a'), allow('a'), allow('a')]).toEqual([true, true, false]);
    expect([allow('b'), allow('b'), allow('b')]).toEqual([true, true, false]);
  });

  it('allows a key again when its window is over', () => {
    let time = 0;
    const allow = createKeyedRateLimiter(1, 1000, () => time);

    allow('a');
    expect(allow('a')).toBe(false);

    time = 1000;
    expect(allow('a')).toBe(true);
  });

  it('refuses new keys while the map is full, and takes them again once the windows are over', () => {
    let time = 0;
    const allow = createKeyedRateLimiter(5, 1000, () => time, 2);

    expect(allow('a')).toBe(true);
    expect(allow('b')).toBe(true);
    expect(allow('c')).toBe(false);
    expect(allow('a')).toBe(true);

    time = 1000;
    expect(allow('c')).toBe(true);
  });
});
