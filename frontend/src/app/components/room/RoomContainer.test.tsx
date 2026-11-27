import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameId, LobbyState } from '@nbg/shared';
import { RoomContainer } from './RoomContainer';
import { BOARD_FAILED_NOTICE_MS } from '@/lib/useBoardFailed';
import { FAILED_AFTER_MS } from '@/lib/useConnectionStatus';
import type { GameEntry } from '../games/types';
import { getRoomEmoji } from '@/lib/roomEmoji';

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
    connect: vi.fn(() => socket),
  };

  const reset = () => {
    Object.keys(listeners).forEach((event) => delete listeners[event]);
    socket.connected = true;
    socket.emit.mockClear();
  };

  return { socket, dispatch, reset };
});

vi.mock('@/lib/socket', () => ({ getSocket: () => mocks.socket }));

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const games: GameEntry[] = [
  {
    id: 'sudoku',
    status: 'available',
    titleKey: 'games.sudoku.title',
    Cover: () => null,
    minPlayers: 1,
    maxPlayers: 5,
    Game: ({ roomId }) => <div data-testid="game" data-room-id={roomId} />,
  },
];

const ROOM = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c';

const serverSays = (state: LobbyState) => act(() => { mocks.dispatch('lobby-updated', state); });

// jsdom has no layout to scroll: the page asks for the top when a game opens.
const scrollTo = vi.fn();
beforeEach(() => {
  mocks.reset();
  scrollTo.mockClear();
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
});

describe('RoomContainer', () => {
  it('joins the room and shows the table at once, with nothing to vote until the server answers', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);

    expect(mocks.socket.emit).toHaveBeenCalledWith('join-room', ROOM);
    expect(screen.getByText('lobby.title')).toBeInTheDocument();
    expect(screen.getByText('lobby.connecting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'lobby.open' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /games.sudoku.title/ })).toBeDisabled();
  });

  it('shows the label of the room, never its id, at the table and above the game', () => {
    const label = `sudoku.room: ${getRoomEmoji(ROOM).map((icon) => `roomIcons.${icon}`).join(', ')}`;
    render(<RoomContainer roomId={ROOM} games={games} />);

    expect(screen.getByRole('img', { name: label })).toBeInTheDocument();
    serverSays({ game: 'sudoku', votes: [], tableVotes: [] });

    expect(screen.getByRole('img', { name: label })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sudoku.copyLink/ })).toBeInTheDocument();
    expect(screen.queryByText(ROOM)).not.toBeInTheDocument();
  });

  it('shows the table while the room has no game, and sends the vote of the player', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: null, votes: [], tableVotes: [] });

    expect(screen.getByText('lobby.title')).toBeInTheDocument();
    expect(screen.queryByTestId('game')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'lobby.open' }));

    expect(mocks.socket.emit).toHaveBeenLastCalledWith('vote-game', 'sudoku');
  });

  it('does not open the game by itself after a vote: it waits for the server', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: null, votes: [], tableVotes: [] });

    fireEvent.click(screen.getByRole('button', { name: 'lobby.open' }));

    expect(screen.queryByTestId('game')).not.toBeInTheDocument();
  });

  it('opens the game the server chose, in this room', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: null, votes: [], tableVotes: [] });
    serverSays({ game: 'sudoku', votes: [], tableVotes: [] });

    expect(screen.getByTestId('game')).toHaveAttribute('data-room-id', ROOM);
    expect(screen.queryByText('lobby.title')).not.toBeInTheDocument();
  });

  it('asks to go back to the table, says how many want to, and takes the vote back', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    act(() => { mocks.dispatch('joined-as', 'self-alias'); });
    serverSays({ game: 'sudoku', votes: [], tableVotes: [] });

    fireEvent.click(screen.getByRole('button', { name: 'lobby.backToTable' }));
    expect(mocks.socket.emit).toHaveBeenLastCalledWith('vote-table', true);
    // The page waits for the server: the game stays until the room has a majority.
    expect(screen.getByTestId('game')).toBeInTheDocument();

    serverSays({ game: 'sudoku', votes: [], tableVotes: ['self-alias'] });
    expect(screen.getByRole('status')).toHaveTextContent('lobby.backProgress');

    fireEvent.click(screen.getByRole('button', { name: 'lobby.stayHere' }));
    expect(mocks.socket.emit).toHaveBeenLastCalledWith('vote-table', false);
  });

  it('starts the game from the top of the page, where the board is', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: null, votes: [], tableVotes: [] });
    expect(scrollTo).not.toHaveBeenCalled();

    serverSays({ game: 'sudoku', votes: [], tableVotes: [] });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('says when a board could not be made, at the table and in a game, and the notice goes away by itself', () => {
    vi.useFakeTimers();
    try {
      render(<RoomContainer roomId={ROOM} games={games} />);
      serverSays({ game: null, votes: [], tableVotes: [] });

      act(() => { mocks.dispatch('board-failed'); });
      expect(screen.getByText('lobby.boardFailed')).toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(BOARD_FAILED_NOTICE_MS); });
      expect(screen.queryByText('lobby.boardFailed')).not.toBeInTheDocument();

      serverSays({ game: 'sudoku', votes: [], tableVotes: [] });
      act(() => { mocks.dispatch('board-failed'); });
      expect(screen.getByText('lobby.boardFailed')).toBeInTheDocument();
      expect(screen.getByTestId('game')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the game on screen while the page reconnects, and says so', () => {
    vi.useFakeTimers();
    try {
      render(<RoomContainer roomId={ROOM} games={games} />);
      serverSays({ game: 'sudoku', votes: [], tableVotes: [] });
      expect(screen.queryByText('lobby.reconnecting')).not.toBeInTheDocument();

      act(() => { mocks.socket.connected = false; mocks.dispatch('disconnect'); });
      expect(screen.getByText('lobby.reconnecting')).toBeInTheDocument();
      expect(screen.getByTestId('game')).toBeInTheDocument();

      act(() => { mocks.socket.connected = true; mocks.dispatch('connect'); });
      expect(screen.queryByText('lobby.reconnecting')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('offers to try again when the server cannot be reached for a long time', () => {
    vi.useFakeTimers();
    try {
      render(<RoomContainer roomId={ROOM} games={games} />);
      serverSays({ game: 'sudoku', votes: [], tableVotes: [] });

      act(() => { mocks.socket.connected = false; mocks.dispatch('disconnect'); });
      act(() => { vi.advanceTimersByTime(FAILED_AFTER_MS); });

      expect(screen.getByText('lobby.connectionLost')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'lobby.retry' }));
      expect(mocks.socket.connect).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('goes back to the table when the server says so', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: 'sudoku', votes: [], tableVotes: [] });
    serverSays({ game: null, votes: [], tableVotes: [] });

    expect(screen.getByText('lobby.title')).toBeInTheDocument();
    expect(screen.queryByTestId('game')).not.toBeInTheDocument();
  });

  it('puts a player who comes after the choice straight into the game', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: 'sudoku', votes: [], tableVotes: [] });

    expect(screen.getByTestId('game')).toBeInTheDocument();
  });

  it('says so when the server opened a game this page does not know', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: 'newer-game' as GameId, votes: [], tableVotes: [] });

    expect(screen.getByRole('alert')).toHaveTextContent('lobby.unknownGame');
    expect(screen.queryByTestId('game')).not.toBeInTheDocument();
  });

  it.each([
    ['room-full', 'sudoku.roomFull'],
    ['server-full', 'sudoku.serverFull'],
    ['too-fast', 'sudoku.tooFast'],
  ])('explains a refusal (%s) and offers the way home', (reason, message) => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    act(() => { mocks.dispatch('join-error', reason); });

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('link', { name: 'sudoku.backHome' })).toHaveAttribute('href', '/');
  });
});
