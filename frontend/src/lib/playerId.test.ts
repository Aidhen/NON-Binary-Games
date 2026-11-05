import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playerIdSchema } from '@nbg/shared';

describe('getPlayerId', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates an id the server accepts', async () => {
    const { getPlayerId } = await import('./playerId');

    expect(playerIdSchema.safeParse(getPlayerId()).success).toBe(true);
  });

  it('keeps the same id after a reload', async () => {
    const first = (await import('./playerId')).getPlayerId();

    vi.resetModules();
    const second = (await import('./playerId')).getPlayerId();

    expect(second).toBe(first);
  });

  it('returns the same id on repeated calls', async () => {
    const { getPlayerId } = await import('./playerId');

    expect(getPlayerId()).toBe(getPlayerId());
  });

  it('works when localStorage is not available', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const { getPlayerId } = await import('./playerId');

    const id = getPlayerId();

    expect(playerIdSchema.safeParse(id).success).toBe(true);
    expect(getPlayerId()).toBe(id);
  });

  it('falls back to getRandomValues where randomUUID does not exist', async () => {
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(171) });
    const { getPlayerId } = await import('./playerId');

    expect(getPlayerId()).toBe('ab'.repeat(16));
  });
});
