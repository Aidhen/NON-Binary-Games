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
});
