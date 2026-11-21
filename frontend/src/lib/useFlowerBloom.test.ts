import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The hook keeps the choice of a page that cannot store it: each test starts from a fresh module.
const load = async () => (await import('./useFlowerBloom'));

describe('useFlowerBloom', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('is on until the player turns it off', async () => {
    const { useFlowerBloom } = await load();
    const { result } = renderHook(() => useFlowerBloom());

    expect(result.current[0]).toBe(true);
  });

  it('keeps the choice in this browser, and every component that shows it hears the change', async () => {
    const { useFlowerBloom, FLOWER_BLOOM_KEY } = await load();
    const first = renderHook(() => useFlowerBloom());
    const second = renderHook(() => useFlowerBloom());

    act(() => { first.result.current[1](false); });

    expect(localStorage.getItem(FLOWER_BLOOM_KEY)).toBe('off');
    expect(first.result.current[0]).toBe(false);
    expect(second.result.current[0]).toBe(false);

    act(() => { second.result.current[1](true); });
    expect(localStorage.getItem(FLOWER_BLOOM_KEY)).toBe('on');
    expect(first.result.current[0]).toBe(true);
  });

  it('reads a choice made on an earlier visit', async () => {
    localStorage.setItem('nbg-flower-bloom', 'off');
    const { useFlowerBloom } = await load();

    const { result } = renderHook(() => useFlowerBloom());

    expect(result.current[0]).toBe(false);
  });

  it('still follows the choice for as long as the page lasts when the browser refuses to store it', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const { useFlowerBloom } = await load();
    const { result } = renderHook(() => useFlowerBloom());

    act(() => { result.current[1](false); });

    expect(result.current[0]).toBe(false);
  });
});
