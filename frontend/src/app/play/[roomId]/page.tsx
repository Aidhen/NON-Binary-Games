'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { roomIdSchema } from '@nbg/shared';
import { RoomContainer } from '@/app/components/room/RoomContainer';
import { useTranslation } from '@/lib/i18n/TranslationContext';

export default function PlayRoomPage() {
  const { t } = useTranslation();
  const params = useParams();
  // The server only accepts the ids the app generates: a link with any other id would wait for a game that never starts.
  const parsedRoomId = roomIdSchema.safeParse(params.roomId);

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

  return (
    <div className="w-full flex flex-col items-center p-4 sm:p-8">
      <RoomContainer roomId={parsedRoomId.data} />
    </div>
  );
}
