import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LobbyVote, PlayerProfile } from '@nbg/shared';
import { Lobby } from './Lobby';
import type { GameEntry } from '../games/types';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/useEmotes', () => ({
  useEmotes: () => ({ emotes: [], sendEmote: vi.fn(), isCoolingDown: false }),
}));

const games: GameEntry[] = [
  { id: 'sudoku', status: 'available', titleKey: 'games.sudoku.title', minPlayers: 1, maxPlayers: 5, Game: () => null },
  { id: 'later', status: 'soon', titleKey: 'games.later.title', minPlayers: 2, maxPlayers: 4 },
];

const panda: PlayerProfile = { alias: 'aaaaaaaaaaaa', animal: 'panda', color: 'red' };
const fox: PlayerProfile = { alias: 'bbbbbbbbbbbb', animal: 'fox', color: 'blue' };

const onVote = vi.fn();

const renderLobby = (votes: LobbyVote[] = [], players = [panda, fox]) =>
  render(<Lobby games={games} players={players} self={panda.alias} votes={votes} onVote={onVote} onPickColor={vi.fn()} />);

const gameButton = (title: string) => screen.getByRole('button', { name: new RegExp(title) });

beforeEach(() => { onVote.mockClear(); });

describe('Lobby', () => {
  it('lists every game, with the votes it has out of the players in the room', () => {
    renderLobby([{ alias: fox.alias, game: 'sudoku' }]);

    const list = within(screen.getByRole('region', { name: 'lobby.title' }));
    expect(list.getAllByRole('listitem')).toHaveLength(2);
    expect(gameButton('games.sudoku.title')).toHaveTextContent('lobby.votes');
  });

  it('votes for a game the player has not picked yet', () => {
    renderLobby();

    expect(gameButton('games.sudoku.title')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(gameButton('games.sudoku.title'));

    expect(onVote).toHaveBeenCalledExactlyOnceWith('sudoku');
  });

  it('shows the vote of the player as pressed, and takes it back on a second click', () => {
    renderLobby([{ alias: panda.alias, game: 'sudoku' }]);

    expect(gameButton('games.sudoku.title')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(gameButton('games.sudoku.title'));

    expect(onVote).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('does not show the vote of another player as the vote of this one', () => {
    renderLobby([{ alias: fox.alias, game: 'sudoku' }]);

    expect(gameButton('games.sudoku.title')).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not let anybody vote for a game that is only announced', () => {
    renderLobby();
    const soon = gameButton('games.later.title');

    expect(soon).toBeDisabled();
    expect(soon).toHaveTextContent('lobby.soon');
    expect(soon).not.toHaveAttribute('aria-pressed');

    fireEvent.click(soon);
    expect(onVote).not.toHaveBeenCalled();
  });

  it('shows who is in the room and the emotes', () => {
    renderLobby();

    expect(screen.getByRole('list', { name: 'players.title' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'emotes.title' })).toBeInTheDocument();
  });
});
