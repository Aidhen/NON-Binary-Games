import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LobbyState } from '@nbg/shared';
import { useRoom } from './useRoom';

const mocks = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;

  const listeners: Record<string, Handler[]> = {};
  const dispatch = (event: string, ...args: unknown[]) => {
    [...(listeners[event] ?? [])].forEach((handler) => handler(...args));
  };
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
    connect: vi.fn(() => {
      socket.connected = true;
      dispatch('connect');
      return socket;
    }),
  };

  const reset = () => {
    Object.keys(listeners).forEach((event) => delete listeners[event]);
    socket.connected = true;
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
    socket.connect.mockClear();
  };

  return { socket, listeners, dispatch, reset };
});

vi.mock('@/lib/socket', () => ({ getSocket: () => mocks.socket }));

const choosing: LobbyState = { game: null, votes: [{ alias: 'aaaaaaaaaaaa', game: 'sudoku' }] };
const playing: LobbyState = { game: 'sudoku', votes: [] };

beforeEach(() => { mocks.reset(); });

describe('useRoom', () => {
  it('joins the room at once when the socket is connected, and knows nothing until the server answers', () => {
    const { result } = renderHook(() => useRoom('room-a'));

    expect(mocks.socket.emit).toHaveBeenCalledWith('join-room', 'room-a');
    expect(mocks.socket.connect).not.toHaveBeenCalled();
    expect(result.current.lobby).toBeNull();
    expect(result.current.joinError).toBeNull();
  });

  it('connects first when the socket is not connected, and joins when it is', () => {
    mocks.socket.connected = false;
    renderHook(() => useRoom('room-a'));

    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(mocks.socket.emit).toHaveBeenCalledExactlyOnceWith('join-room', 'room-a');
  });

  it('joins again after every reconnection', () => {
    renderHook(() => useRoom('room-a'));

    act(() => { mocks.dispatch('connect'); });

    expect(mocks.socket.emit).toHaveBeenCalledTimes(2);
    expect(mocks.socket.emit).toHaveBeenLastCalledWith('join-room', 'room-a');
  });

  it('follows what the server says the room is doing', () => {
    const { result } = renderHook(() => useRoom('room-a'));

    act(() => { mocks.dispatch('lobby-updated', choosing); });
    expect(result.current.lobby).toEqual(choosing);

    act(() => { mocks.dispatch('lobby-updated', playing); });
    expect(result.current.lobby).toEqual(playing);
  });

  it('tells why the room refused the player, and forgets it once the room answers', () => {
    const { result } = renderHook(() => useRoom('room-a'));

    act(() => { mocks.dispatch('join-error', 'too-fast'); });
    expect(result.current.joinError).toBe('too-fast');

    act(() => { mocks.dispatch('lobby-updated', choosing); });
    expect(result.current.joinError).toBeNull();
  });

  it('sends a vote, and takes it back with null', () => {
    const { result } = renderHook(() => useRoom('room-a'));
    mocks.socket.emit.mockClear();

    act(() => { result.current.vote('sudoku'); });
    act(() => { result.current.vote(null); });

    expect(mocks.socket.emit.mock.calls).toEqual([['vote-game', 'sudoku'], ['vote-game', null]]);
  });

  it('does not keep a vote for later when the socket is disconnected', () => {
    const { result } = renderHook(() => useRoom('room-a'));
    mocks.socket.emit.mockClear();
    mocks.socket.connected = false;

    act(() => { result.current.vote('sudoku'); });

    expect(mocks.socket.emit).not.toHaveBeenCalled();
  });

  it('starts over in another room: joins it and forgets the state of the one before', () => {
    const { result, rerender } = renderHook(({ roomId }) => useRoom(roomId), { initialProps: { roomId: 'room-a' } });
    act(() => { mocks.dispatch('lobby-updated', playing); });

    rerender({ roomId: 'room-b' });

    expect(result.current.lobby).toBeNull();
    expect(mocks.socket.emit).toHaveBeenLastCalledWith('join-room', 'room-b');
  });

  it('removes exactly its own listeners when it goes away', () => {
    const { unmount } = renderHook(() => useRoom('room-a'));

    unmount();

    expect(mocks.listeners['connect']).toEqual([]);
    expect(mocks.listeners['lobby-updated']).toEqual([]);
    expect(mocks.listeners['join-error']).toEqual([]);
  });
});
