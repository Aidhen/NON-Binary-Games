import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
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
    expect(screen.getByRole('button', { name: 'sudoku.easy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sudoku.medium' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sudoku.hard' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightCrosshairs' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightSame' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'sudoku.showErrors' })).toBeInTheDocument();
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

  it.each(['easy', 'medium', 'hard'] as const)(
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
      },
    });

    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightCrosshairs' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'sudoku.highlightSame' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'sudoku.showErrors' })).not.toBeChecked();
  });

  it.each([
    ['sudoku.highlightCrosshairs', 'highlightCrosshairs'],
    ['sudoku.highlightSame', 'highlightSameNumbers'],
    ['sudoku.showErrors', 'showErrors'],
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