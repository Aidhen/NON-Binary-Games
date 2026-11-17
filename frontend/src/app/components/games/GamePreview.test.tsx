import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GAME_IDS } from '@nbg/shared';
import { GamePreview } from './GamePreview';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const cellsOf = (preview: HTMLElement) => preview.querySelectorAll('button');

describe('GamePreview', () => {
  it.each(GAME_IDS)('draws the board of %s itself, as a square', (id) => {
    render(<GamePreview game={id} />);

    const cells = cellsOf(screen.getByTestId('game-preview')).length;
    expect(cells).toBeGreaterThan(0);
    expect(Math.sqrt(cells) % 1).toBe(0);
  });

  it.each(GAME_IDS)('is a picture of %s: it takes no clicks or focus, and screen readers skip it', (id) => {
    render(<GamePreview game={id} />);

    const preview = screen.getByTestId('game-preview');
    expect(preview).toHaveAttribute('inert');
    expect(preview).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the Sudoku with the lines between its nine boxes', () => {
    render(<GamePreview game="sudoku" />);

    const cells = [...cellsOf(screen.getByTestId('game-preview'))];
    expect(cells).toHaveLength(81);
    // Two lines down and two across, between the boxes.
    expect(screen.getByTestId('game-preview').querySelectorAll('[data-box-line]')).toHaveLength(4);
  });
});
