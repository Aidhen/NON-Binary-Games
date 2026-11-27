import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsMenu } from './SettingsMenu';

vi.mock('@/lib/i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../ui/ThemeSelector', () => ({ ThemeSelector: () => <div data-testid="theme-selector" /> }));
vi.mock('../ui/LanguageSelector', () => ({ LanguageSelector: () => <div data-testid="language-selector" /> }));

const getButton = () => screen.getByRole('button', { name: 'settings.label' });

describe('SettingsMenu', () => {
  it('keeps theme and language closed behind one button', () => {
    render(<SettingsMenu />);

    expect(getButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('theme-selector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('language-selector')).not.toBeInTheDocument();
  });

  it('opens a panel with both choices, and closes it with the button again', () => {
    render(<SettingsMenu />);

    fireEvent.click(getButton());
    expect(getButton()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();

    fireEvent.click(getButton());
    expect(screen.queryByTestId('theme-selector')).not.toBeInTheDocument();
  });

  it('closes on Escape and gives the focus back to the button', () => {
    render(<SettingsMenu />);

    fireEvent.click(getButton());
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByTestId('theme-selector')).not.toBeInTheDocument();
    expect(getButton()).toHaveFocus();
  });

  it('stays open when the Escape was already taken by a dropdown inside it', () => {
    render(<SettingsMenu />);
    // What an open Dropdown does with Escape: it takes it in the capture phase and marks it as handled.
    const takeEscape = (event: KeyboardEvent) => event.preventDefault();
    document.addEventListener('keydown', takeEscape, true);

    fireEvent.click(getButton());
    fireEvent.keyDown(document, { key: 'Escape' });
    document.removeEventListener('keydown', takeEscape, true);

    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
  });

  it('closes when the player taps outside, and not when they tap inside', () => {
    render(<SettingsMenu />);

    fireEvent.click(getButton());
    fireEvent.mouseDown(screen.getByTestId('theme-selector'));
    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('theme-selector')).not.toBeInTheDocument();
  });
});
