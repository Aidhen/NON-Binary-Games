'use client';
import { CopyLinkButton } from './CopyLinkButton';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getRoomEmoji } from '@/lib/roomEmoji';
import { cn } from '@/lib/utils';

interface RoomHeaderProps {
  roomId: string;
  /** How many players want to go back to the table, and how many are in the room. */
  tableVotes: number;
  playerCount: number;
  /** Whether this player is one of them. */
  wantsTable: boolean;
  onVoteTable: (wantsTable: boolean) => void;
}

/**
 * The room above a game: its label, the button that copies the link for whoever still has to come, and the way
 * back to the table. Going back is voted like opening a game, so that nobody throws away the game of the others.
 */
export function RoomHeader({ roomId, tableVotes, playerCount, wantsTable, onVoteTable }: Readonly<RoomHeaderProps>) {
  const { t } = useTranslation();

  return (
    <header className="mb-6 flex w-full max-w-[500px] flex-col gap-3 rounded-[var(--radius-paper)] bg-[var(--paper)] px-4 py-3 shadow-[var(--shadow-paper)]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="font-display text-lg font-extrabold leading-tight">{t('sudoku.room')}: <span className="tracking-widest">{getRoomEmoji(roomId).join('')}</span></h1>
        <CopyLinkButton />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          aria-pressed={wantsTable}
          onClick={() => onVoteTable(!wantsTable)}
          className={cn(
            "cursor-pointer rounded-[var(--radius-control)] px-4 py-2 text-sm font-bold shadow-[var(--shadow-paper-sm)]",
            "transition-transform duration-150 motion-reduce:transition-none active:translate-y-0.5",
            wantsTable ? "bg-[var(--paper-well)] text-[var(--title-text)]" : "bg-[var(--accent)] text-[var(--accent-ink)]"
          )}
        >
          {wantsTable ? t('lobby.stayHere') : t('lobby.backToTable')}
        </button>
        <p role="status" className="text-sm font-bold text-[var(--subtitle-text)]">
          {tableVotes > 0 && t('lobby.backProgress').replace('{count}', String(tableVotes)).replace('{total}', String(playerCount))}
        </p>
      </div>
    </header>
  );
}
