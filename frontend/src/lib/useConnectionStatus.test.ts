import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FAILED_AFTER_MS, WAKING_AFTER_MS, useConnectionStatus } from './useConnectionStatus';

const mocks = vi.hoisted(() => {
  type Handler = () => void;

  const listeners: Record<string, Handler[]> = {};
  const socket = {
    connected: false,
    on: vi.fn((event: string, handler: Handler) => {
      (listeners[event] ??= []).push(handler);
      return socket;
    }),
    off: vi.fn((event: string, handler: Handler) => {
      listeners[event] = (listeners[event] ?? []).filter((registered) => registered !== handler);
      return socket;
    }),
    connect: vi.fn(() => socket),
  };

  const dispatch = (event: string) => {
    [...(listeners[event] ?? [])].forEach((handler) => handler());
  };

  const reset = () => {
    Object.keys(listeners).forEach((event) => delete listeners[event]);
    socket.connected = false;
    socket.on.mockClear();
    socket.off.mockClear();
    socket.connect.mockClear();
  };

  return { socket, listeners, dispatch, reset };
});

vi.mock('@/lib/socket', () => ({ getSocket: () => mocks.socket }));

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => {
  mocks.reset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useConnectionStatus', () => {
  it('starts as connecting, then switches to waking and failed as time passes', () => {
    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current.status).toBe('connecting');

    advance(WAKING_AFTER_MS - 1);
    expect(result.current.status).toBe('connecting');

    advance(1);
    expect(result.current.status).toBe('waking');

    advance(FAILED_AFTER_MS - WAKING_AFTER_MS - 1);
    expect(result.current.status).toBe('waking');

    advance(1);
    expect(result.current.status).toBe('failed');
  });

  it('is connected as soon as the socket connects, and stays connected', () => {
    const { result } = renderHook(() => useConnectionStatus());

    act(() => mocks.dispatch('connect'));
    expect(result.current.status).toBe('connected');

    advance(FAILED_AFTER_MS * 2);
    expect(result.current.status).toBe('connected');
  });

  it('is connected right away when the socket is already connected', () => {
    mocks.socket.connected = true;

    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current.status).toBe('connected');
  });

  it('recovers when the server answers late, even after the failed message', () => {
    const { result } = renderHook(() => useConnectionStatus());

    advance(FAILED_AFTER_MS);
    expect(result.current.status).toBe('failed');

    act(() => mocks.dispatch('connect'));
    expect(result.current.status).toBe('connected');
  });

  it('starts waiting again when the connection drops', () => {
    const { result } = renderHook(() => useConnectionStatus());
    act(() => mocks.dispatch('connect'));

    act(() => mocks.dispatch('disconnect'));
    expect(result.current.status).toBe('connecting');

    advance(WAKING_AFTER_MS);
    expect(result.current.status).toBe('waking');
  });

  it('retries the connection and restarts the wait', () => {
    const { result } = renderHook(() => useConnectionStatus());
    advance(FAILED_AFTER_MS);
    expect(result.current.status).toBe('failed');

    act(() => result.current.retry());

    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(result.current.status).toBe('connecting');

    advance(WAKING_AFTER_MS);
    expect(result.current.status).toBe('waking');
  });

  it('removes its listeners and timers on unmount', () => {
    const { unmount } = renderHook(() => useConnectionStatus());
    expect(mocks.listeners.connect).toHaveLength(1);
    expect(mocks.listeners.disconnect).toHaveLength(1);

    unmount();

    expect(mocks.listeners.connect).toHaveLength(0);
    expect(mocks.listeners.disconnect).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
