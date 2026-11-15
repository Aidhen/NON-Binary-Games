import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WordSearchSettingsPanel } from './WordSearchSettingsPanel';

vi.mock('@/lib/i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const setup = () => {
  const onDifficultyChange = vi.fn();
  const onLanguageChange = vi.fn();
  render(<WordSearchSettingsPanel currentDifficulty="easy" onDifficultyChange={onDifficultyChange} currentLanguage="en" onLanguageChange={onLanguageChange} />);
  return { onDifficultyChange, onLanguageChange };
};

describe('WordSearchSettingsPanel', () => {
  it('names each language in itself, says it is the one of the words, and marks the current one', () => {
    setup();

    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Italiano' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Italiano' })).toHaveAttribute('lang', 'it');
    expect(screen.getByText('wordSearch.languageHint')).toBeInTheDocument();
  });

  it('asks for the language that is picked', () => {
    const { onLanguageChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Italiano' }));

    expect(onLanguageChange).toHaveBeenCalledWith('it');
  });

  it('asks for the level that is picked', () => {
    const { onDifficultyChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'sudoku.hard' }));

    expect(onDifficultyChange).toHaveBeenCalledWith('hard');
  });
});
