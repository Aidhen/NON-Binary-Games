'use client';
import { CopyLinkButton } from './CopyLinkButton';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { getRoomEmoji } from '@/lib/roomEmoji';

/** The room above a game: its label and the button that copies the link, for whoever still has to come. */
export function RoomHeader({ roomId }: Readonly<{ roomId: string }>) {
  const { t } = useTranslation();

  return (
    <header className="mb-6 flex w-full max-w-[500px] flex-wrap items-center justify-center gap-x-4 gap-y-2">
      <h1 className="text-xl font-bold">{t('sudoku.room')}: <span className="tracking-widest">{getRoomEmoji(roomId).join('')}</span></h1>
      <CopyLinkButton />
    </header>
  );
}
