import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GAME_IDS } from '@nbg/shared';
import { GamePreview } from './GamePreview';

describe('GamePreview', () => {
  it.each(GAME_IDS)('draws a square board for %s, with two players looking at it', (id) => {
    render(<GamePreview game={id} />);

    const board = screen.getByTestId('game-preview');
    const cells = board.children.length;
    expect(Math.sqrt(cells) % 1).toBe(0);
    expect(board.style.gridTemplateColumns).toContain(`repeat(${Math.sqrt(cells)},`);
    expect(board.querySelectorAll('.ring-inset')).toHaveLength(2);
  });

  it('is decoration: the rules say the same in words', () => {
    render(<GamePreview game="sudoku" />);

    expect(screen.getByTestId('game-preview')).toHaveAttribute('aria-hidden', 'true');
  });
});
