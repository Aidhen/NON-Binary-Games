import { describe, it, expect } from 'vitest';
import { createRateLimiter } from './rateLimiter';

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
