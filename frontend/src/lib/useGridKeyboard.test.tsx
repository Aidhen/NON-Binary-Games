import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { moveOf, useGridKeyboard } from './useGridKeyboard';

describe('moveOf', () => {
  it('moves one cell with the arrows, and stays inside the grid at the edges', () => {
    expect(moveOf('ArrowRight', 1, 1, 4)).toEqual([1, 2]);
    expect(moveOf('ArrowDown', 1, 1, 4)).toEqual([2, 1]);
    expect(moveOf('ArrowUp', 0, 2, 4)).toEqual([0, 2]);
    expect(moveOf('ArrowLeft', 2, 0, 4)).toEqual([2, 0]);
    expect(moveOf('ArrowRight', 3, 3, 4)).toEqual([3, 3]);
    expect(moveOf('ArrowDown', 3, 3, 4)).toEqual([3, 3]);
  });

  it('goes to the ends of the row with Home and End, and ignores any other key', () => {
    expect(moveOf('Home', 2, 2, 4)).toEqual([2, 0]);
    expect(moveOf('End', 2, 1, 4)).toEqual([2, 3]);
    expect(moveOf('a', 2, 1, 4)).toBeNull();
    expect(moveOf('Enter', 2, 1, 4)).toBeNull();
  });
});

function Grid({ selected, onMove }: { selected: [number, number] | null; onMove: (r: number, c: number) => void }) {
  const keyboard = useGridKeyboard(3, selected, onMove);
  return (
    <div>
      {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <button key={`${r}-${c}`} type="button" {...keyboard(r, c)}>{`${r}-${c}`}</button>))}
    </div>
  );
}

describe('useGridKeyboard', () => {
  it('has one tab stop: the first cell, then the selected one', () => {
    const { rerender } = render(<Grid selected={null} onMove={vi.fn()} />);
    expect(screen.getAllByRole('button').filter((button) => button.tabIndex === 0).map((button) => button.textContent)).toEqual(['0-0']);

    rerender(<Grid selected={[2, 1]} onMove={vi.fn()} />);
    expect(screen.getAllByRole('button').filter((button) => button.tabIndex === 0).map((button) => button.textContent)).toEqual(['2-1']);
  });

  it('moves the selection and the focus with the arrows', () => {
    const onMove = vi.fn();
    render(<Grid selected={[1, 1]} onMove={onMove} />);

    fireEvent.keyDown(screen.getByText('1-1'), { key: 'ArrowRight' });

    expect(onMove).toHaveBeenCalledWith(1, 2);
    expect(screen.getByText('1-2')).toHaveFocus();
  });

  it('leaves the keys of the game, and shortcuts with a modifier, alone', () => {
    const onMove = vi.fn();
    render(<Grid selected={[1, 1]} onMove={onMove} />);

    fireEvent.keyDown(screen.getByText('1-1'), { key: '5' });
    fireEvent.keyDown(screen.getByText('1-1'), { key: 'ArrowRight', altKey: true });

    expect(onMove).not.toHaveBeenCalled();
  });
});
