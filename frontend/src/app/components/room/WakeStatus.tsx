'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';

interface WakeStatusProps {
  status: ConnectionStatus;
  onRetry: () => void;
  /** Something to do while waiting (a small game, one day). Shown under the message, only while the server is slow. */
  children?: ReactNode;
}

/**
 * The wait for the server, as a note on the table instead of a screen of its own: the room, its link and
 * the boxes are already there to look at. Says nothing while the wait is short.
 */
export function WakeStatus({ status, onRetry, children }: Readonly<WakeStatusProps>) {
  const { t } = useTranslation();
  const isSlow = status === 'waking' || status === 'failed';

  return (
    <div role="status" className="flex w-full flex-col items-center gap-3 text-center">
      {!isSlow && (
        <p className="flex items-center gap-2 rounded-full bg-[var(--paper)] px-4 py-2 text-sm font-bold text-[var(--subtitle-text)] shadow-[var(--shadow-paper-sm)]">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--accent)] motion-safe:animate-pulse" />
          {t('lobby.connecting')}
        </p>
      )}

      {isSlow && (
        <div className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-paper)] bg-[var(--paper)] p-4 shadow-[var(--shadow-paper-sm)]">
          <p className="flex items-center gap-2 font-display text-lg font-extrabold text-[var(--title-text)]">
            <span aria-hidden="true" className={cn("size-2 rounded-full bg-[var(--accent)]", status === 'waking' && "motion-safe:animate-pulse")} />
            {t(status === 'failed' ? 'loader.failed' : 'loader.waking')}
          </p>
          <p className="text-sm font-medium text-[var(--subtitle-text)]">
            {t(status === 'failed' ? 'loader.failedDetails' : 'loader.wakingDetails')}
          </p>
          {status === 'failed' && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 cursor-pointer rounded-[var(--radius-control)] bg-[var(--paper-well)] px-5 py-2 text-sm font-bold text-[var(--title-text)]"
            >
              {t('loader.retry')}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
