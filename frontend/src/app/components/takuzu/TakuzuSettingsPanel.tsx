'use client';
import type { DifficultyLevel } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { DifficultyPicker } from '../play/DifficultyPicker';
import { SettingToggle } from '../play/SettingToggle';

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
      <DifficultyPicker currentDifficulty={currentDifficulty} onDifficultyChange={onDifficultyChange} />

      <hr className="border-[var(--grid-border-inner)]" />

      <SettingToggle label={t('takuzu.showErrors')} checked={showErrors} onChange={onToggleErrors} />
    </div>
  );
}
