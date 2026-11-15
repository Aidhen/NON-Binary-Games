import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { WordSearchBoardUI, snapLine } from './WordSearchBoardUI';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'wordSearch.cell': '{letter} R{row} C{column}',
      'wordSearch.cellStart': '{letter} R{row} C{column} start',
      'wordSearch.cellFound': '{letter} R{row} C{column} found',
      'wordSearch.cellHidden': '{letter} R{row} C{column} hidden',
      'wordSearch.grid': 'grid',
    })[key] ?? key,
  }),
}));

// 5x5, one letter per cell: the letter says the row and the column (A1 is row 1 column 1).
const size = 5;
const grid = Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => String.fromCodePoint(65 + r * size + c)));
const CELL = 10;

const profiles: Record<string, PlayerProfile> = { friend: { alias: 'friend', animal: 'fox', color: 'teal' } };

const setup = (props: Record<string, unknown> = {}) => {
  const onSelect = vi.fn();
  render(<WordSearchBoardUI size={size} grid={grid} found={[]} isOver={false} onSelect={onSelect} {...props} />);
  return onSelect;
};

const cell = (r: number, c: number) => screen.getByRole('button', { name: new RegExp(`^${grid[r][c]} R${r + 1} C${c + 1}`) });
// The middle of a cell, in the coordinates of the page: the grid is 50 by 50 at the corner.
const at = (r: number, c: number) => ({ clientX: c * CELL + CELL / 2, clientY: r * CELL + CELL / 2, button: 0, pointerId: 1 });
const drag = (from: [number, number], ...path: [number, number][]) => {
  fireEvent.pointerDown(cell(...from), at(...from));
  for (const point of path) fireEvent.pointerMove(cell(...point), at(...point));
  const end = path.at(-1) ?? from;
  fireEvent.pointerUp(cell(...end), at(...end));
};

beforeEach(() => {
  // jsdom has no layout: the grid is given a size so that a position is a cell.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: size * CELL, bottom: size * CELL, width: size * CELL, height: size * CELL, x: 0, y: 0, toJSON: () => ({}) });
});
afterEach(() => { vi.restoreAllMocks(); });

describe('snapLine', () => {
  const from = { r: 2, c: 2 };

  it.each([
    [{ r: 2, c: 4 }, { r: 2, c: 4 }, 'right'],
    [{ r: 2, c: 0 }, { r: 2, c: 0 }, 'left, backwards'],
    [{ r: 0, c: 2 }, { r: 0, c: 2 }, 'up'],
    [{ r: 4, c: 2 }, { r: 4, c: 2 }, 'down'],
    [{ r: 4, c: 4 }, { r: 4, c: 4 }, 'down right'],
    [{ r: 0, c: 0 }, { r: 0, c: 0 }, 'up left, backwards'],
    [{ r: 0, c: 4 }, { r: 0, c: 4 }, 'up right'],
    [{ r: 4, c: 0 }, { r: 4, c: 0 }, 'down left'],
  ])('keeps a pointer that is already on a line: %j', (pointer, expected) => {
    expect(snapLine(from, pointer, size)).toEqual(expected);
  });

  it('snaps a pointer that is off a line to the nearest of the eight directions', () => {
    // One row down and three columns right is closer to the row than to the diagonal.
    expect(snapLine({ r: 1, c: 0 }, { r: 2, c: 3 }, size)).toEqual({ r: 1, c: 3 });
    // Three rows down and one column right is closer to the column.
    expect(snapLine({ r: 1, c: 2 }, { r: 4, c: 3 }, size)).toEqual({ r: 4, c: 2 });
    // Two rows and one column is closer to the diagonal than to the column, and it reaches as far as the pointer does.
    expect(snapLine({ r: 0, c: 0 }, { r: 2, c: 1 }, size)).toEqual({ r: 2, c: 2 });
  });

  it('stays inside the grid', () => {
    expect(snapLine({ r: 0, c: 0 }, { r: 9, c: 9 }, size)).toEqual({ r: 4, c: 4 });
    expect(snapLine({ r: 0, c: 3 }, { r: 9, c: 9 }, size)).toEqual({ r: 1, c: 4 });
  });

  it('is the start itself while the pointer is over it', () => {
    expect(snapLine(from, from, size)).toEqual(from);
  });
});

describe('WordSearchBoardUI', () => {
  it('draws one button for each cell, with its letter, row and column', () => {
    setup();

    expect(screen.getAllByRole('button')).toHaveLength(25);
    expect(cell(1, 2)).toHaveTextContent('H');
    expect(screen.getByRole('group', { name: 'grid' })).toBeInTheDocument();
  });

  it('stops the browser from scrolling the page under a drag', () => {
    setup();

    expect(screen.getByRole('group').className).toContain('touch-none');
  });

  describe('dragging', () => {
    it('sends the first and the last cell of a row', () => {
      const onSelect = setup();

      drag([1, 0], [1, 2], [1, 3]);

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({ r: 1, c: 0 }, { r: 1, c: 3 });
    });

    it('sends a diagonal', () => {
      const onSelect = setup();

      drag([0, 0], [2, 2]);

      expect(onSelect).toHaveBeenCalledWith({ r: 0, c: 0 }, { r: 2, c: 2 });
    });

    it('sends a line backwards, from the last letter to the first', () => {
      const onSelect = setup();

      drag([4, 4], [3, 3], [1, 1]);

      expect(onSelect).toHaveBeenCalledWith({ r: 4, c: 4 }, { r: 1, c: 1 });
    });

    it('sends a line going up and to the left on a row', () => {
      const onSelect = setup();

      drag([2, 4], [2, 1]);

      expect(onSelect).toHaveBeenCalledWith({ r: 2, c: 4 }, { r: 2, c: 1 });
    });

    it('snaps a finger that is not on a line to the nearest one, and sends that line', () => {
      const onSelect = setup();

      // Three columns across and one row down: the closest line is the row.
      drag([2, 0], [3, 3]);

      expect(onSelect).toHaveBeenCalledWith({ r: 2, c: 0 }, { r: 2, c: 3 });
    });

    it('sends nothing for a single cell', () => {
      const onSelect = setup();

      drag([2, 2]);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('sends nothing for a drag that comes back to where it started', () => {
      const onSelect = setup();

      drag([2, 2], [2, 4], [2, 2]);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('sends nothing when the pointer is released outside the grid, and does not keep the line for later', () => {
      const onSelect = setup();

      fireEvent.pointerDown(cell(0, 0), at(0, 0));
      fireEvent.pointerMove(cell(0, 2), at(0, 2));
      fireEvent.pointerLeave(screen.getByRole('group'));
      fireEvent.pointerUp(cell(0, 2), at(0, 2));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('sends nothing when the pointer is cancelled, for example when the browser takes the touch', () => {
      const onSelect = setup();

      fireEvent.pointerDown(cell(0, 0), at(0, 0));
      fireEvent.pointerMove(cell(0, 2), at(0, 2));
      fireEvent.pointerCancel(cell(0, 2), at(0, 2));
      fireEvent.pointerUp(cell(0, 2), at(0, 2));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores a pointer that moves without being pressed', () => {
      const onSelect = setup();

      fireEvent.pointerMove(cell(0, 2), at(0, 2));
      fireEvent.pointerUp(cell(0, 2), at(0, 2));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('shows the line while it is dragged, from the start to the nearest straight end', () => {
      setup();

      fireEvent.pointerDown(cell(0, 0), at(0, 0));
      fireEvent.pointerMove(cell(1, 3), at(1, 3));

      // Not a diagonal: the row is closer. The cells of the line have the selected background.
      for (const c of [0, 1, 2, 3]) expect(cell(0, c).className).toContain('cell-background-selected');
      expect(cell(1, 3).className).not.toContain('cell-background-selected');
    });

    it('is not taken as the first tap of the two-tap way when the pointer ends a click on the first cell', () => {
      const onSelect = setup();

      drag([0, 0], [0, 2]);
      // A pointer that ends a drag on a button ends in a click on it.
      fireEvent.click(cell(0, 2), { detail: 1 });
      fireEvent.click(cell(2, 2));

      expect(onSelect).toHaveBeenCalledOnce();
    });

    it('takes no selection once the game is over', () => {
      const onSelect = setup({ isOver: true });

      drag([0, 0], [0, 2]);

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('two taps', () => {
    it('sends the line from the first cell tapped to the second', () => {
      const onSelect = setup();

      fireEvent.click(cell(1, 1));
      expect(onSelect).not.toHaveBeenCalled();
      fireEvent.click(cell(3, 3));

      expect(onSelect).toHaveBeenCalledWith({ r: 1, c: 1 }, { r: 3, c: 3 });
    });

    it('says which cell is the first one, and marks it for the screen reader', () => {
      setup();

      fireEvent.click(cell(1, 1));

      expect(screen.getByRole('button', { name: 'G R2 C2 start' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('cancels when the first cell is tapped again, and the next tap is a first tap again', () => {
      const onSelect = setup();

      fireEvent.click(cell(1, 1));
      fireEvent.click(cell(1, 1));
      expect(cell(1, 1)).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(cell(1, 3));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('takes a second tap that is not on a line as a new first tap', () => {
      const onSelect = setup();

      fireEvent.click(cell(0, 0));
      fireEvent.click(cell(1, 2));
      expect(onSelect).not.toHaveBeenCalled();
      fireEvent.click(cell(1, 4));

      expect(onSelect).toHaveBeenCalledWith({ r: 1, c: 2 }, { r: 1, c: 4 });
    });

    it('starts again after a line is sent', () => {
      const onSelect = setup();

      fireEvent.click(cell(0, 0));
      fireEvent.click(cell(0, 2));
      fireEvent.click(cell(3, 0));

      expect(onSelect).toHaveBeenCalledOnce();
      expect(cell(3, 0)).toHaveAttribute('aria-pressed', 'true');
    });

    it('takes no tap once the game is over', () => {
      const onSelect = setup({ isOver: true });

      fireEvent.click(cell(0, 0));
      fireEvent.click(cell(0, 2));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('keyboard', () => {
    it('has one cell in the tab order, and the arrows move the focus to the next one', () => {
      setup();

      expect(screen.getAllByRole('button').filter((button) => button.tabIndex === 0)).toEqual([cell(0, 0)]);

      act(() => cell(0, 0).focus());
      fireEvent.keyDown(cell(0, 0), { key: 'ArrowRight' });
      expect(cell(0, 1)).toHaveFocus();
      fireEvent.keyDown(cell(0, 1), { key: 'ArrowDown' });
      expect(cell(1, 1)).toHaveFocus();
      fireEvent.keyDown(cell(1, 1), { key: 'ArrowLeft' });
      fireEvent.keyDown(cell(1, 0), { key: 'ArrowUp' });
      expect(cell(0, 0)).toHaveFocus();
      expect(cell(0, 0).tabIndex).toBe(0);
      expect(cell(0, 1).tabIndex).toBe(-1);
    });

    it('stops at the edge of the grid', () => {
      setup();

      act(() => cell(0, 0).focus());
      fireEvent.keyDown(cell(0, 0), { key: 'ArrowUp' });
      fireEvent.keyDown(cell(0, 0), { key: 'ArrowLeft' });

      expect(cell(0, 0)).toHaveFocus();
    });

    it('marks the first and the last letter on the cell the focus is on: Enter and Space click a button', () => {
      const onSelect = setup();

      act(() => cell(0, 0).focus());
      fireEvent.click(document.activeElement as HTMLElement);
      fireEvent.keyDown(cell(0, 0), { key: 'ArrowRight' });
      fireEvent.keyDown(cell(0, 1), { key: 'ArrowRight' });
      fireEvent.click(document.activeElement as HTMLElement);

      expect(onSelect).toHaveBeenCalledWith({ r: 0, c: 0 }, { r: 0, c: 2 });
    });

    it('shows the line from the first letter to the one the focus is on', () => {
      setup();

      fireEvent.click(cell(0, 0));
      act(() => cell(2, 2).focus());

      for (const i of [0, 1, 2]) expect(cell(i, i).className).toContain('cell-background-selected');
    });

    it('cancels with Escape', () => {
      const onSelect = setup();

      fireEvent.click(cell(0, 0));
      fireEvent.keyDown(cell(0, 0), { key: 'Escape' });
      expect(cell(0, 0)).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(cell(0, 2));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('found words', () => {
    const found = [{ word: 'ABC', alias: 'friend', from: { r: 0, c: 0 }, to: { r: 0, c: 2 } }];

    it('draws every cell of a word in the color of who found it, and only those', () => {
      setup({ found, profiles });

      for (const c of [0, 1, 2]) {
        expect(cell(0, c).className).toContain('--player-teal-text');
        expect(cell(0, c).querySelector('span[aria-hidden]')?.className).toContain('--player-teal');
      }
      expect(cell(0, 3).querySelector('span[aria-hidden]')).toBeNull();
      expect(cell(1, 0).querySelector('span[aria-hidden]')).toBeNull();
    });

    it('draws a diagonal word too, and a word backwards', () => {
      setup({ found: [{ word: 'XYZ', alias: 'friend', from: { r: 3, c: 3 }, to: { r: 1, c: 1 } }], profiles });

      for (const i of [1, 2, 3]) expect(cell(i, i).querySelector('span[aria-hidden]')).not.toBeNull();
      expect(cell(0, 0).querySelector('span[aria-hidden]')).toBeNull();
    });

    it('says in the label that a cell is part of a word found', () => {
      setup({ found, profiles });

      expect(screen.getByRole('button', { name: 'A R1 C1 found' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'D R1 C4' })).toBeInTheDocument();
    });

    it('shows a cell where two words cross in both colors', () => {
      const other = { word: 'AFK', alias: 'me', from: { r: 0, c: 0 }, to: { r: 2, c: 2 } };
      setup({ found: [found[0], other], profiles: { ...profiles, me: { alias: 'me', animal: 'owl', color: 'pink' } } });

      expect(cell(0, 0).querySelectorAll('span[aria-hidden]')).toHaveLength(2);
    });

    it('draws a word of a player the page does not know in the color of the theme, and takes no name from the prototype', () => {
      setup({ found: [{ ...found[0], alias: 'constructor' }], profiles: {} });

      expect(cell(0, 0).className).toContain('--number-player');
    });

    it('draws nothing for a line that is not straight or leaves the grid', () => {
      setup({ found: [{ word: 'BAD', alias: 'friend', from: { r: 0, c: 0 }, to: { r: 1, c: 3 } }, { word: 'OUT', alias: 'friend', from: { r: 3, c: 3 }, to: { r: 9, c: 9 } }], profiles });

      expect(document.querySelectorAll('span[aria-hidden]')).toHaveLength(0);
    });
  });
});

describe('hidden cells', () => {
  it('marks the cells it is given, and only those, in the label and not by color alone', () => {
    setup({ hiddenCells: [{ r: 1, c: 1 }, { r: 3, c: 4 }] });

    expect(screen.getByRole('button', { name: 'G R2 C2 hidden' }).className).toContain('underline');
    expect(screen.getByRole('button', { name: 'T R4 C5 hidden' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /hidden$/ })).toHaveLength(2);
    expect(cell(0, 0).className).not.toContain('underline');
  });

  it('marks nothing when it is given no cells', () => {
    setup();

    expect(screen.queryAllByRole('button', { name: /hidden$/ })).toHaveLength(0);
  });

  it('keeps a cell that a found word crosses as part of that word when it is not hidden', () => {
    setup({ hiddenCells: [{ r: 4, c: 4 }], found: [{ word: 'ABC', alias: 'friend', from: { r: 0, c: 0 }, to: { r: 0, c: 2 } }], profiles });

    expect(cell(0, 1)).toHaveAccessibleName('B R1 C2 found');
    expect(screen.getAllByRole('button', { name: /hidden$/ })).toHaveLength(1);
  });
});

