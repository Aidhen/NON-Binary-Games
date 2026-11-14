'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { warmUpServer } from '@/lib/warmUp';

// The home is a new room: there is nothing to press before sharing the link. The room only exists on the
// server once this browser joins it, and it has no game until the players choose one.
export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    warmUpServer();
    // replace, not push: going back from the room must not land here and open yet another room.
    router.replace(`/play/${crypto.randomUUID()}`);
  }, [router]);

  return (
    <p className="p-4 font-medium text-[var(--subtitle-text)] animate-pulse">
      {t('sudoku.loading')}
    </p>
  );
}
