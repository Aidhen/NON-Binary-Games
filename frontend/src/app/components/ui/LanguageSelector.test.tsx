import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LanguageSelector } from './LanguageSelector';
import { TranslationProvider, useTranslation } from '@/lib/i18n/TranslationContext';

function LanguageConsumer() {
  const { language } = useTranslation();
  return <output data-testid="current-language">{language}</output>;
}

const renderSelector = () =>
  render(
    <TranslationProvider>
      <LanguageSelector />
      <LanguageConsumer />
    </TranslationProvider>,
  );

describe('LanguageSelector', () => {
  it('renders English as the default language', () => {
    renderSelector();

    expect(screen.getByRole('button', { name: /English/ })).toBeInTheDocument();
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
  });

  it('displays the supported languages when opened', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /English/ }));
    expect(screen.getByRole('button', { name: /Italiano/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /English/ })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /French/ })).not.toBeInTheDocument();
  });

  it('changes the application language to Italian', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /English/ }));
    fireEvent.click(screen.getByRole('button', { name: /Italiano/ }));

    expect(screen.getByTestId('current-language')).toHaveTextContent('it');
    expect(screen.getByRole('button', { name: /Italiano/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /English/ })).not.toBeInTheDocument();
  });

  it('allows switching back to English', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /English/ }));
    fireEvent.click(screen.getByRole('button', { name: /Italiano/ }));

    fireEvent.click(screen.getByRole('button', { name: /Italiano/ }));
    fireEvent.click(screen.getByRole('button', { name: /English/ }));

    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    expect(screen.getByRole('button', { name: /English/ })).toBeInTheDocument();
  });
});