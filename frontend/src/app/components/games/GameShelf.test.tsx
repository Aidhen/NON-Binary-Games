import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GAME_IDS } from '@nbg/shared';
import { en } from '@/locales/en';
import { it as italian } from '@/locales/it';
import { GameShelf } from './GameShelf';
import { GAME_GUIDES } from './guides';
import { GAMES } from './registry';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const titleOf = (id: string) => GAMES.find((game) => game.id === id)!.titleKey;
const boxOf = (id: string) => screen.getByRole('button', { name: new RegExp(titleOf(id).replaceAll('.', '\\.')) });

// Walks a dictionary along a key like the page does, and gives back what it finds.
const lookUp = (dictionary: unknown, key: string) => key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], dictionary);

describe('the guides of the games', () => {
  it.each(GAME_IDS)('%s has every sentence of its guide, in both languages', (id) => {
    const { taglineKey, descriptionKey, ruleKeys } = GAME_GUIDES[id];
    for (const key of [taglineKey, descriptionKey, ...ruleKeys]) {
      expect(lookUp(en, key), `${key} in English`).toEqual(expect.any(String));
      expect(lookUp(italian, key), `${key} in Italian`).toEqual(expect.any(String));
    }
    expect(ruleKeys.length).toBeGreaterThan(0);
  });
});

describe('GameShelf', () => {
  it('shows one box per game that can be played, all closed at first', () => {
    render(<GameShelf />);

    for (const id of GAME_IDS) {
      expect(boxOf(id)).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.getAllByRole('button')).toHaveLength(GAME_IDS.length);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it.each(GAME_IDS)('opens the guide of %s under the boxes: its rules and a preview', (id) => {
    render(<GameShelf />);

    fireEvent.click(boxOf(id));

    expect(boxOf(id)).toHaveAttribute('aria-expanded', 'true');
    const guide = screen.getByRole('article');
    expect(guide).toHaveAccessibleName(titleOf(id));
    expect(document.getElementById(boxOf(id).getAttribute('aria-controls')!)).toContainElement(guide);
    for (const key of GAME_GUIDES[id].ruleKeys) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
    expect(screen.getByTestId('game-preview')).toBeInTheDocument();
  });

  it('shows one guide at a time', () => {
    render(<GameShelf />);

    fireEvent.click(boxOf('sudoku'));
    fireEvent.click(boxOf('takuzu'));

    expect(boxOf('sudoku')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article')).toHaveAccessibleName(titleOf('takuzu'));
  });

  it('closes the guide when its box is picked again', () => {
    render(<GameShelf />);

    fireEvent.click(boxOf('sudoku'));
    fireEvent.click(boxOf('sudoku'));

    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('opens no room: a guide is only there to be read', () => {
    render(<GameShelf />);

    fireEvent.click(boxOf('sudoku'));

    expect(screen.getAllByRole('button')).toHaveLength(GAME_IDS.length);
  });
});
