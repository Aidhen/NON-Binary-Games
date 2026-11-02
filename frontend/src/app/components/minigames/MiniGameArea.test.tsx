import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MiniGameArea, MINI_GAME_STORAGE_KEY } from './MiniGameArea';
import type { MiniGame, MiniGameProps } from './types';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const Alpha = ({ onPlay }: MiniGameProps) => <button onClick={onPlay}>alpha game</button>;
const Beta = () => <p>beta game</p>;

const games: MiniGame[] = [
  { id: 'alpha', labelKey: 'games.alpha', Component: Alpha },
  { id: 'beta', labelKey: 'games.beta', Component: Beta },
];

beforeEach(() => {
  localStorage.clear();
});

describe('MiniGameArea', () => {
  it('loads the registered mini games on demand', async () => {
    render(<MiniGameArea />);

    expect(await screen.findByRole('button', { name: 'minigames.garden.water' })).toBeInTheDocument();
  });

  it('hides the picker when there is only one game', () => {
    render(<MiniGameArea games={[games[0]]} />);

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByText('alpha game')).toBeInTheDocument();
  });

  it('shows a picker with the first game selected by default', () => {
    render(<MiniGameArea games={games} />);

    expect(screen.getByRole('group', { name: 'minigames.pick' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'games.alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'games.beta' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('alpha game')).toBeInTheDocument();
  });

  it('switches game and remembers the choice', () => {
    render(<MiniGameArea games={games} />);

    fireEvent.click(screen.getByRole('button', { name: 'games.beta' }));

    expect(screen.getByText('beta game')).toBeInTheDocument();
    expect(screen.queryByText('alpha game')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'games.beta' })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(MINI_GAME_STORAGE_KEY)).toBe('beta');
  });

  it('restores the remembered game', () => {
    localStorage.setItem(MINI_GAME_STORAGE_KEY, 'beta');

    render(<MiniGameArea games={games} />);

    expect(screen.getByText('beta game')).toBeInTheDocument();
  });

  it('ignores a remembered game that does not exist anymore', () => {
    localStorage.setItem(MINI_GAME_STORAGE_KEY, 'removed-game');

    render(<MiniGameArea games={games} />);

    expect(screen.getByText('alpha game')).toBeInTheDocument();
  });

  it('forwards onPlay to the selected game', () => {
    const onPlay = vi.fn();
    render(<MiniGameArea games={games} onPlay={onPlay} />);

    fireEvent.click(screen.getByText('alpha game'));

    expect(onPlay).toHaveBeenCalledOnce();
  });
});
