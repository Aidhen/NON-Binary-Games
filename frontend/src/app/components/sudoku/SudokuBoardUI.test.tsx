import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { isValid } from '@nbg/shared';
import type { SudokuBoard } from '@nbg/shared';
import type { GameSettings } from './SudokuContainer';
import { SudokuBoardUI } from './SudokuBoardUI';

const testBoard: SudokuBoard = {
  size: 4,
  boxSize: 2,
  initial: [
    [1, 0, 0, 4],
    [0, 4, 1, 0],
    [0, 1, 4, 0],
    [4, 0, 0, 1],
  ],
  solution: [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ],
};

const currentGrid = [
  [1, 2, 0, 4],
  [0, 4, 1, 0],
  [0, 1, 4, 0],
  [4, 0, 0, 1],
];

const defaultSettings: GameSettings = {
  highlightCrosshairs: true,
  highlightSameNumbers: true,
  showErrors: true,
  godMode: false,
};

const textColors = [
  'text-blue-500',
  'text-green-500',
  'text-purple-500',
  'text-pink-500',
  'text-orange-500',
];

type Props = ComponentProps<typeof SudokuBoardUI>;

const createProps = (overrides: Partial<Props> = {}) => ({
  board: testBoard,
  playerGrid: currentGrid.map((row) => [...row]),
  selectedCell: null,
  settings: { ...defaultSettings },
  isGameWon: false,
  onCellClick: vi.fn(),
  isErrorPlacement: vi.fn(() => false),
  ...overrides,
});

const renderBoard = (overrides: Partial<Props> = {}) => {
  const props = createProps(overrides);
  const view = render(<SudokuBoardUI {...props} />);
  return { ...view, props };
};

const getCell = (r: number, c: number) => screen.getAllByRole('button')[r * testBoard.size + c];

describe('SudokuBoardUI', () => {
  it('renders the complete board with the correct grid dimensions', () => {
    const { container } = renderBoard();

    expect(screen.getAllByRole('button')).toHaveLength(16);
    expect(screen.getAllByRole('button', { name: 'Cell value 1' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Empty cell' })).toHaveLength(7);
    expect(container.querySelector('[style]')?.getAttribute('style')).toContain('repeat(4, minmax(0, 1fr))');
  });

  it('renders initial, editable and empty cells with the correct classes', () => {
    renderBoard();

    expect(getCell(0, 0)).toHaveClass('text-[var(--number-initial)]', 'font-bold');
    expect(getCell(0, 0)).toHaveClass('bg-[var(--cell-background-initial)]');
    expect(getCell(0, 1)).toHaveClass('text-[var(--number-player)]', 'font-medium');
    expect(getCell(0, 1)).toHaveClass('bg-[var(--cell-background)]');
    expect(getCell(0, 2)).toHaveClass('text-transparent');
  });

  it('renders outer and inner borders at the correct positions', () => {
    renderBoard();

    expect(getCell(0, 1)).toHaveClass('border-r-2', 'border-r-[var(--grid-border-outer)]');
    expect(getCell(0, 3)).toHaveClass('border-r', 'border-r-[var(--grid-border-inner)]');
    expect(getCell(1, 0)).toHaveClass('border-b-2', 'border-b-[var(--grid-border-outer)]');
    expect(getCell(3, 0)).toHaveClass('border-b', 'border-b-[var(--grid-border-inner)]');
  });

  it('highlights the selected cell and invokes the click callback', () => {
    const onCellClick = vi.fn();
    renderBoard({ onCellClick });

    fireEvent.click(getCell(1, 2));

    expect(onCellClick).toHaveBeenCalledOnce();
    expect(onCellClick).toHaveBeenCalledWith(1, 2);
  });

  it('does not invoke the click callback when the game is won', () => {
    const onCellClick = vi.fn();
    renderBoard({ onCellClick, isGameWon: true });

    fireEvent.click(getCell(0, 1));

    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('highlights the selected cell with the selected background', () => {
    renderBoard({ selectedCell: [0, 1] });

    expect(getCell(0, 1)).toHaveClass('bg-[var(--cell-background-selected)]');
  });

  it('highlights the selected row, column and box when crosshairs are enabled', () => {
    const playerGrid = currentGrid.map((row) => [...row]);
    playerGrid[0][1] = 0;

    renderBoard({
      playerGrid,
      selectedCell: [0, 1],
      settings: { ...defaultSettings, highlightSameNumbers: false },
    });

    expect(getCell(0, 2)).toHaveClass('bg-[var(--cell-background-highlight)]');
    expect(getCell(2, 1)).toHaveClass('bg-[var(--cell-background-highlight)]');
    expect(getCell(1, 0)).toHaveClass('bg-[var(--cell-background-highlight)]');
    expect(getCell(2, 2)).not.toHaveClass('bg-[var(--cell-background-highlight)]');
    expect(getCell(0, 1)).toHaveClass('bg-[var(--cell-background-selected)]');
  });

  it('does not highlight crosshairs when the setting is disabled', () => {
    const playerGrid = currentGrid.map((row) => [...row]);
    playerGrid[0][1] = 0;

    renderBoard({
      playerGrid,
      selectedCell: [0, 1],
      settings: { ...defaultSettings, highlightCrosshairs: false },
    });

    expect(getCell(0, 2)).not.toHaveClass('bg-[var(--cell-background-highlight)]');
    expect(getCell(1, 0)).not.toHaveClass('bg-[var(--cell-background-highlight)]');
  });

  it('does not draw crosshairs from a valid filled cell', () => {
    renderBoard({
      selectedCell: [0, 1],
      settings: { ...defaultSettings, highlightSameNumbers: false },
    });

    expect(getCell(0, 2)).not.toHaveClass('bg-[var(--cell-background-highlight)]');
    expect(getCell(1, 0)).not.toHaveClass('bg-[var(--cell-background-highlight)]');
  });

  it('highlights cells containing the same number as the selected cell', () => {
    const playerGrid = currentGrid.map((row) => [...row]);
    playerGrid[2][3] = 2;

    renderBoard({
      playerGrid,
      selectedCell: [0, 1],
      settings: { ...defaultSettings, highlightCrosshairs: false },
    });

    expect(getCell(2, 3)).toHaveClass('bg-[var(--cell-background-same)]');
    expect(getCell(2, 3)).not.toHaveClass('bg-[var(--cell-background-selected)]');
    expect(getCell(1, 3)).not.toHaveClass('bg-[var(--cell-background-same)]');
  });

  it('keeps the selected cell visually different from the cells with the same number', () => {
    const playerGrid = currentGrid.map((row) => [...row]);
    playerGrid[2][3] = 2;

    renderBoard({
      playerGrid,
      selectedCell: [0, 1],
      settings: { ...defaultSettings, highlightCrosshairs: false },
    });

    expect(getCell(0, 1)).toHaveClass('bg-[var(--cell-background-selected)]');
    expect(getCell(0, 1)).not.toHaveClass('bg-[var(--cell-background-same)]');
  });

  it('does not highlight matching numbers when the selected placement is invalid', () => {
    const playerGrid = currentGrid.map((row) => [...row]);
    playerGrid[2][3] = 2;

    renderBoard({
      playerGrid,
      selectedCell: [0, 1],
      settings: { ...defaultSettings, highlightCrosshairs: false },
      isErrorPlacement: vi.fn(() => true),
    });

    expect(getCell(0, 1)).toHaveClass('text-[var(--number-error)]', 'font-bold');
    expect(getCell(2, 3)).not.toHaveClass('bg-[var(--cell-background-selected)]');
    expect(getCell(2, 3)).not.toHaveClass('bg-[var(--cell-background-same)]');
  });

  it('marks invalid placements as errors without marking initial or empty cells', () => {
    renderBoard({ isErrorPlacement: vi.fn(() => true) });

    expect(getCell(0, 1)).toHaveClass('text-[var(--number-error)]', 'font-bold');
    expect(getCell(0, 0)).toHaveClass('text-[var(--number-initial)]', 'font-bold');
    expect(getCell(0, 2)).toHaveClass('text-transparent');
  });

  it('does not calculate placement errors when error highlighting is disabled', () => {
    const isErrorPlacement = vi.fn(() => true);

    renderBoard({
      isErrorPlacement,
      settings: { ...defaultSettings, showErrors: false },
    });

    expect(isErrorPlacement).not.toHaveBeenCalled();
    expect(getCell(0, 1)).toHaveClass('text-[var(--number-player)]', 'font-medium');
    expect(getCell(0, 1)).not.toHaveClass('text-[var(--number-error)]');
  });

  describe('god mode', () => {
    const wrongGrid = () => {
      const playerGrid = currentGrid.map((row) => [...row]);
      playerGrid[0][2] = 2; // solution is 3
      return playerGrid;
    };

    it('marks numbers that differ from the solution, even with no rule clash', () => {
      renderBoard({
        playerGrid: wrongGrid(),
        settings: { ...defaultSettings, godMode: true, showErrors: false },
        isErrorPlacement: vi.fn(() => false),
      });

      expect(getCell(0, 2)).toHaveClass('text-[var(--number-error)]', 'font-bold');
    });

    it('keeps correct, initial and empty cells unmarked', () => {
      renderBoard({
        playerGrid: wrongGrid(),
        settings: { ...defaultSettings, godMode: true },
      });

      expect(getCell(0, 1)).toHaveClass('text-[var(--number-player)]', 'font-medium');
      expect(getCell(0, 0)).toHaveClass('text-[var(--number-initial)]', 'font-bold');
      expect(getCell(1, 0)).toHaveClass('text-transparent');
    });

    it('does not compare with the solution when disabled', () => {
      renderBoard({ playerGrid: wrongGrid() });

      expect(getCell(0, 2)).toHaveClass('text-[var(--number-player)]', 'font-medium');
      expect(getCell(0, 2)).not.toHaveClass('text-[var(--number-error)]');
    });

    it('does not highlight matching numbers when the selected number is wrong', () => {
      const playerGrid = wrongGrid();
      playerGrid[1][0] = 2; // same wrong value, solution is 3

      renderBoard({
        playerGrid,
        selectedCell: [0, 2],
        settings: { ...defaultSettings, godMode: true },
      });

      expect(getCell(1, 0)).not.toHaveClass('bg-[var(--cell-background-selected)]');
    });
  });

  it('renders other players selections using consistent multiplayer styling', () => {
    renderBoard({
      othersSelections: {
        'player-2': [0, 1],
        'player-3': [1, 0],
      },
    });

    const firstCell = getCell(0, 1);
    const secondCell = getCell(1, 0);
    const ringColors = ['ring-blue-500', 'ring-green-500', 'ring-purple-500', 'ring-pink-500', 'ring-orange-500'];

    expect(firstCell).toHaveClass('ring-4', 'ring-inset', 'z-10');
    expect(secondCell).toHaveClass('ring-4', 'ring-inset', 'z-10');
    expect(ringColors.some((color) => firstCell.classList.contains(color))).toBe(true);
    expect(ringColors.some((color) => secondCell.classList.contains(color))).toBe(true);
  });

  it('renders notes with player-specific colors in empty cells', () => {
    renderBoard({
      notesGrid: {
        '0-2': { 2: 'player-2', 4: 'player-3' },
      },
    });

    const notesGrid = getCell(0, 2).querySelector('div[style]');
    const noteCells = Array.from(notesGrid?.children ?? []);

    expect(notesGrid).not.toBeNull();
    expect(notesGrid).toHaveStyle({
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
    });
    expect(noteCells).toHaveLength(4);
    expect(noteCells[0]).toHaveClass('text-transparent');
    expect(noteCells[1]).toHaveTextContent('2');
    expect(textColors.some((color) => noteCells[1].classList.contains(color))).toBe(true);
    expect(noteCells[2]).toHaveClass('text-transparent');
    expect(noteCells[3]).toHaveTextContent('4');
    expect(textColors.some((color) => noteCells[3].classList.contains(color))).toBe(true);
  });

  describe('selection outline', () => {
    const outline = ['outline-2', '-outline-offset-2', 'outline-[var(--number-player)]/70'];

    it('draws a themed outline around the selected cell only', () => {
      renderBoard({ selectedCell: [0, 1] });

      expect(getCell(0, 1)).toHaveClass(...outline);
      expect(getCell(0, 2)).not.toHaveClass('outline-2');
    });

    it('keeps the outline next to the ring of another player on the same cell', () => {
      renderBoard({ selectedCell: [0, 1], othersSelections: { 'player-2': [0, 1] } });

      expect(getCell(0, 1)).toHaveClass(...outline, 'ring-4', 'ring-inset');
    });

    it('does not draw the outline when nothing is selected', () => {
      renderBoard();

      screen.getAllByRole('button').forEach((cell) => expect(cell).not.toHaveClass('outline-2'));
    });
  });

  describe('cells occupied by other players', () => {
    const tints = ['bg-blue-500/10', 'bg-green-500/10', 'bg-purple-500/10', 'bg-pink-500/10', 'bg-orange-500/10'];
    const hasTint = (cell: HTMLElement) => tints.some((tint) => cell.classList.contains(tint));

    it('keeps my selected background when another player is on the same cell', () => {
      renderBoard({ selectedCell: [0, 1], othersSelections: { 'player-2': [0, 1] } });

      expect(getCell(0, 1)).toHaveClass('bg-[var(--cell-background-selected)]', 'ring-4', 'ring-inset');
      expect(hasTint(getCell(0, 1))).toBe(false);
    });

    it('tints the cell of another player when it is not selected', () => {
      renderBoard({ othersSelections: { 'player-2': [0, 1] } });

      expect(hasTint(getCell(0, 1))).toBe(true);
      expect(getCell(0, 1)).not.toHaveClass('bg-[var(--cell-background)]');
    });
  });

  describe('note visibility', () => {
    const getVisibleNotes = (r: number, c: number) =>
      Array.from(getCell(r, c).querySelector('div[style]')?.children ?? [])
        .map((note) => note.textContent)
        .filter(Boolean);

    it('hides the notes of completed numbers', () => {
      renderBoard({
        notesGrid: { '0-2': { 2: 'player-2', 3: 'player-2' } },
        completedNumbers: new Set([2]),
      });

      expect(getVisibleNotes(0, 2)).toEqual(['3']);
    });

    it('hides the notes that clash with a placed number in the row, column or box', () => {
      const isErrorPlacement = vi.fn((r: number, c: number, value: number) => r === 0 && c === 2 && value === 2);

      renderBoard({
        notesGrid: {
          '0-2': { 2: 'player-2', 3: 'player-2' },
          '1-0': { 2: 'player-2' },
        },
        isErrorPlacement,
      });

      expect(isErrorPlacement).toHaveBeenCalledWith(0, 2, 2);
      expect(getVisibleNotes(0, 2)).toEqual(['3']);
      expect(getVisibleNotes(1, 0)).toEqual(['2']);
    });

    it('applies the real sudoku rules: same row, column and box hide the note, other cells keep it', () => {
      const playerGrid = Array.from({ length: 4 }, () => new Array(4).fill(0));
      playerGrid[0][0] = 2;
      const isErrorPlacement = (r: number, c: number, value: number) => {
        const grid = playerGrid.map((row) => [...row]);
        grid[r][c] = 0;
        return !isValid(grid, r, c, value, 4, 2);
      };
      const note = { 2: 'player-2' };

      renderBoard({
        playerGrid,
        notesGrid: { '0-3': note, '3-0': note, '1-1': note, '2-2': note },
        isErrorPlacement,
      });

      expect(getVisibleNotes(0, 3)).toEqual([]); // same row
      expect(getVisibleNotes(3, 0)).toEqual([]); // same column
      expect(getVisibleNotes(1, 1)).toEqual([]); // same box
      expect(getVisibleNotes(2, 2)).toEqual(['2']); // unrelated cell
    });

    it('shows a hidden note again when the clash goes away', () => {
      const notesGrid = { '0-2': { 2: 'player-2' } };
      const props = createProps({ notesGrid, isErrorPlacement: vi.fn(() => true) });
      const { rerender } = render(<SudokuBoardUI {...props} />);

      expect(getVisibleNotes(0, 2)).toEqual([]);

      rerender(<SudokuBoardUI {...props} isErrorPlacement={vi.fn(() => false)} />);

      expect(getVisibleNotes(0, 2)).toEqual(['2']);
    });
  });

  it('does not render the notes grid when no notes are present', () => {
    renderBoard();

    expect(getCell(0, 2).querySelector('div[style]')).toBeNull();
  });

  it('does not render notes inside cells that already contain a value', () => {
    renderBoard({
      notesGrid: {
        '0-1': { 3: 'player-2' },
      },
    });

    expect(getCell(0, 1)).toHaveTextContent('2');
    expect(getCell(0, 1).querySelector('div[style]')).toBeNull();
  });

  it('uses a deterministic color for the same player across multiple selections', () => {
    renderBoard({
      othersSelections: {
        'same-player': [0, 1],
        'same-player-copy': [1, 0],
      },
    });

    const firstCell = getCell(0, 1);
    const secondCell = getCell(1, 0);
    const ringColors = ['ring-blue-500', 'ring-green-500', 'ring-purple-500', 'ring-pink-500', 'ring-orange-500'];

    const firstColor = ringColors.find((color) => firstCell.classList.contains(color));
    const secondColor = ringColors.find((color) => secondCell.classList.contains(color));

    expect(firstColor).toBeDefined();
    expect(secondColor).toBeDefined();
    expect(firstColor).not.toBe(secondColor);
  });
});