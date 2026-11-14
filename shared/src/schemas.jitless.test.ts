// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

describe('zod in a browser', () => {
  afterEach(() => {
    z.config({ jitless: false });
    vi.resetModules();
  });

  it('does not probe whether it may compile validators, which a Content-Security-Policy reports as a violation', async () => {
    const probe = vi.spyOn(globalThis, 'Function');
    vi.resetModules();

    await import('./schemas');
    // The first object schema that is built decides, and the schemas of the contract are objects.
    z.object({ a: z.string() });

    expect(z.config().jitless).toBe(true);
    expect(probe).not.toHaveBeenCalledWith('');
  });
});
