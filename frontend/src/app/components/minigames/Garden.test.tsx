import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOOM_AT, Garden, GARDEN_STORAGE_KEY } from './Garden';

vi.mock('@/lib/i18n/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const waterButton = () => screen.getByRole('button');

const water = (times: number) => {
  for (let i = 0; i < times; i++) fireEvent.click(waterButton());
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Garden', () => {
  it('starts with a seed and no flowers', () => {
    render(<Garden />);

    expect(screen.getByText('minigames.garden.seed')).toBeInTheDocument();
    expect(waterButton()).toHaveTextContent('minigames.garden.water');
    expect(screen.getByText('minigames.garden.flowers: 0')).toBeInTheDocument();
  });

  it('grows through the stages as it gets watered', () => {
    render(<Garden />);

    water(4);
    expect(screen.getByText('minigames.garden.seed')).toBeInTheDocument();

    water(1);
    expect(screen.getByText('minigames.garden.sprout')).toBeInTheDocument();

    water(9);
    expect(screen.getByText('minigames.garden.sprout')).toBeInTheDocument();

    water(1);
    expect(screen.getByText('minigames.garden.leaves')).toBeInTheDocument();
  });

  it('blooms, then plants a new seed and counts the flower', () => {
    render(<Garden />);

    water(BLOOM_AT - 1);
    expect(screen.getByText('minigames.garden.leaves')).toBeInTheDocument();

    water(1);
    expect(screen.getByText('minigames.garden.bloom')).toBeInTheDocument();
    expect(screen.getByText('🌷')).toBeInTheDocument();
    expect(waterButton()).toHaveTextContent('minigames.garden.plantSeed');

    water(1);
    expect(screen.getByText('minigames.garden.seed')).toBeInTheDocument();
    expect(screen.getByText('minigames.garden.flowers: 1')).toBeInTheDocument();
    expect(waterButton()).toHaveTextContent('minigames.garden.water');
  });

  it('grows a different flower each time', () => {
    render(<Garden />);

    water(BLOOM_AT + 1 + BLOOM_AT);

    expect(screen.getByText('🌸')).toBeInTheDocument();
  });

  it('calls onPlay on every click', () => {
    const onPlay = vi.fn();
    render(<Garden onPlay={onPlay} />);

    water(3);

    expect(onPlay).toHaveBeenCalledTimes(3);
  });

  it('saves the progress', () => {
    render(<Garden />);

    water(3);

    expect(JSON.parse(localStorage.getItem(GARDEN_STORAGE_KEY)!)).toEqual({ water: 3, flowers: 0 });
  });

  it('restores the saved progress', () => {
    localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify({ water: 16, flowers: 2 }));

    render(<Garden />);

    expect(screen.getByText('minigames.garden.leaves')).toBeInTheDocument();
    expect(screen.getByText('minigames.garden.flowers: 2')).toBeInTheDocument();
  });

  it.each([
    ['not json', 'not json'],
    ['a negative value', JSON.stringify({ water: -1, flowers: 0 })],
    ['a fractional value', JSON.stringify({ water: 1.5, flowers: 0 })],
    ['more water than a bloom', JSON.stringify({ water: BLOOM_AT + 1, flowers: 0 })],
    ['missing fields', JSON.stringify({ water: 3 })],
    ['a json null', 'null'],
  ])('starts over when the saved value is %s', (_, saved) => {
    localStorage.setItem(GARDEN_STORAGE_KEY, saved);

    render(<Garden />);

    expect(screen.getByText('minigames.garden.seed')).toBeInTheDocument();
    expect(screen.getByText('minigames.garden.flowers: 0')).toBeInTheDocument();
  });

  it('keeps working when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    render(<Garden />);
    water(5);

    expect(screen.getByText('minigames.garden.sprout')).toBeInTheDocument();
  });
});
