import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

describe('zod on the server', () => {
  afterEach(() => { vi.resetModules(); });

  it('keeps compiled validators, which are faster for the payloads of every connection', async () => {
    vi.resetModules();

    await import('./schemas');

    expect(typeof window).toBe('undefined');
    expect(z.config().jitless).toBeFalsy();
  });
});
