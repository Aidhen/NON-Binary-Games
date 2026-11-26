import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { BLOOM_SPREAD_MS, FlowerFieldBoardUI, bloomDelayOf, flowerOf } from './FlowerFieldBoardUI';
import { FLOWER_COLORS, FLOWER_KINDS } from '@nbg/art';

// `n` equal tracks: jsdom writes the zero of minmax as 0 or 0px, depending on its version.
const TRACKS = (n: number) => new RegExp(`repeat\\(${n}, minmax\\(0(px)?, 1fr\\)\\)`);

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

  it('gives the rows a fixed share of the board, so a cell is never squashed by what it holds', () => {
    render(<FlowerFieldBoardUI {...baseProps} />);

    const board = screen.getAllByRole('button')[0].parentElement as HTMLElement;
    expect(board.style.gridTemplateRows).toMatch(TRACKS(3));
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

  it('tells apart the cell the player is on, the cells that show what they hold and the closed ones, by their background', () => {
    render(<FlowerFieldBoardUI {...baseProps} selectedCell={[2, 1]} />);

    const selected = screen.getByRole('button', { name: 'R3 C2: closed' });
    const open = screen.getByRole('button', { name: 'R1 C2: 2' });
    const marked = screen.getByRole('button', { name: 'R2 C1: mine' });
    const closed = screen.getByRole('button', { name: 'R1 C1: closed' });

    expect(selected.className).toContain('bg-[var(--cell-background-selected)]');
    expect(selected.className).toContain('outline-2');
    expect(open.className.split(' ')).toContain('bg-[var(--cell-background-initial)]');
    expect(open.className).toContain('text-[var(--number-initial)] font-bold');
    expect(marked.className.split(' ')).toContain('bg-[var(--cell-background-initial)]');
    expect(marked.className).toContain('text-[var(--number-error)]');
    expect(closed.className.split(' ')).toContain('bg-[var(--cell-background)]');
    expect(closed.className).toContain('hover:bg-[var(--cell-background-initial)]');
    expect(closed.className).not.toContain('outline-2');
  });

  it('keeps the mine that was opened red also when the player is on it', () => {
    render(<FlowerFieldBoardUI {...baseProps} isOver mines={[[2, 2]]} exploded={[2, 2]} selectedCell={[2, 2]} />);

    const cell = screen.getByRole('button', { name: 'R3 C3: mine' });
    expect(cell.className).toContain('--number-error)]/30');
    expect(cell.className).not.toContain('bg-[var(--cell-background-selected)]');
  });

  it('shows a mine and not the flag that was on it', () => {
    render(<FlowerFieldBoardUI {...baseProps} isOver mines={[[2, 0]]} flags={{ '2-0': 'friend', '1-0': 'friend' }} profiles={profiles} />);

    expect(screen.getByRole('button', { name: 'R3 C1: mine' })).toHaveTextContent('✸');
    expect(screen.getByRole('button', { name: 'R3 C1: mine' }).className).not.toContain('--player-teal-text');
    expect(screen.getByRole('button', { name: 'R2 C1: mine' })).toHaveTextContent('✸');
  });

  it('writes smaller symbols on a field of more than ten cells a side', () => {
    const big = Array.from({ length: 12 }, () => new Array<number>(12).fill(-1));
    const { unmount } = render(<FlowerFieldBoardUI {...baseProps} size={12} grid={big} />);
    expect(screen.getByRole('button', { name: 'R1 C1: closed' }).className).toContain('text-base sm:text-xl');
    unmount();

    render(<FlowerFieldBoardUI {...baseProps} />);
    expect(screen.getByRole('button', { name: 'R1 C1: closed' }).className).toContain('text-xl sm:text-2xl');
  });

  it('draws the cells as tiles with room between them, and no lines', () => {
    render(<FlowerFieldBoardUI {...baseProps} />);

    const first = screen.getByRole('button', { name: 'R1 C1: closed' });
    expect(first).toHaveClass('rounded-md');
    expect(first.className).not.toContain('border-');
    expect(screen.getByRole('button', { name: 'R3 C3: closed' }).className).not.toContain('border-');
    expect(first.parentElement?.className).toMatch(/\bgap-/);
  });

  it('makes the flags and the cursor of the player being pointed out stand out, and only theirs', () => {
    const two: Record<string, PlayerProfile> = { ...profiles, other: { alias: 'other', animal: 'owl', color: 'teal' } };
    render(
      <FlowerFieldBoardUI
        {...baseProps}
        flags={{ '0-0': 'friend', '1-1': 'other' }}
        othersSelections={{ friend: [2, 0], other: [2, 2] }}
        profiles={two}
        highlightedAlias="friend"
      />
    );

    expect(screen.getByRole('button', { name: 'R1 C1: flag' }).className).toContain('font-black motion-safe:animate-pulse');
    expect(screen.getByRole('button', { name: 'R2 C2: flag' }).className).not.toContain('font-black');
    expect(screen.getByRole('button', { name: 'R3 C1: closed' }).className).toContain('ring-8 motion-safe:animate-pulse');
    expect(screen.getByRole('button', { name: 'R3 C3: closed' }).className).toContain('ring-4');
    expect(screen.getByRole('button', { name: 'R3 C3: closed' }).className).not.toContain('ring-8');
    expect(screen.getByRole('button', { name: 'R3 C2: closed' }).className).not.toContain('ring-');
  });

  it('keeps the background of the selected cell when another player is on it too', () => {
    const { rerender } = render(<FlowerFieldBoardUI {...baseProps} othersSelections={{ friend: [2, 1] }} profiles={profiles} />);
    const tinted = screen.getByRole('button', { name: 'R3 C2: closed' }).className;

    rerender(<FlowerFieldBoardUI {...baseProps} selectedCell={[2, 1]} othersSelections={{ friend: [2, 1] }} profiles={profiles} />);
    const selected = screen.getByRole('button', { name: 'R3 C2: closed' }).className;

    expect(selected).toContain('bg-[var(--cell-background-selected)]');
    expect(selected).toContain('ring-4');
    expect(tinted).not.toContain('bg-[var(--cell-background-selected)]');
  });

  it('rings the cell of another player, with their color or the one of the theme', () => {
    render(<FlowerFieldBoardUI {...baseProps} othersSelections={{ friend: [0, 0], stranger: [2, 2] }} profiles={profiles} />);

    expect(screen.getByRole('button', { name: 'R1 C1: closed' }).className).toContain('--player-teal');
    expect(screen.getByRole('button', { name: 'R3 C3: closed' }).className).toContain('ring-[var(--number-player)]');
  });

  describe('the field in bloom', () => {
    it('grows no flower while the game is on', () => {
      const { container } = render(<FlowerFieldBoardUI {...baseProps} />);

      expect(container.querySelectorAll('svg[data-flower]')).toHaveLength(0);
    });

    it('grows a flower on every cell once the field is cleared, each with its own delay', () => {
      const { container } = render(<FlowerFieldBoardUI {...baseProps} isOver bloom={{ grow: true }} />);
      const flowers = [...container.querySelectorAll<SVGElement>('svg[data-flower]')];

      expect(flowers).toHaveLength(9);
      for (const flower of flowers) {
        expect(flower.getAttribute('class')).toContain('motion-safe:animate-bloom');
        expect(flower.style.animationDelay).toMatch(/^\d+ms$/);
      }
      // The flowers are decoration: the cells keep saying what they hold.
      expect(screen.getByRole('button', { name: 'R1 C2: 2' })).toBeInTheDocument();
    });

    it('shows the flowers still when growing is turned off', () => {
      const { container } = render(<FlowerFieldBoardUI {...baseProps} isOver bloom={{ grow: false }} />);
      const flowers = [...container.querySelectorAll<SVGElement>('svg[data-flower]')];

      expect(flowers).toHaveLength(9);
      for (const flower of flowers) {
        expect(flower.getAttribute('class')).not.toContain('animate-bloom');
        expect(flower.style.animationDelay).toBe('');
      }
    });

    it('gives every cell the same flower on every page, and uses every kind on a full field', () => {
      expect(flowerOf(3, 5)).toEqual(flowerOf(3, 5));
      const kinds = new Set<string>();
      const colors = new Set<string>();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { kinds.add(flowerOf(r, c).kind); colors.add(flowerOf(r, c).color); }

      expect([...kinds].sort()).toEqual([...FLOWER_KINDS].sort());
      expect(colors.size).toBe(FLOWER_COLORS.length);
    });

    it('opens from the middle outwards, and is done in about the time it is given', () => {
      const size = 14;
      const middle = bloomDelayOf(size, 6, 7);
      const corner = bloomDelayOf(size, 0, 0);

      expect(middle).toBeLessThan(corner);
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        expect(bloomDelayOf(size, r, c)).toBeGreaterThanOrEqual(0);
        expect(bloomDelayOf(size, r, c)).toBeLessThanOrEqual(BLOOM_SPREAD_MS + 200);
      }
    });
  });

  describe('with the keyboard', () => {
    it('is one tab stop, on the selected cell, and the arrows select without playing', () => {
      const onCellClick = vi.fn();
      const onMove = vi.fn();
      render(<FlowerFieldBoardUI {...baseProps} selectedCell={[0, 1]} onCellClick={onCellClick} onMove={onMove} />);
      const cells = screen.getAllByRole('button');

      expect(cells.filter((cell) => cell.tabIndex === 0)).toEqual([cells[1]]);
      fireEvent.keyDown(cells[1], { key: 'ArrowRight' });

      expect(onMove).toHaveBeenCalledWith(0, 2);
      expect(onCellClick).not.toHaveBeenCalled();
      expect(cells[2]).toHaveFocus();
    });

    it('stays inside the grid at the edges', () => {
      const onMove = vi.fn();
      render(<FlowerFieldBoardUI {...baseProps} selectedCell={[0, 0]} onMove={onMove} />);
      const cells = screen.getAllByRole('button');

      fireEvent.keyDown(cells[0], { key: 'ArrowUp' });
      fireEvent.keyDown(cells[0], { key: 'ArrowLeft' });

      expect(onMove.mock.calls).toEqual([[0, 0], [0, 0]]);
    });

    it('takes no keys once the game is over', () => {
      const onMove = vi.fn();
      render(<FlowerFieldBoardUI {...baseProps} isOver selectedCell={[0, 0]} onMove={onMove} />);

      fireEvent.keyDown(screen.getAllByRole('button')[0], { key: 'ArrowRight' });

      expect(onMove).not.toHaveBeenCalled();
    });
  });
});
