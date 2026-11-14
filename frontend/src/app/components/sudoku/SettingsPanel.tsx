'use client';
import { GameSettings } from './SudokuContainer';
import { DIFFICULTIES, DifficultyLevel } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface SettingsPanelProps {
  settings: GameSettings;
  onToggle: (key: keyof GameSettings) => void;
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
}

export function SettingsPanel({
  settings,
  onToggle,
  currentDifficulty,
  onDifficultyChange
}: SettingsPanelProps) {

  const { t } = useTranslation();

  return (
    <div className={cn(
      "w-full p-5 mb-2 flex flex-col gap-6 rounded-[var(--radius-paper)]",
      "bg-[var(--paper)] shadow-[var(--shadow-paper)]"
    )}>
      <div className="flex flex-col gap-2">
        <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide">
          {t('sudoku.newGame')}
        </span>
        {/* Five levels on two rows: the first two take 3 of 6 columns, the other three 2. "Principiante" is the longest name and
            needs the wider cell: measured, it does not fit in a third of the panel at 320 px. */}
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

      <div className="flex flex-col gap-3">
        <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide mb-1">
          {t('sudoku.visualHelpers')}
        </span>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[var(--title-text)] font-medium text-sm group-hover:opacity-80 transition-opacity">
            {t('sudoku.highlightCrosshairs')}
          </span>
          <input
            type="checkbox"
            checked={settings.highlightCrosshairs}
            onChange={() => onToggle('highlightCrosshairs')}
            className="w-4 h-4 cursor-pointer accent-[var(--number-player)]"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[var(--title-text)] font-medium text-sm group-hover:opacity-80 transition-opacity">
            {t('sudoku.highlightSame')}
          </span>
          <input
            type="checkbox"
            checked={settings.highlightSameNumbers}
            onChange={() => onToggle('highlightSameNumbers')}
            className="w-4 h-4 cursor-pointer accent-[var(--number-player)]"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[var(--title-text)] font-medium text-sm group-hover:opacity-80 transition-opacity">
            {t('sudoku.showErrors')}
          </span>
          <input
            type="checkbox"
            checked={settings.showErrors}
            onChange={() => onToggle('showErrors')}
            className="w-4 h-4 cursor-pointer accent-[var(--number-player)]"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-[var(--title-text)] font-medium text-sm group-hover:opacity-80 transition-opacity">
            {t('sudoku.godMode')}
          </span>
          <input
            type="checkbox"
            checked={settings.godMode}
            onChange={() => onToggle('godMode')}
            className="w-4 h-4 cursor-pointer accent-[var(--number-player)]"
          />
        </label>
      </div>

    </div>
  );
}