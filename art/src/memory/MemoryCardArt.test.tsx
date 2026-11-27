import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryCardArt, hasMemoryArt } from './MemoryCardArt';
import { MEMORY_BACK, MEMORY_FACES } from './drawings';

// Plain loops instead of it.each: until the drawings arrive the lists are empty, and a table with no rows is not a test.
const ALL = [...MEMORY_FACES, ...(MEMORY_BACK ? [MEMORY_BACK] : [])];

describe('the drawings of the Memory cards', () => {
  it('have a name of their own each, so that two faces never share a drawing by mistake', () => {
    const ids = ALL.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('are drawn on the same 300 by 400 card, so that every card takes the same room', () => {
    for (const { id, viewBox } of ALL) {
      expect(viewBox, id).toBe('0 0 300 400');
    }
  });
});

describe('MemoryCardArt', () => {
  it('draws every face that has a drawing at the size it is asked for', () => {
    MEMORY_FACES.forEach(({ id }, face) => {
      const { container, unmount } = render(<MemoryCardArt face={face} size={40} />);

      const drawing = container.querySelector('svg')!;
      expect(drawing).toHaveAttribute('data-memory-art', id);
      expect(drawing).toHaveAttribute('width', '40');
      expect(drawing).toHaveAttribute('height', '53');
      expect(drawing.childElementCount).toBeGreaterThan(0);
      unmount();
    });
  });

  it('keeps the 3:4 of the cards when it has no drawing yet', () => {
    const { container } = render(<MemoryCardArt face={MEMORY_FACES.length} size={60} />);

    expect(container.querySelector('svg')).toHaveAttribute('height', '80');
  });

  it('shows a numbered tile for a face that has no drawing yet', () => {
    const face = MEMORY_FACES.length;
    const { container } = render(<MemoryCardArt face={face} />);

    expect(hasMemoryArt(face)).toBe(false);
    expect(container.querySelector('svg')).toHaveAttribute('data-memory-placeholder', String(face));
    expect(container).toHaveTextContent(String(face + 1));
  });

  it('draws the back, or a plain tile with no number until it is drawn', () => {
    const { container } = render(<MemoryCardArt face="back" />);

    const drawing = container.querySelector('svg')!;
    if (MEMORY_BACK) {
      expect(drawing).toHaveAttribute('data-memory-art', MEMORY_BACK.id);
    } else {
      expect(hasMemoryArt('back')).toBe(false);
      expect(drawing.querySelector('text')).toBeNull();
    }
  });

  it('does not take a place outside the deck, or one that is not a whole number, for a drawing', () => {
    expect(hasMemoryArt(-1)).toBe(false);
    expect(hasMemoryArt(1.5)).toBe(false);
    expect(hasMemoryArt(Number.NaN)).toBe(false);
  });

  it('is decoration unless it is given a label', () => {
    const { container } = render(<MemoryCardArt face={0} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('is an image with a name when it is given a label', () => {
    render(<MemoryCardArt face={0} label="Lemon" />);

    expect(screen.getByRole('img', { name: 'Lemon' })).toBeInTheDocument();
  });
});
