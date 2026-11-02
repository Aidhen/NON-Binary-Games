import { act, renderHook } from '@testing-library/react';
import { EMOTE_COOLDOWN_MS, EMOTES } from '@nbg/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMOTE_LIFETIME_MS, MAX_FLOATING_EMOTES, useEmotes } from './useEmotes';

const mocks = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;

  const listeners: Record<string, Handler[]> = {};
  const socket = {
    connected: true,
    on: vi.fn((event: string, handler: Handler) => {
      (listeners[event] ??= []).push(handler);
      return socket;
    }),
    off: vi.fn((event: string, handler: Handler) => {
      listeners[event] = (listeners[event] ?? []).filter((registered) => registered !== handler);
      return socket;
    }),
    emit: vi.fn(),
  };

  const dispatch = (event: string, ...args: unknown[]) => {
    [...(listeners[event] ?? [])].forEach((handler) => handler(...args));
  };

  const reset = () => {
    Object.keys(listeners).forEach((event) => delete listeners[event]);
    socket.connected = true;
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
  };

  return { socket, listeners, dispatch, reset };
});

vi.mock('@/lib/socket', () => ({ getSocket: () => mocks.socket }));

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const receive = (emote: string, playerId = 'someone-else') =>
  act(() => { mocks.dispatch('emote-received', { playerId, emote }); });

beforeEach(() => {
  vi.useFakeTimers();
  mocks.reset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useEmotes', () => {
  it('sends the emote to the server and shows it right away to the sender', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote(EMOTES[2]));

    expect(mocks.socket.emit).toHaveBeenCalledExactlyOnceWith('send-emote', EMOTES[2]);
    expect(result.current.emotes.map(({ emote }) => emote)).toEqual([EMOTES[2]]);
  });

  it('shows the emotes sent by other players', () => {
    const { result } = renderHook(() => useEmotes());

    receive(EMOTES[4]);

    expect(result.current.emotes.map(({ emote }) => emote)).toEqual([EMOTES[4]]);
    expect(mocks.socket.emit).not.toHaveBeenCalled();
  });

  it('removes each emote once its animation is over', () => {
    const { result } = renderHook(() => useEmotes());

    receive(EMOTES[0]);
    advance(1000);
    receive(EMOTES[1]);

    advance(EMOTE_LIFETIME_MS - 1000);
    expect(result.current.emotes.map(({ emote }) => emote)).toEqual([EMOTES[1]]);

    advance(1000);
    expect(result.current.emotes).toEqual([]);
  });

  it('blocks new emotes during the cooldown and allows them again afterwards', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote(EMOTES[0]));
    expect(result.current.isCoolingDown).toBe(true);

    advance(EMOTE_COOLDOWN_MS - 1);
    act(() => result.current.sendEmote(EMOTES[1]));
    expect(mocks.socket.emit).toHaveBeenCalledTimes(1);
    expect(result.current.isCoolingDown).toBe(true);

    advance(1);
    expect(result.current.isCoolingDown).toBe(false);

    act(() => result.current.sendEmote(EMOTES[2]));
    expect(mocks.socket.emit).toHaveBeenCalledTimes(2);
    expect(mocks.socket.emit).toHaveBeenLastCalledWith('send-emote', EMOTES[2]);
  });

  it('ignores a second click in the same tick, before the cooldown is rendered', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => {
      result.current.sendEmote(EMOTES[0]);
      result.current.sendEmote(EMOTES[1]);
    });

    expect(mocks.socket.emit).toHaveBeenCalledTimes(1);
  });

  it('does not queue emotes while the socket is disconnected', () => {
    mocks.socket.connected = false;
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote(EMOTES[0]));

    expect(mocks.socket.emit).not.toHaveBeenCalled();
    expect(result.current.emotes).toEqual([]);
    expect(result.current.isCoolingDown).toBe(false);
  });

  it('keeps only the most recent emotes when a room floods the screen', () => {
    const { result } = renderHook(() => useEmotes());

    for (let i = 0; i < MAX_FLOATING_EMOTES + 5; i++) receive(EMOTES[i % EMOTES.length]);

    expect(result.current.emotes).toHaveLength(MAX_FLOATING_EMOTES);
    const ids = result.current.emotes.map(({ id }) => id);
    expect(ids[ids.length - 1]).toBe(MAX_FLOATING_EMOTES + 4);
  });

  it('places each emote at a random horizontal position away from the screen edges', () => {
    const random = vi.spyOn(Math, 'random');
    const { result } = renderHook(() => useEmotes());

    random.mockReturnValue(0);
    receive(EMOTES[0]);
    random.mockReturnValue(1);
    receive(EMOTES[1]);

    expect(result.current.emotes.map(({ left }) => left)).toEqual([10, 90]);
  });

  it('stops listening and drops pending timers when unmounted', () => {
    const { result, unmount } = renderHook(() => useEmotes());
    act(() => result.current.sendEmote(EMOTES[0]));

    unmount();

    expect(mocks.listeners['emote-received'] ?? []).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
