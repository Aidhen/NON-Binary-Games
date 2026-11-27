import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { RoomHeader } from './RoomHeader';

// The English dictionary, so that the sentence with the names in it can be read.
vi.mock('@/lib/i18n/TranslationContext', async () => {
  const { en } = await import('@/locales/en');
  const t = (path: string) => path.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], en) as string ?? path;
  return { useTranslation: () => ({ t }) };
});

const koala: PlayerProfile = { alias: 'aaaaaaaaaaaa', animal: 'koala', color: 'red' };
const fox: PlayerProfile = { alias: 'bbbbbbbbbbbb', animal: 'fox', color: 'blue' };
const owl: PlayerProfile = { alias: 'cccccccccccc', animal: 'owl', color: 'teal' };
const ROOM = '3f2b8c1e-9d4a-4b7e-8a2c-5d6e7f8a9b0c';

const onVoteTable = vi.fn();
const renderHeader = (tableVotes: string[], players = [koala, fox, owl]) =>
  render(<RoomHeader roomId={ROOM} players={players} self={koala.alias} tableVotes={tableVotes} onVoteTable={onVoteTable} />);

beforeEach(() => onVoteTable.mockClear());

describe('RoomHeader', () => {
  it('asks to go back to the table with a button that is not the main color of the page', () => {
    renderHeader([]);

    const button = screen.getByRole('button', { name: 'Back to the table' });
    expect(button).toHaveClass('bg-[var(--paper-well)]');
    expect(button).not.toHaveClass('bg-[var(--accent)]');
    fireEvent.click(button);
    expect(onVoteTable).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('says who asks to go back, and lets the player go with them', () => {
    renderHeader([fox.alias]);

    expect(screen.getByText('Blue Fox would like to go back to the table')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onVoteTable).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('names everybody who asks', () => {
    renderHeader([fox.alias, owl.alias]);

    expect(screen.getByText('Blue Fox and Teal Owl would like to go back to the table')).toBeInTheDocument();
  });

  it('keeps playing without sending anything, and asks again when somebody else asks', () => {
    const { rerender } = renderHeader([fox.alias]);

    fireEvent.click(screen.getByRole('button', { name: 'Keep playing' }));
    expect(onVoteTable).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to the table' })).toBeInTheDocument();

    rerender(<RoomHeader roomId={ROOM} players={[koala, fox, owl]} self={koala.alias} tableVotes={[fox.alias, owl.alias]} onVoteTable={onVoteTable} />);
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });

  it('does not ask the player who already wants to go back, and offers to stay', () => {
    renderHeader([koala.alias, fox.alias]);

    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 of 3 want to go back to the table');
    fireEvent.click(screen.getByRole('button', { name: "I'd rather stay" }));
    expect(onVoteTable).toHaveBeenCalledExactlyOnceWith(false);
  });
});
