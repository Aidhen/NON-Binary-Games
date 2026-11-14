import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HIGHLIGHT_MS, useHighlight } from './useHighlight';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe('useHighlight', () => {
  it('highlights nobody at first', () => {
    const { result } = renderHook(() => useHighlight());

    expect(result.current.highlighted).toBeNull();
  });

  it('highlights a player for a moment and then lets go', () => {
    const { result } = renderHook(() => useHighlight());

    act(() => result.current.highlight('aaaaaaaaaaaa'));
    expect(result.current.highlighted).toBe('aaaaaaaaaaaa');

    advance(HIGHLIGHT_MS - 1);
    expect(result.current.highlighted).toBe('aaaaaaaaaaaa');

    advance(1);
    expect(result.current.highlighted).toBeNull();
  });

  it('moves to another player and gives that one the whole time', () => {
    const { result } = renderHook(() => useHighlight());
    act(() => result.current.highlight('aaaaaaaaaaaa'));
    advance(HIGHLIGHT_MS - 100);

    act(() => result.current.highlight('bbbbbbbbbbbb'));
    advance(200);

    expect(result.current.highlighted).toBe('bbbbbbbbbbbb');
    advance(HIGHLIGHT_MS);
    expect(result.current.highlighted).toBeNull();
  });

  it('leaves no timer behind when it goes away', () => {
    const { result, unmount } = renderHook(() => useHighlight());
    act(() => result.current.highlight('aaaaaaaaaaaa'));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
