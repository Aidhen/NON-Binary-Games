'use client';
import { useEffect, useId, useState } from 'react';
import type { PlayerProfile } from '@nbg/shared';
import { CopyLinkButton } from './CopyLinkButton';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { playerName } from '@/lib/playerNames';
import { getRoomEmoji } from '@/lib/roomEmoji';
import { cn } from '@/lib/utils';

interface RoomHeaderProps {
  roomId: string;
  /** The players in the room, to say by name who asks to go back. */
  players: PlayerProfile[];
  /** Who this player is in that list (their alias), once the server has said so. */
  self: string | null;
  /** The players (by alias) who want to go back to the table. */
  tableVotes: string[];
  onVoteTable: (wantsTable: boolean) => void;
}

const SECONDARY = "cursor-pointer rounded-[var(--radius-control)] px-2.5 py-1.5 text-xs font-bold sm:px-3.5 sm:py-2 sm:text-sm shadow-[var(--shadow-paper-sm)] transition-transform duration-150 motion-reduce:transition-none active:translate-y-0.5";

/**
 * The room above a game, in one row: its label, the button that copies the link for whoever still has to come,
 * and the way back to the table. Going back is voted like opening a game, so that nobody throws away the game of
 * the others: when someone asks, the others are told who, and can go back with them or keep playing.
 */
export function RoomHeader({ roomId, players, self, tableVotes, onVoteTable }: Readonly<RoomHeaderProps>) {
  const { t } = useTranslation();
  const askId = useId();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const wantsTable = self !== null && tableVotes.includes(self);
  const askers = players.filter(({ alias }) => alias !== self && tableVotes.includes(alias));
  // Who asked when this player said "keep playing": somebody new asking brings the question back.
  const askKey = askers.map(({ alias }) => alias).join(',');
  const isAsked = askers.length > 0 && !wantsTable && dismissed !== askKey;

  useEffect(() => { if (askKey === '') setDismissed(null); }, [askKey]);

  const names = askers.map((player) => playerName(t, player));
  const nameList = names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${t('lobby.and')} ${names[names.length - 1]}`;

  return (
    <header className="mb-3 flex w-full max-w-[500px] flex-col gap-2 rounded-[var(--radius-paper)] bg-[var(--paper)] px-3 py-2 shadow-[var(--shadow-paper)] sm:mb-6 sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-lg font-extrabold leading-tight">
          <span className="sr-only sm:not-sr-only">{t('sudoku.room')}: </span>
          <span className="text-base tracking-wide sm:text-lg sm:tracking-widest">{getRoomEmoji(roomId).join('')}</span>
        </h1>
        <div className="flex items-center gap-2">
          <CopyLinkButton className="px-2.5 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm" />
          {!isAsked && (
            <button
              type="button"
              aria-pressed={wantsTable}
              onClick={() => onVoteTable(!wantsTable)}
              className={cn(SECONDARY, "bg-[var(--paper-well)] text-[var(--title-text)]", wantsTable && "outline-2 -outline-offset-2 outline-[var(--accent)]")}
            >
              {wantsTable ? t('lobby.stayHere') : t('lobby.backToTable')}
            </button>
          )}
        </div>
      </div>

      {isAsked && (
        <div role="group" aria-labelledby={askId} className="flex flex-col gap-2 rounded-[var(--radius-control)] bg-[var(--paper-well)] p-3">
          <p id={askId} className="text-sm font-bold text-[var(--title-text)]">{t('lobby.backAsk').replace('{names}', nameList)}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onVoteTable(true)} className={cn(SECONDARY, "bg-[var(--accent)] text-[var(--accent-ink)]")}>{t('lobby.goBack')}</button>
            <button type="button" onClick={() => setDismissed(askKey)} className={cn(SECONDARY, "bg-[var(--paper)] text-[var(--title-text)]")}>{t('lobby.keepPlaying')}</button>
          </div>
        </div>
      )}

      <output className="text-sm font-bold text-[var(--subtitle-text)] empty:hidden">
        {tableVotes.length > 0 && !isAsked && t('lobby.backProgress').replace('{count}', String(tableVotes.length)).replace('{total}', String(players.length))}
      </output>
    </header>
  );
}
