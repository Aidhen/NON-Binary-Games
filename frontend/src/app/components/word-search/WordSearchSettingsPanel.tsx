'use client';
import { WORD_LANGUAGES } from '@nbg/shared';
import type { DifficultyLevel, WordLanguage } from '@nbg/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { DifficultyPicker } from '../play/DifficultyPicker';
import { optionClass } from '../play/optionClass';

interface WordSearchSettingsPanelProps {
  currentDifficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  currentLanguage: WordLanguage;
  onLanguageChange: (language: WordLanguage) => void;
}

/** Each language is written in itself, so that anybody finds theirs whatever the language of the page. */
const LANGUAGE_NAMES: Record<WordLanguage, string> = { en: 'English', it: 'Italiano' };

export function WordSearchSettingsPanel({ currentDifficulty, onDifficultyChange, currentLanguage, onLanguageChange }: Readonly<WordSearchSettingsPanelProps>) {
  const { t } = useTranslation();

  return (
    <div className={cn("w-full p-5 mb-2 flex flex-col gap-6 rounded-[var(--radius-paper)]", "bg-[var(--paper)] shadow-[var(--shadow-paper)]")}>
      <DifficultyPicker currentDifficulty={currentDifficulty} onDifficultyChange={onDifficultyChange} />

      <hr className="border-[var(--grid-border-inner)]" />

      <div className="flex flex-col gap-2">
        <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide">
          {t('wordSearch.language')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {WORD_LANGUAGES.map((language) => (
            <button
              key={language}
              lang={language}
              aria-pressed={currentLanguage === language}
              onClick={() => onLanguageChange(language)}
              className={optionClass(currentLanguage === language)}
            >
              {LANGUAGE_NAMES[language]}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--subtitle-text)]">{t('wordSearch.languageHint')}</p>
      </div>
    </div>
  );
}
