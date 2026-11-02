'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import type { ConnectionStatus } from '@/lib/useConnectionStatus';
import { MiniGameArea } from '../minigames/MiniGameArea';

interface ServerLoaderProps {
  status: ConnectionStatus;
  ready: boolean;
  onEnter: () => void;
  onRetry: () => void;
}

export function ServerLoader({ status, ready, onEnter, onRetry }: ServerLoaderProps) {
  const { t } = useTranslation();
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (ready && !hasPlayed) onEnter();
  }, [ready, hasPlayed, onEnter]);

  const isWaiting = status === 'waking' || status === 'failed';
  const showMiniGame = isWaiting || hasPlayed;

  return (
    <div className={cn(
      "w-full max-w-[500px] aspect-square mx-auto p-4",
      "flex flex-col items-center justify-center gap-5 text-center",
      "border-4 border-[var(--grid-border-outer)]"
    )}>
      {ready && hasPlayed && (
        <div role="status" className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-[var(--title-text)]">{t('loader.ready')}</p>
          <button
            onClick={onEnter}
            className={cn(
              "px-6 py-3 rounded-lg font-bold transition-all duration-200",
              "bg-[var(--cell-background-selected)] text-[var(--title-text)]",
              "hover:opacity-80 active:scale-95"
            )}
          >
            {t('loader.join')}
          </button>
        </div>
      )}

      {!ready && isWaiting && (
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

      {!showMiniGame && (
        <span className="text-[var(--subtitle-text)] font-medium animate-pulse">
          {t('sudoku.loading')}
        </span>
      )}

      {showMiniGame && <MiniGameArea onPlay={() => setHasPlayed(true)} />}
    </div>
  );
}
