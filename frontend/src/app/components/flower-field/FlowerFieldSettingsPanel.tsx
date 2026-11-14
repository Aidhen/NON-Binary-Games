'use client';
import { DIFFICULTIES } from '@nbg/shared';
import type { DifficultyLevel } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface FlowerFieldSettingsPanelProps {
  explosive: boolean;
  /** The option can only change while no cell is open: after that it changes with a new game. */
  canChangeExplosive: boolean;
  onToggleExplosive: () => void;
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
}

export function FlowerFieldSettingsPanel({ explosive, canChangeExplosive, onToggleExplosive, currentDifficulty, onDifficultyChange }: Readonly<FlowerFieldSettingsPanelProps>) {
  const { t } = useTranslation();

  return (
    <div className={cn("w-full p-5 mb-2 flex flex-col gap-6 rounded-[var(--radius-paper)]", "bg-[var(--paper)] shadow-[var(--shadow-paper)]")}>
      <div className="flex flex-col gap-2">
        <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide">
          {t('sudoku.newGame')}
        </span>
        {/* The same layout as the other games: the first two levels have the longer names. */}
        <div className="grid grid-cols-6 gap-2">
          {DIFFICULTIES.map((level, index) => {
            const isActive = currentDifficulty === level;
            return (
              <button
                key={level}
                aria-pressed={isActive}
                onClick={() => onDifficultyChange(level)}
                className={cn(
                  index < 2 ? "col-span-3" : "col-span-2",
                  "py-2 text-sm font-bold capitalize rounded-[var(--radius-control)] transition-colors",
                  isActive
                    ? "bg-[var(--number-player)] text-[var(--cell-background)]"
                    : "bg-[var(--numpad-background)] text-[var(--numpad-text)] hover:bg-[var(--numpad-hover)]"
                )}
              >
                {t(`sudoku.${level}`)}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-[var(--grid-border-inner)]" />

      <div className="flex flex-col gap-1">
        <label className={cn("flex items-center justify-between group", canChangeExplosive ? "cursor-pointer" : "cursor-not-allowed opacity-60")}>
          <span className="text-[var(--title-text)] font-medium text-sm group-hover:opacity-80 transition-opacity">
            {t('flowerField.explosive')}
          </span>
          <input
            type="checkbox"
            checked={explosive}
            disabled={!canChangeExplosive}
            onChange={onToggleExplosive}
            className="w-4 h-4 cursor-pointer accent-[var(--number-player)] disabled:cursor-not-allowed"
          />
        </label>
        {!canChangeExplosive && <p className="text-xs text-[var(--subtitle-text)]">{t('flowerField.explosiveLocked')}</p>}
      </div>
    </div>
  );
}
