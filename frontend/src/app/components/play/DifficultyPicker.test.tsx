import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DIFFICULTIES } from '@nbg/shared';
import { DifficultyPicker } from './DifficultyPicker';

vi.mock('@/lib/i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('DifficultyPicker', () => {
  it('shows a button for every level, under the title of a new game', () => {
    render(<DifficultyPicker currentDifficulty="easy" onDifficultyChange={() => {}} />);

    expect(screen.getByText('sudoku.newGame')).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(DIFFICULTIES.map((level) => `sudoku.${level}`));
  });

  it('writes the labels a game gives to the levels, and still reports the level that is picked', () => {
    const onDifficultyChange = vi.fn();
    render(<DifficultyPicker currentDifficulty="easy" onDifficultyChange={onDifficultyChange} labelOf={(level) => `label ${level}`} />);

    fireEvent.click(screen.getByRole('button', { name: 'label hard' }));

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(DIFFICULTIES.map((level) => `label ${level}`));
    expect(onDifficultyChange).toHaveBeenCalledWith('hard');
  });

  it('marks the current level, and only that one', () => {
    render(<DifficultyPicker currentDifficulty="medium" onDifficultyChange={() => {}} />);

    for (const level of DIFFICULTIES) {
      expect(screen.getByRole('button', { name: `sudoku.${level}` })).toHaveAttribute('aria-pressed', String(level === 'medium'));
    }
    expect(screen.getByRole('button', { name: 'sudoku.medium' }).className).toContain('bg-[var(--number-player)]');
    expect(screen.getByRole('button', { name: 'sudoku.easy' }).className).toContain('bg-[var(--numpad-background)]');
  });

  it('gives the first two levels, which have the longer names, half of the row each', () => {
    render(<DifficultyPicker currentDifficulty="easy" onDifficultyChange={() => {}} />);

    const spans = screen.getAllByRole('button').map((button) => (button.className.includes('col-span-3') ? 3 : 2));
    expect(spans).toEqual([3, 3, 2, 2, 2]);
  });

  it.each(DIFFICULTIES)('asks for the %s level when it is picked', (level) => {
    const onDifficultyChange = vi.fn();
    render(<DifficultyPicker currentDifficulty="easy" onDifficultyChange={onDifficultyChange} />);

    fireEvent.click(screen.getByRole('button', { name: `sudoku.${level}` }));

    expect(onDifficultyChange).toHaveBeenCalledExactlyOnceWith(level);
  });
});
