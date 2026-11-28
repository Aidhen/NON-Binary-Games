import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@nbg/shared';
import { fitMemoryGrid } from '../games/boardStyles';
import { MemoryBoardUI } from './MemoryBoardUI';

vi.mock('@/lib/i18n/TranslationContext', async () => {
  const { en } = await import('@/locales/en');
  const translate = (key: string) => (key.split('.').reduce<unknown>((current, part) => (current as Record<string, unknown> | undefined)?.[part], en) as string | undefined) ?? key;
  return { useTranslation: () => ({ t: translate }) };
});

const NONE: ReadonlySet<number> = new Set();
const profiles: Record<string, PlayerProfile> = { ana: { alias: 'ana', animal: 'fox', color: 'teal' }, bo: { alias: 'bo', animal: 'owl', color: 'pink' } };

const board = (props: Partial<Parameters<typeof MemoryBoardUI>[0]> = {}) => (
  <MemoryBoardUI cards={12} faces={{}} matched={NONE} locked={NONE} held={{}} pending={null} self="ana" profiles={profiles} onFlip={() => {}} {...props} />
);

afterEach(() => { vi.restoreAllMocks(); });

describe('MemoryBoardUI', () => {
  it('lays out one button for each card, all face down at first', () => {
    render(board());

    expect(screen.getAllByRole('button')).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'Card 12' })).toHaveAttribute('data-state', 'hidden');
  });

  it('picks the columns from the size of its box, so that a phone gets more rows than a desktop', () => {
    const box = (width: number, height: number) => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) });

    box(350, 340);
    const phone = render(board({ cards: 44 }));
    const phoneColumns = Number(phone.getByRole('group').dataset.columns);
    phone.unmount();

    box(1000, 520);
    render(board({ cards: 44 }));

    expect(phoneColumns).toBe(fitMemoryGrid(44, 350, 340).columns);
    expect(Number(screen.getByRole('group').dataset.columns)).toBe(fitMemoryGrid(44, 1000, 520).columns);
    expect(Number(screen.getByRole('group').dataset.columns)).toBeGreaterThan(phoneColumns);
  });

  it('shows the drawing only of the cards the server told, as matched, held or locked', () => {
    render(board({ faces: { 0: 18, 1: 18, 2: 17, 3: 5 }, matched: new Set([0, 1]), held: { 2: { alias: 'bo', closesInMs: 5000 } }, locked: new Set([3]) }));

    expect(screen.getAllByRole('button', { name: 'The Moon' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'The Star' })).toHaveAttribute('data-state', 'held');
    expect(screen.getByRole('button', { name: 'The Hierophant' })).toHaveAttribute('data-state', 'locked');
    expect(screen.getAllByRole('button', { name: /^Card/ })).toHaveLength(8);
  });

  it('marks a card as mine when its holder is the player, and as somebody else\'s when it is not', () => {
    render(board({ faces: { 0: 18, 1: 17 }, held: { 0: { alias: 'ana', closesInMs: 5000 }, 1: { alias: 'bo', closesInMs: 5000 } } }));

    const rings = screen.getAllByTestId('memory-ring');
    expect(rings.map((ring) => ring.dataset.mine)).toEqual(['true', 'false']);
  });

  it('does not take the holder from the prototype when the alias is not a player the page knows', () => {
    render(board({ faces: { 0: 18 }, held: { 0: { alias: 'constructor', closesInMs: 5000 } } }));

    expect(screen.getByTestId('memory-ring')).toHaveAttribute('data-mine', 'false');
  });

  it('asks to flip the place of the card that is pressed', () => {
    const onFlip = vi.fn();
    render(board({ onFlip }));

    fireEvent.click(screen.getByRole('button', { name: 'Card 4' }));

    expect(onFlip).toHaveBeenCalledWith(3);
  });

  it('moves the focus with the arrow keys, a row at a time with up and down, and stops at the edges', () => {
    render(board());
    const columns = Number(screen.getByRole('group').dataset.columns);
    const first = screen.getByRole('button', { name: 'Card 1' });
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Card 2' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Card 2' }), { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: `Card ${2 + columns}` })).toHaveFocus();

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(first).toHaveFocus();
  });

  it('has one card in the tab order: the one the focus is on', () => {
    render(board());

    expect(screen.getAllByRole('button').filter((card) => card.tabIndex === 0)).toHaveLength(1);
  });

  it('disables every card when the board is disabled', () => {
    render(board({ disabled: true }));

    for (const card of screen.getAllByRole('button')) expect(card).toBeDisabled();
  });
});
