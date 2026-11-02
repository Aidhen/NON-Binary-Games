'use client';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { readStorage, writeStorage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { MINI_GAMES } from './registry';
import type { MiniGame } from './types';

export const MINI_GAME_STORAGE_KEY = 'nbg:minigame';

interface MiniGameAreaProps {
  onPlay?: () => void;
  games?: MiniGame[];
}

export function MiniGameArea({ onPlay, games = MINI_GAMES }: MiniGameAreaProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState(games[0].id);

  useEffect(() => {
    const saved = readStorage(MINI_GAME_STORAGE_KEY);
    if (saved && games.some((game) => game.id === saved)) setSelectedId(saved);
  }, [games]);

  const selectGame = (id: string) => {
    setSelectedId(id);
    writeStorage(MINI_GAME_STORAGE_KEY, id);
  };

  const selected = games.find((game) => game.id === selectedId) ?? games[0];

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {games.length > 1 && (
        <div role="group" aria-label={t('minigames.pick')} className="flex gap-2">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => selectGame(game.id)}
              aria-pressed={game.id === selected.id}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 border-2",
                game.id === selected.id
                  ? "bg-[var(--cell-background-selected)] text-[var(--title-text)] border-[var(--grid-border-outer)]"
                  : "bg-[var(--numpad-background)] text-[var(--subtitle-text)] border-transparent hover:bg-[var(--numpad-hover)]"
              )}
            >
              {t(game.labelKey)}
            </button>
          ))}
        </div>
      )}

      <Suspense fallback={<div className="h-48" />}>
        <selected.Component onPlay={onPlay} />
      </Suspense>
    </div>
  );
}
