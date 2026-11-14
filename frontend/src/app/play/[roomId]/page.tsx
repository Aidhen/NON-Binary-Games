'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { roomIdSchema } from '@nbg/shared';
import { RoomContainer } from '@/app/components/room/RoomContainer';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getRoomEmoji } from '@/lib/roomEmoji';

export default function PlayRoomPage() {
  const { t } = useTranslation();
  const params = useParams();
  // The server only accepts the ids the app generates: a link with any other id would wait for a game that never starts.
  const parsedRoomId = roomIdSchema.safeParse(params.roomId);

  const [copied, setCopied] = useState(false);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!parsedRoomId.success) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 p-4 text-center sm:p-8">
        <p className="text-lg font-bold text-[var(--title-text)]">{t('sudoku.invalidRoom')}</p>
        <Link href="/" className="font-bold text-[var(--subtitle-text)] underline hover:text-[var(--title-text)]">
          {t('sudoku.backHome')}
        </Link>
      </div>
    );
  }

  const roomId = parsedRoomId.data;
  const roomEmoji = getRoomEmoji(roomId).join('');

  return (
    <div className="w-full flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-2xl flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{t('sudoku.room')}: <span className="tracking-widest">{roomEmoji}</span></h1>
          <button
            onClick={copyInviteLink}
            className="px-3 py-1.5 text-sm font-medium bg-[var(--cell-background-highlight)] hover:bg-[var(--cell-background-initial)] rounded-md transition-colors border border-[var(--grid-border-inner)]"
            aria-label="Copy invitation link"
          >
            {copied ? `${t('sudoku.copied')}! ✨` : `${t('sudoku.copyLink')} 🔗`}
          </button>
        </div>
      </header>

      <RoomContainer roomId={roomId} />
    </div>
  );
}