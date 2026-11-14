import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { GameBox } from './GameBox';
import { MysteryCover } from './covers/MysteryCover';
import { SudokuCover } from './covers/SudokuCover';
import type { GameEntry } from './types';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const playable: GameEntry = { id: 'sudoku', status: 'available', titleKey: 'games.sudoku.title', Cover: SudokuCover, minPlayers: 1, maxPlayers: 5, Game: () => null };
const announced: GameEntry = { id: 'later', status: 'soon', titleKey: 'games.later.title', Cover: MysteryCover, minPlayers: 2, maxPlayers: 2 };
const fox: PlayerProfile = { alias: 'bbbbbbbbbbbb', animal: 'fox', color: 'blue' };

const onSelect = vi.fn();
const renderBox = (game: GameEntry, props: Partial<Parameters<typeof GameBox>[0]> = {}) =>
  render(<GameBox game={game} index={0} selected={false} voters={[]} playerCount={2} enabled onSelect={onSelect} {...props} />);

describe('GameBox', () => {
  it('is a button named after the game, with its players and its votes', () => {
    renderBox(playable, { voters: [fox] });
    const box = screen.getByRole('button');

    expect(box).toHaveTextContent('games.sudoku.title');
    expect(box).toHaveTextContent('lobby.players');
    expect(box).toHaveTextContent('lobby.votes');
    expect(box).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the animal of each player who voted for it', () => {
    renderBox(playable, { voters: [fox] });

    expect(screen.getByText('🦊')).toBeInTheDocument();
  });

  it('tells when it is the box the player is looking at, and when it is picked', () => {
    onSelect.mockClear();
    renderBox(playable, { selected: true });

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('cannot be picked while the room has not answered', () => {
    renderBox(playable, { enabled: false });

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('writes the exact number of players when a game takes only that many', () => {
    renderBox({ ...playable, minPlayers: 2, maxPlayers: 2 });

    expect(screen.getByRole('button')).toHaveTextContent('lobby.playersExact');
  });

  it('is a closed box with a label, not a button, when the game is only announced', () => {
    renderBox(announced, { index: 1 });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('lobby.soon')).toBeInTheDocument();
    expect(screen.getByText('games.later.title')).toBeInTheDocument();
  });
});
