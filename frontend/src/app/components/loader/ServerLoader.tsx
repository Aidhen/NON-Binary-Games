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
      "w-full max-w-[500px] aspect-square mx-auto p-4",
      "flex flex-col items-center justify-center gap-5 text-center",
      "border-4 border-[var(--grid-border-outer)]"
    )}>
      {isWaiting && (
        <div role="status" className="flex max-w-sm flex-col items-center gap-2">
          <p className="text-lg font-bold text-[var(--title-text)]">
            {t(status === 'failed' ? 'loader.failed' : 'loader.waking')}
          </p>
          <p className="text-sm font-medium text-[var(--subtitle-text)]">
            {t(status === 'failed' ? 'loader.failedDetails' : 'loader.wakingDetails')}
          </p>
          {status === 'failed' && (
            <button
              onClick={onRetry}
              className={cn(
                "mt-1 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                "bg-[var(--numpad-background)] text-[var(--numpad-text)]",
                "hover:bg-[var(--numpad-hover)] active:bg-[var(--numpad-active)]"
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
