import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { MEMORY_HAND_MS, MEMORY_MISMATCH_MS } from '@nbg/shared';
import { CELEBRATE_MS, MemoryContainer, PENDING_MS } from './MemoryContainer';

const mocks = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;
  type SocketMock = {
    connected: boolean;
    id: string;
    on: Mock<(event: string, handler: Handler) => SocketMock>;
    off: Mock<(event: string, handler?: Handler) => SocketMock>;
    emit: Mock<(event: string, ...args: unknown[]) => SocketMock>;
    connect: Mock<() => SocketMock>;
  };

  const listeners: Record<string, Handler[]> = {};
  const emitted: { event: string; args: unknown[] }[] = [];
  const socket = {} as SocketMock;

  const dispatch = (event: string, ...args: unknown[]) => {
    [...(listeners[event] ?? [])].forEach((handler) => handler(...args));
  };

  socket.connected = false;
  socket.id = 'local-player';
  socket.on = vi.fn((event: string, handler: Handler) => {
    (listeners[event] ??= []).push(handler);
    return socket;
  });
  socket.off = vi.fn((event: string, handler?: Handler) => {
    if (!handler) delete listeners[event];
    else listeners[event] = (listeners[event] ?? []).filter((registered) => registered !== handler);
    return socket;
  });
  socket.emit = vi.fn((event: string, ...args: unknown[]) => {
    emitted.push({ event, args });
    return socket;
  });
  socket.connect = vi.fn(() => {
    socket.connected = true;
    dispatch('connect');
    return socket;
  });

  const reset = () => {
    Object.keys(listeners).forEach((event) => delete listeners[event]);
    emitted.length = 0;
    socket.connected = false;
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
    socket.connect.mockClear();
  };

  return { socket, listeners, emitted, dispatch, reset };
});

vi.mock('@/lib/socket', () => ({ getSocket: () => mocks.socket }));

// The real English strings: the counter and the names of the cards are what a player reads.
vi.mock('@/lib/i18n/TranslationContext', async () => {
  const { en } = await import('@/locales/en');
  const translate = (key: string) => (key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], en) as string | undefined) ?? key;
  return { useTranslation: () => ({ t: translate }) };
});

const MOON = 18;
const STAR = 17;

const started = (overrides: Record<string, unknown> = {}) => ({ game: 'memory', difficulty: 'beginner', cards: 12, matched: [], open: [], ...overrides });
const players = [{ alias: 'me', animal: 'fox', color: 'teal' }, { alias: 'friend', animal: 'owl', color: 'pink' }];

const renderGame = async (overrides: Record<string, unknown> = {}) => {
  render(<MemoryContainer roomId="room-1" />);
  await act(async () => {
    mocks.dispatch('joined-as', 'me');
    mocks.dispatch('players-updated', { players });
    mocks.dispatch('game-started', started(overrides));
  });
};

const dispatch = async (event: string, ...args: unknown[]) => { await act(async () => { mocks.dispatch(event, ...args); }); };
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const sent = (event: string) => mocks.emitted.filter((entry) => entry.event === event).map(({ args }) => args[0]);
const card = (n: number) => screen.getByRole('button', { name: `Card ${n}` });
const flipped = (index: number, face: number, alias = 'me') => dispatch('memory:flipped', { index, face, alias });

beforeEach(() => {
  vi.useFakeTimers();
  mocks.reset();
});
afterEach(() => { vi.useRealTimers(); });

describe('MemoryContainer', () => {
  it('joins the room, and shows no table until the server sends it', () => {
    render(<MemoryContainer roomId="custom-room" />);

    expect(mocks.socket.connect).toHaveBeenCalledOnce();
    expect(mocks.emitted).toContainEqual({ event: 'join-room', args: ['custom-room'] });
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('lays the cards face down and counts the pairs found', async () => {
    await renderGame();

    expect(screen.getAllByRole('button', { name: /^Card \d+$/ })).toHaveLength(12);
    expect(screen.getByText('0/6 pairs')).toBeInTheDocument();
  });

  it('ignores the start of another game', async () => {
    render(<MemoryContainer roomId="room-1" />);

    await dispatch('game-started', { game: 'sudoku', difficulty: 'easy' });

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('shows a tap at once but turns the card only when the server says so', async () => {
    await renderGame();

    fireEvent.click(card(3));

    expect(sent('memory:flip')).toEqual([{ index: 2 }]);
    expect(card(3)).toHaveAttribute('data-pending', 'true');
    expect(card(3)).toHaveAttribute('data-up', 'false');

    await flipped(2, MOON);

    expect(screen.getByRole('button', { name: 'The Moon' })).toHaveAttribute('data-up', 'true');
    expect(screen.getByRole('button', { name: 'The Moon' })).toHaveAttribute('data-pending', 'false');
  });

  it('sends nothing for a second tap while the first one waits', async () => {
    await renderGame();

    fireEvent.click(card(1));
    fireEvent.click(card(2));

    expect(sent('memory:flip')).toEqual([{ index: 0 }]);
  });

  it('drops a tap the server never answered, and lets the player try another card', async () => {
    await renderGame();
    fireEvent.click(card(1));

    await advance(PENDING_MS);

    expect(card(1)).toHaveAttribute('data-pending', 'false');
    fireEvent.click(card(2));
    expect(sent('memory:flip')).toEqual([{ index: 0 }, { index: 1 }]);
  });

  it('sends nothing for a card that is held, locked or matched', async () => {
    await renderGame({ cards: 12, matched: [{ index: 0, face: MOON }, { index: 1, face: MOON }], open: [{ index: 2, face: STAR, alias: 'friend', closesInMs: 8000 }] });

    for (const name of ['The Moon', 'The Star']) {
      for (const button of screen.getAllByRole('button', { name })) fireEvent.click(button);
    }
    await flipped(3, 4, 'friend');
    await dispatch('memory:mismatched', { indices: [2, 3] });
    fireEvent.click(screen.getByRole('button', { name: 'The Star' }));
    fireEvent.click(screen.getByRole('button', { name: 'The Emperor' }));

    expect(sent('memory:flip')).toEqual([]);
  });

  it('keeps a mismatched pair face up for the time of the lock and then turns it back, while other cards can be flipped', async () => {
    await renderGame();
    await flipped(0, MOON, 'friend');
    await flipped(1, STAR, 'friend');

    await dispatch('memory:mismatched', { indices: [0, 1] });

    expect(screen.getByRole('button', { name: 'The Moon' })).toHaveAttribute('data-state', 'locked');
    expect(screen.getByRole('button', { name: 'The Star' })).toHaveAttribute('data-state', 'locked');
    fireEvent.click(card(5));
    expect(sent('memory:flip')).toEqual([{ index: 4 }]);

    await advance(MEMORY_MISMATCH_MS);

    expect(card(1)).toHaveAttribute('data-up', 'false');
    expect(card(2)).toHaveAttribute('data-up', 'false');
  });

  it('keeps a matched pair up for good, counts it and celebrates once', async () => {
    await renderGame();
    await flipped(0, MOON, 'friend');
    await flipped(1, MOON, 'friend');

    await dispatch('memory:matched', { indices: [0, 1] });

    expect(screen.getAllByRole('button', { name: 'The Moon' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'The Moon' }).every((button) => button.dataset.state === 'matched')).toBe(true);
    expect(screen.getByText('1/6 pairs')).toBeInTheDocument();
    expect(screen.getAllByTestId('memory-stars')).toHaveLength(2);
    expect(screen.queryByTestId('memory-ring')).not.toBeInTheDocument();

    await advance(CELEBRATE_MS);

    expect(screen.queryByTestId('memory-stars')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'The Moon' })).toHaveLength(2);
  });

  it('does not celebrate the pairs somebody finds before the player comes in', async () => {
    await renderGame({ matched: [{ index: 0, face: MOON }, { index: 1, face: MOON }] });

    expect(screen.getByText('1/6 pairs')).toBeInTheDocument();
    expect(screen.queryByTestId('memory-stars')).not.toBeInTheDocument();
  });

  it('rings a card somebody holds, tells mine from theirs, and turns it back by itself after its time', async () => {
    await renderGame({ open: [{ index: 0, face: MOON, alias: 'friend', closesInMs: 4000 }] });
    await flipped(1, STAR, 'me');

    expect(screen.getByRole('button', { name: 'The Moon' })).toHaveAttribute('data-state', 'held');
    expect(screen.getAllByTestId('memory-ring').map((ring) => ring.dataset.mine)).toEqual(['false', 'true']);

    await advance(4000);

    expect(card(1)).toHaveAttribute('data-up', 'false');
    expect(screen.getByRole('button', { name: 'The Star' })).toHaveAttribute('data-state', 'held');

    await advance(MEMORY_HAND_MS - 4000);

    expect(card(2)).toHaveAttribute('data-up', 'false');
    expect(screen.queryByTestId('memory-ring')).not.toBeInTheDocument();
  });

  it('turns back a card whose holder left', async () => {
    await renderGame({ open: [{ index: 0, face: MOON, alias: 'friend', closesInMs: 8000 }] });

    await dispatch('memory:closed', { index: 0 });

    expect(card(1)).toHaveAttribute('data-up', 'false');
    expect(screen.queryByTestId('memory-ring')).not.toBeInTheDocument();
  });

  it('starts again from the table the server sends, and forgets what was waiting', async () => {
    await renderGame();
    await flipped(0, MOON, 'friend');
    await flipped(1, STAR, 'friend');
    await dispatch('memory:mismatched', { indices: [0, 1] });

    await dispatch('game-started', started({ difficulty: 'easy', cards: 16, open: [{ index: 1, face: STAR, alias: 'friend', closesInMs: 9000 }] }));
    // The lock of the old table ends here: it must not turn back a card of the new one.
    await advance(MEMORY_MISMATCH_MS);

    expect(screen.getAllByRole('button', { name: /^Card \d+$/ })).toHaveLength(15);
    expect(screen.getByRole('button', { name: 'The Star' })).toHaveAttribute('data-up', 'true');
    expect(screen.getByText('0/8 pairs')).toBeInTheDocument();
  });

  it('shows the end card when the last pair is found, and takes no more flips', async () => {
    await renderGame({ cards: 12, matched: Array.from({ length: 10 }, (_, index) => ({ index, face: Math.floor(index / 2) })) });
    await flipped(10, 7, 'me');
    await flipped(11, 7, 'me');
    await dispatch('memory:matched', { indices: [10, 11] });

    await dispatch('game-won');

    expect(screen.getByText('Every pair found!')).toBeInTheDocument();
    expect(screen.getByText('You turned over the whole deck together.')).toBeInTheDocument();
    for (const button of screen.getAllByRole('button', { name: /^The / })) expect(button).toBeDisabled();
  });

  it('asks for a new game at the level that is picked, with the pairs written on the buttons', async () => {
    await renderGame();

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    fireEvent.click(screen.getByRole('button', { name: '16 pairs' }));

    expect(mocks.emitted).toContainEqual({ event: 'restart-game', args: ['hard'] });
  });

  it('can be played again from the end card', async () => {
    await renderGame({ matched: Array.from({ length: 12 }, (_, index) => ({ index, face: Math.floor(index / 2) })) });

    fireEvent.click(screen.getByRole('button', { name: /again/i }));

    expect(mocks.emitted).toContainEqual({ event: 'restart-game', args: ['beginner'] });
  });

  it('takes no flips while the server cannot be reached', async () => {
    await renderGame();

    await dispatch('disconnect');
    fireEvent.click(card(1));

    expect(sent('memory:flip')).toEqual([]);
    expect(card(1)).toBeDisabled();
  });

  it('takes its listeners away when it goes, and has nothing left waiting', async () => {
    render(<MemoryContainer roomId="room-1" />);
    await dispatch('game-started', started({ open: [{ index: 0, face: MOON, alias: 'friend', closesInMs: 5000 }] }));

    cleanup();

    for (const event of ['connect', 'game-started', 'memory:flipped', 'memory:matched', 'memory:mismatched', 'memory:closed', 'game-won']) {
      expect(mocks.listeners[event] ?? [], event).toEqual([]);
    }
    expect(vi.getTimerCount()).toBe(0);
  });
});
