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

  it('tells apart the cell the player is on, the cells the puzzle gave and the ones still free, by their background', () => {
    render(<TakuzuBoardUI {...baseProps} selectedCell={[0, 0]} />);

    const selected = screen.getByRole('button', { name: 'R1 C1: 0' });
    const given = screen.getByRole('button', { name: 'R1 C4: 1' });
    const free = screen.getByRole('button', { name: 'R1 C2: 1' });

    expect(selected.className).toContain('bg-[var(--cell-background-selected)]');
    expect(selected.className).toContain('outline-2');
    expect(given.className.split(' ')).toContain('bg-[var(--cell-background-initial)]');
    expect(given.className).not.toContain('outline-2');
    expect(free.className.split(' ')).toContain('bg-[var(--cell-background)]');
    expect(free.className).toContain('hover:bg-[var(--cell-background-initial)]');
  });

  it('writes the symbols of the puzzle bolder than the ones of a player, and hides the text of an empty cell', () => {
    render(<TakuzuBoardUI {...baseProps} />);

    expect(screen.getByRole('button', { name: 'R1 C1: 0' }).className).toContain('text-[var(--number-initial)] font-bold');
    expect(screen.getByRole('button', { name: 'R1 C2: 1' }).className).toContain('text-[var(--number-player)] font-medium');
    expect(screen.getByRole('button', { name: 'R1 C3: empty' }).className).toContain('text-transparent');
  });

  it('writes smaller symbols on a grid of more than eight cells a side', () => {
    const big = Array.from({ length: 10 }, () => new Array<number>(10).fill(0));
    const { unmount } = render(<TakuzuBoardUI {...baseProps} size={10} grid={big} initial={big} />);
    expect(screen.getByRole('button', { name: 'R1 C1: empty' }).className).toContain('text-lg');
    unmount();

    render(<TakuzuBoardUI {...baseProps} />);
    expect(screen.getByRole('button', { name: 'R1 C1: 0' }).className).toContain('text-2xl sm:text-3xl');
  });

  it('draws the cells as tiles with room between them, and no lines', () => {
    render(<TakuzuBoardUI {...baseProps} />);

    const first = screen.getByRole('button', { name: 'R1 C1: 0' });
    expect(first).toHaveClass('rounded-md');
    expect(first.className).not.toContain('border-');
    expect(screen.getByRole('button', { name: 'R4 C4: empty' }).className).not.toContain('border-');
    expect(first.parentElement?.className).toMatch(/\bgap-/);
  });

  it('makes the cursor of the player being pointed out stand out, and only that one', () => {
    const profiles: Record<string, PlayerProfile> = { friend: { alias: 'friend', animal: 'fox', color: 'teal' }, other: { alias: 'other', animal: 'owl', color: 'teal' } };
    render(<TakuzuBoardUI {...baseProps} othersSelections={{ friend: [0, 2], other: [1, 1] }} profiles={profiles} highlightedAlias="friend" />);

    expect(screen.getByRole('button', { name: 'R1 C3: empty' }).className).toContain('ring-8 motion-safe:animate-pulse');
    expect(screen.getByRole('button', { name: 'R2 C2: empty' }).className).toContain('ring-4');
    expect(screen.getByRole('button', { name: 'R2 C2: empty' }).className).not.toContain('ring-8');
    expect(screen.getByRole('button', { name: 'R2 C1: empty' }).className).not.toContain('ring-');
  });

  it('keeps the background of the selected cell when another player is on it too', () => {
    const profiles: Record<string, PlayerProfile> = { friend: { alias: 'friend', animal: 'fox', color: 'teal' } };
    const { rerender } = render(<TakuzuBoardUI {...baseProps} othersSelections={{ friend: [0, 2] }} profiles={profiles} />);
    const tinted = screen.getByRole('button', { name: 'R1 C3: empty' }).className;

    rerender(<TakuzuBoardUI {...baseProps} selectedCell={[0, 2]} othersSelections={{ friend: [0, 2] }} profiles={profiles} />);
    const selected = screen.getByRole('button', { name: 'R1 C3: empty' }).className;

    expect(selected).toContain('bg-[var(--cell-background-selected)]');
    expect(selected).toContain('ring-4');
    expect(tinted).not.toContain('bg-[var(--cell-background-selected)]');
    expect(tinted).not.toBe(selected);
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

  describe('with the keyboard', () => {
    it('is one tab stop, on the selected cell, and the arrows select without playing', () => {
      const onCellClick = vi.fn();
      const onMove = vi.fn();
      render(<TakuzuBoardUI {...baseProps} selectedCell={[0, 1]} onCellClick={onCellClick} onMove={onMove} />);
      const cells = screen.getAllByRole('button');

      expect(cells.filter((cell) => cell.tabIndex === 0)).toEqual([cells[1]]);
      fireEvent.keyDown(cells[1], { key: 'ArrowRight' });

      expect(onMove).toHaveBeenCalledWith(0, 2);
      expect(onCellClick).not.toHaveBeenCalled();
      expect(cells[2]).toHaveFocus();
    });

    it('stays inside the grid at the edges', () => {
      const onMove = vi.fn();
      render(<TakuzuBoardUI {...baseProps} selectedCell={[0, 0]} onMove={onMove} />);
      const cells = screen.getAllByRole('button');

      fireEvent.keyDown(cells[0], { key: 'ArrowUp' });
      fireEvent.keyDown(cells[0], { key: 'ArrowLeft' });

      expect(onMove.mock.calls).toEqual([[0, 0], [0, 0]]);
    });

    it('takes no keys once the game is over', () => {
      const onMove = vi.fn();
      render(<TakuzuBoardUI {...baseProps} isGameWon selectedCell={[0, 0]} onMove={onMove} />);

      fireEvent.keyDown(screen.getAllByRole('button')[0], { key: 'ArrowRight' });

      expect(onMove).not.toHaveBeenCalled();
    });
  });
});
