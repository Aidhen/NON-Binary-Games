'use client';
import type { DifficultyLevel } from '@nbg/shared';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface GameToolbarProps {
  difficulty: DifficultyLevel;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

/** The row above the board of every game: the level being played, and the button that opens and closes its settings. */
export function GameToolbar({ difficulty, isSettingsOpen, onToggleSettings }: Readonly<GameToolbarProps>) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex justify-between items-center">
      {/* A label, not a button: only the settings are pressed. */}
      <p className="text-sm font-bold uppercase tracking-wider text-[var(--subtitle-text)]">
        {t('sudoku.mode')}: {t(`sudoku.${difficulty}`)}
      </p>
      <button
        onClick={onToggleSettings}
        aria-expanded={isSettingsOpen}
        className="cursor-pointer rounded-full bg-[var(--paper)] px-4 py-1.5 text-[var(--subtitle-text)] hover:text-[var(--title-text)] text-sm font-bold uppercase shadow-[var(--shadow-paper-sm)] transition-colors"
      >
        {isSettingsOpen ? t('sudoku.closeSettings') : t('sudoku.settings')}
      </button>
    </div>
  );
}
