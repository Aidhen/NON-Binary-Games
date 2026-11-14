import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { TakuzuBoardUI } from './TakuzuBoardUI';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => ({ 'takuzu.cell': 'R{row} C{column}: {value}', 'takuzu.empty': 'empty' })[key] ?? key,
  }),
}));

const initial = [
  [1, 0, 0, 2],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [2, 0, 0, 0],
];

const grid = [
  [1, 2, 0, 2],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [2, 0, 0, 0],
];

const baseProps = { size: 4, grid, initial, selectedCell: null, conflicts: new Set<string>(), isGameWon: false, onCellClick: () => {} };

describe('TakuzuBoardUI', () => {
  it('draws one button for each cell, and says where it is and what it holds', () => {
    render(<TakuzuBoardUI {...baseProps} />);

    expect(screen.getAllByRole('button')).toHaveLength(16);
    expect(screen.getByRole('button', { name: 'R1 C1: 0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'R1 C2: 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'R1 C3: empty' })).toBeInTheDocument();
  });

  it('writes the two symbols as 0 and 1, and nothing in an empty cell', () => {
    render(<TakuzuBoardUI {...baseProps} />);

    expect(screen.getByRole('button', { name: 'R1 C1: 0' })).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'R1 C2: 1' })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'R1 C3: empty' })).toHaveTextContent('');
  });

  it('tells the row and the column of the cell that was clicked, from zero', () => {
    const onCellClick = vi.fn();
    render(<TakuzuBoardUI {...baseProps} onCellClick={onCellClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'R4 C1: 1' }));

    expect(onCellClick).toHaveBeenCalledExactlyOnceWith(3, 0);
  });

  it('does not take clicks once the puzzle is solved', () => {
    const onCellClick = vi.fn();
    render(<TakuzuBoardUI {...baseProps} isGameWon onCellClick={onCellClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'R1 C3: empty' }));

    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('shows a clash in red, but never on a cell the puzzle gave', () => {
    render(<TakuzuBoardUI {...baseProps} conflicts={new Set(['0-0', '0-1'])} />);

    expect(screen.getByRole('button', { name: 'R1 C2: 1' }).className).toContain('--number-error');
    expect(screen.getByRole('button', { name: 'R1 C1: 0' }).className).not.toContain('--number-error');
  });

  it('shows no clash when none is given', () => {
    render(<TakuzuBoardUI {...baseProps} />);

    expect(screen.getByRole('button', { name: 'R1 C2: 1' }).className).not.toContain('--number-error');
  });

  it('rings the cell of another player, with their color', () => {
    const profiles: Record<string, PlayerProfile> = { friend: { alias: 'friend', animal: 'fox', color: 'teal' } };
    render(<TakuzuBoardUI {...baseProps} othersSelections={{ friend: [0, 2] }} profiles={profiles} />);

    expect(screen.getByRole('button', { name: 'R1 C3: empty' }).className).toContain('--player-teal');
  });

  it('rings the cell of a player the page does not know with the color of the theme', () => {
    render(<TakuzuBoardUI {...baseProps} othersSelections={{ stranger: [0, 2] }} />);

    expect(screen.getByRole('button', { name: 'R1 C3: empty' }).className).toContain('ring-[var(--number-player)]');
  });

  it('does not take a name of the profile list that it does not have: "constructor" is not a player', () => {
    render(<TakuzuBoardUI {...baseProps} othersSelections={{ constructor: [0, 2] as [number, number] }} profiles={{}} />);

    expect(screen.getByRole('button', { name: 'R1 C3: empty' }).className).toContain('ring-[var(--number-player)]');
  });
});
