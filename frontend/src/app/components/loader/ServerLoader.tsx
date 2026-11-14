'use client';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';

interface ServerLoaderProps {
  status: ConnectionStatus;
  onRetry: () => void;
}

export function ServerLoader({ status, onRetry }: ServerLoaderProps) {
  const { t } = useTranslation();

  const isWaiting = status === 'waking' || status === 'failed';

  return (
    <div className={cn(
      "w-full max-w-[500px] aspect-square mx-auto p-6",
      "flex flex-col items-center justify-center gap-5 text-center",
      "rounded-[var(--radius-paper)] bg-[var(--paper)] shadow-[var(--shadow-paper)]"
    )}>
      {isWaiting && (
        <div role="status" className="flex max-w-sm flex-col items-center gap-2">
          <p className="font-display text-xl font-extrabold text-[var(--title-text)]">
            {t(status === 'failed' ? 'loader.failed' : 'loader.waking')}
          </p>
          <p className="text-sm font-medium text-[var(--subtitle-text)]">
            {t(status === 'failed' ? 'loader.failedDetails' : 'loader.wakingDetails')}
          </p>
          {status === 'failed' && (
            <button
              onClick={onRetry}
              className={cn(
                "mt-1 cursor-pointer px-5 py-2 rounded-[var(--radius-control)] text-sm font-bold",
                "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--shadow-paper-sm)]",
                "transition-transform duration-150 motion-reduce:transition-none active:translate-y-0.5 active:shadow-none"
              )}
            >
              {t('loader.retry')}
            </button>
          )}
        </div>
      )}

      {!isWaiting && (
        <span className="text-[var(--subtitle-text)] font-medium animate-pulse">
          {t('sudoku.loading')}
        </span>
      )}
    </div>
  );
}
