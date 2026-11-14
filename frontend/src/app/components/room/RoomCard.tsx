'use client';
import type { PlayerColor, PlayerProfile } from '@nbg/shared';
import { PlayerBar } from '../players/PlayerBar';
import { CopyLinkButton } from './CopyLinkButton';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getRoomEmoji } from '@/lib/roomEmoji';
import { useHighlight } from '@/lib/useHighlight';

interface RoomCardProps {
  roomId: string;
  /** The players in the room, in the order they came. */
  players: PlayerProfile[];
  /** Who the player is in that list (their alias), once the server has said so. */
  self: string | null;
  onPickColor: (color: PlayerColor) => void;
}

/**
 * The room, at the center of the table: its label (the emoji are only a way to recognize it, the link is
 * what lets people in), the button that copies the link and who is here.
 */
export function RoomCard({ roomId, players, self, onPickColor }: Readonly<RoomCardProps>) {
  const { t } = useTranslation();
  const { highlighted, highlight } = useHighlight();

  return (
    <section
      aria-labelledby="room-title"
      className="flex w-full flex-col gap-4 rounded-[var(--radius-paper)] bg-[var(--paper)] p-4 shadow-[var(--shadow-paper)] sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h1 id="room-title" className="text-xs font-extrabold uppercase tracking-widest text-[var(--subtitle-text)]">
          {t('lobby.yourRoom')}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-3xl tracking-widest">{getRoomEmoji(roomId).join('')}</span>
          <CopyLinkButton />
        </div>
        <p className="text-sm font-medium text-[var(--subtitle-text)]">{t('lobby.invite')}</p>
      </div>

      <PlayerBar players={players} self={self} highlightedAlias={highlighted} onPickColor={onPickColor} onHighlight={highlight} />
    </section>
  );
}
