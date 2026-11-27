import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';
import { TranslationProvider } from '@/lib/i18n/TranslationContext';

const { useThemeMock, setThemeMock } = vi.hoisted(() => ({
  useThemeMock: vi.fn(),
  setThemeMock: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: useThemeMock,
}));

const themes = ['light', 'dark', 'system'];

const renderSelector = () => render(<TranslationProvider><ThemeSelector /></TranslationProvider>);

beforeEach(() => {
  setThemeMock.mockReset();
  useThemeMock.mockReset();
  useThemeMock.mockReturnValue({
    theme: 'dark',
    setTheme: setThemeMock,
    themes,
  });
});

describe('ThemeSelector', () => {
  it('is named "Theme" and shows the names of the themes in the language of the page, not their ids', () => {
    renderSelector();

    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toHaveAttribute('aria-haspopup', 'true');
    expect(screen.queryByText('dark')).not.toBeInTheDocument();
  });

  it('shows the id of a theme the page has no name for', () => {
    useThemeMock.mockReturnValue({ theme: 'dark', setTheme: setThemeMock, themes: ['dark', 'sunset'] });
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));

    expect(screen.getByRole('button', { name: 'sunset' })).toBeInTheDocument();
  });

  it('renders the current theme', () => {
    renderSelector();

    const trigger = screen.getByRole('button', { name: /Dark/ });

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('min-w-[110px]');
  });

  it('renders all available themes when opened', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));

    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument();
  });

  it('highlights the currently selected theme', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveClass(
      'bg-[var(--accent)]',
      'text-[var(--accent-ink)]',
    );
    expect(screen.getByRole('button', { name: 'Light' })).toHaveClass(
      'text-[var(--subtitle-text)]',
    );
  });

  it('calls setTheme when another theme is selected', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));

    expect(setThemeMock).toHaveBeenCalledOnce();
    expect(setThemeMock).toHaveBeenCalledWith('light');
    expect(screen.queryByRole('button', { name: 'Light' })).not.toBeInTheDocument();
  });

  it('falls back to the system theme when no theme is selected', () => {
    useThemeMock.mockReturnValue({
      theme: undefined,
      setTheme: setThemeMock,
      themes,
    });

    renderSelector();

    expect(screen.getByRole('button', { name: /System/ })).toBeInTheDocument();
  });

  it('supports selecting the system theme', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));
    fireEvent.click(screen.getByRole('button', { name: 'System' }));

    expect(setThemeMock).toHaveBeenCalledWith('system');
  });
});