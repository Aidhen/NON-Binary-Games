import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameId, LobbyState } from '@nbg/shared';
import { RoomContainer } from './RoomContainer';
import type { GameEntry } from '../games/types';

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
    minPlayers: 1,
    maxPlayers: 5,
    Game: ({ roomId }) => <div data-testid="game" data-room-id={roomId} />,
  },
];

const ROOM = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c';

const serverSays = (state: LobbyState) => act(() => { mocks.dispatch('lobby-updated', state); });

beforeEach(() => { mocks.reset(); });

describe('RoomContainer', () => {
  it('joins the room and waits for the server before showing anything to choose', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);

    expect(mocks.socket.emit).toHaveBeenCalledWith('join-room', ROOM);
    expect(screen.getByText('sudoku.loading')).toBeInTheDocument();
    expect(screen.queryByText('lobby.title')).not.toBeInTheDocument();
  });

  it('shows the table while the room has no game, and sends the vote of the player', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: null, votes: [] });

    expect(screen.getByText('lobby.title')).toBeInTheDocument();
    expect(screen.queryByTestId('game')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /games.sudoku.title/ }));

    expect(mocks.socket.emit).toHaveBeenLastCalledWith('vote-game', 'sudoku');
  });

  it('does not open the game by itself after a vote: it waits for the server', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: null, votes: [] });

    fireEvent.click(screen.getByRole('button', { name: /games.sudoku.title/ }));

    expect(screen.queryByTestId('game')).not.toBeInTheDocument();
  });

  it('opens the game the server chose, in this room', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: null, votes: [] });
    serverSays({ game: 'sudoku', votes: [] });

    expect(screen.getByTestId('game')).toHaveAttribute('data-room-id', ROOM);
    expect(screen.queryByText('lobby.title')).not.toBeInTheDocument();
  });

  it('puts a player who comes after the choice straight into the game', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: 'sudoku', votes: [] });

    expect(screen.getByTestId('game')).toBeInTheDocument();
  });

  it('says so when the server opened a game this page does not know', () => {
    render(<RoomContainer roomId={ROOM} games={games} />);
    serverSays({ game: 'newer-game' as GameId, votes: [] });

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
