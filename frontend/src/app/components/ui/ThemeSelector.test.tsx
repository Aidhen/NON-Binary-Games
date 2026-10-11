import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';

const { useThemeMock, setThemeMock } = vi.hoisted(() => ({
  useThemeMock: vi.fn(),
  setThemeMock: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: useThemeMock,
}));

const themes = ['light', 'dark', 'system'];

const renderSelector = () => render(<ThemeSelector />);

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
  it('renders the current theme', () => {
    renderSelector();

    const trigger = screen.getByRole('button', { name: /dark/ });

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('min-w-[110px]');
  });

  it('renders all available themes when opened', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /dark/ }));

    expect(screen.getByRole('button', { name: 'light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'system' })).toBeInTheDocument();
  });

  it('highlights the currently selected theme', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /dark/ }));

    expect(screen.getByRole('button', { name: 'dark' })).toHaveClass(
      'bg-[var(--numpad-background)]',
      'text-[var(--numpad-text)]',
    );
    expect(screen.getByRole('button', { name: 'light' })).toHaveClass(
      'text-[var(--subtitle-text)]',
    );
  });

  it('calls setTheme when another theme is selected', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /dark/ }));
    fireEvent.click(screen.getByRole('button', { name: 'light' }));

    expect(setThemeMock).toHaveBeenCalledOnce();
    expect(setThemeMock).toHaveBeenCalledWith('light');
    expect(screen.queryByRole('button', { name: 'light' })).not.toBeInTheDocument();
  });

  it('falls back to the system theme when no theme is selected', () => {
    useThemeMock.mockReturnValue({
      theme: undefined,
      setTheme: setThemeMock,
      themes,
    });

    renderSelector();

    expect(screen.getByRole('button', { name: /system/ })).toBeInTheDocument();
  });

  it('supports selecting the system theme', () => {
    renderSelector();

    fireEvent.click(screen.getByRole('button', { name: /dark/ }));
    fireEvent.click(screen.getByRole('button', { name: 'system' }));

    expect(setThemeMock).toHaveBeenCalledWith('system');
  });
});