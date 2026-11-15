'use client';
import { DIFFICULTIES } from '@nbg/shared';
import type { DifficultyLevel } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { optionClass } from './optionClass';

interface DifficultyPickerProps {
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
}

/** The levels a new game can start at: every game has the same five, so its settings start with this. */
export function DifficultyPicker({ currentDifficulty, onDifficultyChange }: Readonly<DifficultyPickerProps>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide">
        {t('sudoku.newGame')}
      </span>
      {/* Five levels on two rows: the first two take 3 of 6 columns, the other three 2. "Principiante" is the longest name and
          needs the wider cell: measured, it does not fit in a third of the panel at 320 px. */}
      <div className="grid grid-cols-6 gap-2">
        {DIFFICULTIES.map((level, index) => (
          <button
            key={level}
            aria-pressed={currentDifficulty === level}
            onClick={() => onDifficultyChange(level)}
            className={cn(index < 2 ? "col-span-3" : "col-span-2", "capitalize", optionClass(currentDifficulty === level))}
          >
            {t(`sudoku.${level}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
