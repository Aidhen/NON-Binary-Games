import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_ROOM_TTL_MS, RoomStore } from './roomStore';
import type { RoomState } from './roomStore';

const createRoom = (): RoomState => {
  return {
    game: null,
    votes: new Map(),
    players: new Map(),
    aliases: new Map(),
    profiles: new Map(),
    played: true,
  };
};

describe('RoomStore', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('keeps rooms by id', () => {
    const store = new RoomStore();
    const room = createRoom();

    store.set('a', room);

    expect(store.get('a')).toBe(room);
    expect(store.has('a')).toBe(true);
    expect(store.size).toBe(1);
    expect(store.get('b')).toBeUndefined();

    expect(store.delete('a')).toBe(true);
    expect(store.has('a')).toBe(false);
  });

  it('keeps an empty room for ten minutes by default', () => {
    const store = new RoomStore();
    store.set('a', createRoom());

    store.expireWhenEmpty('a');
    vi.advanceTimersByTime(EMPTY_ROOM_TTL_MS - 1);
    expect(store.has('a')).toBe(true);

    vi.advanceTimersByTime(1);
    expect(store.has('a')).toBe(false);
  });

  it('deletes the room immediately when the grace period is 0', () => {
    const store = new RoomStore(0);
    store.set('a', createRoom());

    store.expireWhenEmpty('a');

    expect(store.has('a')).toBe(false);
  });

  it('deletes an empty room immediately when nobody played in it', () => {
    const store = new RoomStore();
    store.set('a', { ...createRoom(), played: false });

    store.expireWhenEmpty('a');

    expect(store.has('a')).toBe(false);
  });

  it('keeps the room when someone comes back in time', () => {
    const store = new RoomStore(1000);
    store.set('a', createRoom());

    store.expireWhenEmpty('a');
    store.cancelExpiry('a');
    vi.advanceTimersByTime(5000);

    expect(store.has('a')).toBe(true);
  });

  it('restarts the countdown when the room empties again', () => {
    const store = new RoomStore(1000);
    store.set('a', createRoom());

    store.expireWhenEmpty('a');
    vi.advanceTimersByTime(800);
    store.expireWhenEmpty('a');
    vi.advanceTimersByTime(800);
    expect(store.has('a')).toBe(true);

    vi.advanceTimersByTime(200);
    expect(store.has('a')).toBe(false);
  });

  it('does not delete a room that has players when the timer fires', () => {
    const store = new RoomStore(1000);
    const room = createRoom();
    store.set('a', room);

    store.expireWhenEmpty('a');
    room.players.set('player-1', new Set(['socket-1']));
    vi.advanceTimersByTime(1000);

    expect(store.has('a')).toBe(true);
  });

  it('leaves no timer behind when a room is deleted or the store is cleared', () => {
    const store = new RoomStore(1000);
    store.set('a', createRoom());
    store.set('b', createRoom());
    store.expireWhenEmpty('a');
    store.expireWhenEmpty('b');

    store.delete('a');
    expect(vi.getTimerCount()).toBe(1);

    store.clear();
    expect(vi.getTimerCount()).toBe(0);
    expect(store.size).toBe(0);
  });
});
