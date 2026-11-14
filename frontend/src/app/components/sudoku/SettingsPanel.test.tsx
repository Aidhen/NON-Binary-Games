import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { DIFFICULTIES } from '@nbg/shared';
import type { DifficultyLevel } from '@nbg/shared';
import { SettingsPanel } from './SettingsPanel';
import type { GameSettings } from './SudokuContainer';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const defaultSettings: GameSettings = {
  highlightCrosshairs: true,
  highlightSameNumbers: true,
  showErrors: true,
  godMode: false,
};

const createProps = (overrides: Partial<ComponentProps<typeof SettingsPanel>> = {}) => ({
  settings: { ...defaultSettings },
  onToggle: vi.fn(),
  currentDifficulty: 'easy' as DifficultyLevel,
  onDifficultyChange: vi.fn(),
  ...overrides,
});

const renderPanel = (overrides: Partial<ComponentProps<typeof SettingsPanel>> = {}) => {
  const props = createProps(overrides);
  return { ...render(<SettingsPanel {...props} />), props };
};

describe('SettingsPanel', () => {
  it('renders the difficulty and visual helper sections', () => {
    renderPanel();

    expect(screen.getByText('sudoku.newGame')).toBeInTheDocument();
    expect(screen.getByText('sudoku.visualHelpers')).toBeInTheDocument();
    for (const level of DIFFICULTIES) {
      expect(screen.getByRole('button', { name: `sudoku.${level}` })).toBeInTheDocument();
    }
    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightCrosshairs' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightSame' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'sudoku.showErrors' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'sudoku.godMode' })).toBeInTheDocument();
  });

  it('marks the current difficulty as active', () => {
    renderPanel({ currentDifficulty: 'medium' });

    expect(screen.getByRole('button', { name: 'sudoku.medium' })).toHaveClass(
      'bg-[var(--number-player)]',
      'text-[var(--cell-background)]',
    );
    expect(screen.getByRole('button', { name: 'sudoku.easy' })).toHaveClass(
      'bg-[var(--numpad-background)]',
      'text-[var(--numpad-text)]',
    );
    expect(screen.getByRole('button', { name: 'sudoku.hard' })).toHaveClass(
      'bg-[var(--numpad-background)]',
      'text-[var(--numpad-text)]',
    );
  });

  it('offers the levels from the gentlest to the hardest, one button each', () => {
    renderPanel();

    const buttons = screen.getAllByRole('button').slice(0, DIFFICULTIES.length);

    expect(buttons.map((button) => button.textContent)).toEqual(DIFFICULTIES.map((level) => `sudoku.${level}`));
    expect(screen.getAllByRole('button')).toHaveLength(DIFFICULTIES.length);
  });

  it('marks only the current level as active, whichever it is', () => {
    for (const current of DIFFICULTIES) {
      const { unmount } = renderPanel({ currentDifficulty: current });

      for (const level of DIFFICULTIES) {
        const button = screen.getByRole('button', { name: `sudoku.${level}` });
        if (level === current) expect(button).toHaveClass('bg-[var(--number-player)]');
        else expect(button).not.toHaveClass('bg-[var(--number-player)]');
      }
      unmount();
    }
  });

  it('puts the five levels on two rows: three on the first, two wider on the second', () => {
    renderPanel();

    const spans = DIFFICULTIES.map((level) => /col-span-(\d)/.exec(screen.getByRole('button', { name: `sudoku.${level}` }).className)?.[1]);

    expect(spans).toEqual(['2', '2', '2', '3', '3']);
  });

  it.each(DIFFICULTIES)(
    'calls onDifficultyChange with %s when that difficulty is selected',
    (difficulty) => {
      const onDifficultyChange = vi.fn();
      renderPanel({ onDifficultyChange });

      fireEvent.click(screen.getByRole('button', { name: `sudoku.${difficulty}` }));

      expect(onDifficultyChange).toHaveBeenCalledOnce();
      expect(onDifficultyChange).toHaveBeenCalledWith(difficulty);
    },
  );

  it('reflects the supplied settings in the checkbox states', () => {
    renderPanel({
      settings: {
        highlightCrosshairs: true,
        highlightSameNumbers: false,
        showErrors: false,
        godMode: true,
      },
    });

    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightCrosshairs' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightSame' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'sudoku.showErrors' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'sudoku.godMode' })).toBeChecked();
  });

  it.each([
    ['sudoku.highlightCrosshairs', 'highlightCrosshairs'],
    ['sudoku.highlightSame', 'highlightSameNumbers'],
    ['sudoku.showErrors', 'showErrors'],
    ['sudoku.godMode', 'godMode'],
  ] as const)(
    'calls onToggle with %s when its checkbox changes',
    (label, setting) => {
      const onToggle = vi.fn();
      renderPanel({ onToggle });

      fireEvent.click(screen.getByRole('checkbox', { name: label }));

      expect(onToggle).toHaveBeenCalledOnce();
      expect(onToggle).toHaveBeenCalledWith(setting);
    },
  );
});