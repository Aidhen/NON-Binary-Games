'use client';
import { RoomIconArt } from '@nbg/art';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getRoomEmoji } from '@/lib/roomEmoji';
import { cn } from '@/lib/utils';

interface RoomCodeProps {
  roomId: string;
  /** The size of each drawing. */
  iconClassName: string;
  className?: string;
}

/**
 * The label of a room: five drawings that come from its id. The group is one image for a screen reader,
 * named with the names of the drawings in the language of the page ("Room: lemon, moon, house, cloud, gem").
 */
export function RoomCode({ roomId, iconClassName, className }: Readonly<RoomCodeProps>) {
  const { t } = useTranslation();
  const icons = getRoomEmoji(roomId);

  return (
    <span role="img" aria-label={`${t('sudoku.room')}: ${icons.map((icon) => t(`roomIcons.${icon}`)).join(', ')}`} className={cn('inline-flex items-center', className)}>
      {icons.map((icon) => <RoomIconArt key={icon} icon={icon} className={iconClassName} />)}
    </span>
  );
}
