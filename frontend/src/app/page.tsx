'use client';

import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n/TranslationContext';

export default function Home() {
    const { t } = useTranslation();
    const router = useRouter();

    const createNewGame = () => {
        const roomId = crypto.randomUUID();
        router.push(`/play/${roomId}`);
    };

    return (
        <div className="w-full max-w-lg space-y-12 relative p-4 sm:p-8">
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

            <div className="flex justify-center">
                <button
                    onClick={createNewGame}
                    className={cn(
                        "px-8 py-4 text-xl font-bold rounded-xl",
                        "bg-[var(--cell-background-highlight)] hover:bg-[var(--cell-background-selected)]",
                        "text-[var(--number-player)] transition-all shadow-lg",
                        "border-2 border-[var(--grid-border-outer)]"
                    )}
                >
                    {t('sudoku.startNewGame')}
                </button>
            </div>
        </div>
    );
}