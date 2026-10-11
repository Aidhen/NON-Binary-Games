import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SudokuCell } from './SudokuCell';

describe('SudokuCell', () => {
  it('renders the given value with the correct accessible label and classes', () => {
    render(<SudokuCell value={5} bgClass="bg-white" textClass="text-black" isRightBorder={false} isBottomBorder={false} onClick={vi.fn()} />);

    const cell = screen.getByRole('button', { name: 'Cell value 5' });

    expect(cell).toHaveTextContent('5');
    expect(cell).toHaveClass('bg-white', 'text-black');
    expect(cell).toHaveClass('border-r', 'border-r-[var(--grid-border-inner)]');
    expect(cell).toHaveClass('border-b', 'border-b-[var(--grid-border-inner)]');
  });

  it('fires onClick when the cell is clicked', () => {
    const handleClick = vi.fn();
    render(<SudokuCell value={0} bgClass="bg-white" textClass="text-black" isRightBorder={false} isBottomBorder={false} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Empty cell' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders an empty cell when the value is zero and no notes are provided', () => {
    render(<SudokuCell value={0} bgClass="bg-white" textClass="text-black" isRightBorder={false} isBottomBorder={false} onClick={vi.fn()} />);

    const cell = screen.getByRole('button', { name: 'Empty cell' });

    expect(cell).toBeEmptyDOMElement();
    expect(cell.querySelector('div[style]')).toBeNull();
  });

  it('renders the correct border classes when outer borders are enabled', () => {
    render(<SudokuCell value={5} bgClass="bg-white" textClass="text-black" isRightBorder={true} isBottomBorder={true} onClick={vi.fn()} />);

    const cell = screen.getByRole('button', { name: 'Cell value 5' });

    expect(cell).toHaveClass('border-r-2', 'border-r-[var(--grid-border-outer)]');
    expect(cell).toHaveClass('border-b-2', 'border-b-[var(--grid-border-outer)]');
  });

  it('renders notes with the correct colors and grid dimensions', () => {
    render(<SudokuCell value={0} bgClass="bg-white" textClass="text-black" isRightBorder={false} isBottomBorder={false} onClick={vi.fn()} notes={{ 2: 'text-red-500', 4: 'text-blue-500' }} boardSize={4} boxSize={2} />);

    const cell = screen.getByRole('button', { name: 'Empty cell' });
    const notesGrid = cell.querySelector<HTMLDivElement>('div[style]');

    expect(notesGrid).not.toBeNull();
    expect(notesGrid?.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(notesGrid?.style.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');

    const noteCells = Array.from(notesGrid?.children ?? []);

    expect(noteCells).toHaveLength(4);
    expect(noteCells[0]).toHaveClass('text-transparent');
    expect(noteCells[1]).toHaveTextContent('2');
    expect(noteCells[1]).toHaveClass('text-red-500');
    expect(noteCells[2]).toHaveClass('text-transparent');
    expect(noteCells[3]).toHaveTextContent('4');
    expect(noteCells[3]).toHaveClass('text-blue-500');
  });

  it('does not render notes when the cell already has a value', () => {
    render(<SudokuCell value={5} bgClass="bg-white" textClass="text-black" isRightBorder={false} isBottomBorder={false} onClick={vi.fn()} notes={{ 2: 'text-red-500' }} />);

    const cell = screen.getByRole('button', { name: 'Cell value 5' });

    expect(cell).toHaveTextContent('5');
    expect(cell.querySelector('div[style]')).toBeNull();
  });
});