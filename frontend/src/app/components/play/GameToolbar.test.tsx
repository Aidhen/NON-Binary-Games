import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameToolbar } from './GameToolbar';

vi.mock('@/lib/i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('GameToolbar', () => {
  it('says the level being played', () => {
    render(<GameToolbar difficulty="hard" isSettingsOpen={false} onToggleSettings={() => {}} />);

    expect(screen.getByText('sudoku.mode: sudoku.hard')).toBeInTheDocument();
  });

  it('shows the level as a plain label: the settings are the only button', () => {
    render(<GameToolbar difficulty="hard" isSettingsOpen={false} onToggleSettings={() => {}} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByText('sudoku.mode: sudoku.hard').closest('button')).toBeNull();
  });

  it('names the button after what it does next, and tells whether the settings are open', () => {
    const { rerender } = render(<GameToolbar difficulty="easy" isSettingsOpen={false} onToggleSettings={() => {}} />);
    expect(screen.getByRole('button', { name: 'sudoku.settings' })).toHaveAttribute('aria-expanded', 'false');

    rerender(<GameToolbar difficulty="easy" isSettingsOpen onToggleSettings={() => {}} />);
    expect(screen.getByRole('button', { name: 'sudoku.closeSettings' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('tells when the button is clicked', () => {
    const onToggleSettings = vi.fn();
    render(<GameToolbar difficulty="easy" isSettingsOpen={false} onToggleSettings={onToggleSettings} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onToggleSettings).toHaveBeenCalledOnce();
  });
});
