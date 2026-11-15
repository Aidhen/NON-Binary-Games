'use client';
import type { DifficultyLevel } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { DifficultyPicker } from '../play/DifficultyPicker';
import { SettingToggle } from '../play/SettingToggle';

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
      <DifficultyPicker currentDifficulty={currentDifficulty} onDifficultyChange={onDifficultyChange} />

      <hr className="border-[var(--grid-border-inner)]" />

      <div className="flex flex-col gap-1">
        <SettingToggle label={t('flowerField.explosive')} checked={explosive} onChange={onToggleExplosive} disabled={!canChangeExplosive} />
        {!canChangeExplosive && <p className="text-xs text-[var(--subtitle-text)]">{t('flowerField.explosiveLocked')}</p>}
      </div>
    </div>
  );
}
