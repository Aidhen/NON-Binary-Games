'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { readStorage, writeStorage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import type { MiniGameProps } from './types';

export const GARDEN_STORAGE_KEY = 'nbg:garden';
export const BLOOM_AT = 30;

const FLOWERS = ['🌷', '🌸', '🌻', '🌼', '🌺'];

const STAGES = [
  { from: 0, emoji: '🌰', messageKey: 'minigames.garden.seed' },
  { from: 5, emoji: '🌱', messageKey: 'minigames.garden.sprout' },
  { from: 15, emoji: '🌿', messageKey: 'minigames.garden.leaves' },
];

interface GardenState {
  water: number;
  flowers: number;
}

const getStage = ({ water, flowers }: GardenState) => {
  if (water >= BLOOM_AT) return { emoji: FLOWERS[flowers % FLOWERS.length], messageKey: 'minigames.garden.bloom' };
  return STAGES.findLast((stage) => water >= stage.from)!;
};

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

const loadGarden = (): GardenState | null => {
  try {
    const saved = JSON.parse(readStorage(GARDEN_STORAGE_KEY) ?? 'null');
    if (isCount(saved?.water) && isCount(saved?.flowers) && saved.water <= BLOOM_AT) {
      return { water: saved.water, flowers: saved.flowers };
    }
  } catch {
    // Corrupted value: start from a fresh seed.
  }
  return null;
};

export function Garden({ onPlay }: MiniGameProps) {
  const { t } = useTranslation();
  const [garden, setGarden] = useState<GardenState>({ water: 0, flowers: 0 });
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const saved = loadGarden();
    if (saved) setGarden(saved);
  }, []);

  const hasBloomed = garden.water >= BLOOM_AT;
  const stage = getStage(garden);

  const handleClick = () => {
    const next = hasBloomed
      ? { water: 0, flowers: garden.flowers + 1 }
      : { water: garden.water + 1, flowers: garden.flowers };

    setGarden(next);
    setClicks((current) => current + 1);
    writeStorage(GARDEN_STORAGE_KEY, JSON.stringify(next));
    onPlay?.();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-28 w-28 items-center justify-center" aria-hidden="true">
        <span key={clicks} className="text-7xl motion-safe:animate-pop">{stage.emoji}</span>
        {clicks > 0 && !hasBloomed && (
          <span key={`drop-${clicks}`} className="absolute top-0 text-2xl motion-safe:animate-drop">💧</span>
        )}
      </div>

      <p role="status" className="text-center text-sm font-medium text-[var(--subtitle-text)]">
        {t(stage.messageKey)}
      </p>

      <button
        onClick={handleClick}
        className={cn(
          "px-6 py-3 rounded-lg font-bold transition-all duration-200",
          "bg-[var(--numpad-background)] text-[var(--numpad-text)]",
          "hover:bg-[var(--numpad-hover)] active:bg-[var(--numpad-active)] active:scale-95"
        )}
      >
        {hasBloomed ? t('minigames.garden.plantSeed') : t('minigames.garden.water')}
      </button>

      <p className="text-xs font-medium uppercase tracking-wider text-[var(--subtitle-text)]">
        {t('minigames.garden.flowers')}: {garden.flowers}
      </p>
    </div>
  );
}
