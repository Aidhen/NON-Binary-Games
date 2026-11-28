import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { en } from '@/locales/en';
import { MemoryCard } from './MemoryCard';

vi.mock('@/lib/i18n/TranslationContext', async () => {
  const { en } = await import('@/locales/en');
  const translate = (key: string) => (key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], en) as string | undefined) ?? key;
  return { useTranslation: () => ({ t: translate }) };
});

const handlers = () => ({ onFlip: vi.fn(), onFocus: vi.fn(), onKeyDown: vi.fn() });
const MOON = 18;

describe('MemoryCard', () => {
  it('is a button named by its place while it is face down, and shows no drawing', () => {
    const { container } = render(<MemoryCard index={2} state="hidden" width={48} tabIndex={0} {...handlers()} />);

    expect(screen.getByRole('button', { name: 'Card 3' })).toBeInTheDocument();
    expect(container.querySelector('[data-memory-art="moon"]')).not.toBeInTheDocument();
  });

  it('is named by its drawing once it is face up', () => {
    render(<MemoryCard index={2} face={MOON} state="matched" width={48} tabIndex={0} {...handlers()} />);

    expect(screen.getByRole('button', { name: en.memory.cards.moon.name })).toHaveAttribute('data-up', 'true');
  });

  it('asks to flip its place when it is pressed, with the mouse or the keyboard', () => {
    const { onFlip, ...rest } = handlers();
    render(<MemoryCard index={5} state="hidden" width={48} tabIndex={0} onFlip={onFlip} {...rest} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onFlip).toHaveBeenCalledWith(5);
  });

  it('takes no press while the board is disabled', () => {
    const { onFlip, ...rest } = handlers();
    render(<MemoryCard index={5} state="hidden" width={48} disabled tabIndex={0} onFlip={onFlip} {...rest} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onFlip).not.toHaveBeenCalled();
  });

  it('shows the pending tap before the server answers, without turning the card', () => {
    render(<MemoryCard index={0} state="hidden" width={48} pending tabIndex={0} {...handlers()} />);

    expect(screen.getByRole('button')).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('button')).toHaveAttribute('data-up', 'false');
  });

  it('rings a card somebody holds, solid when it is mine and dashed when it is not', () => {
    const { rerender } = render(<MemoryCard index={0} face={MOON} state="held" width={48} holder={{ color: 'teal', animal: 'fox', mine: true, closesInMs: 10000 }} tabIndex={0} {...handlers()} />);
    expect(screen.getByTestId('memory-ring')).toHaveAttribute('data-mine', 'true');

    rerender(<MemoryCard index={0} face={MOON} state="held" width={48} holder={{ color: 'pink', animal: 'owl', mine: false, closesInMs: 10000 }} tabIndex={0} {...handlers()} />);
    expect(screen.getByTestId('memory-ring')).toHaveAttribute('data-mine', 'false');
  });

  it('starts the fade of the ring from what the server said was left, also when that is less than the fade', () => {
    render(<MemoryCard index={0} face={MOON} state="held" width={48} holder={{ color: 'teal', animal: 'fox', mine: false, closesInMs: 1000 }} tabIndex={0} {...handlers()} />);

    expect(screen.getByTestId('memory-ring').style.animationDelay).toBe('-2000ms');
  });

  it('puts the animal of the holder on a card that is big enough, and none on a small one', () => {
    const holder = { color: 'teal', animal: 'fox', mine: false, closesInMs: 10000 };
    const { rerender } = render(<MemoryCard index={0} face={MOON} state="held" width={64} holder={holder} tabIndex={0} {...handlers()} />);
    expect(screen.getByTestId('memory-badge')).toBeInTheDocument();

    rerender(<MemoryCard index={0} face={MOON} state="held" width={40} holder={holder} tabIndex={0} {...handlers()} />);
    expect(screen.queryByTestId('memory-badge')).not.toBeInTheDocument();
  });

  it('draws no ring on a card nobody holds, and takes no color or animal name as markup', () => {
    render(<MemoryCard index={0} face={MOON} state="matched" width={64} holder={{ color: '"><img src=x>', animal: '<b>', mine: false, closesInMs: 1 }} tabIndex={0} {...handlers()} />);

    expect(screen.queryByTestId('memory-ring')).not.toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('throws stars only when its pair has just been found', () => {
    const { rerender } = render(<MemoryCard index={0} face={MOON} state="matched" width={48} tabIndex={0} {...handlers()} />);
    expect(screen.queryByTestId('memory-stars')).not.toBeInTheDocument();

    rerender(<MemoryCard index={0} face={MOON} state="matched" width={48} celebrate tabIndex={0} {...handlers()} />);
    expect(screen.getByTestId('memory-stars').children.length).toBeGreaterThanOrEqual(3);
  });
});
