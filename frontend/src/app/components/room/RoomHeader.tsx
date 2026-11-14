'use client';
import { CopyLinkButton } from './CopyLinkButton';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getRoomEmoji } from '@/lib/roomEmoji';

/** The room above a game: its label and the button that copies the link, for whoever still has to come. */
export function RoomHeader({ roomId }: Readonly<{ roomId: string }>) {
  const { t } = useTranslation();

  return (
    <header className="mb-6 flex w-full max-w-[500px] flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-paper)] bg-[var(--paper)] px-4 py-3 shadow-[var(--shadow-paper)]">
      <h1 className="font-display text-lg font-extrabold leading-tight">{t('sudoku.room')}: <span className="tracking-widest">{getRoomEmoji(roomId).join('')}</span></h1>
      <CopyLinkButton />
    </header>
  );
}
