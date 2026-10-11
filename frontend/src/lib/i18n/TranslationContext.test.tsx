import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider, useTranslation } from './TranslationContext';

function TranslationConsumer() {
  const { t, language, setLanguage } = useTranslation();
  const [missingTranslation, setMissingTranslation] = useState('');

  return (
    <div>
      <output data-testid="language">{language}</output>
      <output data-testid="translation">{t('sudoku.newGame')}</output>
      <output data-testid="missing-translation">{missingTranslation}</output>
      <button onClick={() => setLanguage(language === 'en' ? 'it' : 'en')}>Switch language</button>
      <button onClick={() => setMissingTranslation(t('missing.translation'))}>Lookup missing translation</button>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TranslationContext', () => {
  it('uses English as the default language', () => {
    render(<TranslationProvider><TranslationConsumer /></TranslationProvider>);

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('translation')).not.toHaveTextContent('sudoku.newGame');
  });

  it('switches languages and updates translated values', () => {
    render(<TranslationProvider><TranslationConsumer /></TranslationProvider>);

    const englishTranslation = screen.getByTestId('translation').textContent;

    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));

    expect(screen.getByTestId('language')).toHaveTextContent('it');
    expect(screen.getByTestId('translation').textContent).not.toBe(englishTranslation);

    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('translation').textContent).toBe(englishTranslation);
  });

  it('returns the key and warns when a translation is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<TranslationProvider><TranslationConsumer /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Lookup missing translation' }));

    expect(screen.getByTestId('missing-translation')).toHaveTextContent('missing.translation');
    expect(warn).toHaveBeenCalledWith('[i18n] Missing translation for key: missing.translation');
  });

  it('throws when useTranslation is used outside the provider', () => {
    expect(() => renderHook(() => useTranslation())).toThrow(
      'useTranslation must be used within a TranslationProvider',
    );
  });
});