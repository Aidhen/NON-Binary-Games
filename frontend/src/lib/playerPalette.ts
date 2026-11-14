import type { PlayerColor } from '@nbg/shared';

export interface PlayerColorStyle {
  /** Ring around the cell where the player has their cursor. */
  ring: string;
  /** Light fill of that cell. */
  tint: string;
  /** Solid fill, for the swatches of the color picker and the dot of a chip. */
  swatch: string;
  border: string;
  /** Digits of the notes of the player: a darker or lighter shade than the ring, so that small digits can be read. */
  text: string;
}

/**
 * The classes of each player color. Tailwind only generates a class it can read in full in the source, so
 * every one is written out; the color itself comes from the variables of the theme (see globals.css), which
 * are chosen to be seen on the surfaces of that theme.
 */
export const PLAYER_COLOR_STYLES: Record<PlayerColor, PlayerColorStyle> = {
  red: { ring: 'ring-[var(--player-red)]', tint: 'bg-[var(--player-red)]/10', swatch: 'bg-[var(--player-red)]', border: 'border-[var(--player-red)]', text: 'text-[var(--player-red-text)]' },
  orange: { ring: 'ring-[var(--player-orange)]', tint: 'bg-[var(--player-orange)]/10', swatch: 'bg-[var(--player-orange)]', border: 'border-[var(--player-orange)]', text: 'text-[var(--player-orange-text)]' },
  green: { ring: 'ring-[var(--player-green)]', tint: 'bg-[var(--player-green)]/10', swatch: 'bg-[var(--player-green)]', border: 'border-[var(--player-green)]', text: 'text-[var(--player-green-text)]' },
  teal: { ring: 'ring-[var(--player-teal)]', tint: 'bg-[var(--player-teal)]/10', swatch: 'bg-[var(--player-teal)]', border: 'border-[var(--player-teal)]', text: 'text-[var(--player-teal-text)]' },
  blue: { ring: 'ring-[var(--player-blue)]', tint: 'bg-[var(--player-blue)]/10', swatch: 'bg-[var(--player-blue)]', border: 'border-[var(--player-blue)]', text: 'text-[var(--player-blue-text)]' },
  purple: { ring: 'ring-[var(--player-purple)]', tint: 'bg-[var(--player-purple)]/10', swatch: 'bg-[var(--player-purple)]', border: 'border-[var(--player-purple)]', text: 'text-[var(--player-purple-text)]' },
  pink: { ring: 'ring-[var(--player-pink)]', tint: 'bg-[var(--player-pink)]/10', swatch: 'bg-[var(--player-pink)]', border: 'border-[var(--player-pink)]', text: 'text-[var(--player-pink-text)]' },
};

/** For a note or a cursor of somebody who is not in the list (they left before you came): the color of the theme. */
export const UNKNOWN_PLAYER_STYLE: PlayerColorStyle = {
  ring: 'ring-[var(--number-player)]',
  tint: 'bg-[var(--number-player)]/10',
  swatch: 'bg-[var(--number-player)]',
  border: 'border-[var(--number-player)]',
  text: 'text-[var(--number-player)]',
};
