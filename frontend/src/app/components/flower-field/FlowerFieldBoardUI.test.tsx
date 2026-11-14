import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { FlowerFieldBoardUI } from './FlowerFieldBoardUI';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'flowerField.cell': 'R{row} C{column}: {state}',
      'flowerField.closed': 'closed',
      'flowerField.flagged': 'flag',
      'flowerField.mine': 'mine',
      'flowerField.empty': 'empty',
    })[key] ?? key,
  }),
}));

// Closed (-1), marked as a mine (-2), and open with a number of mines around (0 and up).
const grid = [
  [-1, 2, 0],
  [-2, -1, 1],
  [-1, -1, -1],
];

const profiles: Record<string, PlayerProfile> = { friend: { alias: 'friend', animal: 'fox', color: 'teal' } };

const baseProps = { size: 3, grid, flags: {}, mines: [], exploded: null, selectedCell: null, isOver: false, onCellClick: () => {} };

describe('FlowerFieldBoardUI', () => {
  it('draws one button for each cell, and says where it is and what it shows', () => {
    render(<FlowerFieldBoardUI {...baseProps} />);

    expect(screen.getAllByRole('button')).toHaveLength(9);
    expect(screen.getByRole('button', { name: 'R1 C1: closed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'R1 C2: 2' })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'R1 C3: empty' })).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'R2 C1: mine' })).toHaveTextContent('✸');
  });

  it('shows a flag in the color of the player who put it', () => {
    render(<FlowerFieldBoardUI {...baseProps} flags={{ '0-0': 'friend' }} profiles={profiles} />);

    const cell = screen.getByRole('button', { name: 'R1 C1: flag' });
    expect(cell).toHaveTextContent('⚑');
    expect(cell.className).toContain('--player-teal-text');
  });

  it('shows the flag of a player the page does not know in the color of the theme, and takes no name from the prototype', () => {
    render(<FlowerFieldBoardUI {...baseProps} flags={{ '0-0': 'constructor' }} profiles={{}} />);

    expect(screen.getByRole('button', { name: 'R1 C1: flag' }).className).toContain('--number-player');
  });

  it('shows no flag on a cell that is open', () => {
    render(<FlowerFieldBoardUI {...baseProps} flags={{ '0-1': 'friend' }} profiles={profiles} />);

    expect(screen.getByRole('button', { name: 'R1 C2: 2' })).not.toHaveTextContent('⚑');
  });

  it('tells the row and the column of the cell that was clicked, from zero', () => {
    const onCellClick = vi.fn();
    render(<FlowerFieldBoardUI {...baseProps} onCellClick={onCellClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'R3 C2: closed' }));

    expect(onCellClick).toHaveBeenCalledExactlyOnceWith(2, 1);
  });

  it('takes no clicks once the game is won or lost', () => {
    const onCellClick = vi.fn();
    render(<FlowerFieldBoardUI {...baseProps} isOver onCellClick={onCellClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'R3 C2: closed' }));

    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('shows where the mines were when the game is lost, and the one that was opened stands out', () => {
    render(<FlowerFieldBoardUI {...baseProps} isOver mines={[[2, 0], [2, 2]]} exploded={[2, 2]} />);

    expect(screen.getByRole('button', { name: 'R3 C1: mine' })).toHaveTextContent('✸');
    expect(screen.getByRole('button', { name: 'R3 C3: mine' }).className).toContain('--number-error)]/30');
    expect(screen.getByRole('button', { name: 'R3 C1: mine' }).className).not.toContain('--number-error)]/30');
  });

  it('rings the cell of another player, with their color or the one of the theme', () => {
    render(<FlowerFieldBoardUI {...baseProps} othersSelections={{ friend: [0, 0], stranger: [2, 2] }} profiles={profiles} />);

    expect(screen.getByRole('button', { name: 'R1 C1: closed' }).className).toContain('--player-teal');
    expect(screen.getByRole('button', { name: 'R3 C3: closed' }).className).toContain('ring-[var(--number-player)]');
  });
});
