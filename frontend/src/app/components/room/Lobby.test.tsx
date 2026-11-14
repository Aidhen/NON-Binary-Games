import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameId, LobbyVote, PlayerProfile } from '@nbg/shared';
import { Lobby } from './Lobby';
import type { GameEntry } from '../games/types';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const Cover = ({ index }: { index: number }) => <span data-testid="cover" data-index={index} />;
const available = (id: string): GameEntry => ({ id: id as GameId, status: 'available', titleKey: `games.${id}.title`, Cover, minPlayers: 1, maxPlayers: 5, Game: () => null });
const soon = (id: string): GameEntry => ({ id, status: 'soon', titleKey: `games.${id}.title`, Cover, minPlayers: 2, maxPlayers: 2 });

const oneGame = [available('sudoku'), soon('later')];
const twoGames = [available('sudoku'), available('other'), soon('later')];

const panda: PlayerProfile = { alias: 'aaaaaaaaaaaa', animal: 'panda', color: 'red' };
const fox: PlayerProfile = { alias: 'bbbbbbbbbbbb', animal: 'fox', color: 'blue' };
const ROOM = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c';

const onVote = vi.fn();
const onRetry = vi.fn();

interface Options { votes?: LobbyVote[] | null; games?: GameEntry[]; status?: ConnectionStatus }

const renderLobby = ({ votes = [], games = oneGame, status = 'connected' }: Options = {}) =>
  render(<Lobby roomId={ROOM} games={games} players={[panda, fox]} self={panda.alias} votes={votes} status={status} onRetry={onRetry} onVote={onVote} onPickColor={vi.fn()} />);

const box = (id: string) => screen.getByRole('button', { name: new RegExp(`games.${id}.title`) });
const openButton = () => screen.getByRole('button', { name: /lobby.open|lobby.takeBack/ });

beforeEach(() => {
  onVote.mockClear();
  onRetry.mockClear();
});

describe('Lobby', () => {
  it('puts one box on the table for every game, in the order of the list', () => {
    renderLobby({ games: twoGames });

    const boxes = within(screen.getByRole('list', { name: 'lobby.games' })).getAllByRole('listitem');
    expect(boxes).toHaveLength(3);
    expect(screen.getAllByTestId('cover').map((cover) => cover.dataset.index)).toEqual(['0', '1', '2']);
  });

  it('lifts the lid of the first game that can be played, so that one tap is enough', () => {
    renderLobby();

    expect(box('sudoku')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(openButton());

    expect(onVote).toHaveBeenCalledExactlyOnceWith('sudoku');
  });

  it('votes for the box the player picked', () => {
    renderLobby({ games: twoGames });

    fireEvent.click(box('other'));

    expect(box('other')).toHaveAttribute('aria-pressed', 'true');
    expect(box('sudoku')).toHaveAttribute('aria-pressed', 'false');
    expect(onVote).not.toHaveBeenCalled();

    fireEvent.click(openButton());
    expect(onVote).toHaveBeenCalledExactlyOnceWith('other');
  });

  it('starts from the box the player already voted for, and offers to take the vote back', () => {
    renderLobby({ games: twoGames, votes: [{ alias: panda.alias, game: 'other' as GameId }] });

    expect(box('other')).toHaveAttribute('aria-pressed', 'true');
    expect(openButton()).toHaveAccessibleName('lobby.takeBack');
    expect(openButton()).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(openButton());
    expect(onVote).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('lets the player change their mind by opening another box', () => {
    renderLobby({ games: twoGames, votes: [{ alias: panda.alias, game: 'other' as GameId }] });

    fireEvent.click(box('sudoku'));
    expect(openButton()).toHaveAccessibleName('lobby.open');

    fireEvent.click(openButton());
    expect(onVote).toHaveBeenCalledExactlyOnceWith('sudoku');
  });

  it('does not take the vote of another player for the vote of this one, and says how the choice is going', () => {
    renderLobby({ votes: [{ alias: fox.alias, game: 'sudoku' }] });

    expect(openButton()).toHaveAccessibleName('lobby.open');
    expect(screen.getByText('lobby.progress')).toBeInTheDocument();
    expect(box('sudoku')).toHaveTextContent('lobby.votes');
  });

  it('keeps a game that is only announced closed: it is not a button and cannot be picked', () => {
    renderLobby();

    expect(screen.queryByRole('button', { name: /games.later.title/ })).not.toBeInTheDocument();
    expect(screen.getByText('games.later.title')).toBeInTheDocument();
    expect(screen.getByText('lobby.soon')).toBeInTheDocument();
  });

  it('has nothing to open when no game can be played yet', () => {
    renderLobby({ games: [soon('later')] });

    expect(openButton()).toBeDisabled();
  });

  it('shows the table but lets nobody vote until the room has answered, and says it is waiting', () => {
    renderLobby({ votes: null, status: 'connecting' });

    expect(openButton()).toBeDisabled();
    expect(box('sudoku')).toBeDisabled();
    expect(screen.getByText('lobby.connecting')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'lobby.yourRoom' })).toBeInTheDocument();
  });

  it('explains a slow server on the table itself and offers to try again when it gave up', () => {
    renderLobby({ votes: null, status: 'failed' });

    expect(screen.getByText('loader.failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'loader.retry' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('stops talking about the server once the room has answered', () => {
    renderLobby({ votes: [], status: 'connected' });

    expect(screen.queryByText('lobby.connecting')).not.toBeInTheDocument();
    expect(screen.queryByText('loader.waking')).not.toBeInTheDocument();
  });

  it('shows who is in the room, and keeps the emotes for the game', () => {
    renderLobby();

    expect(screen.getByRole('list', { name: 'players.title' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'emotes.title' })).not.toBeInTheDocument();
  });
});
