'use client';
import { GameSettings, DifficultyLevel } from './SudokuContainer';
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

    const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

    return (
        <div className={cn(
            "w-full p-4 mb-2 flex flex-col gap-6 rounded-lg shadow-lg",
            "bg-[var(--cell-background)] border-2 border-[var(--grid-border-inner)]"
        )}>
            <div className="flex flex-col gap-2">
                <span className="text-[var(--title-text)] font-black text-sm uppercase tracking-wide">
                    {t('sudoku.newGame')}
                </span>
                <div className="grid grid-cols-3 gap-2">
                    {difficulties.map((level) => {
                        const isActive = currentDifficulty === level;
                        return (
                            <button
                                key={level}
                                onClick={() => onDifficultyChange(level)}
                                className={cn(
                                    "py-2 text-sm font-bold capitalize rounded-md transition-colors",
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
            </div>

        </div>
    );
}