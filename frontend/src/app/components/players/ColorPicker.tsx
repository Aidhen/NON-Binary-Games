'use client';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { PLAYER_COLORS } from '@nbg/shared';
import type { PlayerColor, PlayerProfile } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { PLAYER_COLOR_STYLES } from '@/lib/playerPalette';
import { animalEmoji, playerName } from '@/lib/playerNames';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  id: string;
  /** The color the player has now. */
  current: PlayerColor;
  /** The other players in the room: the colors they have cannot be taken. */
  others: PlayerProfile[];
  onPick: (color: PlayerColor) => void;
  onClose: () => void;
}

/**
 * A row of swatches under the chip of the player. A color that somebody else has is shown with their
 * emoji and cannot be picked; the server decides in the end, this only saves a wrong try.
 */
export function ColorPicker({ id, current, others, onPick, onClose }: Readonly<ColorPickerProps>) {
  const { t } = useTranslation();
  const swatches = useRef<Partial<Record<PlayerColor, HTMLButtonElement | null>>>({});
  const [focused, setFocused] = useState<PlayerColor>(current);

  const takenBy = (color: PlayerColor) => others.find((player) => player.color === color);

  // What is inside a swatch: the emoji of whoever has the color, a check mark on the color the player has.
  const markOf = (color: PlayerColor, owner: PlayerProfile | undefined) => {
    if (owner) return <span aria-hidden="true" className="text-sm">{animalEmoji(owner.animal)}</span>;
    if (color === current) return <span aria-hidden="true" className="text-[var(--bg)]">✓</span>;
    return null;
  };

  // It opens on the color the player has, so that the arrow keys start from there.
  useEffect(() => { swatches.current[current]?.focus(); }, [current]);

  const move = (from: PlayerColor, step: 1 | -1) => {
    const start = PLAYER_COLORS.indexOf(from);
    for (let offset = 1; offset <= PLAYER_COLORS.length; offset++) {
      const color = PLAYER_COLORS[(start + step * offset + PLAYER_COLORS.length * 2) % PLAYER_COLORS.length];
      if (!takenBy(color)) {
        swatches.current[color]?.focus();
        return;
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key] as 1 | -1 | undefined;
    if (!step) return;
    event.preventDefault();
    move(focused, step);
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={t('players.chooseColor')}
      // Focusable as a whole, but not a stop of its own: the swatches are (one at a time, with the arrow keys).
      tabIndex={-1}
      onKeyDown={onKeyDown}
      // On a surface of the cells, where the contrast of every color is checked in every theme.
      className="flex flex-wrap items-center justify-center gap-3 rounded-[var(--radius-paper)] border border-[var(--grid-border-inner)] bg-[var(--cell-background)] p-3 shadow-[var(--shadow-paper-sm)]"
    >
      {PLAYER_COLORS.map((color) => {
        const owner = takenBy(color);
        const colorName = t(`players.colors.${color}.m`);
        const takenText = owner ? t('players.colorTaken').replace('{name}', playerName(t, owner)) : '';
        const label = owner ? `${colorName}. ${takenText}` : colorName;
        const isCurrent = color === current;

        return (
          <button
            key={color}
            ref={(element) => { swatches.current[color] = element; }}
            type="button"
            role="radio"
            aria-checked={isCurrent}
            aria-disabled={owner ? true : undefined}
            aria-label={label}
            title={label}
            tabIndex={color === focused ? 0 : -1}
            onFocus={() => setFocused(color)}
            onClick={() => { if (!owner) onPick(color); }}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-full text-base font-black transition-transform',
              PLAYER_COLOR_STYLES[color].swatch,
              'ring-offset-2 ring-offset-[var(--cell-background)]',
              isCurrent && ['ring-2', PLAYER_COLOR_STYLES[color].ring],
              owner ? 'cursor-not-allowed opacity-40' : 'hover:scale-110 active:scale-95',
            )}
          >
            {markOf(color, owner)}
          </button>
        );
      })}
    </div>
  );
}
