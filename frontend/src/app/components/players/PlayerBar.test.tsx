import { useEffect } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PLAYER_COLORS } from '@nbg/shared';
import type { PlayerProfile } from '@nbg/shared';
import { TranslationProvider, useTranslation } from '@/lib/i18n/TranslationContext';
import { PlayerBar } from './PlayerBar';

const panda: PlayerProfile = { alias: 'aaaaaaaaaaaa', animal: 'panda', color: 'red' };
const fox: PlayerProfile = { alias: 'bbbbbbbbbbbb', animal: 'fox', color: 'blue' };
const owl: PlayerProfile = { alias: 'cccccccccccc', animal: 'owl', color: 'green' };

function InItalian({ children }: { children: React.ReactNode }) {
  const { setLanguage } = useTranslation();
  useEffect(() => setLanguage('it'), [setLanguage]);
  return children;
}

const setup = (props: Partial<React.ComponentProps<typeof PlayerBar>> = {}, italian = false) => {
  const onPickColor = vi.fn();
  const onHighlight = vi.fn();
  const defaults = { players: [panda, fox], self: panda.alias, highlightedAlias: null, onPickColor, onHighlight };
  const bar = (extra: Partial<React.ComponentProps<typeof PlayerBar>> = {}) => {
    const content = <PlayerBar {...defaults} {...props} {...extra} />;
    return <TranslationProvider>{italian ? <InItalian>{content}</InItalian> : content}</TranslationProvider>;
  };
  const view = render(bar());
  return { ...view, onPickColor, onHighlight, update: (extra: Partial<React.ComponentProps<typeof PlayerBar>>) => view.rerender(bar(extra)) };
};

const ownChip = () => screen.getByRole('button', { name: 'Red Panda (you)' });
const swatch = (name: RegExp) => screen.getByRole('radio', { name });

describe('PlayerBar', () => {
  it('shows a paw for an animal it does not know', () => {
    setup({ players: [panda, { ...fox, animal: 'unicorn' as PlayerProfile['animal'] }] });

    expect(screen.getByText('🐾')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show where Someone is playing' })).toBeInTheDocument();
  });

  it('lists the players in the room, each with the emoji of the animal and the generated name', () => {
    setup();

    const list = screen.getByRole('list', { name: 'Players in this room' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Red Panda')).toBeInTheDocument();
    expect(within(list).getByText('Blue Fox')).toBeInTheDocument();
    expect(within(list).getByText('🐼')).toBeInTheDocument();
    expect(within(list).getByText('🦊')).toBeInTheDocument();
  });

  it('puts the player first and says which chip is theirs', () => {
    setup({ players: [fox, panda] });

    expect(within(screen.getAllByRole('listitem')[0]).getByText('Red Panda')).toBeInTheDocument();
    expect(ownChip()).toBeInTheDocument();
  });

  it('shows nothing until the server has listed the players', () => {
    setup({ players: [], self: null });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('follows the color: a player who takes another color has another name', () => {
    const { update } = setup();

    update({ players: [{ ...panda, color: 'pink' }, fox] });

    expect(screen.getByText('Pink Panda')).toBeInTheDocument();
    expect(screen.queryByText('Red Panda')).not.toBeInTheDocument();
  });

  it('writes the names in Italian, with the animal first and the color agreeing with it', () => {
    setup({ players: [{ ...panda, color: 'red' }, { ...fox, color: 'red' }] }, true);

    expect(screen.getByText('Panda Rosso')).toBeInTheDocument();
    expect(screen.getByText('Volpe Rossa')).toBeInTheDocument();
  });

  describe('the color picker', () => {
    it('is closed until the player clicks their own chip', () => {
      setup();

      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(ownChip()).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(ownChip());

      expect(screen.getByRole('radiogroup', { name: 'Choose your color' })).toBeInTheDocument();
      expect(ownChip()).toHaveAttribute('aria-expanded', 'true');
    });

    it('offers every color, with the one the player has marked', () => {
      setup();
      fireEvent.click(ownChip());

      expect(screen.getAllByRole('radio')).toHaveLength(PLAYER_COLORS.length);
      expect(swatch(/^Red/)).toHaveAttribute('aria-checked', 'true');
      expect(swatch(/^Orange/)).toHaveAttribute('aria-checked', 'false');
    });

    it('marks the colors that others have, says who has them, and does not pick them', () => {
      const { onPickColor } = setup({ players: [panda, fox, owl] });
      fireEvent.click(ownChip());

      const taken = swatch(/^Blue/);
      expect(taken).toHaveAttribute('aria-disabled', 'true');
      expect(taken).toHaveAccessibleName('Blue. Taken by Blue Fox');
      expect(swatch(/^Green/)).toHaveAccessibleName('Green. Taken by Green Owl');
      expect(swatch(/^Orange/)).not.toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(taken);

      expect(onPickColor).not.toHaveBeenCalled();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('picks a free color, closes, and gives the focus back to the chip', () => {
      const { onPickColor } = setup();
      fireEvent.click(ownChip());

      fireEvent.click(swatch(/^Teal/));

      expect(onPickColor).toHaveBeenCalledExactlyOnceWith('teal');
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(ownChip()).toHaveFocus();
    });

    it('closes with the same chip, and with Escape, and gives the focus back', () => {
      setup();

      fireEvent.click(ownChip());
      fireEvent.click(ownChip());
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

      fireEvent.click(ownChip());
      fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Escape' });
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(ownChip()).toHaveFocus();
    });

    it('opens with the focus on the color the player has', () => {
      setup();

      fireEvent.click(ownChip());

      expect(swatch(/^Red/)).toHaveFocus();
    });

    it('moves between the colors with the arrow keys, skipping the ones that are taken', () => {
      setup({ players: [panda, fox, owl] });
      fireEvent.click(ownChip());
      const group = screen.getByRole('radiogroup');

      fireEvent.keyDown(group, { key: 'ArrowRight' });
      expect(swatch(/^Orange/)).toHaveFocus();

      fireEvent.keyDown(group, { key: 'ArrowRight' });
      expect(swatch(/^Teal/)).toHaveFocus();

      fireEvent.keyDown(group, { key: 'ArrowLeft' });
      expect(swatch(/^Orange/)).toHaveFocus();

      fireEvent.keyDown(group, { key: 'ArrowLeft' });
      fireEvent.keyDown(group, { key: 'ArrowLeft' });
      expect(swatch(/^Pink/)).toHaveFocus();
    });

    it('closes when the player is no longer in the room', () => {
      const { update } = setup();
      fireEvent.click(ownChip());

      update({ players: [fox], self: null });

      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });
  });

  it('does not break on a color it does not know, which a newer server could send', () => {
    setup({ players: [panda, { ...fox, color: 'gold' as PlayerProfile['color'] }] });

    fireEvent.click(ownChip());

    expect(screen.getByRole('button', { name: 'Show where Fox is playing' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('puts the swatches on a surface where every color can be seen in every theme', () => {
    setup();

    fireEvent.click(ownChip());

    expect(screen.getByRole('radiogroup')).toHaveClass('bg-[var(--cell-background)]');
    expect(screen.getByRole('radiogroup')).not.toHaveClass('bg-[var(--numpad-background)]');
  });

  describe('the other players', () => {
    it('can be pointed out on the board by clicking their chip, without opening the picker', () => {
      const { onHighlight } = setup();

      fireEvent.click(screen.getByRole('button', { name: 'Show where Blue Fox is playing' }));

      expect(onHighlight).toHaveBeenCalledExactlyOnceWith(fox.alias);
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });

    it('show which one is being pointed out', () => {
      setup({ highlightedAlias: fox.alias });

      expect(screen.getByRole('button', { name: 'Show where Blue Fox is playing' })).toHaveAttribute('data-highlighted', 'true');
      expect(ownChip()).not.toHaveAttribute('data-highlighted', 'true');
    });
  });

  describe('the announcements for screen readers', () => {
    it('say nothing for the players who are there when the page opens', () => {
      setup();

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('say who comes and who leaves', () => {
      const { update } = setup();

      update({ players: [panda, fox, owl] });
      expect(screen.getByRole('status')).toHaveTextContent('Green Owl joined the room');

      update({ players: [panda, owl] });
      expect(screen.getByRole('status')).toHaveTextContent('Blue Fox left the room');
    });

    it('say it again when the same player comes back', () => {
      const { update } = setup();

      update({ players: [panda, fox, owl] });
      expect(screen.getByRole('status')).toHaveTextContent('Green Owl joined the room');
      update({ players: [panda, fox] });
      expect(screen.getByRole('status')).toHaveTextContent('Green Owl left the room');
      update({ players: [panda, fox, owl] });
      expect(screen.getByRole('status')).toHaveTextContent('Green Owl joined the room');
    });

    it('do not announce the player to themselves', () => {
      const { update } = setup({ players: [], self: null });

      update({ players: [panda], self: panda.alias });

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });
  });
});
