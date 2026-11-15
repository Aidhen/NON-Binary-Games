'use client';
import { GameSettings } from './SudokuContainer';
import type { DifficultyLevel } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { DifficultyPicker } from '../play/DifficultyPicker';
import { SettingToggle } from '../play/SettingToggle';

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
}: Readonly<SettingsPanelProps>) {

  const { t } = useTranslation();

  return (
    <div className={cn(
      "w-full p-5 mb-2 flex flex-col gap-6 rounded-[var(--radius-paper)]",
      "bg-[var(--paper)] shadow-[var(--shadow-paper)]"
    )}>
      <DifficultyPicker currentDifficulty={currentDifficulty} onDifficultyChange={onDifficultyChange} />

      <hr className="border-[var(--grid-border-inner)]" />

      <div className="flex flex-col gap-3">
        <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide mb-1">
          {t('sudoku.visualHelpers')}
        </span>
        <SettingToggle label={t('sudoku.highlightCrosshairs')} checked={settings.highlightCrosshairs} onChange={() => onToggle('highlightCrosshairs')} />
        <SettingToggle label={t('sudoku.highlightSame')} checked={settings.highlightSameNumbers} onChange={() => onToggle('highlightSameNumbers')} />
        <SettingToggle label={t('sudoku.showErrors')} checked={settings.showErrors} onChange={() => onToggle('showErrors')} />
        <SettingToggle label={t('sudoku.godMode')} checked={settings.godMode} onChange={() => onToggle('godMode')} />
      </div>

    </div>
  );
}