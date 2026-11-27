import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameOverCard } from './GameOverCard';

vi.mock('@/lib/i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('GameOverCard', () => {
  it('says how the game went, with the title as a heading', () => {
    render(<GameOverCard title="Cleared" message="Well played" onPlayAgain={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Cleared' })).toBeInTheDocument();
    expect(screen.getByText('Well played')).toBeInTheDocument();
  });

  it('asks for another game when the button is clicked', () => {
    const onPlayAgain = vi.fn();
    render(<GameOverCard title="Cleared" message="Well played" onPlayAgain={onPlayAgain} />);

    fireEvent.click(screen.getByRole('button', { name: 'sudoku.playAgain' }));

    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it('covers the board by default, and is a block of the page when the board has to stay in view', () => {
    const { container, rerender } = render(<GameOverCard title="Cleared" message="Well played" onPlayAgain={() => {}} />);
    expect(container.firstElementChild).toHaveClass('absolute', 'inset-0');

    rerender(<GameOverCard title="Cleared" message="Well played" onPlayAgain={() => {}} overlay={false} />);
    expect(container.firstElementChild).not.toHaveClass('absolute');
    expect(screen.getByRole('heading', { name: 'Cleared' })).toBeInTheDocument();
  });

  it('shows the logo above the title, as decoration', () => {
    const { container } = render(<GameOverCard title="Cleared" message="Well played" onPlayAgain={() => {}} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('offers to go back to the table next to playing again, when the page can cast that vote', () => {
    const onBackToTable = vi.fn();
    render(<GameOverCard title="Cleared" message="Well played" onPlayAgain={() => {}} onBackToTable={onBackToTable} />);

    fireEvent.click(screen.getByRole('button', { name: 'lobby.backToTable' }));

    expect(onBackToTable).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'sudoku.playAgain' })).toBeInTheDocument();
  });

  it('has no way back to the table when the page gives none', () => {
    render(<GameOverCard title="Cleared" message="Well played" onPlayAgain={() => {}} />);

    expect(screen.queryByRole('button', { name: 'lobby.backToTable' })).not.toBeInTheDocument();
  });
});
