'use client'; 

import { SudokuContainer } from './components/sudoku/SudokuContainer';
import { ThemeSelector } from "./components/ui/ThemeSelector";
import { LanguageSelector } from "./components/ui/LanguageSelector";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n/TranslationContext';

export default function Home() {
    const { t } = useTranslation();

    return (
        <main className={cn(
            "min-h-screen flex flex-col items-center justify-center",
            "p-4 sm:p-8 transition-colors duration-300"
        )}>
            <div className="w-full max-w-lg space-y-8 relative">

                <div className="flex justify-between items-center w-full">
                    <ThemeSelector />
                    <LanguageSelector />
                </div>

                <header className="text-center">
                    <h1 className={cn(
                        "text-4xl font-black tracking-tight",
                        "text-[var(--title-text)] transition-colors duration-300"
                    )}>
                        {t('sudoku.title')}
                    </h1>
                    <p className={cn(
                        "mt-2 font-medium",
                        "text-[var(--subtitle-text)] transition-colors duration-300"
                    )}>
                        {t('sudoku.subtitle')}
                    </p>
                </header>

                <SudokuContainer />
            </div>
        </main>
    );
}