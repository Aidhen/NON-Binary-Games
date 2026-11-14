'use client';
import { DIFFICULTIES } from '@nbg/shared';
import type { DifficultyLevel } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface TakuzuSettingsPanelProps {
  showErrors: boolean;
  onToggleErrors: () => void;
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
}

export function TakuzuSettingsPanel({ showErrors, onToggleErrors, currentDifficulty, onDifficultyChange }: Readonly<TakuzuSettingsPanelProps>) {
  const { t } = useTranslation();

  return (
    <div className={cn("w-full p-5 mb-2 flex flex-col gap-6 rounded-[var(--radius-paper)]", "bg-[var(--paper)] shadow-[var(--shadow-paper)]")}>
      <div className="flex flex-col gap-2">
        <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide">
          {t('sudoku.newGame')}
        </span>
        {/* The same layout as the Sudoku: the first two levels have the longer names. */}
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

      <label className="flex items-center justify-between cursor-pointer group">
        <span className="text-[var(--title-text)] font-medium text-sm group-hover:opacity-80 transition-opacity">
          {t('takuzu.showErrors')}
        </span>
        <input type="checkbox" checked={showErrors} onChange={onToggleErrors} className="w-4 h-4 cursor-pointer accent-[var(--number-player)]" />
      </label>
    </div>
  );
}
