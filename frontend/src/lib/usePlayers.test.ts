import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { MAX_KNOWN_PLAYERS, usePlayers } from './usePlayers';

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

const panda: PlayerProfile = { alias: 'aaaaaaaaaaaa', animal: 'panda', color: 'red' };
const fox: PlayerProfile = { alias: 'bbbbbbbbbbbb', animal: 'fox', color: 'blue' };

const update = (players: PlayerProfile[]) => act(() => { mocks.dispatch('players-updated', { players }); });

beforeEach(() => { mocks.reset(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('usePlayers', () => {
  it('starts with nobody, and does not know who the player is yet', () => {
    const { result } = renderHook(() => usePlayers('room-a'));

    expect(result.current.self).toBeNull();
    expect(result.current.players).toEqual([]);
    expect(result.current.profiles).toEqual({});
  });

  it('learns who the player is from the server', () => {
    const { result } = renderHook(() => usePlayers('room-a'));

    act(() => mocks.dispatch('joined-as', panda.alias));

    expect(result.current.self).toBe(panda.alias);
  });

  it('shows the players the server lists, in the order it gives them', () => {
    const { result } = renderHook(() => usePlayers('room-a'));

    update([panda, fox]);

    expect(result.current.players).toEqual([panda, fox]);
    expect(result.current.profiles).toEqual({ [panda.alias]: panda, [fox.alias]: fox });
  });

  it('takes the new color of a player who changes it', () => {
    const { result } = renderHook(() => usePlayers('room-a'));
    update([panda, fox]);

    update([{ ...panda, color: 'green' }, fox]);

    expect(result.current.players[0].color).toBe('green');
    expect(result.current.profiles[panda.alias].color).toBe('green');
  });

  it('remembers a player who left, so that their notes keep their color, but no longer lists them', () => {
    const { result } = renderHook(() => usePlayers('room-a'));
    update([panda, fox]);

    update([panda]);

    expect(result.current.players).toEqual([panda]);
    expect(result.current.profiles[fox.alias]).toEqual(fox);
  });

  it('does not remember more players than it needs to, and never forgets one who is there', () => {
    const { result } = renderHook(() => usePlayers('room-a'));
    const crowd = Array.from({ length: MAX_KNOWN_PLAYERS + 15 }, (_, i): PlayerProfile => ({
      alias: `alias${String(i).padStart(7, '0')}`,
      animal: 'owl',
      color: 'teal',
    }));

    for (const player of crowd) update([panda, player]);

    expect(Object.keys(result.current.profiles).length).toBeLessThanOrEqual(MAX_KNOWN_PLAYERS);
    expect(result.current.profiles[panda.alias]).toEqual(panda);
    expect(result.current.profiles[crowd.at(-1)!.alias]).toBeDefined();
  });

  it('forgets everything when the room changes', () => {
    const { result, rerender } = renderHook(({ room }) => usePlayers(room), { initialProps: { room: 'room-a' } });
    act(() => mocks.dispatch('joined-as', panda.alias));
    update([panda, fox]);

    rerender({ room: 'room-b' });

    expect(result.current.self).toBeNull();
    expect(result.current.players).toEqual([]);
    expect(result.current.profiles).toEqual({});
  });

  it('asks the server for a color', () => {
    const { result } = renderHook(() => usePlayers('room-a'));

    act(() => result.current.setColor('pink'));

    expect(mocks.socket.emit).toHaveBeenCalledExactlyOnceWith('set-color', 'pink');
  });

  it('does not ask while disconnected: the request would be sent long after the moment has passed', () => {
    mocks.socket.connected = false;
    const { result } = renderHook(() => usePlayers('room-a'));

    act(() => result.current.setColor('pink'));

    expect(mocks.socket.emit).not.toHaveBeenCalled();
  });

  it('stops listening when it goes away', () => {
    const { unmount } = renderHook(() => usePlayers('room-a'));

    unmount();

    expect(mocks.listeners['players-updated']).toEqual([]);
    expect(mocks.listeners['joined-as']).toEqual([]);
  });
});
