'use client';
import type { Ref } from 'react';
import type { PlayerProfile } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { styleOfColor } from '@/lib/playerPalette';
import { animalEmoji } from '@/lib/playerNames';
import { cn } from '@/lib/utils';

interface PlayerChipProps {
  profile: PlayerProfile;
  /** The generated name, in the language of the page. */
  name: string;
  isSelf: boolean;
  isHighlighted: boolean;
  /** Only for the chip of the player: whether the color picker under it is open. */
  expanded: boolean;
  /** What a screen reader says: the player's own chip says who they are, the others say what a click does. */
  label: string;
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}

/**
 * One player: the emoji of the animal, the name and the color of the player around them. The player's own
 * chip opens the color picker; the chips of the others point them out on the board. The emoji and the name
 * are what tells players apart without relying on color.
 */
export function PlayerChip({ profile, name, isSelf, isHighlighted, expanded, label, onClick, buttonRef }: Readonly<PlayerChipProps>) {
  const { t } = useTranslation();
  const style = styleOfColor(profile.color);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={name}
      aria-expanded={isSelf ? expanded : undefined}
      data-highlighted={isHighlighted || undefined}
      className={cn(
        'flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-sm font-bold',
        'text-[var(--title-text)] transition-all duration-200',
        style.border,
        style.tint,
        isSelf && ['ring-2 ring-offset-2 ring-offset-[var(--bg)]', style.ring],
        isHighlighted && ['ring-4 motion-safe:animate-pulse', style.ring],
      )}
    >
      <span aria-hidden="true" className="text-lg leading-none">{animalEmoji(profile.animal)}</span>
      <span>{name}</span>
      {isSelf && (
        <span aria-hidden="true" className="text-xs font-bold uppercase tracking-wider text-[var(--subtitle-text)]">
          {t('players.you')}
        </span>
      )}
    </button>
  );
}
